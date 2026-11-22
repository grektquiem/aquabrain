import { useState, type FormEvent } from 'react';
import { useSesion } from '../sesion/ContextoSesion';

const KEY_RECORDAR = 'ab_recordar';
const KEY_EMAIL = 'ab_email_recordado';

export function PaginaLogin() {
  const { iniciar } = useSesion();
  const [email, setEmail] = useState(() => localStorage.getItem(KEY_EMAIL) ?? 'admin@aqua.cl');
  const [password, setPassword] = useState('');
  const [recordar, setRecordar] = useState(() => localStorage.getItem(KEY_RECORDAR) === '1');
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    setError(null);
    setEnviando(true);
    try {
      await iniciar(email.trim(), password, recordar);

      if (recordar) {
        localStorage.setItem(KEY_RECORDAR, '1');
        localStorage.setItem(KEY_EMAIL, email.trim());
      } else {
        localStorage.removeItem(KEY_RECORDAR);
        localStorage.removeItem(KEY_EMAIL);
      }
    } catch (fallo) {
      setError(fallo instanceof Error ? fallo.message : 'No fue posible iniciar sesión');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="acceso">
      <form className="acceso__caja" onSubmit={enviar}>
        <h1 className="acceso__marca">
          Aqua<span>Brain</span>
        </h1>
        <p className="acceso__lema">Monitoreo de cultivos aeropónicos · AquaPlants</p>

        <label className="campo">
          <span>Correo</span>
          <input
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>

        <label className="campo">
          <span>Contraseña</span>
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>

        <label className="campo campo--checkbox">
          <input
            type="checkbox"
            checked={recordar}
            onChange={(e) => setRecordar(e.target.checked)}
          />
          <span>Mantener sesión iniciada (30 días)</span>
        </label>

        {error && (
          <p className="aviso aviso--error" role="alert">
            {error}
          </p>
        )}

        <button className="boton boton--primario" type="submit" disabled={enviando}>
          {enviando ? 'Verificando…' : 'Entrar'}
        </button>

        <p className="acceso__ayuda">
          Demo: <code>admin@aqua.cl</code>, <code>supervisor@aqua.cl</code> o <code>encargado@aqua.cl</code>
          <br />
          Contraseña sembrada: <code>AquaPlants2026!</code>
        </p>
      </form>
    </div>
  );
}