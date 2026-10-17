import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { fijarToken, peticion } from '../api/cliente';
import type { Sesion } from '../api/tipos';

interface EstadoSesion {
  usuario: Sesion['usuario'] | null;
  cargando: boolean;
  iniciar: (email: string, password: string) => Promise<void>;
  cerrar: () => Promise<void>;
  puede: (permiso: string) => boolean;
}

const Contexto = createContext<EstadoSesion | null>(null);

/** Guarda la sesión en memoria y ofrece el helper `puede(permiso)`. */
export function ProveedorSesion({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Sesion['usuario'] | null>(null);
  const [cargando, setCargando] = useState(true);

  // Al recargar, la cookie de refresco permite recuperar la sesión sin volver a
  // pedir credenciales: `/auth/refresh` devuelve token **y** usuario.
  useEffect(() => {
    let vigente = true;
    peticion<Sesion>('/auth/refresh', { method: 'POST', cuerpo: {}, sinRefresco: true })
      .then((sesion) => {
        if (!vigente) return;
        fijarToken(sesion.accessToken);
        setUsuario(sesion.usuario ?? null);
      })
      .catch(() => {
        fijarToken(null);
      })
      .finally(() => {
        if (vigente) setCargando(false);
      });
    return () => {
      vigente = false;
    };
  }, []);

  const iniciar = useCallback(async (email: string, password: string) => {
    const sesion = await peticion<Sesion>('/auth/login', {
      method: 'POST',
      cuerpo: { email, password },
      sinRefresco: true,
    });
    fijarToken(sesion.accessToken);
    setUsuario(sesion.usuario);
  }, []);

  const cerrar = useCallback(async () => {
    try {
      await peticion('/auth/logout', { method: 'POST', cuerpo: {}, sinRefresco: true });
    } finally {
      fijarToken(null);
      setUsuario(null);
    }
  }, []);

  const puede = useCallback((permiso: string) => usuario?.permisos.includes(permiso) ?? false, [usuario]);

  const valor = useMemo(() => ({ usuario, cargando, iniciar, cerrar, puede }), [usuario, cargando, iniciar, cerrar, puede]);

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useSesion(): EstadoSesion {
  const contexto = useContext(Contexto);
  if (!contexto) throw new Error('useSesion debe usarse dentro de <ProveedorSesion>');
  return contexto;
}
