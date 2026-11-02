import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { 
  Bell, Search, ChevronDown, Settings, LogOut,
  Menu, LayoutDashboard, FileText, Plus, Users, Mail,
  Receipt, FileSpreadsheet, Truck, ClipboardCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import CollapsibleSidebar from './CollapsibleSidebar';
import Logo from '../templates/Logo';
import PWAInstallPrompt from '../common/PWAInstallPrompt';

const DashboardLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [quickCreateOpen, setQuickCreateOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isNavActive = (path) => {
    if (path === '/dashboard') return location.pathname === '/dashboard';
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <div className="flex h-screen bg-[#F8FAFC] dark:bg-slate-950 font-sans overflow-hidden antialiased text-slate-800 dark:text-slate-100">
      {/* Collapsible Sidebar (Desktop persistent + Mobile slide-out drawer) */}
      <CollapsibleSidebar 
        mobileOpen={mobileDrawerOpen} 
        onCloseMobile={() => setMobileDrawerOpen(false)} 
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Apple-styled Top Navigation Bar */}
        <header className="h-14 sm:h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/70 dark:border-slate-800 sticky top-0 z-30 flex items-center justify-between px-3.5 sm:px-6 transition-all">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            {/* Mobile Hamburger Button */}
            <button
              onClick={() => {
                setMobileDrawerOpen(true);
                setQuickCreateOpen(false);
              }}
              className="p-2 -ml-1 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white active:scale-95 transition-all rounded-xl md:hidden touch-manipulation"
              aria-label="Open menu"
            >
              <Menu size={22} strokeWidth={2.2} />
            </button>

            {/* Mobile Logo Branding */}
            <div className="md:hidden flex items-center">
              <Logo asLink={true} className="scale-[0.75] origin-left" />
            </div>

            {/* Desktop Apple-style Search Bar */}
            <div className="relative hidden md:block w-72 lg:w-96">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Search documents, clients, quotes..."
                className="w-full pl-9 pr-4 py-2 bg-slate-100/80 hover:bg-slate-100 focus:bg-white dark:bg-slate-800/80 dark:hover:bg-slate-800 dark:focus:bg-slate-800 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 rounded-xl border border-transparent focus:border-slate-300 dark:focus:border-slate-700 focus:ring-4 focus:ring-orange-500/10 outline-none transition-all duration-200"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Quick Action Button - Desktop */}
            <Link
              to="/documents/new"
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl text-xs font-semibold shadow-xs shadow-orange-500/20 hover:shadow-md hover:from-orange-600 hover:to-orange-700 active:scale-95 transition-all"
            >
              <Plus size={15} strokeWidth={2.5} />
              <span>New Document</span>
            </Link>

            {/* Notifications */}
            <button 
              className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors relative touch-manipulation"
              aria-label="Notifications"
            >
              <Bell size={19} strokeWidth={2} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-orange-500 rounded-full ring-2 ring-white dark:ring-slate-900"></span>
            </button>

            {/* User Profile Pill / Menu */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 p-1 sm:px-2.5 sm:py-1.5 rounded-full sm:rounded-xl hover:bg-slate-100/80 dark:hover:bg-slate-800/80 active:scale-98 transition-all"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-orange-600 to-orange-500 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                  {user?.name?.charAt(0) || user?.firstName?.charAt(0) || 'U'}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 leading-tight truncate max-w-[100px]">
                    {user?.name || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'User'}
                  </p>
                  <p className="text-[10px] text-slate-400 font-medium capitalize">{user?.role || 'Staff'}</p>
                </div>
                <ChevronDown size={14} className="text-slate-400 hidden sm:block" />
              </button>

              {/* User Dropdown */}
              {userMenuOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setUserMenuOpen(false)} 
                  />
                  <div className="absolute right-0 top-full mt-2 w-56 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800">
                      <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                        {user?.name || `${user?.firstName || ''} ${user?.lastName || ''}`.trim()}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{user?.email}</p>
                    </div>
                    <Link
                      to="/settings"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      <Settings size={15} /> Settings & Profile
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors text-left"
                    >
                      <LogOut size={15} /> Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Scrollable Page Content Area with Apple padding & Safe-areas */}
        <main className="flex-1 overflow-y-auto px-3.5 sm:px-6 lg:px-8 py-4 sm:py-6 pb-28 md:pb-8">
          <Outlet />
        </main>

        {/* Mobile Quick Create Floating Modal */}
        {quickCreateOpen && (
          <>
            <div 
              className="md:hidden fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-40 animate-in fade-in duration-200"
              onClick={() => setQuickCreateOpen(false)}
            />
            <div className="md:hidden fixed inset-x-3 bottom-20 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-3xl p-4 shadow-2xl border border-slate-200/80 dark:border-slate-800 animate-in slide-in-from-bottom-5 duration-200">
              <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Quick Create Document</span>
                <button 
                  onClick={() => setQuickCreateOpen(false)}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                >
                  Close
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <Link
                  to="/finance?type=job_card"
                  onClick={() => setQuickCreateOpen(false)}
                  className="flex items-center gap-3 p-3 rounded-2xl bg-white dark:bg-slate-800/80 text-slate-800 dark:text-slate-100 font-medium text-xs active:scale-95 transition-all shadow-xs border border-slate-200/80 dark:border-slate-700/80 hover:border-purple-300"
                >
                  <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center flex-shrink-0 border border-purple-100 dark:border-purple-900/50">
                    <ClipboardCheck size={18} strokeWidth={2.4} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold leading-tight truncate">Job Card</p>
                    <p className="text-[10px] text-slate-400 truncate">Service & sign</p>
                  </div>
                </Link>

                <Link
                  to="/finance?type=invoice"
                  onClick={() => setQuickCreateOpen(false)}
                  className="flex items-center gap-3 p-3 rounded-2xl bg-white dark:bg-slate-800/80 text-slate-800 dark:text-slate-100 font-medium text-xs active:scale-95 transition-all shadow-xs border border-slate-200/80 dark:border-slate-700/80 hover:border-orange-300"
                >
                  <div className="w-9 h-9 rounded-xl bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 flex items-center justify-center flex-shrink-0 border border-orange-100 dark:border-orange-900/50">
                    <Receipt size={18} strokeWidth={2.4} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold leading-tight truncate">Invoice</p>
                    <p className="text-[10px] text-slate-400 truncate">Bill client</p>
                  </div>
                </Link>

                <Link
                  to="/finance?type=delivery_note"
                  onClick={() => setQuickCreateOpen(false)}
                  className="flex items-center gap-3 p-3 rounded-2xl bg-white dark:bg-slate-800/80 text-slate-800 dark:text-slate-100 font-medium text-xs active:scale-95 transition-all shadow-xs border border-slate-200/80 dark:border-slate-700/80 hover:border-emerald-300"
                >
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0 border border-emerald-100 dark:border-emerald-900/50">
                    <Truck size={18} strokeWidth={2.4} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold leading-tight truncate">Delivery Note</p>
                    <p className="text-[10px] text-slate-400 truncate">Goods dispatch</p>
                  </div>
                </Link>

                <Link
                  to="/finance?type=quotation"
                  onClick={() => setQuickCreateOpen(false)}
                  className="flex items-center gap-3 p-3 rounded-2xl bg-white dark:bg-slate-800/80 text-slate-800 dark:text-slate-100 font-medium text-xs active:scale-95 transition-all shadow-xs border border-slate-200/80 dark:border-slate-700/80 hover:border-blue-300"
                >
                  <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0 border border-blue-100 dark:border-blue-900/50">
                    <FileSpreadsheet size={18} strokeWidth={2.4} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold leading-tight truncate">Quote</p>
                    <p className="text-[10px] text-slate-400 truncate">Cost proposal</p>
                  </div>
                </Link>
              </div>
            </div>
          </>
        )}

        {/* Apple-grade Mobile Bottom Floating Navigation Bar (Vibrant, high-contrast, tactile) */}
        <nav 
          className={`md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border-t border-slate-200/90 dark:border-slate-800 flex items-center justify-around px-2 py-1.5 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] dark:shadow-[0_-8px_30px_rgba(0,0,0,0.35)] select-none transition-opacity duration-200 ${
            mobileDrawerOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
          style={{ paddingBottom: 'max(10px, env(safe-area-inset-bottom))' }}
        >
          {/* 1. Home */}
          <Link 
            to="/dashboard" 
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-all touch-manipulation active:scale-90 ${
              isNavActive('/dashboard') 
                ? 'text-orange-600 dark:text-orange-400 font-bold' 
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium'
            }`}
          >
            <div className={`flex flex-col items-center transition-all ${
              isNavActive('/dashboard') 
                ? 'bg-gradient-to-r from-orange-500/15 to-amber-500/15 dark:from-orange-500/25 dark:to-amber-500/25 ring-1 ring-orange-500/30 px-3 py-1 rounded-2xl shadow-xs' 
                : 'px-2 py-1'
            }`}>
              <LayoutDashboard size={20} strokeWidth={isNavActive('/dashboard') ? 2.5 : 2.1} />
              <span className="text-[10px] mt-0.5 tracking-tight">Home</span>
            </div>
          </Link>

          {/* 2. Documents Hub */}
          <Link 
            to="/documents" 
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-all touch-manipulation active:scale-90 ${
              isNavActive('/documents') 
                ? 'text-orange-600 dark:text-orange-400 font-bold' 
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium'
            }`}
          >
            <div className={`flex flex-col items-center transition-all ${
              isNavActive('/documents') 
                ? 'bg-gradient-to-r from-orange-500/15 to-amber-500/15 dark:from-orange-500/25 dark:to-amber-500/25 ring-1 ring-orange-500/30 px-3 py-1 rounded-2xl shadow-xs' 
                : 'px-2 py-1'
            }`}>
              <FileText size={20} strokeWidth={isNavActive('/documents') ? 2.5 : 2.1} />
              <span className="text-[10px] mt-0.5 tracking-tight">Docs</span>
            </div>
          </Link>

          {/* 3. CENTER HERO ACTION: Primary Radiant Creation Button */}
          <div className="flex flex-col items-center justify-center flex-1 -mt-6">
            <button
              type="button"
              onClick={() => {
                setQuickCreateOpen(!quickCreateOpen);
                setMobileDrawerOpen(false);
              }}
              className="w-[52px] h-[52px] rounded-full bg-gradient-to-tr from-orange-500 via-amber-500 to-orange-600 text-white flex items-center justify-center shadow-lg shadow-orange-500/40 border-[3px] border-white dark:border-slate-900 active:scale-88 hover:shadow-orange-500/60 transition-all duration-200 touch-manipulation"
              aria-label="Create new document"
            >
              <Plus size={26} strokeWidth={2.8} className={`text-white transition-transform duration-200 drop-shadow-xs ${quickCreateOpen ? 'rotate-45' : ''}`} />
            </button>
            <span className="text-[10px] mt-0.5 font-bold text-orange-600 dark:text-orange-400 tracking-tight">Create</span>
          </div>

          {/* 4. Clients / CRM */}
          <Link 
            to="/clients" 
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-all touch-manipulation active:scale-90 ${
              isNavActive('/clients') 
                ? 'text-orange-600 dark:text-orange-400 font-bold' 
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium'
            }`}
          >
            <div className={`flex flex-col items-center transition-all ${
              isNavActive('/clients') 
                ? 'bg-gradient-to-r from-orange-500/15 to-amber-500/15 dark:from-orange-500/25 dark:to-amber-500/25 ring-1 ring-orange-500/30 px-3 py-1 rounded-2xl shadow-xs' 
                : 'px-2 py-1'
            }`}>
              <Users size={20} strokeWidth={isNavActive('/clients') ? 2.5 : 2.1} />
              <span className="text-[10px] mt-0.5 tracking-tight">Clients</span>
            </div>
          </Link>

          {/* 5. Menu / More Drawer */}
          <button 
            type="button"
            onClick={() => {
              setMobileDrawerOpen(true);
              setQuickCreateOpen(false);
            }}
            className="flex flex-col items-center justify-center flex-1 py-1 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all touch-manipulation active:scale-90"
          >
            <div className="flex flex-col items-center px-2 py-1">
              <Menu size={20} strokeWidth={2.1} />
              <span className="text-[10px] mt-0.5 tracking-tight font-medium">Menu</span>
            </div>
          </button>
        </nav>

        {/* PWA / Mobile Install Prompt */}
        <PWAInstallPrompt />
      </div>
    </div>
  );
};

export default DashboardLayout;
