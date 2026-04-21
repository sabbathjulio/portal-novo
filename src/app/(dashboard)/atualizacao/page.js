"use client";

import React, { useState, useCallback, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { supabase } from '@/lib/supabase';
import { 
  UploadCloud, Settings2, Database, AlertTriangle, 
  CheckCircle2, FileSpreadsheet, PlayCircle, Loader2,
  Copy, XCircle, ChevronRight, Info
} from 'lucide-react';

const SUPABASE_SCHEMA = {
  processos: [
    { label: "Pasta", value: "pasta" },
    { label: "Reclamante", value: "reclamante" },
    { label: "Réu Principal", value: "reu_principal" },
    { label: "Unidade", value: "unidade" },
    { label: "Data Admissão", value: "data_admissao" },
    { label: "Data Demissão", value: "data_demissao" },
    { label: "Função", value: "funcao" },
    { label: "Fase Atual", value: "fase_atual" },
    { label: "Status Geral", value: "status_geral" },
    { label: "Risco", value: "risco" },
    { label: "Observação", value: "observacao" }
  ],
  financeiro: [
    { label: "Valor da Causa", value: "valor_causa" },
    { label: "Valor do Acordo", value: "valor_acordo" },
    { label: "Depósito Recursal", value: "deposito_recursal" },
    { label: "Custas", value: "custas" },
    { label: "Condenação", value: "condenacao" }
  ],
  audiencias: [
    { label: "Tipo de Audiência", value: "tipo" },
    { label: "Data/Hora (ISO)", value: "data_hora" },
    { label: "Status", value: "status" }
  ],
  farol_documentacao: [
    { label: "Status do Farol", value: "status_farol" },
    { label: "Marcador de Urgência", value: "is_urgente" },
    { label: "Observação Jurídica", value: "observacao_juridica" }
  ]
};

export default function AtualizacaoUniversalPage() {
  const [step, setStep] = useState(1);
  const [fileData, setFileData] = useState(null); // { headers: [], rows: [] }
  const [masterKeyCol, setMasterKeyCol] = useState('');
  const [mapping, setMapping] = useState({}); // { [headerName]: { table: '', column: '' } }
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState({ success: 0, failed: 0, errors: [] });

  // STEP 1: Upload e Leitura
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary', cellDates: true });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(ws, { header: 1, raw: false, defval: '' });
        
        if (data.length < 2) throw new Error("Planilha vazia ou sem cabeçalho.");
        
        // Encontrar cabeçalho real (primeira linha com dados relevantes)
        let headerIdx = 0;
        for(let i=0; i < data.length; i++){
           if (data[i].filter(Boolean).length > 1) {
              headerIdx = i;
              break;
           }
        }
        
        const headers = data[headerIdx].map(h => String(h).trim()).filter(Boolean);
        const rows = data.slice(headerIdx + 1).filter(r => r.some(Boolean));
        
        // Converte array row para objeto espelhando o cabeçalho
        const objRows = rows.map(r => {
           const obj = {};
           headers.forEach((h, i) => { obj[h] = r[i]; });
           return obj;
        });

        setFileData({ headers, rows: objRows });
        
        // Autodetect CNJ if possible
        const possibleCNJ = headers.find(h => h.toLowerCase().includes('processo') || h.toLowerCase().includes('cnj') || h.toLowerCase().includes('protocolo'));
        if (possibleCNJ) setMasterKeyCol(possibleCNJ);

        setStep(2);
      } catch(err) {
        alert("Falha ao ler o arquivo: " + err.message);
      }
    };
    reader.readAsBinaryString(file);
  };

  // Mapeamento Handlers
  const handleMapChange = (header, key, value) => {
    setMapping(prev => ({
      ...prev,
      [header]: {
        ...prev[header],
        [key]: value
      }
    }));
  };

  const getTargetColumns = (tableName) => {
    if (!tableName) return [];
    return SUPABASE_SCHEMA[tableName] || [];
  };

  const getRemanescentes = () => fileData?.headers.filter(h => h !== masterKeyCol) || [];

  const checkMapeamentoValido = () => {
    if (!masterKeyCol) return false;
    // Pelo menos 1 coluna deve ter tabela e coluna mapeados
    return Object.values(mapping).some(m => m.table && m.column);
  };

  // Motor de Atualização (Etapa Crítica)
  const executeBulkUpdate = async () => {
    if (!checkMapeamentoValido()) return;
    setStep(4);
    setIsProcessing(true);
    setProgress(0);
    setLogs({ success: 0, failed: 0, errors: [] });
    
    let okCount = 0;
    let failCount = 0;
    const errorArr = [];

    const totalRows = fileData.rows.length;

    for (let i = 0; i < totalRows; i++) {
        const row = fileData.rows[i];
        const rawCnj = row[masterKeyCol];
        
        // Regra Crítica: Sanitização
        if (!rawCnj) {
            failCount++;
            errorArr.push({ cnj: "N/A", msg: `Linha ${i+2}: Chave CNJ vazia.` });
            continue;
        }
        
        const cnjSanitizado = String(rawCnj).replace(/\D/g, '');
        if (cnjSanitizado.length < 10) {
            failCount++;
            errorArr.push({ cnj: rawCnj, msg: "CNJ inválido após sanitização." });
            continue;
        }

        // Agrupar payloads por tabela
        let tablePayloads = {};
        
        Object.keys(mapping).forEach(header => {
           const setup = mapping[header];
           if (setup.table && setup.column && row[header]) {
              if (!tablePayloads[setup.table]) tablePayloads[setup.table] = {};
              // Transforma booleano se necessário e joga o valor
              let val = row[header];
              if (setup.column === 'is_urgente') {
                 val = String(val).toLowerCase() === 'sim' || String(val) === 'true' || val === '1';
              }
              tablePayloads[setup.table][setup.column] = val;
           }
        });

        // Executar os Updates via Supabase
        let hasErrorInRow = false;
        
        const tablesToUpdate = Object.keys(tablePayloads);
        if (tablesToUpdate.length === 0) {
           failCount++;
           errorArr.push({ cnj: cnjSanitizado, msg: "Nenhum dado mapeado." });
           continue;
        }

        for (const table of tablesToUpdate) {
            try {
               const payload = tablePayloads[table];
               const { data, error } = await supabase
                  .from(table)
                  .update(payload)
                  .eq('numero_cnj', cnjSanitizado)
                  .select('numero_cnj');

               if (error) throw error;
               // O update não gera erro fatal se nao achar row, mas retorna array vazio.
               if (!data || data.length === 0) {
                  throw new Error(`CNJ não localizado na tabela '${table}'.`);
               }
            } catch(dbErr) {
               hasErrorInRow = true;
               errorArr.push({ cnj: cnjSanitizado, msg: dbErr.message || String(dbErr) });
            }
        }

        if (hasErrorInRow) {
            failCount++;
        } else {
            okCount++;
        }

        setProgress(Math.round(((i + 1) / totalRows) * 100));
    }

    setLogs({ success: okCount, failed: failCount, errors: errorArr });
    setIsProcessing(false);
    setStep(5); // Concluído
  };

  const copyErrors = () => {
     const txt = logs.errors.map(e => `CNJ: ${e.cnj} | Erro: ${e.msg}`).join('\n');
     navigator.clipboard.writeText(txt);
     alert('Log copiado para área de transferência!');
  };

  return (
    <div className="max-w-6xl mx-auto w-full px-4 py-8 space-y-6 animate-in fade-in duration-500 text-slate-800 dark:text-zinc-200">
      
      {/* Header */}
      <div className="flex flex-col mb-8">
         <h1 className="text-3xl font-newsreader font-medium text-slate-900 dark:text-zinc-100 flex items-center gap-3">
            <Database className="text-stitch-burgundy dark:text-stitch-secondary" size={32} /> 
            Atualizador Universal
         </h1>
         <p className="text-slate-500 dark:text-zinc-400 mt-2 font-inter max-w-2xl">
            Motor de injeção direta (ETL). Especifique as diretrizes de coluna para disparar comandos de roteamento em multi-tabela para o servidor relacional em tempo real.
         </p>
      </div>

      {/* Stepper Wizard Layer */}
      <div className="bg-white dark:bg-[#151515] border border-slate-200 dark:border-zinc-800/80 rounded-2xl shadow-sm overflow-hidden">
        
        {/* Progress Tracker */}
        <div className="flex border-b border-slate-100 dark:border-zinc-800/60 bg-slate-50/50 dark:bg-black/20">
           <div className={`flex-1 p-4 text-xs font-bold font-inter uppercase tracking-widest text-center ${step >= 1 ? 'text-stitch-burgundy dark:text-stitch-secondary' : 'text-slate-400'}`}>1. Importação</div>
           <div className={`flex-1 p-4 text-xs font-bold font-inter uppercase tracking-widest text-center border-l border-slate-200 dark:border-zinc-800 ${step >= 2 ? 'text-stitch-burgundy dark:text-stitch-secondary' : 'text-slate-400'}`}>2. Chave Mestra</div>
           <div className={`flex-1 p-4 text-xs font-bold font-inter uppercase tracking-widest text-center border-l border-slate-200 dark:border-zinc-800 ${step >= 3 ? 'text-stitch-burgundy dark:text-stitch-secondary' : 'text-slate-400'}`}>3. Mapeamento</div>
           <div className={`flex-1 p-4 text-xs font-bold font-inter uppercase tracking-widest text-center border-l border-slate-200 dark:border-zinc-800 ${step >= 4 ? 'text-stitch-burgundy dark:text-stitch-secondary' : 'text-slate-400'}`}>4. Tráfego</div>
        </div>

        <div className="p-8">
           {/* STEP 1: UPLOAD */}
           {step === 1 && (
             <div className="animate-in slide-in-from-bottom-4 duration-300">
                <label className="block cursor-pointer group">
                   <div className="border-2 border-dashed border-slate-300 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900/30 rounded-2xl p-24 text-center transition-all hover:bg-slate-100 dark:hover:bg-zinc-800/50">
                      <div className="w-20 h-20 bg-white dark:bg-black/40 shadow-sm border border-slate-200 dark:border-zinc-700 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                        <FileSpreadsheet size={36} className="text-slate-400 dark:text-zinc-500 group-hover:text-stitch-burgundy dark:group-hover:text-stitch-secondary" />
                      </div>
                      <h3 className="text-xl font-bold font-inter text-slate-800 dark:text-zinc-200 mb-2">Arraste a sua planilha base</h3>
                      <p className="text-slate-500 dark:text-zinc-500 text-sm">Extensões suportadas: .csv, .xls, .xlsx</p>
                      <input type="file" className="hidden" accept=".csv, .xls, .xlsx" onChange={handleFileUpload} />
                   </div>
                </label>
             </div>
           )}

           {/* STEP 2: CHAVE MESTRA */}
           {step === 2 && fileData && (
             <div className="animate-in slide-in-from-right-4 duration-300 max-w-2xl mx-auto space-y-8">
                <div className="text-center">
                   <Settings2 size={48} className="mx-auto text-stitch-burgundy dark:text-stitch-secondary mb-4" />
                   <h2 className="text-2xl font-newsreader font-medium mb-2 text-slate-900 dark:text-zinc-100">Selecionar Index da Base</h2>
                   <p className="text-slate-500 dark:text-zinc-400">Qual coluna da sua planilha representa o protocolo universal (CNJ)?</p>
                </div>
                
                <div className="p-6 bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-white/5 rounded-2xl flex flex-col items-center">
                   <select 
                     className="w-full max-w-md p-4 bg-white dark:bg-[#151515] border border-slate-200 dark:border-white/10 rounded-xl text-slate-800 dark:text-zinc-200 focus:outline-none focus:border-stitch-burgundy text-sm font-medium"
                     value={masterKeyCol}
                     onChange={(e) => setMasterKeyCol(e.target.value)}
                   >
                     <option value="" disabled>--- Selecione a Coluna ---</option>
                     {fileData.headers.map(h => <option key={h} value={h}>{h}</option>)}
                   </select>

                   <div className="mt-8 flex gap-2 items-center text-xs text-slate-500 bg-black/5 dark:bg-black p-4 rounded-xl border border-dashed border-slate-300 dark:border-white/10 w-full max-w-md">
                     <AlertTriangle size={16} className="text-amber-500 shrink-0" />
                     <p>A engine aplicará sanitização automática <code className="bg-black/10 dark:bg-white/10 px-1 rounded">replace(/\D/g, '')</code> na informação dessa coluna antes de cruzar com as APIs.</p>
                   </div>
                </div>

                <div className="flex justify-between border-t border-slate-200 dark:border-white/5 pt-6 mt-8">
                   <button onClick={() => setStep(1)} className="px-6 py-3 font-bold uppercase tracking-widest text-xs text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors">Voltar</button>
                   <button onClick={() => setStep(3)} disabled={!masterKeyCol} className="px-8 py-3 bg-slate-900 dark:bg-white text-white dark:text-black font-bold uppercase tracking-widest text-xs rounded-lg hover:shadow-lg transition-all disabled:opacity-50">Avançar Mapeamento</button>
                </div>
             </div>
           )}

           {/* STEP 3: Mapeamento DE-PARA */}
           {step === 3 && fileData && (
             <div className="animate-in slide-in-from-right-4 duration-300 space-y-6">
                <div>
                   <h2 className="text-2xl font-newsreader font-medium mb-1 text-slate-900 dark:text-zinc-100 flex items-center gap-3">
                     Configurar De-Para
                     <span className="bg-slate-100 dark:bg-zinc-800 text-xs px-2 py-1 rounded font-mono font-bold text-slate-700 dark:text-zinc-400 border border-slate-200 dark:border-zinc-700">Chave base: {masterKeyCol}</span>
                   </h2>
                   <p className="text-sm text-slate-500 dark:text-zinc-400">Arquitete as vias de injeção. Ignore as colunas que não desejar importar.</p>
                </div>

                <div className="border border-slate-200 dark:border-white/5 rounded-2xl overflow-hidden bg-slate-50 dark:bg-black/20">
                   <div className="grid grid-cols-12 gap-4 p-4 border-b border-slate-200 dark:border-white/5 font-bold uppercase tracking-widest text-[10px] text-slate-500 mr-2">
                       <div className="col-span-4">Coluna Matriz (Sua Planilha)</div>
                       <div className="col-span-4 pl-2">1. Cluster Destino (Tabela)</div>
                       <div className="col-span-4 pl-2">2. End-Node (Coluna)</div>
                   </div>
                   
                   <div className="max-h-[50vh] overflow-y-auto custom-scrollbar p-2 space-y-2">
                      {getRemanescentes().map(header => {
                         const currentMap = mapping[header] || { table: "", column: "" };
                         const colsAvailable = getTargetColumns(currentMap.table);

                         return (
                           <div key={header} className="grid grid-cols-12 gap-4 items-center bg-white dark:bg-[#151515] p-3 rounded-xl border border-slate-100 dark:border-white/5 shadow-sm">
                              <div className="col-span-4 pl-2 flex items-center gap-2">
                                 <div className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-zinc-700"></div>
                                 <span className="font-mono text-xs font-bold text-slate-800 dark:text-zinc-300 truncate" title={header}>{header}</span>
                              </div>
                              <div className="col-span-4">
                                 <select 
                                   className="w-full p-2 bg-slate-50 dark:bg-black/50 border border-slate-200 dark:border-white/10 rounded-lg text-xs font-medium text-slate-700 dark:text-zinc-300 focus:outline-none focus:border-stitch-burgundy"
                                   value={currentMap.table}
                                   onChange={(e) => handleMapChange(header, "table", e.target.value)}
                                 >
                                    <option value="">-- Ignorar --</option>
                                    <option value="processos">Tabela ._processos</option>
                                    <option value="financeiro">Tabela ._financeiro</option>
                                    <option value="audiencias">Tabela ._audiencias</option>
                                    <option value="farol_documentacao">Tabela ._farol</option>
                                 </select>
                              </div>
                              <div className="col-span-4">
                                 <select 
                                   className="w-full p-2 bg-slate-50 dark:bg-black/50 border border-slate-200 dark:border-white/10 rounded-lg text-xs font-medium text-slate-700 dark:text-zinc-300 focus:outline-none focus:border-stitch-burgundy disabled:opacity-30"
                                   value={currentMap.column}
                                   onChange={(e) => handleMapChange(header, "column", e.target.value)}
                                   disabled={!currentMap.table}
                                 >
                                    <option value="">Selecione Coluna...</option>
                                    {colsAvailable.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                                 </select>
                              </div>
                           </div>
                         );
                      })}
                   </div>
                </div>

                <div className="flex justify-between border-t border-slate-200 dark:border-white/5 pt-6 mt-6">
                   <button onClick={() => setStep(2)} className="px-6 py-3 font-bold uppercase tracking-widest text-xs text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors">Voltar</button>
                   <button 
                     onClick={executeBulkUpdate} 
                     disabled={!checkMapeamentoValido()}
                     className="px-8 py-3 bg-gradient-to-r from-stitch-burgundy to-[#b32035] dark:from-stitch-secondary dark:to-[#eabe5e] text-white dark:text-black font-bold uppercase tracking-widest text-xs rounded-lg flex items-center gap-2 hover:scale-[1.02] shadow-lg shadow-stitch-burgundy/20 disabled:opacity-40 transition-all"
                   >
                     <PlayCircle size={18} /> INICIAR INJEÇÃO DE DADOS
                   </button>
                </div>
             </div>
           )}

           {/* STEP 4: Processing */}
           {step === 4 && (
             <div className="animate-in fade-in py-24 flex flex-col items-center justify-center space-y-6">
                <Loader2 size={48} className="animate-spin text-stitch-burgundy dark:text-stitch-secondary" />
                <h2 className="text-xl font-newsreader font-bold text-slate-800 dark:text-zinc-100">Autenticando Nodes Triplos...</h2>
                
                <div className="w-full max-w-sm space-y-2">
                   <div className="flex justify-between text-xs font-mono text-slate-500 dark:text-zinc-400">
                      <span>Progresso da varredura</span>
                      <span>{progress}%</span>
                   </div>
                   <div className="h-2 w-full bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div className="h-full bg-stitch-burgundy dark:bg-stitch-secondary transition-all duration-300" style={{ width: `${progress}%` }}></div>
                   </div>
                </div>
                <p className="text-xs text-slate-400">Sincronizando {fileData?.rows.length} registros com o Supabase Realtime.</p>
             </div>
           )}

           {/* STEP 5: Final Report */}
           {step === 5 && (
             <div className="animate-in zoom-in duration-500 space-y-8">
                <div className="text-center mb-8">
                   <CheckCircle2 size={64} className="mx-auto text-emerald-500 mb-4" />
                   <h2 className="text-2xl font-newsreader font-bold text-slate-900 dark:text-white mb-2">Transação do Porto Concluída</h2>
                   <p className="text-slate-500 dark:text-zinc-400">As bases de dados assinaladas receberam as cargas.</p>
                </div>

                <div className="grid grid-cols-3 gap-6 max-w-3xl mx-auto">
                   <div className="bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-white/5 rounded-2xl p-6 text-center">
                     <p className="text-[10px] uppercase font-bold tracking-widest text-slate-500 dark:text-zinc-500 mb-2">Lidos Enfileirados</p>
                     <p className="text-4xl font-newsreader text-slate-800 dark:text-zinc-100">{fileData.rows.length}</p>
                   </div>
                   <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/30 rounded-2xl p-6 text-center">
                     <p className="text-[10px] uppercase font-bold tracking-widest text-emerald-600 dark:text-emerald-500 mb-2">Linhas Atualizadas</p>
                     <p className="text-4xl font-newsreader font-bold text-emerald-600 dark:text-emerald-400">{logs.success}</p>
                   </div>
                   <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/30 rounded-2xl p-6 text-center">
                     <p className="text-[10px] uppercase font-bold tracking-widest text-rose-600 dark:text-rose-500 mb-2">Falha / CNJ não visto</p>
                     <p className="text-4xl font-newsreader font-bold text-rose-600 dark:text-rose-400">{logs.failed}</p>
                   </div>
                </div>

                {logs.errors.length > 0 && (
                   <div className="max-w-3xl mx-auto border border-rose-200 dark:border-rose-900/50 rounded-2xl overflow-hidden mt-8 bg-white dark:bg-[#151515]">
                      <div className="bg-rose-50 dark:bg-rose-950/30 px-6 py-4 border-b border-rose-200 dark:border-rose-900/50 flex justify-between items-center">
                         <h4 className="font-bold text-sm text-rose-800 dark:text-rose-200 flex items-center gap-2"><XCircle size={18} /> Auditoria de Rejeição</h4>
                         <button onClick={copyErrors} className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-rose-600 dark:text-rose-400 hover:text-rose-800 dark:hover:text-red-300">
                           <Copy size={14} /> Copiar Lista
                         </button>
                      </div>
                      <div className="max-h-64 overflow-y-auto custom-scrollbar p-6 space-y-3">
                         {logs.errors.map((err, i) => (
                            <div key={i} className="flex gap-4 p-3 bg-slate-50 dark:bg-black/30 rounded-xl border border-slate-100 dark:border-white/5 text-xs">
                               <span className="font-mono text-slate-500 w-32 shrink-0 border-r border-slate-200 dark:border-zinc-800">{err.cnj}</span>
                               <span className="text-rose-600 dark:text-rose-400/80 font-medium">{err.msg}</span>
                            </div>
                         ))}
                      </div>
                   </div>
                )}

                <div className="text-center pt-8">
                   <button 
                     onClick={() => { setStep(1); setFileData(null); setMasterKeyCol(""); setMapping({}); }} 
                     className="px-8 py-4 bg-slate-900 dark:bg-white text-white dark:text-black font-bold uppercase tracking-widest text-xs rounded-xl hover:shadow-lg transition-all"
                   >
                     Fazer Novo Upload
                   </button>
                </div>
             </div>
           )}

        </div>
      </div>
    </div>
  );
}
