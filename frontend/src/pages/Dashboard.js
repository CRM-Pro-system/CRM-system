import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, BarChart3, Users, DollarSign, Target, PieChart, TrendingUp, Activity } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, PieChart as RechartsPieChart, Cell, Pie, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
// Temporarily disabled API import due to webpack resolution issue
// import { dashboardsAPI } from '../../services/api';
import toast from 'react-hot-toast';

// Mock API for development - will be replaced with real API once webpack issue is resolved
// This version includes local storage to persist dashboards for demonstration
let mockDashboards = JSON.parse(localStorage.getItem('mockDashboards') || '[]');

const dashboardsAPI = {
  getAll: async () => {
    console.log('Mock: getAll dashboards called');
    return { data: { dashboards: mockDashboards } };
  },
  getKPIs: async (id) => {
    console.log('Mock: getKPIs called for dashboard:', id);
    // Return mock KPI data based on dashboard ID
    const mockKPIs = {
      'total-clients': { value: 1250, label: 'Total Clients' },
      'active-deals': { value: 45, label: 'Active Deals' },
      'monthly-sales': { value: 58000, label: 'Monthly Sales', format: 'currency' },
      'conversion-rate': { value: 24.5, label: 'Conversion Rate', format: 'percentage' },
      'sales-trend': {
        data: [
          { name: 'Jan', value: 45000 },
          { name: 'Feb', value: 52000 },
          { name: 'Mar', value: 48000 },
          { name: 'Apr', value: 61000 },
          { name: 'May', value: 55000 },
          { name: 'Jun', value: 58000 }
        ]
      },
      'deal-status': {
        data: [
          { name: 'Prospect', value: 25 },
          { name: 'Proposal', value: 15 },
          { name: 'Negotiation', value: 8 },
          { name: 'Review', value: 5 },
          { name: 'Won', value: 12 },
          { name: 'Lost', value: 3 }
        ]
      }
    };
    return { data: { kpis: mockKPIs } };
  },
  create: async (data) => {
    console.log('Mock: create dashboard called with:', data);
    const newDashboard = {
      _id: 'mock-' + Date.now(),
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    mockDashboards.push(newDashboard);
    localStorage.setItem('mockDashboards', JSON.stringify(mockDashboards));
    return { data: newDashboard };
  },
  update: async (id, data) => {
    console.log('Mock: update dashboard called for:', id, data);
    const index = mockDashboards.findIndex(d => d._id === id);
    if (index !== -1) {
      mockDashboards[index] = { ...mockDashboards[index], ...data, updatedAt: new Date().toISOString() };
      localStorage.setItem('mockDashboards', JSON.stringify(mockDashboards));
    }
    return { data: mockDashboards[index] || {} };
  },
  delete: async (id) => {
    console.log('Mock: delete dashboard called for:', id);
    mockDashboards = mockDashboards.filter(d => d._id !== id);
    localStorage.setItem('mockDashboards', JSON.stringify(mockDashboards));
    return { data: {} };
  }
};

const Dashboard = () => {
  const [dashboards, setDashboards] = useState([]);
  const [currentDashboard, setCurrentDashboard] = useState(null);
  const [kpiData, setKpiData] = useState({});
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isDefault: false
  });
  const [saving, setSaving] = useState(false);

  // Modal states
  const [targetForm, setTargetForm] = useState({ monthlyTargetDeals: 0, monthlyTargetAmount: 0, monthlyTargetClients: 0 });
  const [targetErrors, setTargetErrors] = useState({});
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [exportsLoading, setExportsLoading] = useState(false);

  useEffect(() => {
    loadDashboards();
  }, []);

  useEffect(() => {
    if (currentDashboard) {
      loadKPIData();
    }
  }, [currentDashboard]);

  const loadDashboards = async () => {
    try {
      setLoading(true);
      const response = await dashboardsAPI.getAll();
      setDashboards(response.data.dashboards || []);

      // Load default dashboard or first dashboard
      const defaultDash = response.data.dashboards.find(d => d.isDefault);
      if (defaultDash) {
        setCurrentDashboard(defaultDash);
      } else if (response.data.dashboards.length > 0) {
        setCurrentDashboard(response.data.dashboards[0]);
      }
    } catch (error) {
      toast.error('Failed to load dashboards');
    } finally {
      setLoading(false);
    }
  };

  const loadKPIData = async () => {
    if (!currentDashboard) return;

    try {
      const response = await dashboardsAPI.getKPIs(currentDashboard._id);
      setKpiData(response.data.kpis || {});
    } catch (error) {
      console.error('Failed to load KPI data:', error);
    }
  };

  const handleCreateDashboard = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Create dashboard with default KPI and chart widgets
      const dashboardData = {
        ...formData,
        widgets: [
          {
            id: 'total-clients',
            type: 'kpi',
            title: 'Total Clients',
            config: { metric: 'total_clients' },
            position: { x: 0, y: 0, w: 3, h: 2 },
            isActive: true
          },
          {
            id: 'active-deals',
            type: 'kpi',
            title: 'Active Deals',
            config: { metric: 'active_deals' },
            position: { x: 3, y: 0, w: 3, h: 2 },
            isActive: true
          },
          {
            id: 'monthly-sales',
            type: 'kpi',
            title: 'Monthly Sales',
            config: { metric: 'monthly_sales', period: 'monthly' },
            position: { x: 6, y: 0, w: 3, h: 2 },
            isActive: true
          },
          {
            id: 'conversion-rate',
            type: 'kpi',
            title: 'Conversion Rate',
            config: { metric: 'conversion_rate' },
            position: { x: 9, y: 0, w: 3, h: 2 },
            isActive: true
          },
          {
            id: 'sales-trend',
            type: 'chart',
            title: 'Sales Trend',
            config: { chartType: 'line', metric: 'sales_trend' },
            position: { x: 0, y: 2, w: 6, h: 4 },
            isActive: true
          },
          {
            id: 'deal-status',
            type: 'chart',
            title: 'Deal Status Distribution',
            config: { chartType: 'pie', metric: 'deal_status' },
            position: { x: 6, y: 2, w: 6, h: 4 },
            isActive: true
          }
        ]
      };

      await dashboardsAPI.create(dashboardData);
      toast.success('Dashboard created successfully');
      setShowCreateModal(false);
      setFormData({ name: '', description: '', isDefault: false });
      loadDashboards();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create dashboard');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateDashboard = async (e) => {
    e.preventDefault();
    if (!currentDashboard) return;

    setSaving(true);
    try {
      await dashboardsAPI.update(currentDashboard._id, formData);
      toast.success('Dashboard updated successfully');
      setShowEditModal(false);
      loadDashboards();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update dashboard');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteDashboard = async (dashboard) => {
    if (!window.confirm(`Delete dashboard "${dashboard.name}"?`)) return;

    try {
      await dashboardsAPI.delete(dashboard._id);
      toast.success('Dashboard deleted successfully');
      loadDashboards();
    } catch (error) {
      toast.error('Failed to delete dashboard');
    }
  };

  const renderWidget = (widget) => {
    const data = kpiData[widget.id];

    if (!data) {
      return (
        <div className="h-full flex flex-col">
          <h5 className="dashboard-text text-lg font-semibold mb-4">{widget.title}</h5>
          <div className="flex-1 flex items-center justify-center">
            <div className="dashboard-spinner" style={{ width: '2rem', height: '2rem' }}></div>
          </div>
        </div>
      );
    }

    const formatValue = (value, format) => {
      switch (format) {
        case 'currency':
          return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
          }).format(value);
        case 'percentage':
          return `${value}%`;
        default:
          return value.toLocaleString();
      }
    };

    const getIcon = (metric) => {
      switch (metric) {
        case 'total_clients':
        case 'monthly_clients':
          return <Users className="text-blue-500" size={24} />;
        case 'monthly_sales':
        case 'total_sales':
          return <DollarSign className="text-green-500" size={24} />;
        case 'conversion_rate':
          return <Target className="text-yellow-500" size={24} />;
        default:
          return <BarChart3 className="text-purple-500" size={24} />;
      }
    };

    // KPI Card Widget
    if (widget.type === 'kpi') {
      return (
        <div className="h-full flex flex-col justify-center">
          <div className="flex items-center">
            <div className="mr-4 p-2 bg-gray-50 rounded-lg">
              {getIcon(widget.config?.metric)}
            </div>
            <div className="flex-grow">
              <h4 className="dashboard-text text-2xl font-bold mb-1 text-gray-900">{formatValue(data.value, data.format)}</h4>
              <small className="dashboard-text text-gray-500 font-medium">{data.label}</small>
            </div>
          </div>
        </div>
      );
    }

    // Chart Widgets
    if (widget.type === 'chart') {
      return renderChartWidget(widget, data);
    }

    // Fallback
    return (
      <div className="h-full flex flex-col justify-center">
        <div className="flex items-center">
          <div className="mr-4">
            <Activity className="text-gray-500" size={24} />
          </div>
          <div className="flex-grow">
            <h4 className="dashboard-text text-2xl font-bold mb-1">Unknown Widget</h4>
            <small className="dashboard-text text-gray-500">Widget type not supported</small>
          </div>
        </div>
      </div>
    );
  };

  const renderChartWidget = (widget, data) => {
    const chartType = widget.config?.chartType || 'bar';
    const chartData = data.data || [];

    const COLORS = ['#f97316', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444'];

    if (chartType === 'bar') {
      return (
        <div className="h-full flex flex-col">
          <h5 className="dashboard-text text-lg font-semibold mb-4">{widget.title}</h5>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => [`$${value?.toLocaleString() || value}`, 'Value']} />
                <Legend />
                <Bar dataKey="value" fill="#f97316" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      );
    }

    if (chartType === 'line') {
      return (
        <div className="h-full flex flex-col">
          <h5 className="dashboard-text text-lg font-semibold mb-4">{widget.title}</h5>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => [`$${value?.toLocaleString() || value}`, 'Revenue']} />
                <Legend />
                <Line type="monotone" dataKey="value" stroke="#f97316" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      );
    }

    if (chartType === 'pie') {
      return (
        <div className="h-full flex flex-col">
          <h5 className="dashboard-text text-lg font-semibold mb-4">{widget.title}</h5>
          <div className="flex-1 min-h-0 flex items-center justify-center">
            <ResponsiveContainer width="100%" height={280}>
              <RechartsPieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  stroke="#fff"
                  strokeWidth={2}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value}`, 'Count']} />
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-lg shadow-sm p-6 h-full flex items-center justify-center">
        <div className="text-center">
          <PieChart className="text-gray-400 mb-2 mx-auto" size={32} />
          <p className="text-gray-500">Chart type not supported</p>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="py-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading dashboards...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="dashboard-container">
        <div className="dashboard-header">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold mb-1">Dashboard</h2>
              <p className="text-gray-600 mb-0">Monitor your business performance with custom KPIs</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={loadDashboards}
                className="dashboard-btn dashboard-btn-primary flex items-center"
              >
                <BarChart3 className="mr-2" size={16} />
                Refresh Data
              </button>
              <button
                className="bg-white border border-orange-500 text-orange-500 px-4 py-2 rounded-lg hover:bg-orange-50 flex items-center"
                onClick={() => setShowCreateModal(true)}
              >
                <Plus className="mr-2" size={16} />
                New Dashboard
              </button>
              {currentDashboard && (
                <button
                  className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 flex items-center"
                  onClick={() => {
                    setFormData({
                      name: currentDashboard.name,
                      description: currentDashboard.description || '',
                      isDefault: currentDashboard.isDefault
                    });
                    setShowEditModal(true);
                  }}
                >
                  <Edit className="mr-2" size={16} />
                  Edit
                </button>
              )}
            </div>
          </div>
        </div>
        </div>
      </div>
      

      {/* Dashboard Selector */}
      {dashboards.length > 1 && (
        <div className="mb-6">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex gap-2 flex-wrap">
              {dashboards.map(dashboard => (
                <button
                  key={dashboard._id}
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    currentDashboard?._id === dashboard._id
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  onClick={() => setCurrentDashboard(dashboard)}
                >
                  {dashboard.name}
                  {dashboard.isDefault && ' (Default)'}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Dashboard Widgets */}
      {currentDashboard ? (
        <div className="dashboard-grid space-y-6">
          {/* KPI Cards Row */}
          <div className="dashboard-kpi-grid">
            {currentDashboard.widgets
              .filter(widget => widget.isActive && widget.type === 'kpi')
              .map(widget => (
                <div key={widget.id} className="dashboard-card" style={{ minHeight: '128px' }}>
                  {renderWidget(widget)}
                </div>
              ))}
          </div>

          {/* Chart Widgets */}
          <div className="dashboard-chart-grid">
            {currentDashboard.widgets
              .filter(widget => widget.isActive && widget.type === 'chart')
              .map(widget => (
                <div key={widget.id} className="dashboard-card" style={{ minHeight: '384px' }}>
                  {renderWidget(widget)}
                </div>
              ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="bg-white rounded-lg shadow-sm p-8 max-w-md mx-auto">
            <BarChart3 size={48} className="text-gray-400 mb-4 mx-auto" />
            <h4 className="text-lg font-semibold mb-2">No Dashboards Found</h4>
            <p className="text-gray-600 mb-4">Create your first dashboard to start monitoring your business metrics.</p>
            <button
              className="bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600 flex items-center mx-auto"
              onClick={() => setShowCreateModal(true)}
            >
              <Plus className="mr-2" size={16} />
              Create Dashboard
            </button>
          </div>
        </div>
      )}

      {/* Create Dashboard Modal */}
      {showCreateModal && (
        <div className="dashboard-modal">
          <div className="dashboard-modal-content">
            <div className="flex justify-between items-center mb-4">
              <h3 className="dashboard-text text-lg font-semibold">Create New Dashboard</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <Trash2 size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateDashboard}>
              <div className="dashboard-form-group">
                <label className="dashboard-form-label">
                  Dashboard Name
                </label>
                <input
                  type="text"
                  className="dashboard-form-input"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>
              <div className="dashboard-form-group">
                <label className="dashboard-form-label">
                  Description
                </label>
                <textarea
                  rows={3}
                  className="dashboard-form-input"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                />
              </div>
              <div className="dashboard-form-group">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    className="mr-2"
                    checked={formData.isDefault}
                    onChange={(e) => setFormData({...formData, isDefault: e.target.checked})}
                  />
                  <span className="text-sm text-gray-700">Set as default dashboard</span>
                </label>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="dashboard-btn dashboard-btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="dashboard-btn dashboard-btn-primary flex items-center"
                >
                  {saving && <div className="dashboard-spinner mr-2"></div>}
                  Create Dashboard
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Dashboard Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Edit Dashboard</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <Trash2 size={20} />
              </button>
            </div>
            <form onSubmit={handleUpdateDashboard}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dashboard Name
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                />
              </div>
              <div className="mb-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    className="mr-2"
                    checked={formData.isDefault}
                    onChange={(e) => setFormData({...formData, isDefault: e.target.checked})}
                  />
                  <span className="text-sm text-gray-700">Set as default dashboard</span>
                </label>
              </div>
              <div className="flex justify-between gap-2">
                <button
                  type="button"
                  onClick={() => handleDeleteDashboard(currentDashboard)}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 flex items-center"
                >
                  <Trash2 className="mr-2" size={16} />
                  Delete
                </button>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 flex items-center"
                  >
                    {saving && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>}
                    Update Dashboard
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default Dashboard;