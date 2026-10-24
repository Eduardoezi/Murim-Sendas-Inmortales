import React from 'react';
import { Construction, Sparkles } from 'lucide-react';

interface SectionPlaceholderProps {
  section: string;
  subTab: string;
  subTabs: { id: string; label: string }[];
}

export const SectionPlaceholder: React.FC<SectionPlaceholderProps> = ({
  section,
  subTab,
  subTabs,
}) => {
  const current = subTabs.find((t) => t.id === subTab);

  return (
    <div className="bg-stone-900/60 border border-stone-800 rounded-xl p-8 text-center space-y-4 min-h-[320px] flex flex-col items-center justify-center">
      <div className="w-14 h-14 rounded-full bg-amber-950/40 border border-amber-600/40 flex items-center justify-center">
        <Construction className="w-7 h-7 text-amber-400" />
      </div>
      <div>
        <div className="text-[10px] uppercase tracking-[0.2em] text-amber-500/80 font-cinzel mb-1">
          {section}
        </div>
        <h2 className="font-cinzel text-xl font-bold text-amber-100">
          {current?.label ?? subTab}
        </h2>
        <p className="text-xs text-stone-400 mt-2 max-w-md mx-auto leading-relaxed">
          Esta sección se poblará con los datos de tu crónica en el siguiente paso.
          La infraestructura de navegación ya está lista.
        </p>
      </div>
      <div className="flex items-center gap-1.5 text-[10px] text-stone-500 font-mono">
        <Sparkles className="w-3 h-3 text-amber-500/70" />
        En construcción · Paso 2
      </div>
    </div>
  );
};