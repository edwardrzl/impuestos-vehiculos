import { Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import Home from './pages/Home';
import VehicleDetail from './pages/VehicleDetail';
import Login from './pages/Login';
import Admin from './pages/Admin';
import ProtectedRoute from './components/ProtectedRoute';
import ProtectedRouteCiudadano from './components/ProtectedRouteCiudadano';
import RegistroCiudadano from './pages/ciudadano/RegistroCiudadano';
import LoginCiudadano from './pages/ciudadano/LoginCiudadano';
import PortalCiudadano from './pages/ciudadano/PortalCiudadano';
import SolicitudTraspaso from './pages/ciudadano/SolicitudTraspaso';

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/vehiculo/:placa" element={<VehicleDetail />} />
          <Route path="/login" element={<Login />} />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <Admin />
              </ProtectedRoute>
            }
          />

          {/* Rutas del portal ciudadano */}
          <Route path="/ciudadano/registro" element={<RegistroCiudadano />} />
          <Route path="/ciudadano/login" element={<LoginCiudadano />} />
          <Route
            path="/ciudadano/portal"
            element={
              <ProtectedRouteCiudadano>
                <PortalCiudadano />
              </ProtectedRouteCiudadano>
            }
          />
          <Route
            path="/ciudadano/traspaso"
            element={
              <ProtectedRouteCiudadano>
                <SolicitudTraspaso />
              </ProtectedRouteCiudadano>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
