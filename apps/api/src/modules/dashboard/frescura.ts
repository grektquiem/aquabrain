export type Frescura = 'EN_LINEA' | 'SIN_COMUNICACION' | 'INACTIVO';

/**
 * Derivación del estado de conexión a partir de la última comunicación
 * (RF07/RF14, RN-05, TS-08/TS-09).
 *
 * Función pura: recibe segundos e intervalo, no consulta el reloj.
 *
 * @param segundosSinReportar  tiempo desde la última medición; `null` si nunca reportó
 * @param intervaloReporteSeg  intervalo nominal del dispositivo
 * @param factorSilencio       múltiplo del intervalo a partir del cual se considera caído
 */
export function calcularFrescura(
  segundosSinReportar: number | null,
  intervaloReporteSeg: number,
  factorSilencio = 3,
): Frescura {
  if (segundosSinReportar === null) return 'SIN_COMUNICACION';
  return segundosSinReportar > intervaloReporteSeg * factorSilencio ? 'SIN_COMUNICACION' : 'EN_LINEA';
}

/** Umbral de silencio en segundos (se expone para mostrarlo en el panel). */
export function umbralSilencio(intervaloReporteSeg: number, factorSilencio = 3): number {
  return intervaloReporteSeg * factorSilencio;
}

/**
 * Calidad de una lectura frente al rango declarado del sensor (TS-07).
 * Una lectura fuera de rango **no** se descarta: se marca SOSPECHOSA para no
 * corromper el histórico ni perder el dato.
 */
export function calcularCalidad(
  valor: number | null | undefined,
  rangoMin?: number | null,
  rangoMax?: number | null,
): 'OK' | 'SOSPECHOSA' {
  if (valor === null || valor === undefined) return 'OK';
  if (rangoMin !== null && rangoMin !== undefined && valor < rangoMin) return 'SOSPECHOSA';
  if (rangoMax !== null && rangoMax !== undefined && valor > rangoMax) return 'SOSPECHOSA';
  return 'OK';
}
