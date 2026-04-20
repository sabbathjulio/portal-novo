"use client";

import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  TrendingUp, TrendingDown, Filter, ChevronDown, ChevronUp,
  Download, Printer, FileSpreadsheet, Search, User, 
  MapPin, Briefcase, Calculator, Layers, PieChart,
  FolderCheck, Scale, X, Blinds, RefreshCw, BarChart3,
  Database, LayoutGrid
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import * as XLSX from 'xlsx';
import { supabase } from '@/lib/supabase';

// Registrar componentes do Chart.js
ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement, 
  BarElement, ArcElement, Title, Tooltip, Legend, Filler
);

export default function AnalyticsPage() {
  // Passo 1: Estados e Lógica Transversal
  const [acervoAnalytics, setAcervoAnalytics] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isFiltersOpen, setIsFiltersOpen] = useState(true);
  const [isChartsVisible, setIsChartsVisible] = useState(true);
  const [sortKey, setSortKey] = useState('valor');
  const [sortDir, setSortDir] = useState('desc');
  const [selectedItem, setSelectedItem] = useState(null);
  const [filterValues, setFilterValues] = useState({
    patrono: "",
    reclamante: "",
    unidade: "TODAS",
    funcao: "TODAS"
  });

  // Função utilitária para cálculo de meses de vínculo
  const calcularMeses = (inicio, fim) => {
    if (!inicio) return 1;
    const d1 = new Date(inicio);
    const d2 = fim ? new Date(fim) : new Date();
    const diff = (d2.getFullYear() - d1.getFullYear()) * 12 + (d2.getMonth() - d1.getMonth());
    return Math.max(1, diff);
  };

  // Passo 2: Fetch e Transformação (O Motor de Dados)
  const fetchAnalytics = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('processos')
      .select(`
        numero_cnj, 
        reclamante, 
        funcao, 
        unidade, 
        vara,
        advogado_adverso, 
        data_admissao, 
        data_demissao, 
        sentenca, 
        comentarios_anotacoes,
        financeiro(valor_acordo, updated_at)
      `);

    if (!error && data) {
      const acervoFormatado = data.map(item => {
        // 1. Extração segura de valor (Tratando Array vs Objeto)
        let valorFinal = 0;
        let dAcordo = "N/A";
        if (item.financeiro) {
          if (Array.isArray(item.financeiro) && item.financeiro.length > 0) {
            valorFinal = Number(item.financeiro[0].valor_acordo) || 0;
            dAcordo = item.financeiro[0].updated_at ? item.financeiro[0].updated_at.slice(0, 7) : "N/A";
          } else if (!Array.isArray(item.financeiro)) {
            valorFinal = Number(item.financeiro.valor_acordo) || 0;
            dAcordo = item.financeiro.updated_at ? item.financeiro.updated_at.slice(0, 7) : "N/A";
          }
        }

        // 2. Cálculo de meses protegido contra NaN / Divisão por Zero
        let mesesVinculo = 1; 
        if (item.data_admissao && item.data_demissao) {
            const start = new Date(item.data_admissao);
            const end = new Date(item.data_demissao);
            const diffTime = Math.abs(end - start);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            mesesVinculo = Math.max(1, Math.round(diffDays / 30));
        }

        return {
          id: item.numero_cnj,
          processo: item.numero_cnj || 'N/A',
          reclamante: item.reclamante || 'Não Informado',
          funcao: item.funcao || 'Não informada',
          unidade: item.unidade || 'Não informada',
          advogado: item.advogado_adverso || 'Não informado',
          valor: valorFinal,
          meses: mesesVinculo,
          sentenca: item.sentenca || "N/A",
          obs: item.comentarios_anotacoes || "N/A",
          dataAcordo: dAcordo,
          vara: item.vara || 'Vara não informada'
        };
      });
      setAcervoAnalytics(acervoFormatado);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const formatBRL = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  // Filtros Dinâmicos baseados no estado REAL
  const filteredData = useMemo(() => {
    return acervoAnalytics.filter(item => {
      const matchPatrono = item.advogado?.toLowerCase().includes(filterValues.patrono.toLowerCase());
      const matchReclamante = item.reclamante?.toLowerCase().includes(filterValues.reclamante.toLowerCase());
      const matchUnidade = filterValues.unidade === "TODAS" || item.unidade === filterValues.unidade;
      const matchFuncao = filterValues.funcao === "TODAS" || item.funcao === filterValues.funcao;
      return matchPatrono && matchReclamante && matchUnidade && matchFuncao;
    }).sort((a, b) => {
      let valA = a[sortKey];
      let valB = b[sortKey];
      if (sortKey === 'custoMes') {
          valA = a.valor / a.meses;
          valB = b.valor / b.meses;
      }
      if (typeof valA === 'string') {
        return sortDir === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return sortDir === 'asc' ? valA - valB : valB - valA;
    });
  }, [acervoAnalytics, filterValues, sortKey, sortDir]);

  // Lógica da Matriz Pivot (Bússola) baseada no estado REAL
  const pivotMatrix = useMemo(() => {
    if (acervoAnalytics.length === 0) return { matrix: [], funcs: [], unids: [] };
    
    // Filtro Anti-Zero: Usar apenas processos com valor > 0 para enxugar a matriz
    const dadosValidos = acervoAnalytics.filter(x => (Number(x.valor) || 0) > 0);
    
    const funcs = [...new Set(dadosValidos.map(x => x.funcao))].filter(Boolean).sort();
    const unids = [...new Set(dadosValidos.map(x => x.unidade))].filter(Boolean).sort();
    
    const matrix = funcs.map(f => {
      const row = { funcao: f };
      unids.forEach(u => {
        const matches = dadosValidos.filter(x => x.funcao === f && x.unidade === u);
        if (matches.length === 0) {
          row[u] = { media: 0, count: 0 };
        } else {
          const sum = matches.reduce((acc, curr) => acc + ( (Number(curr.valor) || 0) / (curr.meses || 1) ), 0);
          row[u] = { media: sum / matches.length, count: matches.length };
        }
      });
      return row;
    });
    return { matrix, funcs, unids };
  }, [acervoAnalytics]);

  // Stats / KPIs baseados no estado REAL
  const stats = useMemo(() => {
    const totalDesembolso = filteredData.reduce((acc, curr) => acc + (Number(curr.valor) || 0), 0);
    const ticketMedio = filteredData.length > 0 ? totalDesembolso / filteredData.length : 0;
    const custoMesGeral = filteredData.reduce((acc, curr) => acc + ( (Number(curr.valor) || 0) / (curr.meses || 1) ), 0) / (filteredData.length || 1);
    
    // Comparativo Global
    const totalMesesBase = acervoAnalytics.length > 0 ? acervoAnalytics.reduce((acc, curr) => acc + ( (Number(curr.valor) || 0) / (curr.meses || 1) ), 0) / acervoAnalytics.length : 0;
    const desvio = custoMesGeral > totalMesesBase ? "up" : "down";

    return { total: totalDesembolso, ticket: ticketMedio, custoMes: custoMesGeral, desvio };
  }, [filteredData, acervoAnalytics]);

  // Configuração de Gráficos (Chart.js) baseados no estado REAL
  const timelineData = useMemo(() => {
    const months = [...new Set(filteredData.map(x => x.dataAcordo))].filter(m => m !== "N/A").sort();
    const data = months.map(m => filteredData.filter(x => x.dataAcordo === m).reduce((a, c) => a + c.valor, 0));
    return {
      labels: months,
      datasets: [{
        label: 'Desembolsos',
        data: data,
        borderColor: '#D4AF37',
        backgroundColor: 'rgba(212, 175, 55, 0.1)',
        fill: true,
        tension: 0.4
      }]
    };
  }, [filteredData]);

  const donutData = useMemo(() => {
    const uniMap = {};
    filteredData.forEach(d => { if(d.unidade) uniMap[d.unidade] = (uniMap[d.unidade] || 0) + 1; });
    return {
      labels: Object.keys(uniMap),
      datasets: [{
        data: Object.values(uniMap),
        backgroundColor: ['#9E7C2F', '#C6A85A', '#E3C986', '#D4AF37', '#B8860B'],
        borderWidth: 0,
        hoverOffset: 15
      }]
    };
  }, [filteredData]);

  const rankingData = useMemo(() => {
    const advMap = {};
    filteredData.forEach(d => { if(d.advogado) advMap[d.advogado] = (advMap[d.advogado] || 0) + d.valor; });
    const sorted = Object.entries(advMap).sort((a, b) => b[1] - a[1]).slice(0, 5);
    return {
      labels: sorted.map(x => x[0]),
      datasets: [{
        label: 'Valor Total',
        data: sorted.map(x => x[1]),
        backgroundColor: 'rgba(212, 175, 55, 0.8)',
        borderRadius: 5
      }]
    };
  }, [filteredData]);

  // Motores de Saída
  const exportarExcel = () => {
    const ws = XLSX.utils.json_to_sheet(filteredData.map(d => ({
        Reclamante: d.reclamante,
        Processo: d.processo,
        Função: d.funcao,
        Unidade: d.unidade,
        Patrono: d.advogado,
        Valor: d.valor,
        Vínculo: d.meses + " meses"
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Acordos");
    XLSX.writeFile(wb, "Relatorio_Acordos_Bernardes.xlsx");
  };

  // UI de Loading (Esqueleto Premium)
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
        <div className="p-8 bg-white/5 rounded-full border border-white/10 animate-pulse">
           <Database size={64} className="text-[#D4AF37]" />
        </div>
        <div className="space-y-2">
           <h1 className="font-cinzel text-3xl font-bold text-[#D4AF37] tracking-[0.3em] uppercase">Sincronizando BI</h1>
           <p className="text-gray-500 font-inter text-sm max-w-sm mx-auto uppercase tracking-widest">Compilando matrizes relacionais e indicadores estratégicos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Classe para Impressão Isolada do Dossiê */}
      <style>{`
        @media print {
          .print-dossie-only main > *:not(.modal-is-open) { display: none !important; }
          .print-dossie-only .modal-is-open { position: static !important; display: block !important; padding: 0 !important; width: 100% !important; max-width: 100% !important; }
          .print-dossie-only .modal-content { border: none !important; box-shadow: none !important; background: white !important; color: black !important; }
          .print-dossie-only .modal-content * { color: black !important; border-color: #ddd !important; }
          .print-dossie-only .riscometer-fill { background: black !important; }
        }
      `}</style>

      {/* Header Section */}
      <div className="print:hidden flex justify-between items-center bg-white/2 p-6 rounded-2xl border border-white/5">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-[#D4AF37]/10 rounded-xl">
             <BarChart3 className="text-[#D4AF37] w-8 h-8" />
          </div>
          <div>
            <h1 className="font-cinzel text-3xl font-bold text-[#D4AF37] tracking-wider uppercase">Acordos & Sentenças</h1>
            <p className="text-gray-500 text-xs tracking-widest uppercase">Inteligência de Negociação e Performance</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={fetchAnalytics} className="p-3 bg-white/5 rounded-xl text-gray-400 hover:text-white transition-colors border border-white/5">
            <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
          </button>
          <button onClick={exportarExcel} className="px-6 py-3 bg-[#D4AF37] text-black font-cinzel font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-[#B8860B] transition-all flex items-center gap-2 shadow-lg shadow-[#D4AF37]/10">
            <FileSpreadsheet size={16} /> Exportar Relatório
          </button>
        </div>
      </div>

      {/* Filtros Accordion */}
      <div className="print:hidden glassmorphism rounded-2xl border border-white/10 overflow-hidden transition-all duration-500">
        <button onClick={() => setIsFiltersOpen(!isFiltersOpen)} className="w-full flex justify-between items-center p-6 bg-white/2 hover:bg-white/5 transition-colors">
          <span className="font-cinzel text-xs font-bold text-[#D4AF37] tracking-[0.2em] uppercase flex items-center gap-2">
            <Filter size={14} /> Filtros Analíticos
          </span>
          {isFiltersOpen ? <ChevronUp className="text-gray-500" /> : <ChevronDown className="text-gray-500" />}
        </button>
        {isFiltersOpen && (
          <div className="p-8 grid grid-cols-1 md:grid-cols-4 gap-6 animate-in slide-in-from-top-2 duration-300">
            <div className="space-y-2">
              <label className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Patrono Adverso</label>
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 group-focus-within:text-[#D4AF37] transition-colors" />
                <input 
                  type="text" 
                  value={filterValues.patrono}
                  onChange={(e) => setFilterValues(prev => ({...prev, patrono: e.target.value}))}
                  placeholder="Nome do escritório..."
                  className="w-full bg-black/40 border border-white/10 p-3 pl-10 rounded-xl text-xs text-white focus:border-[#D4AF37]/50 outline-none transition-all"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Reclamante</label>
              <div className="relative group">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 group-focus-within:text-[#D4AF37] transition-colors" />
                <input 
                  type="text" 
                  value={filterValues.reclamante}
                  onChange={(e) => setFilterValues(prev => ({...prev, reclamante: e.target.value}))}
                  placeholder="Busca por nome..."
                  className="w-full bg-black/40 border border-white/10 p-3 pl-10 rounded-xl text-xs text-white focus:border-[#D4AF37]/50 outline-none transition-all"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Unidade</label>
              <div className="relative group">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 group-focus-within:text-[#D4AF37] transition-colors" />
                <select 
                  value={filterValues.unidade}
                  onChange={(e) => setFilterValues(prev => ({...prev, unidade: e.target.value}))}
                  className="w-full bg-black/40 border border-white/10 p-3 pl-10 rounded-xl text-xs text-white focus:border-[#D4AF37]/50 outline-none hover:bg-black/60 transition-all appearance-none"
                >
                  <option value="TODAS">TODAS AS UNIDADES</option>
                  {[...new Set(acervoAnalytics.map(x => x.unidade))].filter(Boolean).map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Função</label>
              <div className="relative group">
                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 group-focus-within:text-[#D4AF37] transition-colors" />
                <select 
                  value={filterValues.funcao}
                  onChange={(e) => setFilterValues(prev => ({...prev, funcao: e.target.value}))}
                  className="w-full bg-black/40 border border-white/10 p-3 pl-10 rounded-xl text-xs text-white focus:border-[#D4AF37]/50 outline-none hover:bg-black/60 transition-all appearance-none"
                >
                  <option value="TODAS">TODAS AS FUNÇÕES</option>
                  {[...new Set(acervoAnalytics.map(x => x.funcao))].filter(Boolean).map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Stats Row */}
      <div className="print:hidden grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: "Casos Consolidados", value: filteredData.length, suffix: " Reg.", icon: FolderCheck, color: "text-white" },
          { label: "Ticket Médio", value: formatBRL(stats.ticket), suffix: "", icon: Calculator, color: "text-[#D4AF37]", trend: "Ticket Geral" },
          { label: "Custo Médio Mensal", value: formatBRL(stats.custoMes), suffix: "", icon: Scale, color: "text-[#D4AF37]", trend: stats.desvio === "up" ? "Desvio Acima" : "Abaixo da Média", isTrend: true }
        ].map((s, idx) => (
          <div key={idx} className="glassmorphism p-8 rounded-2xl border border-white/5 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-1 h-full bg-[#D4AF37] opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex justify-between items-start mb-4">
              <s.icon className="text-gray-600 w-5 h-5" />
              {s.isTrend && (
                <div className={`flex items-center gap-1 text-[9px] font-bold px-2 py-1 rounded-full uppercase border ${stats.desvio === 'up' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-green-500/10 text-green-500 border-green-500/20'}`}>
                  {stats.desvio === 'up' ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                  {s.trend}
                </div>
              )}
            </div>
            <p className="text-[10px] text-gray-500 font-cinzel uppercase tracking-[0.2em] mb-1">{s.label}</p>
            <p className={`text-3xl font-bold tracking-tighter ${s.color}`}>{s.value}<span className="text-gray-600 text-sm">{s.suffix}</span></p>
          </div>
        ))}
      </div>

      {/* Toggle Analytics Section */}
      <div className="print:hidden flex justify-between items-center">
        <button onClick={() => setIsChartsVisible(!isChartsVisible)} className="flex items-center gap-2 text-xs font-cinzel font-bold text-[#D4AF37] uppercase tracking-[0.15em] hover:text-white transition-colors">
          <PieChart size={16} /> {isChartsVisible ? "Ocultar Analytics" : "Exibir Painel de Indicadores"}
        </button>
        <button onClick={() => window.print()} className="flex items-center gap-2 text-xs text-gray-500 hover:text-white transition-colors uppercase font-bold tracking-widest">
          <Printer size={16} /> Imprimir Painel
        </button>
      </div>

      {isChartsVisible && (
        <div className="animate-in fade-in zoom-in-95 duration-500 space-y-6">
          <div className="print:hidden grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glassmorphism p-6 rounded-2xl border border-white/5 h-[350px] flex flex-col">
              <h4 className="font-cinzel text-[10px] text-gray-500 text-center uppercase tracking-widest mb-6">Linha do Tempo de Investimento</h4>
              <div className="flex-1 min-h-0">
                <Line 
                  data={timelineData} 
                  options={{ 
                    responsive: true, maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: { y: { grid: { color: 'rgba(255,255,255,0.03)' }, ticks: { color: '#666', font: { size: 9 } } }, x: { grid: { display: false }, ticks: { color: '#666', font: { size: 9 } } } }
                  }} 
                />
              </div>
            </div>
            <div className="glassmorphism p-6 rounded-2xl border border-white/5 h-[350px] flex gap-4">
              <div className="flex-1 flex flex-col">
                <h4 className="font-cinzel text-[10px] text-gray-500 text-center uppercase tracking-widest mb-6">Densidade p/ Unidade</h4>
                <div className="flex-1 min-h-0">
                   <Doughnut 
                     data={donutData} 
                     options={{ 
                       responsive: true, maintainAspectRatio: false, 
                       cutout: '75%', 
                       plugins: { legend: { position: 'right', labels: { color: '#A0A4AA', font: { size: 10, family: 'Inter' }, padding: 15 } } } 
                     }} 
                   />
                </div>
              </div>
            </div>
          </div>

          <div className="print:hidden glassmorphism p-6 rounded-2xl border border-white/5 h-[400px] flex flex-col">
            <h4 className="font-cinzel text-[10px] text-gray-500 text-center uppercase tracking-widest mb-6">Matriz de Risco: Valor por Patrono (Top 5)</h4>
            <div className="flex-1 min-h-0">
              <Bar 
                data={rankingData} 
                options={{ 
                  indexAxis: 'y', 
                  responsive: true, maintainAspectRatio: false,
                  plugins: { legend: { display: false } },
                  scales: { 
                    x: { grid: { color: 'rgba(255,255,255,0.03)' }, ticks: { color: '#666', font: { size: 9 } } }, 
                    y: { grid: { display: false }, ticks: { color: '#FFF', font: { size: 10, weight: 'bold' } } } 
                  }
                }} 
              />
            </div>
          </div>

          {/* Bússola de Negociação (Pivot Matrix) */}
          <div className="glassmorphism p-8 rounded-2xl border border-white/10 ring-1 ring-white/5 shadow-2xl">
            <div className="text-center space-y-2 mb-10">
               <h4 className="font-cinzel text-lg font-bold text-[#D4AF37] uppercase tracking-[0.2em] flex items-center justify-center gap-3">
                 <Layers size={18} /> Bússola de Negociação
               </h4>
               <p className="text-[10px] text-gray-600 uppercase font-bold tracking-widest leading-loose max-w-xl mx-auto">
                 Distribuição de Custo Mensal Médio (Função vs Unidade). <br/>
                 Valores em R$ (Ticket Ativo) / Meses de Vínculo.
               </p>
            </div>
            <div className="overflow-x-auto rounded-xl border border-white/5">
              <table className="w-full min-w-max text-left border-collapse">
                <thead>
                  <tr className="bg-black/40">
                    <th className="p-4 border border-white/5 text-left font-cinzel text-[9px] text-[#D4AF37] uppercase tracking-widest bg-black/60 sticky left-0 z-20">Cargo Funcional</th>
                    {pivotMatrix.unids.map(u => (
                      <th key={u} className="p-4 border border-white/5 font-inter text-[9px] text-gray-500 uppercase tracking-widest text-center min-w-[120px]">{u}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pivotMatrix.matrix.map((row, rIdx) => (
                    <tr key={rIdx} className="hover:bg-white/2 transition-colors">
                      <td className="p-4 border border-white/5 bg-black/40 sticky left-0 z-10">
                        <span className="text-[10px] font-bold text-white uppercase tracking-tight">{row.funcao}</span>
                      </td>
                      {pivotMatrix.unids.map((u, cIdx) => {
                         const cell = row[u];
                         const isHigh = cell.media > stats.custoMes * 1.5;
                         const isLow = cell.media > 0 && cell.media < stats.custoMes * 0.7;
                         return (
                           <td 
                             key={cIdx} 
                             onClick={() => setFilterValues(prev => ({...prev, unidade: u, funcao: row.funcao}))}
                             className={`p-4 border border-white/5 text-center cursor-pointer transition-all hover:brightness-125 hover:scale-[1.02] group ${!cell.count ? 'bg-transparent' : isHigh ? 'bg-red-500/10' : isLow ? 'bg-green-500/10' : 'bg-[#D4AF37]/5'}`}
                           >
                             {cell.count > 0 ? (
                               <div className="space-y-1">
                                 <p className={`text-[13px] font-bold tracking-tighter ${isHigh ? 'text-red-400' : isLow ? 'text-green-400' : 'text-[#D4AF37]'}`}>{formatBRL(cell.media)}</p>
                                 <p className="text-[8px] text-gray-600 font-bold uppercase">Casos: {cell.count}</p>
                               </div>
                             ) : (
                               <span className="text-gray-800 text-[10px] opacity-20">—</span>
                             )}
                           </td>
                         );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Main Data Table */}
      <div className="print:hidden glassmorphism rounded-2xl border border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-white/2 border-b border-white/5 font-cinzel text-[9px] text-[#D4AF37] font-bold uppercase tracking-widest">
                <th className="px-6 py-5 cursor-pointer hover:text-white" onClick={() => { setSortKey('reclamante'); setSortDir(sortDir === 'asc' ? 'desc' : 'asc'); }}>Reclamante & Cargo</th>
                <th className="px-6 py-5 cursor-pointer hover:text-white" onClick={() => { setSortKey('advogado'); setSortDir(sortDir === 'asc' ? 'desc' : 'asc'); }}>Patrono Adverso</th>
                <th className="px-6 py-5">Processo (CNJ)</th>
                <th className="px-6 py-5 cursor-pointer hover:text-white" onClick={() => { setSortKey('valor'); setSortDir(sortDir === 'asc' ? 'desc' : 'asc'); }}>Investimento</th>
                <th className="px-6 py-5 cursor-pointer hover:text-white" onClick={() => { setSortKey('custoMes'); setSortDir(sortDir === 'asc' ? 'desc' : 'asc'); }}>Indice C/M</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredData.map(d => (
                <tr key={d.id} className="hover:bg-white/5 transition-colors group cursor-pointer" onClick={() => setSelectedItem(d)}>
                  <td className="px-6 py-5">
                    <p className="text-sm font-bold text-white uppercase group-hover:text-[#D4AF37] transition-colors">{d.reclamante}</p>
                    <p className="text-[10px] text-gray-500 uppercase font-bold tracking-tight">{d.funcao}</p>
                  </td>
                  <td className="px-6 py-5 text-gray-400 text-sm font-medium">{d.advogado}</td>
                  <td className="px-6 py-5">
                    <p className="font-mono text-xs text-gray-500 mb-1">{d.processo}</p>
                    <span className="text-[9px] bg-white/5 px-2 py-0.5 rounded text-gray-600 uppercase font-bold tracking-widest">{d.unidade}</span>
                  </td>
                  <td className="px-6 py-5 font-bold text-white text-lg tracking-tighter">{formatBRL(d.valor)}</td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                       <span className="font-bold text-gray-300 text-sm">{formatBRL(d.valor / d.meses)}</span>
                       <div className="h-1 w-20 bg-white/5 rounded-full overflow-hidden">
                          <div className={`h-full transition-all duration-1000 ${ (d.valor/d.meses) > stats.custoMes ? 'bg-red-500/40' : 'bg-green-500/40' }`} style={{ width: Math.min(((d.valor/d.meses) / (stats.custoMes * 2)) * 100, 100) + '%' }} />
                       </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Dossie */}
      {selectedItem && (
        <div 
          className={`fixed inset-0 bg-black/90 backdrop-blur-xl z-50 flex items-center justify-center p-4 transition-all duration-300 ${selectedItem ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`} 
          onClick={() => setSelectedItem(null)}
        >
          <div 
            className="bg-[#0B1120] border border-[#D4AF37]/20 w-full max-w-5xl max-h-[90vh] overflow-hidden rounded-3xl shadow-[0_0_100px_rgba(212,175,55,0.05)] flex flex-col modal-is-open"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-10 bg-white/2 border-b border-white/5">
               <div className="flex items-center gap-5">
                  <div className="p-4 bg-[#D4AF37]/10 rounded-2xl">
                    <UserCheck className="text-[#D4AF37] w-8 h-8" />
                  </div>
                  <div>
                    <h2 className="font-cinzel text-2xl font-bold text-white tracking-widest uppercase">{selectedItem.reclamante}</h2>
                    <p className="text-[10px] text-gray-500 uppercase tracking-[0.3em] font-bold">Dossiê Analítico / {selectedItem.processo}</p>
                  </div>
               </div>
               <div className="flex gap-4">
                  <button onClick={() => {
                        document.body.classList.add('print-dossie-only');
                        window.print();
                        setTimeout(() => document.body.classList.remove('print-dossie-only'), 500);
                     }} 
                     className="px-6 py-3 border border-white/10 rounded-xl text-gray-400 font-cinzel font-bold text-[10px] tracking-widest hover:text-white transition-all uppercase flex items-center gap-2"
                  >
                    <Printer size={16} /> Imprimir Dossiê
                  </button>
                  <button onClick={() => setSelectedItem(null)} className="p-3 bg-white/5 rounded-full text-gray-500 hover:text-white hover:bg-red-500/20 transition-all"><X size={24}/></button>
               </div>
            </div>

            <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-2 modal-content">
               <div className="p-12 space-y-10">
                  <div className="grid grid-cols-2 gap-8">
                    {[
                       { label: "Função no Contrato", value: selectedItem.funcao, icon: Briefcase },
                       { label: "Unidade Filial", value: selectedItem.unidade, icon: MapPin },
                       { label: "Tempo de Vínculo", value: selectedItem.meses + " meses", icon: FolderCheck },
                       { label: "Juízo / Vara", value: selectedItem.vara, icon: LayoutGrid },
                    ].map((i, idx) => (
                      <div key={idx} className="space-y-2">
                        <span className="text-[10px] text-gray-600 uppercase font-bold tracking-widest flex items-center gap-2">
                          <i.icon size={12} /> {i.label}
                        </span>
                        <p className="text-sm font-medium text-white uppercase">{i.value}</p>
                      </div>
                    ))}
                  </div>

                  <div className="p-8 bg-white/2 rounded-2xl border border-white/5 space-y-4">
                     <span className="text-[10px] text-[#D4AF37] uppercase font-bold tracking-widest">Resumo da Sentença / Tese Defensiva</span>
                     <div className="h-1 w-20 bg-[#D4AF37]/30 rounded-full" />
                     <p className="text-gray-400 text-sm leading-relaxed italic border-l-2 border-[#D4AF37]/20 pl-6 h-32 overflow-y-auto">
                        "{selectedItem.sentenca}"
                     </p>
                  </div>
                  
                  <div className="space-y-4">
                     <span className="text-[10px] text-gray-600 uppercase font-bold tracking-widest">Anotações Táticas</span>
                     <p className="text-gray-500 text-xs leading-relaxed font-inter">
                        {selectedItem.obs}
                     </p>
                  </div>
               </div>

               <div className="p-12 bg-black/20 space-y-10 flex flex-col justify-between">
                  <div className="space-y-8">
                    <div className="p-10 bg-[#D4AF37]/5 border-2 border-[#D4AF37]/20 rounded-3xl text-center relative overflow-hidden group">
                       <div className="absolute inset-0 bg-gradient-to-br from-[#D4AF37]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                       <span className="text-[10px] text-[#D4AF37] uppercase font-bold tracking-widest mb-4 block">Acordo Homologado</span>
                       <p className="text-5xl font-bold tracking-tight text-white mb-2">{formatBRL(selectedItem.valor)}</p>
                       <p className="text-[9px] text-gray-600 uppercase font-bold tracking-widest">Impacto em 100% da Provisão</p>
                    </div>

                    <div className="p-8 bg-white/2 border border-white/5 rounded-3xl space-y-6">
                        <div className="flex justify-between items-center mb-4">
                           <span className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">Ticket Médio Mensal</span>
                           <span className="text-xl font-bold text-white tracking-tighter">{formatBRL(selectedItem.valor / selectedItem.meses)}</span>
                        </div>
                        
                        <div className="space-y-3">
                           <div className="flex justify-between text-[10px] uppercase font-bold tracking-widest">
                              <span className="text-gray-500">Média Geral: {formatBRL(stats.custoMes)}</span>
                              <span className={ (selectedItem.valor/selectedItem.meses) > stats.custoMes ? 'text-red-500' : 'text-green-500' }>
                                {Math.round(((selectedItem.valor/selectedItem.meses) / (stats.custoMes || 1)) * 100)}% do Piso
                              </span>
                           </div>
                           <div className="h-2 w-full bg-black/60 rounded-full overflow-hidden border border-white/5 p-0.5">
                              <div 
                                className={`h-full rounded-full transition-all duration-1000 riscometer-fill ${ (selectedItem.valor/selectedItem.meses) > stats.custoMes ? 'bg-red-500' : 'bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.3)]' }`} 
                                style={{ width: Math.min(((selectedItem.valor/selectedItem.meses) / (stats.custoMes * 1.5)) * 100, 100) + '%' }} 
                              />
                           </div>
                           <div className="flex justify-between text-[8px] text-gray-700 uppercase font-bold tracking-tighter">
                              <span>Low Impact</span>
                              <span>High Risk Target</span>
                           </div>
                        </div>
                    </div>
                  </div>

                  <div className="p-5 bg-white/5 border border-white/5 rounded-2xl flex items-center gap-4">
                     <User className="text-[#D4AF37] w-5 h-5" />
                     <div>
                        <p className="text-[9px] text-gray-600 uppercase font-bold">Patrono Responsável</p>
                        <p className="text-xs font-bold text-gray-300 uppercase italic">{selectedItem.advogado}</p>
                     </div>
                  </div>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Icones adicionais
const UserCheck = ({ size = 20, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <polyline points="16 11 18 13 22 9" />
  </svg>
);
