import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
   Users,
   Settings,
   LogOut,
   Menu,
   X,
   User,
   Target,
   Calendar,
   Home,
   PieChart,
   UserPlus,
   Bell,
   TrendingUp,
   Building2,
   ShieldCheck,
   ArrowLeftRight,
   Zap,
   UserCheck,
   BookUser,
   ListTodo,
   AlertTriangle,
   FileText
 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { notificationsAPI } from '../services/api';
import NotificationCenter from './NotificationCenter';
import ProfileModal from './ProfileModal';
import LogoutModal from './LogoutModal';
import QuickActionModal from './QuickActionModal';
import Taskbar from './Taskbar';
import logo from '../assets/logo.png';

const Layout = ({ children, showHeaderActions = true }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const isAdmin = user?.role === 'admin' || user?.role === 'manager';
  const isSuperAdmin = user?.role === 'superadmin';
  const isAgent = user?.role === 'agent';
  const showTaskbar = isAdmin || isSuperAdmin || isAgent;
  const taskbarRole = user?.role || 'agent';

  // Load unread notifications count for admin with periodic polling
  useEffect(() => {
    if (isAdmin || isSuperAdmin) {
      loadUnreadNotifications();
      const interval = setInterval(() => { loadUnreadNotifications(); }, 30000);
      return () => clearInterval(interval);
    }
  }, [isAdmin, isSuperAdmin]);

  const loadUnreadNotifications = async () => {
    if (!isAdmin && !isSuperAdmin) return;

    try {
      const response = await notificationsAPI.getUnreadCount();
      setUnreadNotifications(response.data.count || 0);
    } catch (error) {
      console.error('Failed to load unread notifications:', error);
    }
  };

  const superAdminNavItems = [
    { path: '/dashboard', icon: PieChart, label: 'Dashboard', description: 'Platform insights and tenant summaries at a glance.' },
    { path: '/superadmin', icon: ShieldCheck, label: 'Super Admin', description: 'Super admin control center for platform operations.' },
    { path: '/superadmin/tenants', icon: Building2, label: 'Tenant Management', description: 'View and manage tenant organizations from one place.' },
    { path: '/admin', icon: Home, label: 'Admin View', description: 'Switch to the admin dashboard for organization-level management.' },
    { path: '/admin/users', icon: UserPlus, label: 'User Management', description: 'Manage users, roles, and access across the organization.' },
    { path: '/admin/reports', icon: PieChart, label: 'Reports', description: 'Generate and review reports for performance and activity.' },
    { path: '/admin/settings', icon: Settings, label: 'Settings', description: 'Update application and account settings.' },
  ];

  const adminNavItems = [
    { path: '/admin', icon: PieChart, label: 'Dashboard', description: 'Your organization summary with quick access to key metrics.' },
    { path: '/predictive-analytics', icon: Zap, label: 'Predictive Analytics', description: 'Use AI insights to make smarter decisions and forecasts.' },
    { path: '/admin/users', icon: UserPlus, label: 'User Management', description: 'Manage users, roles, and permissions for your team.' },
    { path: '/admin/reports', icon: PieChart, label: 'Reports', description: 'Review performance and activity reports across the business.' },
    { path: '/admin/bulk-operations', icon: ArrowLeftRight, label: 'Bulk Operations', description: 'Execute bulk tasks quickly and efficiently.' },
    { path: '/admin/settings', icon: Settings, label: 'Settings', description: 'Update account preferences and system settings.' },
  ];

const agentNavItems = [
    { path: '/agent',            icon: PieChart,   label: 'Dashboard', description: 'Your sales dashboard with performance and activity summaries.' },
    { path: '/agent/leads',      icon: UserCheck,  label: 'Leads', description: 'Track and manage sales leads in one place.' },
    { path: '/agent/clients',    icon: Users,      label: 'Clients', description: 'View your client list and manage customer relationships.' },
    { path: '/agent/contacts',   icon: BookUser,   label: 'Contacts', description: 'Manage your contact directory and communication details.' },
    { path: '/agent/tasks',      icon: ListTodo,   label: 'Tasks', description: 'Track tasks and stay on top of daily work items.' },
    { path: '/agent/issues',     icon: AlertTriangle, label: 'Issues', description: 'Manage issues and support requests efficiently.' },
    { path: '/agent/deals',      icon: Target,     label: 'Deals', description: 'Review and progress your current deals.' },
    { path: '/agent/sales',      icon: TrendingUp, label: 'Sales', description: 'Track sales performance and revenue results.' },
    { path: '/agent/schedules',  icon: Calendar,   label: 'Schedules', description: 'Manage your meetings and calendar events.' },
 ];

  const navItems = isSuperAdmin ? superAdminNavItems : isAdmin ? adminNavItems : agentNavItems;

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    logout();
    navigate('/login');
    setShowLogoutModal(false);
  };

  const getActiveNavItem = () => {
    const exactMatch = navItems.find(item => item.path === location.pathname);
    if (exactMatch) return exactMatch;
    return navItems.find(item => item.path !== '/' && location.pathname.startsWith(item.path)) || { label: 'Dashboard' };
  };

  const activeNavItem = getActiveNavItem();

  const NavItem = ({ item, isActive, onClick }) => {
    const Icon = item.icon;
    return (
      <Link
        to={item.path}
        onClick={onClick}
        className={`flex items-center space-x-4 px-4 py-3 rounded-xl text-sm font-medium transition-all group ${isActive
            ? 'bg-orange-700 text-white shadow-md'
            : 'text-white hover:bg-orange-500/90'
          }`}
      >
        <div className={`p-2 rounded-lg ${isActive
            ? 'bg-orange-800 text-white'
            : 'bg-orange-600/20 text-white'
          }`}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-white">{item.label}</div>
        </div>
        {isActive && (
          <div className="w-2 h-2 bg-white rounded-full"></div>
        )}
      </Link>
    );
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Desktop Sidebar - Always Visible */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <div className="w-64 flex flex-col bg-orange-600 shadow-xl border-r border-orange-700 text-white">
          {/* Header */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-orange-700">
            <div className="flex items-center space-x-3">
              <img 
                src={user?.tenant?.logo || user?.tenant?.settings?.logo || logo} 
                alt="Logo" 
                className="w-10 h-10 object-contain" 
              />
              <div>
                <span className="text-xl font-bold text-white">
                  {user?.tenant?.name || 'CRM'}
                </span>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <NavItem
                  key={item.path}
                  item={item}
                  isActive={isActive}
                  onClick={() => { }}
                />
              );
            })}
          </nav>

          {/* Footer */}
          <div className="border-t border-orange-700 p-6 space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-white text-opacity-90">Status</span>
              <span className="flex items-center space-x-1">
                <div className={`w-2 h-2 rounded-full ${user?.status === 'online' ? 'bg-green-400' : 'bg-gray-400'}`}></div>
                <span className="text-white font-medium capitalize">{user?.status || 'offline'}</span>
              </span>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center space-x-3 w-full px-4 py-3 rounded-lg text-sm font-medium text-white hover:bg-orange-700 transition-colors group"
            >
              <LogOut className="w-4 h-4 text-white" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Sidebar - Shows when toggled */}
      {sidebarOpen && (
        <div className="lg:hidden">
          <div className="fixed inset-0 flex z-40">
            <div
              className="fixed inset-0 bg-gray-600 bg-opacity-75"
              onClick={() => setSidebarOpen(false)}
            />
            <div className="relative flex-1 flex flex-col max-w-xs w-full bg-orange-600 shadow-xl text-white">
              <div className="absolute top-0 right-0 -mr-12 pt-2">
                <button
                  className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                  onClick={() => setSidebarOpen(false)}
                >
                  <X className="h-6 w-6 text-white" />
                </button>
              </div>
              <div className="flex-1 h-0 overflow-y-auto">
                {/* Mobile Header */}
                <div className="flex items-center h-16 px-6 border-b border-orange-700 bg-orange-600 text-white">
                  <div className="flex items-center space-x-3">
                    <svg className="w-10 h-10" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M125 93L175 43L175 143L125 93Z" fill="white" />
                      <path d="M75 93L125 43L125 143L75 93Z" fill="white" />
                      <path d="M75 93L25 143L125 143L75 93Z" fill="white" />
                      <path d="M125 93L125 43L25 143L125 143Z" fill="white" />
                    </svg>
                    <div>
                      <span className="text-xl font-bold text-white">CRM</span>
                    </div>
                  </div>
                </div>

                {/* Mobile Navigation */}
                <nav className="px-4 py-6 space-y-2">
                  {navItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                      <NavItem
                        key={item.path}
                        item={item}
                        isActive={isActive}
                        onClick={() => setSidebarOpen(false)}
                      />
                    );
                  })}
                </nav>
              </div>

              {/* Mobile Footer */}
              <div className="border-t border-orange-700 p-6 space-y-4 text-white">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white text-opacity-90">Status</span>
                  <span className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span className="text-white font-medium">Online</span>
                  </span>
                </div>

                <button
                  onClick={() => {
                    setSidebarOpen(false);
                    handleLogout();
                  }}
                  className="flex items-center space-x-3 w-full px-4 py-3 rounded-lg text-sm font-medium text-white hover:bg-orange-700 transition-colors group"
                >
                  <LogOut className="w-4 h-4 text-white" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-auto bg-gray-50">
          <div className="p-3 sm:p-4 md:p-6 lg:p-8 space-y-4">
            <div className="space-y-2">
              <h1 className="text-2xl font-semibold text-gray-900">{activeNavItem.label}</h1>
              <p className="text-sm text-gray-600 max-w-3xl">{activeNavItem.description || 'Welcome to CRM Pro — your central workspace.'}</p>
            </div>
            {showTaskbar && (
              <Taskbar role={taskbarRole} onOpenProfile={() => setShowProfileModal(true)} />
            )}
            {children}
          </div>
        </main>
      </div>

      {/* Notification Center - Only for admins and superadmin */}
      {(isAdmin || isSuperAdmin) && (
        <NotificationCenter
          isOpen={showNotifications}
          onClose={() => {
            setShowNotifications(false);
            // Refresh unread count when closing
            loadUnreadNotifications();
          }}
        />
      )}

      {/* Profile Modal */}
      <ProfileModal
        isOpen={showProfileModal}
        onClose={() => {
          setShowProfileModal(false);
          setShowUserMenu(false);
        }}
      />

{/* Logout Modal */}
       <LogoutModal
         isOpen={showLogoutModal}
         onClose={() => setShowLogoutModal(false)}
         onConfirm={confirmLogout}
       />

       {/* Quick Action Modal */}
       <QuickActionModal
         isOpen={showQuickActions}
         onClose={() => setShowQuickActions(false)}
       />
     </div>
  );
};

export default Layout;
