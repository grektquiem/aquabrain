import { NavLink, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { ProveedorSesion, useSesion } from './sesion/ContextoSesion';
import { PaginaLogin } from './paginas/Login';
import { PaginaPanel } from './paginas/Panel';
import { PaginaHistoricos } from './paginas/Historicos';
import { PaginaAlertas } from './paginas/Alertas';
import { API_URL } from './api/cliente';
import { BannerCookies } from './componentes/BannerCookies';
import { PaginaSistemas } from './paginas/Sistemas';
import { PaginaInforme } from './paginas/Informe';

/** Rutas y armazón del dashboard. La sesión vive en memoria y se recupera del refresco. */
function Marco() {
  const { usuario, cargando, cerrar } = useSesion();
  const ubicacion = useLocation();

  if (cargando) {
    return <p className="estado-carga estado-carga--centrado">Restaurando la sesión…</p>;
  }

  if (!usuario) {
    return (
      <Routes>
        <Route path="/ingresar" element={<PaginaLogin />} />
        <Route path="*" element={<Navigate to="/ingresar" replace state={{ desde: ubicacion.pathname }} />} />
      </Routes>
    );
  }

  // Lógica de roles
  const esAdmin = usuario.rol === 'Administrador';
  const esSupervisor = usuario.rol === 'Supervisor';
  // El Encargado no necesita variable especial, ya que solo ve el Panel
  
  // Definimos quién puede ver las pestañas avanzadas (Admin y Supervisor)
  const puedeVerAvanzado = esAdmin || esSupervisor;

  return (
    <div className="marco">
      <header className="cabecera">
        <div className="cabecera__marca">
          Aqua<span>Brain</span>
          <small>AquaPlants</small>
        </div>
        <nav className="cabecera__nav">
          <NavLink to="/" end>
            Panel
          </NavLink>
          
          {/* 👇 Los Encargados NO ven estos enlaces */}
          {puedeVerAvanzado && (
            <>
              <NavLink to="/historicos">Históricos</NavLink>
              <NavLink to="/alertas">Alertas</NavLink>
              <NavLink to="/sistemas">Sistemas</NavLink>
              <NavLink to="/informe">Informe</NavLink>
            </>
          )}
        </nav>
        <div className="cabecera__sesion">
          <div>
            <p className="cabecera__nombre">{usuario.nombre}</p>
            <p className="cabecera__rol">{usuario.rol}</p>
          </div>
          <button className="boton" onClick={() => void cerrar()}>
            Salir
          </button>
        </div>
      </header>

      <main className="contenido">
        <Routes>
          {/* El Panel es visible para todos */}
          <Route path="/" element={<PaginaPanel />} />
          
          {/* Rutas protegidas: si el Encargado escribe la URL, lo devuelve al Panel */}
          <Route 
            path="/historicos" 
            element={puedeVerAvanzado ? <PaginaHistoricos /> : <Navigate to="/" replace />} 
          />
          <Route 
            path="/alertas" 
            element={puedeVerAvanzado ? <PaginaAlertas /> : <Navigate to="/" replace />} 
          />
          <Route 
            path="/sistemas" 
            element={puedeVerAvanzado ? <PaginaSistemas /> : <Navigate to="/" replace />} 
          />
          <Route 
            path="/informe" 
            element={puedeVerAvanzado ? <PaginaInforme /> : <Navigate to="/" replace />} 
          />
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <footer className="pie">
        AquaPlants / AquaBrain · Unidad 4 (ES4) · panel conectado a <code>{API_URL}</code>
      </footer>
    </div>
  );
}

export function App() {
  return (
    <ProveedorSesion>
      <BannerCookies />
      <Marco />
    </ProveedorSesion>
  );
}