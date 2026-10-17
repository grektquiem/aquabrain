import { Injectable, Logger } from '@nestjs/common';
import { OperadorRegla, ReglaAlerta, Severidad } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { describirUmbral, evaluar, ReglaEvaluable } from '../reglas/reglas.engine';

export interface MedicionParaEvaluar {
  id: bigint;
  valor: number | null;
  timestamp: Date;
}

/** Sensor en lo mínimo que el motor necesita para decidir el alcance de las reglas. */
export interface SensorParaReglas {
  id: string;
  tipoVariableId: string;
  dispositivo: { sistemaId: string };
}

export interface AlertaGenerada {
  reglaId: string;
  regla: string;
  severidad: Severidad;
  valor: number | null;
}

/**
 * Motor de alertas (HU07, RN-07, RT-03).
 *
 * Reglas aplicables = activas cuyo alcance es el sensor **o** su tipo de
 * variable. Antes de crear una alerta se respeta el *cooldown* de la regla:
 * si ya existe una alerta ACTIVA de la misma regla y sensor dentro de la
 * ventana, no se duplica (evita tormentas de alertas).
 *
 * La selección de reglas se separó de la evaluación para que la ingesta por
 * lote (R-01) pueda cargar las reglas de todos los sensores en **una sola
 * consulta** y reutilizarlas para las 500 lecturas del lote.
 */
@Injectable()
export class MotorAlertasService {
  private readonly logger = new Logger(MotorAlertasService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Reglas aplicables por sensor, resueltas de una sola consulta para todo el
   * lote. Aplica RN-07: si el sensor tiene reglas propias, se ignoran las de
   * su tipo de variable (evita alertas duplicadas por doble alcance).
   */
  async cargarReglasPara(sensores: Array<{ id: string; tipoVariableId: string }>): Promise<Map<string, ReglaAlerta[]>> {
    const mapa = new Map<string, ReglaAlerta[]>();
    if (sensores.length === 0) return mapa;

    const sensorIds = [...new Set(sensores.map((s) => s.id))];
    const tipoVariableIds = [...new Set(sensores.map((s) => s.tipoVariableId))];
    const reglas = await this.prisma.reglaAlerta.findMany({
      where: {
        activa: true,
        OR: [{ sensorId: { in: sensorIds } }, { tipoVariableId: { in: tipoVariableIds } }],
      },
    });

    for (const sensor of sensores) {
      mapa.set(sensor.id, this.seleccionarAplicables(reglas, sensor));
    }
    return mapa;
  }

  /** TS-05 / RN-07: las reglas del sensor prevalecen sobre las de su tipo. */
  private seleccionarAplicables(reglas: ReglaAlerta[], sensor: { id: string; tipoVariableId: string }): ReglaAlerta[] {
    const porSensor = reglas.filter((r) => r.sensorId === sensor.id);
    if (porSensor.length > 0) return porSensor;
    return reglas.filter((r) => r.sensorId === null && r.tipoVariableId === sensor.tipoVariableId);
  }

  /** Evalúa una única medición cargando sus reglas (camino de `POST /mediciones`). */
  async evaluarMedicion(
    sensor: SensorParaReglas,
    medicion: MedicionParaEvaluar,
  ): Promise<AlertaGenerada[]> {
    const reglasPorSensor = await this.cargarReglasPara([sensor]);
    return this.evaluarConReglas(sensor, medicion, reglasPorSensor.get(sensor.id) ?? []);
  }

  /**
   * Evalúa una medición con reglas ya resueltas. Crea alertas respetando el
   * cooldown; devuelve las alertas efectivamente generadas.
   */
  async evaluarConReglas(
    sensor: SensorParaReglas,
    medicion: MedicionParaEvaluar,
    aplicables: ReglaAlerta[],
  ): Promise<AlertaGenerada[]> {
    const generadas: AlertaGenerada[] = [];

    for (const regla of aplicables) {
      const evaluable: ReglaEvaluable = {
        id: regla.id,
        nombre: regla.nombre,
        operador: regla.operador as OperadorRegla,
        umbralMin: regla.umbralMin ? Number(regla.umbralMin) : null,
        umbralMax: regla.umbralMax ? Number(regla.umbralMax) : null,
      };
      const resultado = evaluar(evaluable, medicion.valor);
      if (!resultado.dispara) continue;

      const enEspera = await this.estaEnCooldown(regla.id, sensor.id, regla.cooldownSeg, medicion.timestamp);
      if (enEspera) {
        this.logger.debug(`Cooldown activo para la regla ${regla.nombre}; no se duplica`);
        continue;
      }

      await this.prisma.alerta.create({
        data: {
          reglaId: regla.id,
          sensorId: sensor.id,
          sistemaId: sensor.dispositivo.sistemaId,
          tipo: 'UMBRAL',
          severidad: regla.severidad,
          mensaje: `${regla.nombre}: ${resultado.motivo ?? 'condición incumplida'}`.slice(0, 300),
          valorDetectado: medicion.valor,
          medicionId: medicion.id,
          umbralAplicado: (resultado.umbralAplicado ?? describirUmbral(evaluable)).slice(0, 60),
        },
      });

      generadas.push({ reglaId: regla.id, regla: regla.nombre, severidad: regla.severidad, valor: medicion.valor });
    }

    return generadas;
  }

  /** ¿Existe una alerta ACTIVA de la misma regla y sensor dentro del cooldown? */
  private async estaEnCooldown(
    reglaId: string,
    sensorId: string,
    cooldownSeg: number,
    referencia: Date,
  ): Promise<boolean> {
    const desde = new Date(referencia.getTime() - cooldownSeg * 1000);
    const existente = await this.prisma.alerta.findFirst({
      where: {
        reglaId,
        sensorId,
        estado: 'ACTIVA',
        creadaEn: { gte: desde },
      },
      select: { id: true },
    });
    return Boolean(existente);
  }
}
