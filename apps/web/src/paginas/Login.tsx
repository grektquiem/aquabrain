import { useState, type FormEvent } from 'react';
import { useSesion } from '../sesion/ContextoSesion';

/**
 * Pantalla de acceso. Las cuentas de demostración están sembradas por
 * `prisma/seed.ts`; la contraseña se escribe siempre (nunca se precarga).
 */
export function PaginaLogin() {
  const { iniciar } = useSesion();
  const [email, setEmail] = useState('admin@aqua.cl');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    setError(null);
    setEnviando(true);
    try {
      await iniciar(email.trim(), password);
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
