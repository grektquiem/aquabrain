import { OperadorRegla } from '@prisma/client';

/** Regla tal como la necesita el motor (independiente de Prisma). */
export interface ReglaEvaluable {
  id: string;
  nombre: string;
  operador: OperadorRegla;
  umbralMin: number | null;
  umbralMax: number | null;
}

export interface ResultadoEvaluacion {
  /** `true` si la lectura incumple la regla y debe generar alerta. */
  dispara: boolean;
  umbralAplicado: string | null;
  motivo: string | null;
}

export const SIN_DISPARO: ResultadoEvaluacion = { dispara: false, umbralAplicado: null, motivo: null };

/**
 * Motor de reglas (HU07, RN-07). **Función pura**: no toca base de datos ni
 * relojes, por lo que es directamente verificable con pruebas unitarias.
 *
 * Notación de umbrales:
 *  - `MAYOR_QUE`        → el valor supera `umbralMax`.
 *  - `MENOR_QUE`        → el valor cae bajo `umbralMin`.
 *  - `FUERA_DE_RANGO`   → el valor sale de `[umbralMin, umbralMax]`.
 *  - `DENTRO_DE_RANGO`  → el valor está en `[umbralMin, umbralMax]` (uso de control).
 *  - `SIN_DATOS`        → no hay lectura (silencio del sensor).
 */
export function evaluar(regla: ReglaEvaluable, valor: number | null): ResultadoEvaluacion {
  const { operador, umbralMin, umbralMax } = regla;

  if (operador === 'SIN_DATOS') {
    return valor === null
      ? { dispara: true, umbralAplicado: 'SIN_DATOS', motivo: 'El sensor no reporta datos' }
      : SIN_DISPARO;
  }
  if (valor === null) {
    return SIN_DISPARO;
  }

  switch (operador) {
    case 'MAYOR_QUE': {
      const limite = umbralMax ?? umbralMin;
      if (limite === null) return SIN_DISPARO;
      return valor > limite
        ? { dispara: true, umbralAplicado: `> ${limite}`, motivo: `El valor ${valor} supera ${limite}` }
        : SIN_DISPARO;
    }
    case 'MENOR_QUE': {
      const limite = umbralMin ?? umbralMax;
      if (limite === null) return SIN_DISPARO;
      return valor < limite
        ? { dispara: true, umbralAplicado: `< ${limite}`, motivo: `El valor ${valor} está bajo ${limite}` }
        : SIN_DISPARO;
    }
    case 'FUERA_DE_RANGO': {
      const min = umbralMin ?? Number.NEGATIVE_INFINITY;
      const max = umbralMax ?? Number.POSITIVE_INFINITY;
      return valor < min || valor > max
        ? { dispara: true, umbralAplicado: `[${min}, ${umbralMax ?? '∞'}]`, motivo: `El valor ${valor} está fuera de rango` }
        : SIN_DISPARO;
    }
    case 'DENTRO_DE_RANGO': {
      const min = umbralMin ?? Number.NEGATIVE_INFINITY;
      const max = umbralMax ?? Number.POSITIVE_INFINITY;
      return valor >= min && valor <= max
        ? { dispara: true, umbralAplicado: `[${min}, ${max}]`, motivo: `El valor ${valor} está dentro del rango` }
        : SIN_DISPARO;
    }
    default:
      return SIN_DISPARO;
  }
}

/**
 * Valida la coherencia de una regla antes de guardarla (RN-07).
 * Devuelve mensajes de error; arreglo vacío = válida.
 */
export function validarRegla(entrada: {
  operador: OperadorRegla;
  umbralMin?: number | null;
  umbralMax?: number | null;
  alcanceSensor?: boolean;
  alcanceTipo?: boolean;
}): string[] {
  const errores: string[] = [];
  const { operador, umbralMin, umbralMax } = entrada;

  if (Boolean(entrada.alcanceSensor) === Boolean(entrada.alcanceTipo)) {
    errores.push('Debe indicar exactamente un alcance: sensor o tipo de variable (RN-07)');
  }

  const requiereMin = operador === 'MENOR_QUE' || operador === 'FUERA_DE_RANGO' || operador === 'DENTRO_DE_RANGO';
  const requiereMax = operador === 'MAYOR_QUE' || operador === 'FUERA_DE_RANGO' || operador === 'DENTRO_DE_RANGO';

  if (operador === 'FUERA_DE_RANGO' || operador === 'DENTRO_DE_RANGO') {
    if (umbralMin == null || umbralMax == null) {
      errores.push('El operador de rango exige umbral mínimo y máximo');
    } else if (umbralMin >= umbralMax) {
      errores.push('El umbral mínimo debe ser menor que el máximo');
    }
  } else if (operador === 'MENOR_QUE') {
    if (umbralMin == null) errores.push('El operador MENOR_QUE exige umbralMin');
  } else if (operador === 'MAYOR_QUE') {
    if (umbralMax == null) errores.push('El operador MAYOR_QUE exige umbralMax');
  }

  if (umbralMin != null && umbralMax != null && umbralMin > umbralMax) {
    errores.push('El umbral mínimo no puede superar al máximo');
  }
  if (requiereMin && umbralMin == null) errores.push('Falta el umbral mínimo');
  if (requiereMax && umbralMax == null) errores.push('Falta el umbral máximo');

  return Array.from(new Set(errores));
}

/** Texto humano del umbral para guardar en la alerta (`umbral_aplicado`). */
export function describirUmbral(regla: ReglaEvaluable): string {
  const partes: string[] = [];
  if (regla.umbralMin !== null) partes.push(`min ${regla.umbralMin}`);
  if (regla.umbralMax !== null) partes.push(`max ${regla.umbralMax}`);
  return `${regla.operador} (${partes.join(', ') || 'sin umbral'})`;
}
