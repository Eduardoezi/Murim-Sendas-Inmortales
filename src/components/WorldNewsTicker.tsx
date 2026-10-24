import React, { useState, useEffect } from 'react';
import { Newspaper, TrendingUp, Swords, Skull, AlertTriangle } from 'lucide-react';
import { useGame } from '../context/GameContext';
import { MAP_REGIONS } from '../data/worldData';

export const WorldNewsTicker: React.FC = () => {
  const { cultivator, worldBoss } = useGame();
  const [currentNewsIndex, setCurrentNewsIndex] = useState(0);

  // Generador de noticias dinámicas (Simulando el mundo vivo)
  const getNews = () => {
    const news = [];
    
    // Noticia 1: Ubicación actual
    if (cultivator?.currentLocationNodeId) {
      const region = MAP_REGIONS.find(r => r.id === cultivator.currentLocationNodeId);
      if (region) {
        news.push({
          icon: <Newspaper className="w-3 h-3 text-amber-400" />,
          text: `Crónicas locales: Te encuentras en ${region.name}. El mercado local está en movimiento.`,
          color: 'text-stone-300'
        });
      }
    }

    // Noticia 2: Jefe Mundial
    if (worldBoss.activeStatus === 'alive') {
      news.push({
        icon: <Skull className="w-3 h-3 text-rose-500" />,
        text: `¡Alerta Roja! ${worldBoss.name} ha sido avistado en las tierras salvajes. HP: ${worldBoss.currentHp.toLocaleString()}.`,
        color: 'text-rose-300'
      });
    }

    // Noticia 3: Economía (Simulada)
    news.push({
      icon: <TrendingUp className="w-3 h-3 text-emerald-400" />,
      text: `El precio del Jade de Khotan ha subido un 15% en Xinjiang debido a la escasez.`,
      color: 'text-emerald-300'
    });

    // Noticia 4: Facciones
    news.push({
      icon: <Swords className="w-3 h-3 text-cyan-400" />,
      text: `El Clan Tang ha reforzado sus defensas en Sichuan. Se rumorea una purga interna.`,
      color: 'text-cyan-300'
    });

    // Noticia 5: Peligro
    news.push({
      icon: <AlertTriangle className="w-3 h-3 text-amber-500" />,
      text: `Bestias de grado Mutante han sido vistas cerca de las rutas comerciales de Shaanxi.`,
      color: 'text-amber-300'
    });

    return news;
  };

  const [newsFeed] = useState(getNews());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentNewsIndex((prev) => (prev + 1) % newsFeed.length);
    }, 5000); // Cambia cada 5 segundos
    return () => clearInterval(interval);
  }, [newsFeed.length]);

  if (newsFeed.length === 0) return null;
  const current = newsFeed[currentNewsIndex];

  return (
    <div className="w-full bg-[#05070c]/90 backdrop-blur-md border-b border-stone-800/80 overflow-hidden relative z-50">
      <div className="max-w-7xl mx-auto px-4 py-1.5 flex items-center gap-3 text-xs">
        <span className="font-cinzel text-amber-500/80 font-bold uppercase tracking-widest shrink-0 border-r border-stone-800 pr-3">
          Jianghu Ticker
        </span>
        <div className="flex-1 overflow-hidden flex items-center gap-2 animate-in slide-in-from-right-4 fade-in duration-500" key={currentNewsIndex}>
          {current.icon}
          <span className={`${current.color} font-medium truncate`}>{current.text}</span>
        </div>
      </div>
    </div>
  );
};