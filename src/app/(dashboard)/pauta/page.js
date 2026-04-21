"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { 
  CalendarRange, Clock, AlertTriangle, Building2, 
  User, Handshake, Search, ChevronLeft, ChevronRight, 
  Filter, Loader2, Wifi
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

// ------- Helpers -------
function getInicioFimSemana(offsetSemanas = 0) {
  const hoje = new Date();
  const dia = hoje.getDay(); // 0=Dom, 1=Seg...
  const diffSeg = dia === 0 ? -6 : 1 - dia; // Corrigir para segunda
  const seg = new Date(hoje);
  seg.setDate(hoje.getDate() + diffSeg + offsetSemanas * 7);
  seg.setHours(0,0,0,0);
  const sex = new Date(seg);
  sex.setDate(seg.getDate() + 4);
  sex.setHours(23,59,59,999);
  return { inicio: seg, fim: sex };
}

function formatDataPT(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
}

function formatHora(dtStr) {
  if (!dtStr) return "—";
  try {
    return new Date(dtStr).toLocaleTimeString('pt-BR', { timeZone: 'UTC', hour: '2-digit', minute: '2-digit' });
  } catch { return "—"; }
}

function getDiaSemana(dtStr) {
  if (!dtStr) return -1;
  // 0=Dom, 1=Seg ... 5=Sex — mas exibimos 1-5 para Seg-Sex
  const d = new Date(dtStr);
  const dow = d.getUTCDay(); // 1=Seg...5=Sex
  return dow; // 0=Dom, ignora
}

const DIAS_SEMANA = [
  { id: 1, nome: "Segunda" },
  { id: 2, nome: "Terca" },
  { id: 3, nome: "Quarta" },
  { id: 4, nome: "Quinta" },
  { id: 5, nome: "Sexta" },
];

// ------- Card -------
const AudCard = ({ item }) => {
  const getBorderColor = () => {
    if (item.acordoFechado) return "border-l-green-500 shadow-[0_0_15px_rgba(34,197,94,0.1)]";
    if (item.risco) return "border-l-red-500 shadow-[0_0_15px_rgba(239,68,68,0.1)]";
    return "border-l-[#D4AF37]";
  };

  return (
    <div className={`bg-[#0B1120] border border-gray-800 border-l-4 ${getBorderColor()} rounded-lg p-4 cursor-pointer hover:-translate-y-1 transition-transform relative overflow-hidden group`}>
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-1.5 bg-black/40 px-2 py-1 rounded text-[10px] font-mono text-white">
          <Clock className="w-3 h-3 text-[#D4AF37]" />
          {item.hora}
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="text-[9px] uppercase tracking-widest font-bold px-2 py-1 bg-[#D4AF37]/10 text-[#D4AF37] rounded">
            {item.tipo}
          </span>
          {item.modelo && (
            <span className="text-[8px] uppercase tracking-widest text-gray-500 bg-white/5 px-1.5 py-0.5 rounded">
              {item.modelo}
            </span>
          )}
        </div>
      </div>

      <h4 className="font-inter text-sm font-bold text-white mb-3 group-hover:text-[#D4AF37] transition-colors line-clamp-1">
        {item.reclamante}
      </h4>

      <div className="space-y-1.5 text-[10px] text-gray-500">
        <div className="flex items-center gap-2">
          <Building2 className="w-3 h-3 shrink-0" />
          <span className="truncate">{item.unidade || "Unidade nao informada"}</span>
        </div>
        <div className="flex items-center gap-2">
          <User className="w-3 h-3 shrink-0" />
          <span className="truncate font-mono">{item.processo}</span>
        </div>
      </div>

      {item.risco && !item.acordoFechado && (
        <div className="mt-3 flex items-center gap-1.5 text-[9px] font-bold text-red-500 uppercase tracking-tighter">
          <AlertTriangle className="w-3 h-3" />
          ALTO RISCO ESTRATEGICO
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

// ------- Page -------
export default function PautaPage() {
  const [pauta, setPauta] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [busca, setBusca] = useState("");
  const [offsetSemana, setOffsetSemana] = useState(0);

  const { inicio, fim } = useMemo(() => getInicioFimSemana(offsetSemana), [offsetSemana]);

  const fetchPauta = async () => {
    setIsLoading(true);
    try {
      // Busca audiencias com join para processos > reclamantes
      const { data, error } = await supabase
        .from('audiencias')
        .select(`
          numero_cnj, tipo, modelo, data_hora,
          processos (
            status_fase, polo_passivo, unidade,
            reclamantes ( nome, funcao )
          )
        `)
        .not('data_hora', 'is', null)
        .order('data_hora', { ascending: true });

      if (!error && data) {
        const normalizado = data.map(item => ({
          id:          item.numero_cnj + '_' + item.data_hora,
          cnj:         item.numero_cnj,
          processo:    item.numero_cnj,
          reclamante:  item.processos?.reclamantes?.nome || "Reclamante nao informado",
          funcao:      item.processos?.reclamantes?.funcao || "-",
          unidade:     item.processos?.unidade || "-",
          tipo:        item.tipo || "Audiencia",
          modelo:      item.modelo || "",
          data_hora:   item.data_hora,
          hora:        formatHora(item.data_hora),
          diaSemana:   getDiaSemana(item.data_hora),
          risco:       false,
          acordoFechado: item.processos?.status_fase === "Aguardando Pagamento",
        }));
        setPauta(normalizado);
      } else if (error) {
        console.error("Erro ao buscar pauta:", error.message);
      }
    } catch(e) {
      console.error(e);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchPauta();
  }, []);

  // Filtra por semana selecionada
  const pautaSemana = useMemo(() => {
    return pauta.filter(item => {
      if (!item.data_hora) return false;
      const d = new Date(item.data_hora);
      return d >= inicio && d <= fim;
    });
  }, [pauta, inicio, fim]);

  // Filtra por busca
  const pautaFiltrada = useMemo(() => {
    if (!busca.trim()) return pautaSemana;
    const q = busca.toLowerCase();
    return pautaSemana.filter(item =>
      item.reclamante.toLowerCase().includes(q) ||
      item.processo.toLowerCase().includes(q) ||
      item.tipo.toLowerCase().includes(q)
    );
  }, [pautaSemana, busca]);

  const labelSemana = `${formatDataPT(inicio)} a ${formatDataPT(fim)}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-1">
        <h1 className="font-cinzel text-3xl font-bold text-[#D4AF37] tracking-wider uppercase">
          Pauta Semanal
        </h1>
        <p className="font-inter text-gray-500 text-sm">Cronograma estrategico e operacional de audiencias</p>
      </div>

      <div className="glassmorphism p-4 rounded-xl flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
          <input 
            type="text" 
            placeholder="Pesquisar pauta..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
            className="w-full bg-black/20 border border-gray-800 rounded-lg py-2 pl-10 pr-4 text-xs font-inter text-white focus:outline-none focus:border-[#D4AF37]/40 transition-all"
          />
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setOffsetSemana(o => o - 1)}
              className="p-1.5 rounded-full border border-gray-800 text-gray-400 hover:text-white hover:border-gray-600 transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-inter text-xs font-bold text-white tracking-widest uppercase">
              {labelSemana}
            </span>
            <button 
              onClick={() => setOffsetSemana(o => o + 1)}
              className="p-1.5 rounded-full border border-gray-800 text-gray-400 hover:text-white hover:border-gray-600 transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <button 
            onClick={fetchPauta}
            className="p-2 border border-gray-800 rounded-lg text-gray-500 hover:text-[#D4AF37] hover:border-[#D4AF37]/30 transition-colors"
          >
            <Wifi className={`w-4 h-4 ${isLoading ? 'animate-pulse' : ''}`} />
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <Loader2 size={32} className="text-[#D4AF37] animate-spin" />
          <p className="font-cinzel text-[#D4AF37] text-xs tracking-widest">Sincronizando Audiencias...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
          {DIAS_SEMANA.map((dia) => {
            const itens = pautaFiltrada
              .filter(item => item.diaSemana === dia.id)
              .sort((a, b) => a.hora.localeCompare(b.hora));

            return (
              <div key={dia.id} className="min-h-[60vh] bg-white/5 border border-gray-800 rounded-xl p-4 flex flex-col gap-4">
                <div className="text-center py-2 border-b border-gray-800/50 mb-2">
                  <h3 className="font-cinzel text-sm font-bold text-[#D4AF37] tracking-[0.3em] uppercase">
                    {dia.nome}
                  </h3>
                  {itens.length > 0 && (
                    <span className="text-[9px] text-gray-600 font-mono">{itens.length} audiencia(s)</span>
                  )}
                </div>

                <div className="flex flex-col gap-4">
                  {itens.map(item => (
                    <AudCard key={item.id} item={item} />
                  ))}
                  
                  {itens.length === 0 && (
                    <div className="mt-10 text-center space-y-2 opacity-20">
                      <CalendarRange className="w-8 h-8 mx-auto text-gray-600" />
                      <p className="text-[10px] font-inter uppercase tracking-widest">Sem Agenda</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
