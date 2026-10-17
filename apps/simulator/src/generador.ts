/**
 * Modelo físico del cultivo aeropónico (MC-09, RN-11).
 *
 * No es un gemelo digital: es un generador **plausible y acotado** que produce
 * las cinco variables del sistema con dinámica suave (paseo aleatorio sobre una
 * base + ciclo diario + ruido) y perfiles de escenario que provocan situaciones
 * reales (ola de calor, sequía) o anomalías puntuales del sensor.
 */

import type { Perfil } from './config';

export interface DefinicionSensor {
  codigo: string;
  tipo: 'TEMPERATURA' | 'HUMEDAD' | 'PH' | 'DISTANCIA' | 'CAUDAL';
  unidad: string;
  rangoMin: number;
  rangoMax: number;
  decimales: number;
}

/** Catálogo espejo de `sensor` sembrado por `prisma/seed.ts` (doc 05 §3.3). */
export const CATALOGO: Record<string, DefinicionSensor> = {
  'TEMP-01': { codigo: 'TEMP-01', tipo: 'TEMPERATURA', unidad: 'C', rangoMin: 10, rangoMax: 35, decimales: 1 },
  'HUM-01': { codigo: 'HUM-01', tipo: 'HUMEDAD', unidad: '%', rangoMin: 30, rangoMax: 90, decimales: 0 },
  'PH-01': { codigo: 'PH-01', tipo: 'PH', unidad: 'pH', rangoMin: 5.5, rangoMax: 7.5, decimales: 2 },
  'DIST-01': { codigo: 'DIST-01', tipo: 'DISTANCIA', unidad: 'cm', rangoMin: 2, rangoMax: 40, decimales: 1 },
  'CAUDAL-01': { codigo: 'CAUDAL-01', tipo: 'CAUDAL', unidad: 'L/min', rangoMin: 0, rangoMax: 5, decimales: 2 },
};

export function resolverSensor(codigo: string): DefinicionSensor {
  const definicion = CATALOGO[codigo];
  if (!definicion) {
    throw new Error(
      `Sensor desconocido: ${codigo}. El simulador conoce ${Object.keys(CATALOGO).join(', ')}`,
    );
  }
  return definicion;
}

/** Estado interno de cada variable simulada (permite continuidad entre lecturas). */
interface EstadoVariable {
  valor: number;
}

export interface Lectura {
  sensorCodigo: string;
  tipo: DefinicionSensor['tipo'];
  valor: number;
  unidad: string;
  /** `true` si el valor queda fuera del rango declarado del sensor (TS-07). */
  fueraDeRango: boolean;
}

const BASES: Record<DefinicionSensor['tipo'], number> = {
  TEMPERATURA: 22,
  HUMEDAD: 66,
  PH: 6.3,
  DISTANCIA: 28,
  CAUDAL: 1.2,
};

const AMPLITUD: Record<DefinicionSensor['tipo'], number> = {
  TEMPERATURA: 0.35,
  HUMEDAD: 1.2,
  PH: 0.05,
  DISTANCIA: 0.6,
  CAUDAL: 0.9,
};

/**
 * Generador con memoria. `siguiente(lectura)` devuelve la siguiente medición de
 * un sensor; el mismo objeto se reutiliza para mantener continuidad.
 */
export class Generador {
  private readonly estados = new Map<string, EstadoVariable>();
  private readonly inicio = Date.now();

  constructor(
    private readonly perfil: Perfil,
    private readonly semilla: () => number = Math.random,
  ) {}

  private base(tipo: DefinicionSensor['tipo']): number {
    if (this.perfil === 'ola-de-calor') {
      if (tipo === 'TEMPERATURA') return 33.5; // supera la regla `> 32` de la semilla
      if (tipo === 'HUMEDAD') return 52;
    }
    if (this.perfil === 'sequia') {
      if (tipo === 'HUMEDAD') return 46;
      if (tipo === 'DISTANCIA') return 14; // el depósito se vacía
      if (tipo === 'CAUDAL') return 0.4;
    }
    return BASES[tipo];
  }

  siguiente(definicion: DefinicionSensor, indiceLectura: number, forzarAnomalia: boolean): Lectura {
    const { codigo, tipo, rangoMin, rangoMax, decimales, unidad } = definicion;
    const estado = this.estados.get(codigo) ?? { valor: this.base(tipo) };
    this.estados.set(codigo, estado);

    if (forzarAnomalia) {
      // Valor claramente fuera del rango declarado: debe registrarse como
      // SOSPECHOSA y, si hay regla, disparar alerta (TS-07, TS-35).
      estado.valor = rangoMax + (rangoMax - rangoMin) * 0.15;
      return this.redondear(definicion, estado.valor, true);
    }

    // Ciclo diario lento (periodo de 60 lecturas) + paseo aleatorio + ruido.
    const ciclo = Math.sin(((this.inicio / 1000 + indiceLectura) / 60) * 2 * Math.PI);
    const deriva = (this.semilla() - 0.5) * 2 * AMPLITUD[tipo];
    let valor = estado.valor + deriva * 0.6 + ciclo * AMPLITUD[tipo] * 0.3;

    // Distancia: el depósito se consume de forma monótona (agua hacia las raíces).
    if (tipo === 'DISTANCIA') valor = Math.max(rangoMin, estado.valor - 0.8 * this.semilla());
    // Caudal: pulsos de riego (0 fuera del pulso).
    if (tipo === 'CAUDAL') valor = this.semilla() < 0.35 ? 0 : Math.abs(valor);
    // Humedad sigue a la temperatura con signo inverso.
    if (tipo === 'HUMEDAD' && this.perfil === 'normal') valor -= ciclo * 0.8;

    valor = Math.min(rangoMax, Math.max(rangoMin, valor));
    estado.valor = valor;
    return this.redondear(definicion, valor, false, decimales);
  }

  private redondear(definicion: DefinicionSensor, valor: number, fueraDeRango: boolean, decimales = definicion.decimales): Lectura {
    const factor = 10 ** decimales;
    const redondeado = Math.round(valor * factor) / factor;
    return {
      sensorCodigo: definicion.codigo,
      tipo: definicion.tipo,
      valor: redondeado,
      unidad: definicion.unidad,
      fueraDeRango: fueraDeRango || redondeado < definicion.rangoMin || redondeado > definicion.rangoMax,
    };
  }
}
