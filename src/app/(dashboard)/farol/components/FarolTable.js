import React from 'react';
import { MoreVertical } from 'lucide-react';

export default function FarolTable({ processos, onLineClick }) {

  const calcularPrazo = (audiencias) => {
    if (!audiencias || audiencias.length === 0) return { text: "Sem Pauta", color: "text-slate-400 dark:text-zinc-600" };
    
    // Filtra audiências no futuro e acha a mais próxima
    const now = new Date();
    now.setHours(0,0,0,0);
    const validas = audiencias
       .map(a => new Date(a.data_hora))
       // Pode ser que permitam trazer atrasadas como vencidas
       .sort((a,b) => a - b);
       
    const prox = validas.find(d => d.getTime() >= now.getTime()) || validas[validas.length - 1]; 
    if (!prox) return { text: "-", color: "text-slate-400" };

    prox.setHours(0,0,0,0);
    const diff = Math.ceil((prox - now) / (86400000));
    
    if (diff < 0) return { text: "VENCIDO", color: "text-rose-600 font-bold", alert: true };
    if (diff === 0) return { text: "É HOJE", color: "text-amber-600 font-bold", alert: true };
    if (diff <= 5) return { text: `⚠️ ${diff} DIAS`, color: "text-rose-500 font-bold" };
    return { text: `FALTAM ${diff} DIAS`, color: "text-slate-500" };
  };

  const calcularProximaData = (audiencias) => {
    if (!audiencias || audiencias.length === 0) return "-";
    const validas = audiencias.map(a => new Date(a.data_hora)).sort((a,b) => a - b);
    const now = new Date();
    const prox = validas.find(d => d.getTime() >= now.getTime()) || validas[validas.length - 1]; 
    return prox.toLocaleDateString('pt-BR');
  };

  return (
    <div className="bg-white dark:bg-[#151515] rounded-xl border border-slate-200 dark:border-zinc-800/80 shadow-md overflow-hidden flex flex-col min-h-[500px]">
       <div className="overflow-x-auto flex-1 custom-scrollbar imperial-scroll">
          <table className="w-full text-left border-collapse min-w-[1000px]">
             <thead className="sticky top-0 bg-slate-50 dark:bg-zinc-950/90 backdrop-blur z-10 border-b border-slate-200 dark:border-zinc-800/80">
                <tr>
                   <th className="py-4 px-5 text-[10px] font-inter font-bold text-slate-500 dark:text-zinc-500 uppercase tracking-widest w-12">#</th>
                   <th className="py-4 px-5 text-[10px] font-inter font-bold text-slate-500 dark:text-zinc-500 uppercase tracking-widest w-[200px]">
                      Processo CNJ
                   </th>
                   <th className="py-4 px-5 text-[10px] font-inter font-bold text-slate-500 dark:text-zinc-500 uppercase tracking-widest w-[280px]">
                      Reclamante
                   </th>
                   <th className="py-4 px-5 text-[10px] font-inter font-bold text-slate-500 dark:text-zinc-500 uppercase tracking-widest">
                      Próxima Audiência
                   </th>
                   <th className="py-4 px-5 text-[10px] font-inter font-bold text-slate-500 dark:text-zinc-500 uppercase tracking-widest w-[180px]">
                      Prazos Táticos
                   </th>
                   <th className="py-4 px-5 text-[10px] font-inter font-bold text-slate-500 dark:text-zinc-500 uppercase tracking-widest text-center w-[60px]">
                      Audit
                   </th>
                </tr>
             </thead>
             <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60 font-inter text-sm">
                {processos.length === 0 ? (
                   <tr><td colSpan={6} className="text-center p-16 text-slate-400 text-xs tracking-widest uppercase">Nenhum processo inserido na fila primária</td></tr>
                ) : (
                  processos.map((p, idx) => {
                    const prazoMeta = calcularPrazo(p.audiencias);
                    const totalItens = 18; // Aproximadamente da base padrão
                    const itensMarcados = (p.checklist || []).length;
                    const progressoPerc = Math.min(100, Math.round((itensMarcados / totalItens) * 100));

                    return (
                      <tr key={idx} onClick={() => onLineClick(p)} className={`hover:bg-slate-50 dark:hover:bg-zinc-800/40 transition-colors cursor-pointer group ${p.urgente ? 'bg-rose-50/50 dark:bg-rose-900/10' : ''}`}>
                         <td className="py-4 px-5 text-[11px] font-mono text-slate-400 dark:text-zinc-600 font-medium">{idx+1}</td>
                         <td className="py-4 px-5">
                            <div className="flex flex-col gap-1">
                               <span className="font-semibold text-slate-800 dark:text-zinc-200 font-mono text-[11px]">{p.processo}</span>
                               <span className={`inline-flex px-1.5 py-0.5 rounded text-[8px] uppercase tracking-widest font-bold w-max border ${p.status === 'Enviado' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-500 border-emerald-200 dark:border-emerald-800' : 'bg-slate-100 dark:bg-zinc-900 text-slate-500 dark:text-zinc-400 border-slate-200 dark:border-zinc-700'}`}>
                                  {p.status}
                               </span>
                            </div>
                         </td>
                         <td className="py-4 px-5">
                            <div className="flex flex-col w-full pr-6">
                               <div className="flex justify-between items-end mb-1.5">
                                  <span className="text-slate-800 dark:text-zinc-200 font-bold text-xs truncate max-w-[180px]">{p.reclamante}</span>
                                  <span className="text-[9px] font-bold text-slate-400 dark:text-zinc-500">{progressoPerc}%</span>
                               </div>
                               <div className="w-full h-1.5 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                  <div className={`h-full transition-all duration-500 ${progressoPerc === 100 ? 'bg-emerald-500' : 'bg-stitch-burgundy dark:bg-stitch-secondary'}`} style={{ width: \`\${progressoPerc}%\` }}></div>
                               </div>
                               <span className="text-[9px] text-slate-400 dark:text-zinc-500 mt-1 truncate">{p.funcao}</span>
                            </div>
                         </td>
                         <td className="py-4 px-5">
                            <div className="flex flex-col gap-0.5">
                               <span className="text-slate-800 dark:text-zinc-300 font-medium text-xs">
                                  {calcularProximaData(p.audiencias)}
                               </span>
                               <span className="text-[9px] text-slate-400 dark:text-zinc-500 uppercase tracking-widest">
                                  {p.audiencias && p.audiencias.length > 0 ? "Marcada" : "Desconhecida"}
                               </span>
                            </div>
                         </td>
                         <td className="py-4 px-5">
                            <span className={`text-[10px] uppercase tracking-widest ${prazoMeta.color}`}>
                               {prazoMeta.text}
                            </span>
                         </td>
                         <td className="py-4 px-5 text-center">
                            <button className="text-slate-400 dark:text-zinc-600 hover:text-stitch-burgundy dark:hover:text-stitch-secondary transition-colors p-1.5 rounded">
                               <MoreVertical size={16} />
                            </button>
                         </td>
                      </tr>
                    )
                  })
                )}
             </tbody>
          </table>
       </div>
    </div>
  );
}
