import { Navigate } from 'react-router-dom';
import { estaAutenticadoCiudadano } from '../auth/session';

interface Props {
  children: React.ReactNode;
}

export default function ProtectedRouteCiudadano({ children }: Props) {
  if (!estaAutenticadoCiudadano()) {
    return <Navigate to="/ciudadano/login" replace />;
  }
  return <>{children}</>;
}
