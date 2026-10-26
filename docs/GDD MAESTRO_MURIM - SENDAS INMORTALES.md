📜 GDD MAESTRO DEFINITIVO: MURIM — SENDAS INMORTALES (V3)
Documento Fundacional de Desarrollo · Versión 3.0 · Fecha objetivo: 01/12/2027
"El cielo no es un techo. Es una puerta que espera ser empujada por quien ose negar su autoridad."

SECCIÓN 0 — METADATOS Y PROPÓSITO
Campo	Valor
Título	Murim: Sendas Inmortales
Género	RPG de cultivo xianxia/wuxia con gestión, mundo persistente y narrativa IA (post-lanzamiento) (Futuro MMO)
Plataformas	PC, Web (navegador), Móvil (futuro)
Rating	+18 (contenido maduro íntegro, sin censura)
Idioma	Bilingüe (Español / English)
Modelo	Free-to-Play + monetización cosmética/utilitaria
Equipo	Pequeño (2–5 personas)
Motor lógico	Motor de Simulación Wulin (Módulos 1–4) = código y reglas del juego
Motor narrativo (futuro)	IA como capa de narración (post-lanzamiento)
Propósito del documento: Este GDD sintetiza todo el material fuente (Módulos 1–4, Bibliotecas Celestial/Demoníaca, Lore Inmortal/Mortal, Recursos, Sectas, Compendio de Bestias, Complemento Espiritual, Sistema de Cultivo, GDD Maestro V2) en una visión única de desarrollo. Las contradicciones entre archivos han sido resueltas y se marcan con ⚠️ [RESUELTO]. El documento referencia los archivos fuente para el detalle granular, y sintetiza aquí la intención, las decisiones y la arquitectura.

SECCIÓN 1 — VISIÓN Y CONCEPTO
1.1 High Concept
"Un RPG de cultivo xianxia donde el Motor de Simulación Wulin es el corazón lógico del mundo: facciones autónomas, economía viva, calendario que nunca se detiene y un sistema de cultivo profundo. El jugador vive en un mundo isométrico persistente, combate en tiempo real con resolución estadística, y gestiona su ascenso desde mortal hasta la trascendencia. En el lanzamiento, todo funciona sin IA; después, la IA añade narración y diálogo vivo."
1.2 Dualidad de Experiencias
El juego alterna entre dos instancias:
Instancia	Descripción	Tecnología
Administrativa (UI)	Pantallas semi-estáticas con animaciones sutiles (cabello, rostro, ropa, aura, pequeños gestos). Gestión de cultivo, alquimia, forja, economía, relaciones, formación.	React + Tailwind (estilo manhwa/webtoon, glassmorphism, dorados)
Mundo (Gameplay)	Mundo isométrico explorable. Movimiento click-to-move, interacción con POIs, combate en tiempo real.	Phaser 3 (WebGL)
1.3 Pilares Fundamentales (orden de prioridad)
1.Cultivo, Combate y Formación (entrenamiento/aprendizaje) — El núcleo.
2.Economía, Política y Romance — La capa social.
3.Facciones, Narrativa, Alquimia, Forja, Bestias y Espíritus — La capa de mundo.
1.4 Alcance
●Visión completa: todos los reinos (Mortal → Inmortal → Absoluto), todas las provincias, todos los sistemas.
●Lanzamiento: Reino Mortal completo + sistemas núcleo + single-player + arquitectura preparada para multi.
●Futuro: multiplayer persistente, IA narrativa, PvP, Espíritus Guardianes, Bestias y Doma.

SECCIÓN 2 — EL MOTOR DE SIMULACIÓN WULIN (CORE ENGINE)
⚠️ [RESUELTO] El material fuente trataba los Módulos 1–4 como "instrucciones para una IA DJ". Aquí se reinterpretan como especificación de programación: la lógica del juego se implementa en código (Node.js/TypeScript), y la IA futura solo narrará sobre esa lógica ya calculada.
2.1 Principio Rector
El mundo existe y avanza independientemente del jugador. Las facciones tienen agendas, la economía fluctúa, el calendario corre, los NPCs envejecen y mueren. El jugador se sincroniza con ese reloj único.
2.2 Ciclo de Simulación (server-side, cada tick de mundo)
text
●PASO 1: Actualizar recursos de facciones (economía, ejército, espionaje, influencia)
●PASO 2: Procesar cola de acciones de facciones (máx. 3 nuevas por ciclo)
●PASO 3: Revisar objetivos sin completar
●PASO 4: Generar eventos autónomos (conflicto, económico, político, natural, social, sobrenatural)
●PASO 5: Actualizar relaciones entre facciones
●PASO 6: Propagar información (velocidad realista, sin omnisciencia)
PASO 7: Notificar al jugador según su ubicación, rango y estado de actividad
2.3 Estados de Actividad del Jugador (determinan recepción de eventos)
Estado	Actividades	Recepción
ALERTA	Viajar, conversar, comerciar, explorar	COMPLETA (chunk actual)
SEMIALERTA	Entrenamiento físico, estudio ligero, meditación superficial	LIMITADA (ubicación exacta)
CONCENTRADO	Entrenamiento avanzado, estudio profundo, alquimia, forja compleja	NULA (resumen al finalizar)
AISLADO	Reclusión, ruptura de nivel, sanación grave	NULA ABSOLUTA (resumen global al finalizar)
2.4 Leyes de Validación (checksum obligatorio antes de cada turno)
●Conservación: Valor_Final = Valor_Inicial + Modificador_Declarado
●Unicidad: IDs de hitos/recompensas/eventos únicos; duplicados rechazados.
●Techo Lógico: ninguna variable excede los límites del esquema.
●Sincronía Temporal: timestamp del turno > último registro.
●Precedencia Técnica: primero se valida, luego se narra.
2.5 Velocidad de Propagación de Información
Medio	Velocidad	Distorsión
Testigo directo	Instantáneo (local)	0%
Rumor	10–30 km/día	30–50%
Mensajero a caballo	30–50 km/día	5%
Paloma mensajera	100–200 km/día	0% (si hay red)
Formación de comunicación	500 km/día	0% (solo nivel estelar+)
Tiempos: misma aldea (minutos-horas) → aldea vecina (1-3 días) → provincia (5-15 días) → imperio (30-60 días).
2.6 Protocolo de Proactividad (obligatorio cada 3 turnos)
El motor DEBE activar al menos uno de estos:
1.Complicación inmediata (fallo técnico, factor externo, traición).
2.Agenda activa de NPC (aliados >50 o enemigos <-30 actúan sin ser consultados).
3.Dilema de recursos (dos frentes simultáneos).
4.Reloj de arena (misión con plazo visible y consecuencias).
5.Contraataque del mundo (toda gran victoria crea un punto débil explotado).
6.Evaluación de riesgo (capitalizar debilidades del jugador).
2.7 Referencia a Archivos Fuente
●Módulo 1 → Identidad operativa, estructura de respuesta (plantilla), calendario, estados de actividad, protocolo de limpieza (arco de 20 turnos).
●Módulo 2 → Fórmulas de poder, combate, economía, propagación, social, karmico, tablas de reino/EXP, corrección de errores.
●Módulo 3 → Ciclo de simulación, generación de eventos, sistema de encargos marciales (懸賞閣), 10 Reglas del Motor de Realidad.
●Módulo 4 → Proactividad, agenda NPC, dilema de recursos, reloj de arena, contraataque, memoria afectiva.

SECCIÓN 3 — CREACIÓN DE PERSONAJE
⚠️ [RESUELTO] El Módulo 1 original hacía todo aleatorio. Aquí, el jugador elige lo fundamental y lo demás es aleatorio (coherente con tu respuesta: "es mucho más de lo que tenemos al nacer").
3.1 Flujo de Creación (4 pasos)
PASO 1 — Identidad (elección del jugador):
●Nombre
●Género
●Fecha de nacimiento (Año 年柱 – Mes 月柱 – Día 日柱 – Hora 时柱; ejemplo: 3174丙辰年 – 5日-2月-4:50am)
●Linaje: Noble / Plebeyo / Secta / Desconocido / Culto
●Afinidad: Ortodoxo / Heterodoxo / Demoníaco
●Facción inicial: Secta / Clan / Culto / Gremio / Errante sin facción
PASO 2 — Lo Innato (aleatorio, generado por el motor):
●3 Físicos Únicos (de la tabla de 100 Físicos; rareza según tirada 3d100: 01-40 Básico E, 41-70 Común D, 71-90 Raro C, 91-97 Noble B, 98-99 Divino A, 100 Legendario S)
●3 Providencias Innatas (de la tabla de 100 Providencias; misma distribución de rareza)
●Cicatriz (combina 3 traumas aleatorios: abandono, duelo, traición, fracaso, abuso, negligencia, rechazo, herencia, fragmentación, asfixia, secreto)
●Juramento (combina 3 promesas: venganza, búsqueda, protección, redención, verdad, lealtad, legado, expiación, justicia, silencio)
●Arquetipo Narrativo (derivado de Cicatriz + Juramento: Vengador, Buscador, Restaurador, Protector, Redentor)
PASO 3 — Historia Pre-Juego (narrada al jugador):
●El motor genera una historia única desde el nacimiento (0 años) hasta la edad actual (+16) basada en: linaje, afinidad, facción, cicatriz, juramento, físicos y providencias.
●Esta historia incluye: origen familiar, eventos formativos, primer contacto con el Qi, razón para iniciar el camino del cultivo, y una Trama Principal inicial (el "tronco" del árbol narrativo).
●Se narra con la plantilla del Módulo 1 (formato de respuesta del DJ).
PASO 4 — Confirmación y Entrada al Mundo:
●El jugador recibe su ficha completa (atributos, recursos iniciales, equipo básico, ubicación inicial en su facción).
●Se le presenta la situación inicial y se espera su primer comando/acción.
3.2 Arquetipos Narrativos (guían la generación de tramas)
Arquetipo	Condición	Dirección natural	Pregunta temática
Vengador	Pérdida/Traición + Venganza	Identificar enemigos → Acumular poder → Enfrentar → Vacío → Nuevo propósito	¿La venganza traerá paz o solo más violencia?
Buscador	Abandono + Búsqueda/Verdad	Búsqueda → Pistas → Encuentro → Verdad → Aceptación/Rechazo	¿Y si la verdad destruye lo que eres?
Restaurador	Fracaso/Pérdida de estatus + Redención/Verdad	Recuperar → Consolidar → Definir legado	¿Se puede restaurar el pasado o solo construir algo nuevo?
Protector	Fracaso (no proteger) + Protección	Identificar amenaza → Proteger → Sacrificio	¿A quién proteges cuando no puedes proteger a todos?
Redentor	Fracaso (culpa) + Redención	Buscar redención → Enfrentar pasado → Perdonarse o no	¿Mereces ser perdonado?
3.3 Árbol Narrativo (estructura de tramas)
●Raíz: Cicatriz + Juramento + Linaje (nunca cambia; identidad profunda).
●Tronco: Trama Principal (conflicto central; puede cerrarse y generar nueva trama principal).
●Ramas: 3–5 subtramas simultáneas (duración variable).
●Hojas: Eventos cotidianos (atmósfera).
●Frutos: Resoluciones de tramas.
●Semillas: Nuevas tramas potenciales (brotando → activas → resueltas → nuevas semillas).
Generación de subtramas (cada 5 turnos o al cerrar trama): 30% de trama principal, 25% de cicatriz/juramento, 20% del mundo, 15% de relaciones, 10% de consecuencias.

SECCIÓN 4 — SISTEMA DE CULTIVO
Referencia detallada: Sistema de Cultivo.MD (tablas completas de reinos, dantian, núcleo, alma, providencias, físicos). Aquí se sintetiza la intención.
4.1 Principio Fundamental
"Tener capacidad de Dantian NO significa tener Qi almacenado. El cultivo LLENA la capacidad."
El cultivo es la calidad y capacidad del Dantian, el Núcleo y el Alma. Al subir de nivel: +5 puntos de atributos libres + 3 puntos de habilidad.
4.2 Atributos (12)
Físicos: Fuerza, Destreza, Constitución.
Mentales: Inteligencia, Percepción, Astucia.
Espirituales: Karma, Voluntad, Suerte.
Trascendentes: Carisma, Sabiduría, Fama.
4.3 Karma y Naturaleza del Qi
Rango de Karma	Tipo de Qi	Afinidad
+501 a +1000	Qi Blanco	Creación, Protección, Sanación masiva
+101 a +500	Qi Blanco	Apoyo, Formaciones, Cultivo grupal
-100 a +100	Qi Neutro	Todas las técnicas básicas
-101 a -500	Qi Oscuro	Ataque, Sigilo, Entropía
-501 a -1000	Qi Oscuro Primigenio	Aniquilación, No-Muerte, Distorsión Espacial
El Dao es neutral. El Karma mide el eco de las acciones, no la moralidad. Un cultivador de Qi Oscuro puede salvar un pueblo; uno de Qi Blanco puede oprimir un reino.
4.4 Reinos de Cultivo (Reino Mortal, 6 subniveles cada uno)
Reino	Pasos	Capacidad Qi	Meridianos objetivo	Cuello de botella
1. Refinamiento de Qi	1–6	10–100	Pulmón, Intestino Grueso, Estómago	Percepción > 15
2. Establecimiento de Fundación	1–6	100–500	Bazo-Páncreas, Corazón, Intestino Delgado	Voluntad > 8 + Píldora de Limpieza de Médula
3. Núcleo Dorado	1–6	500–2,000	Vejiga, Riñón, Pericardio	Resistencia > 12 + Técnica Grado Tierra
4. Alma Naciente	1–6	2,000–10,000	Triple Calentador, Vesícula Biliar, Hígado	12 meridianos + Inteligencia > 10
5. Formación del Espíritu	1–6	10,000–50,000	Ren Mai, Du Mai	Energía > 50 + Romper Barrera de la Espalda
6. Vacío de Fusión Corporal	1–6	50,000–200,000	Chong Mai, Dai Mai, Yin/Yang Qiao	Alma > 15 + Intención de Arma/Elemental
7. Tribulación de Trascendencia	1–6	200,000–1M	Yin Wei, Yang Wei	Resistencia > 40 + Sobrevivir 3 descargas
8. Iluminación	1–6	1M–5M	Todos	Alma > 60 + Voluntad > 50 + Tribulación de los 7 Demonios Internos
(Reinos Inmortal y Absoluto: ver Sistema de Cultivo.MD y Lore Inmortal.md.)
4.5 Escala Suprema de Almacenamiento del Dantian (9 niveles)
Gota → Cáliz/Copa → Estanque → Lago → Mar → Océano → Firmamento/Cielo → Cosmos/Universo → Primordial/Divino. Cada nivel multiplica la capacidad (x2 a x256). Ver Lore Mortal.md y Sistema de Cultivo.MD.
4.6 Clasificación del Núcleo Dorado (8 rangos)
Plomo (Defectuoso) → Bronce (Común) → Plata (Élite) → Dorado Estándar (Genio) → Flamígero/Púrpura (Supremo) → Nueve Marcas (Monárquico) → Celestial/Inmortal (Divino) → Caótico/Del Vacío (Ancestral).
4.7 Clasificación del Alma Naciente (8 rangos)
Gris (Defectuosa) → Carne (Mortal) → Jade (Pura) → Fuego/Elemental (Especializada) → Dorada (Eternidad) → Gigante/Titánica (Tiránica) → Siete Luces/Arcoíris (Sagrada) → Del Dao/Cósmica (Suprema).
4.8 Progreso de Qi por Actividad
Actividad	Qi/día	Requisito
Meditación normal	10–50	Técnica básica
Meditación con Piedras Espíritu	20–100	Piedras de calidad
Reclusión (máximo esfuerzo)	30–150	Lugar sagrado
Cultivo con píldoras	50–500	Píldoras de cultivo
Dantian devorador	100–1000	Riesgo de corrupción
4.9 Niveles Absolutos y EXP
Tabla completa de 48 niveles (Refinamiento de Qi Paso 1 → Iluminación Paso 6) en Módulo 2. Cada nivel tiene EXP inicial y EXP necesaria. Los reinos superiores escalan exponencialmente.
4.10 Estados Especiales del Dantian
Dantian Quebrado (capacidad 1%, fugas), de Hierro Forjado (capacidad -30%, densidad x2), de Siete Colores (3+ elementos), Yin-Yang (autorregeneración), Devorador (absorbe todo, riesgo corrupción), del Caos (aprende cualquier ley, inestable).

SECCIÓN 5 — SISTEMA DE COMBATE
⚠️ [RESUELTO] Contradicción entre Módulo 2 (combate comparativo por "Poder Efectivo" + tabla de resultados) y GDD V2 (combate por turnos con fórmulas de daño). Solución: combate en tiempo real con control de bloqueo/ataque, donde las estadísticas definen el rango de resultados posibles y la habilidad del jugador modula dentro de ese rango. El sistema avisa antes del combate si es imposible ganar.
5.1 Cálculo de Poder Efectivo (determina el rango de resultados)
text
Poder_Efectivo = (capacidad_qi / 1000) × mult_dantian × mult_pureza × (1 + (FIS+AGI+INT)/300)
Multiplicadores de Dantian: vapor 0.5, rocío 1, arroyo 2, río 4, lago 8, mar_interior 16, océano 32, estelar 64, cósmico 128, primordial 256.
Modificadores situacionales: estrategia superior +5–15%, conocer debilidad +10–25%, terreno favorable +5–15%, emboscada +15–30%, veneno maestro +10–30%, ayuda externa +5–25%, reliquia divina +20–50%, integridad del alma baja -10–50%, técnica elemental opuesta +20%.
5.2 Advertencia Pre-Combate (obligatoria)
Al iniciar combate, el sistema calcula y muestra:
"Tu Poder Efectivo: 1,250 · Poder Enemigo: 3,400 · Diferencia: 172% (Masacre). Probabilidad de victoria: 1%. Se recomienda huir."
●Si la diferencia es >2 reinos completos, el sistema bloquea el combate (o permite solo huida): "No puedes atacar a ese objetivo: la diferencia de reino es insalvable."
●Si el jugador insiste, sufre penalización narrativa y de Karma (arrogancia).
5.3 Tabla de Resultados (define el "techo" del combate)
Diferencia de Poder	Resultado	Efecto en combate real
<10%	Equilibrado	50/50; la habilidad del jugador decide
10–30%	Ventaja clara	70/30 para el superior; el inferior necesita estrategia brillante
30–50%	Dominio	85/15; el inferior necesita golpe de suerte
50–100%	Paliza	95/5; el inferior solo sobrevive huyendo
100–200%	Masacre	99/1; el inferior no debería haber peleado
>200%	Aniquilación	El inferior muere o huye inmediatamente
5.4 Combate en Tiempo Real (Gameplay)
●El jugador controla ataque, bloqueo, esquiva, técnicas en tiempo real.
●Las estadísticas determinan: daño por golpe, velocidad de ataque, HP, Qi, probabilidad de crítico (5% + Suerte×0.1 + Destreza×0.05), probabilidad de esquiva (5% + Destreza×0.1 - Percepción_enemiga×0.05).
●La habilidad del jugador (timing de bloqueo, posicionamiento, selección de técnicas) modula el resultado dentro del rango que dictan las estadísticas.
●Regla de Oro: La diferencia de Reino es una barrera absoluta. Un Refinamiento de Qi no puede matar a un Alma Naciente sin circunstancias extremas y probabilidades ínfimas.
5.5 Fórmulas de Daño (gameplay)
text
●Daño_Físico = (Ataque_Base + Arma) × (1 - Defensa_Enemiga / (Defensa_Enemiga + 100))
●Daño_Qi     = (Poder_Espiritual × Mult_Habilidad) × (1 + Bono_Afinidad_Elemental)
●Crítico     = 5% + (Suerte × 0.1) + (Destreza × 0.05)
Esquiva     = 5% + (Destreza × 0.1) - (Percepción_Enemiga × 0.05)
5.6 Límites Absolutos del Combate
1.Diferencia de Dantian completa (ej: río vs lago) = no hay pelea.
2.Diferencia de 2 Reinos completos = huir es la única opción.
3.Diferencia de 3 Reinos = ni siquiera te detectan como amenaza.
5.7 Habilidades y Técnicas (Bundle Theory)
Cada técnica se registra con: id, nombre, tipo, grado (Mortal → Tierra → Alma → Celestial → Primordial), descripción, origen, elemento, efecto (daño, penetración, debuff), requisitos, coste_qi, tiempo_carga, debilidades, componentes.
Maestría: cada 100 puntos sube nivel de maestría (Estudiando → En progreso → Consolidado → Maestro).
Comando DESMONTA: revela 1–3 debilidades de una técnica enemiga (requiere INT ≥ 18 o SAB ≥ 20; coste 100 Qi + 1 hora).

SECCIÓN 6 — SISTEMA DE FORMACIÓN, APRENDIZAJE Y ENTRENAMIENTO (PILAR)
Este es el Pilar 1. Define cómo el jugador mejora. Referencia: Biblioteca Celestial.md, Biblioteca Celestial Demoníaca.md, Módulo 2 (tabla de duraciones).
6.1 Tres Vías de Progreso
Vía	Descripción	Estado típico	Duración base
Cultivo	Meditación, absorción de Qi, ruptura de niveles	CONCENTRADO / AISLADO	3–100 días según actividad
Entrenamiento marcial	Práctica física, pulido de técnicas	SEMIALERTA / CONCENTRADO	7–90 días
Estudio	Lectura de manuales, comprensión de técnicas, alquimia, forja	SEMIALERTA / CONCENTRADO	7–30 días
6.2 Estados de Actividad y Duraciones
Actividad	Duración base	Estado
Viaje local (mismo chunk)	1–3 días	ALERTA
Viaje regional	3–10 días	ALERTA
Viaje provincial	10–20 días	ALERTA
Entrenamiento físico normal	7 días	SEMIALERTA
Entrenamiento técnico básico	7–30 días	CONCENTRADO
Entrenamiento técnico avanzado	30–90 días	CONCENTRADO
Estudio ligero	7 días	SEMIALERTA
Estudio profundo	7–30 días	CONCENTRADO
Forja simple	3–10 días	SEMIALERTA
Forja compleja (Cielo+)	15–45 días	CONCENTRADO
Alquimia básica	1–5 días	SEMIALERTA
Alquimia avanzada	5–20 días	CONCENTRADO
Meditación superficial	1–3 días	SEMIALERTA
Meditación media (absorción Qi)	3–10 días	CONCENTRADO
Meditación profunda (ruptura)	10–30 días	AISLADO
Reclusión para cuello de botella	30–100 días	AISLADO
Sanación de heridas leves	1–3 días	SEMIALERTA
Sanación de heridas graves	5–20 días	AISLADO
Ceremonia / Dual Cultivo	1–3 noches	CONCENTRADO
6.3 Ganancia Mínima de EXP por Actividad (obligatoria)
Actividad	EXP/hora	EXP/día
Meditación básica	5	40
Entrenamiento físico	10	80
Estudio de manual	15	120 (agotador)
Gestión diplomática	8	64
Viaje normal	2	16
Viaje con entrenamiento	5	40
Simulación período largo	—	50 BASE + eventos
Construcción/expansión	—	100/semana + bonos
Reclutamiento/entrenamiento ejército	—	150/semana
Regla: cuando se simulan períodos >10 días, el motor DEBE calcular EXP = (días × tasa_base) + (eventos_especiales × bono). No se omite.
6.4 Aprendizaje de Técnicas
●Requisito: manual/pergamino + atributos mínimos + tiempo de estudio (según grado de la técnica).
●Bonificadores: Inteligencia alta (+velocidad), Sabiduría alta (+comprensión), afinidad elemental, maestro que enseñe (+50% velocidad).
●Copiar observando: requiere SAB ≥ 20; solo técnicas de grado ≤ Alma; precisión 50%.
●Técnicas de 3 Reinos arriba: no se pueden aprender sin maestro.
6.5 Biblioteca de Técnicas (fuente)
El catálogo completo está en Biblioteca Celestial.md (TM001–TM276+, C001–C120, A001–A052, F001–F215, FOR001–FOR120, M001–M020, HL/PD/FD/MAP/CG) y Biblioteca Celestial Demoníaca.md (DTM, DTS, DTV, DTP, DTC, DTX, CDD, CDS, CDV, CDP, CDC, ADA, ADS, ADV, ADP, ADC, FDD, FDS, FDV, FDP, FDC, FOD, FOS, FOV, FOP, FOC, CDD101–105, PDD, CPD, MDTM, DCS, DAL, DFO, DTM100–112, DCS011–033, etc.).
El GDD no reproduce el catálogo completo (sería inviable); lo referencia como fuente de contenido. El equipo de contenido lo importará a la base de datos del juego.
6.6 Formaciones de Energía (subsistema)
Las formaciones (阵) son un subsistema de combate/cultivo, no el "Pilar 1". Se implementan como habilidades especiales que requieren: conocimiento de matrices, componentes (banderas, estacas, jade), y Qi. Catálogo en Biblioteca Celestial.md (FOR001–FOR120) y Biblioteca Celestial Demoníaca.md (FOD, FOS, FOV, FOP, FOC, DFO009–022, FM001–FM065).
Formaciones jugables destacadas: Formación de los 12 Puentes del Cielo (teletransporte local), Matriz del Viento de Absorción de Qi (cultivo acelerado), Formación del Vórtice de Almacenamiento de Qi, Matriz de los Ocho Diagramas del Destino (Clan Zhuge), Gran Matriz de la Computación Divina.

SECCIÓN 7 — SISTEMA DE ECONOMÍA
Referencia detallada: Módulo 2 (tablas de ingresos, costos, mercado dinámico, impuestos) y Recursos.md (minerales, plantas, piedras, venenos, bestias, artefactos).
7.1 Moneda y Conversión
text
●1 oro = 100 plata = 10,000 cobre
●1 piedra espíritu baja = 10 oro
●1 piedra espíritu media = 50 oro
●1 piedra espíritu alta = 500 oro
1 piedra espíritu suprema (cristal estelar) = 5,000 oro
7.2 Ingresos por Nivel Social (referencia anual)
Nivel	Ingreso anual (oro)
Mendigo	0–50
Campesino	100–400
Sirviente	300–800
Artesano	400–1,000
Forjador	800–1,300
Comerciante	1,000–3,000
Noble bajo	3,000–6,000
Alquimista	3,500–5,000
Noble alto	6,000–12,000
Magnate	12,000–25,000
Poder regional	25,000–50,000
Cultivadores (piedras espíritu/año): errante 10–50 baja; discípulo externo 50–80 baja; interno 10–30 media; principal 30–80 media; maestro 10–50 alta; patriarca 50–80 alta.
7.3 Costos de Vida (mensual)
●Mortal: supervivencia 0.5–5 oro; modesta 3–8; acomodada 10–15; lujosa 12–20; noble 25–50.
●Cultivador: errante 1–5 baja; discípulo externo 5–8 baja; interno 1–3 media; principal 3–8 media; maestro 1–5 alta; patriarca 5–8 alta.
7.4 Mercado Dinámico
text
precio_actual = precio_base × (1 + demanda/100) × (1 + (100 - disponibilidad)/100)
Acciones: comprar grande (disponibilidad -5, demanda +2), vender grande (+5/-2), acaparar (>20% disponible → precio +30% temporal), inundar (>20% vendido → precio -30% temporal), monopolio (>70% control → fija precio ±50%).
7.5 Impuestos
Anuales por persona: campesino 0.5–1 oro; artesano 2–5; comerciante 5–20; noble 50–200 (por tierras). Se cobran en cosecha; el cálculo mensual divide entre 12.
7.6 Recursos Estratégicos (fuente: Recursos.md)
Minerales: Hierro Negro, Hierro de Montaña, Hierro Frío, Hierro Celestial, Hierro de Meteorito, Acero Diamante, Acero Lunar, Acero Espiritual, Acero Frío del Norte, Oro Divino, Plata Lunar, Cobre de Flama, Beta de Jade Celestial, Jade del Caos, Jade de Khotan, Cinabrio Puro, Cristal de Aire Comprimido, Piedra del Alba del Vacío, Arena de Plata, Arena Estelar de Siete Colores, Corazón del Trueno, Hielo Místico de los Diez Mil Años, Perlas de Luz Nocturna, Plata del Alba.
Plantas: Ginseng Emperador, Loto de Jade, Loto de Hielo de Nueve Capas, Loto Carmesí, Hongos de Sangre de Dragón, Orquídea de Jade, Hierba del Viento, Hierba del Despertar del Alma, Raíz de Mandrágora de Mil Años, Ginseng de 1000 años, Loto de Nieve de Siete Colores, Fruto del Árbol de la Vida, Flor de Ciruelo Inmortal, Raíces de Piedra, Lágrimas de la Doncella de Nieve, Polvo de Hueso de Bestia, Fluido de Savia de Bambú Celestial, Esencia de Hierba de Rocío Espiritual.
Venenos/Antídotos: Veneno de Basilisco, Veneno de Serpiente, Veneno de Sombra, Lágrimas de la Medusa, Lágrimas de Banshee, Toxina de la Serpiente de los Siete Venenos, Antídoto Universal, Antídoto Avanzado, Elixir de Qi, Gota del Manantial del Tiempo.
Bestias/Partes: Colmillo/Piel de Lobo de las Sombras, Pluma de Arpía, Pluma de Ave del Trueno, Escama de Dragón/Abisal, Colmillo de Zorro del Eco, Corazón de Basilisco, Núcleo de Monstruo, Seda de Araña Espiritual/del Vacío, Hilo de Araña Estelar, Hueso de Bestia, Piel de Jabalí de Hierro, Ojo de Tigre Siberiano, Pluma de Fénix, Cuerno de Qilin, Sangre de Fénix.
Acuáticos: Perla/Escama de Dragón de Agua, Alga Espiritual, Coral de Jade, Caracol de la Luna.
7.7 Comercio entre Jugadores (futuro multiplayer)
●Mercado regional compartido (precios dinámicos según oferta/demanda de todos los jugadores de la región).
●Subastas para artefactos raros.
●Trueque directo.
●Regla de escasez: un recurso único (ej: Ginseng Emperador) existe una sola vez en el mundo; si un jugador lo cosecha, nadie más lo tiene salvo que lo robe o lo compre.

SECCIÓN 8 — SISTEMA DE FACCIONES Y POLÍTICA
Referencia detallada: Sectas.md (rangos de secta, listado de sectas pequeñas/medianas, técnicas inmortales), Lore Mortal.md (Trinidad Suprema, Seis Pilares, 5 Clanes Nobles, 5 Cultos Divinos, 5 Fortalezas, Instituciones Neutrales, Corte Imperial, Alianzas).
8.1 Tipos de Facción
Tipo	Ejemplos	Filosofía
Sectas Ortodoxas	Shaolin, Wudang, Monte Hua, Emei, Qingcheng, Diancang, Kongtong, Zhongnan, Mendigos	Virtud, mérito, servicio al Dao
Clanes Nobles	Namgung, Tang, Moyong, Zhuge, Peng	Sangre, honor del linaje, economía
Cultos Divinos (Demoníacos)	Demonio Celestial, Sangre, Viento Divino, Palacio de la Sangre y los Espíritus, Cadáver Divino	Libertad absoluta, poder trascendente
Fortalezas	Hierro, Shanhaiguan, Tigre Agazapado, Puerta del Dragón, Centinela de la Noche	Nodos militares
Instituciones Neutrales	Pabellón de los Cien Oficios, Pabellón de la Sabiduría, Valle de la Alquimia y la Curación	Sirven a todos por un precio
Corte Imperial	Gobierno oficial, Guardia Imperial, Espectros Imperiales, Seis Ministerios	Dividir y conquistar el Wulin
8.2 Rangos de Facción (progresión del jugador)
Sectas/Clanes/Cultos/Gremios:
●Discípulo: Externo → Interno → Élite → Principal
●Guardia: Externo → Interno → Élite → Principal
●Maestro: Externo → de Patio → de Pico → Anciano → Líder Supremo / Líder de Clan / Líder de Culto
Gestión desbloqueada por nivel: el jugador empieza como discípulo externo y, al ascender, desbloquea la gestión de facción (reclutar, administrar territorios, economía, ejército).
8.3 Pabellón de Encargos (懸賞閣 - Xuánshǎng Gé)
Cada facción tiene su pabellón de misiones con nombres según filosofía:
●Sectas Ortodoxas: Pabellón de la Virtud y el Mérito (功德堂)
●Clanes Nobles: Cámara de Asuntos Internos (内务司)
●Cultos Demoníacos: Pabellón de la Cosecha de Sangre (血猎阁)
●Neutrales: Oficina de Encargos y Suministros (通商阁)
●Corte Imperial: Oficina de Asuntos Marciales (武备司)
Categorías de encargo: Caza de Bestias, Recolección de Ingredientes Alquímicos, Recolección de Recursos de Forja, Caza con Recompensa (bounties), Mazmorras y Exploración de Ruinas, Búsqueda de Tesoros.
Puntos de Mérito (贡献值): moneda interna no robable. Canje: 10 = Píldora Qi Básica; 50 = Píldora Restauración Grado Tierra; 100 = Arma Grado Tierra; 250 = Pergamino Técnica Grado Alma (incompleta); 500 = Artefacto Grado Alma; 1000 = Pergamino Técnica Grado Alma (completa); 2500 = Arma Grado Alma; 5000 = Acceso a mazmorra restringida; 10000+ = Favor de Anciano o Técnica Grado Celestial.
8.4 Reputación y Afinidad
●Afinidad NPC: escala -100 a +100 (-100 enemigo jurado, -70 hostil, -30 desconfiado, 0 neutral, 30 amistoso, 70 leal, 100 hermano de sangre).
●Reputación de facción: escala -100 a +100 (>50 acceso a instalaciones/descuentos; >70 favor único; >90 héroe vivo; <-50 fronteras cerradas; <-80 precio por tu cabeza; <-95 cazan a tu familia).
●Memoria generacional: lo que hiciste lo recuerdan tus nietos.
8.5 Política y Diplomacia
●Regla: toda facción actúa por PODER, RECURSOS o SUPERVIVENCIA.
●Preguntas del motor: ¿Qué gana esta facción? ¿Qué pierde si no actúa? ¿Quién es su enemigo natural? ¿Quién su aliado histórico?
●Presión jerárquica: los superiores asignan tareas con plazos concretos cada 3 turnos. Ignorar o fallar = -5 a -10 afinidad + penalización de reputación.
8.6 El Mundo Avanza (notificación al jugador)
Cada turno, el jugador recibe un breve boletín autónomo (según ubicación/rango/informantes):
●Rumores locales
●Acciones de enemigos
●Movimientos estratégicos de sectas lejanas
●Cambios en la provincia
●Consecuencias políticas de actos recientes
Modo de ejecución: el motor escoge aleatoriamente sobre qué provincia informar; nunca la misma 2 turnos seguidos; el jugador recibe la noticia vía rumores (Secta de los Mendigos o secta HAO) o por sus relaciones.

SECCIÓN 9 — SISTEMA DE MUERTE Y SUCESIÓN
⚠️ [RESUELTO] El Módulo 1 decía "muerte permanente y definitiva". El GDD V2 no mencionaba muerte. Solución: dos modos de juego.
9.1 Modos de Juego
Modo	Muerte	Público
Fácil	No definitiva. El personaje revive con penalización de tiempo real (minutos/horas).	Casual / exploración
Infierno	Definitiva si no hay vía de salvamento. Vías: heredero, esclavo, técnica espiritual, placa de alma.	Hardcore / roguelike
9.2 Vías de Salvamento (Modo Infierno)
1.Heredero — REGISTRA HEREDERO [nombre NPC]. Al morir, continúas con el heredero (nuevo personaje, mismas facciones enemigas/aliadas, deudas/promesas, parte del inventario, NO nivel de cultivo, NO cicatrices, NO relaciones íntimas).
2.Esclavo — REGISTRA ESCLAVO [nombre NPC]. Sacrificio Dao: el esclavo muere y tú revives.
3.Técnica espiritual — técnicas de resurrección (ej: Técnica de Reencarnación del Alma, Mantra del Renacimiento de la Ceniza, Sello 5 del Yeokcheon Singong: Negación de la Muerte).
4.Placa de alma en facción — si tienes placa de alma en tu secta/clan/culto, tu alma se reintegra tras 3 días de penalización mientras se reconstruye tu cuerpo.
9.3 Penalización por Muerte (siempre, incluso en Modo Fácil)
●Modo Fácil: minutos u horas de tiempo real sin poder usar el personaje (según gravedad).
●Modo Infierno (con vía de salvamento): 3 días de tiempo real de penalización + pérdida de recursos/equipo según la vía.
●Modo Infierno (sin vía): partida termina.
9.4 Herencia Narrativa (Modo Infierno)
●Se hereda: el mundo (mismo calendario, facciones, eventos), enemigos y aliados principales, deudas y promesas, parte del inventario.
●NO se hereda: nivel de cultivo (empieza bajo con ventajas), cicatrices del anterior, relaciones íntimas.
●Nueva raíz del heredero: cicatriz relacionada con la muerte del anterior (pérdida, abandono, culpa), juramento heredado o nuevo, mismo linaje con ventajas.

SECCIÓN 10 — SISTEMA DE TIEMPO Y CALENDARIO
⚠️ [RESUELTO] El Módulo 1 usaba un calendario por turnos; el GDD V2 usaba tiempo real MMO. Solución: tiempo real (el mundo avanza mientras juegas) + calendario chino oficial + time-skips para actividades largas.
10.1 Calendario Oficial
●Estructura: Lunisolar chino, inicia con el mítico Emperador Amarillo (referencia 2698 a.C.).
●Formato: Animal - Elemento - Día - Mes - Año chino (ej: Perro - Agua - 1日 - 1月 - 3180年).
●Hora china tradicional: Rata, Buey, Tigre, Conejo, Dragón, Serpiente, Caballo, Cabra, Mono, Gallo, Perro, Cerdo.
●Estaciones: Primavera, Verano, Otoño, Invierno.
●Festivales: propios del calendario (Año Nuevo Lunar, Festival del Medio Otoño, Solsticio de los Ecos, etc.).
10.2 Reglas de Oro del Tiempo
1.El calendario avanza SIEMPRE, independientemente del jugador.
2.El jugador puede estar o no sincronizado con él.
3.Entre acciones, el mundo simula.
4.Al finalizar cada acción, el jugador recibe un resumen filtrado de lo ocurrido mientras no miraba.
5.El jugador PUEDE perderse eventos (torneos, batallas, oportunidades).
6.Las facciones ACTÚAN independientemente.
7.No hay paradojas temporales.
8.Las decisiones de QUÉ hacer y CUÁNDO tienen peso real.
10.3 Estados de Actividad y Time-Skips
●ALERTA: tiempo real; el mundo avanza en tiempo real; recepción completa de eventos.
●SEMIALERTA: actividades de 7–30 días; el motor simula el período y entrega resumen limitado.
●CONCENTRADO: actividades de 7–90 días; simulación; resumen al finalizar.
●AISLADO: actividades de 30–100+ días; simulación; resumen global al finalizar.
10.4 Sincronización Mundo-Jugador
Un solo reloj. El jugador se sincroniza con él según sus actividades. Si medita 30 días, el mundo avanza 30 días y al volver recibe el resumen de lo que cambió.

SECCIÓN 11 — EL MUNDO: GEOGRAFÍA Y LORE
Referencia detallada: Lore Mortal.md (25+ provincias, Trinidad Suprema, Seis Pilares, 5 Clanes, 5 Cultos, Fortalezas, Instituciones, Corte Imperial), Lore Inmortal.md (mito fundacional, 5 niveles/dimensiones, facciones inmortales, razas, 20 Leyes Supremas del Dao), Sectas.md (listado de 100+ sectas pequeñas/medianas, técnicas inmortales), Compendio de Bestias.md (50 bestias clasificadas), Complemento.md (alma dual, fantasmas, espíritus guardianes, inframundo).
11.1 Estructura del Cosmos (5 niveles)
1.Mundos Mortales: incontables; punto de partida; techo: Iluminación.
2.Mundo Inmortal: plano colosal; Corte Celestial, razas ancestrales, Sabios.
3.Inframundo: donde las almas entran al ciclo de reencarnación.
4.Caos Primordial: espacio infinito que rodea la "burbuja" del Dao Celestial; supervivientes de los 3,000 Dioses.
5.Reino del Vacío / Mundo del Origen Supremo: más allá del Caos.
11.2 El Mito Fundacional
Antes del Dao Celestial: Caos Primordial. Nacieron 3,000 Dioses (Demonios Celestiales del Caos), cada uno con control absoluto de una Ley Mayor. El Demonio Celestial de la Fuerza dividió el Caos con su hacha, masacró a la mayoría de los 3,000, y se sacrificó para fusionar el Dao Celestial y el Mundo Inmortal. Los supervivientes huyeron al Caos exterior, odiando al Dao Celestial.
El Dao Celestial es la voluntad y conjunto de leyes que gobiernan el universo. Los seres del Caos exterior lo ven como un fruto maduro que quieren devorar.
11.3 Las 20 Leyes Supremas del Dao Celestial
1.Origen y Retorno (Ciclo Eterno)
2.Equilibrio (Yin-Yang)
3.Conservación del Dao
4.Correspondencia (Microcosmos/Macrocosmos)
5.Tiempo Lineal y Cíclico
6.Espacio y Fronteras
7.Karma y Causa-Efecto
8.Identidad (Dao del Nombre)
9.Techo y Ascensión
10.Tribulación (Castigo del Cielo)
11.Absorción y Pureza
12.Transmutación (Escala de Energía)
13.Voluntad e Intención
14.Alma y Carne
15.Jerarquía Cósmica (Orden Natural)
16.Fe y Devoción
17.Los 3,000 Grandes Dao
18.Suerte y Destino
19.Legado y Herencia
20.Libre Albedrío y Conciencia
Ley 21 (Complemento): La Ley del Alma y el Vínculo (fusiones de almas, contratos de espíritus guardianes).
11.4 El Gran Sello y la Era Actual
Hace 3,000 años, los dioses sellaron el Dao del Caos y condenaron a la humanidad a un techo eterno: el Reino Inmortal como tope máximo. Durante tres mil años, la ascensión quedó negada.
El Despertar (presente): el Sello se agrieta. La energía del Caos se cuela en forma de Ecos Primordiales (fragmentos de voluntad y energía que se incrustan en sangre, tierra sagrada, cicatrices emocionales). El Dao está sanando lentamente. Nuevos caminos de cultivo emergen.
La Era de la Sangre y el Loto (hace 487 años): el Culto del Loto Blanco declaró la guerra para romper el Sello. La Batalla del Loto Marchito duró 49 días; el Emperador cayó; el Rey de la Luz fue despedazado; los 7 Ecos se fragmentaron en miles de partículas. El Sello se agrietó más.
Ahora (año 487): el Sello está a punto de romperse. Tres focos de tensión:
1.La Fiebre del Eco — carrera por el poder primordial.
2.El Trono de Sangre y Sombra — crisis sucesoria imperial.
3.El Despertar del Norte y la Rebelión del Oeste — fronteras en llamas.
11.5 Geografía del Mundo Mortal (25+ provincias)
Región	Provincias	Rango típico	Peligros
El Corazón (Centro)	Henan, Shaanxi, Hebei, Shanxi	Refinamiento – Alma Naciente	Bandidos, bestias Tierra, disputas de sectas
La Espalda (Suroeste)	Sichuan, Yunnan, Guangxi, Guizhou	Fundación – Alma Superior	Cultos demoníacos, bestias venenosas, kársticas
El Norte Helado	Heilongjiang, Jilin, Liaoning, Mongolia Interior	Tierra Superior – Alma Superior	Bestias de hielo, tribus hostiles, permafrost
El Este Próspero	Shandong, Jiangsu, Zhejiang, Anhui, Fujian	Tierra Medio – Alma Medio	Piratas, clanes rivales, formaciones de espada
El Oeste Prohibido	Xinjiang, Xizang, Qinghai, Gansu	Alma Superior – Celestial Inferior	Cultos demoníacos, bestias ancestrales, fenómenos espaciales
Chunks de mapa (referencia): Heilongjiang A12–C14; Jilin B12–C14; Liaoning C12–C13; Beijing C11; Mongolia Interior A12–C12; Gansu C7–D9; Xinjiang B4–D5; Shandong D11–D12; Jiangsu D12–E12; Henan D10–E11; Hebei C11–D11; Shanxi C10–D10; Shaanxi D9–E10; Ningxia D9; Qinghai D6–E8; Zhejiang E9–F9; Fujian F8–F9; Anhui E11–E12; Hubei E10–E11; Jiangxi E11–F11; Hunan E10–F11; Guizhou F9; Sichuan E8–F8; Xizang D4–E7; Guangdong F10–G10; Guangxi F9–G10; Yunnan F7–G9.
11.6 Mazmorras y Calabozos Destacados (10)
Nombre	Ubicación	Rango	Jefe	Recompensas
Tumba del Rey de la Luz	Henan	Alma Medio–Superior	Eco del Loto Marchito	Técnica prohibida fragmentada, Sello del Loto
Cueva de los Diez Mil Espíritus	Hubei	Alma Superior–Celestial Inferior	Guardián de los Susurros	Manual de dominio de almas, Píldora de claridad
Palacio Sumergido del Dragón Negro	Heilongjiang	Alma Superior	Dragón de Hielo	Escama de dragón, Fruto de escarcha
Fortaleza de los Siete Demonios	Xinjiang	Celestial Inferior–Medio	El Séptimo Demonio	Sable del Viento de Arena, mapa de venas
Prisión de Hielo de Changbai	Jilin	Alma Medio–Superior	Espíritu del Tigre Siberiano	Colmillo del tigre, Gema de hielo
Cripta de los Patriarcas Olvidados	Shaanxi	Alma Superior	El Primer Patriarca	Espada del Dragón de Jade (copia), Tratado del Dragón Inmortal
Jardín de los Mil Venenos	Sichuan	Alma Medio–Superior	Guardián de la Cámara de los Venenos	Caldero de Jade, Recetario de los 3 Tesoros
Templo de la Roca Flotante	Xizang	Celestial Inferior	Monje de la Cumbre	Pergamino del Vacío, Píldora de iluminación
Nido del Fénix de las Montañas Flameantes	Xinjiang	Alma Superior–Celestial Inferior	Fénix adulto	Pluma de fénix, Huevo de fénix
Galaxia Subterránea de Kunlun	Qinghai	Celestial Medio–Superior	Eco del Caos Primordial	Fragmento de ley del Caos, Esencia de jade
11.7 Bestias Espirituales (fuente: Compendio de Bestias.md)
50 bestias clasificadas por rango: Primordiales (8+), Ancestrales (7), Desoladas (6), Mutantes/Reyes Bestia (1–5), Extrañas (conceptuales), de Forja/Cultivo. Cada una con: hábitat, Marca del Dao, material clave, habilidad innata.
Líderes Bestia notables: Dragón del Vacío Temporal (Kunlun), Fénix de Fuego Carmesí (Sichuan), Tortuga del Oráculo de Jade (Hubei), Tigre del Trueno de Jade (Anhui), Qilin del Karma de Loto (Hubei), Lobo de la Sombra de Caos (Xinjiang), Águila de Pico de Acero (Qinling), Oso del Núcleo de Tierra (Frontera del Olvido), Serpiente de los Siete Venenos (Puerta de la Serpiente).
11.8 Lugares de Poder
●Pico de Tribulación (Monte Hua): +50% éxito en tribulaciones.
●Lago Espejo Lunar (Kunlun): refleja defectos del corazón marcial.
●Volcán Dragón Durmiente (Changbai): fuego puro para forja divina.
●Cueva de los Diez Mil Espíritus (Shennongjia): los muertos hablan a los vivos.
●Bosque de Bambú Susurrante (Zhejiang): el viento revela secretos.
11.9 Recursos Estratégicos Legendarios
Hierbas: Flor Loto Milenario (Hunan), Ginseng Emperador (Changbai), Hongo Inmortal (Shennongjia), Fruto del Árbol de la Vida (Kunlun).
Minerales: Hierro Divino (Sichuan), Plata Lunar (Yunnan), Jade de Khotan (Xinjiang), Cinabrio (Guizhou).
Artefactos: Espada del Patriarca Namgung, Espejo de la Verdad (Shaolin), Caldero Alquímico Tang, Mapa de Venas del Dragón (Zhuge), Sello del Demonio (Culto Celestial).
11.10 Razas del Mundo Inmortal
Humanos, Celestiales del Dao, Demonios (Yao/Mo), Dragones, Bestias (Ave Bermellón, Cuervo Dorado, Zorros, Lobos, Qilin), Asura, Magos (reprimidos), Nether (Inframundo), Ecos de la Nada.
11.11 Facciones del Mundo Inmortal
Palacio Celestial (Emperador Celestial), Corte Celestial, Cultivadores Independientes, Reino de los Diez Mil Demonios, Secta Oculta, Zona Prohibida Oscura, Secta Celestial de Fuego Sangriento, Secta de la Oscuridad, Legión de la Constelación Caída, Palacio Divino, Secta Budista, Tribunal Demoníaco, Clan de los Tres Mil Dioses, Clan de las Deidades de los Castigos Celestiales.
Clanes: Divino del Cuervo Dorado, Divino del Ave Bermellón, Isla Inmortal del Dragón, Clan Qilin.
11.12 El Inframundo
Puente Naihe, Primavera Amarilla, Nueve Purgatorios, Isla de la Secta Oculta (antigua), Salones Yama (10 Cortes). Habitantes: Raza del Inframundo, Clan Diablo, Clan Mago.
11.13 Espíritus Guardianes y Cultivo Espiritual (futuro)
Referencia: Complemento.md. Sistema de Espíritus Guardianes (proyección del Shen), fantasmas (clasificación por rango espiritual), Gui Dao, ciclo de reencarnación, Inframundo, tribulaciones agravadas por uso de fantasmas. Se implementa post-lanzamiento (futuro).

SECCIÓN 12 — PNJs Y DIÁLOGO
12.1 Principio de "Vida Interior"
Cada NPC tiene al menos 2 capas:
1.Capa Pública: rol, actitud, tono.
2.Capa Oculta: miedos, deseos contradictorios, secretos.
3.Capa de Reacción: cómo cambia su comportamiento según las acciones del jugador (memoria emocional).
12.2 Protocolo de Diálogo Vivo
Todo diálogo significativo (>2 intercambios) DEBE incluir:
●Contexto corporal: postura, gestos, mirada, tensión.
●Sensorial: olor, sonido, temperatura.
●Emoción compleja: nunca una sola (ej: "furia contenida mezclada con fascinación").
●Pausa o silencio significativo.
●Contradicción: el NPC puede decir algo que contradiga su lenguaje corporal.
12.3 Regla de Profundidad de Diálogo
Todo diálogo de NPC contiene AL MENOS 3 de:
1.Lenguaje corporal.
2.Voz única (adjetivos: susurrante, grave, cortante, melódica).
3.Emoción subyacente (mostrar, no decir).
4.Referencia al pasado.
5.Contradicción interna.
6.Pausa significativa.
12.4 Campos de Registro de PNJ
ID · Nombre · Rol · Relación · Afinidad · Arquetipo · Tono de habla · Miedo secreto · Deseo oculto · Contradicción · Motivación (Cicatriz + Juramento) · Última interacción · Estado emocional · Planes inmediatos · Frase característica · Reacción (amenaza/halago) · Cultivo estimado · Arte marcial · Origen
12.5 Memoria Afectiva
●Recuerdo inmediato (1–3 turnos): emociones frescas.
●Recuerdo reciente (4–10 turnos): emoción enfriada, lección permanece.
●Recuerdo profundo (>10 turnos): la interacción ha moldeado la visión del NPC.
Aplicación obligatoria: al menos 1 referencia al pasado en cada diálogo con NPC recurrente.
12.6 Estados de NPC
1.Pasivo (default): rutina, diálogos funcionales.
2.Reactivo: responde a acciones del jugador con emociones visibles.
3.Proactivo: inicia acciones que afectan al jugador (mínimo 1 cada 3 turnos).
12.7 Diálogo con IA (post-lanzamiento)
En el lanzamiento, los diálogos usan respuestas pre-escritas con variaciones por afinidad/estado. La IA futura generará diálogo dinámico sobre la lógica del motor (el motor calcula estado/afinidad; la IA lo narra).
El jugador responde a los diálogos escribiendo (comando RESPUESTA [texto]). En el lanzamiento, el parser interpreta la intención (atacar, halagar, amenazar, preguntar, etc.) y el motor responde. La IA futura permitirá respuestas más libres.

SECCIÓN 13 — MULTIJUGADOR (VISIÓN FUTURA)
⚠️ [RESUELTO] El usuario no ha resuelto del todo el modelo multi, pero quiere mundo persistente compartido. Solución: lanzamiento single-player con arquitectura preparada; multi llega después.
13.1 Principios del Mundo Persistente
●Mundo único compartido: un solo mundo por servidor/región.
●Recursos finitos: un Ginseng Emperador existe una vez; si un jugador lo cosecha, nadie más lo tiene salvo que lo robe o lo venda.
●Visibilidad de acciones: si un jugador conquista una mazmorra o la está desafiando, otros jugadores en la misma zona lo ven.
●Persistencia: el mundo recuerda quién conquistó qué, quién mató a quién, qué facciones cambiaron de dueño.
13.2 Arquitectura Preparada (lanzamiento single-player)
●Estado del mundo en servidor (SQLite/PostgreSQL) con estructura lista para multi.
●IDs únicos de recursos, mazmorras, NPCs, eventos.
●Sistema de propagación ya implementado (información viaja a velocidad realista).
●Economía con mercado regional dinámico (lista para oferta/demanda multi).
●Chat ya presente (global y de facción) incluso en single-player (con NPCs simulados).
13.3 Transición a Multiplayer
1.Fase 1 (lanzamiento): single-player. El mundo es tu instancia.
2.Fase 2: mercado compartido asíncrono (compras/ventas entre jugadores, sin PvP).
3.Fase 3: mundo compartido en tiempo real (ver otros jugadores, cooperación en mazmorras).
4.Fase 4 (futuro): PvP opcional (duelos, asedios de facción).
13.4 Cooperación en Equipos
●Mazmorras grupales: hasta 5 jugadores comparten la instancia; el botín se reparte según reglas de la party.
●Facciones: jugadores de la misma facción comparten reputación, territorio, economía.
●Guerras de facción: eventos a gran escala donde facciones de jugadores se enfrentan.
13.5 PvP (futuro)
●Duelos consentidos: ambos jugadores aceptan.
●Asedios de facción: guerras declaradas entre facciones.
●Bounties: un jugador puede poner precio a otro.
●Regla de nivel: no puedes atacar a jugadores de reinos inferiores sin penalización de Karma y reputación.

SECCIÓN 14 — MONETIZACIÓN
⚠️ [RESUELTO] El usuario no ha terminado de definir la monetización, pero sabe que debe existir. Decisión: Free-to-Play con tienda de cosméticos y utilitarios; nunca Pay-to-Win directo (no se venden niveles de cultivo ni poder de combate).
14.1 Modelo
●Free-to-Play: el juego completo es accesible gratis.
●Tienda: cosméticos + utilitarios + servicios.
●Suscripción opcional: "Pase del Cultivador" (bonos de EXP, inventario extra, viaje rápido, etc.).
14.2 Qué se vende
Categoría	Ejemplos	Impacto
Cosméticos	Túnicas, peinados, auras, monturas, mascotas, animaciones de UI	Solo visual
Utilitarios	Anillos espaciales (inventario extra), piedras de teletransporte, aceleradores de viaje	Conveniencia, no poder
Píldoras especiales	Píldoras de cultivo (bonus temporal, no permanente), píldoras de claridad	Aceleración, no salto de nivel
Terreno	Propiedades, parcelas de secta/clan	Gestión, no combate
Esclavos	NPCs esclavos (con reglas éticas del mundo)	Gestión, no poder directo
Armas/Artefactos	Armas forjables (no las legendarias únicas), artefactos no forjables	Equipo, no poder absoluto
Servicios	Cambio de nombre, cambio de apariencia, reseteo de puntos	Conveniencia
14.3 Límites Éticos
●NO se vende: niveles de cultivo, reinos, poder de combate directo, ventaja en PvP, recursos únicos del mundo (el Ginseng Emperador se consigue jugando, no comprando).
●Sí se vende: tiempo (aceleradores), conveniencia (inventario, viaje), estética (cosméticos), gestión (terreno, esclavos).
14.4 Economía del Juego vs. Economía Real
●Oro/plata/cobre: moneda del juego, se gana jugando.
●Piedras espíritu: recurso del juego, se gana jugando.
●Moneda premium (futuro): "Jade Celestial" o similar, se compra con dinero real, se usa para cosméticos/utilitarios. No se puede convertir en oro del juego (evita Pay-to-Win).

SECCIÓN 15 — ESTÉTICA VISUAL Y AUDIO
15.1 Las Dos Instancias Visuales
Instancia	Estilo	Referencias
Administrativa (UI)	Manhwa/webtoon. Pantallas semi-estáticas con animaciones sutiles (cabello, rostro, ropa, aura, pequeños gestos). Glassmorphism, paleta oscura con dorados, tipografía Cinzel.	Manhwas de cultivo, novelas visuales, arte de Talismans
Mundo (Gameplay)	Isométrico clásico. Sprites 2D con perspectiva. Paleta natural (verdes, marrones). Inspiración en Age of Empires II.	AoE II, Diablo isométrico, RPGs clásicos
15.2 Personajes
●Retratos estilo novela visual en la UI administrativa (con animaciones sutiles).
●Sprites isométricos en el mundo (con animaciones de caminar, atacar, bloquear, meditar).
●Personalización: túnicas, peinados, colores, auras (desbloqueables/cosméticos).
15.3 Audio
●Música: melodías tradicionales chinas (guzheng, flauta, pipa) para el mundo; música íntima para la UI; temas épicos para combates y tribulaciones.
●Efectos: campanas (meditación), choque de espadas, explosiones elementales, clics de UI, rugidos de bestias.
●Voces: en el lanzamiento, texto + sonidos vocales genéricos (no doblaje completo). Futuro: doblaje parcial o IA de voz.
15.4 UI/UX
●HUD del mundo: barra superior (HP, Qi, nombre), minimapa, botones de acción rápida (inventario, chat, mapa).
●Modales (React): ocupan la pantalla al interactuar con POIs (vista de secta, ciudad, mazmorra, alquimia, forja, etc.).
●Transiciones: fundido entre instancias; el juego pausa el mundo al abrir un modal.

SECCIÓN 16 — ARQUITECTURA TÉCNICA
Basado en GDD Maestro V2 (Apéndices A–E) + Módulos 1–4 (reglas como código).
16.1 Stack Tecnológico
Capa	Tecnología
Frontend UI	React 19 + Vite + Tailwind CSS
Motor del Mundo	Phaser 3 (Canvas/WebGL)
Estado Global	Zustand (tiendas ligeras, evita re-renders)
Backend	Node.js + Express + SQLite (lanzamiento) / PostgreSQL (multi)
Tiempo real	WebSockets
Comunicación React ↔ Phaser	Event Bus (mitt.js)
Control de versiones	Git (v2-main y legacy)
Generación procedural	Mulberry32 (semilla determinista; prohibido Math.random() en lógica)
16.2 Arquitectura del Motor Wulin (server-side)
El Motor de Simulación Wulin se implementa como un módulo de Node.js/TypeScript que:
1.Mantiene el estado del mundo (facciones, economía, calendario, NPCs, eventos).
2.Ejecuta el ciclo de simulación cada tick (ver Sección 2.2).
3.Valida cada acción del jugador (checksums, límites, precedencia).
4.Calcula resultados (combate, cultivo, alquimia, forja, comercio).
5.Propaga información a velocidad realista.
6.Entrega al cliente el estado actualizado y los eventos relevantes.
La IA futura se conecta a este motor como capa de narración: recibe el estado calculado y genera prosa/diálogo. No modifica la lógica.
16.3 Base de Datos de Entidades
●Armas/Armaduras (rarezas): Común (gris, +5 atq), Mortal (blanco, +10), Raro (azul, +20 atq +5 vel), Tierra (verde, +35 atq +10 def), Alma (púrpura, +50 atq +15 espíritu), Celestial (naranja, +80 atq + efecto único), Primordial (rojo, +120 atq + 2 efectos).
●Fauna: Dragón del Vacío (Primordial, Nv80), Fénix Carmesí (Primordial, Nv75), Lobo de Sombra (Ancestral, Nv60), Águila de Acero (Mutante, Nv20).
●Flora/Minerales: ver Sección 7.6.
●Monstruos: Cultivadores Corruptos (humanos con Qi desviado), Espectros (débiles a luz/rayo/fuego).
16.4 Generación Procedural y Fractal
●Semilla: ID_Jugador + ID_Mazmorra + Timestamp. Garantiza que la mazmorra sea idéntica si el jugador vuelve.
●Mapa fractal: cada provincia tiene threatLevel y wealthLevel que determinan POIs.
●Mazmorras: generación por pisos; semilla por ID_Mazmorra + Piso. Enemigos y loot se generan al entrar.
●Loot: tabla ponderada (70% Común, 20% Raro, 9% Épico, 1% Legendario).
●Fauna: depende del bioma (Lobos de Sombra en Xinjiang, Ciervos Sagrados en Hubei).
16.5 Fórmulas del Juego (Apéndice A del GDD V2)
text
●QiGanado = 0.5 × (Percepción + Voluntad/2) × Mult_Dantian
●Daño_Físico = (Ataque_Base + Arma) × (1 - Def_Enemiga / (Def_Enemiga + 100))
●Daño_Elemental = (Poder_Espiritual × Mult_Habilidad) × (1 + Bono_Afinidad)
●Crítico = 5% + Suerte×0.1 + Destreza×0.05
●Esquiva = 5% + Destreza×0.1 - Percepción_Enemiga×0.05
●Éxito_Ruptura = 30% + Voluntad×0.2 + Pureza_Dantian×0.5 (+35% con Píldora de Fundación)
Éxito_Alquimia = 100% - (|Temp_Actual - Temp_Óptima| × 1.5) - (Falta_Ingredientes × 20%)
Fallo en ruptura: pierdes 50% de Qi acumulado + ganas "Karma de Tribulación" (aumenta dificultad futura).
16.6 Fórmulas Derivadas (Sistema de Cultivo)
text
●Salud_Max = 50 + (Constitución × 12) + (nivel_dantian × 20)
●Qi_Max = 100 + (Karma × 20) + (capacidad_dantian / 100)
●Regeneración_Qi = 5 + (Karma/8) + (Voluntad/10) por hora
●Capacidad_Inventario = 15 slots × nivel_cultivo
●Velocidad_Desplazamiento = 10 + (Destreza/2) km/h
●Integridad_Alma = Voluntad + Karma/2 - (cicatrices_activas × 5)
●Límite_Técnicas_Activas = 3 + (Inteligencia/5)
Suerte_Encuentros = Suerte/10 + 1 modificador × 1%/turno
16.7 Matriz de Scope (MVP)
Característica	MVP	Notas
Creación de Personaje	✅	Asistente de 4 pasos
Mapa Isométrico	✅	1 mapa 20×20 con 3 POIs
Movimiento	✅	Click-to-move con animación
Sistema de Cultivo	✅	Meditación, meridianos, dantian
Combate PvE	⚠️ Parcial	1 tipo de enemigo (bestia)
Economía	✅	Mercado básico en ciudad
Subastas	❌	Fase posterior
Chat en Tiempo Real	✅	Global y de facción
Multiplayer	❌	Fase posterior
IA Narrativa	❌	Post-lanzamiento
Espíritus Guardianes	❌	Futuro
Bestias y Doma	❌	Futuro

SECCIÓN 17 — CONTENIDO MADURO (+18)
⚠️ [RESUELTO] El usuario confirma: +18, sin excluir ningún tema.
17.1 Temas Incluidos
●Violencia gráfica: combate visceral, venenos que disuelven órganos, tortura, ejecuciones.
●Cultivo dual sexual: técnicas de cultivo en pareja (con consentimiento o forzado, según el caso), dependencia emocional, drenaje de Qi.
●Prostitución y esclavitud: presentes en el mundo (burdeles, esclavos de cultivo, sacrificios).
●Temas oscuros: traición, abuso, corrupción, locura, muerte de NPCs queridos.
●Lenguaje vulgar: tabernas, bandidos, soldados (insultos creativos, jerga callejera).
●Drogas/alquimia: píldoras adictivas, venenos, elixires.
17.2 Tratamiento
●No es gratuito: cada tema tiene peso narrativo y consecuencias.
●El jugador elige: el juego no obliga a participar en contenido explícito; hay opciones de "elipsis" (fundido a negro).
●Rating +18: el juego se marca como +18 en todas las plataformas.
17.3 Advertencia de Contenido
Al iniciar el juego, se muestra una advertencia de contenido +18 con opción de desactivar escenas explícitas (elipsis automática).

SECCIÓN 18 — ROADMAP DE DESARROLLO
Equipo pequeño (2–5 personas). Fecha objetivo: 01/12/2027. Roadmap por fases.
18.1 Fase 0: Pre-producción (Mes 0–2)
●Documento GDD V3 (este documento) — ✅
●Prototipo de UI (React + Tailwind) — pantallas de creación de personaje, ficha, cultivo.
●Prototipo de mundo (Phaser) — mapa 20×20, click-to-move, 1 POI.
●Motor Wulin core (Node.js) — ciclo de simulación básico, calendario, estados de actividad.
●Base de datos — esquema de entidades (personajes, facciones, recursos, técnicas).
18.2 Fase 1: Vertical Slice (Mes 2–6)
●Creación de personaje completa (4 pasos, historia pre-juego narrada).
●Sistema de cultivo (meditación, dantian, meridianos, subida de nivel).
●Sistema de combate (1 tipo de enemigo, acción en tiempo real con stats).
●Economía básica (mercado en ciudad, compra/venta).
●Chat (global y de facción, con NPCs simulados).
●1 mazmorra (3 pisos, jefe, loot).
●Guardado/carga (single-player).
18.3 Fase 2: Alpha (Mes 6–12)
●Reino Mortal completo (Refinamiento de Qi → Iluminación).
●Todas las provincias (25+ chunks, POIs, mazmorras).
●Todas las facciones (sectas, clanes, cultos, fortalezas, instituciones).
●Sistema de formación/aprendizaje completo (bibliotecas, manuales, entrenamiento).
●Alquimia y forja (calderos, recetas, forja de armas/armaduras).
●Sistema de facciones y política (reputación, encargos, gestión).
●Muerte y sucesión (modos Fácil/Infierno, heredero, esclavo, placa de alma).
●Eventos autónomos (facciones, economía, clima, política).
18.4 Fase 3: Beta (Mes 12–18)
●Pulido de UI/UX.
●Balanceo de combate, cultivo, economía.
●Contenido +18 completo (escenas, opciones de elipsis).
●Optimización (rendimiento WebGL, carga de assets).
●Testing con jugadores.
●Localización (Español/English).
18.5 Fase 4: Lanzamiento (Mes 18–24 → Diciembre 2027)
●Lanzamiento single-player (PC + Web).
●Tienda (cosméticos, utilitarios, servicios).
●Soporte post-lanzamiento (parches, eventos).
18.6 Fase 5: Post-Lanzamiento (2028+)
●Multiplayer (mercado compartido → mundo compartido → PvP).
●IA narrativa (diálogo dinámico, narración de eventos).
●Espíritus Guardianes y Bestias y Doma.
●Reino Inmortal y Reino Absoluto (expansiones).
●Móvil (si hay demanda).
18.7 Hitos Clave
Hito	Fecha estimada
GDD V3 aprobado	Mes 0
Prototipo jugable (Vertical Slice)	Mes 6
Alpha cerrada	Mes 12
Beta abierta	Mes 18
Lanzamiento	01/12/2027
Multiplayer	2028
IA narrativa	2028

SECCIÓN 19 — APÉNDICES: CONTRADICCIONES RESUELTAS
Registro de todas las contradicciones entre archivos fuente y la decisión tomada. Para tu revisión.
#	Contradicción	Archivos en conflicto	Resolución
1	Naturaleza del juego: IA-narrado vs. gráfico tradicional	Módulos 1–4 vs. GDD V2	Híbrido: motor Wulin = lógica; IA = narración post-lanzamiento.
2	Combate: comparativo vs. por turnos	Módulo 2 vs. GDD V2	Tiempo real con stats: stats definen rango, habilidad modula; advertencia pre-combate.
3	Muerte: permanente vs. revivir	Módulo 1 vs. GDD V2	Dos modos: Fácil (no definitiva) e Infierno (definitiva con vías de salvamento).
4	Tiempo: turnos/calendario vs. tiempo real MMO	Módulo 1 vs. GDD V2	Tiempo real + calendario chino + time-skips para actividades largas.
5	Multijugador: single-player vs. MMO	Módulos vs. GDD V2	Single-player en lanzamiento, arquitectura preparada, multi post-lanzamiento.
6	"Formación" en Pilar 1: entrenamiento vs. formaciones de energía	Respuesta del usuario	Entrenamiento/aprendizaje; formaciones de energía = subsistema.
7	Scope: MVP 20×20 vs. 25+ provincias	GDD V2 vs. Lore Mortal	Visión completa en GDD, MVP en roadmap; lanzamiento con Reino Mortal completo.
8	Monetización: F2P+P2W vs. no P2W	GDD V2 vs. ética	F2P + cosméticos/utilitarios, nunca P2W directo.
9	Gestión de facción: desde el inicio vs. desbloqueada	Módulos vs. respuesta del usuario	Desbloqueada por nivel (empiezas como discípulo externo).
10	Espíritus/Bestias: pilar vs. opcional	Complemento/Compendio vs. respuesta del usuario	Futuro (post-lanzamiento).
11	Idioma: español vs. inglés	Archivos fuente vs. estándar	Bilingüe (Español/English).
12	Rating: +16 vs. +18	GDD V2 vs. respuesta del usuario	+18, sin excluir temas.

SECCIÓN 20 — REFERENCIA A ARCHIVOS FUENTE
Archivo	Contenido	Uso en el GDD
1 Prompt V10.md	Módulo 1: Núcleo del sistema, identidad, reglas base, estructura de respuesta, calendario, estados de actividad, protocolo de limpieza.	Sección 2 (Motor), Sección 3 (Creación), Sección 10 (Tiempo), Sección 12 (PNJs).
2 Reglas y Mecánicas.md	Módulo 2: Poder, combate, economía, propagación, social, karmico, tablas de reino/EXP, corrección de errores.	Secciones 4–9, 16.5–16.6.
3 Reglas de Simulacion.md	Módulo 3: Ciclo de simulación, generación de eventos, encargos marciales, 10 Reglas del Motor de Realidad.	Sección 2.2, Sección 8.3.
4 Directriz de Proactividad.md	Módulo 4: Proactividad, agenda NPC, dilema de recursos, reloj de arena, contraataque, memoria afectiva.	Sección 2.6, Sección 12.5.
Biblioteca Celestial.md	Catálogo de técnicas ortodoxas (TM, C, A, F, FOR, M, HL, PD, FD, MAP, CG, D).	Sección 6.5 (referencia), Sección 6.6 (formaciones).
Biblioteca Celestial Demoníaca.md	Catálogo de técnicas demoníacas (DTM, DTS, DTV, DTP, DTC, DTX, CDD, CDS, CDV, CDP, CDC, ADA, ADS, ADV, ADP, ADC, FDD, FDS, FDV, FDP, FDC, FOD, FOS, FOV, FOP, FOC, CDD101–105, PDD, CPD, MDTM, DCS, DAL, DFO, DTM100–112, DCS011–033).	Sección 6.5 (referencia), Sección 6.6 (formaciones).
Lore Mortal.md	25+ provincias, Trinidad Suprema, Seis Pilares, 5 Clanes, 5 Cultos, Fortalezas, Instituciones, Corte Imperial, Alianzas, Bestias, Lugares de Poder, Recursos, Mito Fundacional, Era de la Sangre y el Loto, Tres Focos de Tensión, 100 Providencias, 100 Físicos, Apellidos, Nombres.	Sección 11 (Mundo), Sección 3 (Creación), Sección 4 (Cultivo).
Lore Inmortal.md	Mito fundacional, 5 niveles/dimensiones, facciones inmortales, razas, 20 Leyes Supremas, Tribulación Celestial.	Sección 11.1–11.3, 11.10–11.12.
Recursos.md	Minerales, plantas, piedras espíritu, venenos, bestias, recursos acuáticos, píldoras, artefactos, armas, armaduras, formaciones, talismanes.	Sección 7.6, Sección 16.3.
Sectas.md	Rangos de secta (10 rangos), listado de 100+ sectas pequeñas/medianas, técnicas inmortales.	Sección 8 (Facciones).
Compendio de Bestias.md	50 bestias clasificadas por rango, hábitat, Marca del Dao, material clave, habilidad innata.	Sección 11.7.
Complemento.md	Alma dual (Hun/Po), clasificación de entidades espirituales, ciclo de reencarnación, Inframundo, Espíritus Guardianes, Gui Dao, tribulaciones agravadas.	Sección 11.13 (futuro).
Sistema de Cultivo.MD	Atributos, Karma, reinos, dantian, núcleo, alma, providencias, físicos, estados especiales, venas de Qi, mecánicas de cultivo, fórmulas.	Sección 4 (Cultivo), Sección 16.6.
📜 GDD MAESTRO_ MURIM - SENDAS INMORTALES.docx	High concept, pilares, core loop, mecánicas, progresión, narrativa, mundo (MVP), arte, audio, UI/UX, arquitectura técnica, matriz de scope, fórmulas, generación procedural, base de datos, árboles de progresión, economía, karma/fama, relaciones sociales.	Sección 1 (Visión), Sección 15 (Estética), Sección 16 (Arquitectura), Sección 18 (Roadmap).


🛡️ GUÍA DE DESARROLLO PROFESIONAL Y SEGURIDAD
1. Arquitectura y Patrones de Diseño
1.1 Principio Fundamental: Servidor Autoritativo (Server-Authoritative)
El servidor es la única fuente de verdad para todo el estado del juego: posición, salud, inventario, Qi, oro, reputación, resultado de combates y transacciones económicas. El cliente solo envía inputs (intenciones), nunca resultados.
Regla	Aplicación en Murim
El cliente nunca modifica estado crítico	El jugador pulsa "atacar"; el servidor calcula daño, crítico y muerte.
Validación de toda acción en servidor	Usar una técnica requiere validar Qi disponible, cooldown, rango y línea de visión en el servidor.
Solo se envía al cliente lo que necesita ver	No enviar datos de enemigos fuera del rango de percepción (evita wallhacks y map hacks).
Prohibido P2P en economía/combate	Todo pasa por servidor dedicado; el P2P solo se justifica en features no competitivas.
Patrones aplicables:
●Comando/Input Pattern: El cliente encapsula acciones (AttackCommand, CultivateCommand) y las envía; el servidor las valida y ejecuta.
●Event Sourcing (parcial): Registrar eventos del mundo (conquistas, muertes, transacciones) como flujo inmutable para auditoría y anti-cheat.
●State Sync: Sincronizar solo deltas de estado (no el estado completo) para reducir ancho de banda.
●ECS (Entity-Component-System): Para gestionar entidades del mundo (jugadores, NPCs, bestias, loot) de forma escalable.
1.2 Separación de Responsabilidades (Clean Architecture)
text
Cliente (React + Phaser)
    │  inputs (WebSocket/HTTP)
    ▼
API Gateway / WebSocket Server (Node.js)
    │  validación de autenticación y rate limit
    ▼
Servicio de Juego (Game Service)
    ├── Motor de Simulación Wulin (lógica pura, testeable)
    ├── Servicio de Combate
    ├── Servicio de Economía
    ├── Servicio de Facciones
    └── Servicio de Persistencia
    ▼
Base de Datos (PostgreSQL) + Caché (Redis)
●Motor Wulin como librería independiente: La lógica de reglas (fórmulas, validaciones, calendario, propagación) debe ser un paquete TypeScript testeable, sin dependencias de Express ni de Phaser. Esto permite testear reglas sin levantar el servidor.
●Capa de presentación (React/Phaser) aislada: No debe contener lógica de juego; solo renderiza el estado que recibe del servidor.
1.3 Patrones de Diseño Clave
Patrón	Uso en Murim
Repository	Abstraer el acceso a datos (jugadores, facciones, mercado) para cambiar de SQLite a PostgreSQL sin tocar la lógica.
Observer / Event Bus	Comunicación React ↔ Phaser y notificaciones de eventos del mundo (ej: "facción X declaró guerra").
Strategy	Diferentes algoritmos de combate, generación de loot o IA de NPC según el contexto (jefe, PvP, PvE).
Factory	Creación de entidades (personajes, bestias, objetos) con validación centralizada.
State Machine	Estados de actividad del jugador (ALERTA, CONCENTRADO, AISLADO) y estados de NPC (pasivo/reactivo/proactivo).
Circuit Breaker	Proteger servicios externos (pasarela de pago, futura IA) de fallos en cascada.

2. Seguridad de la Aplicación (OWASP Game Security Framework)
El OWASP Game Security Framework (GSF) es la referencia estándar para seguridad en videojuegos. Sus controles se agrupan en capas:
2.1 Autenticación y Gestión de Sesiones
●Contraseñas: Hash con bcrypt o scrypt (nunca MD5/SHA1).
●Autenticación multifactor (MFA): Ofrecer 2FA (TOTP) para cuentas con inventario valioso o roles administrativos.
●Sesiones: Tokens JWT de corta duración + refresh tokens rotativos; cookies Secure, HttpOnly, SameSite=Strict.
●Rate limiting en login: Limitar intentos por IP y por cuenta (ej: 5 intentos/minuto).
●CAPTCHA en registro y recuperación de contraseña para frenar bots.
2.2 Autorización y Control de Acceso
●Principio de menor privilegio: Los servidores de juego corren con cuentas de sistema de bajos privilegios; los jugadores no acceden a funciones administrativas.
●Validación de propiedad: Antes de cualquier operación sobre un objeto (vender, usar, transferir), verificar que el jugador es el dueño legítimo.
●Roles: Separar player, moderator, admin, system. Los endpoints de administración deben estar en una red separada o requerir VPN/IP allowlist.
2.3 Validación de Entradas y Salidas
●Validación en servidor: Todo input del cliente (nombre, chat, comandos) se valida contra un esquema estricto (Zod, Joi, class-validator). Rechazar tipos inesperados, longitudes excesivas y caracteres de control.
●Sanitización: Escapar HTML en chat y nombres para prevenir XSS. En React, usar dangerouslySetInnerHTML solo con contenido saneado.
●Consultas parametrizadas: Usar ORM (Prisma, TypeORM) o prepared statements; nunca concatenar SQL con input del usuario.
●No exponer referencias internas: No usar IDs de base de datos en URLs ni en el cliente; usar identificadores opacos (UUID) y mapas de referencia.
2.4 Anti-Cheat y Prevención de Trampas
Amenaza	Contramedida
Speed hack / teleport	Servidor valida que el desplazamiento sea posible según velocidad y terreno.
Item duplication	Transacciones atómicas en BD + idempotencia de operaciones (cada acción con request_id único).
Currency generation	Todo movimiento de oro/piedras pasa por el servicio de economía con validación de saldo y auditoría.
Aimbot / triggerbot	Telemetría estadística: detectar precisión anormalmente alta y tiempos de reacción inhumanos.
Wallhack / ESP	Enviar al cliente solo entidades dentro de su rango de percepción y línea de visión.
Client tampering	Ofuscación de código y nunca confiar en valores calculados en cliente (daño, crítico, loot).
Regla de oro: "Si el cliente decide un resultado y el servidor lo acepta, es una vulnerabilidad" (CWE-602).
2.5 Seguridad en Red y API
●HTTPS/TLS 1.2+ obligatorio en todas las comunicaciones.
●WebSocket seguro (wss://) con autenticación en el handshake.
●Rate limiting global (Express express-rate-limit) para mitigar DoS y fuerza bruta.
●Cabeceras de seguridad con helmet: Content-Security-Policy, X-Content-Type-Options, Strict-Transport-Security, X-Frame-Options: DENY.
●DDoS: Usar Cloudflare o AWS Shield; no exponer IPs de servidores de juego directamente.
●Validación de payload: Límite de tamaño de body (ej: 10 KB para JSON, 100 KB para uploads).

3. Protección de Datos y Privacidad (GDPR/RGPD)
Murim recopila datos personales (email, IP, telemetría, datos de pago) y datos de comportamiento. Debe cumplir el RGPD y las guías de la AEPD/Autoridad Belga para videojuegos.
3.1 Principios Rectores
Principio	Implementación
Minimización de datos	Recoger solo lo estrictamente necesario. No pedir fecha de nacimiento real si no es requerida; usar un rango de edad para control parental.
Finalidad limitada	Los datos de telemetría para anti-cheat no pueden usarse para marketing sin consentimiento separado.
Consentimiento explícito	UI clara para consentir datos opcionales (analytics, personalización, cross-promoción). Por defecto, todo lo opcional está desactivado.
Derecho al olvido	Implementar endpoint y flujo de eliminación de cuenta que borre datos personales en un plazo máximo de 30 días, incluyendo backups.
Derecho de acceso y portabilidad	Exportar los datos del jugador en formato legible (JSON/CSV).
Retención limitada	Política de retención: logs de seguridad 90 días, telemetría 1 año, datos de cuenta hasta eliminación.
Privacidad desde el diseño (Privacy by Design)	La privacidad se define en la fase de diseño, no se añade después.
3.2 Datos Sensibles y Cifrado
●Cifrado en tránsito: TLS para toda comunicación.
●Cifrado en reposo: Datos personales (email, IP, datos de pago) cifrados en la base de datos y en backups.
●Datos de pago: Nunca almacenar números de tarjeta; delegar a Stripe/PayPal (PCI-DSS compliance).
●Secretos y claves: Almacenar en un key vault (AWS Secrets Manager, HashiCorp Vault), nunca en código ni en .env del repositorio.
3.3 Menores de Edad y Contenido +18
●El juego es +18, pero debe existir verificación de edad en el registro (fecha de nacimiento o confirmación).
●Si se permite registro a menores (no recomendado para +18), se requiere consentimiento parental verificable (COPPA/GDPR).
●Loot boxes: Si se implementan, deben: (a) revelar probabilidades, (b) no venderse a menores sin consentimiento parental, (c) no ser la única vía de obtención de ítems de poder (evitar P2W).
3.4 Evaluación de Impacto (DPIA)
Antes del lanzamiento, realizar una Data Protection Impact Assessment (DPIA) si se tratan datos a gran escala, se perfilan jugadores o se usan sistemas automatizados (futura IA). Documentar: finalidades, base legal, riesgos y medidas mitigadoras.
3.5 Registro de Actividades de Tratamiento
Mantener un registro (Art. 30 GDPR) de: qué datos se recogen, para qué, dónde se almacenan, quién accede y por cuánto tiempo.

4. Seguridad en el Frontend (React + Phaser)
4.1 React (UI Administrativa)
●Content Security Policy (CSP): Restringir orígenes de scripts, estilos e imágenes. Evitar unsafe-inline y unsafe-eval.
●No almacenar tokens en localStorage: Usar cookies HttpOnly o memoria con refresh token.
●Sanitización de HTML: Si se renderiza contenido generado por usuarios (nombres, chat), sanear con DOMPurify.
●Dependencias: Auditar con npm audit y mantener actualizadas; usar overrides para forzar versiones seguras de dependencias transitivas.
4.2 Phaser (Mundo Isométrico)
●Phaser corre fuera del DOM de React: Aislar el canvas en un componente dedicado; no mezclar lógica de juego con lógica de UI.
●No incluir lógica crítica en el cliente: El cliente solo predice visualmente; el servidor reconcilia. Si hay discrepancia, el servidor corrige.
●Ofuscación: El bundle de producción debe estar minificado y ofuscado para dificultar la ingeniería inversa (pero esto no sustituye la validación en servidor).

5. Seguridad del Backend (Node.js + Express)
Checklist basado en el Node.js Security Checklist:
Control	Implementación
Helmet	Cabeceras de seguridad en todas las respuestas.
Rate limiting	express-rate-limit por IP y por usuario autenticado.
Validación de body	express-validator o Zod; rechazar payloads que no cumplan el esquema.
Sanitización	xss o dompurify para inputs de texto.
CORS	Restringir a orígenes permitidos (https://murim.game), no *.
Cookies seguras	Secure, HttpOnly, SameSite=Strict, expiración corta.
Manejo de errores	No exponer stack traces ni detalles internos al cliente; loggear en servidor.
Dependencias	npm audit en CI; snyk o Dependabot para parches automáticos.
Variables de entorno	dotenv solo en desarrollo; en producción, usar secretos del orquestador (K8s Secrets, AWS Secrets Manager).
Usuario no root	El proceso Node.js corre con usuario sin privilegios.

6. Seguridad de la Base de Datos
●Motor: PostgreSQL para producción (SQLite solo para desarrollo/MVP single-player).
●Acceso: Solo el servicio de juego accede a la BD; ningún cliente ni servicio externo.
●Credenciales: Usuario de BD con permisos mínimos (solo las tablas necesarias; no SUPERUSER).
●Cifrado en reposo: Habilitar cifrado de disco (TDE en PostgreSQL o cifrado a nivel de volumen).
●Backups cifrados: Copias de seguridad diarias cifradas, con retención definida y pruebas de restauración.
●Auditoría: Loggear accesos a datos sensibles (quién, cuándo, qué).
●Inyección SQL: Uso exclusivo de consultas parametrizadas vía ORM.
●Índices y rendimiento: Índices en columnas de búsqueda frecuente (jugador_id, facción_id, timestamp); evitar full scans en tablas grandes.

7. Seguridad de la Infraestructura y DevOps
7.1 CI/CD Seguro
●SAST (Static Analysis): SonarQube, CodeQL o Semgrep en cada PR; el build falla si hay vulnerabilidades críticas.
●DAST (Dynamic Analysis): OWASP ZAP contra el entorno de staging antes de cada release.
●Dependency scanning: npm audit, Snyk o OWASP Dependency-Check en CI.
●SBOM (Software Bill of Materials): Generar y almacenar la lista de dependencias y sus versiones para trazabilidad.
●Secret scanning: Detectar claves filtradas en el repositorio (GitHub Secret Scanning, TruffleHog).
7.2 Infraestructura
●Segmentación de red: Separar la BD, los servidores de juego y los servicios públicos en subredes distintas.
●Firewall: Solo abrir puertos necesarios (443 HTTPS, 22 SSH restringido por IP).
●WAF (Web Application Firewall): Cloudflare, AWS WAF o ModSecurity para filtrar tráfico malicioso.
●Monitoreo y alertas: Logs centralizados (ELK, Grafana Loki); alertas ante picos de errores 4xx/5xx, latencia o intentos de acceso no autorizados.
●Pentesting: Prueba de penetración independiente antes del lanzamiento y tras cambios de alto riesgo.

8. Cumplimiento Legal y Monetización
8.1 Términos de Servicio y Política de Privacidad
●Redactar ToS y Política de Privacidad claras, bilingües (ES/EN), accesibles antes del registro.
●Incluir: datos recogidos, finalidades, base legal, derechos del jugador, contacto del DPO (Delegado de Protección de Datos), política de cookies.
8.2 Monetización y Loot Boxes
Requisito	Detalle
Transparencia de probabilidades	Mostrar tasas de drop antes de la compra (obligatorio en varios países).
Protección de menores	No vender loot boxes a menores sin consentimiento parental; considerar rating PEGI 16/18 si se incluyen.
No Pay-to-Win	No vender poder directo (niveles, stats). Solo cosméticos, conveniencia y servicios (alineado con el GDD).
Reembolsos	Política clara de reembolsos conforme a la ley del consumidor de la región.
Moneda premium	No convertible de vuelta a dinero real; separar economía del juego de la economía real.
8.3 Propiedad Intelectual
●Verificar licencias de todos los assets (sprites, música, fuentes). Usar assets con licencia comercial o propios.
●Registrar la marca "Murim: Sendas Inmortales" en las jurisdicciones objetivo.

9. Requisitos del Portal de Juego (Game Portal)
Componente	Requisitos
Registro/Login	Email + contraseña, OAuth (Google/Steam), verificación de email, recuperación de contraseña, 2FA opcional.
Perfil de jugador	Nombre visible, avatar, estadísticas públicas, historial de logros.
Gestión de cuenta	Cambio de contraseña, cierre de sesión en todos los dispositivos, eliminación de cuenta (GDPR).
Chat y social	Chat global, de facción, susurros; moderación (filtros, reportes, bans); cumplimiento de privacidad (no exponer IPs).
Soporte	Sistema de tickets, FAQ, estado del servicio (status page).
Foro/Comunidad	Opcional; si existe, moderación y normas de conducta.
Tienda	Catálogo, carrito, historial de compras, facturación; integración con pasarela de pago (Stripe).
Panel de administración	Acceso restringido (MFA + IP allowlist), logs de auditoría, gestión de jugadores y contenido.
Accesibilidad	Contraste, tamaño de fuente, navegación por teclado, subtítulos (si hay audio).
Localización	ES/EN completos; fechas, monedas y formatos regionales.

10. Roadmap de Implementación de Seguridad (Fases)
Fase	Acciones de seguridad
Fase 0 (Pre-producción)	Modelado de amenazas; definir arquitectura autoritativa; elegir stack seguro; configurar CI/CD con SAST.
Fase 1 (Vertical Slice)	Implementar autenticación, validación de inputs, rate limiting, HTTPS, helmet; pruebas de penetración internas.
Fase 2 (Alpha)	Implementar anti-cheat básico (validación de movimiento/combate); cifrado de datos sensibles; DPIA inicial.
Fase 3 (Beta)	Pentesting externo; auditoría de dependencias; política de privacidad y ToS; pruebas de carga y DDoS.
Fase 4 (Lanzamiento)	Monitoreo 24/7; plan de respuesta a incidentes; backups verificados; cumplimiento GDPR documentado.
Post-lanzamiento	Revisiones trimestrales de seguridad; actualizaciones de dependencias; simulacros de incidentes.

11. Resumen de Prioridades
1.Servidor autoritativo — Sin esto, cualquier otra medida de seguridad es insuficiente.
2.Validación y sanitización de inputs — Previene inyección, XSS y manipulación de comandos.
3.Cifrado en tránsito y en reposo — Protege datos de jugadores y secretos.
4.GDPR desde el diseño — Minimización, consentimiento, derecho al olvido y retención.
5.CI/CD con SAST/DAST — Detecta vulnerabilidades antes de que lleguen a producción.
6.Monitoreo y respuesta a incidentes — No se puede proteger lo que no se ve.
Este conjunto de prácticas debe integrarse en el GDD V3 como un apéndice técnico de seguridad y cumplimiento, y verificarse en cada hito del roadmap (Sección 18 del GDD).


Perfecto. Pausar esta parte es la decisión más inteligente. No podemos dejar que la falta de arte definitivo bloquee la programación de la lógica del juego. 

Aquí tienes el documento estructurado que puedes copiar y pegar directamente en tu **GDD Maestro V3**, bajo una nueva sección (por ejemplo, en el Apéndice o en la Sección de Arte y UI). Está redactado como una especificación técnica y de diseño para el futuro.

***

# 📜 ESPECIFICACIÓN TÉCNICA: SISTEMA DE CUSTOMIZACIÓN DE PERSONAJE (PENDIENTE)

**Estado:** Pendiente (Fase de Arte y Pulido).  
**Objetivo:** Implementar un sistema de "Paperdoll" (muñeco de capas) 2D para la creación y evolución visual del personaje, emulando la profundidad de juegos como *Immortal Taoists* o *SWTOR*, pero con la estética Manhwa/Xianxia de Murim.

## 1. Lo que QUEREMOS (Visión y Experiencia de Usuario)
*   **Estética Visual:** Arte 2D estilo Manhwa/Webtoon con líneas limpias, colores planos y sombreado suave. Iluminación frontal.
*   **Sistema de Capas (Layered Paperdoll):** El avatar debe estar compuesto por múltiples imágenes PNG transparentes superpuestas. Al cambiar una opción (ej. peinado), solo cambia esa capa, manteniendo el resto intacto.
*   **Animaciones Idle (Reposo):** El personaje no debe ser estático. Debe tener micro-animaciones:
    *   *Respiración:* El torso y la ropa se expanden sutilmente (`scaleY`).
    *   *Cabello flotante:* El Qi hace que el cabello oscile levemente (`rotate` y `translateY`).
    *   *Parpadeo:* Los ojos se cierran y abren cada cierto tiempo usando Spritesheets.
    *   *Mirada interactiva:* (Opcional) Los ojos siguen el cursor del ratón usando JavaScript.
*   **Desbloqueo por Lore:** Las túnicas y accesorios no solo deben ser cosméticos, sino reflejar el rango y la facción (ej. la túnica verde de Ortodoxo, la púrpura de Demoníaco, la corona de un Noble).

## 2. Lo que NECESITAMOS (Requerimientos Técnicos y de Arte)
*   **Formato de Imagen:** Todos los assets deben ser archivos `.png` con fondo transparente.
*   **Dimensiones:** Todas las imágenes deben tener exactamente el mismo tamaño (ej. `800x800px` o `1024x1024px`) y estar centradas para que encajen perfectamente.
*   **Categorías de Assets Requeridos (Banco de Imágenes):**
    *   **Cuerpo Base:** Rostro base (calvo, cuello, torso) para Hombre y Mujer.
    *   **Cabello:** Capa trasera (pelo largo) y capa frontal (flequillo). Mínimo 5 estilos.
    *   **Ojos:** Mínimo 3 formas. (Si se usa parpadeo, debe ser un Spritesheet de 3 frames: abierto, semi-cerrado, cerrado).
    *   **Cejas:** Mínimo 3 formas.
    *   **Bocas:** Mínimo 3 formas.
    *   **Narices:** Mínimo 2 formas.
    *   **Túnicas/Ropa:** Mínimo 3 variantes por alineación (Ortodoxo, Heterodoxo, Demoníaco) y 1 de Plebeyo/Errante.
    *   **Accesorios (Tocados):** Coronas imperiales, horquillas (zan), cintas taoístas.
*   **Herramientas de Software:** 
    *   *Para arte:* Photoshop, Clip Studio Paint o Krita.
    *   *Para animación avanzada:* Spine 2D o Live2D (opcional si se quiere deformación de malla en lugar de solo CSS).
    *   *Para separación de IA:* ImageToLayers o Photoshop (Generative Fill).

## 3. IDEAS ESPECÍFICAS Y MECÁNICAS (El "Cómo se hará")
*   **Arquitectura Frontend:** El componente `CharacterCustomizer.tsx` debe usar posicionamiento absoluto (`position: absolute; top: 0; left: 0;`) y `z-index` para apilar las capas.
*   **Pipeline de Generación (Flujo de trabajo sugerido para el futuro):**
    1. Generar un personaje completo en Midjourney/Stable Diffusion con "A-pose" y fondo blanco.
    2. Usar una IA de segmentación (ImageToLayers) para dividir la imagen en capas.
    3. Limpiar manualmente los huecos (inpainting) donde el cabello tapaba la cara.
    4. Guardar los PNGs en `public/assets/characters/`.
*   **Lógica de Implementación en React:**
    ```tsx
    // Ejemplo de cómo se apilarán las imágenes
    <img src="/assets/characters/body.png" className="absolute z-10" />
    <img src={`/assets/characters/eyes_${appearance.eyeType}.png`} className="absolute z-20" />
    <img src={`/assets/characters/hair_${appearance.hairStyle}.png`} className="absolute z-30" />
    ```
*   **Motor de Animación CSS:** 
    *   La capa de cabello tendrá `animation: floatHair 6s ease-in-out infinite; transform-origin: top center;`.
    *   La capa del cuerpo tendrá `animation: breathing 4s ease-in-out infinite; transform-origin: bottom center;`.
*   **Integración con Backend:** El objeto `appearance_json` ya está preparado en la base de datos SQLite. Solo tendrá que almacenar los IDs de los assets seleccionados (ej: `{"hair": 2, "eyes": 1, "outfit": "sect_orthodox"}`).

## 4. Referencias Visuales y Competencia
*   *Immortal Taoists:* Referencia principal para el layout de botones y capas.
*   *SWTOR / Mobile MMOs:* Referencia para la rotación 3D y la UI de pestañas de selección.
*   *Repositorios de Assets:* Buscar "Wuxia Character Creator" o "Anime Paperdoll" en Itch.io o Unity Asset Store (costo aproximado: $20 - $50 USD).

***

Con esto en tu GDD, tienes la tranquilidad de que la idea está documentada y no se perderá. Cuando contrates a un artista o tengas presupuesto para comprar assets, tendrás una guía exacta de lo que necesitas pedir.

Perfecto. Esta es una decisión de arquitectura de nivel profesional. Vamos a documentar esta visión en el GDD para que quede como el estándar definitivo del proyecto.

He rescatado las matemáticas del archivo que me compartiste, las he adaptado a la estética 2D isométrica de Phaser (explicando cómo usar los ángulos en sprites 2D) y he estructurado todo para que puedas copiarlo y pegarlo directamente en tu `GDD_MAESTRO_V3_RESUMEN.md`.

***

### 📥 Sección 15 o Apéndice Técnico

```markdown
## 🧬 SISTEMA DE ESQUELETO BIOMECÁNICO Y PAPERDOLL (VISIÓN FUTURA)

**Estado:** Documentado para Fase 1.5 (Post-Vertical Slice).
**Objetivo:** Implementar un sistema de animación hiper-customizable usando un esqueleto matemático (Cinemática Inversa) que controle tanto un Maniquí 3D (para la UI de Meridianos) como fragmentos de sprites 2D (Paperdoll) en el mapa isométrico.

### 15.1 Filosofía del Sistema
En lugar de dibujar animaciones completas (spritesheets pesados), dividiremos el personaje en piezas anatómicas (cabeza, cuello, torso, hombros, brazo_sup, codos, brazo_inf, pelvis, muslo, rodillas, pantorrilla, tobillos, pies.). Un "esqueleto invisible" calculará los ángulos matemáticos de las articulaciones (cuello, hombros, codos, rodillas, tobillos) y Phaser rotará cada pieza de arte según esos ángulos. Esto permite equipar armaduras, túnicas y armas de forma modular infinita.

### 15.2 Dualidad de Renderizado (React vs. Phaser)
*   **Instancia UI (React + Three.js):** Usaremos un Maniquí 3D de madera procedural (generado con primitivas geométricas). Su función principal será visualizar la **Progresión de Meridianos** (el maniquí se iluminará en el Pulmón, Corazón, etc., a medida que el jugador avance).
*   **Instancia Mundo (Phaser 3):** Usaremos el mismo esqueleto matemático, pero en lugar de dibujar 3D, aplicaremos los ángulos de rotación a fragmentos de imágenes 2D (Paperdoll).

### 15.3 Las Matemáticas del Esqueleto (Cinemática Inversa)
Para evitar motores de físicas pesados, usaremos **Cinemática Inversa Analítica (IK de 2 huesos)** basada en la Ley de los Cosenos. Esta función se implementará en `src/core/utils/biomechanics.ts`.

**Contratos de Tipos (Añadir a `player.types.ts`):**
```typescript
export interface Vector3D { x: number; y: number; z: number; }
export interface BoneRotation { pitch: number; yaw: number; roll: number; }

export interface MannequinJoint {
  id: string;                  
  position: Vector3D;          
  rotation: BoneRotation;      
  limits: {                    
    minPitch: number; maxPitch: number;
    minYaw: number; maxYaw: number;
  };
}

export interface ProceduralMannequin {
  esferas: { cabeza: any; manos: any; pies: any; };
  esferoides: { torso: any; pelvis: any; };
  cilindros: { 
    cuello: any;
    brazoIzquierdo: MannequinJoint; brazoDerecho: MannequinJoint;
    antebrazoIzquierdo: MannequinJoint; antebrazoDerecho: MannequinJoint;
    musloIzquierdo: MannequinJoint; musloDerecho: MannequinJoint;
  };
  woodGrainSeed: number; // Determinismo para las vetas de madera (Mulberry32)
}

export interface PlayerAppearance {
  // ... campos anteriores
  mannequinStructure?: ProceduralMannequin; 
}
```

**Función Matemática Base (Ley de Cosenos para IK):**
```typescript
import { Vector3D, BoneRotation } from '../types/player.types';

export function solveTwoBoneIK(
  origin: Vector3D, target: Vector3D, lengthUpper: number, lengthLower: number
): { upperRotation: BoneRotation; lowerRotation: BoneRotation; reached: boolean } {
  
  const targetRel = { x: target.x - origin.x, y: target.y - origin.y, z: target.z - origin.z };
  const dist = Math.sqrt(targetRel.x**2 + targetRel.y**2 + targetRel.z**2);
  const maxLength = lengthUpper + lengthLower;
  const targetDist = dist > maxLength ? maxLength * 0.999 : dist;

  // Ley de Cosenos
  const cosLower = (targetDist**2 - lengthUpper**2 - lengthLower**2) / (-2 * lengthUpper * lengthLower);
  const cosUpperAdjacent = (lengthLower**2 - lengthUpper**2 - targetDist**2) / (-2 * lengthUpper * targetDist);

  const clamp = (val: number) => Math.max(-1, Math.min(1, val));
  const lowerAngleRad = Math.acos(clamp(cosLower));
  const upperAngleOffsetRad = Math.acos(clamp(cosUpperAdjacent));

  const pitchToTarget = Math.atan2(targetRel.y, Math.sqrt(targetRel.x**2 + targetRel.z**2));
  const yawToTarget = Math.atan2(targetRel.x, targetRel.z);

  return {
    upperRotation: { pitch: pitchToTarget - upperAngleOffsetRad, yaw: yawToTarget, roll: 0 },
    lowerRotation: { pitch: Math.PI - lowerAngleRad, yaw: 0, roll: 0 },
    reached: dist <= maxLength
  };
}
```

### 15.4 Animaciones Procedurales (Trigonométricas)
Las animaciones (caminar, correr, saltar, agacharse) no serán archivos `.fbx` ni `.png`. Serán funciones `Math.sin` y `Math.cos` ligadas al `time` (reloj de Phaser). 
*   **Idle (Meditación/Reposo):** El torso sube y baja sutilmente `Math.sin(time * 2) * 0.02`.
*   **Caminar:** Las piernas oscilan en oposición. `piernaIzq = Math.sin(time * 5) * 0.4`, `piernaDer = -Math.sin(time * 5) * 0.4`.
*   **Correr:** Aumenta la frecuencia y amplitud. El torso se inclina hacia adelante.
*   **Agacharse:** Los muslos rotan hacia adelante (`pitch: -0.9`) y las rodillas se flexionan (`pitch: -1.4`). El eje Y del esqueleto baja.

### 15.5 Desafíos de Implementación (A resolver en el prototipo)
1.  **Pivots (Puntos de Anclaje):** El artista debe dibujar el `brazo.png` recto, sabiendo que el eje de rotación (el codo) estará en una coordenada exacta (ej: `x: 32, y: 64` de la imagen).
2.  **Z-Sorting (Orden de Capas):** En isométrico 2D, si el personaje está de espaldas, el brazo derecho se dibuja detrás del torso; si está de frente, se dibuja delante. Se usará un sistema de `depth` dinámico basado en el ángulo `yaw` del esqueleto.
3.  **Perspectiva Aplanada:** La matemática 3D calcula ángulos reales. Para Phaser 2D, tendremos que "escalar" los ángulos en el eje Y (`escalaY = 0.5`) para que los movimientos se vean naturales en la vista isométrica.

### 15.6 Plan de Prototipado (Próximos pasos)
Antes de pedir arte definitivo, construiremos un **"Stickman Matemático"**:
1.  Crear rectángulos de colores (brazos, piernas, torso).
2.  Aplicarles las funciones `solveTwoBoneIK` y `getMovementAngles`.
3.  Hacer que el Stickman camine y esquive árboles en Phaser usando el pathfinding A* ya existente.
```

***
