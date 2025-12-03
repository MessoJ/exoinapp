import React, { useState } from 'react';
import { Outlet, useNavigate, Link } from 'react-router-dom';
import { 
  Bell, Search, ChevronDown, Settings, LogOut, Menu, X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import CollapsibleSidebar from './CollapsibleSidebar';
import { ThemeToggleCompact } from '../ui/ThemeToggle';

const DashboardLayout = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900 font-sans">
      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Collapsible Sidebar - Hidden on mobile by default */}
      <div className={`
        fixed inset-y-0 left-0 z-50 lg:relative lg:z-0
        transform transition-transform duration-300 ease-in-out
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <CollapsibleSidebar onCloseMobile={() => setMobileMenuOpen(false)} />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden w-full">
        {/* Top Header */}
        <header className="h-14 sm:h-16 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-3 sm:px-6">
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Mobile Menu Button */}
            <button 
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg lg:hidden"
            >
              <Menu size={20} className="text-slate-600 dark:text-slate-300" />
            </button>
            
            {/* Search - Hidden on mobile, shown on tablet+ */}
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Search documents, clients..."
                className="pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent w-48 md:w-72"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Mobile Search Button */}
            <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg sm:hidden">
              <Search size={20} className="text-slate-500 dark:text-slate-400" />
            </button>
            
            {/* Theme Toggle */}
            <ThemeToggleCompact />
            
            <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg relative">
              <Bell size={20} className="text-slate-500 dark:text-slate-400" />
              <span className="absolute top-1 right-1 h-2 w-2 bg-orange-500 rounded-full"></span>
            </button>
            
            <div className="relative">
              <button 
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg p-1.5 sm:p-2 transition-colors"
              >
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-semibold text-sm">
                  {user?.name?.charAt(0) || 'U'}
                </div>
                <div className="text-left hidden md:block">
                  <p className="text-sm font-medium text-slate-900 dark:text-white">{user?.name || 'User'}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{user?.role || 'Staff'}</p>
                </div>
                <ChevronDown size={16} className="text-slate-400 hidden sm:block" />
              </button>
              
              {userMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                  <div className="absolute right-0 top-full mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg py-2 w-48 z-50">
                    <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-700">
                      <p className="text-sm font-medium text-slate-900 dark:text-white">{user?.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user?.email}</p>
                    </div>
                    <Link 
                      to="/settings"
                      onClick={() => setUserMenuOpen(false)}
                      className="w-full flex items-center gap-2 px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 text-sm"
                    >
                      <Settings size={16} />
                      Settings
                    </Link>
                    <button 
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 text-sm"
                    >
                      <LogOut size={16} />
                      Logout
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
