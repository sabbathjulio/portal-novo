"use client";

import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { supabase } from '@/lib/supabase';
import { 
  FileSpreadsheet, Database, Loader2, ArrowRight, XCircle, 
  CheckCircle2, Square, CheckSquare, Search, Info
} from 'lucide-react';

const COL_DICT = {
  // PROCESSOS
  reclamante: { t: 'processos', c: 'reclamante', l: 'Nome Reclamante' },
  autor: { t: 'processos', c: 'reclamante', l: 'Nome Reclamante' },
  reu: { t: 'processos', c: 'reu_principal', l: 'Réu Principal' },
  empresa: { t: 'processos', c: 'reu_principal', l: 'Réu Principal' },
  unidade: { t: 'processos', c: 'unidade', l: 'Unidade' },
  fase: { t: 'processos', c: 'fase_atual', l: 'Fase' },
  etapa: { t: 'processos', c: 'fase_atual', l: 'Fase' },
  status_geral: { t: 'processos', c: 'status_geral', l: 'Status' },
  risco: { t: 'processos', c: 'risco', l: 'Risco' },
  funcao: { t: 'processos', c: 'funcao', l: 'Função' },
  cargo: { t: 'processos', c: 'funcao', l: 'Função' },
  admissao: { t: 'processos', c: 'data_admissao', l: 'Data Admissão' },
  demissao: { t: 'processos', c: 'data_demissao', l: 'Data Demissão' },
  // FINANCEIRO
  causa: { t: 'financeiro', c: 'valor_causa', l: 'Valor da Causa' },
  acordo: { t: 'financeiro', c: 'valor_acordo', l: 'Valor do Acordo' },
  deposito: { t: 'financeiro', c: 'deposito_recursal', l: 'Depósito Recursal' },
  custas: { t: 'financeiro', c: 'custas', l: 'Custas' },
  condenacao: { t: 'financeiro', c: 'condenacao', l: 'Condenação' },
  // AUDIENCIAS
  tipo_aud: { t: 'audiencias', c: 'tipo', l: 'Tipo Audiência' },
  aud_tipo: { t: 'audiencias', c: 'tipo', l: 'Tipo Audiência' },
  data_aud: { t: 'audiencias', c: 'data_hora', l: 'Data Audiência' },
  aud_data: { t: 'audiencias', c: 'data_hora', l: 'Data Audiência' }
};

function autoFindMap(rawName) {
   let name = String(rawName).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().replace(/\s+/g, '_');
   for(let k of Object.keys(COL_DICT)) {
      if (name.includes(k) || (k.length > 5 && name === k.substring(0, name.length))) {
        return COL_DICT[k];
      }
   }
   return null;
}

export default function ConciliacaoDadosPage() {
  const [step, setStep] = useState(1);
  const [fileData, setFileData] = useState(null);
  const [masterCol, setMasterCol] = useState('');
  
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
        setStep(2); // Vai para selecionar CNJ
      } catch(err) {
        alert("Erro no arquivo: " + err.message);
      }
    };
    reader.readAsBinaryString(file);
  };

  const prepararConciliacao = async () => {
    if (!masterCol) return;
    setIsLoadingDB(true);
    setDiffs([]);

    try {
      // 1. Dicionário Ativo - descobrir quais colunas vao pra qual tabela
      const activeMapping = {};
      fileData.headers.forEach(h => {
        if (h === masterCol) return;
        const mapped = autoFindMap(h);
        if (mapped) activeMapping[h] = mapped;
      });

      if (Object.keys(activeMapping).length === 0) {
        throw new Error("Nenhuma coluna (como 'Fases', 'Nome', 'Valor') foi identificada pelo motor para auditoria.");
      }

      // 2. Extrair CNJs e sanitizar
      const rowMapsByCNJ = {}; // map { cnjLimpo: rowObject }
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
      cnjsValidos = [...new Set(cnjsValidos)]; // uniques

      if (cnjsValidos.length === 0) {
         throw new Error("Sua planilha não possui CNJs válidos de 20 dígitos após limpar pontuações.");
      }

      // 3. Descobrir quais tabelas precisam ser consultadas
      let tablesToFetch = new Set();
      Object.values(activeMapping).forEach(m => tablesToFetch.add(m.t));
      
      // 4. Buscar em chunks
      const CHUNK_SIZE = 150;
      let databaseMemory = { processos: {}, financeiro: {}, audiencias: {} }; // agrupar por tabela -> cnj
      
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

      // 5. Motor de Diff (Comparação Banco vs Planilha)
      let foundDiffs = [];
      let diffId = 0;

      cnjsValidos.forEach(cnj => {
         const planRow = rowMapsByCNJ[cnj];
         
         Object.keys(activeMapping).forEach(planHeader => {
            const config = activeMapping[planHeader]; // {t, c, l}
            const valPlanilha = planRow[planHeader] || "";
            
            // Qual valor está no banco hoje?
            const bancoRow = databaseMemory[config.t][cnj];
            const valBanco = bancoRow ? (bancoRow[config.c] || "") : null; // Se bancoRow for null, cnj nem existe lá
            
            // Só gerar diff se CNJ EXISTIR naquela tabela e For Diferente
            if (bancoRow) {
               let strPlan = String(valPlanilha).trim().toLowerCase();
               let strBanco = String(valBanco).trim().toLowerCase();
               // Avoid false positives from pure type comparisons
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
         setStep(foundDiffs.length > 0 ? 3 : 5); // 5 Se não teve nada pra atualizar
      }, 500);

    } catch(e) {
      alert(e.message);
      setIsLoadingDB(false);
      setStep(1);
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

     // Agrupar otimizadamente
     // Diffs sao independentes. Um CNJ pode ter 2 alterações na Tabela Processos.
     let masterPayloads = {}; // { processos: { cnjP: {fase: x, risco: y} } }
     
     toUpdate.forEach(d => {
        if(!masterPayloads[d.table]) masterPayloads[d.table] = {};
        if(!masterPayloads[d.table][d.cnj]) masterPayloads[d.table][d.cnj] = {};
        masterPayloads[d.table][d.cnj][d.dbCol] = d.newVal;
     });

     // Push to db
     for (const table of Object.keys(masterPayloads)) {
        for (const cnj of Object.keys(masterPayloads[table])) {
           try {
              const payload = masterPayloads[table][cnj];
              const { error } = await supabase.from(table).update(payload).eq('numero_cnj', cnj);
              if (error) throw error;
              updated++;
           } catch(err) {
              errs.push(`${cnj}: ${err.message}`);
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
      
      {/* STEPS 1 OU 2 (Envio da Planilha) */}
      {(step === 1 || step === 2) && (
        <div className="max-w-3xl mx-auto space-y-8 mt-12 animate-in slide-in-from-bottom-4">
           <div className="text-center mb-8">
              <h1 className="text-4xl font-newsreader font-bold text-slate-900 dark:text-zinc-100 flex items-center justify-center gap-3">
                 <FileSpreadsheet className="text-stitch-burgundy dark:text-stitch-secondary" size={36} /> 
                 Conciliação de Dados
              </h1>
              <p className="text-slate-500 dark:text-zinc-400 mt-2">Arraste seu documento Excel ou CSV para uma auditoria visual inteligente antes de atualizar o sistema.</p>
           </div>
           
           {!fileData ? (
             <label className="block cursor-pointer group">
                <div className="border border-dashed border-slate-300 dark:border-white/10 bg-slate-50 dark:bg-[#151515] rounded-3xl p-16 text-center transition-all hover:bg-slate-100 dark:hover:bg-zinc-800/80 shadow-sm">
                   <UploadCloud size={48} className="text-slate-400 mx-auto mb-4 group-hover:text-stitch-burgundy dark:group-hover:text-stitch-secondary transition-colors" />
                   <h3 className="font-bold font-inter text-slate-800 dark:text-zinc-200 mb-1">Selecionar Planilha</h3>
                   <p className="text-slate-500 dark:text-zinc-500 text-xs uppercase tracking-widest font-bold">.XLSX, .CSV, .XLS</p>
                   <input type="file" className="hidden" accept=".csv, .xls, .xlsx" onChange={handleFileUpload} />
                </div>
             </label>
           ) : (
             <div className="bg-white dark:bg-[#151515] p-8 border border-slate-200 dark:border-white/10 rounded-3xl shadow-sm space-y-8 animate-in fade-in">
                <div className="flex bg-slate-50 dark:bg-black/30 w-full p-4 rounded-xl border border-dashed border-slate-200 dark:border-white/5 items-center justify-between">
                   <div className="flex gap-3 items-center">
                     <FileSpreadsheet size={24} className="text-stitch-burgundy dark:text-stitch-secondary" />
                     <div>
                       <p className="font-bold text-sm text-slate-800 dark:text-zinc-200">Arquivo Carregado</p>
                       <p className="text-xs text-slate-500">{fileData.rows.length} registros detectados</p>
                     </div>
                   </div>
                   <button onClick={() => { setFileData(null); setMasterCol(''); }} className="text-xs text-slate-500 hover:text-rose-500 font-bold uppercase tracking-widest flex items-center gap-1">Trovar Arquivo</button>
                </div>

                {!isLoadingDB ? (
                  <>
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
                        <div className="pt-4 flex justify-end">
                           <button 
                              onClick={prepararConciliacao}
                              className="px-8 py-4 bg-slate-900 dark:bg-white text-white dark:text-black font-bold uppercase tracking-widest text-xs rounded-xl hover:shadow-lg transition-all flex items-center gap-2 group"
                           >
                              Comparar com o Banco de Dados <Search size={16} className="group-hover:scale-110 transition-transform" />
                           </button>
                        </div>
                     )}
                  </>
                ) : (
                  <div className="py-12 flex flex-col items-center justify-center space-y-4 animate-in fade-in">
                     <Loader2 size={36} className="animate-spin text-stitch-burgundy dark:text-stitch-secondary" />
                     <h2 className="font-bold text-slate-800 dark:text-zinc-200">Auditando {fileData.rows.length} processos...</h2>
                     <div className="w-64 h-2 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                        <div className="h-full bg-stitch-burgundy dark:bg-stitch-secondary transition-all" style={{ width: `${dbFetchProgress}%` }}></div>
                     </div>
                     <p className="text-xs text-slate-500 font-mono">Buscando dados antigos no Supabase.</p>
                  </div>
                )}
             </div>
           )}
        </div>
      )}

      {/* STEP 3: AUDITORIA VISUAL */}
      {step === 3 && diffs.length > 0 && (
         <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
            <div className="flex flex-col md:flex-row justify-between md:items-end gap-4 border-b border-slate-200 dark:border-zinc-800 pb-4">
               <div>
                  <h1 className="text-3xl font-newsreader font-bold text-slate-900 dark:text-zinc-100">Revisão de Atualizações</h1>
                  <p className="text-slate-500 dark:text-zinc-400 text-sm mt-1">O sistema encontrou <strong className="text-stitch-burgundy dark:text-stitch-secondary">{diffs.length} diferenças</strong> entre sua planilha e o banco de dados.</p>
               </div>
               <div className="flex gap-4">
                  <button onClick={toggleAll} className="text-xs font-bold uppercase tracking-widest text-slate-500 hover:text-slate-800 dark:hover:text-zinc-300">
                     Marcar / Desmarcar Todos
                  </button>
                  <button 
                     onClick={executarUpdate} disabled={isUpdating}
                     className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold uppercase tracking-widest text-xs rounded-lg flex items-center gap-2 shadow-lg shadow-emerald-900/20 disabled:opacity-50 transition-all font-inter"
                  >
                     {isUpdating ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />} 
                     Aprovar e Atualizar ({diffs.filter(d=>d.checked).length})
                  </button>
               </div>
            </div>

            <div className="bg-white dark:bg-[#151515] border border-slate-200 dark:border-white/5 rounded-2xl overflow-hidden shadow-sm">
               {/* Head */}
               <div className="grid grid-cols-12 gap-4 p-4 border-b border-slate-100 dark:border-white/5 font-bold text-[10px] uppercase tracking-widest text-slate-500 bg-slate-50 dark:bg-black/20">
                  <div className="col-span-1 text-center">Aplicar</div>
                  <div className="col-span-3">Processo Identificado</div>
                  <div className="col-span-2">Dado Alterado</div>
                  <div className="col-span-3">Valor Antigo (Banco)</div>
                  <div className="col-span-3">Novo Valor (Sua Planilha)</div>
               </div>

               {/* Body Rows */}
               <div className="max-h-[60vh] overflow-y-auto custom-scrollbar">
                  {diffs.map(d => (
                     <div key={d.id} 
                        className={`grid grid-cols-12 gap-4 border-b border-slate-100 dark:border-white/5 p-4 items-center transition-colors 
                        ${d.checked ? 'bg-white dark:bg-transparent hover:bg-slate-50 dark:hover:bg-zinc-800/30' : 'bg-slate-50 dark:bg-black/40 opacity-60'}`}
                     >
                        <div className="col-span-1 flex justify-center">
                           <button onClick={() => toggleCheck(d.id)} className="focus:outline-none transition-transform hover:scale-110">
                              {d.checked ? <CheckSquare size={20} className="text-emerald-500" /> : <Square size={20} className="text-slate-300 dark:text-zinc-600" />}
                           </button>
                        </div>
                        <div className="col-span-3 truncate">
                           <p className="font-mono text-sm font-bold text-slate-800 dark:text-zinc-200">{formatCNJ(d.cnj)}</p>
                        </div>
                        <div className="col-span-2">
                           <span className="text-xs font-bold uppercase tracking-widest bg-black/5 dark:bg-white/10 px-2 py-1 rounded text-slate-600 dark:text-zinc-400">{d.colName}</span>
                        </div>
                        <div className="col-span-3 flex items-center pr-2 border-r border-slate-100 dark:border-zinc-800">
                           <p className="text-sm line-clamp-2 text-rose-700/80 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/20 px-2 py-1 rounded w-full border border-rose-100 dark:border-rose-900/30 font-medium">
                              {d.oldVal}
                           </p>
                        </div>
                        <div className="col-span-3 gap-2 flex items-center pl-2">
                           <ArrowRight size={14} className="text-emerald-300 shrink-0 hidden md:block" />
                           <p className="text-sm line-clamp-2 text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-1 rounded w-full border border-emerald-100 dark:border-emerald-900/30 font-medium">
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
               Nós atualizamos <strong className="text-slate-800 dark:text-zinc-200 text-lg">{finalStatus.updated} {finalStatus.updated === 1 ? 'instância' : 'instâncias'}</strong> no sistema de forma segura. O Farol foi sincronizado automaticamente com os novos dados.
            </p>
            
            {finalStatus.errors.length > 0 && (
               <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 rounded-xl p-4 text-left max-h-48 overflow-auto mt-6">
                  <p className="text-xs font-bold text-rose-700 dark:text-rose-400 uppercase mb-2">As seguintes linhas não foram salvas por erro na rede:</p>
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
            <h1 className="text-3xl font-newsreader font-bold text-slate-900 dark:text-white">Sem Mudanças</h1>
            <p className="text-slate-500 dark:text-zinc-400 text-lg">
               Sua planilha não possui nenhuma informação diferente do que já está armazenado no sistema hoje, ou os cabeçalhos não deram match. 
            </p>
            <div className="pt-8">
               <button onClick={() => { setStep(1); setFileData(null); setMasterCol(''); }} className="px-8 py-4 bg-slate-900 dark:bg-white text-white dark:text-black font-bold uppercase tracking-widest text-xs rounded-xl hover:shadow-lg transition-all">Carregar Outra Planilha</button>
            </div>
         </div>
      )}

    </div>
  );
}
