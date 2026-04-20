"use client";

import React, { useState } from 'react';
import { 
  Layers, 
  ChevronDown, 
  ChevronUp, 
  ShieldCheck, 
  Landmark, 
  Gavel, 
  BrainCircuit, 
  Edit3,
  Wallet,
  AlertCircle,
  FileText,
  BadgeDollarSign
} from 'lucide-react';

// Passo 1: Mock Data Avançado
const MOCK_RECURSOS = [
  {
    id: 1,
    processo: "1000215-45.2024",
    reclamante: "CARLOS SILVA",
    modalidade: "RO",
    exposicao: 13796,
    status: "Aguardando Julgamento",
    juridico: {
      sentenca: "Condenação em horas extras (intervalo intrajornada) e reflexos.",
      estrategia: "A prova testemunhal foi dividida. Recurso visa afastar a condenação com base na súmula 437 do TST, argumentando pré-assinalação válida."
    },
    financeiro: {
      custas: 1500,
      deposito: 12296,
      seguroGarantia: true,
      apolice: "SEG-9988X"
    }
  },
  {
    id: 2,
    processo: "0011245-88.2023",
    reclamante: "FERNANDA LIMA",
    modalidade: "Art. 916 CPC",
    exposicao: 30000,
    status: "Em Cumprimento",
    juridico: {
      sentenca: "Acordo não cumprido na fase de conhecimento. Execução iniciada.",
      estrategia: "Aderimos ao parcelamento do art. 916 para evitar bloqueio SISBAJUD de contas operacionais da empresa."
    },
    financeiro: {
      entrada30: 9000,
      entradaPaga: true,
      parcelas: [
        { num: "1/6", valor: 3500, status: "Pago", vencimento: "10/04/2026" },
        { num: "2/6", valor: 3500, status: "Pendente", vencimento: "10/05/2026" },
        { num: "3/6", valor: 3500, status: "Pendente", vencimento: "10/06/2026" }
      ]
    }
  }
];

export default function RecursosPage() {
  const [expandedRows, setExpandedRows] = useState([]);

  const toggleRow = (id) => {
    setExpandedRows(prev => 
      prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]
    );
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  return (
    <div className="space-y-6">
      {/* Passo 2: Cabeçalho e KPIs */}
      <div className="flex flex-col space-y-1">
        <div className="flex items-center gap-3">
          <Layers className="text-[#D4AF37] w-8 h-8" />
          <h1 className="font-cinzel text-3xl font-bold text-[#D4AF37] tracking-wider uppercase">
            Inteligência Recursal
          </h1>
        </div>
        <p className="font-inter text-gray-500 text-sm">Gestão de teses jurídicas, garantias de juízo e parcelamentos táticos</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="glassmorphism p-6 rounded-xl">
          <p className="text-[10px] uppercase tracking-[0.2em] text-gray-400 mb-1">Capital Imobilizado</p>
          <p className="text-2xl font-cinzel font-bold text-white tracking-tight">{formatCurrency(43796)}</p>
        </div>
        <div className="glassmorphism p-6 rounded-xl">
          <p className="text-[10px] uppercase tracking-[0.2em] text-gray-400 mb-1">Risco em Apólices</p>
          <p className="text-2xl font-cinzel font-bold text-white tracking-tight">{formatCurrency(12296)}</p>
        </div>
        <div className="glassmorphism p-6 rounded-xl">
          <p className="text-[10px] uppercase tracking-[0.2em] text-gray-400 mb-1">Custas Recolhidas</p>
          <p className="text-2xl font-cinzel font-bold text-white tracking-tight">{formatCurrency(1500)}</p>
        </div>
        <div className="glassmorphism p-6 rounded-xl border-l-4 border-l-[#D4AF37]">
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#D4AF37] mb-1">Pendência Parcelamentos</p>
          <p className="text-2xl font-cinzel font-bold text-white tracking-tight">{formatCurrency(17500)}</p>
        </div>
      </div>

      {/* Passo 3: Tabela Principal e Drill-down */}
      <div className="glassmorphism rounded-xl overflow-hidden border border-gray-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-800 bg-white/2">
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-[#D4AF37] font-bold">Processo</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-[#D4AF37] font-bold">Reclamante</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-[#D4AF37] font-bold">Modalidade</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-[#D4AF37] font-bold">Risco Financeiro</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-[#D4AF37] font-bold">Status</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-[#D4AF37] font-bold">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {MOCK_RECURSOS.map((item) => (
                <React.Fragment key={item.id}>
                  {/* Linha Principal */}
                  <tr className={`hover:bg-white/5 transition-colors group ${expandedRows.includes(item.id) ? 'bg-white/5' : ''}`}>
                    <td className="px-6 py-5 font-mono text-xs text-gray-400 group-hover:text-white transition-colors">
                      {item.processo}
                    </td>
                    <td className="px-6 py-5">
                      <p className="font-inter text-sm font-bold text-white uppercase tracking-tight">{item.reclamante}</p>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`px-2 py-1 rounded text-[9px] font-bold uppercase tracking-widest ${item.modalidade === 'RO' ? 'bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/30' : 'bg-green-500/10 text-green-500 border border-green-500/30'}`}>
                        {item.modalidade}
                      </span>
                    </td>
                    <td className="px-6 py-5 font-inter text-sm text-white">
                      {formatCurrency(item.exposicao)}
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${item.status === 'Em Cumprimento' ? 'bg-green-500' : 'bg-blue-500 animate-pulse'}`} />
                        <span className="text-[10px] uppercase font-semibold text-gray-300">{item.status}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <button 
                        onClick={() => toggleRow(item.id)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-[#D4AF37] hover:text-black rounded text-[10px] font-bold uppercase tracking-widest transition-all border border-gray-800"
                      >
                        {expandedRows.includes(item.id) ? (
                          <>Fechar <ChevronUp size={12} /></>
                        ) : (
                          <>Analisar <ChevronDown size={12} /></>
                        )}
                      </button>
                    </td>
                  </tr>

                  {/* Linha Expandida (Drill-down) */}
                  {expandedRows.includes(item.id) && (
                    <tr className="bg-black/40">
                      <td colSpan={6} className="p-0">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-8 border-l-4 border-[#D4AF37] animate-in slide-in-from-top-2 duration-300">
                          
                          {/* Coluna 1: Pilar Jurídico */}
                          <div className="space-y-6">
                            <div className="flex items-center gap-3 border-b border-[#D4AF37]/20 pb-3">
                              <Gavel className="w-5 h-5 text-[#D4AF37]" />
                              <h3 className="font-cinzel text-sm font-bold text-[#D4AF37] tracking-[0.2em] uppercase">
                                Fundamentação & Estratégia
                              </h3>
                              <button className="ml-auto text-gray-500 hover:text-white transition-colors">
                                <Edit3 size={14} />
                              </button>
                            </div>

                            <div className="space-y-4">
                              <div className="space-y-1">
                                <p className="text-[9px] uppercase font-bold text-[#D4AF37]/60 tracking-widest">Síntese da Sentença</p>
                                <p className="text-xs text-gray-400 italic leading-relaxed font-inter">
                                  "{item.juridico.sentenca}"
                                </p>
                              </div>
                              <div className="space-y-1">
                                <p className="text-[9px] uppercase font-bold text-[#D4AF37]/60 tracking-widest">Tese Recursal / Estratégia</p>
                                <p className="text-sm text-white leading-relaxed font-inter">
                                  {item.juridico.estrategia}
                                </p>
                              </div>
                            </div>

                            <div className="pt-4 flex gap-3">
                              <button className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-gray-800 rounded text-[10px] font-bold text-gray-300 hover:text-[#D4AF37] transition-all">
                                <BrainCircuit size={14} /> SIMULAR RISCO IA
                              </button>
                            </div>
                          </div>

                          {/* Coluna 2: Pilar Financeiro */}
                          <div className="space-y-6">
                            <div className="flex items-center gap-3 border-b border-[#D4AF37]/20 pb-3">
                              <Landmark className="w-5 h-5 text-[#D4AF37]" />
                              <h3 className="font-cinzel text-sm font-bold text-[#D4AF37] tracking-[0.2em] uppercase">
                                Exposição Financeira
                              </h3>
                            </div>

                            {item.modalidade === 'RO' ? (
                              <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="bg-white/2 p-4 rounded border border-gray-800">
                                    <p className="text-[9px] uppercase tracking-widest text-gray-500">Custas Processuais</p>
                                    <p className="text-lg font-cinzel text-white">{formatCurrency(item.financeiro.custas)}</p>
                                  </div>
                                  <div className="bg-white/2 p-4 rounded border border-gray-800">
                                    <p className="text-[9px] uppercase tracking-widest text-gray-500">Depósito Recursal</p>
                                    <p className="text-lg font-cinzel text-white">{formatCurrency(item.financeiro.deposito)}</p>
                                  </div>
                                </div>
                                
                                {item.financeiro.seguroGarantia && (
                                  <div className="flex items-center gap-4 p-4 bg-blue-500/5 border border-blue-500/20 rounded-lg">
                                    <div className="p-2 bg-blue-500/20 rounded-full">
                                      <ShieldCheck className="text-blue-400 w-5 h-5" />
                                    </div>
                                    <div>
                                      <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Seguro Garantia Ativo</p>
                                      <p className="text-xs text-white uppercase font-mono">Apólice: {item.financeiro.apolice}</p>
                                    </div>
                                    <button className="ml-auto p-1.5 hover:bg-white/10 rounded">
                                      <FileText size={14} className="text-gray-400" />
                                    </button>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="space-y-6">
                                <div className="flex items-center justify-between p-4 bg-green-500/5 border border-green-500/20 rounded-lg">
                                  <div>
                                    <p className="text-[9px] uppercase text-green-500 font-bold tracking-widest">Entrada (30%)</p>
                                    <p className="text-lg font-cinzel text-white">{formatCurrency(item.financeiro.entrada30)}</p>
                                  </div>
                                  <div className="flex items-center gap-2 text-green-500 bg-green-500/10 px-3 py-1 rounded-full border border-green-500/30">
                                    <ShieldCheck size={14} />
                                    <span className="text-[9px] font-bold uppercase">Confirmada</span>
                                  </div>
                                </div>

                                <div className="space-y-3">
                                  <p className="text-[9px] uppercase font-bold text-gray-500 tracking-widest">Próximas Parcelas</p>
                                  <div className="space-y-2">
                                    {item.financeiro.parcelas.map((parc, idx) => (
                                      <div key={idx} className="flex items-center justify-between p-3 bg-white/2 border border-gray-800 rounded text-xs">
                                        <div className="flex items-center gap-4">
                                          <span className="font-mono text-gray-500">{parc.num}</span>
                                          <span className="text-white font-semibold">{parc.vencimento}</span>
                                        </div>
                                        <div className="flex items-center gap-6">
                                          <span className="text-gray-300">{formatCurrency(parc.valor)}</span>
                                          <span className={`px-2 py-0.5 rounded-full text-[8px] font-bold uppercase ${parc.status === 'Pago' ? 'bg-green-500/20 text-green-500' : 'bg-orange-500/20 text-orange-500 animate-pulse'}`}>
                                            {parc.status}
                                          </span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
