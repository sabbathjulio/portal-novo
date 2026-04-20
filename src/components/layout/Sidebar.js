import Link from 'next/link';
import { 
  LayoutDashboard, 
  Calendar, 
  FileText, 
  FilePlus, 
  CheckSquare, 
  Calculator, 
  Mail, 
  RefreshCw, 
  Database,
  ChevronRight,
  TrendingUp,
  FilePlus2,
  LayoutGrid,
  DollarSign,
  FileEdit
} from 'lucide-react';

const SidebarItem = ({ icon: Icon, label, href }) => (
  <Link href={href} className="group flex items-center gap-3 px-3 py-2 rounded-md transition-all hover:bg-white/5 border border-transparent hover:border-gray-800">
    <Icon className="w-5 h-5 text-gray-500 group-hover:text-[#D4AF37] transition-colors" />
    <span className="text-gray-400 group-hover:text-white font-inter text-sm transition-colors">{label}</span>
    <ChevronRight className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100 text-[#D4AF37] transition-all" />
  </Link>
);

const SidebarSection = ({ title, children }) => (
  <div className="mb-8">
    <h3 className="text-[10px] uppercase tracking-widest text-[#D4AF37]/60 font-cinzel mb-4 px-3">
      {title}
    </h3>
    <div className="flex flex-col gap-1">
      {children}
    </div>
  </div>
);

export default function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-[#0B1120] border-r border-gray-800 p-6 flex flex-col z-50">
      <div className="mb-12 px-3">
        <h1 className="font-cinzel text-xl font-bold text-[#D4AF37] leading-tight tracking-wider uppercase">
          Bernardes<br />
          <span className="text-sm opacity-80">Corp.</span>
        </h1>
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
          <SidebarItem icon={FileEdit} label="Atualizar Portfólio" href="/atualizacao" />
          <SidebarItem icon={DollarSign} label="Tesouraria" href="/financeiro" />
          <SidebarItem icon={LayoutGrid} label="Notas Fiscais" href="/financeiro/notas" />
          <SidebarItem icon={CheckSquare} label="Tarefas Kanban" href="/tarefas" />
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

      <div className="mt-auto pt-6 border-t border-gray-800 px-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#D4AF37] to-[#B8860B] flex items-center justify-center text-black font-bold text-xs">
            JD
          </div>
          <div className="flex flex-col">
            <span className="text-white text-xs font-semibold">User Admin</span>
            <span className="text-gray-500 text-[10px]">Portal Jurídico v1.0</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
