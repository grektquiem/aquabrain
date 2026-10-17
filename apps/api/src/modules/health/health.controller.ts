import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../../common/prisma/prisma.service';
import { Publico } from '../../common/decorators/publico.decorator';

/** Sonda de vida (liveness/readiness). Única ruta pública con `login` y `refresh`. */
@ApiTags('Salud')
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Publico()
  @Get()
  @ApiOperation({ summary: 'Estado del servicio y de la base de datos' })
  async health() {
    const inicio = Date.now();
    let baseDatos = 'desconocida';
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      baseDatos = 'ok';
    } catch {
      baseDatos = 'sin conexión';
    }
    return {
      estado: baseDatos === 'ok' ? 'ok' : 'degradado',
      version: process.env.npm_package_version ?? '1.0.0',
      entorno: process.env.NODE_ENV ?? 'development',
      baseDatos,
      latenciaMs: Date.now() - inicio,
      uptimeSeg: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    };
  }
}
