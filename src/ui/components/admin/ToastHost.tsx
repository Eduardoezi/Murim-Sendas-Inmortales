// src/ui/components/admin/ToastHost.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Contenedor de toasts del portal (feedback de acciones: "Jugador baneado…").
// Se monta una sola vez en AdminLayout; consume useToastStore.
// ─────────────────────────────────────────────────────────────────────────────
import { CheckCircle2, AlertTriangle, XCircle, X } from 'lucide-react';
import { useToastStore, type ToastKind } from '../../../core/store/useToastStore';

const KIND_STYLES: Record<ToastKind, { border: string; icon: typeof CheckCircle2; iconColor: string }> = {
  success: { border: 'border-emerald-800', icon: CheckCircle2, iconColor: 'text-emerald-400' },
  error: { border: 'border-rose-800', icon: XCircle, iconColor: 'text-rose-400' },
  info: { border: 'border-amber-800', icon: AlertTriangle, iconColor: 'text-amber-400' },
};

export const ToastHost = () => {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 w-80 pointer-events-none">
      {toasts.map((t) => {
        const style = KIND_STYLES[t.kind];
        const Icon = style.icon;
        return (
          <div
            key={t.id}
            role="status"
            className={`pointer-events-auto flex items-start gap-3 bg-stone-950/95 backdrop-blur border ${style.border} rounded-lg px-4 py-3 shadow-xl shadow-black/50`}
          >
            <Icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${style.iconColor}`} />
            <p className="text-sm text-stone-200 flex-1 leading-snug">{t.message}</p>
            <button
              onClick={() => dismiss(t.id)}
              className="text-stone-500 hover:text-stone-200 cursor-pointer"
              aria-label="Cerrar notificación"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
