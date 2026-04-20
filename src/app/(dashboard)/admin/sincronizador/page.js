"use client";

import React, { useState, useMemo } from 'react';
import { 
  RefreshCw, Filter, Clock, X, CalendarPlus, 
  CheckSquare, Square, CheckCircle2, ChevronRight 
} from 'lucide-react';

// Passo 1: Mock Data
const MOCK_AGENDA = [
  { id: 1, agendaBR: "15/05/2026", horas: "14:30", reclamante: "PAULO ROBERTO DA SILVA", status: "Audiência Inicial", modelo: "Semipresencial", processo: "1000114-98.2026.5.02.0463" },
  { id: 2, agendaBR: "20/04/2026", horas: "09:00", reclamante: "MARIA CLARA GOMES", status: "Audiência UNA", modelo: "Presencial", processo: "0010992-88.2023.5.15.0002" },
  { id: 3, agendaBR: "10/06/2026", horas: "10:15", reclamante: "ANTÔNIO SILVA ROCHA", status: "Audiência de Instrução", modelo: "Virtual", processo: "1000542-10.2024.5.15.0100" }
];

export default function SincronizadorPage() {
  // Passo 2: Estados do Componente
  const [filtro, setFiltro] = useState("TODOS");
  const [selectedIds, setSelectedIds] = useState([]);

  // Lógica de Filtragem
  const audienciasFiltradas = useMemo(() => {
    if (filtro === "TODOS") return MOCK_AGENDA;
    return MOCK_AGENDA.filter(a => a.status === filtro);
  }, [filtro]);

  // Passo 4: Lógica do Checkbox Master
  const isAllFilteredSelected = useMemo(() => {
    return audienciasFiltradas.length > 0 && 
           audienciasFiltradas.every(a => selectedIds.includes(a.id));
  }, [audienciasFiltradas, selectedIds]);

  const handleSelectAll = (checked) => {
    if (checked) {
      const newSelection = Array.from(new Set([...selectedIds, ...audienciasFiltradas.map(a => a.id)]));
      setSelectedIds(newSelection);
    } else {
      const filteredIds = audienciasFiltradas.map(a => a.id);
      setSelectedIds(selectedIds.filter(id => !filteredIds.includes(id)));
    }
  };

  const toggleSelection = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      
      {/* Passo 3: Layout Principal e Filtros */}
      <div className="text-center md:mb-12 mt-4">
        <h2 className="flex items-center justify-center gap-4 text-3xl font-cinzel font-bold text-[#D4AF37] mb-3">
          <RefreshCw size={32} /> Sincronizador de Agenda
        </h2>
        <div style={{ fontSize: '10px' }} className="text-[#D4AF37]/60 uppercase tracking-widest font-bold flex items-center justify-center gap-2 mb-2">
          <CheckCircle2 size={12} className="text-green-500" /> Sincronização estabelecida com o Códex.
        </div>
        <p className="text-gray-400 text-sm font-inter">Integração direta com o Calendário Jurídico via G-Suite.</p>
      </div>

      {/* Painel de Filtro */}
      <div className="bg-black/40 backdrop-blur-xl border border-white/5 rounded-2xl p-8 flex flex-col md:flex-row items-center gap-8 border-dashed border-[#D4AF37]/30">
        <label className="text-[10px] text-gray-500 uppercase tracking-widest font-bold flex items-center gap-2 whitespace-nowrap">
           <Filter size={14} className="text-[#D4AF37]" /> Categoria de Sessão:
        </label>
        <select 
          value={filtro}
          onChange={e => {
            setFiltro(e.target.value);
            // Opcional: Limpar seleção ao trocar filtro se desejar comportamento rígido
            // setSelectedIds([]); 
          }}
          className="w-full md:w-auto bg-black/50 border border-white/10 rounded-xl px-6 py-4 text-sm text-white focus:border-[#D4AF37]/50 outline-none transition-all cursor-pointer appearance-none pr-12 bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23c1a35f%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C/polyline%3E%3C/svg%3E')] bg-no-repeat bg-[right_1.5rem_center] bg-[length:16px]"
        >
          <option value="TODOS">Todo o Acervo Pendente</option>
          <option value="Audiência Inicial">Audiência Inicial</option>
          <option value="Audiência UNA">Audiência UNA</option>
          <option value="Audiência de Instrução">Audiência de Instrução</option>
          <option value="Audiência de Conciliação">Audiência de Conciliação</option>
        </select>
      </div>

      {/* Passo 4: Tabela de Seleção em Massa */}
      <div className="bg-black/40 backdrop-blur-xl border border-white/5 rounded-2xl p-6 md:p-8">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-separate border-spacing-y-3">
            <thead>
              <tr className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">
                <th className="px-6 py-3 w-[80px] text-center">
                  <div 
                    onClick={() => handleSelectAll(!isAllFilteredSelected)}
                    className={`w-5 h-5 rounded border mx-auto flex items-center justify-center cursor-pointer transition-all ${isAllFilteredSelected ? 'bg-[#D4AF37] border-[#D4AF37]' : 'border-white/20 bg-black/20'}`}
                  >
                    {isAllFilteredSelected && <CheckSquare size={14} className="text-black font-bold" />}
                  </div>
                </th>
                <th className="px-6 py-3 w-[180px]">Cronograma</th>
                <th className="px-6 py-3">Reclamante</th>
                <th className="px-6 py-3">Status / Modelo</th>
                <th className="px-6 py-3 w-[200px]">Protocolo CNJ</th>
              </tr>
            </thead>
            <tbody>
              {audienciasFiltradas.length > 0 ? (
                audienciasFiltradas.map((item) => {
                  const isSelected = selectedIds.includes(item.id);
                  return (
                    <tr key={item.id} className="group">
                      <td className="px-6 py-4 bg-white/5 border-y border-l border-white/5 rounded-l-xl text-center">
                        <div 
                          onClick={() => toggleSelection(item.id)}
                          className={`w-5 h-5 rounded border mx-auto flex items-center justify-center cursor-pointer transition-all ${isSelected ? 'bg-[#D4AF37] border-[#D4AF37]' : 'border-white/20 bg-black/20'}`}
                        >
                          {isSelected && <CheckSquare size={14} className="text-black font-bold" />}
                        </div>
                      </td>
                      <td className="px-6 py-4 bg-white/5 border-y border-white/5">
                        <div className="inline-block bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#D4AF37] px-3 py-1 rounded font-cinzel font-bold text-[11px] tracking-wider mb-2">
                           {item.agendaBR}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-gray-500">
                           <Clock size={12} /> {item.horas}
                        </div>
                      </td>
                      <td className="px-6 py-4 bg-white/5 border-y border-white/5 font-bold text-sm text-white">{item.reclamante}</td>
                      <td className="px-6 py-4 bg-white/5 border-y border-white/5">
                         <div className="font-bold text-xs text-white mb-1">{item.status}</div>
                         <div className="text-[10px] text-gray-500 uppercase tracking-widest">{item.modelo}</div>
                      </td>
                      <td className="px-6 py-4 bg-white/5 border-y border-r border-white/5 rounded-r-xl font-mono text-[11px] text-gray-400">
                         {item.processo}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-20 text-center text-gray-500 font-inter text-sm bg-black/20 rounded-xl border border-dashed border-white/5">
                    Nenhum agendamento pendente localizado para este filtro.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Passo 5: Barra de Ações (Footer) */}
      <div className="flex justify-end items-center gap-6 pt-4">
        <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">
           {selectedIds.length} selecionados
        </div>
        <button 
          onClick={() => setSelectedIds([])}
          className="flex items-center gap-2 px-6 py-3 border border-white/10 text-gray-400 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-white/5 hover:text-white transition-all"
        >
          <X size={14} /> Limpar Seleção
        </button>
        <button 
          onClick={() => {
            alert(`${selectedIds.length} agendamentos sincronizados com o G-Suite.`);
            setSelectedIds([]);
          }}
          disabled={selectedIds.length === 0}
          className="flex items-center gap-3 px-8 py-4 bg-[#D4AF37] text-black rounded-xl text-[10px] font-cinzel font-bold uppercase tracking-widest hover:scale-[1.05] transition-all shadow-xl shadow-[#D4AF37]/20 disabled:opacity-30 disabled:pointer-events-none"
        >
          <CalendarPlus size={18} /> Sincronizar Canais
        </button>
      </div>

    </div>
  );
}
