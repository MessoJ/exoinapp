import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, FileText, Mail, Settings, LogOut, Users,
  Receipt, ChevronDown, ChevronRight, Server, PenTool, Inbox,
  LayoutGrid, Plus, CreditCard, Monitor, Briefcase, Palette,
  Building, Shield, UserCog, Folders, FileSpreadsheet,
  ChevronLeft, Menu, Home, FolderOpen, Image, X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { mailApi } from '../../lib/api';
import Logo from '../templates/Logo';
import { ThemeDropdown } from '../ui/ThemeToggle';

// Sidebar Navigation Item with optional children
const NavItem = ({ to, icon: Icon, label, badge, children, isActive, collapsed, onNavigate }) => {
  const [expanded, setExpanded] = useState(false);
  const location = useLocation();
  
  const hasChildren = children && children.length > 0;
  const isCurrentActive = to && (location.pathname === to || location.pathname.startsWith(to + '/'));
  const hasActiveChild = hasChildren && children.some(child => 
    location.pathname === child.to || location.pathname.startsWith(child.to + '/')
  );

  useEffect(() => {
    if (hasActiveChild) setExpanded(true);
  }, [hasActiveChild]);

  const handleClick = () => {
    if (hasChildren) {
      setExpanded(!expanded);
    }
  };

  const handleChildClick = () => {
    if (onNavigate) onNavigate();
  };

  if (hasChildren) {
    return (
      <div>
        <button
          onClick={handleClick}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
            hasActiveChild 
              ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400' 
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
        >
          <Icon size={18} className="flex-shrink-0" />
          {!collapsed && (
            <>
              <span className="text-sm flex-1 text-left font-medium">{label}</span>
              <ChevronDown 
                size={16} 
                className={`text-slate-400 transition-transform ${expanded ? 'rotate-180' : ''}`} 
              />
            </>
          )}
        </button>
        
        {!collapsed && expanded && (
          <div className="ml-4 pl-3 border-l-2 border-slate-100 dark:border-slate-700 mt-1 space-y-0.5">
            {children.map((child, idx) => (
              <Link
                key={idx}
                to={child.to}
                onClick={handleChildClick}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                  location.pathname === child.to || location.pathname.startsWith(child.to + '/')
                    ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 font-medium'
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
              >
                {child.icon && <child.icon size={14} />}
                <span>{child.label}</span>
                {child.badge > 0 && (
                  <span className="ml-auto min-w-[18px] h-[18px] flex items-center justify-center px-1 text-[10px] font-bold bg-red-500 text-white rounded-full">
                    {child.badge > 99 ? '99+' : child.badge}
                  </span>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <Link
      to={to}
      onClick={onNavigate}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
        isCurrentActive 
          ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 font-medium' 
          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
      }`}
      title={collapsed ? label : undefined}
    >
      <Icon size={18} className="flex-shrink-0" />
      {!collapsed && (
        <>
          <span className="text-sm flex-1">{label}</span>
          {badge > 0 && (
            <span className="min-w-[20px] h-5 flex items-center justify-center px-1.5 text-xs font-bold bg-red-500 text-white rounded-full">
              {badge > 99 ? '99+' : badge}
            </span>
          )}
        </>
      )}
    </Link>
  );
};

// Section Header
const SectionHeader = ({ label, collapsed }) => {
  if (collapsed) return <div className="h-4" />;
  return (
    <div className="px-3 py-2 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
      {label}
    </div>
  );
};

const CollapsibleSidebar = ({ onCloseMobile }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch unread email count
  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const statusRes = await mailApi.getAccountStatus();
        if (statusRes.data.configured) {
          const foldersRes = await mailApi.getFolders();
          const inbox = foldersRes.data.folders?.find(f => f.name === 'INBOX');
          if (inbox) setUnreadCount(inbox.unread || 0);
        }
      } catch (err) {
        // Mail not configured
      }
    };
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleNavigate = () => {
    // Close mobile menu on navigation
    if (onCloseMobile) onCloseMobile();
  };

  const isAdmin = user?.role === 'ADMIN';
  const isManager = user?.role === 'MANAGER' || isAdmin;

  // Navigation structure
  const navigation = [
    {
      section: 'Main',
      items: [
        { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        ...(isAdmin ? [{ to: '/admin/dashboard', icon: Shield, label: 'Admin Dashboard' }] : []),
      ]
    },
    {
      section: 'Communication',
      items: [
        { 
          icon: Mail, 
          label: 'Email',
          children: [
            { to: '/mail', icon: Inbox, label: 'Inbox', badge: unreadCount },
            { to: '/mail?compose=true', icon: PenTool, label: 'Compose' },
            { to: '/email-hosting', icon: Server, label: 'Email Hosting' },
            { to: '/email-signature', icon: PenTool, label: 'Email Signatures' },
          ]
        },
      ]
    },
    {
      section: 'Documents',
      items: [
        {
          icon: FileText,
          label: 'Documents',
          children: [
            { to: '/documents', icon: Folders, label: 'All Documents' },
            { to: '/documents/new', icon: Plus, label: 'New Document' },
            { to: '/letterhead', icon: FileText, label: 'Letterhead' },
            { to: '/signatures', icon: PenTool, label: 'Doc Signatures' },
          ]
        },
        {
          icon: Receipt,
          label: 'Finance',
          children: [
            { to: '/finance', icon: FileSpreadsheet, label: 'All Finance Docs' },
            { to: '/finance?type=invoice', icon: Receipt, label: 'New Invoice' },
            { to: '/finance?type=quotation', icon: FileSpreadsheet, label: 'New Quotation' },
          ]
        },
        { to: '/clients', icon: Users, label: 'Clients' },
      ]
    },
    {
      section: 'Brand & Assets',
      items: [
        {
          icon: Palette,
          label: 'Brand',
          children: [
            { to: '/brand/guidelines', icon: Palette, label: 'Guidelines' },
            { to: '/brand/logos', icon: Image, label: 'Logo Showcase' },
            { to: '/templates', icon: LayoutGrid, label: 'All Templates' },
          ]
        },
        {
          icon: CreditCard,
          label: 'Assets',
          children: [
            { to: '/business-card', icon: CreditCard, label: 'Business Cards' },
            { to: '/assets/stationery', icon: PenTool, label: 'Stationery' },
            { to: '/assets/digital', icon: Monitor, label: 'Digital Assets' },
            { to: '/assets/accessories', icon: Briefcase, label: 'Accessories' },
          ]
        },
      ]
    },
    {
      section: 'Administration',
      items: [
        ...(isManager ? [{
          icon: UserCog,
          label: 'Team',
          children: [
            { to: '/users', icon: Users, label: 'User Management' },
            { to: '/admin/team-members', icon: Users, label: 'Team Members' },
          ]
        }] : []),
        {
          icon: Settings,
          label: 'Settings',
          children: [
            { to: '/settings', icon: Settings, label: 'My Settings' },
            ...(isAdmin ? [{ to: '/settings?tab=company', icon: Building, label: 'Company Settings' }] : []),
          ]
        },
      ]
    },
  ];

  return (
    <aside 
      className={`bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 flex flex-col transition-all duration-300 h-full ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Header */}
      <div className={`p-4 border-b border-slate-100 dark:border-slate-800 flex items-center ${collapsed ? 'justify-center' : 'justify-between'}`}>
        {!collapsed && <Logo className="scale-75 origin-left" />}
        
        {/* Close button for mobile */}
        <button
          onClick={onCloseMobile}
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 transition-colors lg:hidden"
        >
          <X size={18} />
        </button>
        
        {/* Collapse button for desktop */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 transition-colors hidden lg:block"
        >
          {collapsed ? <Menu size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {navigation.map((section, sectionIdx) => (
          <div key={sectionIdx} className="mb-4">
            <SectionHeader label={section.section} collapsed={collapsed} />
            <div className="space-y-0.5">
              {section.items.map((item, itemIdx) => (
                <NavItem
                  key={itemIdx}
                  {...item}
                  collapsed={collapsed}
                  onNavigate={handleNavigate}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* User Section */}
      <div className={`p-3 border-t border-slate-100 dark:border-slate-800 ${collapsed ? 'text-center' : ''}`}>
        {!collapsed && (
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-semibold text-sm">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{user?.name || 'User'}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user?.role || 'Staff'}</p>
            </div>
          </div>
        )}
        
        {/* Theme Toggle */}
        <div className="mb-2">
          <ThemeDropdown collapsed={collapsed} />
        </div>
        
        <button 
          onClick={handleLogout}
          className={`flex items-center gap-3 px-3 py-2.5 w-full text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors ${collapsed ? 'justify-center' : ''}`}
          title={collapsed ? 'Logout' : undefined}
        >
          <LogOut size={18} />
          {!collapsed && <span className="text-sm">Logout</span>}
        </button>
      </div>
    </aside>
  );
};

export default CollapsibleSidebar;
