import { BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OrigenMedicion, Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { DispositivoAutenticado } from '../../common/guards/dispositivo.guard';
import { parseDuracion } from '../../common/utils/tiempo';
import { MotorAlertasService } from '../alertas/motor-alertas.service';
import { calcularCalidad } from '../dashboard/frescura';
import { BulkMedicionesDto, ConsultarSerieDto, CrearMedicionDto } from './dto/medicion.dto';

const MAX_DIAS_CONSULTA = 90;

interface FilaSerie {
  sensorId: string;
  bucket: Date;
  promedio: number;
  minimo: number;
  maximo: number;
  muestras: number;
}

/** Sensor ya validado como propio del dispositivo que reporta. */
type SensorResuelto = Prisma.SensorGetPayload<{ include: { dispositivo: { select: { sistemaId: true } } } }>;

/** Último valor por sensor acumulado durante un lote, para escribirlo una sola vez. */
interface EstadoPendiente {
  sensorId: string;
  unidad: string;
  dto: CrearMedicionDto;
  timestamp: Date;
}

/** Lectura del lote ya validada y con el sensor resuelto (R-01). */
interface LecturaValida {
  sensor: SensorResuelto;
  timestamp: Date;
  valor?: number;
  valorTexto?: string;
  unidad: string;
  idExterno?: string;
  origen: OrigenMedicion;
  calidad: 'OK' | 'SOSPECHOSA';
  dto: CrearMedicionDto;
}

@Injectable()
export class MedicionesService {
  private readonly logger = new Logger(MedicionesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly motor: MotorAlertasService,
    private readonly config: ConfigService,
  ) {}

  // ------------------------------------------------------------------
  // Ingesta (identidad de dispositivo)
  // ------------------------------------------------------------------

  /** `POST /mediciones` — valida, persiste y evalúa reglas (doc 06 §3.4). */
  async ingerir(dispositivo: DispositivoAutenticado, dto: CrearMedicionDto) {
    const timestamp = this.validarTimestamp(dto.timestamp);
    const sensor = await this.resolverSensor(dispositivo.id, dto);

    if (dto.idExterno && (await this.buscarIdempotencia(dispositivo.id, dto.idExterno))) {
      return { duplicada: true as const, idExterno: dto.idExterno, mensaje: 'La medición ya había sido registrada' };
    }

    const medicion = await this.prisma.$transaction(async (tx) => {
      if (dto.idExterno) {
        await tx.medicionIdempotencia.create({
          data: { dispositivoId: dispositivo.id, idExterno: dto.idExterno, sensorId: sensor.id },
        });
      }
      return tx.medicion.create({
        data: {
          sensorId: sensor.id,
          dispositivoId: dispositivo.id,
          valor: dto.valor !== undefined ? new Prisma.Decimal(dto.valor) : null,
          valorTexto: dto.valorTexto ?? null,
          unidad: (dto.unidad ?? sensor.unidad).slice(0, 20),
          timestamp,
          idExterno: dto.idExterno ?? null,
          origen: dto.origen ?? this.inferirOrigen(timestamp),
          calidad: calcularCalidad(
            dto.valor,
            sensor.rangoMin ? Number(sensor.rangoMin) : null,
            sensor.rangoMax ? Number(sensor.rangoMax) : null,
          ),
        },
      });
    });

    await this.actualizarEstado(sensor.id, dispositivo.id, dto, medicion.unidad, timestamp);
    const alertas = await this.evaluarReglasDe(sensor, medicion.id, dto.valor ?? null, timestamp);

    return {
      duplicada: false as const,
      id: medicion.id.toString(),
      sensorId: sensor.id,
      sensorCodigo: sensor.codigo,
      valor: dto.valor ?? null,
      timestamp,
      alertasGeneradas: alertas,
    };
  }

  /**
   * `POST /mediciones/bulk` — hasta 500 lecturas; idempotente por `idExterno`
   * (HU10).
   *
   * R-01: la ingesta se hace por fases para no pagar ~4 viajes a la base de
   * datos por lectura (que era el cuello de botella de TS-43):
   *  1. validación en memoria (solo se consultan los sensores, una vez cada uno);
   *  2. idempotencia en una consulta (`IN`) + deduplicación intra-lote;
   *  3. inserción masiva (`createManyAndReturn`) + marcadores en una transacción;
   *  4. reglas en una consulta para todo el lote y consolidación del estado.
   */
  async ingerirBulk(dispositivo: DispositivoAutenticado, dto: BulkMedicionesDto) {
    const detalleRechazos: Array<{ indice: number; motivo: string }> = [];
    const cache = new Map<string, SensorResuelto>();

    const validas: LecturaValida[] = [];
    for (let i = 0; i < dto.items.length; i++) {
      const item = dto.items[i];
      try {
        const timestamp = this.validarTimestamp(item.timestamp);
        const sensor = await this.resolverSensor(dispositivo.id, item, cache);
        validas.push({
          sensor,
          timestamp,
          valor: item.valor,
          valorTexto: item.valorTexto,
          unidad: (item.unidad ?? sensor.unidad).slice(0, 20),
          idExterno: item.idExterno,
          origen: item.origen ?? this.inferirOrigen(timestamp),
          calidad: calcularCalidad(
            item.valor,
            sensor.rangoMin ? Number(sensor.rangoMin) : null,
            sensor.rangoMax ? Number(sensor.rangoMax) : null,
          ),
          dto: item,
        });
      } catch (error) {
        detalleRechazos.push({ indice: i, motivo: error instanceof Error ? error.message : 'error' });
      }
    }

    const idExternos = [...new Set(validas.map((v) => v.idExterno).filter((x): x is string => Boolean(x)))];
    const existentes = idExternos.length
      ? await this.prisma.medicionIdempotencia.findMany({
          where: { dispositivoId: dispositivo.id, idExterno: { in: idExternos } },
          select: { idExterno: true },
        })
      : [];
    const yaEnBd = new Set(existentes.map((e) => e.idExterno));
    const vistos = new Set<string>();
    const aInsertar: LecturaValida[] = [];
    let duplicadas = 0;
    for (const v of validas) {
      if (v.idExterno) {
        if (yaEnBd.has(v.idExterno) || vistos.has(v.idExterno)) {
          duplicadas++;
          continue;
        }
        vistos.add(v.idExterno);
      }
      aInsertar.push(v);
    }

    const ids = aInsertar.length > 0 ? await this.insertarLote(dispositivo.id, aInsertar) : [];

    const reglasPorSensor = await this.motor.cargarReglasPara(
      aInsertar.map((v) => ({ id: v.sensor.id, tipoVariableId: v.sensor.tipoVariableId })),
    );
    let alertasGeneradas = 0;
    const estadoDiferido = new Map<string, EstadoPendiente>();
    for (let i = 0; i < aInsertar.length; i++) {
      const v = aInsertar[i];
      const alertas = await this.motor.evaluarConReglas(
        v.sensor,
        { id: ids[i], valor: v.valor ?? null, timestamp: v.timestamp },
        reglasPorSensor.get(v.sensor.id) ?? [],
      );
      alertasGeneradas += alertas.length;

      const previo = estadoDiferido.get(v.sensor.id);
      if (!previo || v.timestamp >= previo.timestamp) {
        estadoDiferido.set(v.sensor.id, { sensorId: v.sensor.id, unidad: v.unidad, dto: v.dto, timestamp: v.timestamp });
      }
    }

    await this.volcarEstado(dispositivo.id, estadoDiferido);

    return {
      recibidas: dto.items.length,
      aceptadas: aInsertar.length,
      duplicadas,
      rechazadas: detalleRechazos.length,
      muestraRechazos: detalleRechazos.slice(0, 20),
      alertasGeneradas,
    };
  }

  /**
   * Inserta el lote de lecturas y sus marcadores de idempotencia en una sola
   * transacción. Devuelve los `id` correlacionados **en el orden de entrada**.
   */
  private async insertarLote(dispositivoId: string, validas: LecturaValida[]): Promise<bigint[]> {
    const creadas = await this.prisma.$transaction(async (tx) => {
      const filas = await tx.medicion.createManyAndReturn({
        data: validas.map((v) => ({
          sensorId: v.sensor.id,
          dispositivoId,
          valor: v.valor !== undefined ? new Prisma.Decimal(v.valor) : null,
          valorTexto: v.valorTexto ?? null,
          unidad: v.unidad,
          timestamp: v.timestamp,
          idExterno: v.idExterno ?? null,
          origen: v.origen,
          calidad: v.calidad,
        })),
        select: { id: true },
      });

      const marcadores = validas
        .filter((v) => v.idExterno)
        .map((v) => ({ dispositivoId, idExterno: v.idExterno as string, sensorId: v.sensor.id }));
      if (marcadores.length > 0) {
        await tx.medicionIdempotencia.createMany({ data: marcadores });
      }
      return filas;
    });

    return creadas.map((f) => f.id).sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  }

  private async evaluarReglasDe(
    sensor: SensorResuelto,
    medicionId: bigint,
    valor: number | null,
    timestamp: Date,
  ) {
    return this.motor.evaluarMedicion(
      {
        id: sensor.id,
        tipoVariableId: sensor.tipoVariableId,
        dispositivo: { sistemaId: sensor.dispositivo.sistemaId },
      },
      { id: medicionId, valor, timestamp },
    );
  }

  /** Consolida el último valor conocido por sensor tras un lote (TS-37). */
  private async volcarEstado(dispositivoId: string, pendientes: Map<string, EstadoPendiente>): Promise<void> {
    for (const p of pendientes.values()) {
      await this.actualizarEstado(p.sensorId, dispositivoId, p.dto, p.unidad, p.timestamp);
    }
  }

  private async actualizarEstado(
    sensorId: string,
    dispositivoId: string,
    dto: CrearMedicionDto,
    unidad: string,
    timestamp: Date,
  ): Promise<void> {
    const valor = dto.valor !== undefined ? new Prisma.Decimal(dto.valor) : null;
    await this.prisma.estadoSensorActual.upsert({
      where: { sensorId },
      update: { valor, valorTexto: dto.valorTexto ?? null, unidad, timestamp, actualizadoEn: new Date() },
      create: { sensorId, dispositivoId, valor, valorTexto: dto.valorTexto ?? null, unidad, timestamp },
    });
    await this.prisma.dispositivo.update({ where: { id: dispositivoId }, data: { estadoConexion: 'EN_LINEA' } });
  }

  private async resolverSensor(
    dispositivoId: string,
    dto: CrearMedicionDto,
    cache?: Map<string, SensorResuelto>,
  ): Promise<SensorResuelto> {
    if (!dto.sensorId && !dto.sensorCodigo) {
      throw new BadRequestException('Debe indicar `sensorId` o `sensorCodigo`');
    }
    const clave = dto.sensorId ?? `codigo:${dto.sensorCodigo}`;
    const guardado = cache?.get(clave);
    if (guardado) {
      return guardado;
    }

    const incluir = { dispositivo: { select: { sistemaId: true } } } as const;
    const sensor = dto.sensorId
      ? await this.prisma.sensor.findUnique({ where: { id: dto.sensorId }, include: incluir })
      : await this.prisma.sensor.findFirst({
          where: { codigo: dto.sensorCodigo, dispositivoId, activo: true },
          include: incluir,
        });

    if (!sensor || !sensor.activo) {
      throw new NotFoundException('El sensor no existe o está inactivo');
    }
    if (sensor.dispositivoId !== dispositivoId) {
      throw new ForbiddenException('El sensor no pertenece a este dispositivo');
    }

    cache?.set(clave, sensor);
    return sensor;
  }

  private validarTimestamp(valor: string): Date {
    const timestamp = new Date(valor);
    if (Number.isNaN(timestamp.getTime())) {
      throw new BadRequestException('timestamp inválido');
    }
    if (timestamp.getTime() > Date.now() + this.skewMs()) {
      throw new BadRequestException('El timestamp no puede estar en el futuro');
    }
    return timestamp;
  }

  private inferirOrigen(timestamp: Date): 'ONLINE' | 'OFFLINE' {
    return Date.now() - timestamp.getTime() > this.skewMs() ? 'OFFLINE' : 'ONLINE';
  }

  private skewMs(): number {
    return parseDuracion(this.config.get<string>('MAX_TIMESTAMP_SKEW') ?? '5m');
  }

  private async buscarIdempotencia(dispositivoId: string, idExterno: string): Promise<boolean> {
    const fila = await this.prisma.medicionIdempotencia.findUnique({
      where: { dispositivoId_idExterno: { dispositivoId, idExterno } },
      select: { idExterno: true },
    });
    return Boolean(fila);
  }

  // ------------------------------------------------------------------
  // Consulta (usuario autenticado)
  // ------------------------------------------------------------------

  /**
   * `GET /mediciones/serie` — serie agregada por bucket para gráficas (HU04).
   * Agrupa con `DATE_BIN` en la base y normaliza a float para que el frontend
   * no tenga que tocar `Decimal`.
   */
  async serie(consulta: ConsultarSerieDto): Promise<{
    bucket: string;
    totalPuntos: number;
    series: Array<{
      sensor: { id: string; codigo: string; nombre: string; unidad: string | null };
      puntos: Array<{ t: Date; promedio: number; minimo: number; maximo: number; muestras: number }>;
    }>;
  }> {
    const desde = new Date(consulta.desde);
    const hasta = new Date(consulta.hasta);
    if (Number.isNaN(desde.getTime()) || Number.isNaN(hasta.getTime())) {
      throw new BadRequestException('Fechas inválidas');
    }
    if (hasta <= desde) {
      throw new BadRequestException('`hasta` debe ser posterior a `desde`');
    }
    if ((hasta.getTime() - desde.getTime()) / 86_400_000 > MAX_DIAS_CONSULTA) {
      throw new UnprocessableEntityException(`La consulta no puede exceder ${MAX_DIAS_CONSULTA} días`);
    }
    if (!consulta.sensores || consulta.sensores.length === 0) {
      throw new BadRequestException('Debe indicar al menos un sensor');
    }

    // Mapeo explícito para evitar la ambigüedad de '5m'::interval (minutos vs meses).
    const bucketIntervalos: Record<string, string> = {
      '5m': '5 minutes',
      '15m': '15 minutes',
      '1h': '1 hour',
      '6h': '6 hours',
      '1d': '1 day',
    };
    const bucket = consulta.bucket ?? '1h';
    const intervalo = bucketIntervalos[bucket];
    if (!intervalo) {
      throw new BadRequestException('bucket inválido');
    }

    const sensoresMeta = await this.prisma.sensor.findMany({
      where: { id: { in: consulta.sensores } },
      select: { id: true, codigo: true, nombre: true, unidad: true },
    });
    if (sensoresMeta.length === 0) {
      return { bucket, totalPuntos: 0, series: [] };
    }

    const ids = sensoresMeta.map((s) => s.id);
    const filas = await this.prisma.$queryRaw<FilaSerie[]>(Prisma.sql`
      SELECT
        sensor_id                                                                         AS "sensorId",
        DATE_BIN(${intervalo}::interval, timestamp, TIMESTAMPTZ '2000-01-01 00:00:00+00') AS "bucket",
        AVG(valor)::float                                                                 AS "promedio",
        MIN(valor)::float                                                                 AS "minimo",
        MAX(valor)::float                                                                 AS "maximo",
        COUNT(*)::int                                                                     AS "muestras"
      FROM medicion
      WHERE sensor_id IN (${Prisma.join(ids.map((id) => Prisma.sql`${id}::uuid`))})
        AND timestamp >= ${desde}
        AND timestamp <= ${hasta}
        AND valor IS NOT NULL
      GROUP BY sensor_id, "bucket"
      ORDER BY sensor_id, "bucket"
    `);

    const porSensor = new Map<string, FilaSerie[]>();
    for (const fila of filas) {
      const lista = porSensor.get(fila.sensorId) ?? [];
      lista.push(fila);
      porSensor.set(fila.sensorId, lista);
    }

    const series = sensoresMeta.map((meta) => ({
      sensor: meta,
      puntos: (porSensor.get(meta.id) ?? []).map((f) => ({
        t: f.bucket,
        promedio: f.promedio,
        minimo: f.minimo,
        maximo: f.maximo,
        muestras: f.muestras,
      })),
    }));

    return {
      bucket,
      totalPuntos: filas.length,
      series,
    };
  }

  /** HU02 CA③ (TS-38): exportación CSV legible (Excel-friendly, hora Chile). */
  async exportarCsv(consulta: ConsultarSerieDto): Promise<string> {
    const desde = new Date(consulta.desde);
    const hasta = new Date(consulta.hasta);
    if (Number.isNaN(desde.getTime()) || Number.isNaN(hasta.getTime())) {
      throw new BadRequestException('Fechas inválidas');
    }
    if (hasta <= desde) {
      throw new BadRequestException('`hasta` debe ser posterior a `desde`');
    }
    if ((hasta.getTime() - desde.getTime()) / 86_400_000 > MAX_DIAS_CONSULTA) {
      throw new UnprocessableEntityException(`La exportación no puede exceder ${MAX_DIAS_CONSULTA} días`);
    }

    const filas = await this.prisma.medicion.findMany({
      where: { sensorId: { in: consulta.sensores }, timestamp: { gte: desde, lte: hasta } },
      select: {
        timestamp: true,
        valor: true,
        valorTexto: true,
        unidad: true,
        origen: true,
        calidad: true,
        sensor: { select: { codigo: true } },
      },
      orderBy: [{ sensorId: 'asc' }, { timestamp: 'asc' }],
      take: 50_000,
    });

    const cabecera = 'Sensor;Fecha y hora;Valor;Unidad;Origen;Calidad';
    const lineas = filas.map((f) => {
      const valor = f.valor != null
        ? Number(f.valor).toFixed(2).replace('.', ',')   // coma decimal para Excel ES
        : (f.valorTexto ?? '');
      return [
        f.sensor.codigo,
        formatearFechaChile(f.timestamp),                  // dd/mm/yyyy HH:mm:ss
        valor,
        f.unidad ?? '',
        f.origen,
        f.calidad,
      ].join(';');
    });

    // BOM UTF-8: Excel lo necesita para detectar la codificación sin problemas.
    return '\uFEFF' + 'sep=;\r\n' + [cabecera, ...lineas].join('\r\n');
  }

  /** Último valor conocido por sensor (`estado_sensor_actual`, I-12 · DN-05). */
  async ultimas(sistemaId?: string) {
    return this.prisma.estadoSensorActual.findMany({
      where: sistemaId ? { dispositivo: { sistemaId } } : {},
      select: {
        sensorId: true,
        valor: true,
        valorTexto: true,
        unidad: true,
        timestamp: true,
        actualizadoEn: true,
        sensor: { select: { codigo: true, nombre: true } },
        dispositivo: { select: { id: true, codigo: true, estadoConexion: true, sistema: { select: { id: true, nombre: true } } } },
      },
      orderBy: { timestamp: 'desc' },
    });
  }
}

/** Formatea un Date como `dd/mm/yyyy HH:mm:ss` en hora de Chile continental. */
function formatearFechaChile(fecha: Date): string {
  const partes = new Intl.DateTimeFormat('es-CL', {
    timeZone: 'America/Santiago',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(fecha);
  const get = (t: Intl.DateTimeFormatPartTypes) =>
    partes.find((p) => p.type === t)?.value ?? '';
  return `${get('day')}/${get('month')}/${get('year')} ${get('hour')}:${get('minute')}:${get('second')}`;
}