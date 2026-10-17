import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { loginSchema, MAX_BULK_ITEMS, usuarioCreateSchema } from '@aquabrain/shared';
import { crearApp } from './utils/app';

/**
 * Contrato OpenAPI ↔ `@aquabrain/shared` (TS-42, RNF08).
 *
 * El paquete compartido es la fuente de verdad declarada; esta prueba evita que
 * el contrato publicado y el esquema compartido se separen sin que nadie lo
 * note: compara los límites que el equipo móvil leerá en `/api/docs` con los
 * que el propio código usa para validar.
 */
interface PropiedadOpenApi {
  minLength?: number;
  maxItems?: number;
  [clave: string]: unknown;
}
interface DocumentoOpenApi {
  components: { schemas: Record<string, { properties?: Record<string, PropiedadOpenApi> }> };
}

describe('Contrato OpenAPI ↔ @aquabrain/shared (TS-42)', () => {
  let app: INestApplication;
  let doc: DocumentoOpenApi;

  beforeAll(async () => {
    app = await crearApp();
    const respuesta = await request(app.getHttpServer()).get('/api/docs-json').expect(200);
    doc = respuesta.body as DocumentoOpenApi;
  });

  afterAll(async () => {
    await app.close();
  });

  it('publica el documento con los esquemas de entrada esperados', () => {
    expect(doc.components.schemas.LoginDto).toBeDefined();
    expect(doc.components.schemas.BulkMedicionesDto).toBeDefined();
    expect(doc.components.schemas.CrearUsuarioDto).toBeDefined();
  });

  it('el tope del lote publicado coincide con MAX_BULK_ITEMS', () => {
    const items = doc.components.schemas.BulkMedicionesDto.properties?.items;
    expect(items?.maxItems).toBe(MAX_BULK_ITEMS);
    expect(MAX_BULK_ITEMS).toBe(500);
  });

  it('la política de contraseña del login coincide en OpenAPI y shared', () => {
    const publicado = doc.components.schemas.LoginDto.properties?.password.minLength;
    const compartido = loginSchema.shape.password.minLength;
    expect(publicado).toBe(compartido);
    expect(compartido).toBe(10);
  });

  it('el alta de usuario publica `rolId` y la misma política de contraseña', () => {
    const propiedades = doc.components.schemas.CrearUsuarioDto.properties;
    expect(propiedades?.rolId).toBeDefined();
    // El rol nunca se deriva del token: se recibe como UUID.
    expect(usuarioCreateSchema.shape.rolId).toBeDefined();
    expect(propiedades?.password.minLength).toBe(usuarioCreateSchema.shape.password.minLength);
  });

  it('el esquema compartido es el que decide: rechaza contraseñas cortas', () => {
    expect(loginSchema.safeParse({ email: 'a@b.cl', password: '123456789' }).success).toBe(false);
    expect(loginSchema.safeParse({ email: 'a@b.cl', password: '1234567890' }).success).toBe(true);
  });
});
