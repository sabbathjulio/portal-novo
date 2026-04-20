'use client';
import { User, Lock } from 'lucide-react';

export default function LoginPage() {
  return (
    <main className="relative min-h-screen w-full flex items-center justify-center bg-[#0B0D11] overflow-hidden">
      {/* Elementos Decorativos de Glow */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] glow-radial opacity-40 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] glow-radial opacity-40 blur-3xl pointer-events-none" />
      
      {/* Container Principal Glassmorphism */}
      <div className="relative z-10 glassmorphism p-10 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="text-center mb-10">
          <h1 className="font-cinzel text-3xl font-bold text-[#D4AF37] tracking-[0.2em] mb-2">
            BERNARDES CORP.
          </h1>
          <p className="font-inter text-gray-500 text-sm tracking-widest uppercase">
            Portal Jurídico
          </p>
        </div>

        <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
          <div className="space-y-2">
            <label className="block text-[10px] uppercase tracking-widest text-gray-500 ml-1">
              Credencial de Acesso
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-[#D4AF37]">
                <User className="w-5 h-5 text-gray-600 group-focus-within:text-[#D4AF37]" />
              </div>
              <input 
                type="text" 
                className="w-full bg-white/5 border border-gray-800 rounded-lg py-3 pl-12 pr-4 text-white font-inter placeholder:text-gray-700 focus:outline-none focus:border-[#D4AF37]/50 focus:bg-white/10 transition-all"
                placeholder="USUÁRIO"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-[10px] uppercase tracking-widest text-gray-500 ml-1">
              Código de Autenticação
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-[#D4AF37]">
                <Lock className="w-5 h-5 text-gray-600 group-focus-within:text-[#D4AF37]" />
              </div>
              <input 
                type="password" 
                className="w-full bg-white/5 border border-gray-800 rounded-lg py-3 pl-12 pr-4 text-white font-inter placeholder:text-gray-700 focus:outline-none focus:border-[#D4AF37]/50 focus:bg-white/10 transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div className="pt-4">
            <button 
              className="w-full py-4 border border-[#D4AF37] text-[#D4AF37] font-cinzel font-bold tracking-widest rounded-lg hover:bg-[#D4AF37] hover:text-black transition-all duration-500 uppercase text-sm shadow-[0_0_20px_rgba(212,175,55,0.1)] hover:shadow-[0_0_40px_rgba(212,175,55,0.3)]"
            >
              Iniciar Protocolo
            </button>
          </div>
        </form>

        <div className="mt-8 text-center">
          <p className="text-[10px] text-gray-600 font-inter tracking-[0.3em] uppercase">
            Protocolo de Segurança Nível 4 • Codigo: B-77
          </p>
        </div>
      </div>
    </main>
  );
}
