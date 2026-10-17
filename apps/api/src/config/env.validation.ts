import { z } from 'zod';

/**
 * Validación del entorno al arrancar (doc 06 §5). Si falta un secreto o una
 * variable es inválida, el proceso **no** arranca (fallo seguro).
 */
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  API_PREFIX: z.string().default('api/v1'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),

  DATABASE_URL: z.string().min(1, 'DATABASE_URL es obligatoria'),

  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET debe tener ≥32 caracteres'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET debe tener ≥32 caracteres'),
  JWT_ACCESS_TTL: z.string().default('15m'),
  JWT_REFRESH_TTL: z.string().default('7d'),
  BCRYPT_COST: z.coerce.number().int().min(10).max(15).default(12),
  DEVICE_KEY_PEPPER: z.string().min(16).default('aquabrain_devices'),

  ALERT_SILENCE_FACTOR: z.coerce.number().positive().default(3),
  MAX_TIMESTAMP_SKEW: z.string().default('5m'),
  BODY_LIMIT: z.string().default('1mb'),

  CORS_ORIGINS: z.string().default('http://localhost:5173'),
});

export type Env = z.infer<typeof envSchema>;

/** `validate` para `ConfigModule.forRoot` (falla el arranque si el entorno no es válido). */
export function validateEnv(config: Record<string, unknown>): Record<string, unknown> {
  const parsed = envSchema.safeParse(config);
  if (!parsed.success) {
    const detalle = parsed.error.issues.map((i) => `  · ${i.path.join('.')}: ${i.message}`).join('\n');
    throw new Error(`Entorno inválido:\n${detalle}`);
  }
  return { ...config, ...parsed.data };
}

export { envSchema };
