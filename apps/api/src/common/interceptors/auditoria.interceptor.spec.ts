import { primerSegmento } from './auditoria.interceptor';

describe('Auditoría · entidad de la ruta (RF13)', () => {
  it('extrae la entidad ignorando el prefijo global', () => {
    expect(primerSegmento('/api/v1/reglas', 'api/v1')).toBe('reglas');
    expect(primerSegmento('/api/v1/reglas/7', 'api/v1')).toBe('reglas');
    expect(primerSegmento('/api/v1/alertas/:id/resolver', 'api/v1')).toBe('alertas');
    expect(primerSegmento('/api/v1/dispositivos/:id/sensores', 'api/v1')).toBe('dispositivos');
  });

  it('tolera rutas sin prefijo o con barras repetidas', () => {
    expect(primerSegmento('/reglas', 'api/v1')).toBe('reglas');
    expect(primerSegmento('/api//v1/mediciones', 'api/v1')).toBe('mediciones');
  });

  it('devuelve null cuando la ruta es solo el prefijo', () => {
    expect(primerSegmento('/api/v1', 'api/v1')).toBeNull();
    expect(primerSegmento('/', 'api/v1')).toBeNull();
  });
});
