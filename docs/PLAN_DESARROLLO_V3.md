# 📜 PLAN DE DESARROLLO Y ARQUITECTURA MAESTRA V3: MURIM — SENDAS INMORTALES

> **Versión del Plan:** 3.0.0 (Alineado con GDD Maestro V3.0)  
> **Objetivo:** Establecer una arquitectura inquebrantable, contratos de datos estrictos y un protocolo de desarrollo modular a prueba de errores para ser ejecutado con **cualquier IA** (DeepSeek, Claude, ChatGPT, Gemini) sin riesgo de alucinaciones, código espagueti ni pérdidas de avance.

---

## 1. DIAGNÓSTICO: ¿POR QUÉ FALLARON V1 Y V2?

1. **Monolitismo descontrolado:**
   - En V1, `GameContext.tsx` acumuló más de 1.500 líneas con toda la lógica, red, audio y combate mezclados en un solo hook de React.
   - En V2, se mezcló lógica de motor procedural isométrica dentro de componentes de Phaser acoplados a React sin capas intermedias.
2. **Falta de contratos de tipos estrictos:**
   - Al no existir una carpeta `src/types/` canónica e inmutable, cada IA redefinía a su antojo interfaces como `Cultivator`, `PlayerState`, inventarios o atributos, rompiendo el build (`tsc --noEmit`).
3. **Pérdida de configuración crítica:**
   - La eliminación accidental de `tsconfig.json` provocó que los comandos de compilación fallaran silenciosamente o mostraran pantallas de ayuda de `tsc`.
4. **Vicio de "Parches Rápidos" de las IAs:**
   - Las IAs gratuitas tienden a reescribir archivos enteros inventando propiedades que no existen para salir del paso en lugar de respetar la arquitectura modular.

---

## 2. ARQUITECTURA TÉCNICA OFICIAL (GDD V3 - SECCIÓN 16)

El juego opera bajo una **Dualidad Estricta de Experiencias** comunicadas por desacoplamiento total:

```
┌─────────────────────────────────────────────────────────────────┐
│                    CLIENTE HÍBRIDO (FRONTEND)                  │
├────────────────────────────────┬────────────────────────────────┤
│      INSTANCIA ADMINISTRATIVA  │       INSTANCIA DE MUNDO       │
│        (UI / GESTIÓN)          │          (GAMEPLAY)            │
│       React 19 + Tailwind      │      Phaser 3 (WebGL/Canvas)   │
│  - Cultivo y Dantian           │  - Mapa Isométrico 20x20       │
│  - Ficha de Personaje / Stats  │  - Movimiento Click-to-Move    │
│  - Alquimia, Forja y Comercio  │  - Colisiones, Niebla y POIs   │
└────────────────────────────────┴────────────────────────────────┘
                               ▲
                               │ Event Bus (mitt.js) & Custom Events
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│              CORE & ESTADO GLOBAL (SHARED CLIENT)               │
│               Zustand Stores Ligeros y Modulares                │
│   useAuthStore · usePlayerStore · useWorldStore · useCombatStore │
└─────────────────────────────────────────────────────────────────┘
                               ▲
                               │ REST API / WebSockets (Node.js)
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│            MOTOR DE SIMULACIÓN WULIN (SERVER-SIDE)              │
│       Node.js + Express + SQLite (Persistencia Canónica)        │
│  - Ciclo de Ticks de Simulación (Economía, Sectas, Calendario)  │
│  - Fórmulas Matemáticas Autoritativas (Combate, Rupturas)       │
│  - Semillas Procedurales Deterministas (Mulberry32)             │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. ESTRUCTURA CANÓNICA DE DIRECTORIOS (V3)

Toda IA que intervenga en este repositorio **debe respetar estrictamente esta topología de archivos**. Queda prohibido crear archivos sueltos en `src/` o inventar carpetas fuera de esta norma:

```text
c:\Users\Eduardo\Proyectos\Murim-Sendas-Inmortales/
├── .gitignore
├── index.html
├── package.json
├── tsconfig.json                <-- SAGRADO: Reglas estrictas de compilación
├── vite.config.ts
├── docs/                        <-- Toda la documentación y contratos
│   ├── PLAN_DESARROLLO_V3.md    <-- Este documento
│   ├── GDD_MAESTRO_V3_RESUMEN.md
│   └── CONTRATOS_DE_DATOS.md
├── server/                      <-- Servidor Autoritativo y Motor Wulin
│   ├── db/
│   │   ├── schema.sql           <-- Esquema SQLite (players, inventory, etc.)
│   │   └── database.ts          <-- Conexión better-sqlite3 y migraciones
│   ├── simulation/              <-- Motor Wulin puro (Módulos 1-4 en código)
│   │   ├── calendar.ts          <-- Calendario solar/lunar y ticks de tiempo
│   │   ├── formulas.ts          <-- Fórmulas matemáticas oficiales del GDD
│   │   ├── propagation.ts       <-- Velocidad de noticias y rumores en Jianghu
│   │   └── factionAI.ts         <-- Ciclo de acciones de clanes y sectas
│   └── routes/
│       ├── auth.routes.ts
│       └── player.routes.ts
├── src/
│   ├── main.tsx
│   ├── App.tsx                  <-- Enrutador limpio (React Router v7)
│   ├── index.css                <-- Variables de diseño, fuentes y animación Qi
│   ├── types/                   <-- CONTRATOS DE TIPOS INMUTABLES
│   │   ├── player.types.ts      <-- Cultivador, Atributos, Meridianos, Dantian
│   │   ├── cultivation.types.ts <-- Reinos, Píldoras, Técnicas
│   │   ├── world.types.ts       <-- Provincias, POIs, Tiles, Biomas
│   │   └── combat.types.ts      <-- Poder Efectivo, Fórmulas de Daño
│   ├── core/                    <-- LÓGICA DE NEGOCIO Y ESTADO
│   │   ├── store/
│   │   │   ├── useAuthStore.ts
│   │   │   ├── usePlayerStore.ts
│   │   │   └── useWorldStore.ts
│   │   └── utils/
│   │       ├── mathMurim.ts     <-- Implementación de fórmulas del GDD
│   │       ├── prng.ts          <-- Generador pseudo-aleatorio Mulberry32
│   │       ├── nameGenerator.ts
│   │       └── storyGenerator.ts
│   ├── game/                    <-- MOTOR ISOMÉTRICO PHASER 3
│   │   ├── config.ts            <-- Configuración WebGL de Phaser
│   │   ├── events/              <-- EventBus entre Phaser y React
│   │   │   └── EventBus.ts
│   │   ├── scenes/
│   │   │   ├── BootScene.ts
│   │   │   └── WorldScene.ts    <-- Mapa isométrico 20x20 y click-to-move
│   │   └── utils/
│   │       └── isoMath.ts       <-- Proyección cartesiana a isométrica 2:1
│   └── ui/                      <-- INTERFAZ GRÁFICA MANHWA (REACT)
│       ├── components/          <-- Componentes atómicos reutilizables
│       │   ├── Navbar.tsx       <-- HUD superior (Reino, HP, Qi, Piedras)
│       │   ├── MeditationPanel.tsx
│       │   ├── AttributesGrid.tsx
│       │   └── InventoryDrawer.tsx
│       └── screens/             <-- Pantallas principales
│           ├── LandingPage.tsx
│           ├── AuthPage.tsx
│           ├── CreationPage.tsx <-- Asistente canónico de 4 pasos
│           └── AdminPage.tsx    <-- Hub que monta Phaser + Paneles UI
```

---

## 4. CONTRATO MAESTRO DE TIPOS (EL "ESCUDO ANTI-ALUCINACIONES")

Para que una IA no invente campos, el archivo `src/types/player.types.ts` contiene la verdad única del personaje:

```typescript
// 10 Atributos Canónicos (GDD Sección 3 & Módulo 2)
export interface CultivatorAttributes {
  fuerza: number;        // Daño físico base y capacidad de carga
  destreza: number;      // Velocidad de ataque, esquiva y críticos
  constitucion: number;  // Salud Máxima (HP = 50 + CON * 12 + Dantian * 20)
  inteligencia: number;  // Capacidad de aprender técnicas marciales
  percepcion: number;    // Detección de peligro y ganancia pasiva de Qi
  astucia: number;       // Comercio, engaño y tácticas sucias
  voluntad: number;      // Resistencia mental y rupturas de reino
  suerte: number;        // Probabilidad de encuentros fortuitos y botín
  carisma: number;       // Diplomacia y reclutamiento
  sabiduria: number;     // Eficiencia de comprensión y cultivo
}

// 9 Escalas de Almacenamiento del Dantian (GDD Sección 4.5)
export type DantianScale = 
  | 'Gota' | 'Cáliz' | 'Estanque' | 'Lago' 
  | 'Mar' | 'Océano' | 'Firmamento' | 'Cosmos' | 'Primordial';

// Reinos Mortales Canónicos (GDD Sección 4.4)
export type MortalRealm = 
  | 'Refinamiento de Qi'
  | 'Establecimiento de Fundación'
  | 'Núcleo Dorado'
  | 'Alma Naciente'
  | 'Formación del Espíritu'
  | 'Vacío de Fusión Corporal'
  | 'Tribulación de Trascendencia'
  | 'Iluminación';

export interface PlayerData {
  id: string;
  name: string;
  gender: 'Hombre' | 'Mujer' | 'Otro';
  birthdate: string;
  lineage: string;
  affinity: 'Ortodoxo' | 'Heterodoxo' | 'Demoníaco';
  faction: string;
  realm: MortalRealm;
  subRealm: number; // 1 a 6
  dantianScale: DantianScale;
  dantianPurity: number; // 0 a 100%
  hp: number;
  maxHp: number;
  qi: number;
  maxQi: number;
  spiritStones: number;
  sectMerits: number;
  attributes: CultivatorAttributes;
}
```

---

## 5. REGLAS DE ORO DE DESARROLLO (FÓRMULAS DEL GDD V3)

Toda IA que implemente mecánicas debe utilizar estas fórmulas del código oficial y **jamás inventar multiplicadores**:

1. **Salud Máxima:**
   $$\text{MaxHP} = 50 + (\text{Constitución} \times 12) + (\text{Nivel Dantian} \times 20)$$
2. **Qi Máximo:**
   $$\text{MaxQi} = 100 + (\text{Karma} \times 20) + \left(\frac{\text{Capacidad Dantian}}{100}\right)$$
3. **Ganancia de Qi por Meditación:**
   $$\text{QiGanado} = 0.5 \times \left(\text{Percepción} + \frac{\text{Voluntad}}{2}\right) \times \text{Mult\_Dantian}$$
4. **Cálculo de Daño Físico:**
   $$\text{Daño} = (\text{Ataque Base} + \text{Arma}) \times \left(1 - \frac{\text{Defensa Enemiga}}{\text{Defensa Enemiga} + 100}\right)$$
5. **Generador de Números Pseudoaleatorios (PRNG):**
   - **PROHIBIDO** usar `Math.random()` en la simulación o generación de mazmorras/mapas.
   - **OBLIGATORIO** usar Mulberry32 determinista con semilla: `Semilla = ID_Jugador + ID_Lugar + Timestamp_Tick`.

---

## 6. PROTOCOLO DE TRABAJO CON CUALQUIER IA (PROMPT MAESTRO)

Cuando trabajes con DeepSeek, Claude, ChatGPT o cualquier modelo gratuito, **copia y pega siempre este encabezado en tus conversaciones**:

> ### 🛑 PROMPT OBLIGATORIO DE ARRANQUE PARA LA IA:
> "Estoy desarrollando el videojuego **Murim: Sendas Inmortales V3**.
> **Reglas estrictas que debes acatar:**
> 1. No inventes propiedades ni redefinas tipos existentes. Respeta `src/types/player.types.ts`.
> 2. Mantén la separación estricta: React es para UI/Gestión y Phaser 3 para el mapa isométrico. No mezcles lógica de juego en componentes de interfaz.
> 3. No utilices `Math.random()`, usa la semilla determinista Mulberry32 según el GDD.
> 4. Al entregar código, asegúrate de que compile sin errores ejecutando mentalmente `tsc --noEmit`. No dejes código incompleto con `// ...resto del código`.
> 5. Limítate estrictamente al alcance del paso que te solicito sin modificar otros módulos."

---

## 7. ROADMAP POR FASES CONTROLADAS (PASO A PASO)

- **Fase 0: Estabilización Inmediata y Base Limpia (ACTUAL)**
  - Restaurar `tsconfig.json` y tipar `usePlayerStore.ts` y pantallas para que `npm run build` pase con 0 errores.
  - Dejar guardados los documentos oficiales en el repositorio (`docs/`).
- **Fase 1: Vertical Slice Mortal (Meses 1–3)**
  - Creación de personaje en 4 pasos (Nombre, Identidad, Lo Innato con 3 Providencias y Físicos, Historia generada).
  - Integración del mapa isométrico 20x20 en Phaser 3 (movimiento click-to-move e interacción con 3 POIs).
  - Meditación, acumulación de Qi y apertura de meridianos en React.
- **Fase 2: Motor Wulin y Persistencia (Meses 4–6)**
  - Servidor Express + SQLite con guardado autoritativo del estado.
  - Combate estadístico contra 1 tipo de bestia en tiempo real con advertencia previa de victoria.
  - Economía de mercado básica en ciudad y alforja espiritual.
