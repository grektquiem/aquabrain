/**
 * Tipos de la API (contrato publicado en `/api/docs-json`).
 *
 * Se declaran a mano y no con `@aquabrain/shared` porque el dashboard consume
 * **respuestas** ya persistidas (con proyecciones y agregados), mientras que el
 * paquete compartido modela las **entradas**. La correspondencia con los DTO se
 * verifica en la prueba e2e de contrato (TS-42).
 */

export type Severidad = 'ALTA' | 'MEDIA' | 'BAJA' | 'INFO';
export type EstadoAlerta = 'ACTIVA' | 'RESUELTA';
export type Frescura = 'EN_LINEA' | 'SIN_COMUNICACION' | 'INACTIVO' | 'DESCONOCIDO';

export interface Sesion {
  accessToken: string;
  refreshToken: string;
  usuario: {
    id: string;
    nombre: string;
    email: string;
    rol: string;
    permisos: string[];
  };
}

export interface ResumenSeveridad {
  severidad: Severidad;
  total: number;
}

export interface DispositivoEstado {
  id: string;
  codigo: string;
  firmware: string | null;
  sistema: { id: string; codigo: string; nombre: string } | null;
  sensores: number;
  intervaloReporteSeg: number;
  estadoAlmacenado: Frescura;
  frescura: Frescura;
  ultimaMedicion: string | null;
  segundosSinReportar: number | null;
  umbralSilencioSeg: number;
}

export interface SensorEstado {
  sensorId: string;
  valor: string | null;
  valorTexto: string | null;
  unidad: string | null;
  timestamp: string;
  sensor: { codigo: string; nombre: string } | null;
  dispositivo: { id: string; codigo: string } | null;
}

export interface EstadoDashboard {
  generadoEn: string;
  dispositivos: DispositivoEstado[];
  sensores: SensorEstado[];
  alertasActivas: ResumenSeveridad[];
}

export interface Alerta {
  id: string;
  tipo: string;
  severidad: Severidad;
  estado: EstadoAlerta;
  mensaje: string;
  valorDetectado: string | null;
  umbralAplicado: string | null;
  creadaEn: string;
  resueltaEn: string | null;
  comentarioResolucion: string | null;
  sensor: { id: string; codigo: string; nombre: string; unidad: string | null } | null;
  sistema: { id: string; codigo: string; nombre: string } | null;
  regla: { id: string; nombre: string } | null;
  usuarioResuelve: { id: string; nombre: string } | null;
}

export interface Paginacion {
  pagina: number;
  porPagina: number;
  total: number;
  paginas: number;
}

export interface ListadoAlertas {
  datos: Alerta[];
  paginacion: Paginacion;
}

export type Bucket = '5m' | '15m' | '1h' | '6h' | '1d';

export interface PuntoSerie {
  t: string;
  promedio: number;
  minimo: number;
  maximo: number;
  muestras: number;
}

export interface SerieSensor {
  sensor: {
    id: string;
    codigo: string;
    nombre: string;
    unidad: string | null;
    tipoVariable: { codigo: string; nombre: string } | null;
  };
  puntos: PuntoSerie[];
}

export interface RespuestaSerie {
  desde: string;
  hasta: string;
  bucket: Bucket;
  totalPuntos: number;
  series: SerieSensor[];
}

export interface ErrorApi {
  codigo: string;
  mensaje: string;
  detalles?: unknown;
  ruta?: string;
  timestamp?: string;
}
