import { OperadorRegla } from '@prisma/client';
import { describirUmbral, evaluar, ReglaEvaluable, validarRegla } from './reglas.engine';

const regla = (parcial: Partial<ReglaEvaluable>): ReglaEvaluable => ({
  id: 'r1',
  nombre: 'regla',
  operador: OperadorRegla.MAYOR_QUE,
  umbralMin: null,
  umbralMax: null,
  ...parcial,
});

describe('Motor de reglas (dominio puro)', () => {
  // TS-01 · Regla MAYOR_QUE
  it('TS-01: MAYOR_QUE dispara con 31 y umbral 30', () => {
    const r = regla({ operador: OperadorRegla.MAYOR_QUE, umbralMax: 30 });
    expect(evaluar(r, 31).dispara).toBe(true);
    expect(evaluar(r, 30).dispara).toBe(false);
    expect(evaluar(r, 29.99).dispara).toBe(false);
  });

  // TS-01 (borde)
  it('TS-01: el valor exactamente igual al umbral no dispara', () => {
    const r = regla({ operador: OperadorRegla.MAYOR_QUE, umbralMax: 30 });
    expect(evaluar(r, 30)).toEqual({ dispara: false, umbralAplicado: null, motivo: null });
  });

  // TS-02 · Regla FUERA_DE_RANGO
  it('TS-02: FUERA_DE_RANGO dispara con 6,1 en [6,3; 7,5] e indica el umbral aplicado', () => {
    const r = regla({ operador: OperadorRegla.FUERA_DE_RANGO, umbralMin: 6.3, umbralMax: 7.5 });
    const resultado = evaluar(r, 6.1);
    expect(resultado.dispara).toBe(true);
    expect(resultado.umbralAplicado).toContain('6.3');
    expect(evaluar(r, 6.3).dispara).toBe(false);
    expect(evaluar(r, 7.5).dispara).toBe(false);
    expect(evaluar(r, 7.6).dispara).toBe(true);
  });

  it('MENOR_QUE dispara por debajo del mínimo', () => {
    const r = regla({ operador: OperadorRegla.MENOR_QUE, umbralMin: 45 });
    expect(evaluar(r, 44.9).dispara).toBe(true);
    expect(evaluar(r, 45).dispara).toBe(false);
  });

  it('DENTRO_DE_RANGO dispara dentro del intervalo', () => {
    const r = regla({ operador: OperadorRegla.DENTRO_DE_RANGO, umbralMin: 5.8, umbralMax: 7 });
    expect(evaluar(r, 6.4).dispara).toBe(true);
    expect(evaluar(r, 7.4).dispara).toBe(false);
  });

  it('SIN_DATOS solo dispara cuando no hay lectura', () => {
    const r = regla({ operador: OperadorRegla.SIN_DATOS });
    expect(evaluar(r, null).dispara).toBe(true);
    expect(evaluar(r, 12).dispara).toBe(false);
  });

  // TS-04 · Regla inactiva no genera alerta (el filtro está en el motor/consulta)
  it('TS-04: una lectura válida con regla mal configurada (sin umbral) nunca dispara', () => {
    const sinUmbral = regla({ operador: OperadorRegla.MAYOR_QUE, umbralMax: null });
    expect(evaluar(sinUmbral, 999).dispara).toBe(false);
  });

  it('una lectura nula no dispara reglas numéricas', () => {
    const r = regla({ operador: OperadorRegla.MAYOR_QUE, umbralMax: 30 });
    expect(evaluar(r, null).dispara).toBe(false);
  });

  describe('validarRegla (RN-07)', () => {
    it('exige exactamente un alcance', () => {
      expect(validarRegla({ operador: OperadorRegla.MAYOR_QUE, umbralMax: 30 })).toContain(
        'Debe indicar exactamente un alcance: sensor o tipo de variable (RN-07)',
      );
      expect(
        validarRegla({ operador: OperadorRegla.MAYOR_QUE, umbralMax: 30, alcanceSensor: true, alcanceTipo: true }),
      ).toContain('Debe indicar exactamente un alcance: sensor o tipo de variable (RN-07)');
      expect(
        validarRegla({ operador: OperadorRegla.MAYOR_QUE, umbralMax: 30, alcanceSensor: true }),
      ).toHaveLength(0);
    });

    it('exige los umbrales que corresponden al operador', () => {
      expect(validarRegla({ operador: OperadorRegla.MENOR_QUE, alcanceSensor: true })).toContain(
        'El operador MENOR_QUE exige umbralMin',
      );
      expect(
        validarRegla({ operador: OperadorRegla.FUERA_DE_RANGO, umbralMin: 7, umbralMax: 6, alcanceSensor: true }),
      ).toContain('El umbral mínimo debe ser menor que el máximo');
      expect(
        validarRegla({ operador: OperadorRegla.FUERA_DE_RANGO, umbralMin: 6, umbralMax: 7, alcanceTipo: true }),
      ).toHaveLength(0);
    });
  });

  it('describirUmbral resume el umbral para la alerta', () => {
    expect(describirUmbral(regla({ operador: OperadorRegla.FUERA_DE_RANGO, umbralMin: 6, umbralMax: 7 }))).toBe(
      'FUERA_DE_RANGO (min 6, max 7)',
    );
    expect(describirUmbral(regla({ operador: OperadorRegla.SIN_DATOS }))).toBe('SIN_DATOS (sin umbral)');
  });
});
