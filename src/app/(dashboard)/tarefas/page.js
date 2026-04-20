"use client";

import React from 'react';
import { CheckSquare, Construction } from 'lucide-react';

export default function TarefasPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
      <div className="p-6 bg-white/5 rounded-full border border-white/10 animate-pulse">
        <CheckSquare size={64} className="text-[#D4AF37]" />
      </div>
      <div className="space-y-2">
        <h1 className="font-cinzel text-3xl font-bold text-[#D4AF37] tracking-widest uppercase">Fluxo de Tarefas</h1>
        <p className="text-gray-500 font-inter max-w-md mx-auto">
          O módulo Kanban de gestão estratégica está sendo polido para a máxima performance.
        </p>
      </div>
      <div className="flex items-center gap-2 px-4 py-2 bg-yellow-900/20 text-yellow-500 border border-yellow-500/30 rounded-md text-xs font-bold uppercase tracking-widest">
        <Construction size={14} /> Módulo em Construção
      </div>
    </div>
  );
}
