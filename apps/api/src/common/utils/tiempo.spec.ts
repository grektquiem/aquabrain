import { parseDuracion } from './tiempo';

describe('parseDuracion (RN-08/RN-09)', () => {
  it('interpreta las unidades del dominio', () => {
    expect(parseDuracion('5m')).toBe(300_000);
    expect(parseDuracion('15m')).toBe(900_000);
    expect(parseDuracion('7d')).toBe(604_800_000);
    expect(parseDuracion('30s')).toBe(30_000);
    expect(parseDuracion('250ms')).toBe(250);
    expect(parseDuracion('2h')).toBe(7_200_000);
  });

  it('acepta números en milisegundos', () => {
    expect(parseDuracion(1000)).toBe(1000);
    expect(parseDuracion('1000')).toBe(1000);
  });

  it('rechaza formatos inválidos', () => {
    expect(() => parseDuracion('cinco minutos')).toThrow('Duración inválida');
    expect(() => parseDuracion('5 minutos')).toThrow();
    expect(() => parseDuracion('')).toThrow();
  });
});
