import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { API_URL, peticion, tokenActual } from '../api/cliente';
import type { Bucket, EstadoDashboard, RespuestaSerie } from '../api/tipos';

const BUCKETS: Bucket[] = ['5m', '15m', '1h', '6h', '1d'];

function hace(dias: number): string {
  return new Date(Date.now() - dias * 86_400_000).toISOString();
}

function ahora(): string {
  return new Date().toISOString();
}

/**
 * Series históricas (RF08, HU09).
 *
 * El rango se limita a 90 días en el servidor; aquí se ofrecen atajos de 24 h,
 * 7 d y 30 d para que el usuario no escriba fechas a mano.
 */
export function PaginaHistoricos() {
  const { data: estado } = useQuery({
    queryKey: ['estado-sensores'],
    queryFn: () => peticion<EstadoDashboard>('/dashboard/estado'),
  });

  const [sensorId, setSensorId] = useState<string>('');
  const [bucket, setBucket] = useState<Bucket>('1h');
  const [desde, setDesde] = useState(hace(1));
  const [hasta, setHasta] = useState(ahora());

  const sensores = useMemo(() => {
    const vistos = new Set<string>();
    return (estado?.sensores ?? []).filter((s) => (vistos.has(s.sensorId) ? false : (vistos.add(s.sensorId), true)));
  }, [estado]);

  const seleccionado = sensorId || sensores[0]?.sensorId || '';

  const params = new URLSearchParams({ sensores: seleccionado, desde, hasta, bucket });
  const consultaActiva = Boolean(seleccionado) && new Date(desde) < new Date(hasta);

  const { data, isFetching, isError, error } = useQuery({
    queryKey: ['serie', seleccionado, desde, hasta, bucket],
    queryFn: () => peticion<RespuestaSerie>(`/mediciones/serie?${params.toString()}`),
    enabled: consultaActiva,
  });

  const serie = data?.series[0];
  const puntos = (serie?.puntos ?? []).map((p) => ({
    ...p,
    etiqueta: new Date(p.t).toLocaleString('es-CL', { dateStyle: 'short', timeStyle: 'short' }),
  }));

  async function exportarCsv() {
    const respuesta = await fetch(`${API_URL}/mediciones/exportar.csv?${params.toString()}`, {
      headers: { Authorization: `Bearer ${tokenActual() ?? ''}` },
      credentials: 'include',
    });
    if (!respuesta.ok) {
      window.alert(`No se pudo exportar (HTTP ${respuesta.status})`);
      return;
    }
    const blob = await respuesta.blob();
    const enlace = document.createElement('a');
    enlace.href = URL.createObjectURL(blob);
    const sensorCodigo = serie?.sensor.codigo ?? 'serie';
    const rangoDesde = desde.slice(0, 10);   // "2026-11-15"
    const rangoHasta = hasta.slice(0, 10);   // "2026-11-22"
    enlace.download = `aquabrain-${sensorCodigo}-${rangoDesde}_${rangoHasta}.csv`;
    enlace.click();
    URL.revokeObjectURL(enlace.href);
  }

  return (
    <div className="pila">
      <section className="barra-filtros barra-filtros--ancha">
        <label className="campo campo--linea">
          <span>Sensor</span>
          <select value={seleccionado} onChange={(e) => setSensorId(e.target.value)}>
            {sensores.map((s) => (
              <option key={s.sensorId} value={s.sensorId}>
                {s.sensor?.codigo} · {s.sensor?.nombre} ({s.dispositivo?.codigo})
              </option>
            ))}
          </select>
        </label>
        <label className="campo campo--linea">
          <span>Agrupación</span>
          <select value={bucket} onChange={(e) => setBucket(e.target.value as Bucket)}>
            {BUCKETS.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </label>
        <label className="campo campo--linea">
          <span>Desde</span>
          <input type="datetime-local" value={aLocal(desde)} onChange={(e) => setDesde(aIso(e.target.value))} />
        </label>
        <label className="campo campo--linea">
          <span>Hasta</span>
          <input type="datetime-local" value={aLocal(hasta)} onChange={(e) => setHasta(aIso(e.target.value))} />
        </label>
        <div className="barra-filtros__acciones">
          <button className="boton" onClick={() => { setDesde(hace(1)); setHasta(ahora()); }}>
            24 h
          </button>
          <button className="boton" onClick={() => { setDesde(hace(7)); setHasta(ahora()); }}>
            7 d
          </button>
          <button className="boton" onClick={() => { setDesde(hace(30)); setHasta(ahora()); }}>
            30 d
          </button>
          <button className="boton boton--primario" onClick={exportarCsv} disabled={!consultaActiva}>
            Exportar CSV
          </button>
        </div>
      </section>

      {isError && <p className="aviso aviso--error">{error instanceof Error ? error.message : 'Error al consultar la serie'}</p>}

      <section className="panel-grafico">
        <header className="panel-grafico__cabecera">
          <h2 className="seccion__titulo">
            {serie ? `${serie.sensor.nombre} (${serie.sensor.unidad ?? ''})` : 'Serie'}
          </h2>
          {data && (
            <p className="panel-grafico__meta">
              {data.totalPuntos} punto(s) · agrupación {data.bucket}
              {isFetching && ' · actualizando…'}
            </p>
          )}
        </header>

        {puntos.length === 0 ? (
          <p className="vacio">Sin datos en el rango seleccionado.</p>
        ) : (
          <ResponsiveContainer width="100%" height={380}>
            <ComposedChart data={puntos} margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="etiqueta" tick={{ fontSize: 11 }} minTickGap={40} />
              <YAxis tick={{ fontSize: 11 }} domain={['auto', 'auto']} width={54} />
              <Tooltip
                formatter={(valor: number, nombre: string) => [valor, nombre]}
                labelFormatter={(etiqueta) => etiqueta as string}
              />
              <Legend />
              <Area type="monotone" dataKey="maximo" name="Máximo" stroke="none" fill="#bfdbfe" fillOpacity={0.5} />
              <Area type="monotone" dataKey="minimo" name="Mínimo" stroke="none" fill="#ffffff" fillOpacity={0.9} />
              <Line type="monotone" dataKey="promedio" name="Promedio" stroke="#0e7490" strokeWidth={2} dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </section>
    </div>
  );
}

/** `datetime-local` trabaja en hora local: se convierte de ida y vuelta a ISO/UTC. */
function aLocal(iso: string): string {
  const fecha = new Date(iso);
  const desfase = fecha.getTimezoneOffset() * 60_000;
  return new Date(fecha.getTime() - desfase).toISOString().slice(0, 16);
}

function aIso(local: string): string {
  return new Date(local).toISOString();
}
