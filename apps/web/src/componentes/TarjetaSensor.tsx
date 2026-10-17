import type { SensorEstado } from '../api/tipos';
import { formatearHace } from './InsigniaFrescura';

/**
 * Tarjeta de una variable con su último valor.
 *
 * El `valor` viaja como cadena porque en la base es `numeric`: convertirlo a
 * `number` en el cliente perdería precisión en series largas.
 */
export function TarjetaSensor({ estado, segundosRefresco }: { estado: SensorEstado; segundosRefresco: number }) {
  const desactualizado = segundosRefresco > 900;
  return (
    <article className={`tarjeta ${desactualizado ? 'tarjeta--alerta' : ''}`}>
      <header className="tarjeta__cabecera">
        <div>
          <h3 className="tarjeta__titulo">{estado.sensor?.nombre ?? 'Sensor'}</h3>
          <p className="tarjeta__sub">
            {estado.sensor?.codigo} · {estado.dispositivo?.codigo}
          </p>
        </div>
      </header>
      <p className="tarjeta__valor">
        {estado.valor ?? estado.valorTexto ?? '—'}
        <span className="tarjeta__unidad">{estado.unidad ?? ''}</span>
      </p>
      <footer className="tarjeta__pie">{formatearHace(segundosRefresco)}</footer>
    </article>
  );
}
