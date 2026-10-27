import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuthStore } from './core/store/useAuthStore';
import { usePlayerStore } from './core/store/usePlayerStore';
import { playerService } from './core/services/playerService';

import { LandingPage } from './ui/screens/LandingPage';
import { AuthPage } from './ui/screens/AuthPage';
import { CreationPage } from './ui/screens/CreationPage';
import { AdminPage } from './ui/screens/AdminPage';

import { AdminLayout } from './ui/screens/admin/AdminLayout';
import { Dashboard } from './ui/screens/admin/Dashboard';

// Componente temporal para las rutas que iremos creando
const UnderConstruction = ({ title }: { title: string }) => (
  <div className="text-center py-20">
    <h1 className="font-cinzel text-3xl text-amber-500 mb-4">{title}</h1>
    <p className="text-stone-500">Este módulo de administración estará disponible pronto.</p>
  </div>
);

export default function App() {
  const { token } = useAuthStore();
  const { playerId, setPlayer } = usePlayerStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const hydrateFromServer = async () => {
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const { player: p } = await playerService.getMe();

        if (p) {
          const hasSavedProgress = typeof p.max_hp === 'number' && p.max_hp > 0;
          const derivedMaxHp = 50 + (p.stats_json.constitucion * 12);
          const derivedMaxQi = 50 + (p.stats_json.voluntad * 10);

          const maxHp = hasSavedProgress ? (p.max_hp as number) : derivedMaxHp;
          const hp = hasSavedProgress ? (p.hp ?? maxHp) : maxHp;
          const maxQi = hasSavedProgress ? (p.max_qi as number) : derivedMaxQi;
          const qi = hasSavedProgress ? (p.qi ?? maxQi) : Math.floor(maxQi / 2);

        if (data.success && data.player) {
          const p = data.player;
          const calculatedHp = 50 + (p.stats_json.constitucion * 12);
          
          setPlayer({
            playerId: p.id,
            name: p.name,
            gender: p.gender,
            birthdate: p.birth_date ?? '',
            lineage: p.origin ?? 'Comun',
            faction: p.faction ?? 'Errante',
            attributes: p.stats_json,
            appearance: (p.appearance_json as never) ?? undefined,
            hp, maxHp, qi, maxQi,
            spiritStones: p.spirit_stones ?? 250,
            sectMerits: p.sect_merits ?? 0,
            cb_actual: p.cb_actual ?? 0,
            cb_requerido: p.cb_requerido ?? 100,
            realmName: p.realm_name,
          });

          // Primera sesion tras la creacion: fijamos las cifras base en la BD
          if (!hasSavedProgress) {
            await playerService.saveProgress({
              hp, maxHp, qi, maxQi,
              spiritStones: p.spirit_stones ?? 250,
              sectMerits: p.sect_merits ?? 0,
              cbActual: p.cb_actual ?? 0,
              cbRequerido: p.cb_requerido ?? 100,
            }).catch(() => {});
          }
        }
      } catch (error) {
        console.error("Error al recuperar la sesion:", error);
      } finally {
        setIsLoading(false);
      }
    };

    hydrateFromServer();
  }, [token, setPlayer]);

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

        {/* --- PORTAL DE ADMINISTRACIÓN --- */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="players" element={<UnderConstruction title="Gestión de Jugadores" />} />
          <Route path="world" element={<UnderConstruction title="Mundo y POIs" />} />
          <Route path="bestiary" element={<UnderConstruction title="Fauna y Flora" />} />
          <Route path="factions" element={<UnderConstruction title="Facciones" />} />
          <Route path="debug" element={<UnderConstruction title="Depuración" />} />
          <Route path="logs" element={<UnderConstruction title="Logs del Servidor" />} />
          <Route path="settings" element={<UnderConstruction title="Configuración" />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}