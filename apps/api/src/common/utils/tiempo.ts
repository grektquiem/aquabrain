/**
 * Utilidades de tiempo (RN-08, RN-09).
 * Todo el dominio trabaja en **UTC**; las duraciones se expresan como `15m`, `7d`, `30s`.
 */
const UNIDADES: Record<string, number> = {
  ms: 1,
  s: 1000,
  m: 60 * 1000,
  h: 60 * 60 * 1000,
  d: 24 * 60 * 60 * 1000,
};

/** Convierte `'15m'`/`'7d'`/`'300000'` a milisegundos. Lanza si el formato es inválido. */
export function parseDuracion(valor: string | number): number {
  if (typeof valor === 'number') return valor;
  const texto = valor.trim();
  if (/^\d+$/.test(texto)) return Number(texto);
  const m = /^(\d+)(ms|s|m|h|d)$/.exec(texto);
  if (!m) throw new Error(`Duración inválida: "${valor}"`);
  return Number(m[1]) * UNIDADES[m[2]];
}

/** Fecha actual en UTC (inyectable en pruebas). */
export const ahora = (): Date => new Date();
