"use client";

import React from 'react';
import { 
  CalendarRange, 
  Clock, 
  AlertTriangle, 
  Building2, 
  User, 
  Handshake,
  Search,
  ChevronLeft,
  ChevronRight,
  Filter
} from 'lucide-react';

// Passo 1: Mock Data
const MOCK_PAUTA = [
  {
    id: 1,
    reclamante: "MARCOS VENICIUS SOUZA",
    processo: "1000882-12.2024.5.15.0002",
    dia: 1, // Segunda
    hora: "09:30",
    tipo: "Instrução",
    local: "Jundiaí - 02ª Vara",
    risco: true,
    acordoFechado: false
  },
  {
    id: 2,
    reclamante: "JULIANA PEREIRA LIMA",
    processo: "0011554-90.2023.5.02.0015",
    dia: 2, // Terça
    hora: "13:45",
    tipo: "Una",
    local: "São Paulo - 15ª Vara",
    risco: false,
    acordoFechado: true
  },
  {
    id: 3,
    reclamante: "RICARDO AMARAL GOMES",
    processo: "1022441-33.2024.5.15.0001",
    dia: 3, // Quarta
    hora: "11:00",
    tipo: "Instrução",
    local: "Jundiaí - 01ª Vara",
    risco: false,
    acordoFechado: false
  },
  {
    id: 4,
    reclamante: "BEATRIZ SANTOS MOTA",
    processo: "0010921-22.2023.5.02.0044",
    dia: 1, // Segunda
    hora: "15:20",
    tipo: "Liquidação",
    local: "São Paulo - 44ª Vara",
    risco: false,
    acordoFechado: false
  }
];

const DIAS_SEMANA = [
  { id: 1, nome: "Segunda" },
  { id: 2, nome: "Terça" },
  { id: 3, nome: "Quarta" },
  { id: 4, nome: "Quinta" },
  { id: 5, nome: "Sexta" }
];

const AudCard = ({ item }) => {
  const getBorderColor = () => {
    if (item.acordoFechado) return "border-l-green-500 shadow-[0_0_15px_rgba(34,197,94,0.1)]";
    if (item.risco) return "border-l-red-500 shadow-[0_0_15px_rgba(239,68,68,0.1)]";
    return "border-l-[#D4AF37]";
  };

  return (
    <div 
      className={`bg-[#0B1120] border border-gray-800 border-l-4 ${getBorderColor()} rounded-lg p-4 cursor-pointer hover:-translate-y-1 transition-transform relative overflow-hidden group`}
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-1.5 bg-black/40 px-2 py-1 rounded text-[10px] font-mono text-white">
          <Clock className="w-3 h-3 text-[#D4AF37]" />
          {item.hora}
        </div>
        <span className="text-[9px] uppercase tracking-widest font-bold px-2 py-1 bg-[#D4AF37]/10 text-[#D4AF37] rounded">
          {item.tipo}
        </span>
      </div>

      <h4 className="font-inter text-sm font-bold text-white mb-3 group-hover:text-[#D4AF37] transition-colors line-clamp-1">
        {item.reclamante}
      </h4>

      <div className="space-y-1.5 text-[10px] text-gray-500">
        <div className="flex items-center gap-2">
          <Building2 className="w-3 h-3" />
          <span className="truncate">{item.local}</span>
        </div>
        <div className="flex items-center gap-2">
          <User className="w-3 h-3" />
          <span className="truncate">{item.processo}</span>
        </div>
      </div>

      {item.risco && !item.acordoFechado && (
        <div className="mt-3 flex items-center gap-1.5 text-[9px] font-bold text-red-500 uppercase tracking-tighter">
          <AlertTriangle className="w-3 h-3" />
          ALTO RISCO ESTRATÉGICO
        </div>
      )}

      {item.acordoFechado && (
        <div className="mt-3 pt-3 border-t border-gray-800 flex items-center gap-2 text-[10px] font-bold text-green-500 uppercase">
          <Handshake className="w-3.5 h-3.5" />
          ACORDO FECHADO
        </div>
      )}
    </div>
  );
};

export default function PautaPage() {
  return (
    <div className="space-y-6">
      {/* Passo 2: Cabeçalho e Toolbar */}
      <div className="flex flex-col space-y-1">
        <h1 className="font-cinzel text-3xl font-bold text-[#D4AF37] tracking-wider uppercase">
          Pauta Semanal
        </h1>
        <p className="font-inter text-gray-500 text-sm">Cronograma estratégico e operacional de audiências</p>
      </div>

      <div className="glassmorphism p-4 rounded-xl flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
          <input 
            type="text" 
            placeholder="Pesquisar pauta..."
            className="w-full bg-black/20 border border-gray-800 rounded-lg py-2 pl-10 pr-4 text-xs font-inter text-white focus:outline-none focus:border-[#D4AF37]/40 transition-all"
          />
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <button disabled className="p-1.5 rounded-full border border-gray-800 text-gray-700 cursor-not-allowed">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-inter text-xs font-bold text-white tracking-widest uppercase">
              19/04/2026 a 23/04/2026
            </span>
            <button disabled className="p-1.5 rounded-full border border-gray-800 text-gray-700 cursor-not-allowed">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <button className="p-2 border border-gray-800 rounded-lg text-gray-500 hover:text-white transition-colors">
            <Filter className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Passo 3: Grid do Calendário */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
        {DIAS_SEMANA.map((dia) => (
          <div key={dia.id} className="min-h-[60vh] bg-white/5 border border-gray-800 rounded-xl p-4 flex flex-col gap-4">
            <div className="text-center py-2 border-b border-gray-800/50 mb-2">
              <h3 className="font-cinzel text-sm font-bold text-[#D4AF37] tracking-[0.3em] uppercase">
                {dia.nome}
              </h3>
            </div>

            <div className="flex flex-col gap-4">
              {MOCK_PAUTA
                .filter(item => item.dia === dia.id)
                .sort((a, b) => a.hora.localeCompare(b.hora))
                .map(item => (
                  <AudCard key={item.id} item={item} />
                ))
              }
              
              {MOCK_PAUTA.filter(item => item.dia === dia.id).length === 0 && (
                <div className="mt-10 text-center space-y-2 opacity-20">
                  <CalendarRange className="w-8 h-8 mx-auto text-gray-600" />
                  <p className="text-[10px] font-inter uppercase tracking-widest">Sem Agenda</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
