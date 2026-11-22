import { useQuery } from '@tanstack/react-query';
import { peticion } from '../api/cliente';
import { formatearFecha } from '../componentes/InsigniaFrescura';

export function PaginaInforme() {
  // Consultamos el endpoint de reportes
  const { data, isLoading, isError } = useQuery({
    queryKey: ['reporte-resumen'],
    queryFn: () => peticion<any>('/reportes/resumen'),
  });

  if (isLoading) return <p className="estado-carga">Generando informe...</p>;
  if (isError || !data) return <p className="aviso aviso--error">Error al generar el informe.</p>;

  // Función para imprimir / guardar PDF
  const imprimirPDF = () => {
    window.print();
  };

  // Función para exportar a CSV con soporte para tildes (UTF-8) y Excel
  const exportarCSV = () => {
    const filas = [
      ['Métrica', 'Valor'],
      ['Sistemas Totales', data.sistemas],
      ['Dispositivos Totales', data.dispositivos.total],
      ['Dispositivos en Línea', data.dispositivos.enLinea],
      ['Alertas Activas', data.alertas.activas],
      ['Mediciones Registradas', data.mediciones.total],
    ];
    
    // 1. Unimos las filas con punto y coma (;) y saltos de línea de Windows (\r\n)
    const csvString = filas.map(e => e.join(";")).join("\r\n");
    
    // 2. Creamos el Blob pasando un Array para asegurar que el BOM UTF-8 se escriba primero.
    // "\uFEFF" = BOM UTF-8 (necesario para tildes/ñ)
    // "sep=;\r\n" = Le dice a Excel que use el punto y coma como separador
    const blob = new Blob(["\uFEFF", "sep=;\r\n", csvString], { 
      type: 'text/csv;charset=utf-8;' 
    });
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `informe_gestion_${new Date().toISOString().slice(0,10)}.csv`);
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="pila informe-pagina">
      {/* CABECERA DEL INFORME (se oculta al imprimir los botones) */}
      <header className="cabecera-seccion" style={{ marginBottom: 0 }}>
        <div>
          <h2 className="seccion__titulo">Informe de Gestión</h2>
          <p style={{ color: '#64748b' }}>Generado el {new Date().toLocaleString('es-CL')}</p>
        </div>
        <div className="no-imprimir" style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button className="boton boton--secundario" onClick={exportarCSV}>Exportar CSV</button>
          <button className="boton boton--primario" onClick={imprimirPDF}>Imprimir / PDF</button>
        </div>
      </header>

      {/* TARJETAS DE MÉTRICAS */}
      <section className="fila-tarjetas">
        <article className="indicador">
          <p className="indicador__etiqueta">Sistemas Registrados</p>
          <p className="indicador__valor">{data.sistemas}</p>
        </article>
        <article className="indicador">
          <p className="indicador__etiqueta">Dispositivos (En Línea / Total)</p>
          <p className="indicador__valor">
            {data.dispositivos.enLinea} <span className="indicador__total">/ {data.dispositivos.total}</span>
          </p>
        </article>
        <article className="indicador" style={{ borderColor: '#ef4444' }}>
          <p className="indicador__etiqueta">Alertas Activas</p>
          <p className="indicador__valor" style={{ color: '#ef4444' }}>{data.alertas.activas}</p>
        </article>
        <article className="indicador">
          <p className="indicador__etiqueta">Mediciones Procesadas</p>
          <p className="indicador__valor">{data.mediciones.total.toLocaleString('es-CL')}</p>
        </article>
      </section>

      {/* TABLA DE ÚLTIMAS ALERTAS */}
      <section>
        <h3 className="seccion__titulo">Últimas 5 alertas del sistema</h3>
        <div className="tabla-envoltura">
        <table className="tabla">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Severidad</th>
              <th>Sensor</th>
              <th>Mensaje</th>
            </tr>
          </thead>
          <tbody>
            {data.ultimasAlertas.map((alerta: any) => (
              <tr key={alerta.id}>
                <td>{formatearFecha(alerta.creadaEn)}</td>
                <td>
                  <span className={`pastilla pastilla--${alerta.severidad.toLowerCase()}`}>
                    {alerta.severidad}
                  </span>
                </td>
                <td className="mono">{alerta.sensor?.codigo || '—'}</td>
                <td>{alerta.mensaje}</td>
              </tr>
            ))}
            {data.ultimasAlertas.length === 0 && (
              <tr><td colSpan={4} style={{ textAlign: 'center' }}>No hay alertas registradas.</td></tr>
            )}
          </tbody>
        </table>
        </div>
      </section>
    </div>
  );
}