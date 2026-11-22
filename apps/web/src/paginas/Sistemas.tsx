import { useState, type FormEvent } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { peticion } from '../api/cliente';
import type { EstadoSistema } from '../api/tipos';
import { useSesion } from '../sesion/ContextoSesion';

export interface Sistema {
  id: string;
  codigo: string;
  nombre: string;
  ubicacion: string | null;
  estado: EstadoSistema;
  creadoEn: string;
}

export function PaginaSistemas() {
  const cliente = useQueryClient();
  const { usuario } = useSesion();
  
  // Lógica de roles: solo el Administrador puede crear, editar o eliminar
  const esAdmin = usuario?.rol === 'Administrador';

  const [modalAbierto, setModalAbierto] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  
  // Campos del formulario
  const [codigo, setCodigo] = useState(''); 
  const [nombre, setNombre] = useState('');
  const [ubicacion, setUbicacion] = useState('');
  const [estado, setEstado] = useState<EstadoSistema>('ACTIVO');
  const [error, setError] = useState<string | null>(null);

  const { data: sistemas, isLoading, isError, error: errorCarga } = useQuery({
    queryKey: ['sistemas'],
    queryFn: () => peticion<Sistema[]>('/sistemas?incluirInactivos=true'),
  });

  const crear = useMutation({
    mutationFn: (nuevo: Partial<Sistema>) => peticion('/sistemas', { method: 'POST', cuerpo: nuevo }),
    onSuccess: () => {
      cliente.invalidateQueries({ queryKey: ['sistemas'] });
      cerrarModal();
    },
    onError: (err: any) => setError(err.message || 'Error al crear el sistema'),
  });

  const actualizar = useMutation({
    mutationFn: (datos: { id: string; cambios: Partial<Sistema> }) => 
      peticion(`/sistemas/${datos.id}`, { method: 'PATCH', cuerpo: datos.cambios }),
    onSuccess: () => {
      cliente.invalidateQueries({ queryKey: ['sistemas'] });
      cerrarModal();
    },
    onError: (err: any) => setError(err.message || 'Error al actualizar el sistema'),
  });

  const eliminar = useMutation({
    mutationFn: (id: string) =>
      peticion<{ nombre: string; eliminado: boolean }>(`/sistemas/${id}`, { method: 'DELETE' }),
    onSuccess: (res) => {
      cliente.invalidateQueries({ queryKey: ['sistemas'] });
      if (!res.eliminado) {
        alert(
          `El sistema "${res.nombre}" tiene dispositivos, cultivos o histórico vinculado, ` +
            'por lo que se desactivó en lugar de eliminarse.',
        );
      }
    },
    onError: (err: any) => alert(err.message || 'Error al eliminar el sistema'),
  });

  function abrirCrear() {
    setEditandoId(null);
    setCodigo('');
    setNombre('');
    setUbicacion('');
    setEstado('ACTIVO');
    setError(null);
    setModalAbierto(true);
  }

  function abrirEditar(sistema: Sistema) {
    setEditandoId(sistema.id);
    setCodigo(sistema.codigo); 
    setNombre(sistema.nombre);
    setUbicacion(sistema.ubicacion || '');
    setEstado(sistema.estado);
    setError(null);
    setModalAbierto(true);
  }

  function cerrarModal() {
    setModalAbierto(false);
    setError(null);
  }

  function guardar(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const payload = { codigo, nombre, ubicacion: ubicacion || null, estado };

    if (editandoId) {
      actualizar.mutate({ id: editandoId, cambios: payload });
    } else {
      crear.mutate(payload);
    }
  }

  function confirmarEliminar(id: string, nombre: string) {
    if (
      window.confirm(
        `¿Estás seguro de eliminar el sistema "${nombre}"?\n\n` +
          'Si tiene dispositivos, cultivos o histórico vinculado, se desactivará en lugar de eliminarse.',
      )
    ) {
      eliminar.mutate(id);
    }
  }

  if (isLoading) return <p className="estado-carga">Cargando sistemas...</p>;
  if (isError) return <p className="aviso aviso--error">Error al cargar: {(errorCarga as any)?.message || 'No se pudo conectar'}</p>;

  return (
    <div className="pila">
      <header className="cabecera-seccion" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2 className="seccion__titulo">Gestión de Sistemas</h2>
        
        {/* Solo el Administrador ve el botón de Crear */}
        {esAdmin && (
          <button className="boton boton--primario" onClick={abrirCrear}>
            + Nuevo Sistema
          </button>
        )}
      </header>

      <div className="tabla-envoltura">
        <table className="tabla">
          <thead>
            <tr>
              <th>Código</th>
              <th>Nombre</th>
              <th>Ubicación</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {(!sistemas || sistemas.length === 0) && (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: '2rem' }}>No hay sistemas.</td></tr>
            )}
            {sistemas?.map((sis) => (
              <tr key={sis.id}>
                <td className="mono">{sis.codigo}</td>
                <td><strong>{sis.nombre}</strong></td>
                <td>{sis.ubicacion || '—'}</td>
                <td>
                  <span className={`pastilla pastilla--${sis.estado === 'ACTIVO' ? 'ok' : 'info'}`}>
                    {sis.estado}
                  </span>
                </td>
                <td>
                  {/* Solo el Administrador ve los botones de Editar y Eliminar */}
                  {esAdmin ? (
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="boton boton--secundario" onClick={() => abrirEditar(sis)}>Editar</button>
                      <button className="boton boton--peligro" onClick={() => confirmarEliminar(sis.id, sis.nombre)}>Eliminar</button>
                    </div>
                  ) : (
                    <span style={{ color: '#64748b', fontSize: '0.875rem' }}>Solo lectura</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalAbierto && (
        <div className="modal-fondo" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
          <div className="modal-caja" style={{ background: 'white', padding: '2rem', borderRadius: '0.5rem', width: '100%', maxWidth: '400px' }}>
            <h3>{editandoId ? 'Editar Sistema' : 'Nuevo Sistema'}</h3>
            
            <form onSubmit={guardar} className="pila" style={{ marginTop: '1rem' }}>
              
              <label className="campo" style={{ display: 'block', marginBottom: '1rem' }}>
                <span>Código (Ej. SIS-01)</span>
                <input 
                  type="text" 
                  value={codigo} 
                  onChange={(e) => setCodigo(e.target.value.toUpperCase())} 
                  required 
                  maxLength={30}
                  placeholder="SIS-01"
                  style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
                />
              </label>

              <label className="campo" style={{ display: 'block', marginBottom: '1rem' }}>
                <span>Nombre</span>
                <input 
                  type="text" 
                  value={nombre} 
                  onChange={(e) => setNombre(e.target.value)} 
                  required 
                  placeholder="Ej. Invernadero Norte"
                  style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
                />
              </label>

              <label className="campo" style={{ display: 'block', marginBottom: '1rem' }}>
                <span>Ubicación</span>
                <input 
                  type="text" 
                  value={ubicacion} 
                  onChange={(e) => setUbicacion(e.target.value)} 
                  placeholder="Ej. Sector A"
                  style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
                />
              </label>

              <label className="campo" style={{ display: 'block', marginBottom: '1rem' }}>
                <span>Estado</span>
                <select 
                  value={estado} 
                  onChange={(e) => setEstado(e.target.value as EstadoSistema)}
                  style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
                >
                  <option value="ACTIVO">Activo</option>
                  <option value="INACTIVO">Inactivo</option>
                  <option value="MANTENCION">Mantenimiento</option> 
                </select>
              </label>

              {error && <p className="aviso aviso--error" style={{ color: 'red', marginTop: '1rem' }}>{error}</p>}

              <div className="modal-acciones" style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                <button type="button" className="boton" onClick={cerrarModal}>Cancelar</button>
                <button type="submit" className="boton boton--primario" disabled={crear.isPending || actualizar.isPending}>
                  {crear.isPending || actualizar.isPending ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}