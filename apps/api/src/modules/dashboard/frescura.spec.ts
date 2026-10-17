import { calcularCalidad, calcularFrescura, umbralSilencio } from './frescura';

describe('Frescura del dato y calidad de la lectura (RF07/RF14, RN-05)', () => {
  // TS-08 · intervalo de reporte 5 min
  it('TS-08: 1 min y 4 min son frescos; 20 min está desactualizado', () => {
    const intervalo = 300; // 5 min
    expect(calcularFrescura(60, intervalo)).toBe('EN_LINEA');
    expect(calcularFrescura(240, intervalo)).toBe('EN_LINEA');
    expect(calcularFrescura(1200, intervalo)).toBe('SIN_COMUNICACION');
  });

  // TS-09 · derivación del estado de conexión
  it('TS-09: sin ninguna medición el dispositivo está SIN_COMUNICACION', () => {
    expect(calcularFrescura(null, 300)).toBe('SIN_COMUNICACION');
  });

  it('el umbral de silencio es factor × intervalo (por defecto 3×)', () => {
    expect(umbralSilencio(300)).toBe(900);
    expect(umbralSilencio(300, 5)).toBe(1500);
    expect(calcularFrescura(900, 300)).toBe('EN_LINEA');
    expect(calcularFrescura(901, 300)).toBe('SIN_COMUNICACION');
  });

  // TS-07 · medición fuera del rango declarado del sensor
  it('TS-07: un valor fuera del rango del sensor se marca SOSPECHOSA sin descartarse', () => {
    expect(calcularCalidad(25, 10, 35)).toBe('OK');
    expect(calcularCalidad(9.9, 10, 35)).toBe('SOSPECHOSA');
    expect(calcularCalidad(45, 10, 35)).toBe('SOSPECHOSA');
    expect(calcularCalidad(10, 10, 35)).toBe('OK');
    expect(calcularCalidad(35, 10, 35)).toBe('OK');
  });

  it('sin valor (solo texto) la calidad es OK', () => {
    expect(calcularCalidad(null, 10, 35)).toBe('OK');
    expect(calcularCalidad(undefined, 10, 35)).toBe('OK');
  });

  it('sin rango declarado no se puede juzgar la calidad', () => {
    expect(calcularCalidad(9999, null, null)).toBe('OK');
  });
});
