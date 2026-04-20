"use client";

import React, { useState, useMemo, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { 
  History, Search, FileSpreadsheet, Edit3, Save, X, 
  UploadCloud, CheckSquare, Square, ChevronRight, 
  Loader2, CheckCircle2, WifiOff, AlertTriangle, Info
} from 'lucide-react';

// Passo 1: Mock Data e Constantes
const MOCK_ACERVO = [
  { 
    index: 1, 
    processo: "1000114-98.2026.5.02.0463", 
    reclamante: "PAULO ROBERTO DA SILVA", 
    tipoAudiencia: "Audiência Inicial", 
    data: "2026-05-15", 
    horas: "14:30", 
    sentenca: "", 
    obs: "Sessão aguardando subsídios.",
    valorRO: 0, valorRR: 0, infoRecurso: "" 
  },
  { 
    index: 2, 
    processo: "0010992-88.2023.5.15.0002", 
    reclamante: "MARIA CLARA GOMES", 
    tipoAudiencia: "Audiência UNA", 
    data: "2026-04-20", 
    horas: "09:00", 
    sentenca: "Procedência em parte. Verbas de HE deferidas.", 
    obs: "Recurso Ordinário interposto pela ré.",
    valorRO: 12666.00, valorRR: 0, infoRecurso: "Relator: Roberto Nobre. TRT15." 
  },
  { 
    index: 3, 
    processo: "1000542-10.2024.5.15.0100", 
    reclamante: "ANTÔNIO SILVA ROCHA", 
    tipoAudiencia: "Audiência de Instrução", 
    data: "2026-06-10", 
    horas: "10:15", 
    sentenca: "", 
    obs: "",
    valorRO: 0, valorRR: 0, infoRecurso: "" 
  }
];

const MAPA_TIPO = [
  { keys: ['audiencia una', 'una'], padrao: 'Audiência Una' },
  { keys: ['inaugural', 'inicial', 'primeiro ato'], padrao: 'Audiência Inicial' },
  { keys: ['instrucao e julgamento', 'instrucao', 'instrução e julgamento', 'instrução'], padrao: 'Audiência Instrução' },
  { keys: ['conciliacao', 'conciliacão', 'concilia', 'conciliatoria'], padrao: 'Audiência Conciliação' },
  { keys: ['prosseguimento', 'continuacao', 'continuação'], padrao: 'Prosseguimento' },
  { keys: ['ratificacao', 'ratificação'], padrao: 'Ratificação' },
];

export default function AtualizacaoPortfolioPage() {
  // Estados Principais
  const [acervo, setAcervo] = useState(MOCK_ACERVO);
  const [busca, setBusca] = useState("");
  const [modalEdicao, setModalEdicao] = useState(false);
  const [processoAtivo, setProcessoAtivo] = useState(null);
  const [abaAtiva, setAbaAtiva] = useState('info');

  // Estados do Importador
  const [isImportadorOpen, setIsImportadorOpen] = useState(false);
  const [importStep, setImportStep] = useState(1);
  const [linhasImportadas, setLinhasImportadas] = useState([]);
  const [stats, setStats] = useState({ encontrados: 0, naoEncontrados: 0, total: 0 });

  const resultados = useMemo(() => {
    if (!busca) return [];
    const t = busca.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return acervo.filter(p => 
      p.reclamante.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(t) || 
      p.processo.replace(/\D/g, "").includes(t.replace(/\D/g, ""))
    );
  }, [busca, acervo]);

  // Funções Auxiliares
  const normalizarProcesso = (s) => String(s || '').replace(/\D/g, '');
  const normalizarHora = (s) => String(s || '').replace(/h/gi, ':').trim();
  const normalizarDataISO = (val) => {
    if (!val && val !== 0) return '';
    if (val instanceof Date) return val.toISOString().split('T')[0];
    const s = String(val).trim();
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(s)) {
      const [d, m, a] = s.split('/');
      return `${a}-${m.padStart(2,'0')}-${d.padStart(2,'0')}`;
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
    const n = parseFloat(s);
    if (!isNaN(n) && n > 40000) {
      const dt = new Date(Math.round((n - 25569) * 86400 * 1000));
      return dt.toISOString().split('T')[0];
    }
    return s;
  };

  const normalizarTipo = (textoOriginal) => {
    if (!textoOriginal) return '';
    const txt = textoOriginal.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
    for (const entry of MAPA_TIPO) {
      for (const key of entry.keys) {
        if (txt.includes(key)) return entry.padrao;
      }
    }
    return textoOriginal; // retorna original se não achar mapeamento
  };

  // Handlers
  const handleFicha = (p) => {
    setProcessoAtivo({ ...p });
    setAbaAtiva('info');
    setModalEdicao(true);
  };

  const salvarEdicao = () => {
    setAcervo(prev => prev.map(p => p.index === processoAtivo.index ? processoAtivo : p));
    setModalEdicao(false);
    alert("Códex atualizado com sucesso!");
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImportStep(2); // Processando
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary', cellDates: false });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(ws, { header: 1, raw: false, defval: '' });

        // Pular cabeçalho rudimentar
        let dataRows = rows.slice(1);
        if (rows[0] && !rows[0][0]) dataRows = rows.slice(2);

        const processadas = dataRows.filter(r => r[2] && r[0]).map((row, i) => {
          const excelData = normalizarDataISO(row[0]);
          const excelHora = normalizarHora(row[1]);
          const excelProc = normalizarProcesso(row[2]);
          const excelTipo = normalizarTipo(row[6]);
          const excelRecl = String(row[7] || '').trim();

          const baseProc = acervo.find(a => normalizarProcesso(a.processo) === excelProc);

          return {
            id: i,
            excelProc: row[2],
            excelRecl,
            novaData: excelData,
            novaHora: excelHora,
            novoTipo: excelTipo,
            encontrado: !!baseProc,
            baseProc: baseProc || null,
            selecionado: !!baseProc
          };
        });

        setLinhasImportadas(processadas);
        setStats({
          encontrados: processadas.filter(l => l.encontrado).length,
          naoEncontrados: processadas.filter(l => !l.encontrado).length,
          total: processadas.length
        });
        setImportStep(3); // Diff
      } catch (err) {
        alert("Erro ao ler planilha: " + err.message);
        setImportStep(1);
      }
    };
    reader.readAsBinaryString(file);
  };

  const confirmarImportacao = () => {
    setImportStep(4); // Salvando
    setTimeout(() => {
      const selecionados = linhasImportadas.filter(l => l.selecionado && l.encontrado);
      setAcervo(prev => {
        const novoAcervo = [...prev];
        selecionados.forEach(item => {
          const idx = novoAcervo.findIndex(a => a.index === item.baseProc.index);
          if (idx !== -1) {
            novoAcervo[idx] = {
              ...novoAcervo[idx],
              data: item.novaData || novoAcervo[idx].data,
              horas: item.novaHora || novoAcervo[idx].horas,
              tipoAudiencia: item.novoTipo || novoAcervo[idx].tipoAudiencia
            };
          }
        });
        return novoAcervo;
      });
      setImportStep(5); // Sucesso
    }, 1500);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      
      {/* Header Central */}
      <div className="text-center md:mb-12 mt-4">
        <h2 className="flex items-center justify-center gap-4 text-3xl font-cinzel font-bold text-[#D4AF37] mb-3">
          <History size={32} /> Atualização de Portfólio
        </h2>
        <p className="text-gray-400 text-sm font-inter">Sincronização de andamentos, sentenças e depósitos recursais no acervo.</p>
      </div>

      {/* Passo 2: Layout Principal (Busca e Tabela) */}
      <div className="bg-black/40 backdrop-blur-xl border border-white/5 rounded-2xl p-8 space-y-6">
        <div className="flex flex-col md:flex-row gap-6 items-end">
          <div className="flex-1 space-y-2">
            <label className="text-[10px] text-gray-500 uppercase tracking-widest font-bold ml-1">Consulta de Protocolo</label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
              <input 
                type="text" 
                value={busca}
                onChange={e => setBusca(e.target.value)}
                placeholder="Localizar Reclamante ou Processo..." 
                className="w-full bg-black/50 border border-white/10 rounded-xl py-4 pl-12 pr-6 text-sm text-white focus:border-[#D4AF37]/50 outline-none transition-all"
              />
            </div>
          </div>
          <button 
            onClick={() => { setImportStep(1); setIsImportadorOpen(true); }}
            className="flex items-center gap-3 px-8 py-4 bg-transparent border border-[#D4AF37]/40 text-[#D4AF37] rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-[#D4AF37]/10 transition-all group h-[54px]"
          >
            <FileSpreadsheet className="w-5 h-5 group-hover:scale-110 transition-transform" /> Importar Pauta Excel
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-separate border-spacing-y-3">
            <thead>
              <tr className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">
                <th className="px-6 py-3">Protocolo</th>
                <th className="px-6 py-3">Titular (Reclamante)</th>
                <th className="px-6 py-3">Sessão Atual</th>
                <th className="px-6 py-3">Cronograma</th>
                <th className="px-6 py-3 text-center">Ação</th>
              </tr>
            </thead>
            <tbody>
              {resultados.length > 0 ? (
                resultados.map((p, i) => (
                  <tr key={i} className="group">
                    <td className="px-6 py-4 bg-white/5 border-y border-l border-white/5 rounded-l-xl font-mono text-xs text-gray-400">{p.processo}</td>
                    <td className="px-6 py-4 bg-white/5 border-y border-white/5 font-bold text-sm">{p.reclamante}</td>
                    <td className="px-6 py-4 bg-white/5 border-y border-white/5 text-[10px] uppercase text-gray-500">{p.tipoAudiencia}</td>
                    <td className="px-6 py-4 bg-white/5 border-y border-white/5 font-mono text-xs text-[#D4AF37]">
                      {p.data ? p.data.split('-').reverse().join('/') : '-'} {p.horas || ''}
                    </td>
                    <td className="px-6 py-4 bg-white/5 border-y border-r border-white/5 rounded-r-xl text-center">
                      <button 
                        onClick={() => handleFicha(p)}
                        className="px-4 py-2 bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/30 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-[#D4AF37] hover:text-black transition-all"
                      >
                        Ficha
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-20 text-center text-gray-500 font-inter text-sm bg-black/20 rounded-xl border border-dashed border-white/5">
                    {busca ? "Nenhum registro localizado." : "Utilize a busca acima para filtrar o acervo."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Passo 3: Modal de Edição (Ficha) */}
      {modalEdicao && processoAtivo && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-12 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={() => setModalEdicao(false)} />
          <div className="relative w-full max-w-3xl bg-[#0B1120] border border-[#D4AF37]/30 rounded-2xl shadow-[0_0_80px_rgba(212,175,55,0.15)] overflow-hidden animate-in slide-in-from-bottom-8 duration-500 flex flex-col max-h-full">
            
            {/* Modal Header & Tabs */}
            <div className="p-8 pb-0 border-b border-white/5">
              <div className="flex justify-between items-center mb-8">
                <h3 className="font-cinzel text-xl font-bold text-[#D4AF37] flex items-center gap-4">
                  <Edit3 size={24} /> {processoAtivo.reclamante}
                </h3>
                <button onClick={() => setModalEdicao(false)} className="text-gray-500 hover:text-white transition-colors">
                  <X size={24} />
                </button>
              </div>

              <div className="flex gap-10">
                <button 
                  onClick={() => setAbaAtiva('info')} 
                  className={`pb-4 text-[11px] font-cinzel uppercase tracking-widest border-b-2 transition-all ${abaAtiva === 'info' ? 'text-[#D4AF37] border-[#D4AF37]' : 'text-gray-500 border-transparent hover:text-gray-300'}`}
                >
                  I. Andamento & Sentença
                </button>
                <button 
                  onClick={() => setAbaAtiva('rec')} 
                  className={`pb-4 text-[11px] font-cinzel uppercase tracking-widest border-b-2 transition-all ${abaAtiva === 'rec' ? 'text-[#D4AF37] border-[#D4AF37]' : 'text-gray-500 border-transparent hover:text-gray-300'}`}
                >
                  II. Recursos & RO/RR
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
              {abaAtiva === 'info' ? (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Status / Tipo de Audiência</label>
                    <input 
                      type="text" 
                      value={processoAtivo.tipoAudiencia} 
                      onChange={e => setProcessoAtivo({...processoAtivo, tipoAudiencia: e.target.value})}
                      className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-sm text-white focus:border-[#D4AF37]/50 outline-none transition-all" 
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Data da Sessão</label>
                      <input 
                        type="date" 
                        value={processoAtivo.data}
                        onChange={e => setProcessoAtivo({...processoAtivo, data: e.target.value})}
                        className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-sm text-white focus:border-[#D4AF37]/50 outline-none transition-all [color-scheme:dark]" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Horário</label>
                      <input 
                        type="time" 
                        value={processoAtivo.horas}
                        onChange={e => setProcessoAtivo({...processoAtivo, horas: e.target.value})}
                        className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-sm text-white focus:border-[#D4AF37]/50 outline-none transition-all [color-scheme:dark]" 
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Resumo Decisório / Sentença</label>
                    <textarea 
                      value={processoAtivo.sentenca} 
                      onChange={e => setProcessoAtivo({...processoAtivo, sentenca: e.target.value})}
                      rows={3} 
                      className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-sm text-white focus:border-[#D4AF37]/50 outline-none transition-all leading-relaxed" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Observações Gerais</label>
                    <textarea 
                      value={processoAtivo.obs} 
                      onChange={e => setProcessoAtivo({...processoAtivo, obs: e.target.value})}
                      rows={3} 
                      className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-sm text-white focus:border-[#D4AF37]/50 outline-none transition-all leading-relaxed" 
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Depósito Recursal (RO)</label>
                      <input 
                        type="text" 
                        value={processoAtivo.valorRO ? `R$ ${processoAtivo.valorRO.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : ""}
                        onChange={e => {
                          const val = parseFloat(e.target.value.replace(/\D/g, '')) / 100;
                          setProcessoAtivo({...processoAtivo, valorRO: isNaN(val) ? 0 : val});
                        }}
                        className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-sm font-mono text-[#D4AF37] font-bold focus:border-[#D4AF37]/50 outline-none transition-all" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Depósito Recursal (RR)</label>
                      <input 
                        type="text" 
                        value={processoAtivo.valorRR ? `R$ ${processoAtivo.valorRR.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : ""}
                        onChange={e => {
                          const val = parseFloat(e.target.value.replace(/\D/g, '')) / 100;
                          setProcessoAtivo({...processoAtivo, valorRR: isNaN(val) ? 0 : val});
                        }}
                        className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-sm font-mono text-[#D4AF37] font-bold focus:border-[#D4AF37]/50 outline-none transition-all" 
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Detalhes do Fluxo Recursal</label>
                    <textarea 
                      value={processoAtivo.infoRecurso} 
                      onChange={e => setProcessoAtivo({...processoAtivo, infoRecurso: e.target.value})}
                      rows={6} 
                      className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-sm text-white focus:border-[#D4AF37]/50 outline-none transition-all leading-relaxed" 
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="p-8 border-t border-white/5 bg-black/20 flex gap-4">
              <button 
                onClick={salvarEdicao}
                className="flex-1 py-4 bg-gradient-to-r from-[#D4AF37] to-[#B8860B] text-black font-cinzel font-bold text-xs uppercase tracking-widest rounded-xl hover:scale-[1.02] transition-transform flex items-center justify-center gap-3 shadow-xl shadow-[#D4AF37]/10"
              >
                <Save size={18} /> ATUALIZAR CÓDEX
              </button>
              <button 
                onClick={() => setModalEdicao(false)}
                className="px-8 py-4 border border-white/10 text-gray-500 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-white/5 hover:text-white transition-all"
              >
                CANCELAR
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Passo 4: Overlay do Importador Excel (Os 5 Steps) */}
      {isImportadorOpen && (
        <div className="fixed inset-0 z-[200] flex flex-col p-6 sm:p-20 overflow-y-auto animate-in fade-in duration-300 bg-black/95 backdrop-blur-2xl custom-scrollbar">
          <div className="max-w-4xl mx-auto w-full relative">
            
            {/* Stepper Superior */}
            <div className="flex justify-between items-center mb-16 px-4">
              <h2 className="font-cinzel text-2xl font-bold text-[#D4AF37] flex items-center gap-4">
                <FileSpreadsheet size={28} /> Importação de Pauta
              </h2>
              <button onClick={() => setIsImportadorOpen(false)} className="p-2 border border-white/10 rounded-lg text-gray-500 hover:text-white transition-all">
                <X size={20} />
              </button>
            </div>

            {/* Step 1: Upload */}
            {importStep === 1 && (
              <div className="animate-in slide-in-from-bottom-8 duration-500 space-y-10">
                <label className="block group cursor-pointer">
                   <div className="bg-[#D4AF37]/5 border-2 border-dashed border-[#D4AF37]/20 rounded-3xl p-20 text-center transition-all group-hover:border-[#D4AF37]/50 group-hover:bg-[#D4AF37]/10">
                      <div className="w-20 h-20 bg-black/40 rounded-full flex items-center justify-center mx-auto mb-8 group-hover:scale-110 transition-transform">
                        <UploadCloud size={40} className="text-[#D4AF37]" />
                      </div>
                      <p className="text-[#D4AF37] text-xl font-bold font-cinzel mb-2">Arraste o arquivo Excel aqui</p>
                      <p className="text-gray-500 text-sm">ou clique para selecionar · .xlsx / .xls</p>
                      <input type="file" className="hidden" accept=".xlsx, .xls" onChange={handleFileUpload} />
                   </div>
                </label>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-xs text-gray-400 bg-black/40 border border-white/5 rounded-2xl p-8">
                  <div className="space-y-4">
                    <p className="text-[#D4AF37] font-bold uppercase tracking-widest border-b border-[#D4AF37]/20 pb-2 flex items-center gap-2"><Info size={14} /> Colunas Requeridas</p>
                    <ul className="space-y-2">
                       <li className="flex gap-2">🟢 <strong className="text-white">Col A:</strong> Data da audiência <span className="opacity-50">(dd/mm/aaaa)</span></li>
                       <li className="flex gap-2">🟢 <strong className="text-white">Col B:</strong> Horário <span className="opacity-50">(ex: 14:30 ou 14h30)</span></li>
                       <li className="flex gap-2">🟢 <strong className="text-white">Col C:</strong> Número do processo CNJ</li>
                       <li className="flex gap-2">🟢 <strong className="text-white">Col G:</strong> Tipo da Audiência</li>
                    </ul>
                  </div>
                  <div className="space-y-4">
                    <p className="text-gray-500 font-bold uppercase tracking-widest border-b border-white/10 pb-2 flex items-center gap-2"><AlertTriangle size={14} /> Observações</p>
                    <p className="leading-relaxed">O sistema tentará casar o <strong>Número do Processo</strong> com os {acervo.length} registros que você possui no acervo local. Dados não encontrados serão sinalizados com alerta vermelho.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Processando */}
            {importStep === 2 && (
              <div className="py-32 text-center animate-in zoom-in duration-500">
                <Loader2 size={64} className="text-[#D4AF37] animate-spin mx-auto mb-8" />
                <h3 className="text-[#D4AF37] font-cinzel text-xl font-bold mb-2">Processando Planilha...</h3>
                <p className="text-gray-500 text-sm">Analisando e cruzando com a base corporativa.</p>
              </div>
            )}

            {/* Step 3: Preview / Diff */}
            {importStep === 3 && (
              <div className="animate-in slide-in-from-bottom-8 duration-500 space-y-8">
                {/* Stats Bar */}
                <div className="grid grid-cols-3 bg-black/40 border border-white/5 rounded-2xl overflow-hidden">
                   <div className="p-6 text-center border-r border-white/5">
                      <div className="text-4xl font-cinzel font-bold text-green-500">{stats.encontrados}</div>
                      <div className="text-[10px] text-gray-500 uppercase font-bold mt-2">Localizados</div>
                   </div>
                   <div className="p-6 text-center border-r border-white/5">
                      <div className="text-4xl font-cinzel font-bold text-red-500">{stats.naoEncontrados}</div>
                      <div className="text-[10px] text-gray-500 uppercase font-bold mt-2">Não Localizados</div>
                   </div>
                   <div className="p-6 text-center">
                      <div className="text-4xl font-cinzel font-bold text-[#D4AF37]">{stats.total}</div>
                      <div className="text-[10px] text-gray-500 uppercase font-bold mt-2">Total Lote</div>
                   </div>
                </div>

                <div className="flex justify-between items-center bg-white/5 p-4 rounded-xl border border-white/5">
                   <div className="flex gap-4">
                      <button 
                        onClick={() => setLinhasImportadas(prev => prev.map(l => ({...l, selecionado: true})))}
                        className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#D4AF37] hover:text-white transition-colors"
                      >
                         <CheckSquare size={14} /> Marcar Todos
                      </button>
                      <button 
                        onClick={() => setLinhasImportadas(prev => prev.map(l => ({...l, selecionado: false})))}
                        className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-500 hover:text-white transition-colors"
                      >
                         <Square size={14} /> Desmarcar
                      </button>
                   </div>
                   <button 
                    onClick={confirmarImportacao}
                    disabled={linhasImportadas.filter(l => l.selecionado).length === 0}
                    className="px-6 py-2 bg-green-500 text-black rounded-lg text-[10px] font-bold uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-green-500/10 disabled:opacity-30"
                   >
                     Confirmar Importação em Lote
                   </button>
                </div>

                {/* Lista de Cards Diff */}
                <div className="space-y-4">
                  {linhasImportadas.map((item, idx) => (
                    <div 
                      key={idx} 
                      className={`p-6 rounded-2xl border transition-all ${!item.encontrado ? 'border-red-500/20 bg-red-500/5' : item.selecionado ? 'border-[#D4AF37]/50 bg-[#D4AF37]/5' : 'border-white/5 bg-black/40'}`}
                    >
                      <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-4">
                           <div 
                             onClick={() => item.encontrado && setLinhasImportadas(prev => prev.map(l => l.id === item.id ? {...l, selecionado: !l.selecionado} : l))}
                             className={`w-6 h-6 rounded border flex items-center justify-center cursor-pointer transition-all ${item.selecionado ? 'bg-[#D4AF37] border-[#D4AF37]' : 'border-white/20 bg-black/20'}`}
                           >
                             {item.selecionado && <CheckSquare size={14} className="text-black font-bold" />}
                           </div>
                           <div>
                              <p className="text-xs font-mono text-gray-500">{item.excelProc}</p>
                              <h4 className="text-sm font-bold text-white">{item.excelRecl || "Desconhecido"}</h4>
                           </div>
                        </div>
                        {!item.encontrado && <span className="px-3 py-1 bg-red-500/20 text-red-500 text-[9px] font-bold uppercase rounded-full border border-red-500/30">Não na Base</span>}
                        {item.encontrado && <span className="px-3 py-1 bg-green-500/20 text-green-500 text-[9px] font-bold uppercase rounded-full border border-green-500/30">Localizado</span>}
                      </div>

                      {item.encontrado && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                           <div className="space-y-1">
                              <p className="text-[9px] text-gray-500 uppercase font-bold mb-2">Cronograma (Data)</p>
                              <div className="flex items-center gap-3 text-xs">
                                 <span className="text-gray-500 font-mono">{item.baseProc.data?.split('-').reverse().join('/') || '---'}</span>
                                 <ChevronRight size={12} className="text-gray-600" />
                                 <span className={`font-mono font-bold ${item.novaData !== item.baseProc.data ? 'text-[#D4AF37]' : 'text-gray-400'}`}>
                                    {item.novaData?.split('-').reverse().join('/') || 'Sem Alterar'}
                                 </span>
                              </div>
                           </div>
                           <div className="space-y-1">
                              <p className="text-[9px] text-gray-500 uppercase font-bold mb-2">Horário</p>
                              <div className="flex items-center gap-3 text-xs">
                                 <span className="text-gray-500 font-mono">{item.baseProc.horas || '---'}</span>
                                 <ChevronRight size={12} className="text-gray-600" />
                                 <span className={`font-mono font-bold ${item.novaHora !== item.baseProc.horas ? 'text-[#D4AF37]' : 'text-gray-400'}`}>
                                    {item.novaHora || item.baseProc.horas}
                                 </span>
                              </div>
                           </div>
                           <div className="space-y-1">
                              <p className="text-[9px] text-gray-500 uppercase font-bold mb-2">Sessão</p>
                              <div className="flex items-center gap-3 text-xs">
                                 <span className="text-gray-500 truncate max-w-[80px]">{item.baseProc.tipoAudiencia || '---'}</span>
                                 <ChevronRight size={12} className="text-gray-600" />
                                 <span className={`font-bold truncate max-w-[120px] ${item.novoTipo !== item.baseProc.tipoAudiencia ? 'text-[#D4AF37]' : 'text-gray-400'}`}>
                                    {item.novoTipo || item.baseProc.tipoAudiencia}
                                 </span>
                              </div>
                           </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step 4: Salvando */}
            {importStep === 4 && (
              <div className="py-32 text-center animate-in zoom-in duration-500">
                <Loader2 size={64} className="text-[#D4AF37] animate-spin mx-auto mb-8" />
                <h3 className="text-[#D4AF37] font-cinzel text-xl font-bold mb-2">Salvando no Códex...</h3>
                <p className="text-gray-500 text-sm">Persistindo alterações em lote nos processos selecionados.</p>
              </div>
            )}

            {/* Step 5: Sucesso */}
            {importStep === 5 && (
              <div className="py-20 text-center animate-in zoom-in duration-500">
                <CheckCircle2 size={80} className="text-green-500 mx-auto mb-8" />
                <h3 className="text-white font-cinzel text-2xl font-bold mb-4">Importação Concluída!</h3>
                <div className="max-w-xs mx-auto border border-white/5 bg-black/40 p-6 rounded-2xl mb-12">
                   <p className="text-gray-400 text-sm mb-2">Registros atualizados:</p>
                   <p className="text-4xl font-bold text-green-500">{linhasImportadas.filter(l => l.selecionado).length}</p>
                </div>
                <div className="flex justify-center gap-4">
                  <button 
                    onClick={() => { setImportStep(1); setLinhasImportadas([]); }}
                    className="px-8 py-4 bg-transparent border border-[#d4af37]/30 text-[#d4af37] rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-[#d4af37]/10"
                  >
                    Importar Outra Planilha
                  </button>
                  <button 
                    onClick={() => setIsImportadorOpen(false)}
                    className="px-8 py-4 bg-white/5 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-white/10"
                  >
                    Voltar ao Portal
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* Indicador de Status Remoto (Sempre Visível se mock) */}
      <div className="fixed bottom-8 left-72 text-[10px] text-gray-500 uppercase tracking-widest flex items-center gap-3 bg-black/50 px-4 py-2 rounded-full border border-white/5 backdrop-blur-md">
        <WifiOff size={12} className="text-[#D4AF37]" /> Modo Desmonstração (Mock Ativo)
      </div>

    </div>
  );
}
