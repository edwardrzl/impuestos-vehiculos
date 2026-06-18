// components/ProtectedRoute.tsx
// Envoltorio para rutas que requieren sesión activa.
// Si no hay token en localStorage, redirige al login.
// Si hay token, renderiza el contenido normalmente.
//
// Uso en App.tsx:
//   <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />

import { Navigate } from 'react-router-dom';
import { estaAutenticado } from '../auth/session';

interface Props {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: Props) {
  if (!estaAutenticado()) {
    // replace evita que "/admin" quede en el historial del navegador al redirigir
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}
