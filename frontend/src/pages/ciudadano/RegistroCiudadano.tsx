import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, Loader2, ImageIcon } from 'lucide-react';
import { registrarCiudadano } from '../../api/client';

export default function RegistroCiudadano() {
  const navigate = useNavigate();

  const [nombre, setNombre]       = useState('');
  const [documento, setDocumento] = useState('');
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [archivo, setArchivo]     = useState<File | null>(null);
  const [preview, setPreview]     = useState<string | null>(null);
  const [error, setError]         = useState('');
  const [cargando, setCargando]   = useState(false);

  function manejarArchivo(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setArchivo(f);
    // Liberar URL anterior antes de crear una nueva para evitar fugas de memoria.
    setPreview(prev => {
      if (prev) URL.revokeObjectURL(prev);
      return f ? URL.createObjectURL(f) : null;
    });
  }

  async function manejarEnvio(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (password !== confirmar) {
      setError('Las contraseñas no coinciden');
      return;
    }
    if (!archivo) {
      setError('Debes adjuntar la foto de tu documento de identidad');
      return;
    }

    setCargando(true);
    try {
      const datos = new FormData();
      datos.append('nombre', nombre);
      datos.append('documento', documento);
      datos.append('email', email);
      datos.append('password', password);
      datos.append('foto_documento', archivo);

      await registrarCiudadano(datos);
      navigate('/ciudadano/login?registro=ok');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error en el registro');
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-paper flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-navy-900 rounded-2xl mb-4">
            <UserPlus className="text-white" size={28} />
          </div>
          <h1 className="font-display text-3xl text-navy-900">Crear cuenta</h1>
          <p className="text-sm text-stone-500 mt-1">Regístrate para solicitar trámites vehiculares</p>
        </div>

        <div className="card p-6 md:p-8">
          <form onSubmit={manejarEnvio} className="space-y-5">
            <div>
              <label htmlFor="nombre" className="block text-sm font-medium text-navy-800 mb-1.5">
                Nombre completo
              </label>
              <input
                id="nombre"
                type="text"
                autoComplete="name"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-lg border border-stone-300
                           text-navy-900 placeholder:text-stone-400
                           focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-transparent
                           transition-shadow"
                placeholder="Tu nombre completo"
              />
            </div>

            <div>
              <label htmlFor="documento" className="block text-sm font-medium text-navy-800 mb-1.5">
                Número de documento
              </label>
              <input
                id="documento"
                type="text"
                value={documento}
                onChange={(e) => setDocumento(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-lg border border-stone-300
                           text-navy-900 placeholder:text-stone-400
                           focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-transparent
                           transition-shadow"
                placeholder="Cédula o pasaporte"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-navy-800 mb-1.5">
                Correo electrónico
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-lg border border-stone-300
                           text-navy-900 placeholder:text-stone-400
                           focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-transparent
                           transition-shadow"
                placeholder="tu@email.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-navy-800 mb-1.5">
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="w-full px-4 py-2.5 rounded-lg border border-stone-300
                           text-navy-900 placeholder:text-stone-400
                           focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-transparent
                           transition-shadow"
                placeholder="Mínimo 8 caracteres"
              />
            </div>

            <div>
              <label htmlFor="confirmar" className="block text-sm font-medium text-navy-800 mb-1.5">
                Confirmar contraseña
              </label>
              <input
                id="confirmar"
                type="password"
                autoComplete="new-password"
                value={confirmar}
                onChange={(e) => setConfirmar(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-lg border border-stone-300
                           text-navy-900 placeholder:text-stone-400
                           focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-transparent
                           transition-shadow"
                placeholder="Repite la contraseña"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-navy-800 mb-1.5">
                Foto del documento de identidad
              </label>
              <label
                htmlFor="foto_documento"
                className="flex flex-col items-center gap-2 w-full px-4 py-4 rounded-lg border-2 border-dashed
                           border-stone-300 cursor-pointer hover:border-navy-400 hover:bg-navy-50/50
                           transition-colors text-center"
              >
                {preview ? (
                  <img
                    src={preview}
                    alt="Vista previa del documento"
                    className="max-h-40 rounded-lg object-contain"
                  />
                ) : (
                  <>
                    <ImageIcon size={28} className="text-stone-400" />
                    <span className="text-sm text-stone-500">
                      Haz clic para seleccionar una imagen (JPG o PNG, máx. 5 MB)
                    </span>
                  </>
                )}
                {archivo && (
                  <span className="text-xs text-stone-400 mt-1">{archivo.name}</span>
                )}
              </label>
              <input
                id="foto_documento"
                type="file"
                accept="image/jpeg,image/png"
                onChange={manejarArchivo}
                className="sr-only"
              />
            </div>

            {error && (
              <p className="text-sm text-coral-600 bg-coral-50 px-4 py-3 rounded-lg">{error}</p>
            )}

            <button type="submit" disabled={cargando} className="btn-primary w-full">
              {cargando ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Registrando...
                </>
              ) : (
                'Crear cuenta'
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-stone-500 mt-4">
          ¿Ya tienes cuenta?{' '}
          <Link to="/ciudadano/login" className="text-navy-700 font-medium hover:underline">
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
