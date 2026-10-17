import { Injectable, Logger } from '@nestjs/common';
import { OperadorRegla, Severidad } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { describirUmbral, evaluar, ReglaEvaluable } from '../reglas/reglas.engine';

export interface MedicionParaEvaluar {
  id: bigint;
  valor: number | null;
  timestamp: Date;
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
 */
@Injectable()
export class MotorAlertasService {
  private readonly logger = new Logger(MotorAlertasService.name);

  constructor(private readonly prisma: PrismaService) {}

  async evaluarMedicion(
    sensor: { id: string; tipoVariableId: string; dispositivo: { sistemaId: string } },
    medicion: MedicionParaEvaluar,
  ): Promise<AlertaGenerada[]> {
    const reglas = await this.prisma.reglaAlerta.findMany({
      where: {
        activa: true,
        OR: [{ sensorId: sensor.id }, { tipoVariableId: sensor.tipoVariableId }],
      },
    });
    if (reglas.length === 0) return [];

    // TS-05 / RN-07: si hay reglas específicas del sensor, prevalecen sobre
    // las de tipo de variable (evita alertas duplicadas por doble alcance).
    const porSensor = reglas.filter((r) => r.sensorId === sensor.id);
    const aplicables = porSensor.length > 0 ? porSensor : reglas.filter((r) => r.sensorId === null);

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
