import { NavLink, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { ProveedorSesion, useSesion } from './sesion/ContextoSesion';
import { PaginaLogin } from './paginas/Login';
import { PaginaPanel } from './paginas/Panel';
import { PaginaHistoricos } from './paginas/Historicos';
import { PaginaAlertas } from './paginas/Alertas';
import { API_URL } from './api/cliente';
import { BannerCookies } from './componentes/BannerCookies';

/** Rutas y armazón del dashboard. La sesión vive en memoria y se recupera del refresco. */
function Marco() {
  const { usuario, cargando, cerrar, puede } = useSesion();
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
          <NavLink to="/historicos">Históricos</NavLink>
          <NavLink to="/alertas">Alertas</NavLink>
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
          <Route path="/" element={<PaginaPanel />} />
          <Route path="/historicos" element={<PaginaHistoricos />} />
          <Route path="/alertas" element={puede('alerta:leer') ? <PaginaAlertas /> : <SinPermiso />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <footer className="pie">
        AquaPlants / AquaBrain · Unidad 4 (ES4) · panel conectado a <code>{API_URL}</code>
      </footer>
    </div>
  );
}

function SinPermiso() {
  return <p className="aviso">Su rol no tiene el permiso <code>alerta:leer</code>.</p>;
}

export function App() {
  return (
    <ProveedorSesion>
      <BannerCookies />
      <Marco />
    </ProveedorSesion>
  );
}
