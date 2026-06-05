import React from 'react';
import { useNavigate } from 'react-router-dom';
import { getQuickActions, getQuickActionsMeta, getIconColors } from '../utils/roleConfig';

const DashboardQuickActions = ({ role }) => {
  const navigate = useNavigate();
  const actions = getQuickActions(role);
  const meta = getQuickActionsMeta(role);

  if (!actions.length) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-gray-900">{meta.title}</h2>
        <p className="text-sm text-gray-500 mt-1">{meta.subtitle}</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {actions.map((action) => {
          const Icon = action.icon;
          const colors = getIconColors(action.color);
          return (
            <button
              key={action.label}
              type="button"
              onClick={() => navigate(action.path, { state: action.state })}
              className={`group flex flex-col items-start gap-4 rounded-3xl border border-gray-200 p-4 text-left transition ${colors.hover}`}
            >
              <div className={`rounded-2xl p-3 ${colors.bg} ${colors.text}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">{action.label}</p>
                {action.description && (
                  <p className="text-sm text-gray-500 mt-1">{action.description}</p>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default DashboardQuickActions;
