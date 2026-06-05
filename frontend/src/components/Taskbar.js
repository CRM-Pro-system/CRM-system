import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Bell,
  Mail,
  MessageSquare,
  HelpCircle,
  Sun,
  Moon,
  Calendar,
  Plus,
  Menu,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { getSearchConfig } from '../utils/roleConfig';

const formatMonthRange = (date = new Date()) => {
  const year = date.getFullYear();
  const month = date.getMonth();
  const lastDay = new Date(year, month + 1, 0).getDate();
  const monthName = date.toLocaleString('en-US', { month: 'short' });
  const pad = (n) => String(n).padStart(2, '0');
  return `${monthName} ${pad(1)} – ${monthName} ${pad(lastDay)}, ${year}`;
};

const IconButton = ({ icon: Icon, badge, onClick, title, isDark }) => (
  <button
    type="button"
    onClick={onClick}
    title={title}
    className={`relative flex h-10 w-10 items-center justify-center rounded-xl transition ${
      isDark
        ? 'bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white'
        : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900'
    }`}
  >
    <Icon className="h-[18px] w-[18px]" />
    {badge > 0 && (
      <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-orange-500 px-1 text-[10px] font-bold text-white">
        {badge > 99 ? '99+' : badge}
      </span>
    )}
  </button>
);

const Taskbar = ({
  onOpenNotifications,
  onOpenQuickActions,
  onMenuClick,
  unreadNotifications = 0,
  messageCount = 0,
  chatCount = 0,
}) => {
  const { user } = useAuth();
  const { theme, updateTheme } = useTheme();
  const navigate = useNavigate();
  const searchRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateLabel] = useState(() => formatMonthRange());

  const role = user?.role || 'agent';
  const searchConfig = getSearchConfig(role);
  const firstName = user?.name?.split(' ')[0] || 'there';
  const isDark = theme.mode === 'dark';

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;
    navigate(searchConfig.path, { state: { search: query } });
    setSearchQuery('');
  };

  const toggleTheme = () => {
    updateTheme({ mode: isDark ? 'light' : 'dark' });
  };

  return (
    <div className={`sticky top-0 z-30 -mx-3 sm:-mx-4 md:-mx-6 lg:-mx-8 px-3 sm:px-4 md:px-6 lg:px-8 pt-3 sm:pt-4 pb-3 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div
        className={`rounded-2xl shadow-sm px-3 sm:px-4 py-3 ${
          isDark
            ? 'bg-[#0f172a] border border-slate-700/50 shadow-lg'
            : 'bg-white border border-gray-200'
        }`}
      >
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:gap-4">
          {/* Left: menu + greeting */}
          <div className="flex items-center gap-3 min-w-0 shrink-0">
            <button
              type="button"
              onClick={onMenuClick}
              className={`lg:hidden flex h-10 w-10 items-center justify-center rounded-xl transition ${
                isDark
                  ? 'bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900'
              }`}
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <p className={`text-sm sm:text-base font-semibold truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Welcome back, {firstName}
            </p>
          </div>

          {/* Center: search */}
          <form onSubmit={handleSearch} className="flex-1 min-w-0">
            <div className="relative flex items-center">
              <Search className={`absolute left-3.5 h-4 w-4 pointer-events-none ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
              <input
                ref={searchRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={searchConfig.placeholder}
                className={`w-full rounded-xl py-2.5 pl-10 pr-20 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500/40 ${
                  isDark
                    ? 'bg-slate-800/80 border border-slate-700/60 text-gray-200 placeholder-gray-500'
                    : 'bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400'
                }`}
              />
              <kbd
                className={`hidden sm:inline-flex absolute right-3 items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[10px] font-medium ${
                  isDark
                    ? 'border border-slate-600 bg-slate-900/60 text-gray-500'
                    : 'border border-gray-200 bg-white text-gray-400'
                }`}
              >
                Ctrl+K
              </kbd>
            </div>
          </form>

          {/* Right: utilities + date + add new */}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap xl:flex-nowrap shrink-0">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <IconButton
                icon={Bell}
                badge={unreadNotifications}
                onClick={onOpenNotifications}
                title="Notifications"
                isDark={isDark}
              />
              <IconButton
                icon={Mail}
                badge={messageCount}
                onClick={() => navigate(role === 'agent' ? '/agent/contacts' : '/admin/users')}
                title="Messages"
                isDark={isDark}
              />
              <IconButton
                icon={MessageSquare}
                badge={chatCount}
                onClick={() => navigate(role === 'agent' ? '/agent/issues' : '/admin/reports')}
                title="Activity"
                isDark={isDark}
              />
              <IconButton
                icon={HelpCircle}
                onClick={() => navigate(role === 'superadmin' ? '/superadmin' : role === 'agent' ? '/agent' : '/admin')}
                title="Help"
                isDark={isDark}
              />
              <IconButton
                icon={isDark ? Sun : Moon}
                onClick={toggleTheme}
                title={isDark ? 'Light mode' : 'Dark mode'}
                isDark={isDark}
              />
            </div>

            <button
              type="button"
              className={`hidden md:inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs sm:text-sm transition whitespace-nowrap ${
                isDark
                  ? 'bg-slate-800/80 border border-slate-700/60 text-gray-300 hover:bg-slate-700/60'
                  : 'bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Calendar className={`h-4 w-4 shrink-0 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
              <span>{dateLabel}</span>
            </button>

            <button
              type="button"
              onClick={onOpenQuickActions}
              className="inline-flex items-center gap-2 rounded-full bg-orange-500 hover:bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition whitespace-nowrap"
            >
              <Plus className="h-4 w-4" />
              <span>Add New</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Taskbar;
