"use client";

import React, { useState } from 'react';
import { 
  Calculator, 
  Zap, 
  Printer, 
  User, 
  DollarSign, 
  AlertTriangle,
  Calendar,
  Percent,
  CheckCircle2,
  FileText
} from 'lucide-react';

export default function CalculadoraPage() {
  const [formData, setFormData] = useState({
    salario: '',
    admissao: '',
    demissao: '',
    insalubridade: '0',
    periculosidade: false,
    feriasVencidas: false,
    multa477: false
  });

  const [resultado, setResultado] = useState(null);

  const formatBRL = (value) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const calcularRescisao = () => {
    const salarioBase = parseFloat(formData.salario) || 0;
    const dataAdmissao = new Date(formData.admissao);
    const dataDemissao = new Date(formData.demissao);

    if (isNaN(dataAdmissao.getTime()) || isNaN(dataDemissao.getTime())) {
      alert("Por favor, preencha as datas corretamente.");
      return;
    }

    // Cálculos de Tempo
    const diffTime = Math.abs(dataDemissao - dataAdmissao);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const anosCompletos = Math.floor(diffDays / 365);

    // Salário com Adicionais
    const adicionalInsalubridade = (parseFloat(formData.insalubridade) / 100) * 1412; // Baseado no mínimo 2024
    const adicionalPericulosidade = formData.periculosidade ? (salarioBase * 0.3) : 0;
    const salarioCalculo = salarioBase + adicionalInsalubridade + adicionalPericulosidade;

    const verbas = [];

    // 1. Saldo de Salário
    const diasMesDemissao = dataDemissao.getDate();
    const valorSaldoSalario = (salarioCalculo / 30) * diasMesDemissao;
    verbas.push({ 
      nome: "Saldo de Salário", 
      desc: `${diasMesDemissao} dias trabalhados no mês`, 
      valor: valorSaldoSalario 
    });

    // 2. Aviso Prévio Indenizado (30 + 3 por ano)
    const diasAviso = 30 + (anosCompletos * 3);
    const valorAviso = (salarioCalculo / 30) * diasAviso;
    verbas.push({ 
      nome: "Aviso Prévio Indenizado", 
      desc: `${diasAviso} dias (Lei 12.506/11)`, 
      valor: valorAviso 
    });

    // 3. 13º Salário Proporcional (Simplificado: avos no ano da demissão)
    const mesDemissao = dataDemissao.getMonth() + 1;
    const avos13 = dataDemissao.getDate() >= 15 ? mesDemissao : mesDemissao - 1;
    const valor13 = (salarioCalculo / 12) * avos13;
    verbas.push({ 
      nome: "13º Salário Proporcional", 
      desc: `${avos13}/12 avos`, 
      valor: valor13 
    });

    // 4. Férias Proporcionais + 1/3
    // Estimativa de avos de férias baseada no tempo total (descontando anos completos que seriam vencidas)
    const avosFerias = Math.round((diffDays % 365) / 30);
    const valorFeriasProp = (salarioCalculo / 12) * avosFerias;
    const valorUmTercoProp = valorFeriasProp / 3;
    verbas.push({ 
      nome: "Férias Proporcionais", 
      desc: `${avosFerias}/12 avos`, 
      valor: valorFeriasProp 
    });
    verbas.push({ 
      nome: "Terço Constitucional (Férias Prop.)", 
      desc: "1/3 sobre férias proporcionais", 
      valor: valorUmTercoProp 
    });

    // 5. Férias Vencidas (se marcado)
    if (formData.feriasVencidas) {
      const valorFeriasVenc = salarioCalculo;
      const valorUmTercoVenc = valorFeriasVenc / 3;
      verbas.push({ 
        nome: "Férias Vencidas", 
        desc: "12/12 avos acumulados", 
        valor: valorFeriasVenc 
      });
      verbas.push({ 
        nome: "Terço Constitucional (Férias Venc.)", 
        desc: "1/3 sobre férias vencidas", 
        valor: valorUmTercoVenc 
      });
    }

    // 6. FGTS e Multa 40% (Estimativa: 8% depósito mensal + 40% multa)
    const saldoEstimadoFGTS = (salarioCalculo * 0.08) * (diffDays / 30);
    const multaFGTS = saldoEstimadoFGTS * 0.4;
    verbas.push({ 
      nome: "Multa FGTS (40%)", 
      desc: "Estimativa sobre tempo de serviço", 
      valor: multaFGTS 
    });

    // 7. Multa Art. 477 (se marcado)
    if (formData.multa477) {
      verbas.push({ 
        nome: "Multa Art. 477 da CLT", 
        desc: "Atraso no pagamento das verbas", 
        valor: salarioBase 
      });
    }

    const total = verbas.reduce((acc, curr) => acc + curr.valor, 0);

    setResultado({
      verbas,
      total,
      anos: anosCompletos,
      dias: diffDays
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Cabeçalho */}
      <div className="flex flex-col space-y-1">
        <div className="flex items-center gap-3">
          <Calculator className="text-[#D4AF37] w-8 h-8" />
          <h1 className="font-cinzel text-3xl font-bold text-[#D4AF37] tracking-wider uppercase">
            Módulo de Cálculos
          </h1>
        </div>
        <p className="font-inter text-gray-500 text-sm">Simulador estratégico de passivo rescisório e verbas trabalhistas</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Formulário de Simulação */}
        <div className="space-y-6">
          <section className="glassmorphism p-8 rounded-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-[#D4AF37]/30" />
            <div className="flex items-center gap-3 mb-8">
              <User className="text-[#D4AF37] w-5 h-5" />
              <h3 className="font-cinzel text-sm font-bold text-white tracking-widest uppercase">Passo 1: Contexto Contratual</h3>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest ml-1">Salário Base (Mensal)</label>
                <div className="relative group">
                  <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 group-focus-within:text-[#D4AF37] transition-colors" />
                  <input 
                    name="salario"
                    type="number" 
                    value={formData.salario}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    className="w-full bg-white/5 border border-gray-800 rounded-lg py-3 pl-12 pr-4 text-sm font-inter text-white focus:border-[#D4AF37]/50 focus:bg-white/10 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest ml-1">Data Admissão</label>
                  <div className="relative group">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 group-focus-within:text-[#D4AF37] transition-colors" />
                    <input 
                      name="admissao"
                      type="date" 
                      value={formData.admissao}
                      onChange={handleInputChange}
                      className="w-full bg-white/5 border border-gray-800 rounded-lg py-3 pl-12 pr-4 text-sm font-inter text-white focus:border-[#D4AF37]/50 outline-none transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest ml-1">Data Demissão</label>
                  <div className="relative group">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 group-focus-within:text-[#D4AF37] transition-colors" />
                    <input 
                      name="demissao"
                      type="date" 
                      value={formData.demissao}
                      onChange={handleInputChange}
                      className="w-full bg-white/5 border border-gray-800 rounded-lg py-3 pl-12 pr-4 text-sm font-inter text-white focus:border-[#D4AF37]/50 outline-none transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="glassmorphism p-8 rounded-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-[#D4AF37]/30" />
            <div className="flex items-center gap-3 mb-8">
              <Zap className="text-[#D4AF37] w-5 h-5" />
              <h3 className="font-cinzel text-sm font-bold text-white tracking-widest uppercase">Passo 2: Exposição & Adicionais</h3>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest ml-1">Insalubridade (%)</label>
                  <div className="relative group">
                    <Percent className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 group-focus-within:text-[#D4AF37] transition-colors" />
                    <select 
                      name="insalubridade"
                      value={formData.insalubridade}
                      onChange={handleInputChange}
                      className="w-full bg-white/5 border border-gray-800 rounded-lg py-3 pl-12 pr-4 text-sm font-inter text-white focus:border-[#D4AF37]/50 outline-none transition-all appearance-none"
                    >
                      <option value="0">Zero</option>
                      <option value="10">10% (Mínimo)</option>
                      <option value="20">20% (Médio)</option>
                      <option value="40">40% (Máximo)</option>
                    </select>
                  </div>
                </div>
                <div className="flex flex-col justify-end pb-3">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative w-5 h-5 border border-gray-700 rounded transition-colors group-hover:border-[#D4AF37] flex items-center justify-center">
                      <input 
                        name="periculosidade"
                        type="checkbox" 
                        checked={formData.periculosidade}
                        onChange={handleInputChange}
                        className="opacity-0 absolute inset-0 cursor-pointer z-10"
                      />
                      {formData.periculosidade && <div className="w-2.5 h-2.5 bg-[#D4AF37] rounded-sm" />}
                    </div>
                    <span className="text-xs text-gray-300 font-inter">Adicional Periculosidade</span>
                  </label>
                </div>
              </div>

              <div className="pt-4 space-y-4 border-t border-gray-800">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative w-5 h-5 border border-gray-700 rounded transition-colors group-hover:border-[#D4AF37] flex items-center justify-center">
                    <input 
                      name="feriasVencidas"
                      type="checkbox" 
                      checked={formData.feriasVencidas}
                      onChange={handleInputChange}
                      className="opacity-0 absolute inset-0 cursor-pointer z-10"
                    />
                    {formData.feriasVencidas && <div className="w-2.5 h-2.5 bg-[#D4AF37] rounded-sm" />}
                  </div>
                  <span className="text-xs text-gray-300 font-inter">Possui Férias Vencidas</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative w-5 h-5 border border-gray-700 rounded transition-colors group-hover:border-[#D4AF37] flex items-center justify-center">
                    <input 
                      name="multa477"
                      type="checkbox" 
                      checked={formData.multa477}
                      onChange={handleInputChange}
                      className="opacity-0 absolute inset-0 cursor-pointer z-10"
                    />
                    {formData.multa477 && <div className="w-2.5 h-2.5 bg-[#D4AF37] rounded-sm" />}
                  </div>
                  <span className="text-xs text-gray-300 font-inter">Aplicar Multa Art. 477 CLT</span>
                </label>
              </div>

              <button 
                onClick={calcularRescisao}
                className="w-full flex items-center justify-center gap-3 py-4 bg-[#D4AF37] text-black font-cinzel font-bold text-sm tracking-widest rounded-lg hover:bg-yellow-600 transition-all shadow-[0_0_30px_rgba(212,175,55,0.1)] mt-4"
              >
                <Zap size={18} fill="currentColor" />
                PROCESSAR SIMULAÇÃO
              </button>
            </div>
          </section>
        </div>

        {/* Painel de Resultados */}
        <div className="space-y-6">
          {resultado ? (
            <div className="animate-in slide-in-from-right-4 duration-500 space-y-6">
              <div className="glassmorphism p-10 rounded-2xl border border-[#D4AF37]/30 relative overflow-hidden bg-gradient-to-br from-[#D4AF37]/5 to-transparent">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="text-green-500 w-4 h-4" />
                  <span className="text-[10px] uppercase font-bold text-green-500 tracking-widest">Simulação Concluída</span>
                </div>
                <h2 className="text-gray-400 text-xs uppercase tracking-widest font-inter mb-4">Passivo Total Estimado</h2>
                <p className="text-5xl font-cinzel font-bold text-white tracking-tighter drop-shadow-lg">
                  {formatBRL(resultado.total)}
                </p>
                <div className="mt-6 flex items-center gap-4 text-[10px] text-gray-500 uppercase tracking-wider font-inter">
                  <span className="flex items-center gap-1.5"><Calendar size={12} /> {resultado.anos} anos completados</span>
                  <span className="flex items-center gap-1.5"><FileText size={12} /> {resultado.verbas.length} rubricas calculadas</span>
                </div>
              </div>

              <div className="glassmorphism rounded-2xl overflow-hidden border border-gray-800">
                <div className="p-4 bg-white/2 border-b border-gray-800">
                  <h3 className="font-cinzel text-xs font-bold text-[#D4AF37] tracking-widest uppercase">Demonstrativo Detalhado</h3>
                </div>
                <div className="divide-y divide-gray-800">
                  {resultado.verbas.map((verba, index) => (
                    <div key={index} className="p-5 flex justify-between items-center hover:bg-white/5 transition-colors group">
                      <div className="space-y-0.5">
                        <p className="text-xs font-bold text-white group-hover:text-[#D4AF37] transition-colors">{verba.nome}</p>
                        <p className="text-[10px] text-gray-500 italic">{verba.desc}</p>
                      </div>
                      <p className="font-inter text-sm font-semibold text-white">
                        {formatBRL(verba.valor)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <button className="w-full flex items-center justify-center gap-3 py-4 border border-gray-800 text-gray-400 font-cinzel font-bold text-xs tracking-widest rounded-lg hover:bg-white/5 transition-all">
                <Printer size={16} />
                EXPORTAR DOCUMENTO / PDF
              </button>
            </div>
          ) : (
            <div className="h-full min-h-[400px] glassmorphism rounded-2xl flex flex-col items-center justify-center p-8 text-center border-dashed border-2 border-gray-800">
              <div className="p-4 bg-white/5 rounded-full mb-4">
                <Calculator className="w-12 h-12 text-gray-700" />
              </div>
              <h3 className="font-cinzel text-sm font-bold text-gray-500 uppercase tracking-widest mb-2">Aguardando Parâmetros</h3>
              <p className="text-xs text-gray-600 max-w-[280px]">
                Preencha os dados contratuais ao lado para gerar o demonstrativo estratégico de passivo.
              </p>
            </div>
          )}

          <div className="glassmorphism p-6 rounded-2xl border border-red-900/30 bg-red-900/5">
            <div className="flex gap-4">
              <AlertTriangle className="text-orange-500 w-10 h-10 shrink-0" />
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-orange-500 uppercase tracking-widest">Aviso de Limitação Jurídica</p>
                <p className="text-[10px] text-gray-500 leading-relaxed italic">
                  Este simulador fornece estimativas baseadas nos valores informados. Para cálculos judiciais precisos, utilize o PJe-Calc ou consulte a perícia contábil.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
