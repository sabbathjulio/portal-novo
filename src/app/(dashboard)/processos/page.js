"use client";

import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Database, 
  X, 
  RefreshCw, 
  FileText, 
  User, 
  Clock, 
  MapPin, 
  Gavel,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function AcervoPage() {
  const [acervo, setAcervo] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProcess, setSelectedProcess] = useState(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  const fetchProcessos = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('processos')
      .select('*, reclamantes(*), audiencias(*)')
      .order('numero_cnj', { ascending: false });
    if (!error && data) {
      // Normaliza os dados para manter compatibilidade com a UI existente
      const normalizado = data.map(item => ({
        ...item,
        // reclamante e funcao vem da tabela reclamantes
        reclamante: item.reclamantes?.nome || item.reclamante || "Nao informado",
        funcao:     item.reclamantes?.funcao || "-",
        reu:        item.polo_passivo || item.reu || "-",
        // status lido de status_fase
        fase_atual: item.status_fase || item.fase_atual || "Indefinido",
        status_geral: item.status_fase || item.status_geral || "Indefinido",
      }));
      setAcervo(normalizado);
    }
    setIsLoading(false);
  };


  useEffect(() => {
    fetchProcessos();
  }, []);

  const handleRowClick = (process) => {
    setSelectedProcess(process);
    setIsPanelOpen(true);
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case "Aguardando Pagamento":
        return "bg-green-900/40 text-green-400 border border-green-800";
      case "Instrução":
        return "bg-blue-900/40 text-blue-400 border border-blue-800";
      case "Liquidação":
        return "bg-orange-900/40 text-orange-400 border border-orange-800";
      default:
        return "bg-gray-800 text-gray-400 border border-gray-700";
    }
  };

  // Funções temporárias para contagem lógica nos KPIs
  const getUnidadeCount = (unidade) => acervo.filter(item => item.unidade === unidade).length;
  const getStatusCount = (status) => acervo.filter(item => (item.fase_atual || item.status_geral) === status).length;

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* Passo 2: Header e KPIs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-cinzel text-3xl font-bold text-[#D4AF37] tracking-wider">
            Acervo Estratégico
          </h1>
          <p className="font-inter text-gray-500 text-sm">Gestão de processos e indicadores operacionais</p>
        </div>
        <button 
          onClick={fetchProcessos}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 border border-[#D4AF37] text-[#D4AF37] font-cinzel text-xs tracking-widest rounded-md hover:bg-[#D4AF37] hover:text-black transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
          ATUALIZAR
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glassmorphism p-6 rounded-xl relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Database size={100} />
          </div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 mb-1">Total de Processos</p>
          <p className="text-4xl font-cinzel font-bold text-white">
            {isLoading ? "..." : acervo.length}
          </p>
          <div className="mt-4 flex items-center gap-2 text-[10px] text-green-500 font-bold tracking-tighter">
            <span>+12% vs mês anterior</span>
          </div>
        </div>

        <div className="glassmorphism p-6 rounded-xl">
          <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 mb-1">Por Unidade</p>
          <div className="space-y-2 mt-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-300">Logística Sul</span>
              <span className="text-white font-bold">{isLoading ? "..." : getUnidadeCount("Logística Sul")}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-300">CD Cajamar</span>
              <span className="text-white font-bold">{isLoading ? "..." : getUnidadeCount("CD Cajamar")}</span>
            </div>
          </div>
        </div>

        <div className="glassmorphism p-6 rounded-xl">
          <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 mb-1">Por Status</p>
          <div className="space-y-2 mt-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-300">Instrução</span>
              <span className="text-white font-bold">{isLoading ? "..." : getStatusCount("Instrução")}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-300">Aguardando Pagamento</span>
              <span className="text-white font-bold">{isLoading ? "..." : getStatusCount("Aguardando Pagamento")}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Passo 3: Tabela de Dados */}
      <div className="glassmorphism rounded-xl overflow-hidden relative">
        {isLoading ? (
          <div className="p-20 flex flex-col items-center justify-center text-center animate-in zoom-in duration-500">
            <Database size={48} className="text-[#D4AF37] animate-pulse mb-6" />
            <h3 className="font-cinzel text-xl text-[#D4AF37] font-bold tracking-widest mb-2">Sincronizando com o Códex...</h3>
            <p className="text-gray-500 text-sm font-inter">Estabelecendo conexão segura com o banco de dados.</p>
          </div>
        ) : (
          <div className="overflow-x-auto text-white">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-800 bg-white/2">
                  <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-[#D4AF37] font-bold">Nº Processo</th>
                  <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-[#D4AF37] font-bold">Reclamante</th>
                  <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-[#D4AF37] font-bold">Logística</th>
                  <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-[#D4AF37] font-bold">Status</th>
                  <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-[#D4AF37] font-bold">Advogado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {acervo.map((item) => {
                  const status = item.fase_atual || item.status_geral || "Indefinido";
                  return (
                    <tr 
                      key={item.id} 
                      onClick={() => handleRowClick(item)}
                      className="hover:bg-white/5 cursor-pointer transition-colors group"
                    >
                      <td className="px-6 py-4 font-inter text-sm text-white group-hover:text-[#D4AF37] transition-colors font-mono">
                        {item.numero_cnj || item.processo}
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-inter text-sm font-semibold text-white truncate max-w-xs">{item.reclamante}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-[10px] text-gray-500 uppercase tracking-wider">{item.unidade || "Não informado"}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusStyle(status)}`}>
                          {status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-400 italic">
                        {item.advogado_adverso || item.advogado || "Não Informado"}
                      </td>
                    </tr>
                  );
                })}
                {acervo.length === 0 && (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-gray-500 font-inter text-sm bg-black/20">
                      Nenhum processo localizado no banco de dados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Passo 4: Painel Lateral (Dossiê Analítico) */}
      {isPanelOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity"
          onClick={() => setIsPanelOpen(false)}
        />
      )}

      <aside className={`fixed inset-y-0 right-0 w-full md:w-[600px] bg-[#0B1120] border-l border-gray-800 p-8 shadow-2xl z-50 transform transition-transform duration-300 ${isPanelOpen ? 'translate-x-0' : 'translate-x-[100%]'}`}>
        <button 
          onClick={() => setIsPanelOpen(false)}
          className="absolute top-6 right-6 p-2 rounded-full hover:bg-white/5 text-gray-500 hover:text-white transition-all"
        >
          <X className="w-6 h-6" />
        </button>

        {selectedProcess && (
          <div className="h-full flex flex-col space-y-10">
            <div className="space-y-2">
              <span className="text-[10px] uppercase font-bold tracking-[0.4em] text-[#D4AF37]">Dossiê Analítico</span>
              <h2 className="font-cinzel text-3xl font-bold text-white tracking-wide">
                {selectedProcess.reclamante}
              </h2>
              <p className="font-mono text-xs text-gray-500 tracking-widest">
                CNJ: {selectedProcess.numero_cnj || selectedProcess.processo}
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-[#D4AF37]/20 pb-2">
                <Gavel className="w-4 h-4 text-[#D4AF37]" />
                <h3 className="text-xs font-cinzel font-bold text-[#D4AF37] tracking-[0.2em] uppercase">Identificação</h3>
              </div>
              
              <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                <div className="space-y-1">
                  <p className="text-[9px] uppercase tracking-widest text-gray-500">Unidade Operacional</p>
                  <p className="text-sm font-inter text-white">{selectedProcess.unidade || '-'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[9px] uppercase tracking-widest text-gray-500">Comarca</p>
                  <p className="text-sm font-inter text-white">{selectedProcess.comarca || '-'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[9px] uppercase tracking-widest text-gray-500">Juízo / Vara</p>
                  <p className="text-sm font-inter text-white">{selectedProcess.vara || '-'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[9px] uppercase tracking-widest text-gray-500">Advogado Responsável</p>
                  <p className="text-sm font-inter text-white">{selectedProcess.advogado_adverso || selectedProcess.advogado || '-'}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-[#D4AF37]/20 pb-2">
                <Clock className="w-4 h-4 text-[#D4AF37]" />
                <h3 className="text-xs font-cinzel font-bold text-[#D4AF37] tracking-[0.2em] uppercase">Trâmite Processual</h3>
              </div>

              <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                <div className="space-y-1">
                  <p className="text-[9px] uppercase tracking-widest text-gray-500">Status Atual</p>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${(selectedProcess.fase_atual || selectedProcess.status_geral) === 'Aguardando Pagamento' ? 'bg-green-500' : 'bg-blue-500'}`} />
                    <p className="text-sm font-inter text-white">{selectedProcess.fase_atual || selectedProcess.status_geral || '-'}</p>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-[9px] uppercase tracking-widest text-gray-500">Próxima Agenda</p>
                  <p className="text-sm font-inter text-white leading-relaxed">
                    Audiência em {selectedProcess.dataAudiencia || '-'}<br />
                    às {selectedProcess.horaAudiencia || '-'}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-auto pt-8 border-t border-gray-800 flex gap-4">
              <button className="flex-1 py-3 bg-[#D4AF37] text-black font-cinzel font-bold text-xs tracking-widest rounded hover:bg-yellow-600 transition-colors flex items-center justify-center gap-2 relative overflow-hidden group">
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out" />
                <FileText className="w-4 h-4 relative z-10" />
                <span className="relative z-10">BAIXAR DOSSIÊ PDF</span>
              </button>
              <button className="px-4 py-3 border border-gray-800 text-gray-400 hover:text-white transition-all rounded hover:bg-white/5">
                <ExternalLink className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}
