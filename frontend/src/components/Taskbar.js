import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, TrendingUp, UserCheck, Clock, FileText, ShieldCheck, Settings, BarChart3 } from 'lucide-react';

const Taskbar = ({ role, onOpenProfile }) => {
  const navigate = useNavigate();

  const getActions = () => {
    switch (role) {
      case 'agent':
        return [
          { label: 'Create Client', icon: Users, color: 'orange', path: '/agent/clients', state: { openCreate: true } },
          { label: 'Add Sale', icon: TrendingUp, color: 'green', path: '/agent/sales', state: { openCreate: true } },
          { label: 'Create Lead', icon: UserCheck, color: 'blue', path: '/agent/leads', state: { openCreate: true } },
          { label: 'View Tasks', icon: Clock, color: 'yellow', path: '/agent/tasks' },
        ];
      case 'admin':
      case 'manager':
        return [
          { label: 'User Management', icon: Users, color: 'orange', path: '/admin/users' },
          { label: 'Reports', icon: BarChart3, color: 'green', path: '/admin/reports' },
          { label: 'Settings', icon: Settings, color: 'blue', path: '/admin/settings' },
          { label: 'Bulk Operations', icon: FileText, color: 'yellow', path: '/admin/bulk-operations' },
        ];
      case 'superadmin':
        return [
          { label: 'Tenant Management', icon: ShieldCheck, color: 'orange', path: '/superadmin/tenants' },
          { label: 'Platform Stats', icon: BarChart3, color: 'green', path: '/dashboard' },
          { label: 'Admin View', icon: Settings, color: 'blue', path: '/admin' },
          { label: 'Super Admin', icon: FileText, color: 'yellow', path: '/superadmin' },
        ];
      default:
        return [];
    }
  };

  const actions = getActions();

  if (actions.length === 0) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-4">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Quick actions</h2>
        <p className="text-sm text-gray-500 mt-1">Jump directly into your most common workflows.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.label}
              onClick={() => navigate(action.path, { state: action.state })}
              className="group flex flex-col items-start gap-4 rounded-3xl border border-gray-200 p-4 text-left hover:border-orange-300 transition"
            >
              <div className={`rounded-2xl bg-${action.color}-50 p-3 text-${action.color}-600`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">{action.label}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default Taskbar;