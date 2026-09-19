import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input, Button } from '@nextui-org/react';
import logoImage from '../assets/logo.png';
import { C } from '../theme';
import { rutaInicio, useAuth } from '../auth/AuthContext';
import { mensajeDeError } from '../api/cliente';

// HU-01 — inicio de sesión real contra POST /auth/login (Sprint 1).
// Las credenciales de ayuda solo aparecen en desarrollo (npm run dev): son las
// del seed del backend y nunca se muestran en la versión de producción.
const CREDENCIALES_DESARROLLO = [
  { email: 'admin@laspalmas.com', password: 'adminlaspalmas', etiqueta: 'Admin', fondo: C.ink },
  { email: 'operador@laspalmas.com', password: 'operadorlaspalmas', etiqueta: 'Operador', fondo: C.ball2 },
];

export default function Login() {
  const { iniciarSesion, aviso } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mostrar, setMostrar] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function intentar(e: FormEvent) {
    e.preventDefault();
    if (loading || !email.trim() || !password) return;
    setError(null);
    setLoading(true);
    try {
      const usuario = await iniciarSesion(email.trim(), password);
      navigate(rutaInicio(usuario), { replace: true });
    } catch (err) {
      setError(mensajeDeError(err));
      setLoading(false);
    }
  }

  const inputClassNames = {
    inputWrapper: `rounded-lg border-2 h-16 bg-white shadow-none data-[hover=true]:bg-white group-data-[focus=true]:bg-white ${error ? 'border-ball3' : 'border-ink'}`,
    input: 't-body-l',
  };
  const deshabilitado = loading || !email.trim() || !password;

  return (
    <div className="min-h-full flex flex-col items-center justify-center py-12 px-4" style={{ background: '#FAFAF7' }}>
      <div className="mb-10">
        <img src={logoImage} alt="Billares Las Palmas" style={{ width: 200, objectFit: 'contain' }} />
      </div>

      <div className="w-full max-w-[480px] rounded-lg p-10 border-2 shadow-sticker" style={{ background: '#FFFFFF', borderColor: C.ink }}>
        <h1 className="t-title text-center mb-8" style={{ color: C.ink }}>
          Iniciar sesión
        </h1>

        {aviso && !error && (
          <p className="t-body text-center mb-5 rounded-lg border-2 px-4 py-3" style={{ color: C.ink, borderColor: C.ball5, background: C.tint5, fontSize: 15 }}>
            {aviso}
          </p>
        )}

        <form onSubmit={intentar} className="space-y-5">
          <div>
            <label className="t-caption block mb-1.5" style={{ color: C.inkFaint }}>
              Correo electrónico
            </label>
            <Input
              type="email"
              autoFocus
              autoComplete="username"
              value={email}
              onValueChange={(v) => {
                setEmail(v);
                setError(null);
              }}
              placeholder="usuario@laspalmas.com"
              classNames={inputClassNames}
            />
          </div>

          <div>
            <label className="t-caption block mb-1.5" style={{ color: C.inkFaint }}>
              Contraseña
            </label>
            <Input
              type={mostrar ? 'text' : 'password'}
              autoComplete="current-password"
              value={password}
              onValueChange={(v) => {
                setPassword(v);
                setError(null);
              }}
              placeholder="••••••••••••••"
              classNames={inputClassNames}
              endContent={
                <button type="button" onClick={() => setMostrar((v) => !v)} className="t-caption" style={{ color: C.inkFaint }}>
                  {mostrar ? 'Ocultar' : 'Mostrar'}
                </button>
              }
            />
          </div>

          {error && (
            <p role="alert" className="t-body text-center" style={{ color: C.ball3, fontSize: 16 }}>
              {error}
            </p>
          )}

          <Button
            type="submit"
            isDisabled={deshabilitado}
            radius="full"
            className="w-full t-label"
            style={{
              height: 64,
              background: deshabilitado ? '#EFEFE9' : C.ink,
              color: deshabilitado ? C.inkFaint : '#FFFFFF',
              fontSize: 16,
            }}
          >
            {loading ? 'Verificando…' : 'Ingresar'}
          </Button>
        </form>

        {import.meta.env.DEV && (
          <div className="mt-8 rounded-lg p-4 space-y-2 border-2" style={{ background: '#FAFAF7', borderColor: C.ink }}>
            <p className="t-caption" style={{ color: C.inkFaint, fontWeight: 700 }}>
              Usuarios de desarrollo (seed del backend)
            </p>
            {CREDENCIALES_DESARROLLO.map((c) => (
              <button
                key={c.email}
                type="button"
                onClick={() => {
                  setEmail(c.email);
                  setPassword(c.password);
                  setError(null);
                }}
                className="flex items-center justify-between w-full text-left rounded-lg px-3 py-2 border-2 transition-colors hover:bg-white"
                style={{ background: '#FFFFFF', borderColor: C.ink }}
              >
                <span className="t-caption" style={{ color: C.inkSoft }}>
                  {c.email}
                </span>
                <span className="t-label px-2 py-0.5 rounded-full" style={{ background: c.fondo, color: '#FFFFFF', fontSize: 10 }}>
                  {c.etiqueta}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
