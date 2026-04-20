"use client";

import React, { useState } from 'react';
import { 
  Receipt, 
  PlusCircle, 
  History, 
  UploadCloud, 
  Building2, 
  DollarSign, 
  Search,
  Calendar,
  Wallet,
  Hash,
  ArrowRight
} from 'lucide-react';

// Passo 1: Mock Data
const MOCK_NFS = [
  {
    id: 1,
    fornecedor: "PAPELARIA CENTRAL LTDA",
    nf: "88219",
    valor: 450.00,
    vencimento: "15/05/2026",
    filial: "Jundiaí - Matriz",
    statusPagamento: "Pago"
  },
  {
    id: 2,
    fornecedor: "LIMPEZA TOTAL SERVIÇOS",
    nf: "1022",
    valor: 2800.00,
    vencimento: "20/05/2026",
    filial: "São Paulo - CP",
    statusPagamento: "Pendente"
  },
  {
    id: 3,
    fornecedor: "TI SOLUÇÕES DIGITAIS",
    nf: "455",
    valor: 12500.00,
    vencimento: "05/06/2026",
    filial: "Jundiaí - Matriz",
    statusPagamento: "Pendente"
  }
];

const InputField = ({ label, icon: Icon, placeholder, type = "text", highlight = false }) => (
  <div className="space-y-2">
    <label className="block text-[10px] uppercase tracking-widest text-gray-500 ml-1 font-bold">
      {label}
    </label>
    <div className="relative group">
      <div className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-[#D4AF37] ${highlight ? 'text-[#D4AF37]' : 'text-gray-600'}`}>
        <Icon size={16} />
      </div>
      <input 
        type={type} 
        placeholder={placeholder}
        className={`w-full bg-white/5 border border-gray-800 rounded-lg py-3 pl-12 pr-4 text-sm font-inter text-white placeholder:text-gray-700 focus:outline-none focus:border-[#D4AF37]/50 focus:bg-white/10 transition-all ${highlight ? 'border-[#D4AF37]/30 text-[#D4AF37] font-semibold' : ''}`}
      />
    </div>
  </div>
);

export default function NotasFiscaisPage() {
  const [activeTab, setActiveTab] = useState("novo");

  const formatBRL = (value) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  return (
    <div className="space-y-8">
      {/* Passo 5: Bloco de KPI Financeiro */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glassmorphism p-6 rounded-xl border-l-2 border-l-blue-500/50">
          <p className="text-[10px] uppercase tracking-[0.2em] text-gray-400 mb-1">NFs no Mês</p>
          <p className="text-3xl font-cinzel font-bold text-white leading-none">12</p>
          <p className="text-[10px] text-gray-600 mt-2">Média: 10.5/mês</p>
        </div>
        <div className="glassmorphism p-6 rounded-xl border-l-2 border-l-[#D4AF37]">
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#D4AF37] mb-1">Volume em Aberto</p>
          <p className="text-3xl font-cinzel font-bold text-white leading-none">{formatBRL(15300)}</p>
          <p className="text-[10px] text-orange-500/80 mt-2 font-bold uppercase tracking-tighter animate-pulse">Aguardando Vencimento</p>
        </div>
        <div className="glassmorphism p-6 rounded-xl border-l-2 border-l-green-500/50">
          <p className="text-[10px] uppercase tracking-[0.2em] text-gray-400 mb-1">Volume Pago</p>
          <p className="text-3xl font-cinzel font-bold text-white leading-none">{formatBRL(32450)}</p>
          <p className="text-[10px] text-green-500/80 mt-2 font-bold uppercase tracking-tighter">Ciclo Fechado</p>
        </div>
      </div>

      {/* Passo 2: Sistema de Abas */}
      <div className="flex items-center gap-4">
        <button 
          onClick={() => setActiveTab("novo")}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-cinzel text-xs font-bold tracking-widest transition-all ${activeTab === 'novo' ? 'glassmorphism border border-[#D4AF37] text-[#D4AF37] shadow-[0_0_20px_rgba(212,175,55,0.1)]' : 'text-gray-500 hover:text-gray-300'}`}
        >
          <PlusCircle size={16} />
          NOVA NOTA FISCAL
        </button>
        <button 
          onClick={() => setActiveTab("historico")}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-cinzel text-xs font-bold tracking-widest transition-all ${activeTab === 'historico' ? 'glassmorphism border border-[#D4AF37] text-[#D4AF37] shadow-[0_0_20px_rgba(212,175,55,0.1)]' : 'text-gray-500 hover:text-gray-300'}`}
        >
          <History size={16} />
          HISTÓRICO / AUDITORIA
        </button>
      </div>

      {activeTab === "novo" ? (
        /* Passo 3: Aba Nova Nota Fiscal */
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
          <form className="grid grid-cols-1 lg:grid-cols-2 gap-10" onSubmit={(e) => e.preventDefault()}>
            {/* Dados do Fornecedor */}
            <div className="glassmorphism p-8 rounded-2xl relative overflow-hidden">
               <div className="absolute top-0 left-0 w-1 h-full bg-[#D4AF37]/30" />
               <div className="flex items-center gap-3 mb-8">
                 <Building2 className="text-[#D4AF37] w-5 h-5" />
                 <h3 className="font-cinzel text-sm font-bold text-white tracking-widest uppercase">Dados do Fornecedor</h3>
               </div>
               
               <div className="space-y-6">
                 <InputField label="Nome do Fornecedor / Razão Social" icon={UploadCloud} placeholder="EX: EMPRESA LTDA" />
                 <div className="grid grid-cols-3 gap-4">
                   <div className="col-span-1">
                     <InputField label="Banco" icon={Building2} placeholder="001" />
                   </div>
                   <div className="col-span-2">
                     <InputField label="Agência / Conta" icon={History} placeholder="1234 / 56789-0" />
                   </div>
                 </div>
                 <InputField label="Chave PIX (E-mail, CNPJ ou Telefone)" icon={Wallet} placeholder="pix@fornecedor.com.br" />
               </div>
            </div>

            {/* Dados da NF */}
            <div className="glassmorphism p-8 rounded-2xl relative overflow-hidden">
               <div className="absolute top-0 left-0 w-1 h-full bg-[#D4AF37]/30" />
               <div className="flex items-center gap-3 mb-8">
                 <Receipt className="text-[#D4AF37] w-5 h-5" />
                 <h3 className="font-cinzel text-sm font-bold text-white tracking-widest uppercase">Detalhamento Fiscais</h3>
               </div>

               <div className="space-y-6">
                 <div className="grid grid-cols-2 gap-4">
                   <InputField label="Nº da Nota / Série" icon={Hash} placeholder="000.123" />
                   <InputField label="Valor Total (R$)" icon={DollarSign} placeholder="0.00" highlight={true} />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                   <InputField label="Data de Emissão" icon={Calendar} type="date" placeholder="" />
                   <InputField label="Vencimento" icon={Calendar} type="date" placeholder="" />
                 </div>
                 <InputField label="Unidade / Filial Destino" icon={Building2} placeholder="EX: JUNDIAÍ" />
               </div>
            </div>

            <div className="lg:col-span-2 flex justify-end pt-4">
              <button 
                className="group flex items-center gap-3 px-10 py-4 bg-[#D4AF37] text-black font-cinzel font-bold text-sm tracking-widest rounded-lg hover:bg-yellow-600 transition-all shadow-[0_0_30px_rgba(212,175,55,0.2)]"
              >
                REGISTRAR LANÇAMENTO
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* Passo 4: Aba Histórico / Auditoria */
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 space-y-6">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input 
              type="text" 
              placeholder="Buscar por NF ou Fornecedor..."
              className="w-full bg-white/5 border border-gray-800 rounded-xl py-3 pl-12 pr-4 text-xs font-inter text-white focus:outline-none focus:border-[#D4AF37]/40 transition-all"
            />
          </div>

          <div className="glassmorphism rounded-2xl overflow-hidden border border-gray-800">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white/2 border-b border-gray-800">
                    <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-[#D4AF37] font-bold">Fornecedor</th>
                    <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-[#D4AF37] font-bold">NF</th>
                    <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-[#D4AF37] font-bold">Valor</th>
                    <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-[#D4AF37] font-bold">Vencimento</th>
                    <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-[#D4AF37] font-bold">Filial</th>
                    <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-[#D4AF37] font-bold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {MOCK_NFS.map((nf) => (
                    <tr key={nf.id} className="hover:bg-white/5 transition-colors group">
                      <td className="px-6 py-4">
                        <p className="text-white text-xs font-bold uppercase tracking-tight">{nf.fornecedor}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono text-[10px] text-gray-500 group-hover:text-white transition-colors">{nf.nf}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-white text-xs font-semibold">{formatBRL(nf.valor)}</span>
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-400 font-inter">
                        {nf.vencimento}
                      </td>
                      <td className="px-6 py-4 text-[10px] text-gray-500 uppercase tracking-wider">
                        {nf.filial}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase transition-all ${nf.statusPagamento === 'Pago' ? 'bg-green-500/10 text-green-500 border border-green-500/30' : 'bg-orange-500/10 text-orange-500 border border-orange-500/30 animate-pulse'}`}>
                          {nf.statusPagamento === 'Pago' ? 'Pago' : 'Aguardando Vencimento'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
