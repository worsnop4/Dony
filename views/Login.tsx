
import React, { useState } from 'react';
import { User } from '../types';
import { LogIn, AlertCircle, Lock, User as UserIcon } from 'lucide-react';

interface LoginProps {
  onLogin: (user: User) => void;
  users: User[];
}

const Login: React.FC<LoginProps> = ({ onLogin, users }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleManualLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Artificial delay for better UX feel
    setTimeout(() => {
      const user = users.find(u => u.username.toLowerCase() === username.toLowerCase() && u.password === password);

      if (user) {
        onLogin(user);
      } else {
        setError("Invalid credentials. Please verify your username and password.");
        setLoading(false);
      }
    }, 600);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-slate-900 rounded-[2.5rem] shadow-2xl shadow-slate-200 mb-6 animate-bounce duration-[4000ms]">
            <img 
              src="https://raw.githubusercontent.com/fonserbc/demo-assets/main/ep-logo.png" 
              alt="EP Logo" 
              className="w-14 h-14 object-contain invert"
            />
          </div>
          <h1 className="text-4xl font-black text-slate-900 mb-2 tracking-tighter">Sales<span className="text-blue-600">Flow</span></h1>
          <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.3em]">Secure Enterprise Portal</p>
        </div>

        <div className="bg-white p-8 sm:p-10 rounded-[2.5rem] shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-500">
          <form onSubmit={handleManualLogin} className="space-y-6">
            <h2 className="text-2xl font-black text-slate-800 mb-2">Welcome Back</h2>
            <p className="text-slate-400 text-sm font-medium mb-6">Enter your username to access your dashboard.</p>
            
            {error && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3 text-red-600 text-sm font-bold animate-in slide-in-from-top-2">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <p>{error}</p>
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Username</label>
                <div className="relative">
                  <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                  <input 
                    type="text" 
                    required
                    autoFocus
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-12 pr-5 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:bg-white focus:border-blue-500 outline-none transition-all font-bold text-slate-800" 
                    placeholder="Enter your username"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                  <input 
                    type="password" 
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-5 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:bg-white focus:border-blue-500 outline-none transition-all font-bold text-slate-800"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className={`w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center justify-center gap-3 shadow-xl shadow-slate-200 active:scale-[0.98] ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <LogIn className="w-5 h-5" /> Sign Into Portal
                </>
              )}
            </button>
          </form>
        </div>
        
        <div className="text-center space-y-1">
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">
            © 2025 SalesFlow Enterprise Solutions
          </p>
          <div className="flex justify-center gap-4 text-slate-300 text-[9px] font-bold uppercase tracking-wider mt-2">
            <span>Privacy Policy</span>
            <span className="text-slate-200">•</span>
            <span>Security Standards</span>
            <span className="text-slate-200">•</span>
            <span>Support</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
