import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { PrismaService } from '../prisma/prisma.service';
import { UsuarioAutenticado } from '../decorators/usuario-actual.decorator';

const METODOS_AUDITADOS = new Set(['POST', 'PATCH', 'PUT', 'DELETE']);
const RUTAS_EXCLUIDAS = [/\/auth\/login$/, /\/auth\/refresh$/, /\/auth\/logout$/];

/**
 * Registro de auditoría de toda mutación exitosa (doc 06 §5, RF13, RNF10).
 *
 * Se escribe **después** de responder y de forma asíncrona; si la auditoría
 * falla, la operación de negocio ya quedó confirmada (no se pierde la acción
 * del usuario, se registra el incidente).
 */
@Injectable()
export class AuditoriaInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditoriaInterceptor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') {
      return next.handle();
    }
    const request = context.switchToHttp().getRequest();
    const metodo: string = request.method;
    const ruta: string = request.route?.path ?? request.url;

    if (!METODOS_AUDITADOS.has(metodo) || RUTAS_EXCLUIDAS.some((re) => re.test(String(request.url).split('?')[0]))) {
      return next.handle();
    }

    return next.handle().pipe(
      tap(() => {
        const usuario = request.user as UsuarioAutenticado | undefined;
        const dispositivo = request['dispositivo'];
        // La entidad es el primer segmento de la ruta **después** del prefijo
        // global (`api/v1/reglas` → `reglas`), no el segundo segmento de la URL.
        const entidad = primerSegmento(ruta, this.config.get<string>('API_PREFIX') ?? 'api/v1');
        const entidadId = request.params?.id ?? null;
        const accion = `${metodo} ${ruta}`.slice(0, 40);
        const ip = (request.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ?? request.ip;

        void this.prisma.auditoria
          .create({
            data: {
              usuarioId: usuario?.id ?? null,
              accion,
              entidad: entidad ? entidad.slice(0, 40) : null,
              entidadId: entidadId ? String(entidadId).slice(0, 64) : dispositivo?.codigo ?? null,
              ip: normalizarIp(ip),
              datosDespues: { rol: usuario?.rol ?? 'DISPOSITIVO', estado: 'exitoso' } as never,
            },
          })
          .catch((e) => this.logger.warn(`No se pudo auditar ${accion}: ${e instanceof Error ? e.message : e}`));
      }),
    );
  }
}

function normalizarIp(ip?: string): string | null {
  if (!ip) return null;
  const limpia = ip.replace(/^::ffff:/, '');
  return /^[0-9a-f:.]+$/i.test(limpia) ? limpia : null;
}

/** Primer segmento de la ruta **después** del prefijo global (`api/v1/reglas` → `reglas`). */
export function primerSegmento(ruta: string, prefijo: string): string | null {
  const partes = `/${ruta}`.replace(/\/{2,}/g, '/').split('/').filter(Boolean);
  const prefijoPartes = prefijo.split('/').filter(Boolean);
  const coincide = partes.slice(0, prefijoPartes.length).join('/') === prefijoPartes.join('/');
  return partes[coincide ? prefijoPartes.length : 0] ?? null;
}
