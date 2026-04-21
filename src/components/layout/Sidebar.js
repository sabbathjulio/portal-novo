import Link from 'next/link';
import { 
  LayoutDashboard, Calendar, FileText, CheckSquare, 
  Calculator, Mail, RefreshCw, Database, ChevronRight,
  TrendingUp, FilePlus2, LayoutGrid, DollarSign, FileEdit, X
} from 'lucide-react';

const SidebarItem = ({ icon: Icon, label, href }) => (
  <Link href={href} className="group flex items-center gap-3 px-3 py-2 rounded-md transition-all hover:bg-rose-900/20 border border-transparent hover:border-zinc-800">
    <Icon className="w-5 h-5 text-zinc-500 group-hover:text-rose-600 transition-colors" />
    <span className="text-zinc-400 group-hover:text-zinc-200 font-inter text-sm transition-colors">{label}</span>
    <ChevronRight className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100 text-rose-600 transition-all" />
  </Link>
);

const SidebarSection = ({ title, children }) => (
  <div className="mb-8">
    <h3 className="text-[10px] uppercase tracking-widest text-zinc-600 font-inter font-bold mb-4 px-3">
      {title}
    </h3>
    <div className="flex flex-col gap-1">
      {children}
    </div>
  </div>
);

export default function Sidebar({ setSidebarOpen }) {
  return (
    <aside className="h-full w-64 bg-zinc-950 border-r border-zinc-900 p-6 flex flex-col">
      <div className="mb-12 flex items-center justify-between px-3">
        <h1 className="font-cinzel text-xl font-bold text-zinc-200 leading-tight tracking-wider uppercase">
          Bernardes<br />
          <span className="text-sm opacity-80 text-rose-700">Corp.</span>
        </h1>
        {/* Botão de Fechar Mobile */}
        <button 
           className="md:hidden text-zinc-500 hover:text-rose-600 transition-colors"
           onClick={() => setSidebarOpen(false)}
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto no-scrollbar">
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

      <div className="mt-auto pt-6 border-t border-zinc-900 px-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-rose-800 flex items-center justify-center text-zinc-100 font-bold text-xs uppercase shadow-lg shadow-rose-900/20">
            JD
          </div>
          <div className="flex flex-col">
            <span className="text-zinc-200 text-xs font-semibold">User Admin</span>
            <span className="text-zinc-600 text-[10px] font-mono">Portal OS v2.0</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
