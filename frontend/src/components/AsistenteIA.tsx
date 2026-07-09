// AsistenteIA.tsx - Chat con el asistente IA de impuestos vehiculares.
// Botón flotante (abajo a la derecha) que abre un panel de chat. El historial
// vive solo en el estado local: se pierde al recargar la página, a propósito.

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, Send, X } from 'lucide-react';
import { enviarMensajeChat } from '../api/client';
import type { MensajeChat } from '../types';

interface Burbuja {
  rol: 'user' | 'model' | 'error';
  texto: string;
}

const SALUDO_INICIAL =
  '¡Hola! Soy el asistente virtual de Prisma. Puedo consultar los impuestos ' +
  'pendientes de un vehículo, ayudarte a iniciar su pago o buscar comprobantes ' +
  'de pagos anteriores. ¿En qué te ayudo?';

// El backend exige que el historial empiece con un mensaje del usuario, así que
// el saludo local (y las burbujas de error) no se envían.
function aHistorial(burbujas: Burbuja[]): MensajeChat[] {
  const primerUsuario = burbujas.findIndex((b) => b.rol === 'user');
  if (primerUsuario === -1) return [];
  return burbujas
    .slice(primerUsuario)
    .filter((b): b is Burbuja & { rol: 'user' | 'model' } => b.rol !== 'error')
    .map((b) => ({ role: b.rol, parts: [{ text: b.texto }] }));
}

// Convierte rutas internas (/vehiculo/ABC123) en enlaces navegables: es como
// el asistente entrega el enlace de pago.
function TextoConEnlaces({ texto }: { texto: string }) {
  const partes = texto.split(/(\/vehiculo\/[A-Za-z0-9]+)/g);
  return (
    <>
      {partes.map((parte, i) =>
        parte.startsWith('/vehiculo/') ? (
          <Link key={i} to={parte} className="font-semibold underline hover:text-coral-600">
            {parte}
          </Link>
        ) : (
          parte
        )
      )}
    </>
  );
}

function EstiloBurbuja(rol: Burbuja['rol']): string {
  const base = 'max-w-[85%] px-3.5 py-2 text-sm whitespace-pre-wrap break-words rounded-2xl';
  if (rol === 'user') return `${base} rounded-br-md bg-navy-800 text-white`;
  if (rol === 'model') return `${base} rounded-bl-md bg-white border border-stone-200 text-navy-900`;
  return `${base} bg-coral-50 border border-coral-200 text-coral-800`;
}

export default function AsistenteIA() {
  const [abierto, setAbierto] = useState(false);
  const [burbujas, setBurbujas] = useState<Burbuja[]>([{ rol: 'model', texto: SALUDO_INICIAL }]);
  const [texto, setTexto] = useState('');
  const [cargando, setCargando] = useState(false);
  const finRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    finRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [burbujas, cargando, abierto]);

  async function enviar(e: FormEvent) {
    e.preventDefault();
    const mensaje = texto.trim();
    if (!mensaje || cargando) return;

    const conUsuario: Burbuja[] = [...burbujas, { rol: 'user', texto: mensaje }];
    setBurbujas(conUsuario);
    setTexto('');
    setCargando(true);

    try {
      const { respuesta } = await enviarMensajeChat(aHistorial(conUsuario));
      setBurbujas((prev) => [...prev, { rol: 'model', texto: respuesta }]);
    } catch (error) {
      // Los errores de nuestro backend llegan en español y se muestran tal cual
      // (429, 503, validación). Si el backend no responde, request() propaga el
      // statusText del proxy o del navegador (en inglés): se reemplaza.
      const TECNICOS =
        /^(Error en la petición|Internal Server Error|Bad Gateway|Service Unavailable|Gateway Timeout|Not Found|Bad Request|Failed to fetch|NetworkError|Load failed)/i;
      const mensaje = error instanceof Error ? error.message : '';
      const detalle =
        mensaje && !TECNICOS.test(mensaje)
          ? mensaje
          : 'El asistente no está disponible en este momento. Intenta de nuevo en unos segundos.';
      setBurbujas((prev) => [...prev, { rol: 'error', texto: detalle }]);
    } finally {
      setCargando(false);
    }
  }

  if (!abierto) {
    return (
      <button
        onClick={() => setAbierto(true)}
        aria-label="Abrir asistente virtual"
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-navy-900 text-white
                   shadow-lg hover:bg-navy-700 hover:shadow-xl transition-all
                   flex items-center justify-center"
      >
        <MessageCircle size={24} />
      </button>
    );
  }

  return (
    <div
      className="fixed bottom-6 right-6 z-50 w-96 max-w-[calc(100vw-3rem)] card
                 flex flex-col overflow-hidden shadow-xl animate-slide-up"
      style={{ height: 'min(34rem, calc(100vh - 6rem))' }}
    >
      {/* Encabezado */}
      <div className="bg-navy-900 text-white px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <MessageCircle size={18} />
          <div>
            <p className="font-semibold text-sm leading-tight">Asistente Prisma</p>
            <p className="text-[11px] text-navy-200">Impuestos vehiculares</p>
          </div>
        </div>
        <button
          onClick={() => setAbierto(false)}
          aria-label="Cerrar asistente"
          className="p-1.5 rounded-lg hover:bg-navy-800 transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      {/* Mensajes */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-3 bg-paper">
        {burbujas.map((burbuja, i) => (
          <div key={i} className={`flex ${burbuja.rol === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={EstiloBurbuja(burbuja.rol)}>
              <TextoConEnlaces texto={burbuja.texto} />
            </div>
          </div>
        ))}

        {cargando && (
          <div className="flex justify-start" aria-label="El asistente está escribiendo">
            <div className="rounded-2xl rounded-bl-md bg-white border border-stone-200 px-4 py-3 flex gap-1.5">
              {[0, 150, 300].map((delay) => (
                <span
                  key={delay}
                  className="w-1.5 h-1.5 rounded-full bg-navy-400 animate-bounce"
                  style={{ animationDelay: `${delay}ms` }}
                />
              ))}
            </div>
          </div>
        )}
        <div ref={finRef} />
      </div>

      {/* Input */}
      <form onSubmit={enviar} className="border-t border-stone-200 bg-white p-3 flex gap-2 shrink-0">
        <input
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Escribe tu consulta…"
          className="flex-1 min-w-0 px-3.5 py-2 text-sm rounded-xl border border-stone-300
                     focus:outline-none focus:ring-2 focus:ring-navy-400 focus:border-transparent"
        />
        <button
          type="submit"
          disabled={cargando || !texto.trim()}
          aria-label="Enviar mensaje"
          className="w-10 h-10 rounded-xl bg-navy-800 text-white flex items-center justify-center
                     hover:bg-navy-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}
