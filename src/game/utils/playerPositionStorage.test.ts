import { describe, expect, it } from 'vitest';
import {
  loadPlayerPosition,
  PLAYER_POSITION_KEY,
  savePlayerPosition,
} from './playerPositionStorage';

function memoryStorage(initial?: string) {
  const map = new Map<string, string>();
  if (initial !== undefined) map.set(PLAYER_POSITION_KEY, initial);
  return {
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => {
      map.set(key, value);
    },
  };
}

describe('playerPositionStorage', () => {
  it('devuelve null cuando no hay posición guardada', () => {
    expect(loadPlayerPosition(memoryStorage())).toBeNull();
  });

  it('guarda y recupera la tesela redondeada', () => {
    const storage = memoryStorage();
    savePlayerPosition({ x: 588.4, y: 586.7 }, storage);
    expect(loadPlayerPosition(storage)).toEqual({ x: 588, y: 587 });
  });

  it('descarta JSON corrupto y coordenadas no finitas', () => {
    expect(loadPlayerPosition(memoryStorage('{no-json'))).toBeNull();
    expect(loadPlayerPosition(memoryStorage('{"x":"588","y":586}'))).toBeNull();
    expect(loadPlayerPosition(memoryStorage('{"x":null,"y":586}'))).toBeNull();
    expect(loadPlayerPosition(memoryStorage('{"x":1e999,"y":586}'))).toBeNull();
  });

  it('no lanza si el almacenamiento rechaza la escritura', () => {
    const storage = {
      getItem: () => null,
      setItem: () => {
        throw new Error('quota');
      },
    };
    expect(() => savePlayerPosition({ x: 1, y: 2 }, storage)).not.toThrow();
  });
});
