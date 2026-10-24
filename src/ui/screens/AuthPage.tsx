import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../core/store/useAuthStore';
import { Shield } from 'lucide-react';

export const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const login = useAuthStore((state) => state.login);
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulación de login (aquí conectarás el backend real luego)
    if (email && password) {
      login('fake-jwt-token-123', email);
      navigate('/create');
    }
  };

  return (
    <div className="min-h-screen bg-[#05070c] flex items-center justify-center relative">
      <div className="absolute inset-0 bg-[url('/assets/images/murim_hero_landscape_1792518333064.jpg')] bg-cover opacity-10" />
      
      <div className="relative z-10 w-full max-w-md bg-stone-900/90 border border-amber-900/40 rounded-xl p-8 backdrop-blur-md shadow-2xl">
        <div className="text-center mb-8">
          <Shield className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h2 className="font-cinzel text-3xl font-bold text-amber-100">
            {isLogin ? 'Ingresar al Jianghu' : 'Forjar Linaje'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-stone-400 mb-1">Correo Electrónico</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-stone-950 border border-stone-700 rounded-lg text-amber-200 focus:border-amber-500 outline-none"
              required 
            />
          </div>
          <div>
            <label className="block text-xs text-stone-400 mb-1">Contraseña</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-stone-950 border border-stone-700 rounded-lg text-amber-200 focus:border-amber-500 outline-none"
              required 
            />
          </div>
          <button type="submit" className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold rounded-lg transition-colors">
            {isLogin ? 'Entrar' : 'Registrarse'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button onClick={() => setIsLogin(!isLogin)} className="text-xs text-stone-400 hover:text-amber-400">
            {isLogin ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}
          </button>
        </div>
      </div>
    </div>
  );
};