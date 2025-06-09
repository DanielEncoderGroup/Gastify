import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Bars3Icon } from '@heroicons/react/24/outline';
import Sidebar from './Sidebar';

const Layout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="h-screen flex overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Sidebar component for both mobile and desktop */}
      <Sidebar 
        sidebarOpen={sidebarOpen} 
        setSidebarOpen={setSidebarOpen} 
      />

      {/* Main content */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden md:ml-72">
        {/* Mobile menu button */}
        <div className="md:hidden pl-1 pt-1 sm:pl-3 sm:pt-3 sticky top-0 z-20 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
          <button
            type="button"
            className="h-12 w-12 inline-flex items-center justify-center rounded-xl text-gray-500 hover:text-gray-900 hover:bg-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
            onClick={() => setSidebarOpen(true)}
          >
            <span className="sr-only">Abrir sidebar</span>
            <Bars3Icon className="h-6 w-6" />
          </button>
        </div>

        {/* Main content area - Sin restricciones de ancho ni padding */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;