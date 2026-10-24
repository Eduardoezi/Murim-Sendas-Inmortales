import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { Shield, Sparkles, KeyRound, Mail } from 'lucide-react';

export const AuthScreen: React.FC = () => {
  const { login, register, authError, authLoading } = useGame();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLogin) {
      await login(email, password);
    } else {
      await register(email, password);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 bg-[#05070c] overflow-hidden">
      <div className="absolute inset-0 z-0">
        <img src="/src/assets/images/murim_hero_landscape_1792518333064.jpg" alt="Fondo" className="w-full h-full object-cover opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#05070c] via-[#05070c]/90 to-transparent" />
      </div>

      <div className="relative z-10 w-full max-w-md bg-stone-900/90 border border-amber-900/40 rounded-xl p-8 backdrop-blur-md shadow-2xl animate-in fade-in zoom-in-95">
        <div className="text-center mb-8">
          <h1 className="font-cinzel text-3xl font-bold text-amber-100 mb-2">Murim: Sendas Inmortales</h1>
          <p className="text-stone-400 text-sm">{isLogin ? 'Ingresa al Jianghu' : 'Forja tu linaje'}</p>
        </div>

        {authError && (
          <div className="mb-4 p-3 bg-rose-950/50 border border-rose-900/50 rounded-lg text-rose-200 text-xs text-center">
            {authError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-stone-300 mb-1">Correo Electrónico</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-stone-950 border border-stone-700 rounded-lg text-amber-200 focus:border-amber-500 outline-none transition-colors"
                placeholder="cultivador@jianghu.com"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-300 mb-1">Contraseña</label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-stone-950 border border-stone-700 rounded-lg text-amber-200 focus:border-amber-500 outline-none transition-colors"
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={authLoading}
            className="w-full mt-2 py-3 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-stone-950 font-cinzel font-bold text-sm uppercase rounded-lg shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {authLoading ? 'Canalizando Qi...' : (isLogin ? <><Shield className="w-4 h-4"/> Entrar</> : <><Sparkles className="w-4 h-4"/> Registrarse</>)}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => { setIsLogin(!isLogin); setEmail(''); setPassword(''); }}
            className="text-xs text-stone-400 hover:text-amber-400 transition-colors"
          >
            {isLogin ? '¿No tienes cuenta? Forja un nuevo linaje.' : '¿Ya tienes cuenta? Ingresa al Jianghu.'}
          </button>
        </div>
      </div>
    </div>
  );
};