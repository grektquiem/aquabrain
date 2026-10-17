import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ActualizarReglaDto, CrearReglaDto, ProbarReglaDto } from './dto/regla.dto';
import { evaluar, ReglaEvaluable, validarRegla } from './reglas.engine';

const PROYECCION = {
  id: true,
  nombre: true,
  operador: true,
  umbralMin: true,
  umbralMax: true,
  severidad: true,
  cooldownSeg: true,
  activa: true,
  creadoEn: true,
  actualizadoEn: true,
  sensor: { select: { id: true, codigo: true, nombre: true, unidad: true } },
  tipoVariable: { select: { id: true, codigo: true, nombre: true } },
  creador: { select: { id: true, nombre: true } },
} as const;

@Injectable()
export class ReglasService {
  constructor(private readonly prisma: PrismaService) {}

  listar(soloActivas = false) {
    return this.prisma.reglaAlerta.findMany({
      where: soloActivas ? { activa: true } : {},
      select: PROYECCION,
      orderBy: [{ activa: 'desc' }, { nombre: 'asc' }],
    });
  }

  async obtener(id: string) {
    const regla = await this.prisma.reglaAlerta.findUnique({ where: { id }, select: PROYECCION });
    if (!regla) throw new NotFoundException('Regla no encontrada');
    return regla;
  }

  async crear(dto: CrearReglaDto, usuarioId: string) {
    const tipoVariableId = await this.resolverTipo(dto.tipoVariableCodigo);
    const sensorId = await this.validarSensor(dto.sensorId);

    const errores = validarRegla({
      operador: dto.operador,
      umbralMin: dto.umbralMin ?? null,
      umbralMax: dto.umbralMax ?? null,
      alcanceSensor: Boolean(sensorId),
      alcanceTipo: Boolean(tipoVariableId),
    });
    if (errores.length) throw new BadRequestException(errores);

    return this.prisma.reglaAlerta.create({
      data: {
        nombre: dto.nombre,
        operador: dto.operador,
        umbralMin: dto.umbralMin ?? null,
        umbralMax: dto.umbralMax ?? null,
        severidad: dto.severidad,
        cooldownSeg: dto.cooldownSeg ?? 900,
        activa: dto.activa ?? true,
        sensorId,
        tipoVariableId,
        creadoPor: usuarioId,
      },
      select: PROYECCION,
    });
  }

  async actualizar(id: string, dto: ActualizarReglaDto) {
    const actual = await this.prisma.reglaAlerta.findUnique({ where: { id } });
    if (!actual) throw new NotFoundException('Regla no encontrada');

    // Un cambio de alcance desplaza al otro (RN-07: excluyentes).
    const sensorId =
      dto.sensorId !== undefined
        ? dto.sensorId
        : dto.tipoVariableCodigo !== undefined
          ? null
          : actual.sensorId;
    const tipoVariableId = dto.tipoVariableCodigo
      ? await this.resolverTipo(dto.tipoVariableCodigo)
      : dto.sensorId !== undefined
        ? null
        : actual.tipoVariableId;

    await this.validarSensor(sensorId ?? undefined);

    const operador = dto.operador ?? actual.operador;
    const umbralMin = dto.umbralMin !== undefined ? dto.umbralMin : (actual.umbralMin?.toNumber() ?? null);
    const umbralMax = dto.umbralMax !== undefined ? dto.umbralMax : (actual.umbralMax?.toNumber() ?? null);

    const errores = validarRegla({
      operador,
      umbralMin,
      umbralMax,
      alcanceSensor: Boolean(sensorId),
      alcanceTipo: Boolean(tipoVariableId),
    });
    if (errores.length) throw new BadRequestException(errores);

    return this.prisma.reglaAlerta.update({
      where: { id },
      data: {
        nombre: dto.nombre,
        operador: dto.operador,
        severidad: dto.severidad,
        cooldownSeg: dto.cooldownSeg,
        activa: dto.activa,
        umbralMin: dto.umbralMin !== undefined ? dto.umbralMin : undefined,
        umbralMax: dto.umbralMax !== undefined ? dto.umbralMax : undefined,
        sensorId,
        tipoVariableId,
      },
      select: PROYECCION,
    });
  }

  eliminar(id: string) {
    return this.prisma.reglaAlerta.delete({ where: { id }, select: { id: true, nombre: true } });
  }

  /** HU07: evalúa una medición simulada sin persistir nada. */
  async probar(dto: ProbarReglaDto) {
    const fuente = dto.reglaId
      ? await this.prisma.reglaAlerta.findUnique({ where: { id: dto.reglaId } })
      : null;

    const nombre = dto.regla?.nombre ?? fuente?.nombre ?? 'Regla en borrador';
    const operador = dto.regla?.operador ?? fuente?.operador;
    const umbralMin = dto.regla?.umbralMin ?? fuente?.umbralMin?.toNumber() ?? null;
    const umbralMax = dto.regla?.umbralMax ?? fuente?.umbralMax?.toNumber() ?? null;

    if (!operador) {
      throw new BadRequestException('Debe indicar `reglaId` o la definición en `regla`');
    }

    const evaluable: ReglaEvaluable = { id: dto.reglaId ?? 'borrador', nombre, operador, umbralMin, umbralMax };
    const resultado = evaluar(evaluable, dto.valor ?? null);
    return { regla: { nombre, operador, umbralMin, umbralMax }, valor: dto.valor ?? null, ...resultado };
  }

  private async resolverTipo(codigo?: string): Promise<string | null> {
    if (!codigo) return null;
    const tipo = await this.prisma.tipoVariable.findUnique({ where: { codigo } });
    if (!tipo) throw new BadRequestException(`Tipo de variable '${codigo}' no existe`);
    return tipo.id;
  }

  private async validarSensor(sensorId?: string): Promise<string | null> {
    if (!sensorId) return null;
    const sensor = await this.prisma.sensor.findUnique({ where: { id: sensorId } });
    if (!sensor) throw new BadRequestException(`El sensor ${sensorId} no existe`);
    return sensor.id;
  }
}
