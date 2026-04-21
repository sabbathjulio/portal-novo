import { Menu, Search, Bell } from 'lucide-react';

export default function Header({ toggleSidebar, isSidebarOpen }) {
  return (
    <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-slate-200 bg-stitch-bg px-4 sm:gap-x-6 sm:px-6 lg:px-8 transition-colors shadow-sm shadow-slate-200/50">
      <button
        type="button"
        className="-m-2.5 p-2.5 text-slate-700 hover:text-stitch-burgundy transition-colors"
        onClick={toggleSidebar}
      >
        <span className="sr-only">Abrir menu lateral</span>
        <Menu className="h-6 w-6" aria-hidden="true" />
      </button>

      {/* Separator */}
      <div className="h-6 w-px bg-slate-200" aria-hidden="true" />

      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
        <form className="relative flex flex-1 items-center" action="#" method="GET">
          <label htmlFor="search-field" className="sr-only">
            Busca Estratégica
          </label>
          <div className="relative w-full max-w-md">
            <Search
              className="pointer-events-none absolute inset-y-0 left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400"
              aria-hidden="true"
            />
            <input
              id="search-field"
              className="block w-full rounded-md border border-slate-200/60 bg-white/50 py-1.5 pl-10 pr-3 text-sm leading-6 text-slate-900 placeholder:text-slate-400 focus:border-stitch-burgundy focus:ring-0 focus:outline-none transition-colors"
              placeholder="Buscar processo, caso ou documento..."
              type="search"
              name="search"
            />
          </div>
        </form>
        <div className="flex items-center gap-x-4 lg:gap-x-6">
          <button type="button" className="-m-2.5 p-2.5 text-slate-400 hover:text-stitch-burgundy transition-colors">
            <span className="sr-only">Visualizar notificações</span>
            <Bell className="h-5 w-5" aria-hidden="true" />
          </button>

          {/* Separator */}
          <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-slate-200" aria-hidden="true" />

          {/* Profile Dropdown placeholder */}
          <div className="hidden lg:flex lg:items-center">
             <div className="flex items-center gap-x-3 cursor-pointer p-1.5 rounded-md hover:bg-slate-200/50 transition-colors">
                <div className="w-8 h-8 rounded bg-gradient-to-br from-stitch-burgundy-dark to-stitch-burgundy flex items-center justify-center text-stitch-white font-bold text-xs uppercase shadow-sm">
                  JD
                </div>
                <span className="text-sm font-semibold leading-6 text-slate-800">User Admin</span>
             </div>
          </div>
        </div>
      </div>
    </header>
  );
}
