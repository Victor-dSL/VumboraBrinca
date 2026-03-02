
import React, { useState, useEffect } from 'react';
import { Mail, Lock, Loader2, LogIn, AlertCircle, Image as ImageIcon } from 'lucide-react';
import { auth, signInWithEmailAndPassword, getApiConfigOnce } from '../firebase';
import { User, UserRole } from '../types';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dynamicLogo, setDynamicLogo] = useState<string | null>(null);

  useEffect(() => {
    const loadLogo = async () => {
      try {
        const config = await getApiConfigOnce();
        if (config?.logoBase64) setDynamicLogo(config.logoBase64);
      } catch (e) {
        console.error("Erro ao carregar logo dinâmica no login");
      }
    };
    loadLogo();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const userEmail = userCredential.user.email || '';
      
      let role: UserRole = 'staff';
      let name = 'Equipe Vumbora';

      if (userEmail === 'vumborabrincar@gmail.com' || userEmail === 'jvdsl2024@gmail.com') {
        role = 'admin';
        name = 'Administrador';
      } else if (userEmail === 'gabriellysilva0509@gmail.com') {
        role = 'staff';
        name = 'Gabrielly Silva';
      }

      onLogin({ email: userEmail, role, name });
    } catch (err: any) {
      console.error("Erro de Login:", err.code);
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError('E-mail ou senha incorretos.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Muitas tentativas. Tente novamente mais tarde.');
      } else {
        setError('Falha ao conectar com o servidor.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-500 border border-white/20">
        <div className="p-8 pb-4 flex flex-col items-center">
          {dynamicLogo ? (
            <img 
              src={dynamicLogo} 
              alt="Vumbora Logo" 
              className="h-32 mb-6 object-contain"
            />
          ) : (
            <div className="bg-blue-100 p-6 rounded-full mb-6 text-blue-600">
               <ImageIcon size={64} />
            </div>
          )}
          <h2 className="text-2xl font-black text-blue-900 uppercase tracking-tight text-center">Gestão Vumbora Brincá</h2>
          <p className="text-gray-500 text-sm mt-1 font-medium uppercase tracking-widest">Acesso Restrito</p>
        </div>

        <form onSubmit={handleLogin} className="p-8 pt-4 space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-black text-gray-400 mb-2 uppercase tracking-widest ml-1">E-mail Profissional</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-500 group-focus-within:scale-110 transition-all" size={20} />
                <input
                  type="email"
                  required
                  className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl p-4 pl-12 text-gray-900 font-bold focus:border-blue-500 focus:bg-white outline-none transition-all"
                  placeholder="exemplo@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-gray-400 mb-2 uppercase tracking-widest ml-1">Senha de Acesso</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-500 group-focus-within:scale-110 transition-all" size={20} />
                <input
                  type="password"
                  required
                  className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl p-4 pl-12 text-gray-900 font-bold focus:border-blue-500 focus:bg-white outline-none transition-all"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-3 p-4 bg-red-50 text-red-700 rounded-2xl border-2 border-red-100 animate-shake">
              <AlertCircle size={20} />
              <p className="text-xs font-bold uppercase">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-5 rounded-2xl shadow-xl shadow-blue-200 transition-all active:scale-95 flex items-center justify-center gap-3 text-lg uppercase"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={24} />
            ) : (
              <>
                <LogIn size={24} />
                Entrar no Sistema
              </>
            )}
          </button>
        </form>

        <div className="p-6 bg-gray-50 text-center">
          <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">© {new Date().getFullYear()} - Vumbora Brincá Oficial</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
