import { Link } from 'react-router-dom';
import { 
  Swords, Shield, Sparkles, Scroll, Play, ChevronRight, 
  Skull, Crown, Store, BookOpen, Compass, MapPin
} from 'lucide-react';

export const LandingPage = () => {
  return (
    <div className="min-h-screen bg-[#05070c] text-stone-200 font-sans overflow-x-hidden flex flex-col">
      
      {/* --- BARRA DE NAVEGACIÓN SUPERIOR --- */}
      <nav className="fixed top-0 w-full z-50 bg-[#05070c]/90 backdrop-blur-md border-b border-stone-800/80">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded bg-gradient-to-br from-amber-600 to-amber-900 flex items-center justify-center text-stone-950 font-cinzel font-bold text-lg shadow-[0_0_10px_rgba(245,158,11,0.3)]">
                道
              </div>
              <span className="font-cinzel text-xl font-bold text-amber-100 tracking-wider hidden sm:block group-hover:text-amber-400 transition-colors">
                MURIM
              </span>
            </Link>
            
            {/* Enlaces corregidos */}
            <div className="hidden md:flex items-center gap-6 text-xs uppercase tracking-widest font-semibold text-stone-400">
              <a href="#mundo" className="hover:text-amber-400 transition-colors">El Mundo</a>
              <a href="#facciones" className="hover:text-amber-400 transition-colors">Facciones</a>
              <a href="#sistema" className="hover:text-amber-400 transition-colors">Sistema</a>
              <a href="#noticias" className="hover:text-amber-400 transition-colors">Noticias</a>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/auth" className="text-xs font-bold text-stone-300 hover:text-white px-3 py-2 transition-colors">
              Iniciar Sesión
            </Link>
            <Link 
              to="/auth" 
              className="px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-stone-950 font-cinzel font-bold text-xs rounded shadow-[0_0_15px_rgba(245,158,11,0.3)] transition-all"
            >
              Jugar Gratis
            </Link>
          </div>
        </div>
      </nav>

      {/* --- HERO SECTION --- */}
      <section className="relative h-screen flex items-center justify-start pl-8 md:pl-24 pt-16">
        <div className="absolute inset-0 z-0">
          <img 
            src="/assets/images/hero_bg.jpg" 
            alt="Jianghu Landscape" 
            className="w-full h-full object-cover brightness-75"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#05070c] via-[#05070c]/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#05070c] via-transparent to-transparent" />
        </div>

        <div className="relative z-10 max-w-2xl">
          <h1 className="font-cinzel text-5xl md:text-7xl font-bold text-amber-100 mb-4 drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
            DESAFÍA A LOS CIELOS
          </h1>
          <p className="text-lg md:text-xl text-stone-300 mb-8 drop-shadow-md">
            Un RPG de cultivo Xianxia donde el mundo no se detiene. Forja tu linaje, domina los elementos y asciende a la inmortalidad en un Jianghu persistente.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link 
              to="/auth" 
              className="px-8 py-3 bg-amber-600 hover:bg-amber-500 text-stone-950 font-cinzel font-bold text-lg rounded-lg flex items-center justify-center gap-2 transition-transform hover:scale-105 shadow-[0_0_20px_rgba(245,158,11,0.4)]"
            >
              <Play className="w-5 h-5 fill-current" /> Comenzar Sendero
            </Link>
          </div>
        </div>
      </section>

      {/* --- SECCIÓN: EL MUNDO (Añadida y Funcional) --- */}
      <section id="mundo" className="py-24 bg-[#080b12] relative border-t border-stone-900 scroll-mt-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="lg:w-1/2">
              <h2 className="font-cinzel text-4xl text-amber-100 mb-6">El Mundo del Jianghu</h2>
              <p className="text-stone-400 mb-6 leading-relaxed">
                Hace 3,000 años, los dioses sellaron el Dao del Caos y condenaron a la humanidad a un techo eterno: el Reino Inmortal. Ahora, en el año 487 de la Era de la Sangre y el Loto, el Sello se agrieta.
              </p>
              <p className="text-stone-400 mb-8 leading-relaxed">
                Explora un mundo persistente dividido en 25 provincias. Desde las heladas tierras de Heilongjiang hasta los desiertos mortales de Xinjiang, cada región tiene su propio Qi, economía y facciones en guerra.
              </p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-3 text-sm text-stone-300">
                  <MapPin className="w-4 h-4 text-amber-500" /> 25+ Provincias explorables con clima y biomas únicos.
                </li>
                <li className="flex items-center gap-3 text-sm text-stone-300">
                  <BookOpen className="w-4 h-4 text-amber-500" /> Eventos autónomos que ocurren incluso cuando estás desconectado.
                </li>
                <li className="flex items-center gap-3 text-sm text-stone-300">
                  <Compass className="w-4 h-4 text-amber-500" /> Economía dinámica basada en oferta y demanda regional.
                </li>
              </ul>
            </div>
            <div className="lg:w-1/2 relative">
              <div className="absolute inset-0 bg-amber-500/10 blur-3xl rounded-full" />
              <img 
                src="/assets/images/murim_world_map_1792521242321.jpg" 
                alt="Mapa del Mundo" 
                className="relative z-10 rounded-xl border border-stone-700 shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* --- SECCIÓN DE CARACTERÍSTICAS (PILARES) --- */}
      <section id="sistema" className="py-24 bg-[#05070c] relative scroll-mt-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="font-cinzel text-3xl text-amber-100 mb-2">El Motor Wulin</h2>
            <p className="text-stone-400 text-sm max-w-2xl mx-auto">
              Una simulación autoritativa en el servidor. La economía fluctúa, las facciones conspiran y el tiempo avanza independientemente de ti.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-stone-900/40 border border-stone-800 p-8 rounded-xl hover:border-amber-500/50 transition-colors group">
              <Sparkles className="w-10 h-10 text-cyan-400 mb-6 group-hover:scale-110 transition-transform" />
              <h3 className="font-cinzel text-xl font-bold text-stone-100 mb-3">Cultivo Profundo</h3>
              <p className="text-sm text-stone-400 leading-relaxed">Medita, abre tus 8 meridianos y rompe los cuellos de botella celestiales para ascender entre los 9 reinos mortales.</p>
            </div>
            <div className="bg-stone-900/40 border border-stone-800 p-8 rounded-xl hover:border-amber-500/50 transition-colors group">
              <Swords className="w-10 h-10 text-rose-500 mb-6 group-hover:scale-110 transition-transform" />
              <h3 className="font-cinzel text-xl font-bold text-stone-100 mb-3">Combate Táctico</h3>
              <p className="text-sm text-stone-400 leading-relaxed">Enfréntate a bestias y cultivadores. Tus atributos definen el daño, pero tu habilidad decidirá la victoria.</p>
            </div>
            <div className="bg-stone-900/40 border border-stone-800 p-8 rounded-xl hover:border-amber-500/50 transition-colors group">
              <Shield className="w-10 h-10 text-emerald-400 mb-6 group-hover:scale-110 transition-transform" />
              <h3 className="font-cinzel text-xl font-bold text-stone-100 mb-3">Facciones Vivas</h3>
              <p className="text-sm text-stone-400 leading-relaxed">Únete a sectas ortodoxas o cultos demoníacos. Tu reputación afectará cómo te trata el mundo.</p>
            </div>
          </div>
        </div>
      </section>

      {/* --- SECCIÓN DE ORÍGENES / FACCIONES --- */}
      <section id="facciones" className="py-24 bg-[#080b12] relative border-t border-stone-900 scroll-mt-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-end justify-between mb-12 border-b border-stone-800 pb-4">
            <div>
              <h2 className="font-cinzel text-3xl text-amber-100 mb-2">Elige tu Origen</h2>
              <p className="text-stone-400 text-sm">Tu punto de partida define tus aliados, tu equipo y las técnicas que podrás aprender.</p>
            </div>
            <Link to="/auth" className="text-amber-500 hover:text-amber-400 text-sm font-bold flex items-center gap-1 mt-4 md:mt-0">
              Explorar todos los caminos <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-stone-900/60 border border-stone-800 rounded-lg p-6 flex flex-col items-center text-center hover:bg-stone-800/80 transition-colors cursor-pointer group">
              <Shield className="w-8 h-8 text-amber-400 mb-3 group-hover:scale-110 transition-transform" />
              <h4 className="font-bold text-stone-200 text-sm mb-1">Discípulo</h4>
              <span className="text-[10px] text-stone-500 uppercase tracking-widest">Sectas Ortodoxas</span>
            </div>
            <div className="bg-stone-900/60 border border-stone-800 rounded-lg p-6 flex flex-col items-center text-center hover:bg-stone-800/80 transition-colors cursor-pointer group">
              <Swords className="w-8 h-8 text-stone-300 mb-3 group-hover:scale-110 transition-transform" />
              <h4 className="font-bold text-stone-200 text-sm mb-1">Errante</h4>
              <span className="text-[10px] text-stone-500 uppercase tracking-widest">Sin Facción</span>
            </div>
            <div className="bg-stone-900/60 border border-stone-800 rounded-lg p-6 flex flex-col items-center text-center hover:bg-stone-800/80 transition-colors cursor-pointer group">
              <Crown className="w-8 h-8 text-amber-300 mb-3 group-hover:scale-110 transition-transform" />
              <h4 className="font-bold text-stone-200 text-sm mb-1">Noble</h4>
              <span className="text-[10px] text-stone-500 uppercase tracking-widest">Clanes Imperiales</span>
            </div>
            <div className="bg-stone-900/60 border border-stone-800 rounded-lg p-6 flex flex-col items-center text-center hover:bg-stone-800/80 transition-colors cursor-pointer group">
              <Skull className="w-8 h-8 text-rose-500 mb-3 group-hover:scale-110 transition-transform" />
              <h4 className="font-bold text-stone-200 text-sm mb-1">Demoníaco</h4>
              <span className="text-[10px] text-stone-500 uppercase tracking-widest">Cultos Prohibidos</span>
            </div>
            <div className="bg-stone-900/60 border border-stone-800 rounded-lg p-6 flex flex-col items-center text-center hover:bg-stone-800/80 transition-colors cursor-pointer group col-span-2 md:col-span-1">
              <Store className="w-8 h-8 text-emerald-400 mb-3 group-hover:scale-110 transition-transform" />
              <h4 className="font-bold text-stone-200 text-sm mb-1">Plebeyo</h4>
              <span className="text-[10px] text-stone-500 uppercase tracking-widest">Gremios y Ciudades</span>
            </div>
          </div>
        </div>
      </section>

      {/* --- SECCIÓN DE NOTICIAS / TICKER --- */}
      <section id="noticias" className="py-24 bg-[#05070c] border-t border-stone-900 scroll-mt-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-3 mb-10">
            <Scroll className="w-6 h-6 text-amber-500" />
            <h2 className="font-cinzel text-2xl text-stone-100">Crónicas del Jianghu</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-stone-900/40 border border-stone-800 rounded-lg p-6 hover:border-amber-500/50 transition-colors cursor-pointer group">
              <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider mb-3 block">Mundo</span>
              <h3 className="font-cinzel font-bold text-stone-200 mb-2 group-hover:text-amber-300 transition-colors">El Sello del Caos se agrieta</h3>
              <p className="text-xs text-stone-400 leading-relaxed line-clamp-3">Los eruditos de la Corte Imperial han detectado fluctuaciones de Qi en las montañas Kunlun. Se rumorea que los Ecos Primordiales están despertando...</p>
            </div>
            <div className="bg-stone-900/40 border border-stone-800 rounded-lg p-6 hover:border-amber-500/50 transition-colors cursor-pointer group">
              <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wider mb-3 block">Conflicto</span>
              <h3 className="font-cinzel font-bold text-stone-200 mb-2 group-hover:text-amber-300 transition-colors">Escaramuzas en la Ruta de la Seda</h3>
              <p className="text-xs text-stone-400 leading-relaxed line-clamp-3">El Clan del Dragón Carmesí ha bloqueado el paso comercial de Hebei, exigiendo un tributo de Piedras Espirituales a los mercaderes...</p>
            </div>
            <div className="bg-stone-900/40 border border-stone-800 rounded-lg p-6 hover:border-amber-500/50 transition-colors cursor-pointer group">
              <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider mb-3 block">Economía</span>
              <h3 className="font-cinzel font-bold text-stone-200 mb-2 group-hover:text-amber-300 transition-colors">Jade de Khotan sube un 15%</h3>
              <p className="text-xs text-stone-400 leading-relaxed line-clamp-3">Debido a la escasez en las minas de Xinjiang, el precio del Jade de Khotan ha alcanzado su máximo histórico en el mercado regional...</p>
            </div>
            <div className="bg-stone-900/40 border border-stone-800 rounded-lg p-6 hover:border-amber-500/50 transition-colors cursor-pointer group">
              <span className="text-[10px] font-bold text-cyan-500 uppercase tracking-wider mb-3 block">Descubrimiento</span>
              <h3 className="font-cinzel font-bold text-stone-200 mb-2 group-hover:text-amber-300 transition-colors">Ruinas de la Roca Flotante</h3>
              <p className="text-xs text-stone-400 leading-relaxed line-clamp-3">Exploradores han encontrado una entrada oculta en Xizang. Se cree que contiene un manual de técnicas de la era de la Sangre y el Loto...</p>
            </div>
          </div>
        </div>
      </section>

      {/* --- FOOTER MEJORADO --- */}
      <footer className="bg-stone-950 border-t border-stone-800 py-12 mt-auto">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded bg-gradient-to-br from-amber-700 to-amber-950 flex items-center justify-center text-amber-100 font-cinzel font-bold text-xl shadow-lg">
                道
              </div>
              <div>
                <span className="font-cinzel text-lg font-bold text-stone-200 block">Murim: Sendas Inmortales</span>
                <span className="text-xs text-stone-500">Forja tu destino en el Jianghu</span>
              </div>
            </div>
            
            <div className="flex gap-8 text-sm text-stone-400">
              <a href="#" className="hover:text-amber-400 transition-colors">Términos de Servicio</a>
              <a href="#" className="hover:text-amber-400 transition-colors">Privacidad</a>
              <a href="#" className="hover:text-amber-400 transition-colors">Soporte</a>
              <a href="#" className="hover:text-amber-400 transition-colors">Contacto</a>
            </div>
          </div>

          <div className="border-t border-stone-800/50 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-stone-600">
            <span>© 2026 Murim Studios. Todos los derechos reservados.</span>
            <span>Hecho con pasión por el Wuxia y el Xianxia.</span>
          </div>
        </div>
      </footer>

    </div>
  );
};