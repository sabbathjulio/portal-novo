import { Menu, Search, Bell } from 'lucide-react';

export default function Header({ toggleSidebar, isSidebarOpen }) {
  return (
    <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 px-4 sm:gap-x-6 sm:px-6 lg:px-8 transition-colors">
      <button
        type="button"
        className="-m-2.5 p-2.5 text-slate-700 hover:text-rose-800 dark:text-zinc-400 dark:hover:text-rose-700 transition-colors"
        onClick={toggleSidebar}
      >
        <span className="sr-only">Abrir menu lateral</span>
        <Menu className="h-6 w-6" aria-hidden="true" />
      </button>

      {/* Separator */}
      <div className="h-6 w-px bg-slate-200 dark:bg-zinc-800" aria-hidden="true" />

      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
        <form className="relative flex flex-1" action="#" method="GET">
          <label htmlFor="search-field" className="sr-only">
            Busca Estratégica
          </label>
          <Search
            className="pointer-events-none absolute inset-y-0 left-0 h-full w-5 text-slate-400 dark:text-zinc-500"
            aria-hidden="true"
          />
          <input
            id="search-field"
            className="block h-full w-full border-0 py-0 pl-8 pr-0 text-slate-900 bg-transparent placeholder:text-slate-400 focus:ring-0 sm:text-sm dark:text-zinc-100 dark:placeholder:text-zinc-500"
            placeholder="Buscar processo, reclamante ou decisão..."
            type="search"
            name="search"
          />
        </form>
        <div className="flex items-center gap-x-4 lg:gap-x-6">
          <button type="button" className="-m-2.5 p-2.5 text-slate-400 hover:text-slate-500 dark:text-zinc-500 dark:hover:text-zinc-400 transition-colors">
            <span className="sr-only">Visualizar notificações</span>
            <Bell className="h-6 w-6" aria-hidden="true" />
          </button>

          {/* Separator */}
          <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-slate-200 dark:lg:bg-zinc-800" aria-hidden="true" />

          {/* Profile Dropdown placeholder */}
          <div className="hidden lg:flex lg:items-center">
             <div className="flex items-center gap-x-3 cursor-pointer p-1 rounded-md hover:bg-slate-100 dark:hover:bg-zinc-900 transition-colors">
                <div className="w-8 h-8 rounded bg-rose-800 dark:bg-rose-700 flex items-center justify-center text-white font-bold text-xs uppercase">
                  JD
                </div>
                <span className="text-sm font-medium leading-6 text-slate-900 dark:text-zinc-100">User Admin</span>
             </div>
          </div>
        </div>
      </div>
    </header>
  );
}
