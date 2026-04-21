"use client";

import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { supabase } from '@/lib/supabase';
import { 
  FileSpreadsheet, Database, Loader2, ArrowRight, XCircle, 
  CheckCircle2, Square, CheckSquare, Search, Info, UploadCloud, Plus, ArrowDown, ShieldAlert
} from 'lucide-react';

const SUPABASE_SCHEMA = {
  processos: [
    { label: "Andamento (Status Geral)", value: "status_geral" },
    { label: "Nome do Reclamante", value: "reclamante" },
    { label: "Réu Principal", value: "reu_principal" },
    { label: "Fase do Processo", value: "fase_atual" },
    { label: "Função / Cargo", value: "funcao" },
    { label: "Risco do Processo", value: "risco" }
  ],
  financeiro: [
    { label: "Valor da Causa", value: "valor_causa" },
    { label: "Valor do Acordo", value: "valor_acordo" },
    { label: "Depósito Recursal", value: "deposito_recursal" },
    { label: "Condenação", value: "condenacao" }
  ],
  audiencias: [
    { label: "Tipo de Audiência", value: "tipo" },
    { label: "Modelo (Presencial/Online)", value: "modelo" },
    { label: "Data da Audiência", value: "data_hora" }
  ]
};

// Hardcoded Rules specific to user request
function getHardcodedMatch(rawName) {
   let nameTrimmed = String(rawName).toLowerCase().trim();
   
   // REGRA 1
   if (nameTrimmed === "status" || nameTrimmed === "tipo de audiência" || nameTrimmed === "tipo de audiencia" || nameTrimmed === "tipo") {
       return { t: 'audiencias', c: 'tipo', l: 'Tipo de Audiência' };
   }
   // REGRA 2
   if (nameTrimmed === "status geral" || nameTrimmed === "situação" || nameTrimmed === "situacao") {
       return { t: 'processos', c: 'status_geral', l: 'Andamento' };
   }
   // REGRA 3
   if (nameTrimmed === "modelo" || nameTrimmed === "formato" || nameTrimmed === "presencial/online" || nameTrimmed === "presencial / online") {
       return { t: 'audiencias', c: 'modelo', l: 'Formato da Audiência' };
   }
   return null;
}

export default function ConciliacaoDadosPage() {
  const [step, setStep] = useState(1);
  const [fileData, setFileData] = useState(null);
  const [masterCol, setMasterCol] = useState('');
  
  // State from intermediate step
  const [autoMapped, setAutoMapped] = useState({}); // { "colName": { t, c, l } }
  const [unmappedHeaders, setUnmappedHeaders] = useState([]); // Array of string
  const [manualMap, setManualMap] = useState({}); // { "colName": { table: '', column: '' } }
  
  // Auditoria States
  const [isLoadingDB, setIsLoadingDB] = useState(false);
  const [dbFetchProgress, setDbFetchProgress] = useState(0);
  const [diffs, setDiffs] = useState([]); // [{id, cnj, table, dbCol, colName, oldVal, newVal, checked}]
  
  // Exec State
  const [isUpdating, setIsUpdating] = useState(false);
  const [finalStatus, setFinalStatus] = useState(null); // { updated: 0, errors: [] }

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const wb = XLSX.read(evt.target.result, { type: 'binary', cellDates: true });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(ws, { header: 1, raw: false, defval: '' });
        
        if (data.length < 2) throw new Error("Planilha vazia ou sem cabeçalho.");
        
        let headerIdx = 0;
        for(let i=0; i < data.length; i++){
           if (data[i].filter(Boolean).length > 2) { headerIdx = i; break; }
        }
        
        const headers = data[headerIdx].map(h => String(h).trim()).filter(Boolean);
        const rows = data.slice(headerIdx + 1).filter(r => r.some(Boolean)).map(r => {
           let obj = {}; headers.forEach((h, i) => obj[h] = r[i]); return obj;
        });

        setFileData({ headers, rows });
        setStep(2); 
      } catch(err) {
        alert("Erro no arquivo: " + err.message);
      }
    };
    reader.readAsBinaryString(file);
  };

  // Effect to process headers when a Master CNJ is picked
  useEffect(() => {
     if (!masterCol || !fileData) return;
     
     let auto = {};
     let unmapped = [];
     
     fileData.headers.forEach(h => {
        if (h === masterCol) return;
        const match = getHardcodedMatch(h);
        if (match) {
           auto[h] = match;
        } else {
           unmapped.push(h);
        }
     });
     
     setAutoMapped(auto);
     setUnmappedHeaders(unmapped);
     
     // default manual map
     let initManual = {};
     unmapped.forEach(h => initManual[h] = { table: '', column: '' });
     setManualMap(initManual);
  }, [masterCol, fileData]);

  const handleManualMap = (header, k, v) => {
     setManualMap(prev => ({
        ...prev,
        [header]: { ...prev[header], [k]: v }
     }));
  };

  const prepararConciliacao = async () => {
    if (!masterCol) return;
    setIsLoadingDB(true);
    setDiffs([]);

    try {
      // Create consolidated execution map
      const exMap = { ...autoMapped };
      // Inject manually mapped valid columns
      Object.keys(manualMap).forEach(header => {
         const m = manualMap[header];
         if (m.table && m.column) {
            // lookup label for aesthetics
            let cLabel = header;
            const schArr = SUPABASE_SCHEMA[m.table];
            if(schArr) {
               const f = schArr.find(x => x.value === m.column);
               if(f) cLabel = f.label;
            }
            exMap[header] = { t: m.table, c: m.column, l: cLabel };
         }
      });

      if (Object.keys(exMap).length === 0) {
        throw new Error("Não há nenhuma coluna devidamente mapeada para seguir à Auditoria Visual.");
      }

      // 2. Extrair CNJs e sanitizar
      const rowMapsByCNJ = {}; 
      let cnjsValidos = [];
      
      fileData.rows.forEach(r => {
         let rawCnj = r[masterCol];
         if(!rawCnj) return;
         let limpo = String(rawCnj).replace(/\D/g, '');
         if (limpo.length === 20) {
             cnjsValidos.push(limpo);
             rowMapsByCNJ[limpo] = r;
         }
      });
      cnjsValidos = [...new Set(cnjsValidos)]; 

      if (cnjsValidos.length === 0) {
         throw new Error("Sua planilha não possui CNJs válidos de 20 dígitos após limpar pontuações.");
      }

      // 3. Descobrir quais tabelas precisam ser consultadas
      let tablesToFetch = new Set();
      Object.values(exMap).forEach(m => tablesToFetch.add(m.t));
      
      const CHUNK_SIZE = 150;
      let databaseMemory = { processos: {}, financeiro: {}, audiencias: {} }; 
      
      for(const t of Array.from(tablesToFetch)){
         for (let i = 0; i < cnjsValidos.length; i += CHUNK_SIZE) {
            const chunk = cnjsValidos.slice(i, i + CHUNK_SIZE);
            const { data, error } = await supabase.from(t).select('*').in('numero_cnj', chunk);
            if (!error && data) {
               data.forEach(dbRow => { databaseMemory[t][dbRow.numero_cnj] = dbRow; });
            }
            setDbFetchProgress(Math.round(((i + chunk.length) / cnjsValidos.length) * 50));
         }
      }

      // 5. Motor de Diff
      let foundDiffs = [];
      let diffId = 0;

      cnjsValidos.forEach(cnj => {
         const planRow = rowMapsByCNJ[cnj];
         
         Object.keys(exMap).forEach(planHeader => {
            const config = exMap[planHeader]; // {t, c, l}
            const valPlanilha = planRow[planHeader] || "";
            
            const bancoRow = databaseMemory[config.t][cnj];
            const valBanco = bancoRow ? (bancoRow[config.c] || "") : null; 
            
            if (bancoRow) {
               let strPlan = String(valPlanilha).trim().toLowerCase();
               let strBanco = String(valBanco).trim().toLowerCase();
               
               if (strPlan && strBanco !== strPlan && strPlan !== "null" && strPlan !== "undefined" && strPlan !== "") {
                   foundDiffs.push({
                      id: diffId++,
                      cnj: cnj,
                      table: config.t,
                      dbCol: config.c,
                      colName: config.l,
                      oldVal: valBanco || "—",
                      newVal: valPlanilha,
                      checked: true
                   });
               }
            }
         });
      });

      setDbFetchProgress(100);
      setTimeout(() => {
         setIsLoadingDB(false);
         setDiffs(foundDiffs);
         setStep(foundDiffs.length > 0 ? 3 : 5); // 5 Se nada para atualizar
      }, 500);

    } catch(e) {
      alert(e.message);
      setIsLoadingDB(false);
    }
  };

  const toggleCheck = (id) => {
     setDiffs(diffs.map(d => d.id === id ? { ...d, checked: !d.checked } : d));
  };

  const toggleAll = () => {
     const allChecked = diffs.every(d => d.checked);
     setDiffs(diffs.map(d => ({ ...d, checked: !allChecked })));
  };

  const executarUpdate = async () => {
     const toUpdate = diffs.filter(d => d.checked);
     if (toUpdate.length === 0) return;
     
     setIsUpdating(true);
     let updated = 0;
     let errs = [];

     let masterPayloads = {}; 
     toUpdate.forEach(d => {
        if(!masterPayloads[d.table]) masterPayloads[d.table] = {};
        if(!masterPayloads[d.table][d.cnj]) masterPayloads[d.table][d.cnj] = {};
        masterPayloads[d.table][d.cnj][d.dbCol] = d.newVal;
     });

     for (const table of Object.keys(masterPayloads)) {
        for (const cnj of Object.keys(masterPayloads[table])) {
           try {
              const payload = masterPayloads[table][cnj];
              const { error } = await supabase.from(table).update(payload).eq('numero_cnj', cnj);
              if (error) throw error;
              updated++;
           } catch(err) {
              errs.push(`${formatCNJ(cnj)}: falha na tabela ${table}`);
           }
        }
     }

     setIsUpdating(false);
     setFinalStatus({ updated, errors: errs });
     setStep(4);
  };

  const formatCNJ = (cnj) => {
    if(cnj.length !== 20) return cnj;
    return `${cnj.slice(0,7)}-${cnj.slice(7,9)}.${cnj.slice(9,13)}.${cnj.slice(13,14)}.${cnj.slice(14,16)}.${cnj.slice(16,20)}`;
  };

  return (
    <div className="max-w-7xl mx-auto w-full px-4 py-8 animate-in fade-in text-slate-800 dark:text-zinc-200">
      
      {/* Upload Initial */}
      {(step === 1 || (step === 2 && !isLoadingDB)) && (
        <div className="max-w-3xl mx-auto space-y-8 mt-6">
           <div className="text-center mb-8">
              <h1 className="text-4xl font-newsreader font-bold text-slate-900 dark:text-zinc-100 flex items-center justify-center gap-3">
                 Conciliação de Dados
              </h1>
              <p className="text-slate-500 dark:text-zinc-400 mt-2">Arraste seu documento para uma auditoria visual inteligente antes de atualizar o banco.</p>
           </div>
           
           {!fileData ? (
             <label className="block cursor-pointer group animate-in slide-in-from-bottom-4">
                <div className="border border-dashed border-slate-300 dark:border-white/10 bg-slate-50 dark:bg-[#151515] rounded-3xl p-16 text-center transition-all hover:bg-slate-100 dark:hover:bg-zinc-800/80 shadow-sm">
                   <UploadCloud size={48} className="text-slate-400 mx-auto mb-4 group-hover:text-stitch-burgundy dark:group-hover:text-stitch-secondary transition-colors" />
                   <h3 className="font-bold font-inter text-slate-800 dark:text-zinc-200 mb-1">Selecionar Planilha</h3>
                   <p className="text-slate-500 dark:text-zinc-500 text-xs uppercase tracking-widest font-bold">.XLSX, .CSV</p>
                   <input type="file" className="hidden" accept=".csv, .xls, .xlsx" onChange={handleFileUpload} />
                </div>
             </label>
           ) : (
             <div className="bg-white dark:bg-[#151515] p-6 md:p-8 border border-slate-200 dark:border-white/10 rounded-3xl shadow-sm space-y-8 animate-in fade-in">
                <div className="flex bg-slate-50 dark:bg-black/30 w-full p-4 rounded-xl border border-dashed border-slate-200 dark:border-white/5 items-center justify-between">
                   <div className="flex gap-3 items-center">
                     <FileSpreadsheet size={24} className="text-stitch-burgundy dark:text-stitch-secondary" />
                     <div>
                       <p className="font-bold text-sm text-slate-800 dark:text-zinc-200">Arquivo Carregado</p>
                       <p className="text-xs text-slate-500">{fileData.rows.length} registros</p>
                     </div>
                   </div>
                   <button onClick={() => { setFileData(null); setMasterCol(''); }} className="text-xs text-slate-500 hover:text-rose-500 font-bold uppercase tracking-widest flex items-center gap-1">Trocar Arquivo</button>
                </div>

                <div className="space-y-4">
                   <h2 className="text-2xl font-newsreader font-bold text-slate-900 dark:text-zinc-100">
                      Qual coluna da sua planilha contém o Número do Processo (CNJ)?
                   </h2>
                   <select 
                      className="w-full p-4 bg-slate-50 dark:bg-black/50 border border-slate-200 dark:border-white/10 rounded-xl text-slate-800 dark:text-zinc-200 focus:outline-none focus:border-stitch-burgundy font-medium text-lg cursor-pointer"
                      value={masterCol}
                      onChange={(e) => setMasterCol(e.target.value)}
                   >
                      <option value="" disabled>Selecione a Coluna...</option>
                      {fileData.headers.map(h => <option key={h} value={h}>{h}</option>)}
                   </select>
                </div>
                
                {masterCol && (
                   <div className="pt-6 border-t border-slate-200 dark:border-white/5 animate-in slide-in-from-top-4">
                      {/* Resumo da inteligencia */}
                      {Object.keys(autoMapped).length > 0 && (
                         <div className="mb-6 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-900/30 p-4 rounded-xl">
                            <h4 className="text-emerald-800 dark:text-emerald-400 font-bold text-sm mb-2 flex items-center gap-2"><CheckCircle2 size={16}/> Colunas identificadas automaticamente:</h4>
                            <div className="flex flex-wrap gap-2">
                               {Object.keys(autoMapped).map(h => (
                                  <span key={h} className="text-xs px-2 py-1 bg-white dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 rounded shadow-sm border border-emerald-100 dark:border-emerald-800/50">
                                     {h} → {autoMapped[h].l}
                                  </span>
                               ))}
                            </div>
                         </div>
                      )}

                      {/* VÁLVULA DE ESCAPE */}
                      {unmappedHeaders.length > 0 && (
                         <div className="space-y-4">
                            <div className="flex items-center gap-2">
                               <ShieldAlert size={20} className="text-amber-500" />
                               <h3 className="font-newsreader font-bold text-xl text-slate-800 dark:text-zinc-200">Colunas não mapeadas automaticamente</h3>
                            </div>
                            <p className="text-sm text-slate-500 dark:text-zinc-400">Direcione as colunas abaixo para as tabelas corretas, se desejar importar.</p>
                            
                            <div className="space-y-3">
                               {unmappedHeaders.map(h => {
                                  const cMap = manualMap[h] || {table: '', column: ''};
                                  const colsAv = SUPABASE_SCHEMA[cMap.table] || [];
                                  
                                  return (
                                     <div key={h} className="flex flex-col sm:flex-row items-center gap-3 bg-slate-50 dark:bg-[#111] p-3 rounded-xl border border-slate-200 dark:border-white/5 shadow-sm">
                                        <div className="sm:w-1/3 truncate text-sm font-bold text-slate-700 dark:text-zinc-300 pl-2">{h}</div>
                                        <div className="sm:w-1/3 w-full">
                                           <select 
                                             className="w-full p-2 bg-white dark:bg-black/50 border border-slate-200 dark:border-white/10 rounded-lg text-xs font-medium text-slate-700 dark:text-zinc-300 focus:outline-none"
                                             value={cMap.table}
                                             onChange={(e) => handleManualMap(h, 'table', e.target.value)}
                                           >
                                              <option value="">-- Ignorar --</option>
                                              <option value="processos">Tabela processos</option>
                                              <option value="financeiro">Tabela financeiro</option>
                                              <option value="audiencias">Tabela audiencias</option>
                                           </select>
                                        </div>
                                        <div className="sm:w-1/3 w-full flex gap-2">
                                           <select 
                                             className="w-full p-2 bg-white dark:bg-black/50 border border-slate-200 dark:border-white/10 rounded-lg text-xs font-medium text-slate-700 dark:text-zinc-300 focus:outline-none disabled:opacity-40"
                                             value={cMap.column}
                                             onChange={(e) => handleManualMap(h, 'column', e.target.value)}
                                             disabled={!cMap.table}
                                           >
                                              <option value="">Selecione...</option>
                                              {colsAv.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                                           </select>
                                        </div>
                                     </div>
                                  );
                               })}
                            </div>
                         </div>
                      )}

                      <div className="pt-8 flex justify-end">
                         <button 
                            onClick={prepararConciliacao}
                            className="px-8 py-4 bg-slate-900 dark:bg-white text-white dark:text-black font-bold uppercase tracking-widest text-xs rounded-xl hover:shadow-lg transition-all flex items-center gap-2 group"
                         >
                            Auditar Com O Banco de Dados <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                         </button>
                      </div>
                   </div>
                )}
             </div>
           )}
        </div>
      )}

      {/* Loading Block Database Extracting */}
      {step === 2 && isLoadingDB && (
         <div className="max-w-2xl mx-auto py-24 flex flex-col items-center justify-center space-y-4 animate-in fade-in">
            <Loader2 size={36} className="animate-spin text-stitch-burgundy dark:text-stitch-secondary" />
            <h2 className="font-bold text-slate-800 dark:text-zinc-200 text-xl font-newsreader">Buscando {fileData?.rows.length} itens no Supabase...</h2>
            <div className="w-64 h-2 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
               <div className="h-full bg-stitch-burgundy dark:bg-stitch-secondary transition-all" style={{ width: `${dbFetchProgress}%` }}></div>
            </div>
            <p className="text-xs text-slate-500 font-mono">Realizando Diff Checker.</p>
         </div>
      )}

      {/* STEP 3: AUDITORIA VISUAL DIFERENCIAL */}
      {step === 3 && diffs.length > 0 && (
         <div className="space-y-6 animate-in slide-in-from-bottom-8 duration-500">
            <div className="flex flex-col md:flex-row justify-between md:items-end gap-4 pb-4">
               <div>
                  <h1 className="text-3xl font-newsreader font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-3"><Search size={28} className="text-stitch-burgundy dark:text-stitch-secondary" /> Revisão de Atualizações</h1>
                  <p className="text-slate-500 dark:text-zinc-400 text-sm mt-1">
                     Encontramos <strong className="text-stitch-burgundy dark:text-stitch-secondary bg-stitch-burgundy/10 px-2 py-0.5 rounded">{diffs.length} diferenças</strong> entre a sua planilha e os registros do Banco em nuvem.
                  </p>
               </div>
               <div className="flex flex-col sm:flex-row gap-4 items-center">
                  <button onClick={toggleAll} className="text-xs font-bold uppercase tracking-widest text-slate-500 hover:text-slate-800 dark:hover:text-zinc-300">
                     Marcar / Desmarcar Tudo
                  </button>
                  <button 
                     onClick={executarUpdate} disabled={isUpdating}
                     className="px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold uppercase tracking-widest text-xs rounded-xl flex items-center gap-2 shadow-lg shadow-emerald-900/20 disabled:opacity-50 transition-all font-inter"
                  >
                     {isUpdating ? <Loader2 size={16} className="animate-spin" /> : null} 
                     Aprovar e Atualizar [{diffs.filter(d=>d.checked).length}] itens
                  </button>
               </div>
            </div>

            <div className="bg-white dark:bg-[#151515] border border-slate-200 dark:border-white/5 rounded-3xl overflow-hidden shadow-sm">
               {/* Body Rows Clean UI */}
               <div className="max-h-[65vh] overflow-y-auto custom-scrollbar p-2">
                  {diffs.map(d => (
                     <div key={d.id} 
                        className={`flex flex-col md:flex-row gap-4 p-4 my-2 mx-2 rounded-2xl items-center border transition-all 
                        ${d.checked ? 'bg-slate-50 dark:bg-black/40 border-slate-300 dark:border-zinc-700' : 'bg-transparent border-transparent opacity-50 grayscale'}`}
                     >
                        <div className="flex justify-center shrink-0">
                           <button onClick={() => toggleCheck(d.id)} className="focus:outline-none transition-transform hover:scale-110">
                              {d.checked ? <CheckSquare size={24} className="text-emerald-500" /> : <Square size={24} className="text-slate-300 dark:text-zinc-600" />}
                           </button>
                        </div>
                        
                        <div className="w-full md:w-1/4 shrink-0 px-2 border-l border-slate-200 dark:border-white/5">
                           <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1">Processo CNJ</p>
                           <p className="font-mono text-sm font-bold text-slate-800 dark:text-zinc-200 break-all">{formatCNJ(d.cnj)}</p>
                        </div>

                        <div className="w-full md:w-1/6 shrink-0 px-2 lg:border-l border-slate-200 dark:border-white/5">
                           <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1">Dado Alterado</p>
                           <span className="text-xs font-bold text-slate-700 dark:text-zinc-300 leading-tight">{d.colName}</span>
                        </div>

                        <div className="w-full md:w-1/4 p-3 bg-slate-100/50 dark:bg-black/60 rounded-xl border border-slate-200 dark:border-white/5">
                           <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1 flex items-center justify-between">
                              Valor Atual no Banco <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600"></span>
                           </p>
                           <p className="text-sm line-clamp-3 text-slate-600 dark:text-zinc-400 font-medium">
                              {d.oldVal}
                           </p>
                        </div>
                        
                        <div className="hidden md:flex shrink-0 px-2 items-center text-slate-300 dark:text-zinc-700"><ArrowRight size={20} /></div>

                        <div className="w-full md:w-1/4 p-3 bg-emerald-50 dark:bg-emerald-950/20 rounded-xl border border-emerald-100 dark:border-emerald-900/30">
                           <p className="text-[10px] uppercase tracking-widest text-emerald-600 dark:text-emerald-500 font-bold mb-1 flex items-center justify-between">
                              Novo Valor (Planilha) <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                           </p>
                           <p className="text-sm line-clamp-3 text-emerald-800 dark:text-emerald-300 font-bold">
                              {d.newVal}
                           </p>
                        </div>
                     </div>
                  ))}
               </div>
            </div>
         </div>
      )}

      {/* STEP 4: RESULTADO FINAL */}
      {step === 4 && finalStatus && (
         <div className="max-w-2xl mx-auto py-16 text-center space-y-6 animate-in zoom-in duration-500">
            <CheckCircle2 size={80} className="mx-auto text-emerald-500" />
            <h1 className="text-3xl font-newsreader font-bold text-slate-900 dark:text-white">Atualização Concluída</h1>
            <p className="text-slate-500 dark:text-zinc-400">
               Nós atualizamos <strong className="text-slate-800 dark:text-zinc-200 text-lg">{finalStatus.updated} {finalStatus.updated === 1 ? 'instância' : 'instâncias'}</strong> no sistema de forma segura. O Farol foi sincronizado automaticamente.
            </p>
            
            {finalStatus.errors.length > 0 && (
               <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 rounded-xl p-4 text-left max-h-48 overflow-auto mt-6">
                  <p className="text-xs font-bold text-rose-700 dark:text-rose-400 uppercase mb-2">As seguintes linhas falharam:</p>
                  <ul className="text-xs font-mono text-rose-600/80 dark:text-rose-300/80 space-y-1">
                     {finalStatus.errors.map((e,i) => <li key={i}>{e}</li>)}
                  </ul>
               </div>
            )}

            <div className="pt-8 flex justify-center gap-4">
               <button onClick={() => { setStep(1); setFileData(null); setMasterCol(''); }} className="px-6 py-3 border border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-300 font-bold uppercase tracking-widest text-xs rounded-xl hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors">Voltar</button>
               <a href="/farol" className="px-8 py-3 bg-slate-900 dark:bg-white text-white dark:text-black font-bold uppercase tracking-widest text-xs rounded-xl hover:shadow-lg transition-all">Ver no Farol</a>
            </div>
         </div>
      )}

      {/* STEP 5: Nada a atualizar */}
      {step === 5 && (
         <div className="max-w-2xl mx-auto py-16 text-center space-y-6 animate-in zoom-in duration-500">
            <Info size={80} className="mx-auto text-slate-300 dark:text-zinc-600" />
            <h1 className="text-3xl font-newsreader font-bold text-slate-900 dark:text-white">Nenhuma Mudança Necessária</h1>
            <p className="text-slate-500 dark:text-zinc-400 text-lg">
               Sua planilha não possui nenhuma informação diferente do que já está armazenado no sistema hoje. 
            </p>
            <div className="pt-8">
               <button onClick={() => { setStep(1); setFileData(null); setMasterCol(''); }} className="px-8 py-4 bg-slate-900 dark:bg-white text-white dark:text-black font-bold uppercase tracking-widest text-xs rounded-xl hover:shadow-lg transition-all">Carregar Outra Planilha</button>
            </div>
         </div>
      )}

    </div>
  );
}
