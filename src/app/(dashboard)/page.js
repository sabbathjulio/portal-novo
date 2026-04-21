"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
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
  Clock,
  Database
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

// Micro-Card Utilitário
const KPICard = ({ title, value, subtitle, icon: Icon, trend, href }) => {
  const content = (
    <div className="bg-stitch-white border border-slate-200 rounded-md p-5 flex flex-col justify-between shadow-sm hover:shadow-md hover:border-slate-300 transition-all group h-full">
      <div className="flex justify-between items-start mb-4">
        <div className="p-2 bg-stitch-bg rounded border border-slate-100 group-hover:bg-rose-50 transition-colors">
          <Icon className="w-5 h-5 text-slate-500 group-hover:text-stitch-burgundy transition-colors" />
        </div>
        {trend && (
          <span className="flex items-center text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded uppercase tracking-wider">
            {trend} <ArrowUpRight className="w-3 h-3 ml-1" />
          </span>
        )}
      </div>
      
      <div>
        <h3 className="font-newsreader text-3xl font-bold text-slate-900 tracking-tight">{value}</h3>
        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mt-1">
          {title}
        </p>
        {subtitle && <p className="text-[10px] text-slate-400 mt-1">{subtitle}</p>}
      </div>
    </div>
  );

  return href ? <Link href={href} className="block">{content}</Link> : content;
};

// Tabela Densa "Farol de Documentos"
const DocumentRow = ({ doc, empresa, reclamante, status, dueDate }) => {
  const getStatusStyle = (s) => {
    switch (s) {
      case 'Pendência Crítica': return 'bg-rose-100/50 text-stitch-burgundy border-rose-200';
      case 'Revisão Necessária': return 'bg-amber-100/50 text-amber-800 border-amber-200';
      default: return 'bg-slate-100 text-slate-600 border-slate-200';
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
    <tr className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
      <td className="py-4 px-5">
        <p className="text-sm font-semibold text-slate-800">{doc}</p>
        <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mt-0.5">{reclamante}</p>
      </td>
      <td className="py-4 px-5 text-xs text-slate-600">{empresa}</td>
      <td className="py-4 px-5">
        <span className={`inline-flex items-center px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border ${getStatusStyle(status)}`}>
          {getStatusIcon(status)} {status}
        </span>
      </td>
      <td className="py-4 px-5 text-xs font-mono text-slate-500 text-right">
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
          <h1 className="font-newsreader text-4xl font-bold tracking-tight text-slate-900">Visão Geral Operacional</h1>
          <p className="text-xs text-slate-500 mt-1 uppercase tracking-widest font-bold">Resumo Estratégico Bernardes Corp</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard title="Acervo Ativo" value={stats.processos} subtitle="Processos em andamento" icon={Building2} trend="+3%" href="/processos" />
        <KPICard title="Riscos provisionados" value={formatBRL(stats.financeiroValor)} subtitle="Acordos e Liquidações" icon={Wallet} href="/financeiro" />
        <KPICard title="Pauta Semanal" value={stats.pauta} subtitle="Audiências em D-7" icon={CalendarDays} href="/pauta" />
        <KPICard title="Pendências" value={stats.farol} subtitle="Auditoria Documental" icon={FileWarning} trend="+2 Críticas" href="/farol" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <h2 className="text-sm font-bold uppercase tracking-widest text-slate-800 flex items-center gap-2">
              <FileWarning className="w-4 h-4 text-stitch-burgundy" />
              Farol de Documentos
            </h2>
            <div className="flex gap-2">
              <button className="p-1.5 text-slate-400 hover:text-slate-600 border border-slate-200 rounded bg-stitch-white transition-colors">
                <Search className="w-3.5 h-3.5" />
              </button>
              <button className="p-1.5 text-slate-400 hover:text-slate-600 border border-slate-200 rounded bg-stitch-white transition-colors">
                <Filter className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          
          <div className="bg-stitch-white rounded-md border border-slate-200 overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-stitch-sidebar border-b border-slate-200 text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                  <th className="py-3 px-5 w-5/12 font-bold tracking-widest">Evidência Faltante / Reclamante</th>
                  <th className="py-3 px-5 w-3/12 font-bold tracking-widest">Localidade</th>
                  <th className="py-3 px-5 w-3/12 font-bold tracking-widest">Status de Risco</th>
                  <th className="py-3 px-5 w-1/12 font-bold tracking-widest text-right">Prazo</th>
                </tr>
              </thead>
              <tbody>
                {farolDocs.map(doc => <DocumentRow key={doc.id} {...doc} />)}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <h2 className="text-sm font-bold uppercase tracking-widest text-slate-800">Alertas do Sistema</h2>
          </div>
          <div className="bg-stitch-white rounded-md border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="flex gap-3">
               <div className="mt-0.5 w-2 h-2 rounded-full bg-rose-600 animate-pulse shrink-0" />
               <div>
                  <p className="text-xs font-bold text-slate-800 uppercase tracking-wide">Sincronização PJe (TRT-2)</p>
                  <p className="text-[11px] text-slate-500 mt-1">Instabilidade detectada na extração de pautas do TRT-2. O Radar reagendará a varredura em 15 minutos.</p>
               </div>
            </div>
            <div className="h-px bg-slate-100" />
            <div className="flex gap-3">
               <div className="mt-0.5 w-2 h-2 rounded-full bg-amber-500 shrink-0" />
               <div>
                  <p className="text-xs font-bold text-slate-800 uppercase tracking-wide">Backup de Dossiês</p>
                  <p className="text-[11px] text-slate-500 mt-1">A compressão dos PDFs de processos encerrados este mês concluiu com retenção no Cold Storage.</p>
               </div>
            </div>
            
            <div className="pt-2 mt-4 border-t border-slate-100">
               <Link href="/admin/sincronizador" className="w-full py-2.5 flex items-center justify-center gap-2 rounded text-[10px] font-bold text-slate-500 uppercase tracking-widest hover:text-stitch-burgundy hover:bg-slate-50 transition-all border border-transparent hover:border-slate-200">
                  <Database size={12} /> Verificar Sincronia
               </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
