import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

/** Dispositivo autenticado por API key, adjunto a la petición. */
export interface DispositivoAutenticado {
  id: string;
  codigo: string;
  sistemaId: string;
  intervaloReporteSeg: number;
}

export const DISPOSITIVO_REQUEST_KEY = 'dispositivo';

/**
 * Autenticación de máquina (doc 06 §2.3, RF14).
 *
 * Cabeceras:
 *   - `X-Device-Key`: `ak_live_<secreto>` (se compara con el hash bcrypt + pepper).
 *   - `X-Device-Code`: código del dispositivo (`DEV-01`), necesario porque en
 *     la base solo se guarda el hash — no el valor — de la credencial.
 *
 * Denegar por defecto: cualquier dispositivo inexistente o inactivo, o cuya
 * clave no coincida, recibe `401` sin distinguir la causa.
 */
@Injectable()
export class DispositivoGuard implements CanActivate {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const apiKey: string | undefined = request.headers['x-device-key'];
    const codigo: string | undefined = request.headers['x-device-code'];

    if (!apiKey || !codigo) {
      throw new UnauthorizedException('Credencial de dispositivo ausente');
    }
    if (!apiKey.startsWith('ak_live_')) {
      throw new UnauthorizedException('Credencial de dispositivo inválida');
    }

    const dispositivo = await this.prisma.dispositivo.findUnique({
      where: { codigo },
      include: { sistema: { select: { estado: true } } },
    });
    if (!dispositivo || !dispositivo.activo) {
      throw new UnauthorizedException('Credencial de dispositivo inválida');
    }

    const pepper = this.config.get<string>('DEVICE_KEY_PEPPER') ?? '';
    const coincide = await bcrypt.compare(apiKey + pepper, dispositivo.apiKeyHash);
    if (!coincide) {
      throw new UnauthorizedException('Credencial de dispositivo inválida');
    }

    // Un sistema dado de baja (borrado lógico) no admite ingesta: sus dispositivos
    // no deben seguir generando mediciones ni alertas. Se comprueba tras validar la
    // clave para no revelar el estado a quien no se autenticó. Es reversible: al
    // reactivar el sistema, sus dispositivos vuelven a reportar sin tocar nada más.
    if (dispositivo.sistema.estado === 'INACTIVO') {
      throw new ForbiddenException('El sistema del dispositivo está inactivo');
    }

    const autenticado: DispositivoAutenticado = {
      id: dispositivo.id,
      codigo: dispositivo.codigo,
      sistemaId: dispositivo.sistemaId,
      intervaloReporteSeg: dispositivo.intervaloReporteSeg,
    };
    request[DISPOSITIVO_REQUEST_KEY] = autenticado;
    return true;
  }
}
