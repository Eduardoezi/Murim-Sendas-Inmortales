# 📜 RESUMEN EJECUTIVO: GDD MAESTRO V3 — MURIM: SENDAS INMORTALES

> **Fuente Oficial:** `c:\Users\Eduardo\OneDrive\Documentos\Murin\?? GDD MAESTRO_ MURIM - SENDAS INMORTALES.docx` (76.682 palabras, 20 Secciones completas).  
> **Fecha Objetivo del GDD:** 01/12/2027 · **Equipo:** Pequeño (2–5 personas).  
> **Estado:** Documento Fundacional Definitivo V3.0.

---

## 1. HIGH CONCEPT Y PILARES (SECCIÓN 1)
- **Concepto:** Mundo abierto MMORPG de cultivo Xianxia/Wuxia persistente, simulación autónoma (Motor Wulin) y narrativa por IA posterior al lanzamiento. En el lanzamiento oficial (1.0), **todo el juego funciona puramente con código determinista y lógica matemática**, sin depender de APIs de IA.
- **Dualidad de Experiencias:**
  1. **Instancia Administrativa (UI):** Pantallas en React 19 + Tailwind con estética Manhwa, dorados y glassmorphism (Cultivo, Alquimia, Forja, Relaciones, Ficha).
  2. **Instancia de Mundo (Gameplay):** Mundo isométrico explorable en **Phaser 3 (WebGL/Canvas)** con movimiento *click-to-move* y combate en tiempo real modulado por estadísticas.
- **Pilares (por orden de prioridad):**
  1. *Cultivo, Combate y Formación* (Entrenamiento/Aprendizaje) — Núcleo fundamental.
  2. *Economía, Política y Romance* — Capa social.
  3. *Facciones, Narrativa, Alquimia, Forja, Bestias y Espíritus* — Capa de mundo.

---

## 2. EL MOTOR DE SIMULACIÓN WULIN (SECCIÓN 2)
- **Resolución crítica de contradicción:** Los Módulos 1 al 4 **no son prompts para una IA**, sino la **especificación de programación en Node.js/TypeScript**.
- **Ciclo de Ticks de Mundo:**
  1. Actualizar recursos de facciones (economía, ejército, espionaje).
  2. Procesar cola de acciones de clanes (máx. 3 nuevas por ciclo).
  3. Evaluar objetivos y eventos autónomos (guerras, plagas, economía).
  4. Propagación realista de noticias (rumores a 10-30 km/día; palomas a 100-200 km/día; sin omnisciencia).
- **Protocolo de Proactividad:** Cada 3 turnos se activa una complicación, movimiento de facción rival o reloj de arena.

---

## 3. CREACIÓN DE PERSONAJE (SECCIÓN 3)
1. **Identidad:** Nombre, Género, BaZi (Fecha de nacimiento astronómica), Linaje y Afinidad (Ortodoxo, Heterodoxo, Demoníaco).
2. **Lo Innato (Procedural):**
   - 3 Físicos Únicos (de 100 posibles; rarezas E a S).
   - 3 Providencias Innatas (de 100 posibles).
   - Cicatriz (trauma formativo) + Juramento (promesa de vida) = Arquetipo Narrativo.
3. **Historia Pre-Juego:** Narrada desde los 0 hasta los 16 años conectando sus cicatrices y primer contacto con el Qi.

---

## 4. SISTEMA DE CULTIVO (SECCIÓN 4)
- **8 Reinos Mortales Canónicos:**
  1. *Refinamiento de Qi* (Etapas 1–6) — Desbloquea Pulmón, Intestino y Estómago.
  2. *Establecimiento de Fundación* (1–6) — Bazo, Corazón, Intestino Delgado.
  3. *Núcleo Dorado* (1–6) — Vejiga, Riñón, Pericardio.
  4. *Alma Naciente* (1–6) — Triple Calentador, Vesícula, Hígado.
  5. *Formación del Espíritu* (1–6) — Ren Mai y Du Mai.
  6. *Vacío de Fusión Corporal* (1–6) — Chong Mai, Dai Mai, Yin/Yang Qiao.
  7. *Tribulación de Trascendencia* (1–6) — Yin Wei, Yang Wei.
  8. *Iluminación* (1–6) — Todos los meridianos unificados.
- **9 Escalas del Dantian:** Gota → Cáliz → Estanque → Lago → Mar → Océano → Firmamento → Cosmos → Primordial (x2 a x256 capacidad).
- **Ruptura de Reino:** Probabilidad base = $30\% + \text{Voluntad} \times 0.2 + \text{Pureza Dantian} \times 0.5$ (+35% con Píldora de Fundación). Si falla: se pierde el 50% del Qi y se gana Karma de Tribulación.

---

## 5. SISTEMA DE COMBATE (SECCIÓN 5)
- **Advertencia Obligatoria Previa:** El juego calcula la diferencia de Poder Efectivo antes de iniciar el combate:
  - $<10\%$: Equilibrado (50/50).
  - $30-50\%$: Dominio (85/15).
  - $>100\%$: Masacre (99/1).
  - $>2$ Reinos de diferencia: Bloqueo absoluto. Un mortal no puede herir a un Alma Naciente.
- **Acción en Tiempo Real:** En Phaser 3, el jugador controla el timing de ataque, bloqueo y esquiva, pero las estadísticas delimitan el daño matemático:
  $$\text{Daño Físico} = (\text{Ataque Base} + \text{Arma}) \times \left(1 - \frac{\text{Defensa Enemiga}}{\text{Defensa Enemiga} + 100}\right)$$

---

## 6. ARQUITECTURA TÉCNICA Y MATRIZ DE SCOPE MVP (SECCIÓN 16)
- **Stack:** React 19 + Tailwind + Vite / Phaser 3 / Zustand / Node.js + Express + SQLite / WebSockets / Event Bus (mitt.js).
- **Matriz MVP (Lanzamiento Fase 1):**
  - ✅ Creación de Personaje en 4 pasos.
  - ✅ Mapa Isométrico 20x20 con 3 POIs y movimiento click-to-move.
  - ✅ Meditación, Meridianos y Dantian en UI.
  - ⚠️ Combate PvE contra 1 bestia.
  - ✅ Mercado básico y Alforja.
  - ❌ Subastas, Multijugador e IA narrativa quedan para fases posteriores del roadmap.
