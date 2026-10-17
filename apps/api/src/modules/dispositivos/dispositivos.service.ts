import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { randomBytes } from 'crypto';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../common/prisma/prisma.service';
import {
  ActualizarDispositivoDto,
  ActualizarSensorDto,
  CrearDispositivoDto,
  CrearSensorDto,
} from './dto/dispositivo.dto';

/** Proyección del dispositivo: **jamás** se devuelve `apiKeyHash` (EC-07). */
const PROYECCION_DISPOSITIVO = {
  id: true,
  codigo: true,
  modelo: true,
  firmware: true,
  intervaloReporteSeg: true,
  apiKeyUltimos4: true,
  estadoConexion: true,
  activo: true,
  creadoEn: true,
  sistema: { select: { id: true, codigo: true, nombre: true } },
} satisfies Prisma.DispositivoSelect;

const PROYECCION_SENSOR = {
  id: true,
  codigo: true,
  nombre: true,
  unidad: true,
  rangoMin: true,
  rangoMax: true,
  ubicacionFisica: true,
  activo: true,
  dispositivo: { select: { id: true, codigo: true } },
  tipoVariable: { select: { id: true, codigo: true, nombre: true, origenDato: true } },
} satisfies Prisma.SensorSelect;

@Injectable()
export class DispositivosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  listar(sistemaId?: string) {
    return this.prisma.dispositivo.findMany({
      where: sistemaId ? { sistemaId } : {},
      select: { ...PROYECCION_DISPOSITIVO, _count: { select: { sensores: true } } },
      orderBy: { codigo: 'asc' },
    });
  }

  async obtener(id: string) {
    const dispositivo = await this.prisma.dispositivo.findUnique({
      where: { id },
      select: { ...PROYECCION_DISPOSITIVO, sensores: { select: PROYECCION_SENSOR, orderBy: { codigo: 'asc' } } },
    });
    if (!dispositivo) throw new NotFoundException('Dispositivo no encontrado');
    return dispositivo;
  }

  /** Alta: la clave se muestra **una sola vez** (doc 06 §2.3). */
  async crear(dto: CrearDispositivoDto) {
    const sistema = await this.prisma.sistema.findUnique({ where: { id: dto.sistemaId } });
    if (!sistema) throw new NotFoundException('Sistema no encontrado');
    if (await this.prisma.dispositivo.findUnique({ where: { codigo: dto.codigo } })) {
      throw new ConflictException('Ya existe un dispositivo con ese código');
    }

    const apiKey = this.generarClave();
    const apiKeyHash = await bcrypt.hash(apiKey + this.pepper(), this.costo());
    const dispositivo = await this.prisma.dispositivo.create({
      data: { ...dto, apiKeyHash, apiKeyUltimos4: apiKey.slice(-4) },
      select: PROYECCION_DISPOSITIVO,
    });
    return { dispositivo, apiKey, aviso: 'Guarde la clave: no volverá a mostrarse.' };
  }

  async actualizar(id: string, dto: ActualizarDispositivoDto) {
    await this.obtener(id);
    const { sistemaId, ...resto } = dto;
    void sistemaId;
    return this.prisma.dispositivo.update({ where: { id }, data: resto, select: PROYECCION_DISPOSITIVO });
  }

  /** Baja lógica: revoca de facto la credencial porque el guard exige `activo`. */
  async desactivar(id: string) {
    await this.obtener(id);
    return this.prisma.dispositivo.update({ where: { id }, data: { activo: false }, select: PROYECCION_DISPOSITIVO });
  }

  async rotarClave(id: string) {
    await this.obtener(id);
    const apiKey = this.generarClave();
    const apiKeyHash = await bcrypt.hash(apiKey + this.pepper(), this.costo());
    const dispositivo = await this.prisma.dispositivo.update({
      where: { id },
      data: { apiKeyHash, apiKeyUltimos4: apiKey.slice(-4) },
      select: PROYECCION_DISPOSITIVO,
    });
    return { dispositivo, apiKey, aviso: 'Guarde la clave: no volverá a mostrarse.' };
  }

  // ---------- Sensores anidados ----------

  async listarSensores(dispositivoId: string) {
    await this.obtener(dispositivoId);
    return this.prisma.sensor.findMany({
      where: { dispositivoId },
      select: { ...PROYECCION_SENSOR, estadoActual: true },
      orderBy: { codigo: 'asc' },
    });
  }

  async crearSensor(dispositivoId: string, dto: CrearSensorDto) {
    await this.obtener(dispositivoId);
    const tipo = await this.prisma.tipoVariable.findUnique({ where: { codigo: dto.tipoVariableCodigo } });
    if (!tipo) throw new NotFoundException(`Tipo de variable '${dto.tipoVariableCodigo}' no existe`);

    const duplicado = await this.prisma.sensor.findFirst({ where: { dispositivoId, codigo: dto.codigo } });
    if (duplicado) throw new ConflictException('Ya existe un sensor con ese código en el dispositivo');

    const { tipoVariableCodigo, ...resto } = dto;
    void tipoVariableCodigo;
    return this.prisma.sensor.create({
      data: { ...resto, dispositivoId, tipoVariableId: tipo.id },
      select: PROYECCION_SENSOR,
    });
  }

  async actualizarSensor(dispositivoId: string, sensorId: string, dto: ActualizarSensorDto) {
    const sensor = await this.prisma.sensor.findFirst({ where: { id: sensorId, dispositivoId } });
    if (!sensor) throw new NotFoundException('Sensor no encontrado');

    const { tipoVariableCodigo, ...resto } = dto;
    const data: Prisma.SensorUpdateInput = { ...resto };
    if (tipoVariableCodigo) {
      const tipo = await this.prisma.tipoVariable.findUnique({ where: { codigo: tipoVariableCodigo } });
      if (!tipo) throw new NotFoundException(`Tipo de variable '${tipoVariableCodigo}' no existe`);
      data.tipoVariable = { connect: { id: tipo.id } };
    }
    return this.prisma.sensor.update({ where: { id: sensorId }, data, select: PROYECCION_SENSOR });
  }

  private generarClave(): string {
    return `ak_live_${randomBytes(32).toString('base64url')}`;
  }

  private pepper(): string {
    return this.config.get<string>('DEVICE_KEY_PEPPER') ?? '';
  }

  private costo(): number {
    return Number(this.config.get<string>('BCRYPT_COST') ?? 12);
  }
}
