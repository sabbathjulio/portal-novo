"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { 
  FolderOpen, CalendarDays, Users, AlertTriangle, 
  Search, SlidersHorizontal, printer,
  MoreVertical, Check, FileSpreadsheet, X, AlertCircle, ArrowUpLabel
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

const ITENS_PADRAO = {
  admissionais: ["Ficha de Registro", "Contrato de Trabalho", "Opção de Vale Transporte", "Termo de Confidencialidade", "Documentos Pessoais"],
  contrato: ["ASO", "Acordo de Prorrogação", "Advertências", "Comprovantes", "Atestados"],
  financeiro: ["Holerites", "Comprovante Salário", "FGTS"],
  jornada: ["Espelhos de Ponto", "Log Latitude", "Fichas Diárias"]
};

export default function FarolDocsPage() {
  const [busca, setBusca] = useState({ proc: "", rec: "" });
  const [baseFarol, setBaseFarol] = useState([]);
  const [selectedProcess, setSelectedProcess] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const [modalObs, setModalObs] = useState("");
  const [modalOutros, setModalOutros] = useState("");

  useEffect(() => {
    async function syncSupabase() {
      setIsLoading(true);
      try {
        const { data, error } = await supabase.from('farol_documentacao').select(`
          numero_cnj, status_farol, is_urgente, checklist_arquivado, observacao_juridica,
          processos ( reclamante, funcao, reu_principal, unidade, data_admissao, data_demissao, fase_atual, status_geral, risco )
        `);
        if (!error && data) {
          const dadosReais = data.map(item => ({
            processo: item.numero_cnj || "S/N",
            reclamante: item.processos?.reclamante || "Nome não cadastrado",
            funcao: item.processos?.funcao || "-",
            audiencia: "-", // Fantasma (Não existente na base processos original)
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
        }
      } catch(err) {
        console.error("Falha fatal na master", err);
      }
      setIsLoading(false);
    }
    syncSupabase();
  }, []);

  const filtrados = useMemo(() => {
    return baseFarol.filter(p => {
      return p.processo.toLowerCase().includes(busca.proc.toLowerCase()) &&
             p.reclamante.toLowerCase().includes(busca.rec.toLowerCase());
    });
  }, [baseFarol, busca]);

  // Cálculos de Métricas Visuais (Adaptado para o novo Dashboard)
  const ativos = filtrados.filter(f => f.status === 'Solicitado').length;
  const urgentes = filtrados.filter(f => f.urgente).length;
  const enviados = filtrados.filter(f => f.status === 'Enviado').length;

  const handleOpenModal = (p) => {
    setSelectedProcess(p);
    setModalObs(p.obs || "");
    setModalOutros("");
  };

  // Funções de Impressão (Mantidas Intactas do Motor React Original)
  const renderizarChecklistA4 = () => {
    if (!selectedProcess) return null;
    return (
      <div id="checklist-print-area" className="hidden print:block font-serif text-black bg-white left-0 top-0 w-full p-8" style={{fontFamily: "'Times New Roman', Times, serif"}}>
        <div style={{ textAlign: 'center', borderBottom: '2px solid #000', paddingBottom: '15px', marginBottom: '15px' }}>
          <h1 style={{ fontSize: '19px', margin: '0', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 800 }}>CHECKLIST DE DOCUMENTOS – IMPERIAL CORPORATIVO</h1>
          <h2 style={{ fontSize: '11px', margin: '5px 0 0 0', color: '#444', fontWeight: 'normal', letterSpacing: '3px' }}>FAROL DE DOCUMENTAÇÃO JURÍDICA</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', border: '1.5px solid #000', padding: '12px', marginBottom: '20px', fontSize: '11px' }}>
          <div><strong>Reclamante:</strong> {selectedProcess.reclamante}</div>
          <div><strong>Processo (CNJ):</strong> {selectedProcess.processo}</div>
        </div>
        <div style={{ fontStyle: 'italic', padding: '10px', border: '1px solid #000' }}>
           Observação Jurídica: {modalObs || "Nenhuma"}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col w-full h-full text-slate-800 dark:text-zinc-200 antialiased selection:bg-rose-900/30">
      
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #checklist-print-area, #checklist-print-area * { visibility: visible; }
          #checklist-print-area { position: absolute; left: 0; top: 0; width: 100%; }
        }
        .imperial-scroll::-webkit-scrollbar { width: 6px; }
        .imperial-scroll::-webkit-scrollbar-thumb { background: #3f3f46; border-radius: 4px; }
        .imperial-scroll::-webkit-scrollbar-thumb:hover { background: #52525b; }
      `}</style>
      
      <div className="print:hidden flex-1 overflow-y-auto px-2 md:px-8 pb-12 w-full max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
        
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

        {/* Bento Grid Metrics (Clone Imperial Layout) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-[#151515] rounded-lg border border-slate-200 dark:border-zinc-800/80 p-5 flex flex-col justify-between shadow-sm">
             <div className="flex justify-between items-start mb-4">
                <span className="text-xs font-inter uppercase tracking-widest text-slate-500 dark:text-zinc-500 font-bold">Volume Pendente</span>
                <FolderOpen className="text-stitch-burgundy dark:text-stitch-secondary" size={20} />
             </div>
             <div className="flex items-baseline gap-2">
                <span className="text-3xl font-newsreader font-medium text-slate-900 dark:text-zinc-100">{ativos}</span>
                <span className="text-xs font-inter text-slate-400 dark:text-zinc-600">em trâmite</span>
             </div>
          </div>
          <div className="bg-white dark:bg-[#151515] rounded-lg border border-slate-200 dark:border-zinc-800/80 p-5 flex flex-col justify-between shadow-sm">
             <div className="flex justify-between items-start mb-4">
                <span className="text-xs font-inter uppercase tracking-widest text-slate-500 dark:text-zinc-500 font-bold">Concluídos Lote</span>
                <Check className="text-emerald-600 dark:text-emerald-500" size={20} />
             </div>
             <div className="flex items-baseline gap-2">
                <span className="text-3xl font-newsreader font-medium text-slate-900 dark:text-zinc-100">{enviados}</span>
                <span className="text-xs font-inter text-emerald-600 dark:text-emerald-500">aptos para DP</span>
             </div>
          </div>
          <div className="bg-white dark:bg-[#151515] rounded-lg border border-slate-200 dark:border-zinc-800/80 p-5 flex flex-col justify-between shadow-sm">
             <div className="flex justify-between items-start mb-4">
                <span className="text-xs font-inter uppercase tracking-widest text-slate-500 dark:text-zinc-500 font-bold">Urgência Crítica</span>
                <CalendarDays className="text-rose-600 dark:text-red-500" size={20} />
             </div>
             <div className="flex items-baseline gap-2">
                <span className="text-3xl font-newsreader font-medium text-slate-900 dark:text-zinc-100">{urgentes}</span>
                <span className="text-xs font-inter text-rose-600 dark:text-red-500 font-medium">Alpha</span>
             </div>
          </div>
          <div className="bg-rose-50 dark:bg-rose-950/20 rounded-lg border border-rose-200 dark:border-rose-900/30 p-5 flex flex-col justify-between shadow-sm">
             <div className="flex justify-between items-start mb-4">
                <span className="text-xs font-inter uppercase tracking-widest text-rose-700 dark:text-red-400 font-bold">Risco Tático</span>
                <AlertTriangle className="text-rose-700 dark:text-red-400" size={20} />
             </div>
             <div className="flex items-baseline gap-2">
                <span className="text-3xl font-newsreader font-medium text-rose-700 dark:text-red-400 flex items-center">-</span>
                <span className="text-xs font-inter text-rose-600 dark:text-rose-500/70">Aguardando Base Pautas</span>
             </div>
          </div>
        </div>

        {/* Tabela de Alta Densidade (Layout HTML Imperial Convertido) */}
        <div className="bg-white dark:bg-[#151515] rounded-lg border border-slate-200 dark:border-zinc-800/80 shadow-md overflow-hidden flex flex-col min-h-[500px]">
           {/* Barra de Filtros */}
           <div className="p-4 border-b border-slate-200 dark:border-zinc-800 flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50 dark:bg-[#121212]">
              <div className="flex items-center gap-3 w-full sm:w-auto">
                 <div className="relative w-full sm:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500" size={16} />
                    <input 
                      type="text" 
                      placeholder="Filtrar por número ou reclamante..." 
                      value={busca.proc}
                      onChange={e => setBusca({...busca, proc: e.target.value})}
                      className="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-md pl-10 pr-3 py-2 text-sm font-inter text-slate-800 dark:text-zinc-200 focus:ring-1 focus:ring-stitch-burgundy outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-zinc-600"
                    />
                 </div>
                 <button className="p-2 border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-md text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200 transition-colors">
                    <SlidersHorizontal size={18} />
                 </button>
              </div>
           </div>
           
           {/* Grid Container */}
           <div className="overflow-x-auto flex-1 custom-scrollbar">
              <table className="w-full text-left border-collapse min-w-[1000px]">
                 <thead className="sticky top-0 bg-slate-50 dark:bg-zinc-950/90 backdrop-blur z-10 border-b border-slate-200 dark:border-zinc-800/80">
                    <tr>
                       <th className="py-3 px-4 text-[10px] font-inter font-bold text-slate-500 dark:text-zinc-500 uppercase tracking-widest w-10">#</th>
                       <th className="py-3 px-4 text-[10px] font-inter font-bold text-slate-500 dark:text-zinc-500 uppercase tracking-widest cursor-pointer group hover:text-slate-800 dark:hover:text-zinc-300">
                          Processo CNJ
                       </th>
                       <th className="py-3 px-4 text-[10px] font-inter font-bold text-slate-500 dark:text-zinc-500 uppercase tracking-widest cursor-pointer group hover:text-slate-800 dark:hover:text-zinc-300">
                          Reclamante
                       </th>
                       <th className="py-3 px-4 text-[10px] font-inter font-bold text-slate-500 dark:text-zinc-500 uppercase tracking-widest">
                          Fase Jurídica
                       </th>
                       <th className="py-3 px-4 text-[10px] font-inter font-bold text-slate-500 dark:text-zinc-500 uppercase tracking-widest">
                          Requisito Farol
                       </th>
                       <th className="py-3 px-4 text-[10px] font-inter font-bold text-slate-500 dark:text-zinc-500 uppercase tracking-widest text-right">
                          Exigência Base
                       </th>
                       <th className="py-3 px-4 text-[10px] font-inter font-bold text-slate-500 dark:text-zinc-500 uppercase tracking-widest text-center">
                          Auditoria
                       </th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60 font-inter text-sm">
                    {isLoading ? (
                       <tr><td colSpan={7} className="text-center p-12 text-slate-400 text-xs tracking-widest uppercase">Consultando Motor Relacional...</td></tr>
                    ) : filtrados.length === 0 ? (
                       <tr><td colSpan={7} className="text-center p-12 text-slate-400 text-xs tracking-widest uppercase">Nenhum processo inserido na fila primária</td></tr>
                    ) : (
                      filtrados.map((p, idx) => (
                        <tr key={idx} onClick={() => handleOpenModal(p)} className={`hover:bg-slate-50 dark:hover:bg-zinc-800/40 transition-colors cursor-pointer group ${p.urgente ? 'bg-rose-50/50 dark:bg-rose-900/10' : ''}`}>
                           <td className="py-4 px-4 text-xs font-mono text-slate-400">{idx+1}</td>
                           <td className="py-4 px-4">
                              <div className="flex flex-col">
                                 <span className="font-semibold text-slate-800 dark:text-zinc-200 font-mono text-[11px] mb-0.5">{p.processo}</span>
                                 <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 flex items-center gap-1">
                                    <span className={`w-1.5 h-1.5 rounded-full ${p.urgente ? 'bg-rose-500' : 'bg-slate-300 dark:bg-zinc-600'}`}></span>
                                    {p.status}
                                 </span>
                              </div>
                           </td>
                           <td className="py-4 px-4">
                              <div className="flex items-center gap-3">
                                 <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 flex items-center justify-center text-[9px] font-bold text-slate-500 dark:text-zinc-500 uppercase">
                                    {p.reclamante.slice(0,2)}
                                 </div>
                                 <div className="flex flex-col">
                                    <span className="text-slate-800 dark:text-zinc-300 font-medium text-xs">{p.reclamante}</span>
                                    <span className="text-[10px] text-slate-500 dark:text-zinc-500 truncate">{p.funcao}</span>
                                 </div>
                              </div>
                           </td>
                           <td className="py-4 px-4">
                              <span className="inline-flex items-center px-2 py-1 rounded-md text-[9px] uppercase tracking-widest font-bold bg-slate-100 dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 border border-slate-200 dark:border-zinc-800">
                                  {p.fase}
                              </span>
                           </td>
                           <td className="py-4 px-4">
                              <div className="flex flex-col">
                                 {/* Mock Warning da Falta da Data de Audiência */}
                                 <span className="text-slate-400 dark:text-zinc-600 text-xs italic font-serif">Sem Data Atribuída</span>
                              </div>
                           </td>
                           <td className="py-4 px-4 text-right">
                              <div className="flex flex-col items-end">
                                 <span className="text-slate-800 dark:text-zinc-300 font-medium text-xs">{p.checklist.length} docs</span>
                                 <span className="text-[9px] text-slate-400 dark:text-zinc-500 uppercase tracking-widest">anexados</span>
                              </div>
                           </td>
                           <td className="py-4 px-4 text-center">
                              <button className="text-slate-400 dark:text-zinc-600 hover:text-stitch-burgundy hover:bg-rose-50 dark:hover:bg-zinc-800 transition-colors p-1.5 rounded">
                                 <MoreVertical size={16} />
                              </button>
                           </td>
                        </tr>
                      ))
                    )}
                 </tbody>
              </table>
           </div>
        </div>
      </div>

      {/* Modal de Detalhamento Relacional (Mantido e Integrado) */}
      {selectedProcess && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
           <div className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 w-full max-w-4xl max-h-[95vh] overflow-y-auto rounded-xl shadow-2xl flex flex-col">
              <div className="sticky top-0 bg-white dark:bg-[#121212] border-b border-slate-200 dark:border-zinc-800 p-6 flex justify-between items-center z-10">
                 <div>
                    <h2 className="font-newsreader text-2xl font-medium text-slate-900 dark:text-zinc-100 italic">{selectedProcess.reclamante}</h2>
                    <p className="text-[10px] text-slate-500 font-mono tracking-widest uppercase mt-1">{selectedProcess.processo}</p>
                 </div>
                 <button onClick={() => setSelectedProcess(null)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-zinc-900 rounded-full transition-all"><X size={20}/></button>
              </div>

              <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8 bg-slate-50 dark:bg-zinc-950">
                 <div className="space-y-6">
                    <h4 className="text-[10px] text-slate-500 uppercase font-bold tracking-widest border-b border-slate-200 dark:border-zinc-800 pb-2">Central do Subsídio Escopo</h4>
                    {Object.entries(ITENS_PADRAO).map(([cat, itens]) => (
                       <div key={cat} className="space-y-3 bg-white dark:bg-[#151515] p-4 rounded-lg border border-slate-200 dark:border-zinc-800 shadow-sm">
                          <p className="text-[9px] font-bold text-stitch-burgundy dark:text-stitch-secondary uppercase tracking-[0.1em]">{cat}</p>
                          <div className="space-y-2">
                             {itens.map((it, i) => {
                               const isChecked = selectedProcess.checklist?.includes(it);
                               return (
                                 <label key={i} className="flex items-center gap-3 cursor-pointer group">
                                    <input 
                                      type="checkbox" checked={isChecked}
                                      onChange={(e) => {
                                        const newItemList = e.target.checked ? [...selectedProcess.checklist, it] : selectedProcess.checklist.filter(x => x !== it);
                                        setSelectedProcess({...selectedProcess, checklist: newItemList});
                                      }}
                                      className="w-4 h-4 rounded border-slate-300 dark:border-zinc-700 text-stitch-burgundy focus:ring-stitch-burgundy bg-transparent" 
                                    />
                                    <span className={`text-xs ${isChecked ? 'text-slate-800 dark:text-zinc-200' : 'text-slate-500'}`}>{it}</span>
                                 </label>
                               )
                             })}
                          </div>
                       </div>
                    ))}
                 </div>
                 
                 <div className="space-y-6 flex flex-col">
                    <div className="bg-white dark:bg-[#151515] p-6 rounded-lg border border-slate-200 dark:border-zinc-800 shadow-sm space-y-4">
                       <div className="space-y-2">
                          <label className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Observação Jurídica</label>
                          <textarea 
                             rows={4} value={modalObs} onChange={(e) => setModalObs(e.target.value)}
                             className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-3 rounded-md text-xs text-slate-800 dark:text-zinc-300 outline-none focus:ring-1 focus:ring-stitch-burgundy resize-none"
                          />
                       </div>
                       <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                             <label className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Status</label>
                             <select 
                               value={selectedProcess.status} onChange={e => setSelectedProcess({...selectedProcess, status: e.target.value})}
                               className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-2 text-xs rounded-md text-slate-800 dark:text-zinc-300 outline-none"
                             >
                                <option value="Solicitado">Pendente</option>
                                <option value="Enviado">Enviado DP</option>
                             </select>
                          </div>
                          <div className="flex items-end">
                             <label className="flex items-center gap-2 mb-2 cursor-pointer">
                                <input 
                                  type="checkbox" checked={selectedProcess.urgente} onChange={e => setSelectedProcess({...selectedProcess, urgente: e.target.checked})}
                                  className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 border-slate-300 bg-transparent" 
                                />
                                <span className="text-[10px] text-rose-600 font-bold uppercase tracking-widest">Alerta Crítico</span>
                             </label>
                          </div>
                       </div>
                    </div>
                    
                    <div className="mt-auto grid grid-cols-2 gap-4">
                       <button onClick={() => window.print()} className="py-3 border border-slate-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-900 rounded-md text-slate-600 dark:text-zinc-400 text-[10px] font-bold uppercase tracking-widest transition-colors shadow-sm">
                          Imprimir Ficha
                       </button>
                       <button onClick={async () => {
                          try {
                            const p = selectedProcess;
                            await supabase.from('farol_documentacao').update({
                                  status_farol: p.status, is_urgente: p.urgente,
                                  checklist_arquivado: p.checklist, observacao_juridica: modalObs
                            }).eq('numero_cnj', p.processo);
                            
                            setBaseFarol(base => base.map(b => b.processo === p.processo ? {...b, ...p, obs: modalObs} : b));
                            setSelectedProcess(null);
                          } catch (e) {}
                       }} className="py-3 bg-stitch-burgundy text-white rounded-md text-[10px] font-bold uppercase tracking-widest transition-transform hover:scale-[1.02] shadow-md">
                          Salvar Nuvem
                       </button>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
