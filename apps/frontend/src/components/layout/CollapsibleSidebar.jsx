import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  X, LayoutDashboard, FileText, Mail, Settings, LogOut, Users,
  Receipt, ChevronDown, ChevronRight, Server, PenTool, Inbox,
  LayoutGrid, Plus, CreditCard, Monitor, Briefcase, Palette,
  Building, Shield, UserCog, Folders, FileSpreadsheet,
  ChevronLeft, Menu, Home, FolderOpen, Image, Truck, ClipboardCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { mailApi } from '../../lib/api';
import Logo from '../templates/Logo';

// Sidebar Navigation Item with optional children
const NavItem = ({ to, icon: Icon, label, badge, children, isActive, collapsed, onCloseMobile }) => {
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

  if (hasChildren) {
    return (
      <div>
        <button
          onClick={() => setExpanded(!expanded)}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 active:scale-98 ${
            hasActiveChild 
              ? 'bg-orange-50 text-orange-600 font-semibold' 
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Icon size={18} className="flex-shrink-0" />
          {!collapsed && (
            <>
              <span className="text-sm flex-1 text-left font-medium">{label}</span>
              <ChevronDown 
                size={16} 
                className={`text-slate-400 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} 
              />
            </>
          )}
        </button>
        
        {!collapsed && expanded && (
          <div className="ml-4 pl-3 border-l-2 border-slate-100 mt-1 space-y-0.5">
            {children.map((child, idx) => (
              <Link
                key={idx}
                to={child.to}
                onClick={() => onCloseMobile && onCloseMobile()}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all duration-150 active:scale-98 ${
                  location.pathname === child.to || location.pathname.startsWith(child.to + '/')
                    ? 'bg-orange-50 text-orange-600 font-semibold'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
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
      onClick={() => onCloseMobile && onCloseMobile()}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 active:scale-98 ${
        isCurrentActive 
          ? 'bg-orange-50 text-orange-600 font-semibold' 
          : 'text-slate-600 hover:bg-slate-50'
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
    <div className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
      {label}
    </div>
  );
};

const CollapsibleSidebar = ({ mobileOpen = false, onCloseMobile = () => {} }) => {
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
            { to: '/finance?type=delivery_note', icon: Truck, label: 'New Delivery Note' },
            { to: '/finance?type=job_card', icon: ClipboardCheck, label: 'Service Job Card' },
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
          label: 'Team & RBAC',
          children: [
            { to: '/users', icon: Users, label: 'Team Directory' },
            { to: '/users?tab=matrix', icon: Shield, label: 'Roles & Permissions' },
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

  const sidebarContent = (isMobile = false) => (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className={`p-4 border-b border-slate-100 flex items-center ${!isMobile && collapsed ? 'justify-center' : 'justify-between'}`}>
        {(!collapsed || isMobile) && <Logo asLink={true} className="scale-75 origin-left" />}
        {isMobile ? (
          <button
            onClick={onCloseMobile}
            className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 transition-colors active:scale-90"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        ) : (
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 transition-colors"
            aria-label="Toggle sidebar"
          >
            {collapsed ? <Menu size={18} /> : <ChevronLeft size={18} />}
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {navigation.map((section, sectionIdx) => (
          <div key={sectionIdx} className="mb-4">
            <SectionHeader label={section.section} collapsed={!isMobile && collapsed} />
            <div className="space-y-0.5">
              {section.items.map((item, itemIdx) => (
                <NavItem
                  key={itemIdx}
                  {...item}
                  collapsed={!isMobile && collapsed}
                  onCloseMobile={onCloseMobile}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* User Section with Mobile Safe Area Inset */}
      <div 
        className={`p-3 border-t border-slate-100 ${!isMobile && collapsed ? 'text-center' : ''}`}
        style={isMobile ? { paddingBottom: 'max(16px, env(safe-area-inset-bottom))' } : undefined}
      >
        {(!collapsed || isMobile) && (
          <div className="flex items-center gap-3 px-3 py-2 mb-2 bg-slate-50/70 rounded-xl">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-semibold text-sm shadow-xs">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900 truncate">{user?.name || 'User'}</p>
              <p className="text-xs text-slate-500 truncate">{user?.role || 'Staff'}</p>
            </div>
          </div>
        )}
        <button 
          onClick={handleLogout}
          className={`flex items-center gap-3 px-3 py-2.5 w-full text-red-600 hover:bg-red-50 rounded-xl transition-all duration-150 active:scale-95 ${!isMobile && collapsed ? 'justify-center' : ''}`}
          title={!isMobile && collapsed ? 'Logout' : undefined}
        >
          <LogOut size={18} />
          {(!collapsed || isMobile) && <span className="text-sm font-semibold">Logout</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside 
        className={`hidden md:flex flex-col bg-white border-r border-slate-200 transition-all duration-300 ${
          collapsed ? 'w-16' : 'w-64'
        }`}
      >
        {sidebarContent(false)}
      </aside>

      {/* Mobile Backdrop & Drawer (Elevated to z-[60] so it sits above mobile bottom bar and action sheets) */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-[60] md:hidden animate-in fade-in duration-200"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      <div 
        className={`fixed inset-y-0 left-0 z-[60] w-72 max-w-[85vw] bg-white shadow-2xl transition-transform duration-300 ease-in-out md:hidden flex flex-col ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebarContent(true)}
      </div>
    </>
  );
};

export default CollapsibleSidebar;
