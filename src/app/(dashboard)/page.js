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
    <div className="bg-stitch-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800/80 rounded-md p-5 flex flex-col justify-between shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-zinc-700 transition-all group h-full">
      <div className="flex justify-between items-start mb-4">
        <div className="p-2 bg-stitch-bg dark:bg-zinc-950 rounded border border-slate-100 dark:border-zinc-800/60 group-hover:bg-rose-50 dark:group-hover:bg-zinc-800 transition-colors">
          <Icon className="w-5 h-5 text-slate-500 dark:text-zinc-500 group-hover:text-stitch-burgundy dark:group-hover:text-stitch-secondary transition-colors" />
        </div>
        {trend && (
          <span className="flex items-center text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-1.5 py-0.5 rounded uppercase tracking-wider">
            {trend} <ArrowUpRight className="w-3 h-3 ml-1" />
          </span>
        )}
      </div>
      
      <div>
        <h3 className="font-newsreader text-3xl font-bold text-slate-900 dark:text-zinc-100 tracking-tight">{value}</h3>
        <p className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest mt-1">
          {title}
        </p>
        {subtitle && <p className="text-[10px] text-slate-400 dark:text-zinc-600 mt-1">{subtitle}</p>}
      </div>
    </div>
  );

  return href ? <Link href={href} className="block">{content}</Link> : content;
};

// Tabela Densa "Farol de Documentos"
const DocumentRow = ({ doc, empresa, reclamante, status, dueDate }) => {
  const getStatusStyle = (s) => {
    switch (s) {
      case 'Pendência Crítica': return 'bg-rose-100/50 text-stitch-burgundy dark:bg-rose-900/20 dark:text-stitch-secondary border-rose-200 dark:border-rose-900/30';
      case 'Revisão Necessária': return 'bg-amber-100/50 text-amber-800 dark:bg-amber-900/20 dark:text-amber-500 border-amber-200 dark:border-amber-900/30';
      default: return 'bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-400 border-slate-200 dark:border-zinc-700';
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
    <tr className="border-b border-slate-100 dark:border-zinc-800/60 hover:bg-slate-50/50 dark:hover:bg-zinc-800/30 transition-colors">
      <td className="py-4 px-5">
        <p className="text-sm font-semibold text-slate-800 dark:text-zinc-200">{doc}</p>
        <p className="text-[10px] uppercase tracking-widest text-slate-500 dark:text-zinc-500 font-bold mt-0.5">{reclamante}</p>
      </td>
      <td className="py-4 px-5 text-xs text-slate-600 dark:text-zinc-400">{empresa}</td>
      <td className="py-4 px-5">
        <span className={`inline-flex items-center px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border ${getStatusStyle(status)}`}>
          {getStatusIcon(status)} {status}
        </span>
      </td>
      <td className="py-4 px-5 text-xs font-mono text-slate-500 dark:text-zinc-500 text-right">
        {dueDate}
      </td>
    </tr>
  );
};

export default function DashboardHome() {
  const [stats, setStats] = useState({ processos: 0, financeiroValor: 0, farol: 0, pauta: 0 });
  const [farolDocs, setFarolDocs] = useState([]);
  const [alertasSistema, setAlertasSistema] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchFromSupabase() {
      setIsLoading(true);
      try {
        // Lendo tudo da base bruta que foi inserida no passado pelo Códex legado
        const { data: processos, error } = await supabase.from('processos').select('*');
        
        if (!error && processos) {
          // 1. Acervo Ativo
          const pb = processos.length;

          // 2. Financeiro (Buscando o campo valor_pago mapeado da antiga Coluna AJ)
          const finTotal = processos.reduce((acc, curr) => {
            const v = parseFloat(curr.valor_pago) || parseFloat(curr.valor_acordo) || parseFloat(curr.valor_acao) || 0;
            return acc + v;
          }, 0);

          // 3. Pauta Semanal (Processos com Data de Audiência Ativa na antiga coluna F)
          const ptCount = processos.filter(p => p.data_audiencia && p.data_audiencia.trim() !== '').length;

          // 4. Farol Docs (A antiga tabela do farol ainda não subiu para nuvem. Aguardando a migração relacional 3NF.)
          const frCount = 0;

          setStats({
            processos: pb,
            financeiroValor: finTotal,
            farol: frCount,
            pauta: ptCount
          });
          
          // Zerando a interface gráfica (Sem Mocks Sujos)
          setFarolDocs([]); 

          // Gerando alertas sistêmicos reais com base no status das tabelas
          setAlertasSistema([
            { id: 1, tipo: 'warning', titulo: 'Infraestrutura de Dados Base', msg: 'A Home está lendo temporariamente do banco unificado legado.', color: 'amber' }
          ]);
        }
      } catch (err) {
        console.error("Falha ao sincronizar KPIs", err);
      }
      setIsLoading(false);
    }
    fetchFromSupabase();
  }, []);

  const formatBRL = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v);

  // Removida: const farolDocs = [{ mock... }]


  if (isLoading) {
    return <div className="h-64 flex items-center justify-center text-sm font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-600 animate-pulse">Sincronizando Matriz...</div>;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-newsreader text-4xl font-bold tracking-tight text-slate-900 dark:text-zinc-100 transition-colors">Visão Geral Operacional</h1>
          <p className="text-xs text-slate-500 dark:text-zinc-500 mt-1 uppercase tracking-widest font-bold">Resumo Estratégico Bernardes Corp</p>
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
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-zinc-800 pb-2">
            <h2 className="text-sm font-bold uppercase tracking-widest text-slate-800 dark:text-zinc-200 flex items-center gap-2">
              <FileWarning className="w-4 h-4 text-stitch-burgundy dark:text-stitch-secondary" />
              Farol de Documentos
            </h2>
            <div className="flex gap-2">
              <button className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 border border-slate-200 dark:border-zinc-800 rounded bg-stitch-white dark:bg-zinc-900 transition-colors">
                <Search className="w-3.5 h-3.5" />
              </button>
              <button className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 border border-slate-200 dark:border-zinc-800 rounded bg-stitch-white dark:bg-zinc-900 transition-colors">
                <Filter className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          
          <div className="bg-stitch-white dark:bg-zinc-900 rounded-md border border-slate-200 dark:border-zinc-800 overflow-hidden shadow-sm transition-colors">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-stitch-sidebar dark:bg-[#151517] border-b border-slate-200 dark:border-zinc-800 text-[10px] font-bold text-slate-600 dark:text-zinc-400 uppercase tracking-wider">
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
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-zinc-800 pb-2">
            <h2 className="text-sm font-bold uppercase tracking-widest text-slate-800 dark:text-zinc-200">Alertas do Sistema</h2>
          </div>
          <div className="bg-stitch-white dark:bg-zinc-900 rounded-md border border-slate-200 dark:border-zinc-800 p-5 shadow-sm space-y-4 transition-colors">
            {alertasSistema.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase">Não há alertas ativos.</p>
              </div>
            ) : (
              alertasSistema.map((alerta, idx) => (
                <div key={alerta.id}>
                  <div className="flex gap-3">
                     <div className={`mt-0.5 w-2 h-2 rounded-full bg-${alerta.color}-500 shrink-0 ${alerta.tipo === 'error' ? 'animate-pulse' : ''}`} />
                     <div>
                        <p className="text-xs font-bold text-slate-800 dark:text-zinc-200 uppercase tracking-wide">{alerta.titulo}</p>
                        <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1">{alerta.msg}</p>
                     </div>
                  </div>
                  {idx < alertasSistema.length - 1 && (
                     <div className="h-px bg-slate-100 dark:bg-zinc-800 mt-4" />
                  )}
                </div>
              ))
            )}
            
            <div className="pt-2 mt-4 border-t border-slate-100 dark:border-zinc-800">
               <Link href="/admin/sincronizador" className="w-full py-2.5 flex items-center justify-center gap-2 rounded text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest hover:text-stitch-burgundy dark:hover:text-stitch-secondary hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-all border border-transparent hover:border-slate-200 dark:hover:border-zinc-700">
                  <Database size={12} /> Verificar Sincronia
               </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
