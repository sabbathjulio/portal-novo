"use client";

import { useState, useCallback } from "react";
import * as XLSX from "xlsx";
import { createClient } from "@supabase/supabase-js";
import {
  UploadCloud,
  FileSpreadsheet,
  Loader2,
  CheckSquare,
  Square,
  CheckCircle2,
  ArrowRight,
  Info,
  RefreshCw,
} from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// ─── Dicionário obrigatório (motor invisível) ──────────────────────────────
const ALIAS_MAP = {
  "status":            { tabela: "audiencias", coluna: "tipo",        label: "Tipo de Audiência" },
  "tipo de audiência": { tabela: "audiencias", coluna: "tipo",        label: "Tipo de Audiência" },
  "tipo de audiencia": { tabela: "audiencias", coluna: "tipo",        label: "Tipo de Audiência" },
  "tipo":              { tabela: "audiencias", coluna: "tipo",        label: "Tipo de Audiência" },
  "status geral":      { tabela: "processos",  coluna: "status_geral", label: "Andamento" },
  "situação":          { tabela: "processos",  coluna: "status_geral", label: "Andamento" },
  "situacao":          { tabela: "processos",  coluna: "status_geral", label: "Andamento" },
  "modelo":            { tabela: "audiencias", coluna: "modelo",      label: "Formato" },
  "formato":           { tabela: "audiencias", coluna: "modelo",      label: "Formato" },
};

function resolveHeader(h) {
  const normalized = String(h).toLowerCase().trim()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return ALIAS_MAP[normalized] ?? null;
}

function formatCNJ(raw) {
  if (!raw || raw.length !== 20) return raw;
  return `${raw.slice(0,7)}-${raw.slice(7,9)}.${raw.slice(9,13)}.${raw.slice(13,14)}.${raw.slice(14,16)}.${raw.slice(16,20)}`;
}

const CHUNK = 150;

// ─── Estados da página ─────────────────────────────────────────────────────
const S = { UPLOAD: 1, SELECT_CNJ: 2, LOADING: 3, REVIEW: 4, DONE: 5 };

export default function AtualizacaoPage() {
  const [stage, setStage]     = useState(S.UPLOAD);
  const [fileData, setFileData] = useState(null);   // { headers, rows }
  const [cnj, setCnj]         = useState("");
  const [progress, setProgress] = useState(0);
  const [diffs, setDiffs]     = useState([]);
  const [result, setResult]   = useState(null);     // { ok, fail }
  const [isDragging, setIsDragging] = useState(false);

  // ── Leitura do arquivo ──
  const processFile = useCallback((file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target.result, { type: "binary", cellDates: true });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const raw = XLSX.utils.sheet_to_json(ws, { header: 1, raw: false, defval: "" });
        let hi = 0;
        for (let i = 0; i < raw.length; i++) {
          if (raw[i].filter(Boolean).length > 2) { hi = i; break; }
        }
        const headers = raw[hi].map((h) => String(h).trim()).filter(Boolean);
        const rows = raw.slice(hi + 1)
          .filter((r) => r.some(Boolean))
          .map((r) => Object.fromEntries(headers.map((h, i) => [h, r[i] ?? ""])));
        setFileData({ headers, rows });
        setStage(S.SELECT_CNJ);
      } catch {
        alert("Não foi possível ler o arquivo. Verifique se é um Excel ou CSV.");
      }
    };
    reader.readAsBinaryString(file);
  }, []);

  const onFilePick = (e) => processFile(e.target.files[0]);
  const onDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    processFile(e.dataTransfer.files[0]);
  };

  // ── Motor de comparação silencioso ──
  const processar = async () => {
    if (!cnj) return;
    setStage(S.LOADING);
    setProgress(0);

    try {
      // 1. Mapear colunas com o dicionário (ignorar as que não aparecem nele)
      const mapped = fileData.headers
        .filter((h) => h !== cnj && resolveHeader(h))
        .map((h) => ({ planHeader: h, ...resolveHeader(h) }));

      // 2. Sanitizar CNJs
      const cnjsValidos = [];
      const rowByCnj = {};
      for (const row of fileData.rows) {
        const limpo = String(row[cnj] ?? "").replace(/\D/g, "");
        if (limpo.length === 20) {
          cnjsValidos.push(limpo);
          rowByCnj[limpo] = row;
        }
      }
      const cnjsUnicos = [...new Set(cnjsValidos)];

      if (cnjsUnicos.length === 0) {
        alert("Nenhum CNJ válido de 20 dígitos encontrado nessa coluna.");
        setStage(S.SELECT_CNJ);
        return;
      }

      // 3. Buscar dados no Supabase por tabela
      const tabelas = [...new Set(mapped.map((m) => m.tabela))];
      const dbMemory = {};
      let fetched = 0;
      for (const tabela of tabelas) {
        dbMemory[tabela] = {};
        for (let i = 0; i < cnjsUnicos.length; i += CHUNK) {
          const chunk = cnjsUnicos.slice(i, i + CHUNK);
          const { data } = await supabase.from(tabela).select("*").in("numero_cnj", chunk);
          (data ?? []).forEach((row) => { dbMemory[tabela][row.numero_cnj] = row; });
          fetched += chunk.length;
          setProgress(Math.round((fetched / (cnjsUnicos.length * tabelas.length)) * 80));
        }
      }

      // 4. Gerar diffs
      const foundDiffs = [];
      let id = 0;
      for (const cnj20 of cnjsUnicos) {
        const planRow = rowByCnj[cnj20];
        for (const col of mapped) {
          const dbRow = dbMemory[col.tabela]?.[cnj20];
          if (!dbRow) continue;
          const valBanco = String(dbRow[col.coluna] ?? "").trim();
          const valPlan  = String(planRow[col.planHeader] ?? "").trim();
          if (!valPlan || valPlan.toLowerCase() === "null") continue;
          if (valBanco.toLowerCase() === valPlan.toLowerCase()) continue;
          foundDiffs.push({
            id: id++, cnj: cnj20, tabela: col.tabela,
            coluna: col.coluna, label: col.label,
            antigo: valBanco || "—", novo: valPlan, checked: true,
          });
        }
      }

      setProgress(100);
      setTimeout(() => {
        setDiffs(foundDiffs);
        setStage(foundDiffs.length > 0 ? S.REVIEW : S.DONE);
        if (foundDiffs.length === 0) setResult({ ok: 0, fail: [] });
      }, 400);
    } catch (err) {
      alert("Erro ao processar: " + err.message);
      setStage(S.SELECT_CNJ);
    }
  };

  // ── Toggle checkboxes ──
  const toggle = (id) => setDiffs((d) => d.map((x) => x.id === id ? { ...x, checked: !x.checked } : x));
  const toggleAll = () => {
    const allOn = diffs.every((d) => d.checked);
    setDiffs((d) => d.map((x) => ({ ...x, checked: !allOn })));
  };

  // ── Confirmar atualização ──
  const confirmar = async () => {
    const selecionados = diffs.filter((d) => d.checked);
    if (!selecionados.length) return;
    setStage(S.LOADING);
    setProgress(0);

    const payloads = {};
    for (const d of selecionados) {
      if (!payloads[d.tabela]) payloads[d.tabela] = {};
      if (!payloads[d.tabela][d.cnj]) payloads[d.tabela][d.cnj] = {};
      payloads[d.tabela][d.cnj][d.coluna] = d.novo;
    }

    let ok = 0;
    const fail = [];
    const entries = Object.entries(payloads).flatMap(([tab, cnjMap]) =>
      Object.entries(cnjMap).map(([cnj, payload]) => ({ tab, cnj, payload }))
    );
    let done = 0;
    for (const e of entries) {
      try {
        const { error } = await supabase.from(e.tab).update(e.payload).eq("numero_cnj", e.cnj);
        if (error) throw error;
        ok++;
      } catch {
        fail.push(formatCNJ(e.cnj));
      }
      done++;
      setProgress(Math.round((done / entries.length) * 100));
    }
    setResult({ ok, fail });
    setStage(S.DONE);
  };

  const reiniciar = () => {
    setStage(S.UPLOAD); setFileData(null); setCnj("");
    setDiffs([]); setResult(null); setProgress(0);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-200 px-4 py-10">
      <div className="max-w-4xl mx-auto space-y-10">

        {/* Título */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white tracking-tight">Importar e Atualizar Processos</h1>
          <p className="mt-2 text-zinc-500 text-sm">Suba sua planilha e o sistema identificará automaticamente o que mudou.</p>
        </div>

        {/* ── ETAPA 1: UPLOAD ── */}
        {stage === S.UPLOAD && (
          <label
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={onDrop}
            className={`flex flex-col items-center justify-center gap-4 border-2 border-dashed rounded-3xl p-20 cursor-pointer transition-all
              ${isDragging
                ? "border-white/50 bg-white/5"
                : "border-white/10 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/20"
              }`}
          >
            <UploadCloud size={48} className="text-zinc-600" />
            <div className="text-center">
              <p className="font-semibold text-zinc-300">Arraste o arquivo aqui</p>
              <p className="text-xs text-zinc-600 mt-1 uppercase tracking-widest">.xlsx · .xls · .csv</p>
            </div>
            <input type="file" className="hidden" accept=".csv,.xls,.xlsx" onChange={onFilePick} />
          </label>
        )}

        {/* ── ETAPA 2: SELECIONAR CNJ ── */}
        {stage === S.SELECT_CNJ && fileData && (
          <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-8 space-y-8">
            {/* Info arquivo */}
            <div className="flex items-center gap-3">
              <FileSpreadsheet size={20} className="text-emerald-500 shrink-0" />
              <p className="text-sm text-zinc-300">
                <span className="font-semibold text-white">{fileData.rows.length} registros</span> carregados com sucesso.
              </p>
              <button onClick={reiniciar} className="ml-auto text-xs text-zinc-600 hover:text-zinc-300 transition-colors">
                Trocar arquivo
              </button>
            </div>

            {/* Pergunta única */}
            <div className="space-y-3">
              <h2 className="text-xl font-bold text-white">Qual destas colunas é o Número do Processo (CNJ)?</h2>
              <select
                value={cnj}
                onChange={(e) => setCnj(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3.5 text-zinc-200 text-base focus:outline-none focus:border-white/30 cursor-pointer"
              >
                <option value="" disabled>Selecione a coluna...</option>
                {fileData.headers.map((h) => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
            </div>

            <div className="flex justify-end">
              <button
                onClick={processar}
                disabled={!cnj}
                className="px-8 py-3.5 bg-white text-black font-bold text-sm rounded-xl disabled:opacity-30 hover:bg-zinc-100 transition-all"
              >
                Analisar Planilha
              </button>
            </div>
          </div>
        )}

        {/* ── ETAPA 3: LOADING ── */}
        {stage === S.LOADING && (
          <div className="flex flex-col items-center justify-center gap-6 py-24">
            <Loader2 size={40} className="animate-spin text-zinc-400" />
            <p className="text-zinc-400 font-medium">Comparando com o banco de dados...</p>
            <div className="w-64 h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-zinc-600 font-mono">{progress}%</p>
          </div>
        )}

        {/* ── ETAPA 4: REVISÃO ── */}
        {stage === S.REVIEW && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-white">Revisão de Atualizações</h2>
                <p className="text-zinc-500 text-sm mt-1">
                  {diffs.filter(d => d.checked).length} alteração(ões) selecionada(s) de {diffs.length} encontrada(s).
                </p>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={toggleAll}
                  className="text-xs text-zinc-500 hover:text-zinc-300 font-medium transition-colors"
                >
                  {diffs.every(d => d.checked) ? "Desmarcar tudo" : "Marcar tudo"}
                </button>
                <button
                  onClick={confirmar}
                  disabled={!diffs.some(d => d.checked)}
                  className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-30 text-white font-bold text-sm rounded-xl transition-all"
                >
                  Confirmar Atualizações ({diffs.filter(d => d.checked).length})
                </button>
              </div>
            </div>

            {/* Lista de diffs */}
            <div className="bg-white/[0.02] border border-white/10 rounded-2xl divide-y divide-white/5 overflow-hidden">
              {diffs.map((d) => (
                <div
                  key={d.id}
                  onClick={() => toggle(d.id)}
                  className={`flex items-center gap-4 px-5 py-4 cursor-pointer group transition-colors
                    ${d.checked ? "hover:bg-white/[0.03]" : "opacity-40 hover:opacity-60"}`}
                >
                  {/* Checkbox */}
                  <div className="shrink-0">
                    {d.checked
                      ? <CheckSquare size={20} className="text-emerald-500" />
                      : <Square size={20} className="text-zinc-600" />
                    }
                  </div>

                  {/* CNJ */}
                  <div className="w-48 shrink-0">
                    <p className="text-xs text-zinc-600 uppercase tracking-widest mb-0.5">Processo</p>
                    <p className="font-mono text-sm text-zinc-200 font-semibold">{formatCNJ(d.cnj)}</p>
                  </div>

                  {/* Label do campo */}
                  <div className="w-36 shrink-0">
                    <p className="text-xs text-zinc-600 uppercase tracking-widest mb-0.5">Campo</p>
                    <span className="text-xs font-bold text-zinc-400">{d.label}</span>
                  </div>

                  {/* Valor antigo → Novo */}
                  <div className="flex-1 flex items-center gap-3 min-w-0">
                    <div className="flex-1 bg-rose-950/30 border border-rose-900/40 rounded-lg px-3 py-2 min-w-0">
                      <p className="text-[10px] text-rose-500/80 uppercase tracking-widest mb-1">Estava</p>
                      <p className="text-sm text-rose-300 truncate">{d.antigo}</p>
                    </div>
                    <ArrowRight size={16} className="text-zinc-700 shrink-0" />
                    <div className="flex-1 bg-emerald-950/30 border border-emerald-900/40 rounded-lg px-3 py-2 min-w-0">
                      <p className="text-[10px] text-emerald-500/80 uppercase tracking-widest mb-1">Ficará</p>
                      <p className="text-sm text-emerald-300 font-semibold truncate">{d.novo}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── ETAPA 5: CONCLUÍDO ── */}
        {stage === S.DONE && result && (
          <div className="flex flex-col items-center gap-6 py-16 text-center">
            {result.ok > 0 || result.fail.length === 0
              ? <CheckCircle2 size={64} className="text-emerald-500" />
              : <Info size={64} className="text-zinc-600" />
            }

            {result.ok === 0 && result.fail.length === 0
              ? <>
                  <h2 className="text-2xl font-bold text-white">Nenhuma alteração encontrada</h2>
                  <p className="text-zinc-500">A planilha não possui dados diferentes do que já está registrado.</p>
                </>
              : <>
                  <h2 className="text-2xl font-bold text-white">Atualização Concluída</h2>
                  <p className="text-zinc-400">
                    <span className="text-white font-bold">{result.ok}</span> {result.ok === 1 ? "processo atualizado" : "processos atualizados"} com sucesso.
                  </p>
                </>
            }

            {result.fail.length > 0 && (
              <div className="bg-rose-950/20 border border-rose-900/30 rounded-xl p-4 text-left w-full max-w-sm">
                <p className="text-xs text-rose-500 uppercase tracking-widest font-bold mb-2">Não foi possível atualizar:</p>
                <ul className="text-sm text-rose-400 space-y-1">
                  {result.fail.map((cnj, i) => <li key={i} className="font-mono">{cnj}</li>)}
                </ul>
              </div>
            )}

            <div className="flex gap-4 mt-4">
              <button onClick={reiniciar} className="flex items-center gap-2 px-6 py-3 border border-white/10 rounded-xl text-zinc-400 hover:text-white hover:border-white/30 text-sm font-medium transition-all">
                <RefreshCw size={14} /> Nova Importação
              </button>
              <a href="/farol" className="px-6 py-3 bg-white text-black font-bold text-sm rounded-xl hover:bg-zinc-100 transition-all">
                Ver no Farol
              </a>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
