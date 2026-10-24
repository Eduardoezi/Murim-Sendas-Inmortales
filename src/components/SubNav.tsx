import React from 'react';

export interface SubTab {
  id: string;
  label: string;
  badge?: string | number;
}

interface SubNavProps {
  title: string;
  subTabs: SubTab[];
  currentSubTab: string;
  onSelect: (subTabId: string) => void;
}

export const SubNav: React.FC<SubNavProps> = ({ title, subTabs, currentSubTab, onSelect }) => {
  if (subTabs.length === 0) return null;

  return (
    <div className="sticky top-0 z-30 -mx-3 sm:-mx-5 md:-mx-6 lg:-mx-8 mb-5 bg-[#070a12]/95 backdrop-blur-md border-b border-stone-800/80">
      <div className="px-3 sm:px-5 md:px-6 lg:px-8">
        <div className="flex items-center gap-2 py-2 text-[10px] uppercase tracking-[0.18em] text-stone-500 font-cinzel">
          <span className="text-amber-500/80">道</span>
          <span>{title}</span>
        </div>
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-2">
          {subTabs.map((tab) => {
            const isActive = tab.id === currentSubTab;
            return (
              <button
                key={tab.id}
                onClick={() => onSelect(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all cursor-pointer border ${
                  isActive
                    ? 'bg-amber-500/15 text-amber-300 border-amber-500/40 shadow-sm font-semibold'
                    : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900/60 border-transparent'
                }`}
              >
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded font-mono ${
                      isActive
                        ? 'bg-amber-500/25 text-amber-200'
                        : 'bg-stone-800/80 text-stone-400'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};