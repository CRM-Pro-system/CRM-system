import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, TrendingUp, UserCheck, Clock } from 'lucide-react';

const Taskbar = ({ role, onOpenProfile }) => {
  const navigate = useNavigate();

  const actions = [
    { label: 'Create Client', icon: Users, color: 'orange', path: '/agent/clients', state: { openCreate: true } },
    { label: 'Add Sale', icon: TrendingUp, color: 'green', path: '/agent/sales', state: { openCreate: true } },
    { label: 'Create Lead', icon: UserCheck, color: 'blue', path: '/agent/leads', state: { openCreate: true } },
    { label: 'View Tasks', icon: Clock, color: 'yellow', path: '/agent/tasks' },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-4">
      {actions.map((action) => (
        <button
          key={action.label}
          onClick={() => navigate(action.path, { state: action.state })}
          className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-200 hover:border-orange-300 transition"
        >
          <div className={`p-2 rounded-lg bg-${action.color}-50 text-${action.color}-600`}>
            <action.icon className="w-5 h-5" />
          </div>
          <span className="font-medium text-gray-900">{action.label}</span>
        </button>
      ))}
    </div>
  );
};

export default Taskbar;