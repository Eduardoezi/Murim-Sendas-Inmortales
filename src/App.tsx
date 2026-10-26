import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuthStore } from './core/store/useAuthStore';
import { usePlayerStore } from './core/store/usePlayerStore';

import { LandingPage } from './ui/screens/LandingPage';
import { AuthPage } from './ui/screens/AuthPage';
import { CreationPage } from './ui/screens/CreationPage';
import { AdminPage } from './ui/screens/AdminPage';

export default function App() {
  const { token } = useAuthStore();
  const { playerId, setPlayer } = usePlayerStore();
  const [isLoading, setIsLoading] = useState(true); // Estado de carga inicial

  // ✅ EFECTO MÁGICO: Al recargar, busca al personaje en el servidor
  useEffect(() => {
    const fetchPlayerData = async () => {
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const res = await fetch('/api/player/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();

        if (data.success && data.player) {
          // Restauramos el personaje en Zustand
          const p = data.player;
          const calculatedHp = 50 + (p.stats_json.constitucion * 12);
          
          setPlayer({
            playerId: p.id,
            name: p.name,
            gender: p.gender,
            birthdate: p.birth_date,
            attributes: p.stats_json,
            hp: calculatedHp,
            maxHp: calculatedHp,
            qi: 50,
            maxQi: 100,
            realmName: p.realm_name
          });
        }
      } catch (error) {
        console.error("Error al recuperar la sesión:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlayerData();
  }, [token, setPlayer]);

  // Pantalla de carga (evita que te mande a /create por un segundo)
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#05070c] flex items-center justify-center text-amber-500 font-cinzel">
        Cargando el Jianghu...
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={!token ? <LandingPage /> : <Navigate to={playerId ? "/hub" : "/create"} />} />
        <Route path="/auth" element={!token ? <AuthPage /> : <Navigate to={playerId ? "/hub" : "/create"} />} />
        
        <Route path="/create" element={
          token ? (!playerId ? <CreationPage /> : <Navigate to="/hub" />) : <Navigate to="/auth" />
        } />
        
        <Route path="/hub" element={
          token ? (playerId ? <AdminPage /> : <Navigate to="/create" />) : <Navigate to="/auth" />
        } />
      </Routes>
    </BrowserRouter>
  );
}