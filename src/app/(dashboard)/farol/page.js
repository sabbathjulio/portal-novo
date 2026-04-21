"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { 
  LayoutGrid, RefreshCw, Printer, Search, Hash, 
  User, Briefcase, Calendar, Clock, Building2, 
  MapPin, CheckCircle, MessageSquare, X, Gavel,
  AlertCircle, Check, Map as MapIcon, Filter,
  FileSpreadsheet
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

const ITENS_PADRAO = {
  admissionais: [
    "Ficha de Registro", 
    "Contrato de Trabalho", 
    "Opção de Vale Transporte", 
    "Termo de Confidencialidade", 
    "Documentos Pessoais (RG/CPF)"
  ],
  contrato: [
    "ASO (Admissional/Periódico)", 
    "Acordo de Prorrogação/Compensação", 
    "Advertências / Suspensões", 
    "Comprovante de Multas / Sinistros", 
    "Atestados Médicos", 
    "PPP (Perfil Previdenciário)"
  ],
  financeiro: [
    "Holerites / Extratos de Pagamento", 
    "Comprovante Pagamento Salário", 
    "Comprovante Depósito FGTS"
  ],
  jornada: [
    "Espelhos de Ponto", 
    "Ponto Certificado", 
    "Fichas Diárias (Motoristas)", 
    "Relatórios de Log (Latitude/Longitude)"
  ]
};

export default function FarolDocsPage() {
  const [busca, setBusca] = useState({
    proc: "", rec: "", fun: "", data: "", reu: "", uni: "", status: ""
  });
  const [baseFarol, setBaseFarol] = useState([]);
  const [selectedProcess, setSelectedProcess] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const [modalObs, setModalObs] = useState("");
  const [modalOutros, setModalOutros] = useState("");

  // Extrator Real do Supabase substituindo os Mocks (Motor Relacional JOIN)
  useEffect(() => {
    async function syncSupabase() {
      setIsLoading(true);
      try {
        const { data, error } = await supabase.from('farol_documentacao').select(`
          numero_cnj, status_farol, is_urgente, checklist_arquivado, observacao_juridica,
          processos ( reclamante, funcao, reu_principal, unidade, data_admissao, data_demissao )
        `);

        if (!error && data) {
          const dadosReais = data.map(item => ({
            processo: item.numero_cnj || "S/N",
            reclamante: item.processos?.reclamante || "Nome não cadastrado",
            funcao: item.processos?.funcao || "-",
            audiencia: "-", // Reservado temporalmente até a tabela de Pautas ser ativada
            reu: item.processos?.reu_principal || "-",
            unidade: item.processos?.unidade || "-",
            status: item.status_farol || "Solicitado",
            admissao: item.processos?.data_admissao || "-",
            demissao: item.processos?.data_demissao || "-",
            obs: item.observacao_juridica || "",
            checklist: item.checklist_arquivado || [],
            urgente: item.is_urgente || false
          }));
          
          // Renderiza na tela removendo Mocks
          setBaseFarol(dadosReais);
        } else if (error) {
           console.error("Falha no cross-join relacional:", error);
        }
      } catch(err) {
        console.error("Falha fatal na master", err);
      }
      setIsLoading(false);
    }
    syncSupabase();
  }, []);

  const calcularPrazo = (dataAud) => {
    if (!dataAud || dataAud === "-") return { text: "-", color: "text-slate-400 dark:text-zinc-600" };
    const pt = dataAud.split('/');
    if (pt.length !== 3) return { text: "-", color: "text-slate-400 dark:text-zinc-600" };
    
    const dAud = new Date(pt[2], pt[1] - 1, pt[0]);
    const dHoje = new Date();
    dHoje.setHours(0, 0, 0, 0);
    dAud.setHours(0, 0, 0, 0);
    
    const diff = Math.ceil((dAud - dHoje) / (86400000));
    
    if (diff < 0) return { text: "VENCIDO", color: "text-rose-600 dark:text-rose-500", icon: true };
    if (diff === 0) return { text: "É HOJE", color: "text-amber-600 dark:text-amber-500", icon: false };
    if (diff <= 5) return { text: `⚠️ ${diff} DIAS`, color: "text-stitch-burgundy dark:text-stitch-secondary", icon: false };
    return { text: `FALTAM ${diff} DIAS`, color: "text-slate-400 dark:text-zinc-500", icon: false };
  };

  const filtrados = useMemo(() => {
    return baseFarol.filter(p => {
      return p.processo.toLowerCase().includes(busca.proc.toLowerCase()) &&
             p.reclamante.toLowerCase().includes(busca.rec.toLowerCase()) &&
             p.funcao.toLowerCase().includes(busca.fun.toLowerCase()) &&
             p.audiencia.toLowerCase().includes(busca.data.toLowerCase()) &&
             p.reu.toLowerCase().includes(busca.reu.toLowerCase()) &&
             p.unidade.toLowerCase().includes(busca.uni.toLowerCase()) &&
             (busca.status === "" || p.status === busca.status);
    });
  }, [baseFarol, busca]);

  const stats = useMemo(() => {
    const pend = filtrados.filter(x => x.status !== 'Enviado').length;
    const env = filtrados.filter(x => x.status === 'Enviado').length;
    return { pend, env, total: filtrados.length };
  }, [filtrados]);

  const handleOpenModal = (p) => {
    setSelectedProcess(p);
    setModalObs(p.obs || "");
    setModalOutros("");
  };

  const renderizarChecklistA4 = () => {
    if (!selectedProcess) return null;
    const p = selectedProcess;

    const parseData = (str) => {
      if (!str || str === "-") return null;
      const pt = str.split('/');
      return pt.length === 3 ? new Date(pt[2], pt[1] - 1, 1) : null;
    };

    const dAdm = parseData(p.admissao);
    const dDem = parseData(p.demissao);

    let matrizMesesRow = null;

    if (dAdm && dDem) {
      let aIni = dAdm.getFullYear();
      let aFim = dDem.getFullYear();
      const meses = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
      
      let lines = [];
      for(let a = aIni; a <= aFim; a++) {
        let cols = meses.map((m, idx) => {
           let exibir = true;
           if(a === aIni && idx < dAdm.getMonth()) exibir = false;
           if(a === aFim && idx > dDem.getMonth()) exibir = false;
           return { m, exibir };
        });
        lines.push({ ano: a, cols });
      }

      matrizMesesRow = lines.map((linha, idx) => (
        <div key={idx} style={{ marginBottom: '5px', fontSize: '11px' }}>
          <strong>{linha.ano}:</strong>{' '}
          {linha.cols.map((it, i) => (
            it.exibir 
              ? <span key={i} style={{ display:'inline-block', width: '45px', border:'1px solid #000', textAlign:'center', marginRight:'2px', padding:'2px 0' }}>[ ] {it.m}</span>
              : <span key={i} style={{ display:'inline-block', width: '45px', color: '#ccc', textAlign:'center' }}>---</span>
          ))}
        </div>
      ));
    } else {
      matrizMesesRow = <div style={{ fontSize:'11px', color:'#888' }}>Período base não identificado.</div>;
    }

    let isMotorista = String(p.funcao).toLowerCase().includes('motorista');

    let docsBasicos = [
        'Ficha de Registro / Contrato de Trabalho',
        'ASO (Admissional e Demissional)',
        'Aviso Prévio (Assinado)',
        'TRCT (Termo de Rescisão Assinado)',
        'Extrato FGTS Analítico / Guias Pagas'
    ];

    let docsPermanentes = [
        'Acordos ou Convenções Coletivas Trabalhadas (CCT)',
        'Aditivos, Normas, Regulamento Interno e Frota',
        'Advertências, Suspensões e Histórico Disciplinar',
        'Comprovantes de Benefícios (VA, VR, Cesta)',
        'Termo de Opção ou Recusa de Vale Transporte',
        'PPP (Perfil Profissiográfico Previdenciário / LTCAT)',
        'Relatório Tracker (Latitude, Longitude e Log)'
    ];
    if(isMotorista) docsPermanentes.push('Fichas Diárias / Refeições e Pernoites (MOTORISTA)');

    let outrosList = modalOutros ? modalOutros.split(',').map(s => s.trim()).filter(s => s) : [];

    const blockCheck = '[ \u00A0\u00A0 ]';

    return (
      <div id="checklist-print-area" className="hidden print:block font-serif text-black bg-white left-0 top-0 w-full p-8" style={{fontFamily: "'Times New Roman', Times, serif"}}>
        <div style={{ textAlign: 'center', borderBottom: '2px solid #000', paddingBottom: '15px', marginBottom: '15px' }}>
          <h1 style={{ fontSize: '19px', margin: '0', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 800 }}>CHECKLIST DE DOCUMENTOS – CONTENCIOSO TRABALHISTA</h1>
          <h2 style={{ fontSize: '11px', margin: '5px 0 0 0', color: '#444', fontWeight: 'normal', letterSpacing: '3px' }}>FAROL DE DOCUMENTAÇÃO JURÍDICA</h2>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', border: '1.5px solid #000', padding: '12px', marginBottom: '20px', fontSize: '11px' }}>
          <div style={{ borderBottom: '1px dashed #ccc', paddingBottom: '4px' }}><strong>Reclamante:</strong> {p.reclamante}</div>
          <div style={{ borderBottom: '1px dashed #ccc', paddingBottom: '4px' }}><strong>Processo (CNJ):</strong> {p.processo}</div>
          <div style={{ borderBottom: '1px dashed #ccc', paddingBottom: '4px' }}><strong>Função:</strong> {p.funcao}</div>
          <div style={{ borderBottom: '1px dashed #ccc', paddingBottom: '4px' }}><strong>Matrícula:</strong> _____________________________</div>
          <div style={{ borderBottom: '1px dashed #ccc', paddingBottom: '4px' }}><strong>Unidade:</strong> {p.unidade}</div>
          <div style={{ borderBottom: '1px dashed #ccc', paddingBottom: '4px' }}><strong>Polo Passivo:</strong> {p.reu || "_____________________________"}</div>
          <div style={{ borderBottom: '1px dashed #ccc', paddingBottom: '4px' }}><strong>Admissão:</strong> {p.admissao}</div>
          <div style={{ borderBottom: '1px dashed #ccc', paddingBottom: '4px' }}><strong>Demissão:</strong> {p.demissao}</div>
        </div>

        <div style={{ fontSize: '12px', background: '#eee', padding: '6px', borderLeft: '4px solid #000', marginBottom: '8px', fontWeight: 'bold', textTransform: 'uppercase' }}>DOCUMENTAÇÃO ADMISSIONAL E DEMISSIONAL</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', marginBottom: '20px' }}>
          <thead>
            <tr>
              <th style={{ border: '1px solid #000', background: '#EAEAEA', padding: '6px', textAlign: 'left' }}>Documento</th>
              <th style={{ border: '1px solid #000', background: '#EAEAEA', width: '50px', textAlign: 'center' }}>OK</th>
              <th style={{ border: '1px solid #000', background: '#EAEAEA', width: '50px', textAlign: 'center' }}>FALTOU</th>
              <th style={{ border: '1px solid #000', background: '#EAEAEA', width: '150px', textAlign: 'left', paddingLeft: '6px' }}>Observações</th>
            </tr>
          </thead>
          <tbody>
            {docsBasicos.map((doc, idx) => (
              <tr key={idx}>
                <td style={{ border: '1px solid #000', padding: '4px 10px', fontWeight: 700 }}>{doc}</td>
                <td style={{ border: '1px solid #000', textAlign: 'center' }}>{blockCheck}</td>
                <td style={{ border: '1px solid #000', textAlign: 'center' }}>{blockCheck}</td>
                <td style={{ border: '1px solid #000' }}></td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ fontSize: '12px', background: '#eee', padding: '6px', borderLeft: '4px solid #000', marginBottom: '8px', fontWeight: 'bold', textTransform: 'uppercase' }}>OUTROS DOCUMENTOS OBRIGATÓRIOS E KITS DE EXCEÇÃO</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', marginBottom: '20px' }}>
          <thead>
            <tr>
              <th style={{ border: '1px solid #000', background: '#EAEAEA', padding: '6px', textAlign: 'left' }}>Documento</th>
              <th style={{ border: '1px solid #000', background: '#EAEAEA', width: '50px', textAlign: 'center' }}>OK</th>
              <th style={{ border: '1px solid #000', background: '#EAEAEA', width: '50px', textAlign: 'center' }}>FALTOU</th>
              <th style={{ border: '1px solid #000', background: '#EAEAEA', width: '150px', textAlign: 'left', paddingLeft: '6px' }}>Observações</th>
            </tr>
          </thead>
          <tbody>
            {docsPermanentes.concat(outrosList).map((doc, idx) => (
              <tr key={idx}>
                <td style={{ border: '1px solid #000', padding: '4px 10px', fontWeight: 700 }}>{doc.toUpperCase()}</td>
                <td style={{ border: '1px solid #000', textAlign: 'center' }}>{blockCheck}</td>
                <td style={{ border: '1px solid #000', textAlign: 'center' }}>{blockCheck}</td>
                <td style={{ border: '1px solid #000' }}></td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '12px', background: '#eee', padding: '6px', borderLeft: '4px solid #000', marginBottom: '8px', fontWeight: 'bold', textTransform: 'uppercase' }}>REMUNERAÇÃO / HOLERITES</div>
            <div style={{ border: '1px solid #000', padding: '10px' }}>{matrizMesesRow}</div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '12px', background: '#eee', padding: '6px', borderLeft: '4px solid #000', marginBottom: '8px', fontWeight: 'bold', textTransform: 'uppercase' }}>ESPELHOS DE PONTO</div>
            <div style={{ border: '1px solid #000', padding: '10px', borderBottom: 'none' }}>{matrizMesesRow}</div>
            <div style={{ border: '1px solid #000', padding: '8px', fontSize: '10px', fontWeight: 'bold' }}>
              PONTO CERTIFICADO? {blockCheck} SIM {blockCheck} NÃO
            </div>
          </div>
        </div>

        <div style={{ fontSize: '12px', background: '#eee', padding: '6px', borderLeft: '4px solid #000', marginBottom: '8px', fontWeight: 'bold', textTransform: 'uppercase' }}>PERIÓDICOS ANUAIS (ASO, Férias e EPI)</div>
        <div style={{ marginBottom: '20px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
            <thead>
              <tr>
                <th style={{ border: '1px solid #000', background: '#EAEAEA', padding: '6px', textAlign: 'left' }}>Ano Ref.</th>
                <th style={{ border: '1px solid #000', background: '#EAEAEA', padding: '6px', width: '70px', textAlign: 'center' }}>ASO Periód.</th>
                <th style={{ border: '1px solid #000', background: '#EAEAEA', padding: '6px', width: '70px', textAlign: 'center' }}>Férias</th>
                <th style={{ border: '1px solid #000', background: '#EAEAEA', padding: '6px', width: '70px', textAlign: 'center' }}>Ficha EPI</th>
              </tr>
            </thead>
            <tbody>
              {dAdm && dDem && Array.from({length: dDem.getFullYear() - dAdm.getFullYear() + 1}).map((_, i) => (
                <tr key={i}>
                  <td style={{ border: '1px solid #000', padding: '6px', fontWeight: 700, textAlign: 'left', fontSize: '12px' }}>{dAdm.getFullYear() + i}</td>
                  <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'center' }}>{blockCheck} OK</td>
                  <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'center' }}>{blockCheck} OK</td>
                  <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'center' }}>{blockCheck} OK</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ fontSize: '12px', background: '#eee', padding: '6px', borderLeft: '4px solid #000', marginBottom: '8px', fontWeight: 'bold', textTransform: 'uppercase' }}>Observações Prévias e Apontamento Jurídico</div>
        <div style={{ border: '1.5px solid #000', padding: '10px', minHeight: '50px', fontSize: '11px', marginBottom: '40px', fontStyle: 'italic' }}>
          {modalObs || "Nenhuma observação prévia cadastrada no Farol."}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', padding: '0 40px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: '250px', borderBottom: '1.5px solid #000', marginBottom: '5px' }}></div>
            <span style={{ fontSize: '11px', fontWeight: 'bold' }}>Assinatura do Responsável da Conferência</span>
          </div>
          <div style={{ fontSize: '11px', fontWeight: 'bold' }}>
            Data da Montagem: ____ / ____ / ________
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <style>{`
        /* PASSO 1: CSS de Isolação Global (Print) */
        @media print {
          /* Esconde absolutamente tudo que não for o container de impressão */
          body * { visibility: hidden; }
          #checklist-print-area, #checklist-print-area * { visibility: visible; }
          #checklist-print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 0;
            background: white !important;
            color: black !important;
          }
          /* Remove margens do navegador e sidebar do hub */
          nav, aside, button, header, footer, .no-print { display: none !important; }
          
          /* Remove background gradients and margins forcefully */
          html, body {
             background: white !important;
             margin: 0 !important;
             padding: 0 !important;
          }
        }
        
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(128, 0, 32, 0.2); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(128, 0, 32, 0.4); }
      `}</style>
      
      {/* UI Dashboard (Hidden on Print) */}
      <div className="print:hidden space-y-6 animate-in fade-in duration-500">
        
        {/* Header Bar - Adaptado pro Stitch Theme */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-stitch-white dark:bg-zinc-900 p-6 rounded-2xl border border-slate-200 dark:border-zinc-800 transition-colors shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-rose-50 dark:bg-zinc-800 rounded-xl border border-rose-100 dark:border-zinc-700">
               <LayoutGrid className="text-stitch-burgundy dark:text-stitch-secondary w-8 h-8 transition-colors" />
            </div>
            <div>
              <h1 className="font-newsreader text-3xl font-bold text-slate-900 dark:text-zinc-100 tracking-tight transition-colors">Farol de Documentação</h1>
              <p className="text-slate-500 dark:text-zinc-400 text-xs tracking-widest uppercase font-bold mt-1">Gestão de Subsídios e Auditoria Processual</p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex gap-4 p-2 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl transition-colors">
              <div className="px-4 py-2 text-center">
                 <p className="text-[9px] text-slate-500 dark:text-zinc-500 uppercase font-bold tracking-widest">Pendentes</p>
                 <p className="text-xl font-bold text-amber-600 dark:text-amber-500 mono-num transition-colors">{stats.pend}</p>
              </div>
              <div className="px-4 py-2 text-center border-x border-slate-200 dark:border-zinc-800">
                 <p className="text-[9px] text-slate-500 dark:text-zinc-500 uppercase font-bold tracking-widest">Enviados</p>
                 <p className="text-xl font-bold text-emerald-600 dark:text-emerald-500 mono-num transition-colors">{stats.env}</p>
              </div>
              <div className="px-4 py-2 text-center">
                 <p className="text-[9px] text-slate-500 dark:text-zinc-500 uppercase font-bold tracking-widest">Total</p>
                 <p className="text-xl font-bold text-slate-800 dark:text-zinc-200 mono-num transition-colors">{isLoading ? "..." : stats.total}</p>
              </div>
            </div>
            <button className="flex items-center gap-3 px-6 py-4 bg-stitch-burgundy hover:bg-stitch-burgundy-dark text-white font-inter font-bold text-xs uppercase tracking-widest rounded-xl transition-all shadow-md disabled:opacity-50">
               <Printer size={16} /> Relatório Consolidado
            </button>
          </div>
        </div>

        {/* Filters and Data Grid */}
        <div className="bg-stitch-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 overflow-hidden shadow-sm transition-colors">
          <div className="overflow-x-auto">
            {isLoading ? (
               <div className="p-20 flex flex-col items-center justify-center min-h-[400px]">
                  <RefreshCw className="w-8 h-8 text-stitch-burgundy dark:text-stitch-secondary animate-spin mb-4" />
                  <p className="text-sm text-slate-500 font-bold uppercase tracking-widest">Lendo Matriz Processual...</p>
               </div>
            ) : (
            <table className="w-full text-left min-w-[1200px] table-fixed">
              <thead className="sticky top-0 z-10">
                <tr className="bg-slate-50 dark:bg-[#151517] border-b border-slate-200 dark:border-zinc-800 transition-colors">
                   {[
                     { label: "Processo", icon: Hash, key: 'proc', w: '180px' },
                     { label: "Reclamante", icon: User, key: 'rec', w: '250px' },
                     { label: "Função", icon: Briefcase, key: 'fun', w: '180px' },
                     { label: "Audiência", icon: Calendar, key: 'data', w: '150px' },
                     { label: "Prazo", icon: Clock, w: '150px', noFilter: true },
                     { label: "Réu", icon: Building2, key: 'reu', w: '200px' },
                     { label: "Unidade", icon: MapPin, key: 'uni', w: '180px' },
                     { label: "Status", icon: CheckCircle, key: 'status', w: '150px', type: 'select' }
                   ].map((col, idx) => (
                     <th key={idx} className="p-6 align-top" style={{ width: col.w }}>
                        <div className="flex justify-between items-center mb-4">
                           <span className="text-[10px] text-slate-600 dark:text-zinc-400 font-bold uppercase tracking-[0.2em] transition-colors">{col.label}</span>
                           <col.icon size={12} className="text-slate-400 dark:text-zinc-600" />
                        </div>
                        {!col.noFilter && (
                           <div className="relative group">
                              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 group-focus-within:text-stitch-burgundy transition-colors" />
                              {col.type === 'select' ? (
                                <select 
                                  value={busca[col.key]}
                                  onChange={(e) => setBusca(p => ({...p, [col.key]: e.target.value}))}
                                  className="w-full bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg py-2 pl-8 pr-2 text-[10px] text-slate-700 dark:text-zinc-300 focus:border-stitch-burgundy outline-none appearance-none cursor-pointer transition-colors"
                                >
                                  <option value="">TODOS</option>
                                  <option value="Solicitado">SOLICITADO</option>
                                  <option value="Enviado">ENVIADO</option>
                                </select>
                              ) : (
                                <input 
                                  type="text" 
                                  placeholder="Filtrar..."
                                  value={busca[col.key]}
                                  onChange={(e) => setBusca(p => ({...p, [col.key]: e.target.value}))}
                                  className="w-full bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg py-2 pl-8 pr-4 text-[10px] text-slate-700 dark:text-zinc-300 focus:border-stitch-burgundy outline-none transition-colors"
                                />
                              )}
                           </div>
                        )}
                     </th>
                   ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800 border-x border-transparent">
                {filtrados.map((p, idx) => {
                  const prazo = calcularPrazo(p.audiencia);
                  const totalItens = Object.values(ITENS_PADRAO).flat().length;
                  const perc = Math.round(((p.checklist || []).length / totalItens) * 100);
                  
                  return (
                    <tr key={idx} className={`hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors group ${p.urgente ? 'bg-rose-50 dark:bg-rose-900/10' : ''}`}>
                      <td className="p-6 font-mono text-xs text-slate-500 dark:text-zinc-400 group-hover:text-slate-800 dark:group-hover:text-zinc-200 transition-colors">{p.processo}</td>
                      <td className="p-6">
                        <p onClick={() => handleOpenModal(p)} className="text-sm font-bold text-slate-800 dark:text-zinc-200 uppercase cursor-pointer hover:text-stitch-burgundy dark:hover:text-stitch-secondary transition-all p-1 -m-1 rounded">
                          {p.reclamante}
                        </p>
                        {/* Barra de Progresso do Checklist */}
                        <div className="mt-2 flex items-center gap-3">
                           <div className="flex-1 h-1 bg-slate-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                              <div className={`h-full transition-all duration-1000 ${perc === 100 ? 'bg-emerald-500' : 'bg-stitch-secondary'}`} style={{ width: `${perc}%` }} />
                           </div>
                           <span className="text-[9px] font-bold text-slate-400 dark:text-zinc-500">{perc}%</span>
                        </div>
                      </td>
                      <td className="p-6 text-xs text-slate-600 dark:text-zinc-400 font-medium truncate" title={p.funcao}>{p.funcao}</td>
                      <td className="p-6 font-mono text-xs text-slate-500 dark:text-zinc-500">{p.audiencia}</td>
                      <td className="p-6">
                         <div className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest ${prazo.color}`}>
                            {prazo.icon && <AlertCircle size={12} />}
                            {prazo.text}
                         </div>
                      </td>
                      <td className="p-6 text-xs text-slate-500 dark:text-zinc-500 italic truncate" title={p.reu}>{p.reu}</td>
                      <td className="p-6 text-xs text-slate-600 dark:text-zinc-400 font-bold truncate" title={p.unidade}>{p.unidade}</td>
                      <td className="p-6">
                         <span className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase border ${p.status === 'Enviado' ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800' : 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-900/20 dark:text-amber-500 dark:border-amber-800'}`}>
                            {p.status}
                         </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            )}
          </div>
        </div>
      </div>

      {selectedProcess && (
        <div className="fixed inset-0 bg-black/40 dark:bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 print:hidden animate-in fade-in duration-300 pointer-events-auto">
          <div className="bg-stitch-bg dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 w-full max-w-4xl max-h-[95vh] overflow-y-auto rounded-3xl shadow-xl flex flex-col pointer-events-auto" onClick={e => e.stopPropagation()}>
             {/* Header Modal */}
             <div className="sticky top-0 bg-stitch-bg dark:bg-zinc-950 border-b border-slate-200 dark:border-zinc-800 p-8 flex justify-between items-center z-10">
               <div className="flex items-center gap-4">
                  <div className="p-4 bg-rose-50 dark:bg-zinc-900 rounded-2xl border border-rose-100 dark:border-zinc-800">
                     <FileSpreadsheet className="text-stitch-burgundy dark:text-stitch-secondary w-7 h-7" />
                  </div>
                  <div>
                    <h2 className="font-newsreader text-2xl font-bold text-slate-900 dark:text-zinc-100 tracking-tight uppercase">{selectedProcess.reclamante}</h2>
                    <p className="text-[10px] text-slate-500 font-mono tracking-tighter uppercase mt-1">{selectedProcess.processo} • {selectedProcess.unidade}</p>
                  </div>
               </div>
               <button onClick={() => setSelectedProcess(null)} className="p-3 bg-white dark:bg-zinc-900 rounded-full text-slate-400 hover:text-rose-600 border border-slate-200 dark:border-zinc-800 hover:border-rose-200 transition-all"><X size={20}/></button>
            </div>

            <div className="p-10 space-y-8">
               <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                  {/* Checklist Dinâmico */}
                  <div className="space-y-6">
                    <h4 className="font-inter text-xs text-slate-600 dark:text-zinc-400 font-bold uppercase tracking-[0.2em] border-b border-slate-200 dark:border-zinc-800 pb-2">Status do Subsídio</h4>
                    
                    <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                      {Object.entries(ITENS_PADRAO).map(([cat, itens]) => (
                        <div key={cat} className="space-y-3 bg-white dark:bg-zinc-900 p-4 rounded-xl border border-slate-100 dark:border-zinc-800 shadow-sm">
                           <p className="text-[9px] font-bold text-stitch-burgundy dark:text-stitch-secondary uppercase tracking-[0.1em] mb-1">{cat}</p>
                           <div className="space-y-2">
                             {itens.map((it, i) => {
                               const isChecked = selectedProcess.checklist?.includes(it);
                               return (
                                 <label key={i} className="flex items-center gap-3 cursor-pointer group hover:bg-slate-50 dark:hover:bg-zinc-800 p-1.5 -ml-1.5 rounded-lg transition-all">
                                    <div className={`w-5 h-5 rounded border transition-all flex items-center justify-center shadow-inner ${isChecked ? 'bg-stitch-burgundy border-stitch-burgundy' : 'border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 group-hover:border-stitch-secondary'}`}>
                                      {isChecked && <Check size={12} className="text-white font-bold" />}
                                    </div>
                                    <span className={`text-xs transition-colors ${isChecked ? 'text-slate-800 dark:text-zinc-200 font-medium' : 'text-slate-500 dark:text-zinc-500 group-hover:text-slate-700 dark:group-hover:text-zinc-400'}`}>{it}</span>
                                    <input 
                                      type="checkbox" 
                                      className="hidden" 
                                      checked={isChecked} 
                                      onChange={(e) => {
                                        const newItemList = isChecked 
                                          ? selectedProcess.checklist.filter(x => x !== it)
                                          : [...(selectedProcess.checklist || []), it];
                                        setBaseFarol(prev => prev.map(p => p.processo === selectedProcess.processo ? {...p, checklist: newItemList} : p));
                                        setSelectedProcess(p => ({...p, checklist: newItemList}));
                                      }}
                                    />
                                 </label>
                               );
                             })}
                           </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Configurações Adicionais */}
                  <div className="space-y-8 flex flex-col h-full">
                    <div className="space-y-6 flex-1 bg-white dark:bg-zinc-900 p-6 border border-slate-100 dark:border-zinc-800 rounded-2xl shadow-sm">
                      <div className="space-y-2">
                         <label className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Outros Documentos Específicos</label>
                         <input 
                           type="text" 
                           value={modalOutros}
                           onChange={(e) => setModalOutros(e.target.value)}
                           placeholder="Ex: Receituário, Laudo Frota..."
                           className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 p-3 rounded-xl text-xs text-slate-800 dark:text-zinc-200 focus:border-stitch-burgundy focus:ring-1 focus:ring-stitch-burgundy/30 outline-none transition-all"
                         />
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Observação da Pendência / Jurídica</label>
                         <textarea 
                           rows={6}
                           value={modalObs}
                           onChange={(e) => setModalObs(e.target.value)}
                           placeholder="Insira apontamentos táticos..."
                           className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 p-3 rounded-xl text-xs text-slate-800 dark:text-zinc-200 focus:border-stitch-burgundy focus:ring-1 focus:ring-stitch-burgundy/30 outline-none transition-all resize-none"
                         />
                      </div>
                      <div className="flex gap-4">
                        <div className="flex-1 space-y-2">
                           <label className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Status Geral</label>
                           <select 
                            value={selectedProcess.status}
                            onChange={(e) => {
                              const s = e.target.value;
                              setBaseFarol(p => p.map(x => x.processo === selectedProcess.processo ? {...x, status: s} : x));
                              setSelectedProcess(p => ({...p, status: s}));
                            }}
                            className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 p-3 rounded-xl text-xs text-slate-800 dark:text-zinc-200 appearance-none cursor-pointer focus:border-stitch-burgundy outline-none transition-all"
                           >
                             <option value="Solicitado">SOLICITADO</option>
                             <option value="Enviado">ENVIADO</option>
                           </select>
                        </div>
                        <div className="flex-1 flex items-end">
                           <label className={`flex items-center gap-3 p-3 border rounded-xl cursor-pointer w-full group transition-all ${selectedProcess.urgente ? 'bg-rose-50 dark:bg-rose-900/10 border-rose-200 dark:border-rose-800' : 'bg-slate-50 dark:bg-zinc-950 border-slate-200 dark:border-zinc-800'}`}>
                              <input 
                                type="checkbox" 
                                checked={selectedProcess.urgente}
                                onChange={(e) => {
                                  const u = e.target.checked;
                                  setBaseFarol(p => p.map(x => x.processo === selectedProcess.processo ? {...x, urgente: u} : x));
                                  setSelectedProcess(p => ({...p, urgente: u}));
                                }}
                                className="w-4 h-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500" 
                              />
                              <span className={`text-[10px] uppercase font-bold tracking-widest transition-colors ${selectedProcess.urgente ? 'text-rose-600' : 'text-slate-500'}`}>Urgência Alpha</span>
                           </label>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-4">
                       <button onClick={() => window.print()} className="flex-1 py-4 border border-stitch-burgundy/20 bg-rose-50 dark:bg-zinc-900 text-stitch-burgundy font-inter font-bold text-[10px] tracking-widest rounded-xl hover:bg-stitch-burgundy hover:text-white transition-all flex items-center justify-center gap-2 uppercase shadow-sm">
                          <Printer size={16} /> Imprimir Checklist A4
                       </button>
                       <button onClick={async () => {
                          try {
                            const p = selectedProcess;
                            await supabase.from('farol_documentacao')
                               .update({
                                  status_farol: p.status,
                                  is_urgente: p.urgente,
                                  checklist_arquivado: p.checklist,
                                  observacao_juridica: modalObs
                               })
                               .eq('numero_cnj', p.processo);
                            setSelectedProcess(null);
                          } catch (e) { console.error("Erro ao gravar alterações:", e); }
                       }} className="flex-1 py-4 bg-stitch-burgundy text-white font-inter font-bold text-[10px] tracking-widest rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-transform flex items-center justify-center gap-2 uppercase shadow-md">
                          <Check size={16} /> Gravar Alterações
                       </button>
                    </div>
                  </div>
               </div>
            </div>
          </div>
        </div>
      )}

      {renderizarChecklistA4()}
    </div>
  );
}
