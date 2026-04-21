"use client";

import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Wallet,
  CalendarDays,
  FileWarning,
  ArrowUpRight,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Clock
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

// Micro-Card Utilitário
const KPICard = ({ title, value, subtitle, icon: Icon, trend }) => (
  <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-md p-5 flex flex-col justify-between shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-zinc-700 transition-all group">
    <div className="flex justify-between items-start mb-4">
      <div className="p-2 bg-slate-50 dark:bg-zinc-950 rounded border border-slate-100 dark:border-zinc-800 group-hover:bg-rose-50 dark:group-hover:bg-rose-900/10 transition-colors">
        <Icon className="w-5 h-5 text-slate-500 dark:text-zinc-500 group-hover:text-rose-800 dark:group-hover:text-rose-600 transition-colors" />
      </div>
      {trend && (
        <span className="flex items-center text-[10px] font-bold text-emerald-600 dark:text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 px-1.5 py-0.5 rounded uppercase tracking-wider">
          {trend} <ArrowUpRight className="w-3 h-3 ml-1" />
        </span>
      )}
    </div>
    
    <div>
      <h3 className="text-2xl font-bold text-slate-800 dark:text-zinc-100 tracking-tight">{value}</h3>
      <p className="text-[11px] font-bold text-slate-500 dark:text-zinc-500 uppercase tracking-widest mt-1">
        {title}
      </p>
      {subtitle && <p className="text-[10px] text-slate-400 dark:text-zinc-600 mt-1">{subtitle}</p>}
    </div>
  </div>
);

// Tabela Densa "Farol de Documentos"
const DocumentRow = ({ doc, empresa, reclamante, status, dueDate }) => {
  const getStatusStyle = (s) => {
    switch (s) {
      case 'Pendência Crítica': return 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800/30';
      case 'Revisão Necessária': return 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800/30';
      default: return 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700';
    }
  };

  const getStatusIcon = (s) => {
    switch (s) {
      case 'Pendência Crítica': return <AlertCircle className="w-3 h-3 mr-1" />;
      case 'Revisão Necessária': return <Clock className="w-3 h-3 mr-1" />;
      default: return <CheckCircle2 className="w-3 h-3 mr-1" />;
    }
  };

  return (
    <tr className="border-b border-slate-100 dark:border-zinc-800 hover:bg-slate-50/50 dark:hover:bg-zinc-900/50 transition-colors">
      <td className="py-3 px-4">
        <p className="text-sm font-semibold text-slate-800 dark:text-zinc-200">{doc}</p>
        <p className="text-[10px] uppercase tracking-widest text-slate-500 dark:text-zinc-500 font-bold mt-0.5">{reclamante}</p>
      </td>
      <td className="py-3 px-4 text-xs text-slate-600 dark:text-zinc-400">{empresa}</td>
      <td className="py-3 px-4">
        <span className={`inline-flex items-center px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border ${getStatusStyle(status)}`}>
          {getStatusIcon(status)} {status}
        </span>
      </td>
      <td className="py-3 px-4 text-xs font-mono text-slate-500 dark:text-zinc-500 text-right">
        {dueDate}
      </td>
    </tr>
  );
};

export default function DashboardHome() {
  const [stats, setStats] = useState({ processos: 0, financeiroValor: 0, farol: 12, pauta: 8 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchKPIs() {
      setIsLoading(true);
      try {
        const { count: pb } = await supabase.from('processos').select('*', { count: 'exact', head: true });
        const { data: fin } = await supabase.from('financeiro').select('valor_acordo');
        const finTotal = fin?.reduce((acc, curr) => acc + (curr.valor_acordo || 0), 0) || 0;
        
        setStats({ processos: pb || 0, financeiroValor: finTotal, farol: 12, pauta: 8 });
      } catch (err) {}
      setIsLoading(false);
    }
    fetchKPIs();
  }, []);

  const formatBRL = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v);

  // Mocks do Farol
  const farolDocs = [
    { id: 1, doc: "Cartão de Ponto (Incompleto)", empresa: "Matriz SPO", reclamante: "João S. Ferreira", status: "Pendência Crítica", dueDate: "Hoje" },
    { id: 2, doc: "TRCT Ausente", empresa: "Filial CWB", reclamante: "Maria C. Almeida", status: "Pendência Crítica", dueDate: "Amanhã" },
    { id: 3, doc: "Atestado Médico Ilegível", empresa: "Matriz SPO", reclamante: "Carlos E. Batista", status: "Revisão Necessária", dueDate: "25/04/2026" },
  ];

  if (isLoading) {
    return <div className="h-64 flex items-center justify-center text-sm font-bold uppercase tracking-widest text-slate-400 animate-pulse">Sincronizando Matriz...</div>;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-zinc-100">Visão Geral Operacional</h1>
          <p className="text-xs text-slate-500 dark:text-zinc-500 mt-1 uppercase tracking-widest font-bold">Resumo Estratégico Bernardes Corp</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard title="Acervo Ativo" value={stats.processos} subtitle="Processos em andamento" icon={Building2} trend="+3%" />
        <KPICard title="Riscos provisionados" value={formatBRL(stats.financeiroValor)} subtitle="Acordos e Liquidações" icon={Wallet} />
        <KPICard title="Pauta Semanal" value={stats.pauta} subtitle="Audiências em D-7" icon={CalendarDays} />
        <KPICard title="Pendências" value={stats.farol} subtitle="Auditoria Documental" icon={FileWarning} trend="+2 Críticas" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-zinc-800 pb-2">
            <h2 className="text-sm font-bold uppercase tracking-widest text-slate-800 dark:text-zinc-200 flex items-center gap-2">
              <FileWarning className="w-4 h-4 text-rose-800 dark:text-rose-600" />
              Farol de Documentos
            </h2>
            <div className="flex gap-2">
              <button className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 border border-slate-200 dark:border-zinc-800 rounded bg-white dark:bg-zinc-900 transition-colors">
                <Search className="w-3.5 h-3.5" />
              </button>
              <button className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 border border-slate-200 dark:border-zinc-800 rounded bg-white dark:bg-zinc-900 transition-colors">
                <Filter className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          
          <div className="bg-white dark:bg-zinc-900 rounded-md border border-slate-200 dark:border-zinc-800 overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-zinc-950 border-b border-slate-200 dark:border-zinc-800 text-[10px] font-bold text-slate-500 dark:text-zinc-500 uppercase tracking-wider">
                  <th className="py-3 px-4 w-5/12">Evidência Faltante / Reclamante</th>
                  <th className="py-3 px-4 w-3/12">Localidade</th>
                  <th className="py-3 px-4 w-3/12">Status de Risco</th>
                  <th className="py-3 px-4 w-1/12 text-right">Prazo</th>
                </tr>
              </thead>
              <tbody>
                {farolDocs.map(doc => <DocumentRow key={doc.id} {...doc} />)}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-zinc-800 pb-2">
            <h2 className="text-sm font-bold uppercase tracking-widest text-slate-800 dark:text-zinc-200">Alertas do Sistema</h2>
          </div>
          <div className="bg-white dark:bg-zinc-900 rounded-md border border-slate-200 dark:border-zinc-800 p-5 shadow-sm space-y-4">
            <div className="flex gap-3">
               <div className="mt-0.5 w-2 h-2 rounded-full bg-rose-500 animate-pulse shrink-0" />
               <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-zinc-200 uppercase tracking-wide">Sincronização PJe (TRT-2)</p>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1">Instabilidade detectada na extração de pautas do TRT-2. O Radar reagendará a varredura em 15 minutos.</p>
               </div>
            </div>
            <div className="h-px bg-slate-100 dark:bg-zinc-800" />
            <div className="flex gap-3">
               <div className="mt-0.5 w-2 h-2 rounded-full bg-amber-500 shrink-0" />
               <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-zinc-200 uppercase tracking-wide">Backup de Dossiês</p>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1">A compressão dos PDFs de processos encerrados este mês concluiu com retenção no Cold Storage.</p>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
