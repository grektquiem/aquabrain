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
    // Caché válido durante la petición: el sensor no cambia dentro del lote.
    const cache = new Map<string, SensorResuelto>();

    // Fase 1 · validar cada lectura sin tocar la base de datos más de lo necesario.
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

    // Fase 2 · idempotencia en una sola consulta + deduplicación intra-lote.
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

    // Fase 3 · inserción masiva y marcadores de idempotencia en una transacción.
    const ids = aInsertar.length > 0 ? await this.insertarLote(dispositivo.id, aInsertar) : [];

    // Fase 4 · reglas para todo el lote (una consulta) y alertas.
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

      // El estado del tablero es el de la lectura más reciente por sensor (RF07).
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
   * transacción. Devuelve los `id` correlacionados **en el orden de entrada**:
   * `createManyAndReturn` no garantiza el orden de las filas devueltas, pero la
   * secuencia de PostgreSQL asigna los `id` en el orden de inserción, de modo que
   * ordenar por `id` reconstruye el orden de entrada (evita depender de la
   * comparación exacta de `valor`, que la base redondea a 4 decimales).
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
    // TS-26: un dispositivo no puede escribir en el sensor de otro.
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

  /** HU04: series agregadas por bucket; nunca se devuelve el histórico crudo. */
  async serie(consulta: ConsultarSerieDto) {
    const desde = new Date(consulta.desde);
    const hasta = new Date(consulta.hasta);
    if (Number.isNaN(desde.getTime()) || Number.isNaN(hasta.getTime())) {
      throw new BadRequestException('Rango de fechas inválido');
    }
    if (hasta <= desde) {
      throw new BadRequestException('`hasta` debe ser posterior a `desde`');
    }
    if ((hasta.getTime() - desde.getTime()) / 86_400_000 > MAX_DIAS_CONSULTA) {
      // TS-38: el rango excesivo es una petición bien formada pero no procesable.
      throw new UnprocessableEntityException(`La consulta no puede superar ${MAX_DIAS_CONSULTA} días`);
    }

    const sensores = await this.prisma.sensor.findMany({
      where: { id: { in: consulta.sensores } },
      select: { id: true, codigo: true, nombre: true, unidad: true, tipoVariable: { select: { codigo: true, nombre: true } } },
    });

    const bucket = consulta.bucket ?? '1h';
    const ids = sensores.map((s) => Prisma.sql`${s.id}::uuid`);
    if (ids.length === 0) {
      return { desde, hasta, bucket, series: [] };
    }

    const filas = await this.prisma.$queryRaw<FilaSerie[]>(Prisma.sql`
      SELECT sensor_id AS "sensorId",
             date_bin(${bucket}::interval, timestamp, timestamptz '2000-01-01') AS "bucket",
             AVG(valor)::float8 AS "promedio",
             MIN(valor)::float8 AS "minimo",
             MAX(valor)::float8 AS "maximo",
             COUNT(*)::int AS "muestras"
      FROM medicion
      WHERE sensor_id IN (${Prisma.join(ids)})
        AND timestamp >= ${desde}
        AND timestamp <= ${hasta}
      GROUP BY sensor_id, 2
      ORDER BY sensor_id, 2
    `);

    return {
      desde,
      hasta,
      bucket,
      totalPuntos: filas.length,
      series: sensores.map((s) => ({
        sensor: s,
        puntos: filas
          .filter((f) => f.sensorId === s.id)
          .map((f) => ({ t: f.bucket, promedio: f.promedio, minimo: f.minimo, maximo: f.maximo, muestras: f.muestras })),
      })),
    };
  }

  /** HU02 CA③ (TS-38): exportación CSV de los datos consultados. */
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

    const cabecera = 'sensor;timestamp;valor;unidad;origen;calidad';
    const lineas = filas.map((f) =>
      [f.sensor.codigo, f.timestamp.toISOString(), f.valor ?? f.valorTexto ?? '', f.unidad ?? '', f.origen, f.calidad].join(';'),
    );
    return [cabecera, ...lineas].join('\r\n');
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
