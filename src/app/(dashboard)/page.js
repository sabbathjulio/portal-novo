"use client";

import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  DollarSign, 
  LayoutGrid, 
  Calendar,
  TrendingUp,
  Database,
  ArrowUpRight,
  Clock,
  ChevronRight
} from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

const HubCard = ({ icon: Icon, title, value, info, href, color = "text-[#D4AF37]", delay = "0" }) => (
  <Link href={href} className={`glassmorphism p-8 rounded-2xl group hover:border-[#D4AF37]/40 transition-all duration-500 animate-in fade-in slide-in-from-bottom-4 fill-mode-both`} style={{ animationDelay: `${delay}ms` }}>
    <div className="flex justify-between items-start mb-6">
      <div className={`p-4 bg-white/5 rounded-xl border border-white/10 group-hover:border-[#D4AF37]/30 transition-colors ${color}`}>
        <Icon size={24} />
      </div>
      <div className="p-2 bg-white/5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
        <ArrowUpRight size={16} className="text-[#D4AF37]" />
      </div>
    </div>
    
    <div className="space-y-1">
      <h3 className="text-[10px] uppercase font-bold tracking-[0.2em] text-gray-500 group-hover:text-[#D4AF37] transition-colors">
        {title}
      </h3>
      <div className="text-3xl font-cinzel font-bold text-white tracking-tighter">
        {value}
      </div>
    </div>

    <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between text-[11px] font-inter">
      <span className="text-gray-400 italic">{info}</span>
      <span className="flex items-center gap-1 text-[#D4AF37] font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0">
        Gerenciar <ChevronRight size={12} />
      </span>
    </div>
  </Link>
);

export default function DashboardHome() {
  const [stats, setStats] = useState({
    processos: 0,
    financeiro: 0,
    financeiroValor: 0,
    farol: 0,
    pauta: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchKPIs() {
      setIsLoading(true);
      try {
        // Busca Processos
        const { count: processosCount } = await supabase.from('processos').select('*', { count: 'exact', head: true });
        
        // Busca Financeiro
        const { data: finData } = await supabase.from('financeiro').select('valor_acordo');
        const finTotal = finData?.reduce((acc, curr) => acc + (curr.valor_acordo || 0), 0) || 0;
        
        setStats({
          processos: processosCount || 0,
          financeiro: finData?.length || 0,
          financeiroValor: finTotal,
          farol: 12, // Mock por enquanto
          pauta: 8   // Mock por enquanto
        });
      } catch (err) {
        console.error("Erro ao carregar KPIs:", err);
      }
      setIsLoading(false);
    }
    fetchKPIs();
  }, []);

  const formatBRL = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  return (
    <div className="space-y-10 animate-in fade-in duration-1000">
      <div className="space-y-2">
        <h1 className="font-cinzel text-4xl font-bold text-white tracking-widest uppercase">
          Gestão <span className="text-[#D4AF37]">Estratégica</span>
        </h1>
        <p className="font-inter text-gray-500 max-w-2xl">
          Domínio absoluto e monitoramento em tempo real do acervo jurídico Bernardes Corp.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <HubCard 
          icon={LayoutDashboard} 
          title="Acervo Estratégico" 
          value={isLoading ? "..." : stats.processos} 
          info="Processos ativos no Códex" 
          href="/processos"
          delay="100"
        />
        <HubCard 
          icon={DollarSign} 
          title="Tesouraria" 
          value={isLoading ? "..." : formatBRL(stats.financeiroValor)} 
          info={`${stats.financeiro} acordos registrados`} 
          href="/financeiro"
          color="text-green-500"
          delay="200"
        />
        <HubCard 
          icon={LayoutGrid} 
          title="Farol de Documentos" 
          value={isLoading ? "..." : stats.farol} 
          info="Pendências de auditoria" 
          href="/farol"
          color="text-orange-500"
          delay="300"
        />
        <HubCard 
          icon={Calendar} 
          title="Pauta Semanal" 
          value={isLoading ? "..." : stats.pauta} 
          info="Audiências programadas" 
          href="/pauta"
          color="text-blue-500"
          delay="400"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Atividades Recentes ou Gráfico Simplificado */}
        <div className="lg:col-span-2 glassmorphism rounded-2xl p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <h3 className="font-cinzel text-xs font-bold text-[#D4AF37] tracking-[0.2em] uppercase flex items-center gap-2">
              <TrendingUp size={16} /> Performance de Operação
            </h3>
            <span className="text-[10px] text-gray-500 uppercase tracking-widest">Últimos 30 dias</span>
          </div>
          
          <div className="h-48 flex items-end justify-between gap-4 px-2">
             {[40, 70, 45, 90, 65, 80, 50].map((h, i) => (
               <div key={i} className="flex-1 flex flex-col items-center gap-3 group">
                 <div className="w-full bg-white/5 rounded-t-lg relative overflow-hidden group-hover:bg-[#D4AF37]/20 transition-all duration-500" style={{ height: `${h}%` }}>
                    <div className="absolute inset-0 bg-gradient-to-t from-[#D4AF37]/40 to-transparent translate-y-full group-hover:translate-y-0 transition-transform duration-700" />
                 </div>
                 <span className="text-[9px] text-gray-600 font-bold uppercase tracking-widest">S{i+1}</span>
               </div>
             ))}
          </div>
        </div>

        <div className="glassmorphism rounded-2xl p-8 space-y-6">
          <h3 className="font-cinzel text-xs font-bold text-[#D4AF37] tracking-[0.2em] uppercase flex items-center gap-2 border-b border-white/5 pb-4">
            <Clock size={16} /> Status do Sistema
          </h3>
          <div className="space-y-6">
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 font-inter">
                   <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                   <span className="text-xs text-white">Supabase Bridge</span>
                </div>
                <span className="text-[10px] text-gray-500 font-mono italic">ACTIVE</span>
             </div>
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 font-inter">
                   <div className="w-2 h-2 rounded-full bg-blue-500" />
                   <span className="text-xs text-white">Códex API</span>
                </div>
                <span className="text-[10px] text-gray-500 font-mono italic">SYCHRONIZED</span>
             </div>
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 font-inter">
                   <div className="w-2 h-2 rounded-full bg-[#D4AF37]" />
                   <span className="text-xs text-white">Portal v1.0.4</span>
                </div>
                <span className="text-[10px] text-gray-500 font-mono italic">STABLE</span>
             </div>
          </div>
          
          <div className="mt-8">
            <Link href="/admin/sincronizador" className="w-full py-3 border border-white/10 rounded-xl text-[10px] font-bold text-gray-400 uppercase tracking-widest hover:text-[#D4AF37] hover:border-[#D4AF37]/40 transition-all flex items-center justify-center gap-2">
              <Database size={12} /> Verificar Sincronia
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
