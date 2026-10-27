import { Outlet } from 'react-router-dom';
import { AdminSidebar } from '../../components/admin/AdminSidebar';

export const AdminLayout = () => {
  return (
    <div className="min-h-screen bg-[#05070c] text-stone-200 flex font-sans selection:bg-amber-900 selection:text-amber-100">
      <AdminSidebar />
      
      {/* Contenido Principal (se desplaza para no tapar el sidebar) */}
      <main className="flex-1 ml-64 p-8 h-screen overflow-y-auto">
        <div className="max-w-7xl mx-auto animate-in fade-in duration-300">
          <Outlet />
        </div>
      </main>
    </div>
  );
};