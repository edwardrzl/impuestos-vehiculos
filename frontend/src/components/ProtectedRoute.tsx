import { Navigate } from 'react-router-dom';
import { estaAutenticado } from '../auth/session';

interface Props {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: Props) {
  if (!estaAutenticado()) {
    // replace evita que "/admin" quede en el historial al redirigir al login
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}
