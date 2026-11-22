import { useEffect, useState } from 'react';

const KEY = 'ab_cookies_consent_v1';

export function BannerCookies() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(KEY) === null) setVisible(true);
  }, []);

  function aceptar(valor: 'todas' | 'necesarias') {
    localStorage.setItem(KEY, valor);
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="banner-cookies" role="dialog" aria-label="Consentimiento de cookies">
      <div className="banner-cookies__texto">
        <strong>🍪 Cookies en AquaBrain</strong>
        <p>
          Usamos una cookie técnica (<code>ab_refresh</code>) para mantener tu sesión iniciada.
          No usamos cookies de seguimiento ni publicidad.
        </p>
      </div>
      <div className="banner-cookies__acciones">
        <button className="boton" onClick={() => aceptar('necesarias')}>
          Solo necesarias
        </button>
        <button className="boton boton--primario" onClick={() => aceptar('todas')}>
          Aceptar todas
        </button>
      </div>
    </div>
  );
}