"use client";

import React, { useState, useMemo } from 'react';
import { FileSignature, Search, Users, UserPlus, Plus, Printer, Check, X } from 'lucide-react';

// Passo 1: Constantes e Mock Data
const EMPRESAS = {
  "taipastur": {
    n: "TAIPASTUR TRANSPORTES TURÍSTICOS LTDA.",
    cnpj: "58.673.450/0001-25",
    ends: "São Paulo/SP",
    d: "Avenida Deputado Cantídio Sampaio, nº 6.557, sala 1, Vila Nova Parada, São Paulo-SP, CEP 02860-001",
    logo: "https://i.postimg.cc/1X0QRQWV/taipas.png"
  },
  "piccolotur": {
    n: "PICCOLOTUR TRANSPORTES TURISTICOS LTDA.",
    cnpj: "50.984.681/0001-48",
    ends: "Várzea Paulista/SP",
    d: "Av. Marginal do Rio Jundiaí, 220, Jardim Paulista, Várzea Paulista-SP, CEP 13221-800",
    logo: "https://i.postimg.cc/6qVX6XH7/piccolotur.png"
  },
  "alitur": {
    n: "ALITUR ALIANCA DE TURISMO LTDA.",
    cnpj: "46.729.356/0001-61",
    ends: "Jundiaí/SP",
    d: "Av. Professora Maria do Carmo Guimarães Pellegrini, 300, Vila Viotto, Jundiaí-SP, CEP 13214-205",
    logo: "https://i.postimg.cc/cC7S1SDJ/alitur.png"
  }
};

const PREPOSTOS_FIXOS = [
  { n: "Sr. Júlio César Bernardes", q: "brasileiro, portador do RG nº 57.641.585-6 SSP/SP e CPF nº 483.964.388-11" },
  { n: "Sra. Simone Ruas Piccolo", q: "brasileira, portadora do RG nº 9.512.183 SSP/SP e CPF nº 137.588.548-06" },
  { n: "Sr. Douglas Rafael Caresato", q: "brasileiro, portador do RG nº 43.145.124-2 SSP/SP e CPF nº 314.201.638-41" }
];

const MOCK_PROCESSOS = [
  { reclamante: "JOSÉ FERREIRA DOS SANTOS", processo: "1001222-33.2023.5.02.0001", vara: "01ª", comarca: "São Paulo", reu: "TAIPASTUR TRANSPORTES TURISTICOS LTDA." },
  { reclamante: "MARIA CLARA GOMES", processo: "0010992-88.2023.5.15.0002", vara: "02ª", comarca: "Jundiaí", reu: "PICCOLOTUR TRANSPORTES TURISTICOS LTDA." },
  { reclamante: "ANTÔNIO SILVA ROCHA", processo: "1000542-10.2024.5.15.0100", vara: "04ª", comarca: "Campinas", reu: "ALITUR ALIANCA DE TURISMO LTDA." }
];

const buscarEmpresa = (nomeReu) => {
  if (!nomeReu) return null;
  const norm = (s) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\./g, "").trim();
  const nomeProc = norm(nomeReu);
  
  if (nomeProc.includes("piccolo")) return EMPRESAS["piccolotur"];
  if (nomeProc.includes("alitur")) return EMPRESAS["alitur"];
  if (nomeProc.includes("taipas")) return EMPRESAS["taipastur"];
  return null;
};

export default function CartasPage() {
  // Passo 2: Estados do Componente
  const [busca, setBusca] = useState("");
  const [sugestoes, setSugestoes] = useState([]);
  const [processoAtivo, setProcessoAtivo] = useState(null);

  const [prepostosSelecionados, setPrepostosSelecionados] = useState([]);
  const [prepostosManuais, setPrepostosManuais] = useState([]);
  const [manualInput, setManualInput] = useState({ nome: "", qualif: "" });

  // Handler da busca
  const handleBusca = (e) => {
    const val = e.target.value;
    setBusca(val);
    if (val.trim().length === 0) {
      setSugestoes([]);
      return;
    }
    const termo = val.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const filt = MOCK_PROCESSOS.filter(p => 
      p.reclamante.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(termo) || 
      p.processo.replace(/\D/g, "").includes(termo.replace(/\D/g, ""))
    );
    setSugestoes(filt.slice(0, 5));
  };

  const handleSelectSugestao = (p) => {
    setProcessoAtivo(p);
    setBusca(p.reclamante);
    setSugestoes([]);
  };

  const toggleFixos = (idx) => {
    if (prepostosSelecionados.includes(idx)) {
      setPrepostosSelecionados(prepostosSelecionados.filter(i => i !== idx));
    } else {
      setPrepostosSelecionados([...prepostosSelecionados, idx]);
    }
  };

  const addManual = () => {
    if (!manualInput.nome.trim() || !manualInput.qualif.trim()) return;
    setPrepostosManuais([...prepostosManuais, { n: manualInput.nome.trim(), q: manualInput.qualif.trim() }]);
    setManualInput({ nome: "", qualif: "" });
  };

  const canPrint = processoAtivo !== null && (prepostosSelecionados.length > 0 || prepostosManuais.length > 0);

  const empresaAtiva = processoAtivo ? buscarEmpresa(processoAtivo.reu) : null;
  const listaHtml = [...prepostosSelecionados.map(i => PREPOSTOS_FIXOS[i]), ...prepostosManuais];
  
  // Data de hoje formatada
  const dataHojeStr = useMemo(() => {
    const d = new Date();
    const meses = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
    const cidade = empresaAtiva ? empresaAtiva.ends.split('/')[0] : "São Paulo";
    return `${cidade}, ${d.getDate()} de ${meses[d.getMonth()]} de ${d.getFullYear()}.`;
  }, [empresaAtiva]);

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-20">
      
      {/* Passo 5: CSS de Isolação Global */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #carta-print-area, #carta-print-area * { visibility: visible; }
          #carta-print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 2cm !important;
            background: white !important;
            color: black !important;
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
            transform: none !important;
          }
          nav, aside, button, .print-hidden { display: none !important; }
          html, body { background: white !important; margin: 0 !important; padding: 0 !important; }
        }
      `}</style>

      {/* Header */}
      <div className="text-center md:mb-14 mt-8 print-hidden">
        <h2 className="flex items-center justify-center gap-4 text-2xl font-cinzel font-bold text-[#D4AF37] mb-3">
          <FileSignature size={28} /> Módulo de Preposições
        </h2>
        <p className="text-gray-400 text-sm font-inter">Emissão de Cartas de Preposto com selo corporativo e validação em massa.</p>
      </div>

      {/* Buscador Auto-complete */}
      <div className="p-8 bg-black/40 backdrop-blur-xl border border-white/5 rounded-2xl relative z-50 print-hidden">
        <div className="font-cinzel text-xs text-[#D4AF37] uppercase tracking-[0.15em] mb-5 flex items-center gap-3 font-bold">
          <Search size={16} /> Localizar Auto Judicial
        </div>
        <div className="relative">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input 
            type="text" 
            value={busca}
            onChange={handleBusca}
            placeholder="Pesquisar por reclamante ou processo..."
            className="w-full bg-black/50 border border-white/10 rounded-xl py-4 pl-14 pr-6 text-sm text-white focus:border-[#D4AF37]/50 focus:ring-1 focus:ring-[#D4AF37]/20 outline-none transition-all"
          />
          
          {sugestoes.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-[#0B1120] border border-[#D4AF37]/30 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] overflow-hidden z-[9999]">
              {sugestoes.map((p, i) => (
                <div 
                  key={i} 
                  onClick={() => handleSelectSugestao(p)}
                  className="p-4 cursor-pointer border-b border-white/5 hover:bg-[#D4AF37]/10 transition-colors last:border-b-0"
                >
                  <strong className="block text-sm text-white mb-1">{p.reclamante}</strong>
                  <span className="text-xs text-gray-500">{p.processo} • {p.reu}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Prepostos Fixos */}
      <div className="print-hidden">
        <div className="font-cinzel text-xs text-[#D4AF37] uppercase tracking-[0.15em] mb-5 flex items-center gap-3 font-bold">
          <Users size={16} /> Designar Representante(s)
        </div>
        <div className="space-y-4">
          {PREPOSTOS_FIXOS.map((p, idx) => {
            const isSelected = prepostosSelecionados.includes(idx);
            return (
              <label 
                key={idx} 
                className={`flex items-center gap-5 p-6 rounded-xl border cursor-pointer transition-all ${isSelected ? 'bg-[#D4AF37]/5 border-[#D4AF37]/50' : 'bg-black/40 border-white/5 hover:bg-white/5'}`}
                onClick={() => toggleFixos(idx)}
              >
                <div className={`w-6 h-6 rounded border flex items-center justify-center transition-all shadow-inner ${isSelected ? 'bg-[#D4AF37] border-[#D4AF37]' : 'border-white/20 bg-black/40'}`}>
                  {isSelected && <Check size={14} className="text-black font-bold" />}
                </div>
                <div>
                  <h4 className={`text-sm font-bold mb-1 transition-colors ${isSelected ? 'text-white' : 'text-gray-300'}`}>{p.n}</h4>
                  <p className="text-xs text-gray-500">{p.q}</p>
                </div>
              </label>
            );
          })}
        </div>
      </div>

      {/* Preposto Manual */}
      <div className="p-6 bg-black/40 border border-dashed border-[#D4AF37]/30 rounded-2xl print-hidden">
        <div className="font-cinzel text-xs text-[#D4AF37] uppercase tracking-[0.15em] mb-4 flex items-center gap-3 font-bold">
          <UserPlus size={14} /> Inclusão de Preposto Eventual (Manual)
        </div>
        <div className="grid grid-cols-1 md:grid-cols-[1fr_1.5fr_auto] gap-4 items-end">
          <div className="space-y-1.5">
            <label className="text-[9px] text-gray-500 uppercase tracking-widest font-bold">Nome Completo</label>
            <input 
              type="text" 
              value={manualInput.nome}
              onChange={e => setManualInput({...manualInput, nome: e.target.value})}
              placeholder="Ex: Sr. João Silva" 
              className="w-full bg-black/50 border border-white/10 rounded-lg py-2.5 px-3 text-xs text-white focus:border-[#D4AF37]/50 outline-none"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[9px] text-gray-500 uppercase tracking-widest font-bold">Nacion./RG/CPF/Endereço</label>
            <input 
              type="text" 
              value={manualInput.qualif}
              onChange={e => setManualInput({...manualInput, qualif: e.target.value})}
              placeholder="Ex: brasileiro, portador do RG..." 
              className="w-full bg-black/50 border border-white/10 rounded-lg py-2.5 px-3 text-xs text-white focus:border-[#D4AF37]/50 outline-none"
            />
          </div>
          <button onClick={addManual} className="h-[38px] px-6 border border-blue-500/50 bg-blue-500/10 text-blue-400 rounded-lg text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-blue-500 hover:text-white transition-all">
            <Plus size={14} /> Adicionar
          </button>
        </div>
        {prepostosManuais.length > 0 && (
          <div className="mt-4 space-y-2">
            {prepostosManuais.map((p, idx) => (
              <div key={idx} className="flex justify-between items-center p-3 bg-white/5 border border-white/5 rounded-lg">
                <div>
                  <p className="text-xs text-white font-bold">{p.n}</p>
                  <p className="text-[10px] text-gray-500 truncate max-w-lg">{p.q}</p>
                </div>
                <button onClick={() => setPrepostosManuais(prepostosManuais.filter((_, i) => i !== idx))} className="text-gray-500 hover:text-red-500">
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <button 
        onClick={() => window.print()}
        disabled={!canPrint}
        className="w-full py-5 bg-gradient-to-r from-[#D4AF37] to-[#B8860B] text-black font-cinzel font-bold text-sm uppercase tracking-widest rounded-xl hover:scale-[1.01] transition-transform flex items-center justify-center gap-3 shadow-2xl shadow-[#D4AF37]/20 disabled:opacity-30 disabled:pointer-events-none print-hidden"
      >
        <Printer size={20} /> Gerar e Imprimir Carta Agora
      </button>

      {/* Passo 4: Preview da Carta A4 */}
      <div 
        id="carta-print-area" 
        className="bg-white text-black font-serif mx-auto mt-16 scale-100 sm:scale-100 shadow-[0_20px_60px_rgba(0,0,0,0.5)] origin-top border border-gray-300" 
        style={{ width: '210mm', minHeight: '297mm', padding: '15mm 20mm', boxSizing: 'border-box' }}
      >
        <div className="flex items-center justify-between border-b-2 border-black pb-8 mb-10 h-[25mm]">
          {empresaAtiva && empresaAtiva.logo && (
             <img src={empresaAtiva.logo} alt="Logo Empresa" className="max-h-[15mm] max-w-[50mm] object-contain" />
          )}
          <p className="text-lg font-bold uppercase text-right ml-auto">Carta de Preposição</p>
        </div>

        <div className="text-[11pt] leading-loose text-justify">
          <p className="indent-[15mm] mb-8">
            A empresa <strong>{empresaAtiva ? empresaAtiva.n : "---"}</strong>, inscrita no CNPJ sob o nº <span>{empresaAtiva ? empresaAtiva.cnpj : "---"}</span>, com sede em <span>{empresaAtiva ? empresaAtiva.d : "---"}</span>, neste ato representada conforme seu estatuto social, vem designar e autorizar como preposto(s) o(s) representante(s) abaixo qualificado(s):
          </p>
          
          <ul className="list-none pl-[10mm] mb-8 space-y-3">
             {listaHtml.map((p, idx) => {
               const isLast = idx === listaHtml.length - 1;
               return (
                 <li key={idx} className="text-[10.5pt] leading-tight">
                   – <strong>{p.n}</strong>, {p.q}{isLast ? '.' : ';'}
                 </li>
               );
             })}
          </ul>

          <p className="indent-[15mm] mb-8">
            O(s) representante(s) acima possui(em) amplos poderes para representar esta empresa perante a Justiça do Trabalho nos autos da Reclamação Trabalhista movida por <strong>{processoAtivo ? processoAtivo.reclamante : "---"}</strong>, processo nº <strong>{processoAtivo ? processoAtivo.processo : "---"}</strong>, em trâmite na <span>{processoAtivo ? processoAtivo.vara : "---"}</span> Vara do Trabalho de <span>{processoAtivo ? processoAtivo.comarca : "---"}</span>.
          </p>

          <p className="indent-[15mm] mb-10">
            São conferidos ao(s) preposto(s) poderes para transigir, firmar acordos, confessar, desistir, dar e receber quitação, prestar depoimento pessoal e praticar todos os atos necessários ao fiel cumprimento deste mandato.
          </p>

          <p className="indent-0 mt-[6mm] mb-16">
            {dataHojeStr}
          </p>

          <div className="mt-16 text-center">
             <div className="border-t border-black w-64 mx-auto pt-2 font-bold text-[10.5pt] uppercase">
                {empresaAtiva ? empresaAtiva.n : "---"}
             </div>
             <div className="text-[10pt] mt-1">Representante Legal</div>
          </div>
        </div>
      </div>

    </div>
  );
}
