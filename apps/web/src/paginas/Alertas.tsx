import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { peticion } from '../api/cliente';
import type { EstadoAlerta, ListadoAlertas, Severidad } from '../api/tipos';
import { formatearFecha } from '../componentes/InsigniaFrescura';
import { useSesion } from '../sesion/ContextoSesion';

const POR_PAGINA = 10;

/** Bandeja de alertas (RF12/RF13, HU08): filtrar, paginar y resolver con comentario. */
export function PaginaAlertas() {
  const { puede } = useSesion();
  const cliente = useQueryClient();
  const [pagina, setPagina] = useState(1);
  const [estado, setEstado] = useState<EstadoAlerta | ''>('ACTIVA');
  const [severidad, setSeveridad] = useState<Severidad | ''>('');
  const [abierta, setAbierta] = useState<string | null>(null);
  const [comentario, setComentario] = useState('');

  const params = new URLSearchParams({ pagina: String(pagina), porPagina: String(POR_PAGINA) });
  if (estado) params.set('estado', estado);
  if (severidad) params.set('severidad', severidad);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['alertas', pagina, estado, severidad],
    queryFn: () => peticion<ListadoAlertas>(`/alertas?${params.toString()}`),
  });

  const resolver = useMutation({
    mutationFn: (id: string) =>
      peticion(`/alertas/${id}/resolver`, { method: 'POST', cuerpo: { comentario: comentario.trim() || undefined } }),
    onSuccess: () => {
      setAbierta(null);
      setComentario('');
      void cliente.invalidateQueries({ queryKey: ['alertas'] });
      void cliente.invalidateQueries({ queryKey: ['estado'] });
    },
  });

  return (
    <div className="pila">
      <section className="barra-filtros">
        <label className="campo campo--linea">
          <span>Estado</span>
          <select
            value={estado}
            onChange={(e) => {
              setEstado(e.target.value as EstadoAlerta | '');
              setPagina(1);
            }}
          >
            <option value="">Todas</option>
            <option value="ACTIVA">Activas</option>
            <option value="RESUELTA">Resueltas</option>
          </select>
        </label>
        <label className="campo campo--linea">
          <span>Severidad</span>
          <select
            value={severidad}
            onChange={(e) => {
              setSeveridad(e.target.value as Severidad | '');
              setPagina(1);
            }}
          >
            <option value="">Todas</option>
            <option value="ALTA">Alta</option>
            <option value="MEDIA">Media</option>
            <option value="BAJA">Baja</option>
            <option value="INFO">Info</option>
          </select>
        </label>
        {data && <p className="barra-filtros__total">{data.paginacion.total} alerta(s)</p>}
      </section>

      {isLoading && <p className="estado-carga">Cargando alertas…</p>}
      {isError && <p className="aviso aviso--error">Error: {error instanceof Error ? error.message : 'desconocido'}</p>}

      {data && data.datos.length === 0 && <p className="vacio">No hay alertas con estos filtros.</p>}

      {data && data.datos.length > 0 && (
        <ul className="lista-alertas">
          {data.datos.map((alerta) => (
            <li key={alerta.id} className={`alerta alerta--${alerta.severidad.toLowerCase()}`}>
              <div className="alerta__cuerpo">
                <div className="alerta__cabecera">
                  <span className={`pastilla pastilla--${alerta.severidad.toLowerCase()}`}>{alerta.severidad}</span>
                  <span className="alerta__tipo">{alerta.tipo}</span>
                  <span className="alerta__hora">{formatearFecha(alerta.creadaEn)}</span>
                </div>
                <p className="alerta__mensaje">{alerta.mensaje}</p>
                <p className="alerta__meta">
                  {alerta.sensor?.codigo ?? '—'} · {alerta.sistema?.nombre ?? '—'}
                  {alerta.umbralAplicado && <> · umbral {alerta.umbralAplicado}</>}
                  {alerta.estado === 'RESUELTA' && <> · resuelta por {alerta.usuarioResuelve?.nombre ?? '—'}</>}
                </p>
                {alerta.comentarioResolucion && <p className="alerta__comentario">“{alerta.comentarioResolucion}”</p>}
              </div>

              {alerta.estado === 'ACTIVA' && puede('alerta:resolver') && (
                <div className="alerta__acciones">
                  {abierta === alerta.id ? (
                    <>
                      <input
                        className="entrada"
                        placeholder="Comentario de resolución (opcional)"
                        value={comentario}
                        onChange={(e) => setComentario(e.target.value)}
                        maxLength={500}
                      />
                      <button
                        className="boton boton--primario"
                        onClick={() => resolver.mutate(alerta.id)}
                        disabled={resolver.isPending}
                      >
                        {resolver.isPending ? 'Guardando…' : 'Confirmar'}
                      </button>
                      <button className="boton" onClick={() => setAbierta(null)}>
                        Cancelar
                      </button>
                    </>
                  ) : (
                    <button className="boton" onClick={() => setAbierta(alerta.id)}>
                      Resolver
                    </button>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {data && data.paginacion.paginas > 1 && (
        <nav className="paginacion">
          <button className="boton" onClick={() => setPagina((p) => Math.max(1, p - 1))} disabled={pagina <= 1}>
            ← Anterior
          </button>
          <span>
            Página {data.paginacion.pagina} de {data.paginacion.paginas}
          </span>
          <button
            className="boton"
            onClick={() => setPagina((p) => Math.min(data.paginacion.paginas, p + 1))}
            disabled={pagina >= data.paginacion.paginas}
          >
            Siguiente →
          </button>
        </nav>
      )}

      {resolver.isError && (
        <p className="aviso aviso--error">No se pudo resolver: {resolver.error instanceof Error ? resolver.error.message : 'error'}</p>
      )}
    </div>
  );
}
