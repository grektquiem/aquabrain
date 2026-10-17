import { validateEnv } from './env.validation';

const base = {
  NODE_ENV: 'test',
  DATABASE_URL: 'postgresql://u:p@localhost:55432/db',
  JWT_ACCESS_SECRET: 'a'.repeat(32),
  JWT_REFRESH_SECRET: 'b'.repeat(32),
  DEVICE_KEY_PEPPER: 'pepper-de-pruebas',
};

describe('Validación del entorno (fallo seguro al arrancar)', () => {
  it('acepta un entorno completo y aplica los valores por defecto', () => {
    const resultado = validateEnv({ ...base });
    expect(resultado.PORT).toBe(3000);
    expect(resultado.API_PREFIX).toBe('api/v1');
    expect(resultado.JWT_ACCESS_TTL).toBe('15m');
    expect(resultado.ALERT_SILENCE_FACTOR).toBe(3);
  });

  it('rechaza el arranque si falta DATABASE_URL', () => {
    const { DATABASE_URL, ...sinDb } = base;
    void DATABASE_URL;
    expect(() => validateEnv(sinDb)).toThrow(/DATABASE_URL/);
  });

  it('exige secretos JWT de al menos 32 caracteres', () => {
    expect(() => validateEnv({ ...base, JWT_ACCESS_SECRET: 'corto' })).toThrow(/JWT_ACCESS_SECRET/);
  });

  it('valida el rango del coste de bcrypt', () => {
    expect(() => validateEnv({ ...base, BCRYPT_COST: '4' })).toThrow(/BCRYPT_COST/);
    expect(validateEnv({ ...base, BCRYPT_COST: '12' }).BCRYPT_COST).toBe(12);
  });

  it('no acepta un NODE_ENV desconocido', () => {
    expect(() => validateEnv({ ...base, NODE_ENV: 'produccion' })).toThrow(/NODE_ENV/);
  });
});
