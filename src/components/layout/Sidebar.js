import Link from 'next/link';
import { 
  LayoutDashboard, Calendar, FileText, CheckSquare, 
  Calculator, Mail, RefreshCw, Database, ChevronRight,
  TrendingUp, FilePlus2, LayoutGrid, DollarSign, FileEdit, X
} from 'lucide-react';

const SidebarItem = ({ icon: Icon, label, href }) => (
  <Link href={href} className="group flex items-center gap-3 px-3 py-2 border-l-4 border-transparent hover:border-stitch-burgundy dark:hover:border-stitch-secondary bg-transparent hover:bg-slate-200/50 dark:hover:bg-zinc-800 transition-all">
    <Icon className="w-5 h-5 text-slate-500 dark:text-zinc-500 group-hover:text-stitch-burgundy dark:group-hover:text-stitch-secondary transition-colors" />
    <span className="text-slate-600 dark:text-zinc-400 group-hover:text-slate-900 dark:group-hover:text-zinc-100 font-inter text-sm font-medium transition-colors">{label}</span>
  </Link>
);

const SidebarSection = ({ title, children }) => (
  <div className="mb-8">
    <h3 className="text-[10px] uppercase tracking-widest text-slate-400 dark:text-zinc-600 font-inter font-bold mb-3 px-4">
      {title}
    </h3>
    <div className="flex flex-col gap-0.5">
      {children}
    </div>
  </div>
);

export default function Sidebar({ setSidebarOpen }) {
  return (
    <aside className="h-full w-64 bg-stitch-sidebar dark:bg-[#151517] border-r border-slate-200 dark:border-zinc-800/80 p-5 flex flex-col transition-colors duration-300">
      <div className="mb-10 flex items-center justify-between px-3">
        <h1 className="font-newsreader text-2xl font-bold text-stitch-burgundy dark:text-stitch-secondary leading-tight">
          Bernardes<br />
          <span className="text-base text-slate-800 dark:text-zinc-300 opacity-90 italic font-normal">Corp.</span>
        </h1>
        {/* Botão de Fechar Mobile */}
        <button 
           className="md:hidden text-slate-400 dark:text-zinc-600 hover:text-stitch-burgundy dark:hover:text-stitch-secondary transition-colors"
           onClick={() => setSidebarOpen(false)}
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto no-scrollbar -mx-2">
        <SidebarSection title="Core">
          <SidebarItem icon={LayoutDashboard} label="Acervo Estratégico" href="/processos" />
          <SidebarItem icon={Calendar} label="Pauta Semanal" href="/pauta" />
          <SidebarItem icon={FileText} label="Recursos Jurídicos" href="/recursos" />
          <SidebarItem icon={TrendingUp} label="Acordos & Sentenças" href="/analytics" />
          <SidebarItem icon={LayoutGrid} label="Farol de Documentos" href="/farol" />
          <SidebarItem icon={FileEdit} label="Atualizar Portfólio" href="/atualizacao" />
        </SidebarSection>

        <SidebarSection title="Backoffice">
          <SidebarItem icon={FilePlus2} label="Cadastro Processual" href="/cadastro" />
          <SidebarItem icon={DollarSign} label="Tesouraria" href="/financeiro" />
          <SidebarItem icon={LayoutGrid} label="Notas Fiscais" href="/financeiro/notas" />
          <SidebarItem icon={CheckSquare} label="Fluxo de Tarefas" href="/tarefas" />
        </SidebarSection>

        <SidebarSection title="Ferramentas">
          <SidebarItem icon={Calculator} label="Cálculos Trabalhistas" href="/ferramentas/calculadora" />
          <SidebarItem icon={Mail} label="Gerador de Cartas" href="/ferramentas/cartas" />
        </SidebarSection>

        <SidebarSection title="Sistema">
          <SidebarItem icon={RefreshCw} label="Sincronizador" href="/admin/sincronizador" />
          <SidebarItem icon={Database} label="Supabase Bridge" href="/admin/supabase" />
        </SidebarSection>
      </nav>

      <div className="mt-auto pt-6 border-t border-slate-300/50 dark:border-zinc-800/80 px-2 transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded bg-gradient-to-br from-stitch-burgundy-dark to-stitch-burgundy dark:from-stitch-tertiary dark:to-[#002f38] flex items-center justify-center text-stitch-white dark:text-zinc-100 font-bold text-xs uppercase shadow-md shadow-stitch-burgundy/20 dark:shadow-none">
            JD
          </div>
          <div className="flex flex-col">
            <span className="text-slate-800 dark:text-zinc-200 text-sm font-semibold">User Admin</span>
            <span className="text-slate-500 dark:text-zinc-600 text-[10px] font-mono">Portal OS v3.0</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
