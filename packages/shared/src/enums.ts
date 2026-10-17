/**
 * @aquabrain/shared — Enumeraciones del dominio.
 *
 * Reflejan 1:1 los `TYPE`/`ENUM` nativos de PostgreSQL definidos en
 * `docs/ES2/aquaplants_schema.sql` y el modelo Prisma de `apps/api/prisma/schema.prisma`.
 * Fuente de verdad documental: `docs/ES2/05-modelo-de-datos.md` §3.
 */

export const ESTADO_SISTEMA = ['ACTIVO', 'MANTENCION', 'INACTIVO'] as const;
export type EstadoSistema = (typeof ESTADO_SISTEMA)[number];

export const ESTADO_CULTIVO = ['ACTIVO', 'COSECHADO', 'CERRADO'] as const;
export type EstadoCultivo = (typeof ESTADO_CULTIVO)[number];

export const ESTADO_PLANTA = ['SANA', 'EN_RIESGO', 'RETIRADA'] as const;
export type EstadoPlanta = (typeof ESTADO_PLANTA)[number];

export const ESTADO_CONEXION = ['EN_LINEA', 'SIN_COMUNICACION', 'INACTIVO', 'DESCONOCIDO'] as const;
export type EstadoConexion = (typeof ESTADO_CONEXION)[number];

export const ORIGEN_DATO = ['REAL', 'SIMULADO'] as const;
export type OrigenDato = (typeof ORIGEN_DATO)[number];

export const ORIGEN_MEDICION = ['ONLINE', 'OFFLINE', 'MANUAL'] as const;
export type OrigenMedicion = (typeof ORIGEN_MEDICION)[number];

export const CALIDAD_MEDICION = ['OK', 'SOSPECHOSA', 'ANULADA'] as const;
export type CalidadMedicion = (typeof CALIDAD_MEDICION)[number];

export const OPERADOR_REGLA = [
  'MAYOR_QUE',
  'MENOR_QUE',
  'FUERA_DE_RANGO',
  'DENTRO_DE_RANGO',
  'SIN_DATOS',
] as const;
export type OperadorRegla = (typeof OPERADOR_REGLA)[number];

export const SEVERIDAD = ['ALTA', 'MEDIA', 'BAJA', 'INFO'] as const;
export type Severidad = (typeof SEVERIDAD)[number];

export const ESTADO_ALERTA = ['ACTIVA', 'RESUELTA'] as const;
export type EstadoAlerta = (typeof ESTADO_ALERTA)[number];

export const TIPO_ALERTA = ['UMBRAL', 'SIN_COMUNICACION', 'SINCRONIZACION', 'ERROR_DISPOSITIVO'] as const;
export type TipoAlerta = (typeof TIPO_ALERTA)[number];

export const TIPO_EVENTO = [
  'SIN_COMUNICACION',
  'RECONEXION',
  'REINTENTO_SINCRONIZACION',
  'ERROR_SENSOR',
  'CAMBIO_CONFIGURACION',
  'DESPLIEGUE',
] as const;
export type TipoEvento = (typeof TIPO_EVENTO)[number];

export const SEVERIDAD_ORDEN: Record<Severidad, number> = { ALTA: 0, MEDIA: 1, BAJA: 2, INFO: 3 };

/** Códigos de variable monitoreados (doc 05 §3.3). */
export const CODIGO_TIPO_VARIABLE = ['TEMPERATURA', 'HUMEDAD', 'DISTANCIA', 'PH', 'CAUDAL'] as const;
export type CodigoTipoVariable = (typeof CODIGO_TIPO_VARIABLE)[number];

/** Nombres de rol (doc 05 §3.1, doc 06 §3.3). */
export const ROL = ['Administrador', 'Supervisor', 'Encargado de cultivo'] as const;
export type RolNombre = (typeof ROL)[number];
