import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { calcularFrescura, Frescura, umbralSilencio } from './frescura';

/**
 * Estado agregado del tablero (RF07, HU02).
 *
 * La "frescura" se calcula en vivo: un dispositivo queda SIN_COMUNICACION
 * cuando pasan más de `ALERT_SILENCE_FACTOR × intervalo_reporte` segundos desde
 * su última medición (detección de silencio del gateway, RN-10).
 */
@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async estado(sistemaId?: string) {
    // Los sistemas dados de baja (borrado lógico) no aparecen en el tablero: sus
    // dispositivos ya no reportan y figurarían como SIN_COMUNICACION.
    const sistemaVigente = { estado: { not: 'INACTIVO' } } satisfies Prisma.SistemaWhereInput;
    const [dispositivos, ultimos, sensores, alertas] = await Promise.all([
      this.prisma.dispositivo.findMany({
        where: { ...(sistemaId ? { sistemaId } : {}), activo: true, sistema: sistemaVigente },
        select: {
          id: true,
          codigo: true,
          firmware: true,
          intervaloReporteSeg: true,
          estadoConexion: true,
          sistema: { select: { id: true, codigo: true, nombre: true } },
          _count: { select: { sensores: true } },
        },
        orderBy: { codigo: 'asc' },
      }),
      this.prisma.$queryRaw<Array<{ dispositivoId: string; ultimo: Date | null }>>(Prisma.sql`
        SELECT dispositivo_id AS "dispositivoId", MAX(timestamp) AS "ultimo"
        FROM medicion
        GROUP BY dispositivo_id
      `),
      this.prisma.estadoSensorActual.findMany({
        where: { dispositivo: { ...(sistemaId ? { sistemaId } : {}), sistema: sistemaVigente } },
        select: {
          sensorId: true,
          valor: true,
          valorTexto: true,
          unidad: true,
          timestamp: true,
          sensor: { select: { codigo: true, nombre: true } },
          dispositivo: { select: { id: true, codigo: true } },
        },
        orderBy: { sensor: { codigo: 'asc' } },
      }),
      this.prisma.alerta.groupBy({
        by: ['severidad'],
        where: { estado: 'ACTIVA', ...(sistemaId ? { sistemaId } : {}), sistema: sistemaVigente },
        _count: { _all: true },
      }),
    ]);

    const factor = Number(this.config.get('ALERT_SILENCE_FACTOR') ?? 3);
    const mapaUltimos = new Map(ultimos.map((u) => [u.dispositivoId, u.ultimo]));
    const ahora = Date.now();

    return {
      generadoEn: new Date().toISOString(),
      dispositivos: dispositivos.map((d) => {
        const ultimo = mapaUltimos.get(d.id) ?? null;
        const segundosSinReportar = ultimo ? Math.floor((ahora - ultimo.getTime()) / 1000) : null;
        const frescura: Frescura = calcularFrescura(segundosSinReportar, d.intervaloReporteSeg, factor);
        return {
          id: d.id,
          codigo: d.codigo,
          firmware: d.firmware,
          sistema: d.sistema,
          sensores: d._count.sensores,
          intervaloReporteSeg: d.intervaloReporteSeg,
          estadoAlmacenado: d.estadoConexion,
          frescura,
          ultimaMedicion: ultimo,
          segundosSinReportar,
          umbralSilencioSeg: umbralSilencio(d.intervaloReporteSeg, factor),
        };
      }),
      sensores,
      alertasActivas: alertas.map((a) => ({ severidad: a.severidad, total: a._count._all })),
    };
  }
}
