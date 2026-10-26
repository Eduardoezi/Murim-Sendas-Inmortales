import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Users, Globe, Swords, Bug, 
  Terminal, Settings, ArrowLeft, BookOpen 
} from 'lucide-react';
import { useAuthStore } from '../../../core/store/useAuthStore';

const NAV_ITEMS = [
  { path: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/admin/players', label: 'Jugadores', icon: Users },
  { path: '/admin/world', label: 'Mundo y POIs', icon: Globe },
  { path: '/admin/bestiary', label: 'Fauna y Flora', icon: Bug },
  { path: '/admin/factions', label: 'Facciones', icon: Swords },
  { path: '/admin/debug', label: 'Depuración', icon: Terminal },
  { path: '/admin/logs', label: 'Logs', icon: BookOpen },
  { path: '/admin/settings', label: 'Configuración', icon: Settings },
];

export const AdminSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuthStore();

  return (
    <aside className="w-64 bg-stone-950 border-r border-stone-800 flex flex-col h-screen fixed left-0 top-0 z-40">
      {/* Header del Sidebar */}
      <div className="p-6 border-b border-stone-800 flex items-center gap-3">
        <div className="w-8 h-8 rounded bg-gradient-to-br from-amber-600 to-amber-900 flex items-center justify-center text-stone-950 font-cinzel font-bold shadow-[0_0_10px_rgba(245,158,11,0.3)]">
          道
        </div>
        <div>
          <h1 className="font-cinzel font-bold text-amber-100 tracking-wider">MURIM</h1>
          <p className="text-[10px] text-stone-500 uppercase tracking-widest">Panel de Admin</p>
        </div>
      </div>

      {/* Navegación */}
      <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-all text-sm font-semibold cursor-pointer ${
                isActive 
                  ? 'bg-amber-950/60 text-amber-400 border border-amber-900/50 shadow-inner' 
                  : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-amber-500' : 'text-stone-500'}`} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer del Sidebar */}
      <div className="p-4 border-t border-stone-800 space-y-2">
        <button 
          onClick={() => navigate('/hub')}
          className="w-full flex items-center gap-3 px-3 py-2 text-sm font-semibold text-cyan-400 hover:text-cyan-300 hover:bg-stone-900 rounded-lg transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Volver al Juego
        </button>
        <button 
          onClick={() => { logout(); navigate('/'); }}
          className="w-full flex items-center gap-3 px-3 py-2 text-sm font-semibold text-rose-500 hover:text-rose-400 hover:bg-stone-900 rounded-lg transition-colors cursor-pointer"
        >
          Cerrar Sesión
        </button>
      </div>
    </aside>
  );
};