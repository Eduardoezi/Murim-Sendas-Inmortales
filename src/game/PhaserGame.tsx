// src/game/PhaserGame.tsx
import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { getGameConfig } from './config';

export const PhaserGame = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    
    const game = new Phaser.Game(getGameConfig(containerRef.current));
    if (import.meta.env.DEV) {
      (window as unknown as { __murimGame?: Phaser.Game }).__murimGame = game;
    }

    return () => {
      game.destroy(true);
    };
  }, []);

  return <div ref={containerRef} className="w-full h-full" />;
};