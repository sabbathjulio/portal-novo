"use client";

import React from 'react';
import { Database, CloudLightning, Construction } from 'lucide-react';

export default function SupabaseBridgePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
      <div className="p-6 bg-white/5 rounded-full border border-white/10 animate-pulse">
        <CloudLightning size={64} className="text-blue-500" />
      </div>
      <div className="space-y-2">
        <h1 className="font-cinzel text-3xl font-bold text-white tracking-widest uppercase italic">Supabase <span className="text-blue-500">Bridge</span></h1>
        <p className="text-gray-500 font-inter max-w-md mx-auto">
          Painel de monitoramento e sincronização de fluxo de dados em tempo real.
        </p>
      </div>
      <div className="flex items-center gap-2 px-4 py-2 bg-blue-900/20 text-blue-500 border border-blue-500/30 rounded-md text-xs font-bold uppercase tracking-widest">
        <Database size={14} /> Infraestrutura Operacional
      </div>
    </div>
  );
}
