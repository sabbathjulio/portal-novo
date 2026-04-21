import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const ITENS_PADRAO = {
  admissionais: ["Ficha de Registro", "Contrato de Trabalho", "Opção de Vale Transporte", "Termo de Confidencialidade", "Documentos Pessoais"],
  contrato: ["ASO", "Acordo de Prorrogação", "Advertências", "Comprovantes", "Atestados"],
  financeiro: ["Holerites", "Comprovante Salário", "FGTS"],
  jornada: ["Espelhos de Ponto", "Log Latitude", "Fichas Diárias"]
};

export default function ProcessModal({ process, onClose, onSave, onPrint }) {
  const [modalObs, setModalObs] = useState(process.obs || "");
  const [modalStatus, setModalStatus] = useState(process.status || "Solicitado");
  const [modalUrgente, setModalUrgente] = useState(process.urgente || false);
  const [modalChecklist, setModalChecklist] = useState(process.checklist || []);

  const handleSave = async () => {
    try {
      await supabase.from('farol_documentacao').update({
        status_farol: modalStatus, 
        is_urgente: modalUrgente,
        checklist_arquivado: modalChecklist, 
        observacao_juridica: modalObs
      }).eq('numero_cnj', process.processo);
      
      onSave({
         ...process,
         status: modalStatus,
         urgente: modalUrgente,
         checklist: modalChecklist,
         obs: modalObs
      });
    } catch (e) { console.error("Falha ao salvar:", e); }
  };

  const handleDocumentToggle = (item, isChecked) => {
    if (isChecked) {
       setModalChecklist([...modalChecklist, item]);
    } else {
       setModalChecklist(modalChecklist.filter(x => x !== item));
    }
  };

  // Linha do tempo cronológica
  const sortedAudiencias = (process.audiencias || []).sort((a, b) => new Date(a.data_hora) - new Date(b.data_hora));

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
       <div className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 w-full max-w-5xl max-h-[95vh] overflow-y-auto rounded-xl shadow-2xl flex flex-col">
          
          {/* Header Modal */}
          <div className="sticky top-0 bg-white dark:bg-[#121212] border-b border-slate-200 dark:border-zinc-800 p-6 flex justify-between items-start z-10 shadow-sm">
             <div>
                <h2 className="font-newsreader text-2xl font-medium text-slate-900 dark:text-zinc-100 italic">{process.reclamante}</h2>
                <div className="flex gap-4 items-center mt-2">
                   <p className="text-xs text-slate-500 font-mono tracking-widest uppercase">{process.processo}</p>
                   <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-zinc-900 text-[10px] text-slate-600 dark:text-zinc-400 border border-slate-200 dark:border-zinc-800 uppercase font-bold tracking-widest">
                       {process.unidade || "Sem Unidade"}
                   </span>
                </div>
             </div>
             <button onClick={onClose} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-zinc-900 rounded-full transition-all"><X size={20}/></button>
          </div>

          <div className="p-8 grid grid-cols-1 md:grid-cols-12 gap-8 bg-slate-50 dark:bg-zinc-950/50">
             
             {/* Info Estática & Linha do Tempo (Left Panel - 5 Cols) */}
             <div className="col-span-1 md:col-span-4 space-y-6">
                
                <div className="bg-white dark:bg-[#151515] p-5 rounded-lg border border-slate-200 dark:border-zinc-800 shadow-sm">
                   <h4 className="text-[10px] text-slate-500 uppercase font-bold tracking-widest border-b border-slate-200 dark:border-zinc-800 pb-2 mb-4">Dados Contratuais</h4>
                   <div className="space-y-3 font-inter text-xs">
                      <div className="flex justify-between border-b border-slate-50 dark:border-zinc-800/50 pb-2">
                         <span className="text-slate-500">Admissão</span>
                         <span className="text-slate-800 dark:text-zinc-300 font-medium">{process.admissao}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-50 dark:border-zinc-800/50 pb-2">
                         <span className="text-slate-500">Demissão</span>
                         <span className="text-slate-800 dark:text-zinc-300 font-medium">{process.demissao}</span>
                      </div>
                      <div className="flex justify-between flex-col gap-1 pb-1">
                         <span className="text-slate-500">Função</span>
                         <span className="text-slate-800 dark:text-zinc-300 font-medium truncate" title={process.funcao}>{process.funcao}</span>
                      </div>
                   </div>
                </div>

                <div className="bg-white dark:bg-[#151515] p-5 rounded-lg border border-slate-200 dark:border-zinc-800 shadow-sm">
                   <h4 className="text-[10px] text-slate-500 uppercase font-bold tracking-widest border-b border-slate-200 dark:border-zinc-800 pb-2 mb-4">Linha do Tempo Tática</h4>
                   <div className="space-y-4">
                      {sortedAudiencias.length === 0 ? (
                         <div className="text-xs text-slate-400 dark:text-zinc-600 italic">Sem audiências cadastradas na Sub-Base.</div>
                      ) : (
                         sortedAudiencias.map((aud, i) => {
                            const dataFormatada = new Date(aud.data_hora).toLocaleDateString('pt-BR');
                            return (
                               <div key={i} className="flex gap-3 text-xs w-full">
                                  <div className="flex flex-col items-center">
                                     <div className="w-2 h-2 rounded-full bg-stitch-burgundy dark:bg-stitch-secondary"></div>
                                     {i !== sortedAudiencias.length -1 && <div className="w-[1px] bg-slate-200 dark:bg-zinc-800 flex-1 my-1"></div>}
                                  </div>
                                  <div className="flex-1 pb-3">
                                     <p className="font-bold text-slate-800 dark:text-zinc-200 tracking-wide uppercase text-[10px]">{aud.tipo || "Audiência"}</p>
                                     <p className="text-slate-500 dark:text-zinc-500">{dataFormatada}</p>
                                  </div>
                               </div>
                            )
                         })
                      )}
                   </div>
                </div>
             </div>
             
             {/* Ação: Gestão (Right Panel - 7 Cols) */}
             <div className="col-span-1 md:col-span-8 flex flex-col space-y-6">
                
                <h4 className="text-[10px] text-slate-500 uppercase font-bold tracking-widest border-b border-slate-200 dark:border-zinc-800 pb-2">Controle Documental & Auditoria</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   {Object.entries(ITENS_PADRAO).map(([cat, itens]) => (
                      <div key={cat} className="space-y-3 bg-white dark:bg-[#151515] p-4 rounded-lg border border-slate-200 dark:border-zinc-800 shadow-sm">
                         <p className="text-[9px] font-bold text-stitch-burgundy dark:text-stitch-secondary uppercase tracking-[0.1em]">{cat}</p>
                         <div className="space-y-2">
                            {itens.map((it, i) => {
                              const isChecked = modalChecklist.includes(it);
                              return (
                                <label key={i} className="flex items-start gap-3 cursor-pointer group">
                                   <input 
                                     type="checkbox" checked={isChecked}
                                     onChange={(e) => handleDocumentToggle(it, e.target.checked)}
                                     className="w-4 h-4 rounded border-slate-300 dark:border-zinc-700 text-stitch-burgundy focus:ring-stitch-burgundy mt-0.5" 
                                   />
                                   <span className={`text-[11px] leading-tight ${isChecked ? 'text-slate-800 dark:text-zinc-200 font-medium' : 'text-slate-500'}`}>{it}</span>
                                </label>
                              )
                            })}
                         </div>
                      </div>
                   ))}
                </div>
                
                <div className="bg-white dark:bg-[#151515] p-6 rounded-lg border border-slate-200 dark:border-zinc-800 shadow-sm space-y-4">
                   <div className="space-y-2">
                      <label className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Apontamentos Jurídicos / Observações</label>
                      <textarea 
                         rows={3} value={modalObs} onChange={(e) => setModalObs(e.target.value)}
                         className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-3 rounded-md text-xs text-slate-800 dark:text-zinc-300 outline-none focus:ring-1 focus:ring-stitch-burgundy resize-none transition-all placeholder:text-slate-400 dark:placeholder:text-zinc-600"
                         placeholder="Registro tático de falhas estruturais ou necessidade de documentos extrínsecos..."
                      />
                   </div>
                   <div className="flex gap-4">
                      <div className="flex-1 space-y-2">
                         <label className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Status Triagem</label>
                         <select 
                           value={modalStatus} onChange={e => setModalStatus(e.target.value)}
                           className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-3 text-xs rounded-md text-slate-800 dark:text-zinc-300 outline-none focus:ring-1 focus:ring-stitch-burgundy font-medium"
                         >
                            <option value="Solicitado">🚨 PENDENTE DE CONFERÊNCIA</option>
                            <option value="Enviado">🟢 ENVIO DP AUTORIZADO</option>
                         </select>
                      </div>
                      <div className="flex-1 flex items-end">
                         <label className={`w-full flex justify-center items-center gap-2 p-3 rounded-md border cursor-pointer transition-colors ${modalUrgente ? 'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-900/50' : 'bg-slate-50 dark:bg-zinc-900 border-slate-200 dark:border-zinc-800'}`}>
                            <input 
                              type="checkbox" checked={modalUrgente} onChange={e => setModalUrgente(e.target.checked)}
                              className="w-4 h-4 rounded text-rose-600 border-slate-300 bg-transparent" 
                            />
                            <span className={`text-[10px] font-bold uppercase tracking-widest ${modalUrgente ? 'text-rose-600' : 'text-slate-500'}`}>Alerta Vermelho</span>
                         </label>
                      </div>
                   </div>
                </div>
                
                {/* Actions Footer */}
                <div className="mt-auto grid grid-cols-2 gap-4">
                   <button onClick={onPrint} className="py-4 border border-slate-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-900 rounded-md text-slate-600 dark:text-zinc-400 text-[10px] font-bold uppercase tracking-widest transition-colors shadow-sm">
                      Gerar Documento A4 (Off-screen)
                   </button>
                   <button onClick={handleSave} className="py-4 bg-stitch-burgundy text-white hover:bg-stitch-burgundy-dark rounded-md text-[10px] font-bold uppercase tracking-widest transition-transform hover:scale-[1.01] shadow-md flex items-center justify-center gap-2">
                      <Check size={16} /> Gravar Base de Suporte
                   </button>
                </div>
             </div>
          </div>
       </div>
    </div>
  );
}
