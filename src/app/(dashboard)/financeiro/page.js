"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Landmark, Search, Printer, Plus, Save, 
  CheckCircle2, AlertCircle, X, 
  ChevronRight, Calculator, FileText, UserCheck,
  Building2, Hash, FileCheck, Layers, Database, RefreshCw
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function FinanceiroAcordosPage() {
  const [busca, setBusca] = useState("");
  const [processoAberto, setProcessoAberto] = useState(null);
  const [parcelas, setParcelas] = useState([]);
  const [tipoPgto, setTipoPgto] = useState("Acordo"); 
  const [usaCPC, setUsaCPC] = useState(false);
  const [mencionarDeposito, setMencionarDeposito] = useState(true);
  
  // Estados de Dados Reais
  const [dadosFinanceiros, setDadosFinanceiros] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Parâmetros do Gerador
  const [valTotal, setValTotal] = useState("");
  const [valRO, setValRO] = useState("");
  const [valRR, setValRR] = useState("");
  const [paramQtd, setParamQtd] = useState(1);
  const [paramDataInicio, setParamDataInicio] = useState("");
  const [codForn, setCodForn] = useState("");
  const [nomeForn, setNomeForn] = useState("");
  const [protocolo, setProtocolo] = useState("");
  const [dataGeracao, setDataGeracao] = useState("");

  const fetchFinanceiro = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('financeiro')
      .select('*, processos(reclamante, unidade, funcao, reu, advogado_adverso)')
      .order('updated_at', { ascending: false });

    if (!error && data) {
      const dadosFormatados = data.map(item => ({ 
        ...item, 
        reclamante: item.processos?.reclamante || 'N/A', 
        unidade: item.processos?.unidade || 'N/A',
        funcao: item.processos?.funcao || 'N/A',
        reu: item.processos?.reu || 'N/A',
        advogado: item.processos?.advogado_adverso || 'N/A',
        processo: item.processo_cnj 
      }));
      setDadosFinanceiros(dadosFormatados);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchFinanceiro();
    setProtocolo(Math.floor(Math.random() * 100000000).toString());
    setDataGeracao(new Date().toLocaleString());
  }, []);

  const formatBRL = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  useEffect(() => {
    if (processoAberto) {
      // Nota: MOCK_ADV_CODES não existe mais, codForn pode vir de uma lógica ou do DB
      setCodForn("FORN-" + Math.floor(1000 + Math.random() * 9000));
      setNomeForn(processoAberto.advogado);
      setValTotal((processoAberto.valor_acordo || 0).toFixed(2));
      setValRO((processoAberto.valor_ro || 0).toFixed(2));
      setValRR((processoAberto.valor_rr || 0).toFixed(2));
      setMencionarDeposito((processoAberto.valor_ro || 0) > 0 || (processoAberto.valor_rr || 0) > 0);
    }
  }, [processoAberto]);

  // Lógica de Datas do Legado
  const ajustarParaDiaUtil = (data) => {
    let d = new Date(data);
    if (d.getUTCDay() === 6) d.setUTCDate(d.getUTCDate() + 2); // Sábado -> Segunda
    else if (d.getUTCDay() === 0) d.setUTCDate(d.getUTCDate() + 1); // Domingo -> Segunda
    return d;
  };

  const gerarCronograma = () => {
    const total = parseFloat(valTotal) || 0;
    const qtd = parseInt(paramQtd) || 1;
    let dataRef = new Date(paramDataInicio + "T12:00:00");
    
    let novas = [];
    if (tipoPgto === "Execucao" && usaCPC) {
      const entrada = total * 0.30;
      const saldo = total - entrada;
      const valorParc = saldo / Math.min(qtd, 6);
      
      // Entrada
      novas.push({
        id: 0, num: "Entrada", valor: entrada, 
        vencimento: ajustarParaDiaUtil(dataRef).toLocaleDateString('pt-BR'), 
        descricao: "DEPÓSITO INICIAL (30% CPC)", status: "Pendente"
      });

      // Parcelas
      const numParc = Math.min(qtd, 6);
      for (let i = 1; i <= numParc; i++) {
        let dv = new Date(dataRef);
        dv.setMonth(dataRef.getMonth() + i);
        novas.push({
          id: i, num: `${i}/${numParc}`, valor: valorParc,
          vencimento: ajustarParaDiaUtil(dv).toLocaleDateString('pt-BR'),
          descricao: `PARCELA ${i}/${numParc} (SALDO CPC)`, status: "Pendente"
        });
      }
    } else {
      const valorParc = total / qtd;
      for (let i = 1; i <= qtd; i++) {
        let dv = new Date(dataRef);
        dv.setMonth(dataRef.getMonth() + (i - 1));
        novas.push({
          id: i, num: `${i}/${qtd}`, valor: valorParc,
          vencimento: ajustarParaDiaUtil(dv).toLocaleDateString('pt-BR'),
          descricao: `PARCELA ${i}/${qtd} (ACORDO)`, status: "Pendente"
        });
      }
    }
    setParcelas(novas);
  };

  const resumo = useMemo(() => {
    const total = parcelas.reduce((acc, p) => acc + p.valor, 0);
    const pago = parcelas.filter(p => p.status === "Pago").reduce((acc, p) => acc + p.valor, 0);
    return { total, pago, pendente: total - pago };
  }, [parcelas]);

  // Motor de Texto da Guia (Réplica Legado)
  const textoGuia = useMemo(() => {
    if (!processoAberto) return "";
    const ro = parseFloat(valRO) || 0;
    const rr = parseFloat(valRR) || 0;
    const total = parseFloat(valTotal) || 0;
    const liquido = total - (mencionarDeposito ? (ro + rr) : 0);

    let txt = `Pagamento referente ao ${tipoPgto === 'Acordo' ? 'ACORDO TRABALHISTA' : 'PROCESSO EM EXECUÇÃO'} realizado nos autos do processo nº ${processoAberto.processo} (${processoAberto.reclamante}). `;
    
    if (mencionarDeposito && (ro > 0 || rr > 0)) {
        txt += `Considerando o abatimento de ${formatBRL(ro + rr)} referentes a depósitos recursais (RO/RR), o valor remanescente a ser pago em favor do patrono ${nomeForn} é de ${formatBRL(liquido)}, dividido em ${parcelas.length} parcelas conforme cronograma abaixo.`;
    } else {
        txt += `O valor total do plano de pagamento em favor do patrono ${nomeForn} é de ${formatBRL(total)}, dividido em ${parcelas.length} parcelas conforme cronograma anexo.`;
    }
    return txt;
  }, [processoAberto, tipoPgto, valRO, valRR, valTotal, mencionarDeposito, nomeForn, parcelas.length]);

  return (
    <div className="space-y-6">
      {/* UI Dashboard */}
      <div className="print:hidden space-y-6 animate-in fade-in duration-500">
        <div className="flex flex-col space-y-1">
          <div className="flex items-center gap-3">
            <Landmark className="text-[#D4AF37] w-8 h-8" />
            <h1 className="font-cinzel text-3xl font-bold text-[#D4AF37] tracking-wider uppercase">Tesouraria</h1>
          </div>
          <p className="font-inter text-gray-500 text-sm">Controle de liquidação, acordos e execuções judiciais</p>
        </div>

        <div className="glassmorphism p-6 rounded-xl flex items-center gap-4">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-[#D4AF37] transition-colors" />
            <input 
              type="text" 
              placeholder="Localizar Reclamante ou Processo..."
              className="w-full bg-black/40 border border-gray-800 rounded-lg py-4 pl-12 pr-4 text-sm text-white focus:border-[#D4AF37]/50 outline-none transition-all"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>
          <button 
            onClick={fetchFinanceiro}
            className="p-4 bg-white/5 border border-gray-800 rounded-lg text-gray-500 hover:text-[#D4AF37] hover:border-[#D4AF37]/50 transition-all"
          >
            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="glassmorphism rounded-xl overflow-hidden border border-gray-800 relative min-h-[300px]">
          {isLoading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8">
              <Database size={40} className="text-[#D4AF37] animate-pulse mb-4" />
              <p className="font-cinzel text-[#D4AF37] text-sm tracking-widest font-bold">Sincronizando com o Códex...</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/2 border-b border-gray-800 font-cinzel text-[10px] text-[#D4AF37] font-bold uppercase tracking-widest">
                  <th className="px-6 py-4">Processo</th>
                  <th className="px-6 py-4">Reclamante</th>
                  <th className="px-6 py-4">Valor Base</th>
                  <th className="px-6 py-4">Recursos</th>
                  <th className="px-6 py-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800 text-white">
                {dadosFinanceiros.filter(p => p.reclamante.toLowerCase().includes(busca.toLowerCase()) || p.processo.includes(busca)).map(item => (
                  <tr key={item.id} className="hover:bg-white/5 transition-colors group">
                    <td className="px-6 py-5 font-mono text-xs text-gray-500 group-hover:text-white">{item.processo}</td>
                    <td className="px-6 py-5 font-bold uppercase text-sm">{item.reclamante}</td>
                    <td className="px-6 py-5 text-gray-300 text-xs">{formatBRL(item.valor_acordo || 0)}</td>
                    <td className="px-6 py-5 text-[10px] text-gray-500 uppercase">RO: {formatBRL(item.valor_ro || 0)} | RR: {formatBRL(item.valor_rr || 0)}</td>
                    <td className="px-6 py-5 text-center">
                      <button onClick={() => setProcessoAberto(item)} className="px-4 py-2 border border-[#D4AF37]/30 text-[#D4AF37] rounded font-cinzel text-[10px] font-bold tracking-widest hover:bg-[#D4AF37] hover:text-black transition-all flex items-center gap-2 mx-auto uppercase">
                        Acessar <ChevronRight size={12} />
                      </button>
                    </td>
                  </tr>
                ))}
                {!isLoading && dadosFinanceiros.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-20 text-center text-gray-600 font-cinzel text-[10px] uppercase font-bold tracking-[0.2em] opacity-50">Nenhum registro localizado no banco.</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal Parametrizador */}
      {processoAberto && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4 print:hidden">
          <div className="bg-[#0B1120] border border-gray-800 w-full max-w-6xl max-h-[95vh] overflow-y-auto rounded-2xl shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="sticky top-0 bg-[#0B1120] border-b border-gray-800 p-6 flex justify-between items-center z-10">
              <div className="flex items-center gap-4">
                <Calculator className="text-[#D4AF37] w-8 h-8" />
                <div>
                  <h2 className="font-cinzel text-xl font-bold text-white tracking-widest uppercase">{processoAberto.reclamante}</h2>
                  <p className="text-[10px] text-gray-500 font-mono tracking-tighter uppercase">{processoAberto.processo} • {processoAberto.unidade}</p>
                </div>
              </div>
              <button onClick={() => setProcessoAberto(null)} className="p-3 bg-white/5 rounded-full text-gray-500 hover:text-white hover:bg-red-500/20 transition-all"><X size={20}/></button>
            </div>

            <div className="p-8 grid grid-cols-1 lg:grid-cols-12 gap-10">
              {/* Esquerda: Configurações */}
              <div className="lg:col-span-5 space-y-6">
                <div className="p-6 bg-white/2 border border-gray-800 rounded-xl space-y-4">
                  <div className="flex items-center gap-2 text-[10px] font-bold text-[#D4AF37] uppercase tracking-widest border-b border-gray-800 pb-2"><UserCheck size={14}/> Dados do Favorecido</div>
                  <div className="grid grid-cols-4 gap-3">
                    <div className="col-span-1 space-y-1">
                      <label className="text-[9px] text-gray-500 uppercase">Cód. Forn.</label>
                      <input type="text" value={codForn} onChange={(e)=>setCodForn(e.target.value)} className="w-full bg-black/40 border border-gray-800 p-2 rounded text-xs text-white" />
                    </div>
                    <div className="col-span-3 space-y-1">
                      <label className="text-[9px] text-gray-500 uppercase">Fornecedor / Patrono Beneficiário</label>
                      <input type="text" value={nomeForn} onChange={(e)=>setNomeForn(e.target.value)} className="w-full bg-black/40 border border-gray-800 p-2 rounded text-xs text-white" />
                    </div>
                  </div>
                </div>

                <div className={`p-6 border rounded-xl space-y-4 transition-all ${processoAberto.valor_ro > 0 || processoAberto.valor_rr > 0 ? 'bg-orange-500/5 border-orange-500/30' : 'bg-white/2 border-gray-800'}`}>
                  <div className="flex items-center gap-2 text-[10px] font-bold text-[#D4AF37] uppercase tracking-widest border-b border-white/5 pb-2"><AlertCircle size={14}/> Abatimentos (Informar Atualizado)</div>
                  { ((processoAberto.valor_ro || 0) > 0 || (processoAberto.valor_rr || 0) > 0) && (
                    <p className="text-[10px] text-orange-500/80 leading-relaxed font-inter italic">Existem depósitos registrados. Confirme se os valores abaixo estão atualizados com juros.</p>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[9px] text-gray-500 uppercase font-bold">Vlr Depósito RO</label>
                      <input type="number" value={valRO} onChange={(e)=>setValRO(e.target.value)} className="w-full bg-black/40 border border-gray-800 p-2 rounded text-xs text-white" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] text-gray-500 uppercase font-bold">Vlr Depósito RR</label>
                      <input type="number" value={valRR} onChange={(e)=>setValRR(e.target.value)} className="w-full bg-black/40 border border-gray-800 p-2 rounded text-xs text-white" />
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-white/2 border border-blue-500/20 rounded-xl space-y-4">
                    <div className="flex bg-black/40 p-1 rounded-lg border border-gray-800">
                      <button onClick={() => setTipoPgto("Acordo")} className={`flex-1 py-2 text-[9px] font-bold uppercase rounded transition-all ${tipoPgto === 'Acordo' ? 'bg-[#D4AF37] text-black shadow-lg shadow-yellow-500/10' : 'text-gray-500 hover:text-white'}`}>Acordo Trabalhista</button>
                      <button onClick={() => setTipoPgto("Execucao")} className={`flex-1 py-2 text-[9px] font-bold uppercase rounded transition-all ${tipoPgto === 'Execucao' ? 'bg-[#D4AF37] text-black shadow-lg shadow-yellow-500/10' : 'text-gray-500 hover:text-white'}`}>Execução Judicial</button>
                    </div>

                    {tipoPgto === "Execucao" && (
                        <div className="animate-in slide-in-from-top-2 duration-300">
                            <label className="flex items-center gap-3 p-3 bg-white/5 border border-[#D4AF37]/30 rounded-lg cursor-pointer hover:bg-[#D4AF37]/5 transition-colors">
                                <input type="checkbox" checked={usaCPC} onChange={(e)=>setUsaCPC(e.target.checked)} className="w-4 h-4 rounded border-gray-700 bg-black text-[#D4AF37] focus:ring-[#D4AF37]" />
                                <div>
                                    <span className="block text-[10px] text-white font-bold uppercase tracking-widest">Aplicar Art. 916 do CPC</span>
                                    <span className="block text-[9px] text-gray-500 lowercase">(30% entrada + 6 parcelas)</span>
                                </div>
                            </label>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[9px] text-gray-500 uppercase font-bold">Valor do Plano</label>
                            <input type="number" value={valTotal} onChange={(e)=>setValTotal(e.target.value)} className="w-full bg-black/40 border border-gray-800 p-2 rounded text-sm text-[#D4AF37] font-bold outline-none" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[9px] text-gray-500 uppercase font-bold">Parcelas</label>
                            <input type="number" value={paramQtd} onChange={(e)=>setParamQtd(e.target.value)} className="w-full bg-black/40 border border-gray-800 p-2 rounded text-sm text-white" />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[9px] text-gray-500 uppercase font-bold">Data do 1º Vencimento</label>
                        <input type="date" value={paramDataInicio} onChange={(e)=>setParamDataInicio(e.target.value)} className="w-full bg-black/40 border border-gray-800 p-2 rounded text-xs text-white" />
                    </div>
                    <button onClick={gerarCronograma} className="w-full py-4 bg-[#D4AF37] text-black font-cinzel font-bold text-xs tracking-[0.2em] rounded-lg shadow-xl shadow-yellow-500/10 hover:bg-yellow-600 transition-all uppercase flex items-center justify-center gap-2">
                        <Calculator size={18} /> Gerar Cronograma
                    </button>
                </div>
              </div>

              {/* Direita: Resultados e Cronograma */}
              <div className="lg:col-span-7 space-y-6">
                <div className="grid grid-cols-3 gap-4">
                    {[
                        {l: "Líquido Estimado", v: resumo.total, c: "text-white"},
                        {l: "Total Já Pago", v: resumo.pago, c: "text-green-500"},
                        {l: "Saldo Devedor", v: resumo.pendente, c: "text-[#D4AF37]"}
                    ].map((r,idx)=>(
                        <div key={idx} className="glassmorphism p-5 rounded-2xl border border-gray-800 text-center">
                            <p className="text-[8px] text-gray-500 uppercase tracking-widest mb-1">{r.l}</p>
                            <p className={`text-lg font-bold tracking-tighter ${r.c}`}>{formatBRL(r.v)}</p>
                        </div>
                    ))}
                </div>

                <div className="glassmorphism rounded-2xl overflow-hidden border border-gray-800">
                    <div className="max-h-[350px] overflow-y-auto custom-scrollbar">
                        <table className="w-full text-left">
                            <thead className="sticky top-0 bg-[#0B0D11] border-b border-gray-800 z-10">
                                <tr className="text-[9px] text-[#D4AF37] font-bold uppercase tracking-widest">
                                    <th className="px-5 py-3">Parc</th>
                                    <th className="px-5 py-3">Vencimento</th>
                                    <th className="px-5 py-3">Descrição</th>
                                    <th className="px-5 py-3 text-right">Valor</th>
                                    <th className="px-5 py-3 text-center">St</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800/50 text-white">
                                {parcelas.map((p, idx)=>(
                                    <tr key={idx} className="hover:bg-white/5 transition-colors text-xs">
                                        <td className="px-5 py-3 font-mono text-gray-500">{p.num}</td>
                                        <td className="px-5 py-3 text-white">{p.vencimento}</td>
                                        <td className="px-5 py-3 text-gray-400 italic text-[10px]">{p.descricao}</td>
                                        <td className="px-5 py-3 text-right font-bold text-white">{formatBRL(p.valor)}</td>
                                        <td className="px-5 py-3 text-center">
                                            <button 
                                                onClick={() => setParcelas(prev => prev.map(item => item.id === p.id ? {...item, status: item.status === 'Pago' ? 'Pendente' : 'Pago'} : item))}
                                                className={`px-3 py-1 rounded w-full max-w-[80px] text-[8px] font-bold uppercase border transition-all ${p.status === 'Pago' ? 'bg-green-500/20 text-green-500 border-green-500/30' : 'bg-white/5 text-gray-600 border-gray-800'}`}
                                            >
                                                {p.status}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {parcelas.length === 0 && (
                                    <tr><td colSpan={5} className="py-20 text-center text-gray-600 font-cinzel text-[10px] uppercase font-bold tracking-[0.2em] opacity-20">Aguardando Parâmetros</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="space-y-3 bg-white/2 p-6 rounded-2xl border border-gray-800">
                    <div className="flex justify-between items-center text-white">
                        <p className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-widest flex items-center gap-2"><FileText size={14}/> Resumo Estratégico da Guia</p>
                        <label className="flex items-center gap-2 cursor-pointer group">
                             <input type="checkbox" checked={mencionarDeposito} onChange={(e)=>setMencionarDeposito(e.target.checked)} className="w-3 h-3 border-gray-800 bg-black" />
                             <span className="text-[9px] text-gray-500 uppercase font-bold group-hover:text-gray-300">Abater Depósitos no Texto</span>
                        </label>
                    </div>
                    <textarea value={textoGuia} readOnly className="w-full bg-black/40 border border-gray-800 rounded p-4 text-[11px] text-gray-400 font-inter leading-relaxed min-h-[85px] resize-none outline-none focus:border-[#D4AF37]/40" />
                    <div className="flex gap-4">
                        <button className="flex-1 py-4 border border-gray-800 text-white font-cinzel font-bold text-[10px] tracking-widest rounded-lg hover:bg-white/5 transition-all flex items-center justify-center gap-2 uppercase">
                            <Save size={16}/> Salvar no Backend
                        </button>
                        <button onClick={() => window.print()} className="flex-1 py-4 bg-green-900/20 border border-green-500/30 text-green-400 font-cinzel font-bold text-[10px] tracking-widest rounded-lg hover:bg-green-500 hover:text-black transition-all flex items-center justify-center gap-2 uppercase shadow-lg shadow-green-500/10">
                            <Printer size={16}/> Imprimir Guia A4
                        </button>
                    </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Template de Impressão (Paridade 100% Times New Roman) */}
      <div className="hidden print:block bg-white text-black p-12 min-h-screen font-serif" style={{ fontFamily: 'serif' }}>
        <div className="max-w-4xl mx-auto space-y-10">
          <div className="flex justify-between items-end border-b-4 border-black pb-6">
            <div>
                 <h1 className="text-4xl font-bold uppercase tracking-tighter decoration-double underline mb-2">Guia de Pagamento</h1>
                 <p className="text-xs uppercase font-sans tracking-widest text-gray-700">Protocolo de Liquidação Técnica # {protocolo}</p>
            </div>
            <div className="text-right uppercase">
                 <h2 className="text-2xl font-black">Bernardes Corp</h2>
                 <p className="text-[10px] tracking-[0.3em]">Portal Jurídico Estratégico</p>
            </div>
          </div>

          <table className="w-full text-[13px] border-collapse border border-black">
               <tbody>
                   <tr className="bg-gray-100"><td className="p-3 border border-black font-bold">RECLAMANTE:</td><td className="p-3 border border-black uppercase">{processoAberto?.reclamante}</td></tr>
                   <tr><td className="p-3 border border-black font-bold">Nº PROCESSO:</td><td className="p-3 border border-black font-mono">{processoAberto?.processo}</td></tr>
                   <tr className="bg-gray-100"><td className="p-3 border border-black font-bold">FUNÇÃO:</td><td className="p-3 border border-black uppercase">{processoAberto?.funcao}</td></tr>
                   <tr><td className="p-3 border border-black font-bold text-red-600"> RÉU / EXECUTADO:</td><td className="p-3 border border-black uppercase font-bold">{processoAberto?.reu}</td></tr>
                   <tr className="bg-gray-100"><td className="p-3 border border-black font-bold">UNIDADE FILIAL:</td><td className="p-3 border border-black uppercase">{processoAberto?.unidade}</td></tr>
                   <tr><td className="p-3 border border-black font-bold text-red-600">ID FAVORECIDO:</td><td className="p-3 border border-black font-mono font-bold text-lg">{codForn} - {nomeForn}</td></tr>
               </tbody>
          </table>

          <div className="border-[3px] border-black p-8 relative">
              <span className="absolute -top-3 left-6 bg-white px-2 text-[10px] font-bold uppercase tracking-widest">Resumo Operacional</span>
              <p className="text-[16px] leading-relaxed text-justify indent-8 italic">
                  {textoGuia}
              </p>
              <div className="mt-6 pt-6 border-t border-black flex justify-between items-center text-3xl font-black">
                   <span className="text-xs font-bold uppercase underline">Total Bruto Autorizado:</span>
                   <span>{formatBRL(resumo.total)}</span>
              </div>
          </div>

          <div className="space-y-4">
               <h3 className="text-sm font-bold uppercase tracking-[0.2em] border-b-2 border-black pb-1">Cronograma de Liquididacão</h3>
               <table className="w-full text-xs text-center border-collapse border border-black">
                   <thead className="bg-black text-white">
                       <tr><th className="p-3 border border-black">PARC</th><th className="p-3 border border-black">VENCIMENTO</th><th className="p-3 border border-black">DESCRIÇÃO</th><th className="p-3 border border-black text-right">VALOR UNITÁRIO</th></tr>
                   </thead>
                   <tbody>
                       {parcelas.map((p,i)=>(
                           <tr key={i} className={i % 2 === 0 ? '' : 'bg-gray-100'}>
                               <td className="p-2 border border-black font-mono">{p.num}</td>
                               <td className="p-2 border border-black">{p.vencimento}</td>
                               <td className="p-2 border border-black italic text-left">{p.descricao}</td>
                               <td className="p-2 border border-black text-right font-bold">{formatBRL(p.valor)}</td>
                           </tr>
                       ))}
                   </tbody>
               </table>
          </div>

          <div className="pt-20 grid grid-cols-2 gap-20">
               <div className="text-center space-y-2">
                    <div className="border-t-2 border-black w-full" />
                    <p className="text-[10px] font-bold uppercase">Gestão Jurídica Bernardes Corp</p>
                    <p className="text-[8px] italic text-gray-500 tracking-widest">Aprovação Eletrônica Interna</p>
               </div>
               <div className="text-center space-y-2">
                    <div className="border-t-2 border-black w-full" />
                    <p className="text-[10px] font-bold uppercase">Favorecido / Patrono Responsável</p>
                    <p className="text-[8px] italic text-gray-500 tracking-widest">Confirmação de recebimento do plano</p>
               </div>
          </div>

          <div className="pt-10 text-center opacity-30">
               <p className="text-[8px] uppercase tracking-[0.5em]">Bernardes Corp - Gerado em {dataGeracao}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
