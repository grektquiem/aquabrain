import { useQuery } from '@tanstack/react-query';
import { peticion } from '../api/cliente';
import type { EstadoDashboard } from '../api/tipos';
import { InsigniaFrescura, formatearFecha, formatearHace } from '../componentes/InsigniaFrescura';
import { TarjetaSensor } from '../componentes/TarjetaSensor';

const INTERVALO_MS = 15_000;

/** Panel en vivo (RF07): estado de dispositivos, última lectura y alertas activas. */
export function PaginaPanel() {
  const { data, isLoading, isError, error, dataUpdatedAt } = useQuery({
    queryKey: ['estado'],
    queryFn: () => peticion<EstadoDashboard>('/dashboard/estado'),
    refetchInterval: INTERVALO_MS,
  });

  if (isLoading) return <p className="estado-carga">Cargando el estado del sistema…</p>;
  if (isError || !data) {
    return <p className="aviso aviso--error">No fue posible obtener el estado: {error instanceof Error ? error.message : 'error'}</p>;
  }

  const ahora = Date.now();
  const enLinea = data.dispositivos.filter((d) => d.frescura === 'EN_LINEA').length;
  const alertas = data.alertasActivas.reduce((suma, a) => suma + a.total, 0);
  const criticas = data.alertasActivas.filter((a) => a.severidad === 'ALTA').reduce((s, a) => s + a.total, 0);

  return (
    <div className="pila">
      <section className="fila-tarjetas">
        <article className="indicador">
          <p className="indicador__etiqueta">Dispositivos en línea</p>
          <p className="indicador__valor">
            {enLinea}
            <span className="indicador__total">/ {data.dispositivos.length}</span>
          </p>
        </article>
        <article className="indicador">
          <p className="indicador__etiqueta">Variables monitoreadas</p>
          <p className="indicador__valor">{data.sensores.length}</p>
        </article>
        <article className={`indicador ${criticas > 0 ? 'indicador--critico' : ''}`}>
          <p className="indicador__etiqueta">Alertas activas</p>
          <p className="indicador__valor">
            {alertas}
            {criticas > 0 && <span className="indicador__total"> · {criticas} alta(s)</span>}
          </p>
        </article>
        <article className="indicador">
          <p className="indicador__etiqueta">Última actualización</p>
          <p className="indicador__valor indicador__valor--texto">{formatearFecha(new Date(dataUpdatedAt).toISOString())}</p>
        </article>
      </section>

      <section>
        <h2 className="seccion__titulo">Dispositivos</h2>
        <div className="tabla-envoltura">
          <table className="tabla">
            <thead>
              <tr>
                <th>Dispositivo</th>
                <th>Instalación</th>
                <th>Firmware</th>
                <th>Sensores</th>
                <th>Última lectura</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {data.dispositivos.map((dispositivo) => (
                <tr key={dispositivo.id}>
                  <td className="mono">{dispositivo.codigo}</td>
                  <td>{dispositivo.sistema?.nombre ?? '—'}</td>
                  <td className="mono">{dispositivo.firmware ?? '—'}</td>
                  <td>{dispositivo.sensores}</td>
                  <td title={formatearFecha(dispositivo.ultimaMedicion)}>{formatearHace(dispositivo.segundosSinReportar)}</td>
                  <td>
                    <InsigniaFrescura
                      frescura={dispositivo.frescura}
                      titulo={`Umbral de silencio: ${dispositivo.umbralSilencioSeg} s`}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="seccion__titulo">Últimas lecturas por variable</h2>
        <div className="rejilla-tarjetas">
          {data.sensores.map((estado) => (
            <TarjetaSensor
              key={estado.sensorId}
              estado={estado}
              segundosRefresco={Math.max(0, Math.round((ahora - new Date(estado.timestamp).getTime()) / 1000))}
            />
          ))}
        </div>
      </section>

      <section>
        <h2 className="seccion__titulo">Alertas activas por severidad</h2>
        {data.alertasActivas.length === 0 ? (
          <p className="vacio">Sin alertas activas.</p>
        ) : (
          <ul className="lista-severidad">
            {data.alertasActivas.map((a) => (
              <li key={a.severidad} className={`pastilla pastilla--${a.severidad.toLowerCase()}`}>
                {a.severidad}: <strong>{a.total}</strong>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
