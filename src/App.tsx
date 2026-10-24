import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './core/store/useAuthStore';
import { usePlayerStore } from './core/store/usePlayerStore';

import { LandingPage } from './ui/screens/LandingPage';
import { AuthPage } from './ui/screens/AuthPage';
import { CreationPage } from './ui/screens/CreationPage';
import { AdminPage } from './ui/screens/AdminPage';

export default function App() {
  const { token } = useAuthStore();
  const { playerId } = usePlayerStore();

  return (
    <BrowserRouter>
      <Routes>
        {/* 1. Portal de Inicio (Público) */}
        <Route path="/" element={!token ? <LandingPage /> : <Navigate to="/hub" />} />
        
        {/* 2. Login / Registro */}
        <Route path="/auth" element={!token ? <AuthPage /> : <Navigate to="/hub" />} />
        
        {/* 3. Creación de Personaje (Requiere Login) */}
        <Route path="/create" element={
          token ? (!playerId ? <CreationPage /> : <Navigate to="/hub" />) : <Navigate to="/auth" />
        } />
        
        {/* 4. Hub Administrativo / Juego (Requiere Login y Personaje) */}
        <Route path="/hub" element={
          token ? (playerId ? <AdminPage /> : <Navigate to="/create" />) : <Navigate to="/auth" />
        } />
      </Routes>
    </BrowserRouter>
  );
}