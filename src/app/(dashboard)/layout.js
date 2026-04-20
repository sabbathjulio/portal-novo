import Sidebar from '@/components/layout/Sidebar';

export default function DashboardLayout({ children }) {
  return (
    <div className="flex bg-[#0B1120] min-h-screen text-white">
      {/* Sidebar Fixa */}
      <Sidebar />

      {/* Área de Conteúdo Principal */}
      <main className="flex-1 ml-64 overflow-y-auto min-h-screen">
        {/* Camada de fundo sutil para dar profundidade */}
        <div className="fixed inset-0 glow-radial -z-10 opacity-30 pointer-events-none" />
        
        <div className="max-w-7xl mx-auto py-8 px-6">
          {children}
        </div>
      </main>
    </div>
  );
}
