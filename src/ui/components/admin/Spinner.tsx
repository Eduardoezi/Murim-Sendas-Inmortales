// src/ui/components/admin/Spinner.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Estado de carga y estado de error reutilizables (DoD: spinners + toasts).
// ─────────────────────────────────────────────────────────────────────────────
import { Loader2, TriangleAlert } from 'lucide-react';

export const Spinner = ({ label = 'Cargando…' }: { label?: string }) => (
  <div className="flex items-center justify-center gap-3 py-16 text-amber-500">
    <Loader2 className="w-6 h-6 animate-spin" />
    <span className="font-cinzel tracking-wider text-sm">{label}</span>
  </div>
);

export const ErrorState = ({ message, onRetry }: { message: string; onRetry?: () => void }) => (
  <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
    <TriangleAlert className="w-10 h-10 text-rose-500" />
    <p className="text-stone-300 max-w-md">{message}</p>
    {onRetry && (
      <button
        onClick={onRetry}
        className="px-4 py-2 rounded-lg bg-amber-950/60 border border-amber-800 text-amber-400 text-sm font-semibold hover:bg-amber-900/60 transition-colors cursor-pointer"
      >
        Reintentar
      </button>
    )}
  </div>
);

/** Cabecera estándar de página del portal. */
export const PageHeader = ({ title, subtitle, actions }: { title: string; subtitle: string; actions?: React.ReactNode }) => (
  <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
    <div>
      <h1 className="font-cinzel text-3xl text-amber-100 mb-1">{title}</h1>
      <p className="text-stone-400 text-sm">{subtitle}</p>
    </div>
    {actions && <div className="flex items-center gap-2">{actions}</div>}
  </div>
);
