/**
 * Cliente HTTP delgada sobre `fetch`.
 *
 * El token de acceso vive **solo en memoria** (nunca en `localStorage`, que es
 * legible por cualquier XSS); el token de refresco viaja en una cookie
 * `HttpOnly` que el navegador adjunta sola. Ante un `401` se intenta **un**
 * refresco y se reintenta la petición original (doc 06 §«sesiones»).
 */
import type { ErrorApi } from './tipos';

export const API_URL: string = import.meta.env.VITE_API_URL ?? '/api/v1';

export class ErrorHttp extends Error {
  constructor(
    readonly estado: number,
    readonly cuerpo: ErrorApi | null,
  ) {
    super(cuerpo?.mensaje ?? `Error ${estado}`);
    this.name = 'ErrorHttp';
  }
}

let tokenAcceso: string | null = null;
let refrescando: Promise<string | null> | null = null;

export function fijarToken(token: string | null): void {
  tokenAcceso = token;
}

export function tokenActual(): string | null {
  return tokenAcceso;
}

/** Devuelve el rol/permisos del usuario en sesión, decodificando el JWT. */
export function decodificarToken(token: string): { sub: string; email: string; rol: string } | null {
  try {
    const [, carga] = token.split('.');
    const json = atob(carga.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json) as { sub: string; email: string; rol: string };
  } catch {
    return null;
  }
}

async function refrescar(): Promise<string | null> {
  if (!refrescando) {
    refrescando = fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: '{}',
    })
      .then(async (r) => (r.ok ? ((await r.json()) as { accessToken: string }).accessToken : null))
      .catch(() => null)
      .finally(() => {
        refrescando = null;
      });
  }
  const nuevo = await refrescando;
  tokenAcceso = nuevo;
  return nuevo;
}

interface Opciones extends Omit<RequestInit, 'body'> {
  cuerpo?: unknown;
  /** Evita el bucle de refresco cuando la propia llamada es de autenticación. */
  sinRefresco?: boolean;
}

export async function peticion<T>(ruta: string, opciones: Opciones = {}): Promise<T> {
  const { cuerpo, sinRefresco, headers, ...resto } = opciones;

  const construir = (token: string | null): Promise<Response> =>
    fetch(`${API_URL}${ruta}`, {
      ...resto,
      credentials: 'include',
      headers: {
        ...(cuerpo !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
      body: cuerpo !== undefined ? JSON.stringify(cuerpo) : undefined,
    });

  let respuesta = await construir(tokenAcceso);

  if (respuesta.status === 401 && !sinRefresco) {
    const nuevo = await refrescar();
    if (nuevo) respuesta = await construir(nuevo);
  }

  if (respuesta.status === 204) return undefined as T;

  const texto = await respuesta.text();
  const datos = texto ? (JSON.parse(texto) as unknown) : null;

  if (!respuesta.ok) {
    throw new ErrorHttp(respuesta.status, datos as ErrorApi | null);
  }
  return datos as T;
}
