import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { ALCHEMY_RECIPES } from '../data/gameData';
import { Flame, Sparkles, CheckCircle, AlertTriangle } from 'lucide-react';

export const AlchemyPavilionView: React.FC = () => {
  const { cultivator, craftPill, consumePill } = useGame();
  const [selectedRecipeId, setSelectedRecipeId] = useState(ALCHEMY_RECIPES[0].id);
  const [furnaceTemperature, setFurnaceTemperature] = useState<number>(50);
  const [craftNotice, setCraftNotice] = useState<{ success: boolean; message: string } | null>(null);

  if (!cultivator) return null;

  const currentRecipe = ALCHEMY_RECIPES.find((r) => r.id === selectedRecipeId) || ALCHEMY_RECIPES[0];

  const handleCraft = () => {
    const res = craftPill(currentRecipe.id, furnaceTemperature);
    setCraftNotice(res);
    setTimeout(() => setCraftNotice(null), 5000);
  };

  const inventoryPills = cultivator.inventory.filter((item) => item.category === 'pill');

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="bg-stone-900/70 border border-stone-800 rounded-xl p-6">
        <h2 className="font-cinzel text-2xl font-bold text-amber-100 mb-1">
          Pabellón de Alquimia de los Ocho Trigramas
        </h2>
        <p className="text-xs text-stone-400 max-w-2xl leading-relaxed">
          Refina hierbas espirituales milenarias y núcleos de bestias demoníacas en el gran caldero celestial. Ajusta la temperatura de la llama espiritual para evitar que los elixires se reduzcan a cenizas.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Cauldron Visual & Temperature Control */}
        <div className="lg:col-span-7 bg-stone-900/60 border border-stone-800 rounded-xl p-6 flex flex-col justify-between">
          <div>
            <div className="relative w-full aspect-square max-h-[340px] rounded-lg overflow-hidden border border-stone-800/80 mb-6 group">
              <img
                src="/src/assets/images/murim_alchemy_cauldron_1792518334063.jpg"
                alt="Gran Caldero de Alquimia"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-transparent to-transparent opacity-80" />
              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs">
                <span className="font-cinzel text-amber-200 font-semibold drop-shadow">
                  Caldero de Bronce Ancestral
                </span>
                <span className="font-mono text-amber-400 tabular-nums">
                  {furnaceTemperature}°F Fuego de Qi
                </span>
              </div>
            </div>

            {/* Temperature Slider */}
            <div className="space-y-2 mb-6">
              <div className="flex items-center justify-between text-xs">
                <span className="text-stone-300 font-medium flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-amber-500" />
                  Control de Llama Espiritual
                </span>
                <span className="text-stone-400 text-[11px]">
                  Temperatura Óptima para esta receta: <strong className="text-amber-400 font-mono">{currentRecipe.optimalTemperature}°F</strong>
                </span>
              </div>

              <input
                type="range"
                min="10"
                max="100"
                value={furnaceTemperature}
                onChange={(e) => setFurnaceTemperature(Number(e.target.value))}
                className="w-full h-2 bg-stone-950 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />

              <div className="flex justify-between text-[10px] text-stone-500 font-mono">
                <span>10° Llama Fría</span>
                <span>50° Fuego Templado</span>
                <span>100° Fuego Celestial Extremo</span>
              </div>
            </div>

            {craftNotice && (
              <div
                className={`p-3 rounded-lg border text-xs flex items-center gap-3 mb-4 ${
                  craftNotice.success
                    ? 'bg-emerald-950/60 border-emerald-500/60 text-emerald-200'
                    : 'bg-rose-950/60 border-rose-500/60 text-rose-200'
                }`}
              >
                {craftNotice.success ? (
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                )}
                <span>{craftNotice.message}</span>
              </div>
            )}
          </div>

          <button
            onClick={handleCraft}
            className="w-full py-3 px-4 bg-amber-600 hover:bg-amber-500 text-stone-950 font-cinzel font-bold text-xs uppercase tracking-wider rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>Encender Caldero & Elaborar {currentRecipe.name}</span>
          </button>
        </div>

        {/* Right Column: Recipe Selection & Crafted Pills in Inventory */}
        <div className="lg:col-span-5 space-y-6">
          {/* Recipes Selection */}
          <div className="bg-stone-900/60 border border-stone-800 rounded-xl p-5">
            <h3 className="font-cinzel text-sm font-semibold text-stone-200 mb-3 pb-2 border-b border-stone-800">
              Manuales de Recetas Alquímicas
            </h3>
            <div className="space-y-2.5">
              {ALCHEMY_RECIPES.map((recipe) => {
                const isSelected = selectedRecipeId === recipe.id;
                return (
                  <button
                    key={recipe.id}
                    onClick={() => setSelectedRecipeId(recipe.id)}
                    className={`w-full text-left p-3 rounded-lg border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-amber-950/40 border-amber-500 text-amber-100 shadow-sm'
                        : 'bg-stone-950/40 border-stone-800/80 text-stone-400 hover:border-stone-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-xs text-stone-200">{recipe.name}</span>
                      <span className="text-[10px] text-amber-400 font-mono">{recipe.rarity}</span>
                    </div>
                    <p className="text-[11px] text-stone-400 mb-2 leading-relaxed">
                      {recipe.description}
                    </p>
                    <div className="text-[10px] text-stone-400 flex items-center justify-between">
                      <span>Ingredientes: {recipe.ingredients.map((ing) => `${ing.amount}x ${ing.name}`).join(', ')}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Consumable Pills in Backpack */}
          <div className="bg-stone-900/60 border border-stone-800 rounded-xl p-5">
            <h3 className="font-cinzel text-sm font-semibold text-stone-200 mb-3 pb-2 border-b border-stone-800">
              Píldoras Listas para Consumir ({inventoryPills.length})
            </h3>
            {inventoryPills.length === 0 ? (
              <p className="text-xs text-stone-500 py-3 text-center">
                No tienes elixires en tu alforja. Elabora píldoras en el caldero para potenciar tu cultivo.
              </p>
            ) : (
              <div className="space-y-2">
                {inventoryPills.map((pill) => (
                  <div
                    key={pill.id}
                    className="p-2.5 bg-stone-950 border border-stone-800 rounded-lg flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-semibold text-stone-200">{pill.name}</div>
                      <div className="text-[11px] text-amber-400">
                        +{pill.cultivationBoost} Qi & Regeneración
                      </div>
                    </div>
                    <button
                      onClick={() => consumePill(pill.id)}
                      className="px-3 py-1 bg-emerald-600/80 hover:bg-emerald-500 text-stone-950 font-semibold rounded text-[11px] transition-colors cursor-pointer"
                    >
                      Ingerir
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
