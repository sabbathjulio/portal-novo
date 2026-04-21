"use client";

import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

export default function DashboardShell({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-zinc-950 transition-colors">
      
      {/* Sidebar - Fixa à esquerda na versão desktop. Toggleable. */}
      {/* Container visível ou invisível dependendo do estado */}
      <div 
        className={`fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:w-0'
        }`}
      >
         <div className={`h-full ${sidebarOpen ? 'w-64' : 'w-0'} overflow-hidden transition-all duration-300`}>
           <Sidebar isSidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
         </div>
      </div>

      {/* Background overlay para mobile ao abrir a sidebar */}
      {sidebarOpen && (
        <div 
           className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm md:hidden" 
           onClick={() => setSidebarOpen(false)} 
        />
      )}

      {/* Conteúdo Principal Flexível */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header 
          isSidebarOpen={sidebarOpen} 
          toggleSidebar={() => setSidebarOpen(!sidebarOpen)} 
        />

        <main className="flex-1 overflow-y-auto w-full">
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>

    </div>
  );
}
