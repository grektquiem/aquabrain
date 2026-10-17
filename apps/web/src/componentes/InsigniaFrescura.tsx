import type { Frescura } from '../api/tipos';

const ETIQUETAS: Record<Frescura, string> = {
  EN_LINEA: 'En línea',
  SIN_COMUNICACION: 'Sin comunicación',
  INACTIVO: 'Inactivo',
  DESCONOCIDO: 'Desconocido',
};

/**
 * Estado de conexión derivado en **lectura** (RN-05): el valor llega ya
 * calculado por la API, así que dos pestañas abiertas nunca discrepan.
 */
export function InsigniaFrescura({ frescura, titulo }: { frescura: Frescura; titulo?: string }) {
  return (
    <span className={`insignia insignia--${frescura.toLowerCase()}`} title={titulo}>
      <span className="insignia__punto" aria-hidden />
      {ETIQUETAS[frescura] ?? frescura}
    </span>
  );
}

export function formatearHace(segundos: number | null): string {
  if (segundos === null) return 'sin lecturas';
  if (segundos < 60) return `hace ${segundos} s`;
  if (segundos < 3600) return `hace ${Math.round(segundos / 60)} min`;
  if (segundos < 86400) return `hace ${Math.round(segundos / 3600)} h`;
  return `hace ${Math.round(segundos / 86400)} d`;
}

export function formatearFecha(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('es-CL', { dateStyle: 'short', timeStyle: 'medium' });
}
