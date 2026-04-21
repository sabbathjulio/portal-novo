"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { AlertCircle, FolderOpen, Check, CalendarDays, AlertTriangle } from 'lucide-react';

import FarolTable from './components/FarolTable';
import ProcessModal from './components/ProcessModal';
import { gerarRelatorioPdf } from './lib/generatePdf';

export default function FarolDocsPage() {
  const [busca, setBusca] = useState({ proc: "", rec: "" });
  const [baseFarol, setBaseFarol] = useState([]);
  const [selectedProcess, setSelectedProcess] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    
    async function syncSupabase() {
      if(!isMounted) return;
      setIsLoading(true);
      try {
        const { data, error } = await supabase.from('farol_documentacao').select(`
          numero_cnj, status_farol, is_urgente, checklist_arquivado, observacao_juridica,
          processos ( 
             reclamante, funcao, reu_principal, unidade, data_admissao, data_demissao, fase_atual, status_geral, risco,
             audiencias ( tipo, data_hora )
          )
        `);
        
        if (!error && data && isMounted) {
          const dadosReais = data.map(item => ({
            processo: item.numero_cnj || "S/N",
            reclamante: item.processos?.reclamante || "Nome não cadastrado",
            funcao: item.processos?.funcao || "-",
            audiencias: item.processos?.audiencias || [],
            reu: item.processos?.reu_principal || "-",
            unidade: item.processos?.unidade || "-",
            status: item.status_farol || "Solicitado",
            fase: item.processos?.fase_atual || "Inicial",
            risco: item.processos?.risco || "-",
            admissao: item.processos?.data_admissao || "-",
            demissao: item.processos?.data_demissao || "-",
            obs: item.observacao_juridica || "",
            checklist: item.checklist_arquivado || [],
            urgente: item.is_urgente || false
          }));
          setBaseFarol(dadosReais);
        } else if (error) {
           console.error("Erro no Deep Join:", error);
        }
      } catch(err) {
        console.error("Falha fatal na master", err);
      }
      if(isMounted) setIsLoading(false);
    }
    
    // Initial fetch
    syncSupabase();

    // Reatividade: Supabase Realtime (Opção A)
    const channel = supabase.channel('farol-realtime-matrix')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'processos' }, () => syncSupabase())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'audiencias' }, () => syncSupabase())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'farol_documentacao' }, () => syncSupabase())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'financeiro' }, () => syncSupabase())
      .subscribe();

    // Fallback: Cache Invalidation On Focus (Opção B)
    const handleFocus = () => syncSupabase();
    window.addEventListener('focus', handleFocus);

    return () => {
      isMounted = false;
      window.removeEventListener('focus', handleFocus);
      supabase.removeChannel(channel);
    };
  }, []);

  const filtrados = useMemo(() => {
    return baseFarol.filter(p => {
      return p.processo.toLowerCase().includes(busca.proc.toLowerCase()) &&
             p.reclamante.toLowerCase().includes(busca.rec.toLowerCase());
    });
  }, [baseFarol, busca]);

  // Cálculos de Métricas Visuais
  const ativos = filtrados.filter(f => f.status === 'Solicitado').length;
  const urgentes = filtrados.filter(f => f.urgente).length;
  const enviados = filtrados.filter(f => f.status === 'Enviado').length;

  return (
    <div className="flex flex-col w-full h-full text-slate-800 dark:text-zinc-200 antialiased selection:bg-rose-900/30">
      <div className="flex-1 overflow-y-auto px-2 md:px-8 pb-12 w-full max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
        
        {/* Cabecalho Principal Imperial */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mt-6">
          <div>
            <h2 className="text-3xl font-newsreader font-medium text-slate-900 dark:text-zinc-100 mb-2 tracking-wide italic">Farol de Documentação</h2>
            <p className="text-sm font-inter text-slate-500 dark:text-zinc-400">Ledger de Auditoria e Extração Visual.</p>
          </div>
          <div className="flex gap-3">
             <button className="bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800 text-stitch-burgundy dark:text-stitch-secondary font-inter text-sm font-bold py-2 px-6 rounded-md border border-slate-200 dark:border-zinc-800 transition-all flex items-center gap-2 shadow-sm">
                <AlertCircle size={16} /> Relatório DRE Documental
             </button>
          </div>
        </div>

        {/* Bento Grid Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-[#151515] rounded-xl border border-slate-200 dark:border-zinc-800/80 p-5 flex flex-col justify-between shadow-sm">
             <div className="flex justify-between items-start mb-4">
                <span className="text-xs font-inter uppercase tracking-widest text-slate-500 dark:text-zinc-500 font-bold">Volume Pendente</span>
                <FolderOpen className="text-stitch-burgundy dark:text-stitch-secondary" size={20} />
             </div>
             <div className="flex items-baseline gap-2">
                <span className="text-3xl font-newsreader font-medium text-slate-900 dark:text-zinc-100">{ativos}</span>
                <span className="text-xs font-inter text-slate-400 dark:text-zinc-600">em trâmite</span>
             </div>
          </div>
          <div className="bg-white dark:bg-[#151515] rounded-xl border border-slate-200 dark:border-zinc-800/80 p-5 flex flex-col justify-between shadow-sm">
             <div className="flex justify-between items-start mb-4">
                <span className="text-xs font-inter uppercase tracking-widest text-slate-500 dark:text-zinc-500 font-bold">Concluídos Lote</span>
                <Check className="text-emerald-600 dark:text-emerald-500" size={20} />
             </div>
             <div className="flex items-baseline gap-2">
                <span className="text-3xl font-newsreader font-medium text-slate-900 dark:text-zinc-100">{enviados}</span>
                <span className="text-xs font-inter text-emerald-600 dark:text-emerald-500">aptos para DP</span>
             </div>
          </div>
          <div className="bg-white dark:bg-[#151515] rounded-xl border border-slate-200 dark:border-zinc-800/80 p-5 flex flex-col justify-between shadow-sm">
             <div className="flex justify-between items-start mb-4">
                <span className="text-xs font-inter uppercase tracking-widest text-slate-500 dark:text-zinc-500 font-bold">Urgência Crítica</span>
                <CalendarDays className="text-rose-600 dark:text-red-500" size={20} />
             </div>
             <div className="flex items-baseline gap-2">
                <span className="text-3xl font-newsreader font-medium text-slate-900 dark:text-zinc-100">{urgentes}</span>
                <span className="text-xs font-inter text-rose-600 dark:text-red-500 font-medium">Alpha</span>
             </div>
          </div>
          <div className="bg-rose-50 dark:bg-rose-950/20 rounded-xl border border-rose-200 dark:border-rose-900/30 p-5 flex flex-col justify-between shadow-sm">
             <div className="flex justify-between items-start mb-4">
                <span className="text-xs font-inter uppercase tracking-widest text-rose-700 dark:text-red-400 font-bold">Conformidade Atual</span>
                <AlertTriangle className="text-rose-700 dark:text-red-400" size={20} />
             </div>
             <div className="flex items-baseline gap-2">
                <span className="text-3xl font-newsreader font-medium text-rose-700 dark:text-red-400 flex items-center">
                   {ativos === 0 ? "100" : Math.floor((enviados / (ativos+enviados))*100) || 0}%
                </span>
                <span className="text-xs font-inter text-rose-600 dark:text-rose-500/70 truncate px-2">taxa de sucesso</span>
             </div>
          </div>
        </div>

        {/* Instância Isolada da Table */}
        {isLoading ? (
           <div className="h-64 flex items-center justify-center p-8 bg-white dark:bg-[#151515] rounded-xl border border-slate-200 dark:border-zinc-800/80">
              <p className="text-slate-400 text-xs tracking-widest uppercase">Consultando Motor Relacional Triplo...</p>
           </div>
        ) : (
           <FarolTable 
             processos={filtrados} 
             onLineClick={(p) => setSelectedProcess(p)} 
           />
        )}
      </div>

      {/* Instância Isolada do Modal Responsivo */}
      {selectedProcess && (
        <ProcessModal 
          process={selectedProcess} 
          onClose={() => setSelectedProcess(null)} 
          onSave={(updated) => setBaseFarol(base => base.map(b => b.processo === updated.processo ? updated : b))}
          onPrint={() => gerarRelatorioPdf(selectedProcess, selectedProcess.obs)}
        />
      )}
    </div>
  );
}
