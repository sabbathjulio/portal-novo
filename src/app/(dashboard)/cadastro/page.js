"use client";

import React, { useState, useEffect } from 'react';
import { 
  ScrollText, FolderOpen, CalendarClock, Briefcase, 
  Scale, CheckCircle, ArrowRight, ArrowLeft, Target,
  Check, AlertCircle, Calendar, Eye
} from 'lucide-react';

export default function CadastroProcessualPage() {
  // Passo 1: Setup e Estados
  const [currentStep, setCurrentStep] = useState(1);
  const [cnjValid, setCnjValid] = useState(null);

  const [formData, setFormData] = useState({
    processo: "", reclamante: "", funcao: "", status: "", reu: "", poloPassivo: "", 
    vara: "", comarca: "", dataDist: "", unidade: "", agenda: "", horas: "", 
    modelo: "Presencial", admissao: "", demissao: "", motivo: "", valorAcao: "", 
    advogado: "", danoMoral: "NÃO", valorDm: "", razaoDm: "", pericia: "NÃO", 
    tipoPericia: "", pedidos: "", comentarios: "", confirmarAgenda: true, addFarol: true
  });

  // Passo 2: Motores de Validação e Lógica
  const validarCNJ = (cnj) => {
    let str = cnj.replace(/\D/g, '');
    if (str.length !== 20) return false;
    let n = str.substring(0, 7) + str.substring(9, 20) + str.substring(7, 9);
    try {
      return BigInt(n) % 97n === 1n;
    } catch {
      return false;
    }
  };

  const handleCNJChange = (e) => {
    let v = e.target.value.replace(/\D/g, '');
    if (v.length > 20) v = v.slice(0, 20);
    
    let formatted = v;
    if (v.length > 7) formatted = v.replace(/^(\d{7})(\d)/, "$1-$2");
    if (v.length > 9) formatted = formatted.replace(/-(\d{2})(\d)/, "-$1.$2");
    if (v.length > 13) formatted = formatted.replace(/\.(\d{4})(\d)/, ".$1.$2");
    if (v.length > 14) formatted = formatted.replace(/\.(\d)(\d)/, ".$1.$2");
    if (v.length > 16) formatted = formatted.replace(/\.(\d{2})(\d)/, ".$1.$2");

    const valid = v.length === 20 ? validarCNJ(formatted) : null;

    setFormData(prev => ({ ...prev, processo: formatted }));
    setCnjValid(valid);
  };

  const maskMoney = (value) => {
    let v = value.replace(/\D/g, '');
    if (v === '') return '';
    v = (parseInt(v, 10) / 100).toFixed(2);
    v = v.replace('.', ',');
    v = v.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
    return `R$ ${v}`;
  };

  const isAguardando = formData.status === "Aguardando Audiência";

  useEffect(() => {
    if (isAguardando) {
      setFormData(prev => ({...prev, agenda: "", horas: ""}));
    }
  }, [formData.status, isAguardando]);

  const handleKeyDownPedidos = (e) => {
    if (e.key === 'Enter') {
      const cursor = e.target.selectionStart;
      const textBefore = e.target.value.substring(0, cursor);
      const lines = textBefore.split('\n');
      const lastLine = lines[lines.length - 1];
      const match = lastLine.match(/^(\d+)\.\s/);
      
      if (match) {
        e.preventDefault();
        const nextNum = parseInt(match[1], 10) + 1;
        const insertText = `\n${nextNum}. `;
        const newText = textBefore + insertText + e.target.value.substring(cursor);
        setFormData(prev => ({ ...prev, pedidos: newText }));
        setTimeout(() => {
          e.target.selectionStart = e.target.selectionEnd = cursor + insertText.length;
        }, 0);
      }
    }
  };

  const nextStep = () => {
    if (currentStep === 1 && formData.processo && cnjValid === false) {
      return; // Trava se cnj for invalido visivelmente
    }
    if (currentStep < 5) setCurrentStep(curr => curr + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(curr => curr - 1);
  };

  // UI Components
  const stepsOpts = [
    { num: 1, label: "1. Identificação", icon: FolderOpen },
    { num: 2, label: "2. Sessão", icon: CalendarClock },
    { num: 3, label: "3. Vínculo", icon: Briefcase },
    { num: 4, label: "4. Pleitos", icon: Scale },
    { num: 5, label: "5. Conclusão", icon: CheckCircle },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      
      {/* Passo 3: Layout do Wizard (Header e Stepper) */}
      <div className="text-center relative pt-4">
        <h2 className="flex items-center justify-center gap-4 text-3xl font-cinzel font-bold text-[#D4AF37] mb-3">
          <ScrollText size={32} /> Cadastro Processual
        </h2>
        <p className="text-gray-400 text-sm font-inter">Assistente guiado em etapas para registro perfeito.</p>
      </div>

      <form onSubmit={(e) => e.preventDefault()} className="space-y-8">
        
        {/* Stepper */}
        <div className="flex justify-between gap-2 overflow-x-auto pb-4 custom-scrollbar">
          {stepsOpts.map(s => {
            const isActive = currentStep === s.num;
            const isCompleted = currentStep > s.num;
            return (
              <div 
                key={s.num} 
                className={`flex-1 min-w-max text-center py-3 px-4 rounded-xl flex items-center justify-center gap-2 text-[11px] font-bold uppercase tracking-widest transition-all duration-300
                  ${isActive ? 'bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37] shadow-[0_0_15px_rgba(212,175,55,0.15)] ring-1 ring-[#D4AF37]/50' : 
                    isCompleted ? 'bg-black/30 text-gray-400 border border-[#D4AF37]/30' : 
                    'bg-black/40 text-gray-600 border border-white/5'}`
                }
              >
                <s.icon size={14} /> {s.label}
              </div>
            );
          })}
        </div>

        <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 md:p-10 shadow-2xl">
          
          {/* Passo 4: Renderização Dinâmica dos Steps */}
          
          {/* STEP 1: IDENTIFICAÇÃO */}
          {currentStep === 1 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              <h3 className="font-cinzel text-lg text-[#D4AF37] mb-8 border-l-4 border-[#D4AF37] pl-3 flex items-center gap-3">Identificação do Caso</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                
                <div className="col-span-1 md:col-span-2 space-y-2">
                  <label className="flex justify-between text-[10px] text-[#D4AF37]/80 uppercase tracking-widest font-bold">
                    Protocolo CNJ
                    {cnjValid === true && <span className="text-green-500 flex items-center gap-1"><Check size={12}/> Válido</span>}
                    {cnjValid === false && <span className="text-red-500 flex items-center gap-1"><AlertCircle size={12}/> Inválido</span>}
                  </label>
                  <div className="relative">
                    <input 
                      type="text" 
                      value={formData.processo}
                      onChange={handleCNJChange}
                      placeholder="1000114-98.2026.5.02.0463" 
                      className={`w-full bg-black/50 border rounded-xl p-4 text-white font-mono text-lg tracking-widest transition-all outline-none
                        ${cnjValid === false ? 'border-red-500 focus:ring-1 focus:ring-red-500' : 
                          cnjValid === true ? 'border-green-500 focus:ring-1 focus:ring-green-500' : 'border-white/10 focus:border-[#D4AF37]/50 focus:ring-1 focus:ring-[#D4AF37]/20'}`}
                    />
                  </div>
                  {cnjValid === false && <p className="text-xs text-red-500 mt-1">O número de processo CNJ informado é inválido. Verifique a digitação.</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Titular (Reclamante)</label>
                  <input type="text" value={formData.reclamante} onChange={e => setFormData({...formData, reclamante: e.target.value})} placeholder="Nome completo do reclamante..." className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-sm text-white focus:border-[#D4AF37]/50 outline-none transition-all" />
                </div>
                
                <div className="space-y-2">
                  <label className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Função / Cargo</label>
                  <input type="text" value={formData.funcao} onChange={e => setFormData({...formData, funcao: e.target.value})} placeholder="Ex: Motorista, Cobrador..." className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-sm text-white focus:border-[#D4AF37]/50 outline-none transition-all" />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Sessão de Abertura</label>
                  <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-sm text-white focus:border-[#D4AF37]/50 outline-none transition-all appearance-none cursor-pointer">
                    <option value="" disabled>Selecione a fase atual...</option>
                    <option>Audiência Inicial</option>
                    <option>Audiência UNA</option>
                    <option>Audiência de Instrução</option>
                    <option>Audiência de Conciliação</option>
                    <option>Aguardando Audiência</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Réu Principal</label>
                  <select value={formData.reu} onChange={e => setFormData({...formData, reu: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-sm text-white focus:border-[#D4AF37]/50 outline-none transition-all appearance-none cursor-pointer">
                    <option value="" disabled>Selecione a empresa reclamada...</option>
                    <option>Taipastur Transportes Turísticos LTDA</option>
                    <option>Alitur Aliança de Turismo Ltda</option>
                    <option>Piccolotur Transportes Turisticos Ltda</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Polo Passivo (Co-reclamadas)</label>
                  <input type="text" value={formData.poloPassivo} onChange={e => setFormData({...formData, poloPassivo: e.target.value})} placeholder="Empresas adicionais se houver..." className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-sm text-white focus:border-[#D4AF37]/50 outline-none transition-all" />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Vara do Trabalho</label>
                  <input type="text" value={formData.vara} onChange={e => setFormData({...formData, vara: e.target.value})} placeholder="Ex: 5ª Vara de Campinas" className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-sm text-white focus:border-[#D4AF37]/50 outline-none transition-all" />
                </div>
                
                <div className="space-y-2">
                  <label className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Comarca</label>
                  <input type="text" value={formData.comarca} onChange={e => setFormData({...formData, comarca: e.target.value})} placeholder="Ex: Campinas, São Paulo..." className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-sm text-white focus:border-[#D4AF37]/50 outline-none transition-all" />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Data da Distribuição</label>
                  <input type="date" value={formData.dataDist} onChange={e => setFormData({...formData, dataDist: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-sm text-white focus:border-[#D4AF37]/50 outline-none transition-all [color-scheme:dark]" />
                </div>

                <div className="col-span-1 md:col-span-2 space-y-2">
                  <label className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Unidade de Operação</label>
                  <select value={formData.unidade} onChange={e => setFormData({...formData, unidade: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-sm text-white focus:border-[#D4AF37]/50 outline-none transition-all appearance-none cursor-pointer">
                    <option value="">Todas as Bases (Geral)...</option>
                    <option>São Paulo</option><option>Guarulhos</option><option>Jundiaí</option>
                    <option>Jandira</option><option>Araçatuba</option><option>Andradina</option>
                    <option>Louveira</option><option>Várzea Paulista</option><option>Dracena</option>
                    <option>Presidente Prudente</option><option>Ponta Grossa</option><option>Cubatão</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: SESSÃO */}
          {currentStep === 2 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              <h3 className="font-cinzel text-lg text-[#D4AF37] mb-8 border-l-4 border-[#D4AF37] pl-3 flex items-center gap-3">Cronograma de Audiência</h3>
              
              <div className={`grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 transition-all duration-500 ${isAguardando ? 'opacity-30 pointer-events-none' : ''}`}>
                <div className="space-y-2">
                  <label className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Data Designada</label>
                  <input type="date" value={formData.agenda} onChange={e => setFormData({...formData, agenda: e.target.value})} disabled={isAguardando} className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-sm text-white focus:border-[#D4AF37]/50 outline-none transition-all [color-scheme:dark]" />
                </div>
                
                <div className="space-y-2">
                  <label className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Horário</label>
                  <input type="time" value={formData.horas} onChange={e => setFormData({...formData, horas: e.target.value})} disabled={isAguardando} className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-sm text-white focus:border-[#D4AF37]/50 outline-none transition-all [color-scheme:dark]" />
                </div>

                <div className="col-span-1 md:col-span-2 space-y-2">
                  <label className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Modelo de Realização</label>
                  <select value={formData.modelo} onChange={e => setFormData({...formData, modelo: e.target.value})} disabled={isAguardando} className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-sm text-white focus:border-[#D4AF37]/50 outline-none transition-all appearance-none cursor-pointer">
                    <option>Presencial</option>
                    <option>Semipresencial</option>
                    <option>Virtual</option>
                  </select>
                </div>
              </div>
              {isAguardando && <div className="mt-6 p-4 bg-orange-500/10 border border-orange-500/30 rounded-xl flex items-center gap-3 text-orange-500 text-xs font-bold uppercase tracking-widest"><AlertCircle size={16}/> Cronograma desabilitado (Status: Aguardando Audiência)</div>}
            </div>
          )}

          {/* STEP 3: VÍNCULO */}
          {currentStep === 3 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              <h3 className="font-cinzel text-lg text-[#D4AF37] mb-8 border-l-4 border-[#D4AF37] pl-3 flex items-center gap-3">Análise de Vínculo</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Data de Admissão</label>
                  <input type="date" value={formData.admissao} onChange={e => setFormData({...formData, admissao: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-sm text-white focus:border-[#D4AF37]/50 outline-none transition-all [color-scheme:dark]" />
                </div>
                
                <div className="space-y-2">
                  <label className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Data de Demissão</label>
                  <input type="date" value={formData.demissao} onChange={e => setFormData({...formData, demissao: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-sm text-white focus:border-[#D4AF37]/50 outline-none transition-all [color-scheme:dark]" />
                </div>

                <div className="col-span-1 md:col-span-2 space-y-2">
                  <label className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Motivo do Desligamento (Rescisão)</label>
                  <select value={formData.motivo} onChange={e => setFormData({...formData, motivo: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-sm text-white focus:border-[#D4AF37]/50 outline-none transition-all appearance-none cursor-pointer">
                    <option value="" disabled>Selecione a modalidade da rescisão...</option>
                    <option>S/ JC Empregador</option><option>P/ JC Empregador</option>
                    <option>S/ JC Empregado</option><option>P/ JC Empregado</option>
                    <option>Ativo</option><option>Afastado</option>
                    <option>Termino de contrato de experiência</option>
                    <option>Acordo entre as partes</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: PLEITOS */}
          {currentStep === 4 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              <h3 className="font-cinzel text-lg text-[#D4AF37] mb-8 border-l-4 border-[#D4AF37] pl-3 flex items-center gap-3">Objeto do Litígio</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 mb-8">
                <div className="space-y-2">
                  <label className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Valor da Causa (Provisão da Ação)</label>
                  <input 
                    type="text" 
                    value={formData.valorAcao}
                    onChange={e => setFormData({...formData, valorAcao: maskMoney(e.target.value)})}
                    placeholder="R$ 0,00" 
                    className="w-full bg-black/50 border border-white/10 rounded-xl p-4 font-mono text-lg text-[#D4AF37] font-bold focus:border-[#D4AF37]/50 outline-none transition-all" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Patrono Adverso (Advogado da Parte)</label>
                  <input type="text" value={formData.advogado} onChange={e => setFormData({...formData, advogado: e.target.value})} placeholder="Nome do escritório ou advogado..." className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-sm text-white focus:border-[#D4AF37]/50 outline-none transition-all" />
                </div>
              </div>

              {/* DANO MORAL CONDICIONAL */}
              <div className="grid grid-cols-1 md:grid-cols-[1fr_1.5fr_1.5fr] gap-6 mb-8 items-start">
                <div className="space-y-2">
                  <label className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Dano Moral (Pedido?)</label>
                  <select value={formData.danoMoral} onChange={e => setFormData({...formData, danoMoral: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-sm text-white focus:border-[#D4AF37]/50 outline-none transition-all appearance-none cursor-pointer">
                    <option value="NÃO">Não</option>
                    <option value="SIM">Sim</option>
                  </select>
                </div>
                
                {formData.danoMoral === 'SIM' && (
                  <>
                    <div className="space-y-2 animate-in slide-in-from-top-4 fade-in duration-300">
                      <label className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Valor Pleiteado a Título de D.M.</label>
                      <input type="text" value={formData.valorDm} onChange={e => setFormData({...formData, valorDm: maskMoney(e.target.value)})} placeholder="R$ 0,00" className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-sm font-mono text-[#D4AF37] focus:border-[#D4AF37]/50 outline-none transition-all" />
                    </div>
                    <div className="space-y-2 animate-in slide-in-from-top-4 fade-in duration-300 delay-75">
                      <label className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Fundamento / Razão do D.M.</label>
                      <input type="text" value={formData.razaoDm} onChange={e => setFormData({...formData, razaoDm: e.target.value})} placeholder="Ex: Assédio, Atraso Salarial..." className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-sm text-white focus:border-[#D4AF37]/50 outline-none transition-all" />
                    </div>
                  </>
                )}
              </div>

              {/* PERÍCIA CONDICIONAL */}
              <div className="grid grid-cols-1 md:grid-cols-[1fr_3fr] gap-6 mb-8 items-start">
                <div className="space-y-2">
                  <label className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Perícia (Requerida?)</label>
                  <select value={formData.pericia} onChange={e => setFormData({...formData, pericia: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-sm text-white focus:border-[#D4AF37]/50 outline-none transition-all appearance-none cursor-pointer">
                    <option value="NÃO">Não</option>
                    <option value="SIM">Sim</option>
                  </select>
                </div>
                {formData.pericia === 'SIM' && (
                  <div className="space-y-2 animate-in slide-in-from-top-4 fade-in duration-300">
                    <label className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Tipo / Objeto da Perícia</label>
                    <input type="text" value={formData.tipoPericia} onChange={e => setFormData({...formData, tipoPericia: e.target.value})} placeholder="Ex: Médica, Insalubridade, Periculosidade..." className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-sm text-white focus:border-[#D4AF37]/50 outline-none transition-all" />
                  </div>
                )}
              </div>

              <div className="space-y-2 mb-6">
                <label className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Resumo dos Pleitos / Observações Adicionais (Coluna AN)</label>
                <textarea 
                  value={formData.pedidos}
                  onChange={e => setFormData({...formData, pedidos: e.target.value})}
                  onKeyDown={handleKeyDownPedidos}
                  rows={5} 
                  placeholder="1. Horas Extras&#10;2. Verbas Rescisórias&#10;Detalhe os principais pleitos aqui..." 
                  className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-sm text-white focus:border-[#D4AF37]/50 outline-none transition-all leading-relaxed" 
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Comentários / Avaliação Extra (Coluna AM)</label>
                <textarea 
                  value={formData.comentarios}
                  onChange={e => setFormData({...formData, comentarios: e.target.value})}
                  rows={2} 
                  placeholder="Informações de contorno da ação..." 
                  className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-sm text-white focus:border-[#D4AF37]/50 outline-none transition-all leading-relaxed" 
                />
              </div>
            </div>
          )}

          {/* STEP 5: CONCLUSÃO */}
          {currentStep === 5 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              <h3 className="font-cinzel text-lg text-[#D4AF37] mb-8 border-l-4 border-[#D4AF37] pl-3 flex items-center gap-3">Conclusão e Sincronização</h3>
              
              <div className="bg-black/60 p-6 rounded-xl border border-white/10 mb-8 max-h-[300px] overflow-y-auto custom-scrollbar">
                <h4 className="text-[#D4AF37] font-bold text-xs uppercase tracking-widest mb-4">Resumo do Cadastro</h4>
                <div className="space-y-3 text-sm text-gray-300">
                  <p><strong className="text-gray-500">CNJ:</strong> {formData.processo}</p>
                  <p><strong className="text-gray-500">Reclamante:</strong> {formData.reclamante}</p>
                  <p><strong className="text-gray-500">Réu:</strong> {formData.reu}</p>
                  <p><strong className="text-gray-500">Valor da Ação:</strong> {formData.valorAcao}</p>
                  {!isAguardando && formData.agenda && <p><strong className="text-gray-500">Audiência:</strong> {formData.agenda} às {formData.horas} ({formData.modelo})</p>}
                  {formData.danoMoral === "SIM" && <p><strong className="text-gray-500">Dano Moral:</strong> {formData.valorDm} ({formData.razaoDm})</p>}
                </div>
              </div>

              <div className="space-y-4">
                <label className="flex items-center gap-4 p-5 rounded-xl border cursor-pointer transition-all bg-gradient-to-br from-black/40 to-black/80 border-white/10 hover:border-[#D4AF37]/50 group shadow-lg">
                  <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${formData.confirmarAgenda ? 'bg-[#D4AF37] border-[#D4AF37]' : 'border-white/20 bg-black'}`}>
                     {formData.confirmarAgenda && <Check size={12} className="text-black font-bold"/>}
                  </div>
                  <input type="checkbox" className="hidden" checked={formData.confirmarAgenda} onChange={e => setFormData({...formData, confirmarAgenda: e.target.checked})} />
                  <span className="text-xs font-medium text-gray-300 group-hover:text-white transition-colors flex-1">Sincronizar designação automaticamente com o Google Calendar corporativo (Jurídico Piccolotur)</span>
                  <Calendar className="text-[#D4AF37]/50 group-hover:text-[#D4AF37] transition-colors" size={20} />
                </label>

                <label className="flex items-center gap-4 p-5 rounded-xl border cursor-pointer transition-all bg-gradient-to-br from-black/40 to-black/80 border-white/10 hover:border-[#D4AF37]/50 group shadow-lg">
                  <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${formData.addFarol ? 'bg-[#D4AF37] border-[#D4AF37]' : 'border-white/20 bg-black'}`}>
                     {formData.addFarol && <Check size={12} className="text-black font-bold"/>}
                  </div>
                  <input type="checkbox" className="hidden" checked={formData.addFarol} onChange={e => setFormData({...formData, addFarol: e.target.checked})} />
                  <span className="text-xs font-medium text-gray-300 group-hover:text-white transition-colors flex-1">Lançar no 'Farol de Pendências' para abertura do ciclo de solicitação de documentos e subsídios</span>
                  <Eye className="text-[#D4AF37]/50 group-hover:text-[#D4AF37] transition-colors" size={20} />
                </label>
              </div>
            </div>
          )}

          {/* Navegação Global do Wizard */}
          <div className="flex justify-between items-center mt-12 pt-8 border-t border-white/10">
            {currentStep > 1 ? (
              <button onClick={prevStep} className="flex items-center gap-2 px-6 py-3 border border-white/20 text-gray-400 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-white/5 hover:text-white transition-all">
                <ArrowLeft size={16} /> Voltar
              </button>
            ) : <div />}
            
            {currentStep < 5 ? (
              <button 
                onClick={nextStep} 
                className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-[#D4AF37] to-[#B8860B] text-black rounded-xl text-xs font-cinzel font-bold uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-[#D4AF37]/20 disabled:opacity-50"
              >
                Próximo Passo <ArrowRight size={16} />
              </button>
            ) : (
              <button 
                onClick={() => alert('Dados capturados perfeitamente via Client Side (Paridade Fase 12).')}
                className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-black rounded-xl text-xs font-cinzel font-bold uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-green-500/20"
              >
                <CheckCircle size={18} /> Registrar no Portal
              </button>
            )}
          </div>

        </div>
      </form>
    </div>
  );
}
