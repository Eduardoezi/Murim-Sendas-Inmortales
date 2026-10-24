import { Link } from 'react-router-dom';
import { Shield, Sparkles, BookOpen } from 'lucide-react';

export const LandingPage = () => {
  return (
    <div className="min-h-screen bg-[#05070c] text-stone-200 flex flex-col items-center justify-center relative overflow-hidden">
      {/* Fondo (puedes poner una imagen luego) */}
      <div className="absolute inset-0 bg-[url('/assets/images/murim_hero_landscape_1792518333064.jpg')] bg-cover bg-center opacity-20" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#05070c] via-[#05070c]/80 to-transparent" />

      <div className="relative z-10 text-center max-w-3xl px-4">
        <h1 className="font-cinzel text-5xl md:text-7xl font-bold text-amber-100 mb-6 drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]">
          Murim: Sendas Inmortales
        </h1>
        <p className="text-lg md:text-xl text-stone-300 mb-8 leading-relaxed font-light">
          Un RPG de cultivo xianxia donde el mundo no se detiene. 
          Gestiona tu secta, medita para ascender y explora un Jianghu persistente.
        </p>
        
        <div className="flex justify-center gap-6 mb-12">
          <div className="flex flex-col items-center text-amber-500">
            <Shield className="w-8 h-8 mb-2" />
            <span className="text-xs uppercase tracking-widest">Combate Táctico</span>
          </div>
          <div className="flex flex-col items-center text-amber-500">
            <Sparkles className="w-8 h-8 mb-2" />
            <span className="text-xs uppercase tracking-widest">Cultivo Profundo</span>
          </div>
          <div className="flex flex-col items-center text-amber-500">
            <BookOpen className="w-8 h-8 mb-2" />
            <span className="text-xs uppercase tracking-widest">Mundo Vivo</span>
          </div>
        </div>

        <Link 
          to="/auth"
          className="px-8 py-4 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-stone-950 font-cinzel font-bold text-xl rounded-lg shadow-[0_0_20px_rgba(245,158,11,0.3)] transition-all transform hover:scale-105"
        >
          Forjar mi Destino
        </Link>
      </div>
    </div>
  );
};