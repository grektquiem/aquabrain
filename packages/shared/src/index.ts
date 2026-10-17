/**
 * @aquabrain/shared — Esquemas de validación (Zod).
 *
 * Una sola fuente de verdad para validar en el backend, el simulador y los
 * formularios del frontend (doc 03 §2: "`packages/shared` como única fuente de
 * verdad"; RNF08 interoperabilidad API-first).
 */
import { z } from 'zod';
import { ESTADO_SISTEMA, ORIGEN_MEDICION, OPERADOR_REGLA, SEVERIDAD } from './enums';

/** Tolerancia para rechazar `timestamp` futuros (RN-09, env MAX_TIMESTAMP_SKEW). */
export const MAX_TIMESTAMP_SKEW_MS = 5 * 60 * 1000;

/** Idempotencia: el flujo offline reenvía con el mismo `id_externo` (HU10, MC-08). */
export const MAX_BULK_ITEMS = 500;

export const uuid = z.string().uuid();
export const iso = z.string().datetime({ offset: true });

export const loginSchema = z.object({
  email: z.string().email().max(180),
  // Política de contraseña (doc 06 §2.1): mínimo 10 caracteres.
  password: z.string().min(10).max(128),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(20).optional(),
});

export const usuarioCreateSchema = z.object({
  nombre: z.string().min(3).max(120),
  email: z.string().email().max(180),
  password: z.string().min(10).max(128),
  // El rol nunca se toma del token: la API lo recibe como `rolId` (doc 06 §3.4).
  rolId: uuid,
});

export const usuarioUpdateSchema = usuarioCreateSchema
  .omit({ password: true })
  .partial()
  .extend({ activo: z.boolean().optional(), password: z.string().min(10).max(128).optional() });

export const sistemaSchema = z.object({
  codigo: z.string().min(2).max(30),
  nombre: z.string().min(3).max(120),
  descripcion: z.string().max(255).optional(),
  ubicacion: z.string().max(80).optional(),
  latitud: z.number().min(-90).max(90).optional(),
  longitud: z.number().min(-180).max(180).optional(),
  estado: z.enum(ESTADO_SISTEMA).optional(),
});

export const dispositivoSchema = z.object({
  sistemaId: uuid,
  codigo: z.string().min(2).max(40),
  modelo: z.string().max(60).optional(),
  firmware: z.string().max(30).optional(),
  intervaloReporteSeg: z.number().int().positive().optional(),
});

export const sensorSchema = z.object({
  dispositivoId: uuid,
  tipoVariableCodigo: z.string().min(2).max(30),
  codigo: z.string().min(1).max(40),
  nombre: z.string().min(2).max(80),
  unidad: z.string().min(1).max(20),
  rangoMin: z.number().optional(),
  rangoMax: z.number().optional(),
  ubicacionFisica: z.string().max(80).optional(),
});

export const reglaSchema = z
  .object({
    nombre: z.string().min(3).max(120),
    sensorId: uuid.optional(),
    tipoVariableCodigo: z.string().min(2).max(30).optional(),
    operador: z.enum(OPERADOR_REGLA),
    umbralMin: z.number().optional(),
    umbralMax: z.number().optional(),
    severidad: z.enum(SEVERIDAD),
    cooldownSeg: z.number().int().min(60).optional(),
    activa: z.boolean().optional(),
  })
  // XOR (RN-07): exactamente uno de los dos alcances.
  .refine((r) => Boolean(r.sensorId) !== Boolean(r.tipoVariableCodigo), {
    message: 'Debe indicar sensorId o tipoVariableCodigo, pero no ambos (RN-07)',
    path: ['sensorId'],
  });

/** Payload del firmware real (ESP32-S3) y del simulador (RN-11, MC-09). */
export const medicionSchema = z.object({
  sensorId: uuid.optional(),
  sensorCodigo: z.string().max(40).optional(),
  valor: z.number().optional(),
  valorTexto: z.string().max(120).optional(),
  unidad: z.string().max(20).optional(),
  timestamp: iso,
  idExterno: z.string().max(80).optional(),
  origen: z.enum(ORIGEN_MEDICION).optional(),
});

export const medicionBulkSchema = z.object({
  items: z.array(medicionSchema).min(1).max(MAX_BULK_ITEMS),
});

export const probarReglaSchema = z.object({
  valor: z.number(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type UsuarioCreateInput = z.infer<typeof usuarioCreateSchema>;
export type SistemaInput = z.infer<typeof sistemaSchema>;
export type DispositivoInput = z.infer<typeof dispositivoSchema>;
export type SensorInput = z.infer<typeof sensorSchema>;
export type ReglaInput = z.infer<typeof reglaSchema>;
export type MedicionInput = z.infer<typeof medicionSchema>;
export type MedicionBulkInput = z.infer<typeof medicionBulkSchema>;
