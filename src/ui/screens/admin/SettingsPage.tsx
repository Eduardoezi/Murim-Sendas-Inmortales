// src/ui/screens/admin/SettingsPage.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Ruta /admin/settings (en el sidebar): por ahora muestra los datos de la
// sesión de administrador y enlace a los logs persistentes (admin_logs).
// Los valores globales del mundo son SOLO de lectura: se editan desde Mundo,
// Fauna y Facciones para mantener el modelo autoritativo.
// ─────────────────────────────────────────────────────────────────────────────
import { useAuthStore } from '../../../core/store/useAuthStore';
import { Settings, ShieldCheck, ScrollText } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../../components/admin/Spinner';

export const SettingsPage = () => {
  const userEmail = useAuthStore((s) => s.userEmail);

  return (
    <div className="space-y-6">
      <PageHeader title="Configuración" subtitle="Cuenta de administrador y referencias del portal" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-stone-900/60 border border-stone-800 rounded-xl p-6 space-y-3">
          <h2 className="font-cinzel text-lg text-stone-200 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" /> Sesión actual
          </h2>
          <p className="text-sm text-stone-400">
            Conectada como <span className="text-amber-400 font-mono">{userEmail ?? 'desconocido'}</span> con rol{' '}
            <span className="text-emerald-400 font-semibold">ADMIN</span> (verificado en cada petición contra la BD).
          </p>
          <p className="text-xs text-stone-600">
            El escalado de administradores es manual en la tabla <code className="font-mono">users.is_admin</code>: así se evita
            escalar privilegios desde la API pública.
          </p>
        </div>

        <div className="bg-stone-900/60 border border-stone-800 rounded-xl p-6 space-y-3">
          <h2 className="font-cinzel text-lg text-stone-200 flex items-center gap-2">
            <Settings className="w-5 h-5 text-amber-500" /> Atajos del portal
          </h2>
          <ul className="text-sm text-stone-400 space-y-2">
            <li><Link to="/admin/world" className="text-cyan-400 hover:underline">Mundo y POIs</Link> — semilla raíz y regeneración de chunks</li>
            <li><Link to="/admin/bestiary" className="text-cyan-400 hover:underline">Fauna y Flora</Link> — balance en caliente de criaturas</li>
            <li><Link to="/admin/factions" className="text-cyan-400 hover:underline">Facciones</Link> — poder e influencia de organizaciones</li>
            <li className="flex items-center gap-2">
              <ScrollText className="w-4 h-4 text-stone-500" />
              <Link to="/admin/logs" className="text-cyan-400 hover:underline">Logs</Link> — auditoría persistente de warn/error
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
