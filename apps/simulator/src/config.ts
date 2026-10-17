/**
 * Configuración del simulador (variables de entorno, sin secretos en el código).
 *
 * El simulador sustituye al gateway ESP32-S3 mientras no hay hardware: habla el
 * mismo protocolo (`X-Device-Key` + `X-Device-Code`) y el mismo payload (MC-09).
 */

export type Modo = 'online' | 'offline' | 'anomalia';
export type Perfil = 'normal' | 'ola-de-calor' | 'sequia';

export interface OpcionesSimulador {
  apiUrl: string;
  deviceKey: string;
  deviceCode: string;
  /** Códigos de sensor a reportar (deben existir en el dispositivo). */
  sensores: string[];
  intervaloMs: number;
  /** 0 = sin límite (hasta Ctrl-C). */
  ticks: number;
  modo: Modo;
  perfil: Perfil;
  /** Cada cuántas lecturas se fuerza un valor fuera del rango declarado. */
  cadaAnomalia: number;
}

function entero(nombre: string, porDefecto: number): number {
  const crudo = process.env[nombre];
  if (!crudo) return porDefecto;
  const valor = Number.parseInt(crudo, 10);
  if (Number.isNaN(valor) || valor < 0) {
    throw new Error(`La variable ${nombre} debe ser un entero no negativo (recibido: ${crudo})`);
  }
  return valor;
}

export function leerConfiguracion(env: NodeJS.ProcessEnv = process.env): OpcionesSimulador {
  const deviceKey = env.DEVICE_KEY?.trim();
  const deviceCode = env.DEVICE_CODE?.trim();

  if (!deviceKey) throw new Error('Falta DEVICE_KEY (clave `ak_live_...` del dispositivo)');
  if (!deviceCode) throw new Error('Falta DEVICE_CODE (p. ej. DEV-01)');

  const modo = (env.MODO ?? 'online') as Modo;
  if (!['online', 'offline', 'anomalia'].includes(modo)) {
    throw new Error(`MODO inválido: ${modo} (use online | offline | anomalia)`);
  }
  const perfil = (env.PERFIL ?? 'normal') as Perfil;
  if (!['normal', 'ola-de-calor', 'sequia'].includes(perfil)) {
    throw new Error(`PERFIL inválido: ${perfil} (use normal | ola-de-calor | sequia)`);
  }

  const sensores = (env.SENSORES ?? 'TEMP-01,HUM-01,PH-01')
    .split(',')
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean);

  if (sensores.length === 0) throw new Error('SENSORES no puede estar vacío');

  return {
    apiUrl: (env.API_URL ?? 'http://localhost:3000/api/v1').replace(/\/+$/, ''),
    deviceKey,
    deviceCode,
    sensores,
    intervaloMs: entero('INTERVALO_SEG', 5) * 1000,
    ticks: entero('TICKS', 12),
    modo,
    perfil,
    cadaAnomalia: entero('CADA_ANOMALIA', 4),
  };
}
