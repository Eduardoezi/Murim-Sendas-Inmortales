import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuthStore } from './core/store/useAuthStore';
import { usePlayerStore } from './core/store/usePlayerStore';
import { playerService } from './core/services/playerService';
import type { CultivatorAttributes } from './types/player.types';

import { LandingPage } from './ui/screens/LandingPage';
import { AuthPage } from './ui/screens/AuthPage';
import { CreationPage } from './ui/screens/CreationPage';
import { AdminPage } from './ui/screens/AdminPage';

export default function App() {
  const { token } = useAuthStore();
  const { playerId, setPlayer } = usePlayerStore();
  const [isLoading, setIsLoading] = useState(true); // Estado de carga inicial

  // HIDRATACION REAL: al cargar/recargar, todo el estado del personaje se
  // restaura desde SQLite via playerService (unica fuente de verdad).
  // Si la BD aun no tiene cifras de progresion (personaje recien creado),
  // se derivan UNA sola vez de los atributos y se persisten inmediatamente,
  // para que de ahi en adelante la pantalla muestre siempre datos guardados.
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

          setPlayer({
            playerId: p.id,
            name: p.name,
            gender: p.gender as 'Hombre' | 'Mujer' | 'Otro',
            birthdate: p.birth_date ?? '',
            lineage: p.origin ?? 'Comun',
            faction: p.faction ?? 'Errante',
            attributes: p.stats_json as unknown as CultivatorAttributes,
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