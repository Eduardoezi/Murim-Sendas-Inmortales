# PLAN DE SPRINTS V1.1 — MURIM: SENDAS INMORTALES

> **Versión:** 1.1.0 — revisión de realidad post-incidente WebGL  
> **Fecha:** 2026-10-28  
> **Horizonte:** 20 semanas de trabajo + 2 de buffer (Fase 1)  
> **Fuentes:** `GDD_MAESTRO_V3_RESUMEN.md`, `GDD MAESTRO_MURIM - SENDAS INMORTALES.md`, `PLAN_DESARROLLO_V3.md`, auditoría técnica y revisión de guerra del equipo.  
> **Objetivo rector:** elevar la calidad visual a nivel profesional **sin romper** el runtime WebGL ni la autoridad del servidor.

---

## REGISTRO DE REALIDAD (V1.1)

Este plan reemplaza varias decisiones de la V1.0 que la realidad del código desmintió. La regla es simple: **si el código contradice el plan, gana el código hasta que se documente lo contrario.**

| Decisión V1.0 | Realidad verificada | Corrección V1.1 |
|---|---|---|
| El agua es obstáculo | El diseño exige **nadar**; el agua ya es transitable en `ChunkManager` | El agua no bloquea; se implementa estado de nado y coste de velocidad/estamina |
| Eliminar `worldOrigin` | `worldOrigin` es necesario para anclar el mapa absoluto 1000×1000 a los chunks locales | Se conserva; se encapsula en `IsoMath` con conversiones explícitas y tests |
| Restaurar anti corner-cutting | Se quitó a propósito para no atascar al jugador entre props | Se pospone a Sprint 2; el fallback se queda, pero **acotado y validado** |
| Minimapa con herramientas Phaser | `GeometryMask`/`BitmapMask` rompían el framebuffer WebGL | El recorte se hace con **Canvas 2D + `ctx.clip()`**; prohibidas las máscaras |
| Destrackear `node_modules`/`dist`/BD | `.gitignore` está bien, pero Git **sigue trackeando** 19.643 archivos de `node_modules`, 17 de `dist` y la BD | No está completado: falta `git rm -r --cached` y commit |
| El cliente jugador puede registrar eventos | `usePlayerStore` llama a `adminService.logEvent` en cada ascenso; la ruta `/api/admin/event` no existe y está tras `isAdmin` | Se elimina del cliente; el servidor registra el ascenso |
| Sincronizar POIs desde el mundo | El cliente Phaser no debe llamar rutas admin | Se elimina cualquier llamada admin del cliente jugador; sync solo manual desde el Dashboard |
| Reactivación de viñeta | La viñeta no existe en el `WorldScene` actual; se quitó junto con la capa UI | Es una **feature nueva**, no una restauración; va en capa independiente |
| Modal de POIs “desconectado” | React escucha `ui:open-modal`, pero **nadie lo emite** en el mundo | No es reconectar: hay que crear el emisor mínimo (proximidad a POI) |
| Chang’an está en (580, 334) | La proyección real de Shaanxi/Chang’an es **(580, 578)**; (580, 334) es el fallback hardcodeado de `WorldScene` | Se corrige el fallback y se tipa `coords`; no se toca `worldOrigin` |

### Reglas de realidad
1. **Prohibidas las máscaras WebGL** (`GeometryMask`, `BitmapMask`) en minimapa, viñeta o UI de mundo.
2. **Prohibido llamar `/api/admin/*` desde el cliente jugador** (Phaser, stores de jugador, pantallas no-admin).
3. **Toda textura referenciada debe existir** en el arranque; si falta, es bug de release, no “arte pendiente”.
4. **Todo fallback de movimiento debe ser acotado**: destino transitable, distancia máxima y log de “unstick”.
5. **El agua se nada**, no se bloquea; la profundidad decide velocidad, estamina y riesgo, no colisión.

---

## 0. CÓMO LEER ESTE PLAN

- **Cadencia:** sprints de 2 semanas; el Sprint 0 y el Sprint 0.5 duran 1 semana cada uno para desbloquear el arte cuanto antes.
- **Unidad de estimación:** puntos de historia (1 pt ≈ media jornada de una persona). Capacidad de referencia: **20–24 pts/sprint para 2 personas**; con 4–5 personas, duplicar y paralelizar por área.
- **Regla de oro:** ningún sprint se cierra sin `typecheck` verde, build de cliente y servidor, demo jugable y **evidencia visual** (capturas 1920×1080 a zoom 1.0 y 2.0 + vídeo de 10 s).
- **Regla de alcance:** lo que no esté en el sprint, no se toca. Los deseos nuevos van al backlog.
- **Regla de determinismo:** prohibido `Math.random()` en mundo, loot, fauna o simulación; usar Mulberry32.
- **Regla de arquitectura:** React para UI/gestión, Phaser para mundo/gameplay; el servidor es la fuente de verdad de la progresión.

---

## 1. DIAGNÓSTICO DE PARTIDA

### 1.1 Fortalezas sobre las que construir
- Mundo determinista geo-referenciado a China con chunks 16×16 y streaming por radio.
- Separación React/Phaser/Zustand y contratos de tipos que ya compilan sin errores.
- Servidor Express + SQLite con autenticación, progreso, inventario y portal de administración funcional.
- Documentación de GDD y arquitectura muy por encima de la media para un proyecto indie.

### 1.2 Brechas que frenan el avance
| Área | Brecha | Impacto |
|---|---|---|
| Coordenadas | `worldOrigin` se conserva, pero el fallback de spawn apunta a (580, 334) en vez de (580, 578) y las conversiones están dispersas | Riesgo de spawn en el lugar equivocado y clics imprecisos |
| Movimiento | Fallback directo que ignora colisiones; sin cancelación; agua transitable sin estado de nado | Se atraviesan montañas; se camina sobre el agua |
| Features | POIs, bestias, pausa y guardado de posición fueron desconectados del `WorldScene` actual | El mundo se siente vacío y sin persistencia |
| Admin | SSE de logs 401; métricas con offsets fijos; `logEvent` desde el cliente jugador; sync de POIs no-op | Panel poco confiable y 403/404 silenciosos |
| Repositorio | `node_modules/`, `dist/` y la BD siguen versionados pese al `.gitignore` | Clonado lento, merges dolorosos |
| **Visual** | Tiles, árboles y personaje se dibujan con `Phaser.Graphics` (colores planos, figura de palitos) | **Principal deuda percibida por el jugador** |
| **Visual** | `beast_snake` y `splash_ring` se usan pero **nunca se crean** | Cuadros verdes/negros de textura faltante en fauna acuática y chapoteos |
| **Visual** | Sprites `idle/walk/run/combat/crouch.png` (1024×559) sin cargar ni usar | Activos desperdiciados |
| **Visual** | Sin `BootScene`, sin atlas, sin sombras, sin iluminación, sin autotiling, sin viñeta | El mundo parece un prototipo |
| UI | Tailwind sin tokens de diseño; HUD funcional pero genérico | No transmite la estética Manhwa del GDD |
| Calidad | Sin tests, lint ni CI | Regresiones silenciosas |

### 1.3 Deuda de runtime verificada (2026-10-28)
| ID | Hallazgo | Estado | Evidencia |
|---|---|---|---|
| R-01 | `beast_snake` y `splash_ring` no se crean en ningún `preload` | Confirmado | `ChunkManager.ts:203,251` vs texturas creadas |
| R-02 | El cliente jugador llama a una ruta admin inexistente en cada ascenso | Confirmado | `usePlayerStore.ts:137`, `adminService.ts:146` |
| R-03 | `node_modules` (19.643), `dist` (17) y `server/database.sqlite` siguen trackeados | Confirmado | `git ls-files` |
| R-04 | El minimapa ya no usa máscaras; recorta con Canvas 2D | Confirmado | `MinimapSystem.ts:231-239` |
| R-05 | La viñeta no existe en el `WorldScene` actual | Confirmado | `WorldScene.ts` sin capa UI |
| R-06 | El modal de POIs no tiene emisor en el mundo | Confirmado | `AdminPage.tsx` escucha `ui:open-modal`; nadie lo emite |
| R-07 | El agua es transitable, pero el jugador no tiene estado de nado | Confirmado | `ChunkManager` no añade agua a `obstacles`; `PlayerEntity` solo camina |
| R-08 | `isImpassableGeo` bloquea ríos, lagos y mar, incluido el clic del minimapa | Confirmado | `geoSampler.ts:346-349` |
| R-09 | “Sincronizar POIs” no envía payload y el servidor ignora el body | Confirmado | `adminService.ts:105`, `router.ts:243` |
| R-10 | El SSE de logs se registra después de `adminRouter.use(isAdmin)` | Confirmado | `router.ts:86` vs `router.ts:467` |

### 1.4 Deuda visual concreta (lo que se ve en pantalla)
1. Tiles de un solo color plano y sin transiciones entre biomas.
2. Árboles y montañas de silueta simple, sin sombra de contacto ni volumen.
3. Personaje dibujado con líneas y círculos; sin animación real ni sombra.
4. Agua representada por un tinte y un parpadeo de alpha; sin olas, espuma ni orillas.
5. Fauna acuática con textura faltante (cuadros verdes/negros).
6. Sin jerarquía de profundidad convincente (props y personaje compiten).
7. Sin atmósfera: ni día/noche, ni partículas, ni niebla, ni foco de cámara.
8. HUD y paneles correctos pero sin sistema de diseño ni microinteracciones.

---

## 2. EQUIPO, ROLES Y HERRAMIENTAS

### 2.1 Roles mínimos
| Rol | Responsabilidad | Dedicación |
|---|---|---|
| **P1 — Tech Lead / Gameplay** | Phaser, coordenadas, pathfinding, nado, combate, rendimiento | Full-time |
| **P2 — Backend / Sistemas** | Express, SQLite, simulación, autoridad, seguridad | Full-time o 0.75 |
| **P3 — Arte / UI** | Art Bible, tileset, sprites, VFX, Figma, Tailwind | Full-time o 0.75 |
| **P4 — QA / DevOps** | CI, tests, Playwright, profiling, releases | 0.5 |

> Con 2 personas: P1 + P3 en el día a día y P2 a tiempo parcial. El orden está pensado para que **P1 y P3 trabajen en paralelo** desde el Sprint 1.

### 2.2 Herramientas
- **Gestión:** GitHub Projects (o Linear) con columnas Backlog / Ready / In Progress / Review / QA / Done.
- **Diseño:** Figma (Art Bible, UI kit), PureRef (referencias).
- **Arte de mundo:** Tiled, Aseprite, TexturePacker, LDtk opcional.
- **Calidad:** Playwright (smoke + snapshots visuales), Vitest (matemáticas/PRNG/pathfinding), Lighthouse.
- **Perfilado:** Chrome DevTools Performance, Phaser Debug Graph, `renderer.info`.

---

## 3. CEREMONIAS, FLUJO Y DEFINICIÓN DE TERMINADO

### 3.1 Ceremonias
- **Planning** (2 h, lunes de inicio): objetivo, historias, criterios, riesgos.
- **Daily** (10 min): bloqueos y avance, no estatus.
- **Review** (45 min, viernes final): demo jugable + evidencia visual + métricas.
- **Retro** (30 min): una mejora accionable para el siguiente sprint.

### 3.2 Ramas y PRs
- `main` protegida: solo entra por PR con CI verde y una revisión.
- Ramas `feat/*`, `fix/*`, `art/*`, `chore/*`.
- Commits convencionales: `feat:`, `fix:`, `art:`, `perf:`, `chore:`.
- **PR con cambio visual obliga a captura antes/después y FPS medido.**

### 3.3 Definition of Done (DoD)
- [ ] Compila cliente y servidor (`tsc --noEmit` en ambos tsconfig).
- [ ] Lint y tests pasan; sin `any` nuevos sin justificar.
- [ ] Sin `Math.random()` en simulación/mundo.
- [ ] Sin secretos ni artefactos generados en el commit.
- [ ] Sin llamadas `/api/admin/*` desde el cliente jugador.
- [ ] Todas las texturas referenciadas existen en runtime.
- [ ] Criterios de aceptación verificados por QA.
- [ ] Evidencia visual y de rendimiento adjunta cuando aplique.
- [ ] Documentación o contrato actualizado si cambia una interfaz.

---

## 4. CALIDAD VISUAL: PUERTAS MEDIBLES (VISUAL GATES)

| Puerta | Fin de sprint | Criterio medible | Evidencia |
|---|---|---|---|
| **VG0 — Base legible** | S0 | Sin texturas faltantes; paleta desaturada; sombra de contacto; zoom inicial 1.5 | Captura 1 |
| **VG0.5 — Runtime estable** | S0.5 | Minimapa 30 min sin pantalla negra; viñeta no tapa el minimapa; nado MVP | Vídeo + consola limpia |
| **VG1 — Lenguaje visual** | S1 | Art Bible aprobada; 100 % de la UI usa tokens; 3 biomas con tileset; pantalla de carga | Figma + capturas |
| **VG2 — Mundo creíble** | S2 | Agua con autotiling sin huecos; ≥6 props por bioma; transiciones; AO | Captura de 3 biomas + vídeo |
| **VG3 — Personaje profesional** | S3 | 8 direcciones × 6 frames; idle/walk/run/nado; sombra; sin deslizamiento | Vídeo 10 s + GIF |
| **VG4 — Mundo vivo** | S4 | POIs interactivos; día/noche; ≥4 sistemas de partículas; sin artefactos de profundidad | Captura día/noche |
| **VG5 — UI premium** | S5 | Biblioteca de componentes; WCAG AA; responsive; HUD animado | Figma + desktop/móvil |
| **VG6 — Combate legible** | S6 | Telegraphs, VFX de impacto, números de daño, hitstop; 1 bestia completa | Vídeo de combate |

### 4.1 Presupuesto de rendimiento (obligatorio desde S1)
| Métrica | Objetivo |
|---|---|
| FPS escritorio (1080p) | 60 estables |
| FPS portátil/integrada | ≥30 |
| Frame time p95 | <16.6 ms (escritorio) |
| Carga de chunk | ≤4 ms/frame amortizado |
| Draw calls por frame | <100 |
| Memoria JS | <400 MB en sesión de 30 min |
| Carga inicial | <5 s en banda ancha |
| Atlas de texturas | ≤2048×2048 por atlas |

### 4.2 Dirección de arte (resumen ejecutable)
- **Perspectiva:** isométrica 2:1, tiles 64×32, altura de cubo 16 px, cámara con zoom 1.0–3.5.
- **Paleta:** base desaturada y terrosa (ocres, verdes oliva, grises piedra, azules profundos); dorado y jade reservados para lo sagrado y el Qi.
- **Iluminación:** una dirección de luz coherente (suroeste), sombras de contacto suaves y AO en bordes; ciclo día/noche con tinte ambiental.
- **Silueta:** el personaje debe leerse a 64 px de altura; props con siluetas distintas por bioma.
- **Animación:** 6 frames por ciclo a 10–12 FPS; transiciones de 80–120 ms; hitstop de 60–90 ms.
- **UI:** estética Manhwa: vidrio esmerilado, bordes finos dorados, Cinzel para títulos e Inter para cuerpo, iconografía lucide, radios 8–14 px.

---

## 5. ROADMAP RESUMIDO

| Sprint | Semanas | Tema | Hito / Puerta |
|---|---|---|---|
| **S0** | 1 | Estabilización y quick wins visuales | Base estable · VG0 |
| **S0.5** | 2 | Hardening runtime WebGL | VG0.5 |
| **S1** | 3–4 | Art Bible, pipeline y fundación visual | VG1 |
| **S2** | 5–6 | Terreno, agua y biomas | VG2 |
| **S3** | 7–8 | Personaje, animación y game feel | **M3 · VG3** |
| **Buffer** | 9–10 | Festivos / desviaciones | — |
| **S4** | 11–12 | Poblado del mundo y atmósfera | VG4 |
| **S5** | 13–14 | UI/HUD Manhwa | VG5 |
| **S6** | 15–16 | Combate PvE y feedback | **M4 · VG6** |
| **S7** | 17–18 | Persistencia y progresión autoritativa | — |
| **S8** | 19–20 | Rendimiento, accesibilidad y QA | — |
| **S9** | 21–22 | Vertical slice y beta interna | **M5** |

> Fechas orientativas: inicio 2026-11-02; M3 en la semana del 2026-12-14; M4 en la semana del 2027-02-08; M5 en la semana del 2027-03-29. El buffer absorbe festivos y desviaciones.

---

## 6. DETALLE DE SPRINTS

### SPRINT 0 — Estabilización y quick wins visuales
**Duración:** 1 semana · **Capacidad:** 22 pts · **Responsables:** P1, P2, P3 (parcial)

**Objetivo:** dejar una base confiable y una primera mejora visual perceptible antes de invertir en arte.

| ID | Historia | Pts | Criterio de aceptación |
|---|---|---|---|
| US-0.1 | **IsoMath con `worldOrigin` conservado.** Centralizar `mapToScreen`/`screenToMap`/`absToLocal`/`localToAbs`; corregir el fallback de spawn a (580, 578); tipar `coords` | 5 | 20 clics aleatorios desvían ≤1 tile; test de ida/vuelta; spawn correcto |
| US-0.2 | **Pathfinding permisivo y fallback acotado.** Mantener el movimiento diagonal libre; el fallback solo aplica si el destino es transitable, distancia ≤12 tiles y no hay montaña; registrar “unstick” | 3 | No se atraviesan montañas; el jugador no queda atascado; log de eventos |
| US-0.3 | **Repo y CI.** `.gitignore` definitivo, `git rm -r --cached` de `node_modules`, `dist` y BD; scripts `typecheck`, `test`, `build`; GitHub Actions | 3 | Clonado <100 MB; CI verde; `git ls-files node_modules` = 0 |
| US-0.4 | **Admin runtime.** Corregir orden del middleware SSE; quitar offsets +14/+555; contar online distintos; proteger `/admin`; eliminar `adminService.logEvent` del store del jugador y registrar el ascenso en servidor | 4 | SSE “Conectado”; métricas reales; cero llamadas admin desde el jugador |
| US-0.5 | **Persistencia de posición.** Validar `x/y` en servidor; limpiar coordenadas corruptas; limpiar `murim_world_pos` al resetear | 2 | Posición siempre 0..999; sin datos basura |
| US-0.6 | **Features desconectadas.** Documentar el estado de POIs, bestias, pausa y guardado; eliminar listeners huérfanos | 1 | Documento de decisión + código sin listeners sin emisor |
| US-0.7 | **Auditoría de assets.** Inventario y licencias de `public/assets`, incluidos los sprites 1024×559 | 1 | Inventario con licencia y uso previsto |
| US-0.8 | **Quick wins visuales.** Paleta desaturada, sombras de contacto, zoom inicial 1.5 | 2 | VG0 aprobada en revisión visual |
| US-0.9 | **Texturas completas.** Crear `beast_snake`, `splash_ring` y cualquier textura de POI; manifiesto `ensureTexture` y test de arranque | 2 | Cero cuadros verdes/negros; test falla si falta una textura |

**Entregables:** build reproducible, movimiento fiable, panel admin confiable, texturas completas y primer “antes/después” visual.  
**Riesgos:** tocar coordenadas puede romper el minimapa; mitigar con tests y revisión conjunta de `WorldScene`/`ChunkManager`/`MinimapSystem`.

---

### SPRINT 0.5 — Hardening runtime WebGL
**Duración:** 1 semana · **Capacidad:** 20 pts · **Responsables:** P1, P3, P4

**Objetivo:** estabilizar el runtime que la semana pasada nos declaró la guerra, antes de que arte y UI se apoyen en él.

| ID | Historia | Pts | Criterio de aceptación |
|---|---|---|---|
| US-0.5.1 | **Soak test del minimapa Canvas 2D.** 30 min de juego continuo, resize, zoom, cruce de chunks y cambio de bioma | 5 | Sin pantalla negra, sin fugas, sin errores de consola |
| US-0.5.2 | **Viñeta en capa independiente.** `Layer` propia con depth inferior al minimapa; toggle para depurar | 2 | No tapa el minimapa ni la UI; sin máscaras WebGL |
| US-0.5.3 | **Emisor mínimo de POIs.** Si el jugador está a ≤2 tiles de un POI, emitir `ui:open-modal`; abrir/cerrar con pausa | 5 | Modal abre y cierra sin romper el mundo |
| US-0.5.4 | **Nado MVP.** Agua transitable, velocidad −40 %, cuerpo sumergido y ondulación; separar `isSwimmableGeo` de `isImpassableGeo` | 3 | El jugador nada y el minimapa permite hacer clic en agua |
| US-0.5.5 | **Suite de regresión runtime.** Playwright: 30 s de juego, captura, chequeo de texturas y errores de consola | 3 | Falla el CI si reaparece una textura ausente o un error |
| US-0.5.6 | **Guardrails WebGL.** Detección de pérdida de contexto, fallback a Canvas y aviso al jugador | 2 | El juego no queda en negro; se muestra aviso |

**Entregables:** VG0.5, minimapa probado, POIs mínimos y nado MVP.  
**Riesgos:** el nado puede alterar el pathfinding; mitigar con tests de rutas que cruzan ríos.

---

### SPRINT 1 — Art Bible, pipeline y fundación visual
**Duración:** 2 semanas · **Capacidad:** 18 pts · **Responsables:** P3 lidera; P1 integra

**Objetivo:** definir el lenguaje visual y montar el pipeline para que todo el arte posterior sea consistente y barato de integrar.

| ID | Historia | Pts | Criterio de aceptación |
|---|---|---|---|
| US-1.1 | **Art Bible v1.** Perspectiva, paleta, luz, escala, siluetas, legibilidad y referencias | 3 | Aprobada en `docs/ART_BIBLE.md` |
| US-1.2 | **Pipeline de assets.** Tiled + atlas + TexturePacker; convención de nombres y carpetas | 3 | Un tileset de prueba entra al juego sin tocar código |
| US-1.3 | **Tokens de UI.** Colores, tipografía, espaciado, radios, sombras y vidrio en Tailwind 4 (`@theme`) | 3 | 100 % del HUD usa tokens; sin hex sueltos |
| US-1.4 | **BootScene y carga.** Precarga real con barra de progreso y transición | 2 | Carga <5 s; sin parpadeo de texturas |
| US-1.5 | **HUD frame.** Rediseño de header y navegación con tokens; iconografía unificada | 3 | Aprobado con captura |
| US-1.6 | **Primer tileset isométrico.** 3 variantes por bioma base + sombra integrada | 4 | Sustituye los tiles planos en Shaanxi; VG1 |

**Entregables:** Art Bible, UI kit inicial, `BootScene`, primer tileset integrado.  
**Archivos clave:** `docs/ART_BIBLE.md`, `src/index.css`, `src/game/scenes/BootScene.ts` (nuevo), `src/game/config.ts`, `src/game/scenes/WorldScene.ts`, `public/assets/tilesets/`.  
**Riesgos:** licencias incompatibles; mitigar con la auditoría de S0 y preferencia por CC0 o compra comercial.

---

### SPRINT 2 — Terreno, agua y biomas
**Duración:** 2 semanas · **Capacidad:** 26 pts · **Responsables:** P1 + P3

**Objetivo:** que el mundo deje de verse como una cuadrícula de colores y pase a leerse como un paisaje coherente, con agua nadable.

| ID | Historia | Pts | Criterio de aceptación |
|---|---|---|---|
| US-2.1 | **Autotiling de agua (47 piezas).** Orillas, esquinas, agua profunda y canales | 5 | Sin huecos ni bordes rectos; 3 tipos de agua |
| US-2.2 | **Transiciones de bioma y elevación.** Hierba→arena→nieve; acantilados y mesetas | 5 | 3 biomas contiguos sin costuras visibles |
| US-2.3 | **Agua animada.** Atlas de 8 frames, espuma y reflejo sutil | 3 | Animación a 8–10 FPS sin coste >1 ms |
| US-2.4 | **Props por bioma.** ≥6 variantes (rocas, flores, juncos, troncos, nieve) | 5 | Densidad y variedad por bioma verificadas |
| US-2.5 | **Sombras y AO.** Sombra de contacto y oclusión en acantilados/árboles | 3 | Sin halos; profundidad perceptible |
| US-2.6 | **Atlas y capas de render.** Separar suelo/props/agua y presupuestar draw calls | 3 | <100 draw calls; 60 FPS |
| US-2.7 | **Profundidad de agua y estamina.** Aguas someras nadables; mar profundo con límite de Qi/estamina | 2 | El jugador no cruza el océano sin coste; aviso de fatiga |

**Entregables:** VG2 y un mundo que se sostiene visualmente en capturas y vídeo.  
**Archivos clave:** `src/core/data/world/generators/terrainGenerator.ts`, `src/core/data/world/generators/geoSampler.ts`, `src/game/managers/ChunkManager.ts`, `src/game/data/props.ts` (nuevo), `public/assets/tilesets/`.  
**Riesgos:** el autotiling puede multiplicar draw calls; mitigar con atlas y capas. El nado profundo puede desbalancear la exploración; ajustar con telemetría.

---

### SPRINT 3 — Personaje, animación y game feel
**Duración:** 2 semanas · **Capacidad:** 24 pts · **Responsables:** P1 + P3

**Objetivo:** convertir al personaje de figura de palitos en un avatar animado con peso y respuesta.

| ID | Historia | Pts | Criterio de aceptación |
|---|---|---|---|
| US-3.1 | **Atlas de personaje 8 direcciones.** Idle/walk/run/nado, 6 frames por ciclo | 8 | 8 direcciones completas; sin frames faltantes |
| US-3.2 | **Máquina de estados.** Idle/walk/run/nadar/meditar/combate con blending | 5 | Sin saltos visuales; cambio <120 ms |
| US-3.3 | **Movimiento cancelable y marcador.** Re-target, preview de ruta y marcador de destino | 3 | Nuevo clic cancela y redirige; marcador visible |
| US-3.4 | **Sombra y polvo.** Sombra de contacto y partículas de paso por bioma | 2 | Sombra estable; polvo solo al caminar |
| US-3.5 | **Cámara profesional.** Suavizado, límites, zoom y foco | 3 | Sin saltos; zoom 1.0–3.5 estable |
| US-3.6 | **Personalización visual.** Aplicar piel, pelo y ropa del creador al avatar | 3 | Los 3 rasgos se reflejan en el sprite |

**Entregables:** **M3 — visual vertical slice**: mundo + personaje + cámara listos para enseñar.  
**Archivos clave:** `src/game/entities/PlayerEntity.ts`, `src/game/entities/PlayerAnimator.ts` (nuevo), `src/game/systems/CameraController.ts` (nuevo), `public/assets/sprites/`.  
**Riesgos:** los sprites actuales 1024×559 probablemente son tiras de una sola dirección; si no cubren 8 direcciones, presupuestar set nuevo. Decisión al inicio del sprint.

---

### SPRINT 4 — Poblado del mundo y atmósfera
**Duración:** 2 semanas · **Capacidad:** 24 pts · **Responsables:** P1 + P3

**Objetivo:** que el mundo se sienta habitado y con vida propia.

| ID | Historia | Pts | Criterio de aceptación |
|---|---|---|---|
| US-4.1 | **POIs y asentamientos.** Edificios, murallas, puertas y estandartes deterministas | 5 | 3 POIs visibles y coherentes con el bioma |
| US-4.2 | **Interacción completa con POIs.** Proximidad, llegada, pausa y modal React (el emisor mínimo ya existe desde S0.5) | 3 | Abrir/cerrar pausa sin romper el juego |
| US-4.3 | **Ciclo día/noche y viñeta.** Tinte ambiental, luces en ventanas y viñeta en capa propia | 3 | Transición fluida; viñeta no tapa minimapa |
| US-4.4 | **Partículas ambientales.** Hojas, luciérnagas, polvo, nieve y lluvia | 3 | ≥4 sistemas activos sin bajar de 60 FPS |
| US-4.5 | **Fauna visual.** Sprites de bestias, idle/walk y chapoteo acuático | 5 | Bestias legibles y con animación |
| US-4.6 | **Minimapa profesional.** Marco, niebla, iconos y zoom usando **solo Canvas 2D**; prohibidas las máscaras Phaser | 2 | Sin solapes; rendimiento estable; sin regresión WebGL |

**Entregables:** VG4 y un mundo que invita a explorar.  
**Archivos clave:** `src/game/entities/BeastEntity.ts`, `src/game/systems/SettlementRenderer.ts` (nuevo), `src/game/systems/LightingSystem.ts` (nuevo), `src/game/systems/ParticleSystem.ts` (nuevo), `src/game/systems/MinimapSystem.ts`.  
**Riesgos:** profundidad (y-sort) mal resuelta; mitigar con pruebas de solapamiento en POIs y árboles.

---

### SPRINT 5 — UI/HUD Manhwa
**Duración:** 2 semanas · **Capacidad:** 22 pts · **Responsables:** P3 lidera; P1 integra eventos

**Objetivo:** que la interfaz esté a la altura del mundo y del GDD.

| ID | Historia | Pts | Criterio de aceptación |
|---|---|---|---|
| US-5.1 | **Biblioteca de componentes.** Button, Card, Modal, Tabs, Tooltip, Toast | 5 | Componentes usados en todas las pantallas |
| US-5.2 | **HUD de juego.** Barras animadas de HP/Qi/CB, insignia de reino y buffs | 3 | Actualización sin layout shift |
| US-5.3 | **Pantallas de cultivo, atributos e inventario.** Rediseño con tokens | 5 | Consistencia visual y responsive |
| US-5.4 | **Transiciones y microinteracciones.** CSS/Tailwind, sin dependencias pesadas | 3 | 60 FPS; respeta `prefers-reduced-motion` |
| US-5.5 | **Accesibilidad.** Contraste, foco, teclado, escalado de fuente | 3 | WCAG AA en pantallas principales |
| US-5.6 | **Responsive.** Desktop, tablet y móvil | 3 | Sin scroll horizontal; HUD usable |

**Entregables:** VG5 y UI kit reutilizable.  
**Archivos clave:** `src/ui/components/ui/`, `src/ui/screens/`, `src/index.css`.  
**Riesgos:** sobrecargar la UI de efectos; mitigar con presupuesto de animación y revisión de legibilidad.

---

### SPRINT 6 — Combate PvE y feedback
**Duración:** 2 semanas · **Capacidad:** 21 pts · **Responsables:** P1 + P2 + P3

**Objetivo:** primer combate divertido, legible y coherente con las fórmulas del GDD.

| ID | Historia | Pts | Criterio de aceptación |
|---|---|---|---|
| US-6.1 | **Combate autoritativo.** Fórmulas de daño y advertencia de poder en servidor | 5 | El cliente no puede inflar daño |
| US-6.2 | **IA de bestia y telegraphs.** Patrulla, aggro, windup y ataque | 5 | Ataques anticipables; sin golpes invisibles |
| US-6.3 | **VFX/SFX de combate.** Tajos, impacto, números de daño, shake y hitstop | 5 | Feedback claro; 60 FPS |
| US-6.4 | **UI de combate.** Marco de objetivo, habilidades y aviso previo | 3 | Legible en 1080p |
| US-6.5 | **Muerte, respawn y loot.** Pantalla de muerte, drop y reaparición | 3 | Sin pérdida de progreso por bug |

**Entregables:** **M4 — gameplay slice** con una bestia completa.  
**Archivos clave:** `server/simulation/formulas.ts`, `src/game/systems/CombatSystem.ts` (nuevo), `src/game/systems/BeastAI.ts` (nuevo), `src/ui/components/CombatHud.tsx` (nuevo).  
**Riesgos:** desincronización cliente/servidor; mitigar con servidor autoritativo y pruebas de latencia simulada.

---

### SPRINT 7 — Persistencia y progresión autoritativa
**Duración:** 2 semanas · **Capacidad:** 20 pts · **Responsables:** P2 lidera; P1 integra

**Objetivo:** que el progreso sea confiable, persistente y no manipulable.

| ID | Historia | Pts | Criterio de aceptación |
|---|---|---|---|
| US-7.1 | **Estado autoritativo.** Validación de todas las mutaciones en servidor | 5 | Cliente no puede alterar HP/Qi/CB |
| US-7.2 | **Guardado y carga.** Autosave, indicador y resolución de conflictos | 3 | Recargar restaura el estado exacto |
| US-7.3 | **Meditación y ruptura.** Topes de 6 etapas, escalas de Dantian, pureza y karma | 5 | Sin ascensos infinitos; fórmulas del GDD |
| US-7.4 | **Inventario y mercado.** Capacidad, transacciones y persistencia | 5 | Compra/venta sin duplicar objetos |
| US-7.5 | **Admin de jugadores.** Inspección y edición segura | 2 | Toda edición queda en `activity_log` |

**Entregables:** progreso confiable y economía base.  
**Archivos clave:** `server/index.ts`, `server/db/schema.sql`, `src/core/store/usePlayerStore.ts`, `src/core/services/playerService.ts`.  
**Riesgos:** migraciones sobre datos existentes; mitigar con backups y migraciones idempotentes.

---

### SPRINT 8 — Rendimiento, accesibilidad y QA
**Duración:** 2 semanas · **Capacidad:** 21 pts · **Responsables:** P4 lidera; todo el equipo

**Objetivo:** estabilidad medible en hardware objetivo y red de seguridad automatizada.

| ID | Historia | Pts | Criterio de aceptación |
|---|---|---|---|
| US-8.1 | **Profiling y presupuesto.** Frame time, draw calls, memoria y carga | 5 | Presupuesto de §4.1 cumplido |
| US-8.2 | **Pooling, culling y LOD.** Chunks, partículas y bestias | 5 | Sin picos >20 ms al cruzar chunks |
| US-8.3 | **Móvil y táctil.** Controles, safe area y densidad | 3 | Jugable en tablet/móvil |
| US-8.4 | **QA automatizada.** Vitest + Playwright + snapshots visuales | 5 | Smoke de login→crear→mundo→mover en CI |
| US-8.5 | **Hardening de seguridad.** Secretos por entorno, rate limit y roles | 3 | Checklist de seguridad firmada |

**Entregables:** build estable y CI con pruebas de humo y visuales.  
**Riesgos:** falta de dispositivos reales; mitigar con emulación y un portátil de referencia.

---

### SPRINT 9 — Vertical slice y beta interna
**Duración:** 2 semanas · **Capacidad:** 20 pts · **Responsables:** todo el equipo

**Objetivo:** una demo de 15 minutos que represente el juego y genere feedback real.

| ID | Historia | Pts | Criterio de aceptación |
|---|---|---|---|
| US-9.1 | **Onboarding.** Landing→registro→creación→tutorial | 3 | <5 min hasta jugar |
| US-9.2 | **Contenido vertical.** 3 POIs interactivos, 1 misión, 1 bestia, 1 mercado | 5 | Recorrido completo sin bloqueos |
| US-9.3 | **Telemetría.** Eventos de embudo, errores y rendimiento | 3 | Dashboard con datos reales |
| US-9.4 | **Playtest.** 5–10 usuarios y triaje de bugs | 3 | Informe con top 10 hallazgos |
| US-9.5 | **Release candidate.** Build, staging y documentación | 3 | Demo reproducible por terceros |

**Entregables:** **M5 — beta interna** con informe de playtest y backlog priorizado para la Fase 2.  
**Riesgos:** llegar con bugs visuales; mitigar con la puerta VG6 y un bug bash previo.

---

## 7. MATRIZ RACI (RESUMEN)

| Entregable | P1 Gameplay | P2 Backend | P3 Arte/UI | P4 QA/DevOps |
|---|---|---|---|---|
| Coordenadas y movimiento | **R/A** | C | I | C |
| Mundo, agua y biomas | **R** | I | **A** | C |
| Personaje y animación | **R** | I | **A** | C |
| POIs, atmósfera y partículas | **R** | C | **A** | C |
| UI/HUD | C | I | **R/A** | C |
| Combate | **R/A** | **R** | C | C |
| Persistencia y progresión | C | **R/A** | I | C |
| Rendimiento y QA | C | C | I | **R/A** |
| Release y beta | C | C | C | **R/A** |

`R` = responsable, `A` = aprueba, `C` = consultado, `I` = informado.

---

## 8. RIESGOS TRANSVERSALES Y MITIGACIÓN

| Riesgo | Prob. | Impacto | Mitigación |
|---|---|---|---|
| Regresión WebGL por máscaras o framebuffer | Media | Crítico | Prohibidas las máscaras; soak test del minimapa; fallback a Canvas |
| Texturas faltantes en runtime | Alta | Alto | Manifiesto `ensureTexture` + test de arranque + smoke Playwright |
| Inconsistencia de arte por mezclar packs/IA | Alta | Alto | Art Bible + paleta bloqueada + revisión semanal |
| Licencias de assets dudosas | Media | Alto | Auditoría en S0; preferir CC0/compra; registrar licencia por archivo |
| Regresión de rendimiento al añadir VFX | Media | Alto | Presupuesto por sprint y profiling en cada review |
| Coordenadas/pathfinding vuelven a romperse | Media | Alto | Tests unitarios y de humo desde S0 |
| Fallback de movimiento atraviesa montañas | Media | Alto | Destino transitable + distancia máxima + log de “unstick” |
| Nado desbalancea la exploración | Media | Medio | Estamina/Qi y límite de mar profundo; ajustar con telemetría |
| Alcance creep (multiplayer, subastas, IA narrativa) | Alta | Medio | MVP matrix; todo lo demás al backlog de Fase 2 |
| Dependencia de una sola persona para arte | Media | Alto | Documentar pipeline; respaldo CC0 |
| Datos corruptos en SQLite | Media | Medio | Validación en servidor + backups + migraciones idempotentes |

---

## 9. FUERA DE ALCANCE (FASE 2+)

- Multijugador en tiempo real y WebSockets de mundo.
- Subastas, gremios, PvP y política de facciones jugable.
- IA narrativa en vivo (el GDD la pospone a post-lanzamiento).
- Mundo completo 1000×1000 recorrible; la Fase 1 valida un vertical slice.
- Voz, cinemáticas y música adaptativa.

---

## 10. PRIMER PASO CONCRETO

1. **Cerrar el Sprint 0:** `IsoMath` con `worldOrigin`, fallback acotado, `git rm -r --cached` de artefactos y texturas completas.
2. **Ejecutar el Sprint 0.5 antes de Aseprite:** soak test del minimapa, viñeta en capa propia, emisor mínimo de POIs y nado MVP.
3. **No abrir el Sprint 1 de arte hasta que VG0 y VG0.5 estén aprobadas.** El arte sobre un runtime inestable es decorar una casa en llamas.
4. **Decidir en la primera semana:** ¿los sprites 1024×559 cubren 8 direcciones o se encarga un set nuevo? Esa respuesta define el presupuesto de US-3.1.
5. **Cerrar con evidencia:** captura antes/después + vídeo de 30 s + consola limpia.

> **Criterio de éxito de este plan:** al final de la semana 8 existe una captura del juego que un tercero describiría como “un juego isométrico con identidad propia”, no como “un prototipo con tiles de colores”.

---

## APÉNDICE A — COMANDOS DE VERIFICACIÓN

```bash
# 1. Artefactos fuera de Git (debe devolver 0)
git ls-files node_modules | wc -l
git ls-files dist | wc -l
git ls-files server/database.sqlite | wc -l

# 2. Tipado de cliente y servidor
npx tsc --noEmit
npx tsc -p tsconfig.server.json --noEmit

# 3. Build
npm run build

# 4. Texturas referenciadas sin crear (revisión manual/grep)
#    Debe estar vacío o justificado:
grep -rn "setTexture\|add.image" src/game | grep -v "generateTexture"
```

## APÉNDICE B — DECISIONES PENDIENTES

| Decisión | Dueño | Fecha límite |
|---|---|---|
| ¿Mar profundo nadable con estamina o bloqueado? | P1 + diseño | Sprint 2 |
| ¿POIs con emisor mínimo en S0.5 o render completo en S4? | P1 + P3 | Sprint 0.5 |
| ¿Viñeta siempre activa o solo de noche? | P3 | Sprint 0.5 |
| ¿Se reutilizan los sprites 1024×559 o se encarga un set 8-dir? | P3 | Sprint 1 |
| ¿React 19 (GDD) o React 18 (repo)? | P1 | Sprint 1 |
