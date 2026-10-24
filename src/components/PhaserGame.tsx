import React, { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import { getGameConfig } from '../game/config';

export const PhaserGame: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    try {
      const game = new Phaser.Game(getGameConfig(containerRef.current));

      return () => {
        game.destroy(true);
      };
    } catch (err: any) {
      console.error("Error al iniciar Phaser:", err);
      setError(err.message || "Error desconocido en el motor");
    }
  }, []);

  return (
    <div 
      style={{ width: '100vw', height: '100vh', backgroundColor: '#0f172a', position: 'relative' }} 
    >
      {error && (
        <div style={{ position: 'absolute', top: 10, left: 10, color: 'red', zIndex: 100, background: 'black', padding: '10px' }}>
          Error de Phaser: {error}
        </div>
      )}
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
};