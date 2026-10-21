# ⚙️ MÓDULO 2: REGLAS Y MECÁNICAS (Rules Engine) V1.0
Diseño Integrado - Versión para Implementación Inmediata

--------------------------------------------------------------------------------
ÍNDICE
SISTEMA DE PODER Y COMBATE
SISTEMA ECONÓMICO
SISTEMA DE TIEMPO Y PROPAGACIÓN
SISTEMA SOCIAL Y KARMICO
TABLAS DE CONSULTA RÁPIDA
LÍMITES DEL MUNDO
--------------------------------------------------------------------------------
--------------------------------------------------------------------------------
## SISTEMA DE PODER Y COMBATE
### Cálculo de Poder Efectivo

  - Poder_efectivo: 
    - formula_base: (capacidad_qi/1000) × multiplicador_dantian × (1 + (FIS+AGI+INT)/300)
    - Sald Maxima: =((constitucion[Valor]*Nivel absoluto[Valor])+(Karma[Valor])*0.85)
    - Regeneracion de qi = 5 + (Karma[Valor]/20) * (Voluntad/10)*Nivel absoluto[Valor]
    - ATA FIS = (Fuerza*2) + (Destreza*1.5)
    - ATA QI = (Sabiduria * 2) + (Voluntad * 1) + (Karma TOTAL/10) * multiplicador_dantian
    - DEF FIS = (Constitucion * 2) + (Voluntad * 0.5)
    - DEF QI = (Constitucion * 2) + (Voluntad * 0.5) + (Karma TOTAL * 0.5) * multiplicador_dantian
    - VELOCIDAD = (Destreza * 2) + (Percepcion * 0.4) + (Astucia * 0.6) * Nivel Absoluto
    - PRECICION = (Destreza+Inteligencia+Percepcion)*0.3 * nivel absoluto + (0.3*Karma)
    - SIGILO = (Destreza + Inteligencia + Percepcion + Astucia + Voluntad + Sabiduria) * Nivel Absoluto
    
  
  - El Sentido Espiritual: es la capacidad del cultivador para percibir el mundo más allá de los cinco
   - sentidos físicos. Es una extensión de la conciencia que permite:
    - Detectar Qi y flujos de energía en el entorno.
    - Percibir a cultivadores  (su intención).
    - Disernir Cultivadores por debajo o en el mismo nivel (Nivel de Cultivo, Estado)
      - Nota: No se puede "ver" a traves de cultivadores de mayor Nivel
    - Ver a través de obstáculos (paredes, tierra, ilusiones).
    - Rastrear a personas u objetos por su firma de Qi.
    - Comunicarse mentalmente a corta distancia (con aliados o para intimidar).
    - Sentido Espiritual = (Percepción × 2) + (Sabiduría × 1.5) + (Voluntad × 0.5) + (Nivel de Cultivo × 10)
  - Escala de Sentido Espiritual
    - Refinamiento Detectar cultivadores en un radio de 10-50m.
    - Fundación	Detectar hasta 100 m.
    - Núcleo Dorado	Detectar hasta 500 m. 
    - Alma Naciente	Detectar hasta 1 km.
    - Formación Espíritu	Detectar hasta 5 km.
    - Inmortal	Detectar en todo un reino.

### Tabla de Resultados de Combate

  combate: 
    comparacion: Se compara PODER_EFECTIVO total (cultivador + equipo + técnicas),
    
    tabla_resultados: 
      diferencia <10%: Equilibrado (50/50, decide estrategia y circunstancias),
      diferencia 10-30%: Ventaja clara (70/30 para el superior),
      diferencia 30-50%: Dominio (85/15, inferior necesita golpe de suerte),
      diferencia 50-100%: Paliza (95/5, inferior solo sobrevive huyendo),
      diferencia 100-200%: Masacre (99/1, inferior no debería haber peleado),
      diferencia >200%: Aniquilación (el inferior muere o huye inmediatamente)
    ,
    
    factores_modificadores: 
      estrategia_superior: +5-15% sobre tu poder,
      conocer_debilidad: +10-25%,
      terreno_favorable: +5-15%,
      emboscada: +15-30%,
      veneno_maestro: +10-30% temporal,
      ayuda_externa: +5-25%,
      reliquia_divina: +20-50% (una vez),
      integridad_alma_baja: -10-50% para el afectado,
      técnica_elemental_opuesta: +20%
    ,
    
    limites_absolutos: 
      regla_1: Diferencia de dantian COMPLETA (ej: rio vs lago) = no hay pelea,
      regla_2: Diferencia de 2 Reinos completas (ej: mortal vs fundacion) = huir es única opción,
      regla_3: Diferencia de 3 Reinos = ni siquiera te detectan como amenaza
    
  

### Habilidades
Estructura de registro de la habilidad
Cada 100 puntos sube un nivel de maestria. (Nivel_M)
en el estado se usara: Estudiando, en progreso, consolidado, maestro
ejemplo:

          id: tec_COM_010,
          nombre: TM261 - Puño del Origen Primordial,
          tipo: Ofensiva / Espiritual,
          Descripcion: aqui va la descripcion de la tecnica, formacion o hechiso
          origen: Clan Long,
          elemento: Origen,
          efecto: Daño base = Nivel_M x (FIS × 0.9) | Golpe del Silencio Eterno: Un solo golpe que ignora toda defensa física y de Qi, atacando directamente el Dantian enemigo.,
          requisitos: Establecimiento Fundación, FIS 35+



#### Bundle Theory

  bundle_theory: 
    definicion: Toda técnica es un conjunto de propiedades analizables.,
    
    estructura_tecnica: 
      id: garra_dragon_infernal,
      nivel_requerido: lago+,
      costo_qi: 120,
      tiempo_carga: 1 segundo,
      propiedades: 
        daño: base: 85, tipo: fuego, penetracion: 40,
        efecto: nombre: quemadura_espiritual, duracion: 3 turnos, daño_segundo: 10,
        debilidades: agua, hielo, escudo yin,
        componentes: kanji_fuego, meridiano_corazon, intencion_ira
      
    ,
    
    comando_desmonta: 
      requisito: INT ≥ 18 o SAB ≥ 20,
      coste: 100 qi, 1 hora,
      resultados: 
        Revela 1-3 debilidades,
        Identifica componente crítico,
        Permite crear contra-técnica (requiere INT 20+),
        Aprendizaje acelerado (+50% progreso) si estudias
      
    
  

--------------------------------------------------------------------------------
## SISTEMA ECONÓMICO (con tabla de costos realista)
- Moneda y Conversión
  sistema_economico: 
    
    moneda: 
      nombres: cobre, plata, oro, piedra_espiritu,
      conversion: 
        1_oro: 100_plata,
        1_plata: 100_cobre,
        1_piedra_baja: 10_oro,
        1_piedra_media: 50_oro,
        1_piedra_alta: 500_oro
- Definiciones
    ingresos_mensuales: 
      descripcion: Flujo de oro que entra cada mes (resultado de suma granular),
      formula: rutas_comerciales + negocios_propios + impuestos_territoriales + contratos_activos,
      nota: Se recalcula al inicio de cada arco usando los activos registrados en Estado Dinámico
    gastos_mensuales: 
      descripcion: Flujo de oro que sale cada mes (resultado de suma granular),
      formula: ejercito + fortalezas + infraestructura + espias + estilo_vida,
      nota: Se recalcula al inicio de cada arco
    Riqueza_total: 
      descripcion: Valor de todos los activos del clan (stock, no flujo),
      formula: oro_liquido + valor_piedras_espiritu + valor_bienes_raices + valor_inventario,
      nota: Referencia de poder económico. No se usa en transacciones diarias.
    balance_mensual: 
      descripcion: Resultado neto del mes,
      formula: ingresos_mensuales - gastos_mensuales,
      nota: Positivo = ahorro, Negativo = pérdida de capital
    
- Tabla de Ingresos
  - ingresos_anuales_mortales: 
      descripcion: Ingreso anual estimado por nivel social (en oro),
      mendigo: 0 - 50,
      campesino: 100 - 400,
      sirviente: 300 - 800,
      artesano: 400 - 1000,
      Forjador: 800 - 1300,
      comerciante: 1000 - 3000,
      noble_bajo: 3000 - 6000,
      alquimico: 3500 - 5000,
      noble_alto: 6000 - 12000,
      magnate: 12000 - 25000,
      nota: Referencia para tasar impuestos y costos de servicios. No se usa para cálculo directo de ingresos del clan.
  - ingresos_anuales_Cultivador: 
      descripcion: Ingreso anual estimado por nivel social - piedras espiritu,
      cultivador_errante: 10 - 50 baja,
      discipulo_externo: 50 - 80 baja,
      discipulo_interno: 10 - 30 media,
      discipulo_principal: 30 - 80 media,
      maestro: 10 - 50 alta,
      patriarca: 50 - 80 alta,
      nota: Referencia para tasar impuestos y costos de servicios. No se usa para cálculo directo de ingresos del clan o Secta.  

- Tabla de Costos de Vida y Servicios / mes
  costos: 
    niveles_sociales_anuales: 
      descripcion: Ingreso anual estimado por nivel social (para referencia, no cálculo directo),
      mendigo: 0 - 50 oro/año (sobrevive de limosnas),
      campesino: 100 - 400 oro/año (trabaja tierra, trueque, paga impuestos),
      artesano: 400 - 1000 oro/año (vida estable, oficio especializado),
      comerciante: 1000 - 3000 oro/año (desahogado, negocios locales),
      noble_bajo: 3000 - 6000 oro/año (tierras pequeñas, sirvientes limitados),
      noble_alto: 6000 - 12000 oro/año (propiedades, influencia regional),
      magnate: 12000 - 25000 oro/año (controla mercados, financia ejércitos),
      poder_regional: 25000 - 50000 oro/año (influye en provincias, ejército propio)
    gastos_mensuales_mortales: 
      descripcion: Costo de vida mensual para una persona mortal (en oro),
      supervivencia: 0.5 - 5,
      vida_modesta: 3 - 8,
      vida_acomodada: 10 - 15,
      vida_lujosa: 12 - 20,
      vida_noble: 25 - 50,
      nota: Incluye comida, vivienda y necesidades básicas según nivel.
    gastos_mensuales_cultivadores: 
      descripcion: Costo de vida mensual para un cultivador (en piedras espíritu),
      cultivador_errante: 1 - 5 baja (10-50 oro),
      discipulo_externo: 5 - 8 baja (50-80 oro),
      discipulo_interno: 1 - 3 media (50-150 oro),
      discipulo_principal: 3 - 8 media (150-400 oro),
      maestro: 1 - 5 alta (500-2500 oro),
      patriarca: 5 - 8 alta (2500-4000 oro),
      nota: Incluye píldoras básicas, materiales de cultivo, y mantenimiento de equipo espiritual. La conversión a oro es aproximada.
    gastos_mensuales_estructurales: 
      descripcion: Costos fijos de infraestructura y personal (en oro),
      soldado_regular: 0.5 (salario, comida, equipo básico),
      soldado_élite_cultivador: 2 - 5 (requiere raciones de mayor calidad, entrenamiento),
      espía_agente: 5 - 15 (depende de red y riesgo),
      fortaleza_pequeña: 20 - 50 (guarnición básica, mantenimiento),
      fortaleza_grande: 100 - 200 (guarnición completa, defensas),
      torre_alquimia: 30 - 60 (materiales, personal especializado),
      ciudad_satelite: 200 - 400 (administración, servicios básicos),
      villa_principal_clan: 100 - 200 (personal doméstico, mantenimiento)
    impuestos: 
      descripcion: Impuesto anual por persona (pagado en cosecha, no mensual),
      campesino: 0.5 - 1 oro/año (5-10% de ingreso anual),
      artesano: 2 - 5 oro/año,
      comerciante: 5 - 20 oro/año (más variable según negocio),
      noble: 50 - 200 oro/año (por tierras, no por persona),
      nota: Los impuestos se cobran anualmente, no mensualmente. El cálculo de ingresos mensuales debe dividir el total anual entre 12.
    costos_referencia_compras: 
      descripcion: Precios de bienes y servicios (en oro, compra única),
      comida_día_campesino: 0.005 - 0.01 (5-10 cobres),
      comida_día_comerciante: 0.03 - 0.05 (3-5 plata),
      comida_día_noble: 0.1 - 0.3 (10-30 plata),
      posada_básica_noche: 0.01 - 0.03 (1-3 plata),
      posada_buena_noche: 0.05 - 0.1 (5-10 plata),
      posada_lujo_noche: 0.2 - 0.5 (con comida y servicios),
      caballo_normal: 5 - 10,
      caballo_guerra: 20 - 40,
      espada_básica: 1 - 3,
      espada_buena: 5 - 10,
      espada_maestra: 15 - 30,
      espada_grado_tierra: 30 - 60,
      espada_grado_alma: 100 - 300,
      píldora_qi_básica: 0.5 - 2 (restaura 50-100 Qi),
      píldora_qi_avanzada: 3 - 10 (restaura 200-500 Qi),
      técnica_básica_(pergamino): 10 - 30,
      técnica_grado_tierra: 30 - 100,
      técnica_grado_alma: 100 - 500,
      técnica_grado_legado: 500+ (raramente se vende),
      manual_purificado: precio × 2-3 (si tiene historia documentada)
    costos_referencia_servicios: 
      descripcion: Pagos recurrentes o por servicio,
      contrato_escolta_básico: 1 - 3/día por escolta (depende riesgo),
      contrato_escolta_élite: 5 - 10/día,
      transporte_caravana: 10 - 50 por viaje (según distancia y carga),
      peaje_camino_real: 0.1 - 0.5 por carreta,
      peaje_pasaporte_long: 0.5 - 2 por caravana comercial,
      informante_menor: 1 - 5/mes,
      informante_élite: 10 - 30/mes

- notas_generales: 
      conversión_moneda: 1 oro = 100 plata = 10,000 cobre,
      precios_variables: Los precios pueden fluctuar ±30% según disponibilidad regional,
      descuentos: Compras al por mayor (>10 unidades) pueden tener 10-20% descuento,
      trueque: En zonas rurales, el trueque es común sobre todo para campesinos
    
  

- Mercado Dinámico
  mercado: 
    variables: 
      disponibilidad: 0-100 (cuánto hay),
      demanda: 0-100 (cuánto quieren),
      precio_base: varía por recurso,
      precio_actual: base × (1 + demanda/100) × (1 + (100-disponibilidad)/100)
    ,
    
    ejemplo_hierro: 
      precio_base: 1,
      disponibilidad: 60,
      demanda: 80,
      precio_actual: 1 × (1+0.8) × (1+0.4) = 1 × 1.8 × 1.4 = 2.52 puntos/unidad
    ,
    
    acciones_mercado: 
      comprar_grande: disponibilidad -5, demanda +2, precio ajusta,
      vender_grande: disponibilidad +5, demanda -2, precio ajusta,
      acaparar: si compras >20% disponible, precio +30% temporal,
      inundar: si vendes >20% disponible, precio -30% temporal,
      monopolio: controlar >70% disponibilidad = fijas precio ±50%
    
  

--------------------------------------------------------------------------------
## SISTEMA DE TIEMPO Y PROPAGACIÓN (EL PROBLEMA)
Regla de Oro: La información viaja a VELOCIDAD REALISTA.
No hay omnisciencia.
- Velocidad de Propagación
  propagacion: 
    - principio: Nadie se entera de nada si no había nadie para verlo y contarlo.,
    - medios: 
      - pruebas: Quedaron signos de la accion o rastros que pueden seguir,,
      - testigo_directo: ve el evento y puede contarlo,
      - mensajero: 30-50 km/día a caballo,
      - paloma: 100-200 km/día (solo si hay red),
      - formación_comunicación: 500 km/día (solo nivel estelar+),
      - rumor: 10-30 km/día (de boca en boca, distorsionado)
    - tiempos_propagacion: 
      - misma_aldea: minutos u horas,
      - aldea_vecina: 1-3 días (viaje + rumor),
      - misma_provincia: 5-15 días,
      - provincia_vecina: 15-30 días,
      - extremo_imperio: 30-60 días,
      - evento_super_importante: puede acelerar (se despachan mensajeros específicos)
    - regla_del_descubrimiento: 
      - tumba_solitaria: 
        - situacion: El jugador encuentra un amuleto en una tumba donde NADIE lo ve,
        - consecuencia: NADIE se entera. El mundo NO REACCIONA. El amuleto es un secreto.,
        - excepcion: Si el amuleto tiene un faro espiritual que alerta a su dueño original (nivel estelar+)
      - robo_nocturno: 
        - situacion: El jugador roba un objeto sin ser visto,
        - consecuencia: El dueño descubre el robo cuando lo nota (días después). No sabe quién fue.,
        - investigacion: Puede investigar (semanas) si tiene recursos
      - combate_público: 
        - situacion: El jugador mata a un discípulo en una plaza llena,
        - consecuencia: Testigos lo ven. La noticia se propaga a velocidad realista.,
        - tiempo: En 3 días lo sabe la ciudad, en 10 la provincia, en 30 el clan entero
      
    
  

IA No Violes la Regla

  regla_anti_omnisciencia: 
    mandamiento: NO PUEDES inventar que el mundo reacciona a algo que NADIE presenció.,
    
    checklist_para_GM: 
      ¿Había testigos?,
      ¿El evento dejó rastros visibles?,
      ¿El objeto tiene un mecanismo de alerta?,
      ¿Alguien con nivel suficiente (estelar+) podría haberlo sentido?,
      ¿El jugador hizo algo para OCULTAR el evento?
    ,
    
    si_todo_es_no: 
      resultado: El evento NO EXISTE para el mundo. Solo para el jugador.
    
  

--------------------------------------------------------------------------------
## SISTEMA SOCIAL
Reputación y Política

  social: 
    afinidad_npc: 
      escala: -100 a +100,
      umbrales: 
        -100: enemigo jurado (te mata si puede),
        -70: hostil (evita, insulta),
        -30: desconfiado (te mide),
        0: neutral (transacción),
        30: amistoso (ayuda menor),
        70: leal (arriesga por ti),
        100: hermano de sangre (muere por ti)

    
    reputacion_faccion: 
      escala: -100 a +100,
      memoria: generacional (lo que hiciste lo recuerdan tus nietos),
      consecuencias_politicas: 
        >50: acceso a instalaciones, descuentos 10%,
        >70: puedes pedir un favor (una vez),
        >90: te consideran héroe vivo,
        <-50: cierran fronteras, no te venden,
        <-80: precio por tu cabeza (10-1000 puntos según nivel),
        <-95: cazan a tu familia también

    relaciones_personales: 
      monogamia: común, esperada socialmente,
      poligamia: permitida SOLO si: nivel núcleo+, riqueza 500+, y todas las partes aceptan,
      concubinato: práctica común entre nobles (no son esposas),
      limite_esposas: 1-3 según estatus (un campesino no puede mantener 3 esposas)

    intereses_politicos: 
      regla: Toda facción actúa por PODER, RECURSOS o SUPERVIVENCIA.,
      preguntas_para_GM: 
        ¿Qué gana esta facción?,
        ¿Qué pierde si no actúa?,
        ¿Quién es su enemigo natural?,
        ¿Quién su aliado histórico?
      
### REGLA DE PRESIÓN JERÁRQUICA:
- Los superiores (Maestro, padres, jefes, superiores, Patriarca, Emperador) deben asignar tareas con plazos concretos cada 3 turnos.
- Si el jugador ignora o falla una tarea asignada por un superior, pierde 5 - 10 puntos de afinidad con esa facción y sufre una penalización de reputación.
- Los plazos son innegociables; el reloj de arena es una realidad mecánica, no narrativa.
  

--------------------------------------------------------------------------------

## ARQUITECTURA NARRATIVA
Esta sección contiene las reglas para generar, mantener y resolver historias de forma coherente e infinita. No son comandos (están en Módulo 1) ni datos (están en Módulo 4), Son las mecánicas narrativas del sistema.
8.1 LA RAÍZ DEL PERSONAJE (Cicatriz + Juramento + Linaje)
Todo personaje nace de una combinación de tres elementos fundamentales. Esta raíz determina su arquetipo y dirección narrativa.

  raiz_personaje: 
    cicatriz: 
      tipos: abandono, duelo, traición, fracaso, abuso, negligencia, rechazo, herencia, fragmentacion, asfixia, secreto,
      descripciones: 
        abandono: Alguien que debía protegerte desapareció. Buscas respuestas o cierre.,
        duelo: Alguien murió violentamente. Buscas justicia o venganza.,
        traición: Alguien en quien confiabas te vendió. Buscas reparación o venganza.,
        fracaso: Cometiste un error con consecuencias graves. Buscas redención.,
        abuso: Tu integridad fue vulnerada por el poder de otro. Buscas control o restitución.,
        negligencia: Tus necesidades básicas fueron ignoradas sistemáticamente. Buscas validación o autosuficiencia.,
        rechazo: Fuiste expulsado de un círculo al que pertenecías. Buscas pertenencia o demostrar tu valor.,
        herencia: Cargas con los pecados o deudas de tus antepasados. Buscas romper el ciclo o limpiar tu nombre.,
        fragmentacion: Un evento quebró tu identidad en pedazos. Buscas coherencia o unidad.,
        asfixia: Fuiste oprimido por un entorno o vínculo asfixiante. Buscas libertad o espacio.,
        secreto: Descubriste una verdad que no debías. Buscas protección o poder.
      ,
      peso_inicial: 60-80,
      efecto_mecanico: Penalización inicial en atributo relacionado
    ,
    
    juramento: 
      tipos: venganza, búsqueda, protección, redención, verdad, lealtad, legado, expiación, justicia, silencio,
      descripciones: 
        venganza: Haré pagar a quienes me hicieron daño.,
        búsqueda: Encontraré a la persona que perdí.,
        protección: Protegeré a los que no pueden protegerse solos.,
        redención: Enmendaré mis errores pasados.,
        verdad: Descubriré lo que realmente pasó.,
        lealtad: Serviré a mi causa o señor por encima de mi propia vida.,
        legado: Aseguraré que mi nombre o el de mi clan nunca sea olvidado.,
        expiación: Cargaré con el castigo que otros merecen para limpiar mi alma.,
        justicia: Impondré el equilibrio donde el caos y la maldad reinan.,
        silencio: Llevaré este conocimiento a la tumba, sin importar el costo.
      ,
      peso_inicial: 70-90,
      efecto_mecanico: Bonificación cuando actúas en línea con el juramento
    ,
    
    linaje: 
      tipos: noble, secta, plabello, desconocido, culto,
      descripciones: 
        noble: Naciste en una familia con historia. Llevas el peso de tu apellido.,
        secta: Fuiste criado por una secta. Las reglas del Wulin son tu sangre.,
        campesino: Naciste en la pobreza. Sobrevivir te enseñó más que cualquier maestro.,
        plebello: No sabes quiénes son tus padres. Tu origen es un misterio.,
        culto: Te criaron en un culto demoníaco. Escapaste, pero ellos no te olvidan.
      ,
      ventajas_iniciales: 
        noble: +10 reputación inicial, +1 técnica familiar,
        secta: +10 en una habilidad marcial, acceso a red de la secta,
        campesino: +5 VOL, +5 AST, conocimiento del mundo real,
        desconocido: Eventos de linaje pueden revelar secretos poderosos,
        culto: +10 ALM, +1 técnica prohibida, -20 reputación ortodoxa
      
    
  

### LOS 5 ARQUETIPOS NARRATIVOS - MOTIVACIÓN DEL PERSONAJE
Basado en la combinación de cicatriz + juramento, el personaje cae en uno de estos arquetipos. Cada uno tiene una dirección natural y una tensión dramática que guiará la generación de tramas.
Leer los datos: Al iniciar arco, tomar arquetipo_narrativo + cicatriz.tipo y juramento.tipo del Estado Dinámico.
Combinar en una frase: arquetipo_narrativo que sufre cicatriz que busca juramento → ej: pérdida que busca protección.
Usar como brújula: Ante cualquier decisión crítica, preguntar: ¿Esta acción honra o contradice su motivación? y guiar la narrativa en consecuencia.

  motivacion: arquetipo_narrativo que sufre cicatriz que busca juramento,
  arquetipos_narrativos: 
    vengador: 
      condicion: Cicatriz = pérdida o traición + Juramento = venganza,
      direccion_natural: Identificar enemigos → Acumular poder → Enfrentar → Vacío existencial → Nuevo propósito,
      tension_dramatica: ¿La venganza traerá paz o solo más violencia?,
      pregunta_tematica: ¿Hasta dónde llegarías para vengar a los que amas?,
      posibles_giros: 
        El último responsable es alguien a quien no puedes matar (familia, mentor),
        Descubres que tu familia no era tan inocente,
        La venganza consumada te deja vacío,
        Tu enemigo se arrepiente y busca redención
      
    ,
    
    buscador: 
      condicion: Cicatriz = abandono + Juramento = búsqueda o verdad,
      direccion_natural: Búsqueda → Pistas → Encuentro → Verdad → Aceptación o Rechazo,
      tension_dramatica: ¿Qué harás cuando encuentres la verdad?,
      pregunta_tematica: ¿Y si la verdad que buscas destruye lo que eres?,
      posibles_giros: 
        La persona que buscas no quiere ser encontrada,
        La persona que buscas ya murió,
        Descubres que tú eras quien debía ser encontrado,
        La verdad es peor que la mentira
      
    ,
    
    restaurador: 
      condicion: Cicatriz = pérdida de estatus o fracaso + Juramento = redención o verdad,
      direccion_natural: Recuperar lo perdido → Consolidar poder → Definir legado,
      tension_dramatica: ¿Hasta dónde llegarás para restaurar lo que fue?,
      pregunta_tematica: ¿Se puede restaurar el pasado o solo construir algo nuevo?,
      posibles_giros: 
        Restaurar el pasado impide construir el futuro,
        Quienes ayudan tienen sus propias agendas,
        El honor que buscas ya no existe,
        Lo que construyes supera lo que perdiste
      
    ,
    
    protector: 
      condicion: Cicatriz = fracaso (no poder proteger) + Juramento = protección,
      direccion_natural: Identificar amenaza → Proteger → Amenazas crecientes → Sacrificio,
      tension_dramatica: ¿A quién protegerás cuando no puedas proteger a todos?,
      pregunta_tematica: ¿Merece la pena sacrificarlo todo por unos pocos?,
      posibles_giros: 
        El protegido se vuelve más fuerte que tú,
        El protegido no quiere ser protegido,
        Proteger a uno significa abandonar a otros,
        Tu protección se convierte en control
      
    ,
    
    redentor: 
      condicion: Cicatriz = fracaso (culpa) + Juramento = redención,
      direccion_natural: Buscar redención → Enfrentar el pasado → Perdonarse o no,
      tension_dramatica: ¿Mereces ser perdonado?,
      pregunta_tematica: ¿El perdón debe venir de otros o de ti mismo?,
      posibles_giros: 
        Aquellos a quienes dañaste no te perdonan,
        Descubres que la culpa no era tuya,
        La redención requiere un sacrificio mayor que el pecado original,
        El perdón llega cuando dejas de buscarlo
      
    
  


### EL ÁRBOL NARRATIVO: TRAMA PRINCIPAL + SUBTRAMAS
La historia se estructura como un árbol con una raíz, un tronco y múltiples ramas. Esta metáfora guía la generación y mantenimiento de tramas.

  arbol_narrativo: 
    raiz: 
      definicion: La premisa fundacional del personaje (cicatriz + juramento + linaje),
      permanencia: Nunca cambia. Es la identidad profunda.,
      funcion: Genera la tensión dramática básica de toda la historia
    ,
    
    tronco: 
      definicion: La trama principal. El conflicto central que da dirección a la vida del personaje.,
      duracion: Puede durar años (reales) o décadas (del juego). Puede cerrarse.,
      al_cerrarse: Cuando se cierra, el personaje ha cumplido su misión de vida. Pero la historia NO termina: una nueva trama principal surge (herencia, nuevo propósito).,
      ejemplo: Restaurar el honor del clan Li → CERRADA → Ahora: Establecer una dinastía duradera
    ,
    
    ramas: 
      definicion: Subtramas que surgen de la trama principal o de las acciones del jugador,
      cantidad_activa: 3-5 simultáneas (máximo recomendado),
      duracion: Variable (días a años),
      origenes_posibles: 
        De la trama principal (obstáculos, aliados, enemigos),
        De la raíz (cicatrices que brotan, juramentos que exigen atención),
        Del mundo (eventos de facciones, desastres, oportunidades),
        De relaciones (NPCs con problemas, amores, rivalidades)
      
    ,
    
    hojas: 
      definicion: Eventos cotidianos, encuentros menores, decisiones sin gran impacto,
      funcion: Dar vida al mundo, crear atmósfera, ofrecer descanso narrativo
    ,
    
    frutos: 
      definicion: Resoluciones de tramas. Cada resolución genera semillas.,
      funcion: Cerrar ciclos y abrir nuevos
    ,
    
    semillas: 
      definicion: Nuevas tramas potenciales que brotan de resoluciones,
      estado_inicial: Brotando (latente),
      activacion: Cuando el jugador se acerca o se cumplen condiciones
    
  

### CICLO DE VIDA DE UNA TRAMA
Toda trama (principal o subtrama) sigue este ciclo. Es la regla fundamental de generación narrativa.

ciclo_vida_trama: 
 fase_1_germinacion: 
      nombre: Brotando,
      descripcion: La trama existe como posibilidad, rumor o amenaza latente.,
      visibilidad: Opcional para el jugador (rumores, pistas, menciones),
      duracion: Indefinida hasta que el jugador se acerque,
      activacion: El jugador investiga, visita el lugar o se cumplen condiciones,
      ejemplo: Rumores de una cueva sellada en las montañas. Nadie ha vuelto.
 fase_2_activacion: 
  nombre: Activa,
  descripcion: El jugador se involucra. La trama tiene objetivos claros y progreso medible.,
  objetivos: 2-4 hitos concretos,
  progreso: 0-100%,
  posibles_resoluciones: 2-4 finales posibles (conocidos por el GM, no por el jugador),
  ejemplo: Objetivos: 
   1) Encontrar entrada
   2) Superar trampas
   3) Enfrentar guardián
   4) Decidir qué hacer con tesoro

 fase_3_resolucion: 
      nombre: Resolución,
      descripcion: El jugador toma una decisión que determina el final de la trama.,
      tipos_resolucion: 
        moral: Decisión basada en ética (matar/perdonar, salvar/sacrificar),
        estrategico: Decisión basada en poder/recursos (quedarse/entregar, alianza/enemistad),
        emocional: Decisión basada en vínculos (salvar NPC/cumplir misión)
      consecuencias: Cada resolución tiene consecuencias sistémicas y narrativas
 fase_4_cierre: 
  nombre: Cierre y Semillas,
  descripcion: La trama se archiva. Genera semillas para nuevas tramas.,
  regla_fundamental: Toda resolución genera al menos 1 semilla de nueva trama,
  ejemplo: 
   - Perdonas al guardián → Él te debe un favor (semilla: aparecerá en crisis futura) → Su clan se entera (semilla: posible alianza) → Revela que el tesoro no era el real (semilla: nueva búsqueda)

### REGLAS DE GENERACIÓN DE SUBTRAMAS
Las subtramas no surgen al azar. Siguen probabilidades basadas en el contexto.

  generacion_subtramas: 
    Cada 5 turnos o al finalizar una trama
    numero_a_generar: 1 nuevas semillas brotando,
    
    probabilidades_por_origen: 
      de_la_trama_principal: 
        probabilidad: 30,
        descripcion: La trama principal genera un obstáculo, aliado o enemigo,
        ejemplo: Buscas a tu padre → Te encuentras con alguien que lo conoció → Te ofrece ayuda a cambio de un favor

      de_cicatriz_o_juramento: 
        probabilidad: 25,
        descripcion: Una cicatriz duele, un juramento exige atención,
        ejemplo: Cicatriz de abandono → Sueñas con tu padre → Pistas de su paradero

      del_mundo: 
        probabilidad: 20,
        descripcion: Eventos de facciones, desastres, oportunidades globales,
        ejemplo: Guerra del Norte → Reclutamiento forzoso → Debes decidir si ir o desertar

      de_relaciones: 
        probabilidad: 15,
        descripcion: NPCs con problemas, amores, rivalidades,
        ejemplo: Tu amigo NPC tiene una deuda → Te pide ayuda → Te involucras con usureros

      de_consecuencias: 
        probabilidad: 10,
        descripcion: Acciones pasadas que vuelven,
        ejemplo: Perdonaste a un enemigo → Ahora su hijo te busca para agradecer... o vengar

    regla_de_coherencia: La subtrama debe conectar con ALGO existente: personaje, lugar, evento pasado, facción conocida. No surgen de la nada.
  

### CONEXIONES ENTRE TRAMAS
Las tramas no existen en vacío. Se conectan entre sí, creando una red narrativa.

  conexiones_tramas: 
    tipos_conexion: 
      causal: Una trama es consecuencia directa de otra,
      tematica: Comparten tema (venganza, redención, poder),
      personajes: Comparten NPCs importantes,
      lugares: Ocurren en la misma región,
      temporal: Ocurren simultáneamente

    efectos_de_conexion: 
      sinergia: Resolver una trama facilita la otra (+10% progreso),
      conflicto: Las tramas tienen objetivos opuestos (dilema),
      revelacion: Resolver una revela información clave para la otra

    
    regla_de_uso: Cuando dos tramas están conectadas, menciónalo al jugador con TRAMA conectar id1 con id2
  

### HERENCIA NARRATIVA (Muerte y Sucesión)
Si el personaje muere, la historia puede continuar con un heredero. Esta sección define las reglas.

  herencia_narrativa: 
    condiciones_para_heredar: 
      heredero_directo: Hijo o hija (biológico o adoptado)
      discipulo_principal: El alumno más avanzado
      hermano_de_sangre: Juramento de hermandad
    que_se_hereda: 
      siempre: 
        El mundo (mismo calendario, facciones, eventos),
        Enemigos y aliados principales,
        Deudas y promesas pendientes,
        Parte del inventario (lo que el heredero pueda tomar)
      a_decision_del_jugador: 
        Objetos específicos,
        Técnicas enseñadas (si hubo tiempo),
        Misiones activas (el heredero puede asumirlas o no)
    que_NO_se_hereda: 
      nunca: 
        Nivel de cultivo (comienza desde bajo, pero con ventajas),
        Cicatrices del personaje anterior (pero puede tener las suyas),
        Relaciones personales íntimas (esposas, amantes)
    nueva_raiz_del_heredero: 
      cicatriz: Relacionada con la muerte del anterior (pérdida, abandono, culpa),
      juramento: Puede heredar el juramento del anterior o tener uno nuevo,
      linaje: Mismo linaje (con ventajas),
      arquetipo: Determinado por su nueva combinación
    comando_asociado: CONTINUAR heredero
  

### TABLAS DE CONSULTA RÁPIDA (Actualizada)

  tablas_rapidas: 
    tiempos_propagacion: 
      local: 1-3 dias
      regional: 3-10 dias
      provincial: 10-20 dias
      imperial: 20-60 dias 
      mundial: 60-180 dias
    diferencia_Reinos: 
      iguales: pelea, 
      1_arriba: difícil, 
      2_arriba: huir,
      3_arriba: morir, 
      4_arriba: ni te ven
    arquetipos_resumen: 
      vengador: pérdida/traición + venganza,
      buscador: abandono + búsqueda/verdad,
      restaurador: fracaso/pérdida estatus + redención/verdad,
      protector: fracaso + protección,
      redentor: fracaso + redención

    
    
  

### LÍMITES DEL MUNDO (Actualizado)

  limites_recordatorio: 
    informacion: 
      NADIE se entera de lo que NADIE vio,
      La información viaja a velocidad de caballo, no de internet,
      Los eventos en cuevas solitarias son SECRETOS
    poder: 
      Un NO cultivador no vence a un núcleo dorado (x32 diferencia),
      Un refinación NO sobrevive a un ataque directo de un alma naciente,
      Las técnicas 3 Reinos arriba no se pueden aprender sin maestro
    tiempo: 
      No haces dos cosas largas a la vez,
      Curar heridas graves lleva SEMANAS,
      Viajar de un extremo a otro del imperio lleva MESES
    social: 
      No te haces amigo de un patriarca en un diálogo,
      No lideras un clan con 20 años,
      La poligamia tiene límites sociales y económicos
    economico: 
      Los precios varían por disponibilidad real,
      No puedes comprar algo que no existe en la región,
      Los monopolios atraen envidias y ataques
    narrativo: 
      Las tramas no surgen de la nada. Tienen origen (raíz, mundo, consecuencias),
      Las resoluciones SIEMPRE generan nuevas semillas,
      La muerte del personaje NO es el fin si hay heredero,
      La historia nunca termina, solo se transforma
    
  
### Tabla de Ganancia Mínima de EXP por Actividad
Para evitar la subestimación de EXP en períodos largos, se establecen mínimos obligatorios:

  exp_minima_por_actividad: 
    meditacion_basica: 5 EXP/hora · 40 EXP/día,
    entrenamiento_fisico: 10 EXP/hora · 80 EXP/día,
    estudio_manual: 15 EXP/hora · 120 EXP/día (agotador),
    gestion_diplomatica: 8 EXP/hora · 64 EXP/día,
    viaje_normal: 2 EXP/hora · 16 EXP/día (estado ALERTA),
    viaje_con_entrenamiento: 5 EXP/hora · 40 EXP/día (si se combina),
    simulacion_periodo_largo: 50 EXP/día BASE + eventos,
    construccion/expansion: 100 EXP/semana + bonos por hitos,
    reclutamiento/entrenamiento_ejercito: 150 EXP/semana
  ,
  
  regla_simulacion: Cuando se simulen períodos > 10 días, el GM DEBE calcular EXP como: (días × tasa_base) + (eventos_especiales × bono). NO puede omitir este cálculo.

#### 11.2 Matriz de Validación de Progreso

  checkpoint_obligatorio_cierre_del_arco: 
    frecuencia: Al finalizar cada arco o despues del turno 20,
    accion: El GM DEBE detener la narrativa y ejecutar protocolo:,
    Regla infranqueable: NO HAY TURNO 21, ESTE TURNO ES PARA PRESENTAR ESTE RESUMEN DE VALIDACION,
    Protocolo:
      Validar: Recalcular EXP total, atributos y recursos contra el historial del arco,
      Consolidar: Escribir el estado finaL,
      Archivar: Mover la narrativa completa del arco aL REGISTRO,
      Limpiar: Descartar toda la ventana de contexto,
      Iniciar: Generar el primer turno del nuevo arco,
      No se permite iniciar un nuevo arco sin completar estos 5 pasos,
      El comando DAO VERIFICA puede usarse para forzar el checkpoint en cualquier momento, pero no reemplaza la ejecución obligatoria en turno 20.
      ,
    formato_resumen: 
      nivel_absoluto: actual (debería ser calculado según EXP total),
      puntos_libres_ATR: actual (deberían ser nivel × 5 - asignados),
      puntos_libres_HAB: actual (deberían ser nivel × 3 - asignados),
      EXP_total_acumulada: actual (debería coincidir con suma de turnos),
      estado: ✅ CONSISTENTE | ⚠️ DISCREPANCIA | ❌ ERROR
    ,
    accion_si_discrepancia: Ejecutar Protocolo de Corrección (sección 11.3)
  

###  Protocolo de Corrección de Errores

  protocolo_correccion: 
    nombre: CORRIGE,
    activacion: Automática al detectar error, o manual por jugador con DAO CORRIGE,
    
    pasos: 
      paso_1: IDENTIFICAR,
        accion: El GM señala EXACTAMENTE qué valor es incorrecto y por qué.
      paso_2: CALCULAR,
        accion: El GM recalcula usando las tablas del Módulo 2 y el historial del Módulo 5.
      paso_3: PRESENTAR,
        accion: El GM muestra: VALOR ACTUAL → VALOR CORREGIDO → JUSTIFICACIÓN
      paso_4: AUTORIZAR,
        accion: El jugador debe aceptar la corrección con DAO ACEPTA o DAO RECHAZA (con argumento).
    
### Niveles absolutos de reino y experiencia

|Nivel	|Nombre	        |Exp inicial	|Exp necesaria|
|1|	  Refinamiento de Qi - Paso 1|	1,000	|1,520|
|2|	  Refinamiento de Qi - Paso 2|	1,520|	2,300|
|3|	  Refinamiento de Qi - Paso 3|	2,300	|3,470|
|4|	  Refinamiento de Qi - Paso 4|	3,470|	5,225|
|5|   Refinamiento de Qi - Paso 5|	5,225|	7,858|
|6|	  Refinamiento de Qi - Paso 6|	7,858|	11,806|
|7|	  Establecimiento de Fundación - Paso 1|	11,806|	17,729|
|8|	  Establecimiento de Fundación - Paso 2|	17,729|	26,614|
|9|	  Establecimiento de Fundación - Paso 3|	26,614|	39,941|
|10|	Establecimiento de Fundación - Paso 4|	39,941|	59,932|
|11|	Establecimiento de Fundación - Paso 5|	59,932|	89,917|
|12|	Establecimiento de Fundación - Paso 6|	89,917|	134,896|
|13|	Núcleo Dorado - Paso 1|	134,896|	202,364|
|14|	Núcleo Dorado - Paso 2|202,364|	303,566|
|15|	Núcleo Dorado - Paso 3|	303,566|	455,370|
|16|	Núcleo Dorado - Paso 4|	455,370|	683,074|
|17|	Núcleo Dorado - Paso 5|	683,074|	1,024,632|
|18|	Núcleo Dorado - Paso 6|	1,024,632|	1,536,968|
|19|	Alma Naciente - Paso 1|	1,536,968|	2,305,471|
|20|	Alma Naciente - Paso 2|	2,305,471|	3,458,227|
|21|	Alma Naciente - Paso 3|	3,458,227|	5,187,360|
|22|	Alma Naciente - Paso 4|	5,187,360|	7,781,061|
|23|	Alma Naciente - Paso 5|	7,781,061|	11,671,611|
|24|	Alma Naciente - Paso 6|	11,671,611|	17,507,437|
|25|	Formación del Espíritu - Paso 1|	17,507,437|	26,261,175|
|26|	Formación del Espíritu - Paso 2|	26,261,175|	39,391,783|
|27|	Formación del Espíritu - Paso 3|	39,391,783|	59,087,694|
|28|	Formación del Espíritu - Paso 4|	59,087,694|	88,631,561|
|29|	Formación del Espíritu - Paso 5|	88,631,561|	132,947,361|
|30|	Formación del Espíritu - Paso 6|	132,947,361|	199,421,062|
|31|	Vacío de Fusión Corporal - Paso 1|	199,421,062|	299,131,612|
|32|	Vacío de Fusión Corporal - Paso 2|	299,131,612|	448,697,439|
|33|	Vacío de Fusión Corporal - Paso 3|	448,697,439|	673,046,178|
|34|	Vacío de Fusión Corporal - Paso 4|	673,046,178|	1,009,569,287|
|35|	Vacío de Fusión Corporal - Paso 5|	1,009,569,287|	1,514,353,950|
|36|	Vacío de Fusión Corporal - Paso 6|	1,514,353,950|	2,271,530,945|
|37|	Tribulación de Trascendencia - Paso 1|	2,271,530,945|	3,407,296,438|
|38|	Tribulación de Trascendencia - Paso 2|	3,407,296,438|	5,110,944,677|
|39|	Tribulación de Trascendencia - Paso 3|	5,110,944,677|	7,666,417,036|
|40|	Tribulación de Trascendencia - Paso 4|	7,666,417,036|	11,499,625,574|
|41|	Tribulación de Trascendencia - Paso 4|	11,499,625,574|	17,249,438,381|
|42|	Tribulación de Trascendencia - Paso 6|	17,249,438,381|	25,874,157,591|
|43|	Iluminación - Paso 1|	25,874,157,591|	38,811,236,406|
|44|	Iluminación - Paso 2|	38,811,236,406|	58,216,854,630|
|45|	Iluminación - Paso 3|	58,216,854,630|	87,325,281,965|
|46|	Iluminación - Paso 4|	87,325,281,965	|130,987,922,967|
|47|	Iluminación - Paso 5| 130,987,922,967	|196,481,884,470|
|48|	Iluminación - Paso 6|	196,481,884,470|	294,722,826,726|
  

### REGLA DE ORO: Prohibición de Asignación Sin Verificación
El GM NO PUEDE aceptar una orden de asignación de puntos de atributo o habilidad a menos que:
El personaje haya subido de nivel desde la última asignación,
Sea el inicio de un nuevo arco con puntos de bonificación explícitos,
El jugador haya usado DAO CORRIGE para reclamar puntos no asignados previamente.

Adición: Antes de asignar puntos, el GM DEBE verificar los datos. Esta validación evita la acumulación de datos obsoletos que causan desincronización entre arcos.
