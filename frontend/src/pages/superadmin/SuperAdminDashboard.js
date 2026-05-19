import React, { useEffect, useMemo, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Users, Target, TrendingUp, ShieldCheck, AlertCircle, CheckCircle, Clock, ArrowRight, Search, Download, FileSpreadsheet, FileText } from 'lucide-react';
import { tenantsAPI, usersAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import logo from '../../assets/logo.png';

const StatCard = ({ icon: Icon, title, value, subtitle, color = 'orange' }) => {
  const colors = {
    orange: 'bg-orange-50 text-orange-600',
    green: 'bg-green-50 text-green-600',
    blue: 'bg-blue-50 text-blue-600',
    red: 'bg-red-50 text-red-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    purple: 'bg-purple-50 text-purple-600',
  };
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-full ${colors[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
};

const StatusBadge = ({ status }) => {
  const styles = {
    active: 'bg-green-100 text-green-700',
    trial: 'bg-yellow-100 text-yellow-700',
    suspended: 'bg-red-100 text-red-700',
    inactive: 'bg-gray-100 text-gray-600',
  };
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || styles.inactive}`}>
      {status?.charAt(0).toUpperCase() + status?.slice(1)}
    </span>
  );
};

const SuperAdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tenants, setTenants] = useState([]);
  const [platformUsers, setPlatformUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userSearch, setUserSearch] = useState('');
  const [stats, setStats] = useState({
    total: 0, active: 0, trial: 0, suspended: 0,
    totalUsers: 0, totalClients: 0, totalDeals: 0,
    cancelledSubscriptions: 0, subscriptionValue: 0,
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [tenantsRes, usersRes] = await Promise.all([
        tenantsAPI.getAll(),
        usersAPI.getAll({ limit: 1000 }),
      ]);
      const allTenants = tenantsRes.data.tenants || [];

      // Count cancelled subscriptions across all tenants
      let cancelledCount = 0;
      let totalValue = 0;
      for (const tenant of allTenants) {
        const sub = tenant.subscription;
        if (sub) {
          if (sub.status === 'cancelled') {
            cancelledCount++;
          }
          if (sub.pricing) {
            const amt = sub.pricing.amount || 0;
            const interval = sub.pricing.interval;
            if (interval === 'monthly') {
              totalValue += amt;
            } else if (interval === 'yearly') {
              totalValue += amt / 12;
            }
          }
        }
      }

      // Retrieve platform users directly from the backend API
      const usersData = usersRes.data?.users || usersRes.data || [];

      const active = allTenants.filter(t => t.status === 'active').length;
      const trial = allTenants.filter(t => t.status === 'trial').length;
      const suspended = allTenants.filter(t => t.status === 'suspended').length;
      const totalUsers = usersData.length || allTenants.reduce((sum, t) => sum + (t.usage?.totalUsers || 0), 0);
      const totalClients = allTenants.reduce((sum, t) => sum + (t.usage?.totalClients || 0), 0);
      const totalDeals = allTenants.reduce((sum, t) => sum + (t.usage?.totalDeals || 0), 0);

      setStats({
        total: allTenants.length, active, trial, suspended,
        totalUsers, totalClients, totalDeals,
        cancelledSubscriptions: cancelledCount,
        subscriptionValue: totalValue,
      });
      setPlatformUsers(usersData);
      setTenants(allTenants);
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // ---- Export helpers ----
  const exportToCSV = (data, filename) => {
    if (!data.length) return;
    const headers = ['Name', 'Email', 'Role', 'Status', 'Tenant', 'Created'];
    const rows = data.map(u => [
      u.name || '',
      u.email || '',
      u.role || '',
      u.isActive !== false ? 'Active' : 'Inactive',
      u.tenantName || u.tenant?.name || '',
      u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '',
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${filename}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const exportToPDF = (filename) => {
    document.title = filename;
    setTimeout(() => window.print(), 300);
    setTimeout(() => { document.title = 'Super Admin Dashboard'; }, 5000);
  };

  const filteredPlatformUsers = useMemo(() => {
    if (!userSearch.trim()) return platformUsers;
    const q = userSearch.toLowerCase();
    return platformUsers.filter(
      u =>
        (u.name || '').toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q) ||
        (u.role || '').toLowerCase().includes(q)
    );
  }, [platformUsers, userSearch]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-3 rounded-xl">
            <img src={logo} alt="Logo" className="w-8 h-8 object-contain" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Super Admin Dashboard</h1>
            <p className="text-gray-600 mt-1">Welcome back, {user?.name} — Platform Overview</p>
          </div>
        </div>
        <button
          onClick={() => navigate('/superadmin/tenants')}
          className="flex items-center space-x-2 bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-xl font-medium transition-colors shadow-sm"
        >
          <Building2 className="w-4 h-4" />
          <span>Manage Tenants</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Platform Stats — 4 spec-required cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Building2} title="Tenants" value={stats.total} subtitle="Organizations on the platform" color="orange" />
        <StatCard icon={Users} title="Users" value={stats.totalUsers} subtitle="All time across all tenants" color="blue" />
        <StatCard icon={AlertCircle} title="Cancelled Subscriptions" value={stats.cancelledSubscriptions} subtitle="Tenants with cancelled plan" color="red" />
        <StatCard icon={TrendingUp} title="Value of Subscriptions" value={`$${stats.subscriptionValue.toLocaleString()}`} subtitle="Monthly recurring revenue (USD)" color="green" />
      </div>

      {/* Tenant Status Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-50 rounded-lg"><CheckCircle className="w-5 h-5 text-green-600" /></div>
            <div>
              <p className="text-sm text-gray-600">Active Organizations</p>
              <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-yellow-50 rounded-lg"><Clock className="w-5 h-5 text-yellow-600" /></div>
            <div>
              <p className="text-sm text-gray-600">On Trial</p>
              <p className="text-2xl font-bold text-gray-900">{stats.trial}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-50 rounded-lg"><AlertCircle className="w-5 h-5 text-red-600" /></div>
            <div>
              <p className="text-sm text-gray-600">Suspended</p>
              <p className="text-2xl font-bold text-gray-900">{stats.suspended}</p>
            </div>
          </div>
        </div>
      </div>

      {/* All Users Table with Export */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">All Users</h2>
          <div className="flex gap-3">
            <button
              onClick={() => exportToCSV(platformUsers, 'all-users')}
              className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 text-sm font-medium rounded-xl hover:bg-green-100 transition-colors"
            >
              <FileSpreadsheet size={16} /> Excel
            </button>
            <button
              onClick={() => exportToPDF('all-users-report')}
              className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 text-sm font-medium rounded-xl hover:bg-blue-100 transition-colors"
            >
              <FileText size={16} /> PDF
            </button>
          </div>
        </div>
        <div className="p-4 border-b border-gray-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search users by name, email, or role..."
              onChange={(e) => setUserSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Tenant</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredPlatformUsers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-500">No users found</td>
                </tr>
              ) : (
                filteredPlatformUsers
                  .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                  .map((user) => (
                    <tr key={user._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-orange-600 font-semibold text-xs">
                              {user.name?.charAt(0).toUpperCase() || '?'}
                            </span>
                          </div>
                          <span className="font-medium text-gray-900">{user.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-700 text-sm">{user.email}</td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-purple-100 text-purple-700 capitalize">{user.role}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${user.isActive === false ? 'bg-gray-100 text-gray-600' : 'bg-green-100 text-green-700'}`}>
                          {user.isActive === false ? 'Inactive' : 'Active'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-700 text-sm">{user.tenantName || user.tenant?.name || '-'}</td>
                      <td className="px-6 py-4 text-gray-500 text-sm">{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-'}</td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Tenants Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">All Organizations</h2>
          <button
            onClick={() => navigate('/superadmin/tenants')}
            className="text-orange-600 hover:text-orange-700 text-sm font-medium flex items-center space-x-1"
          >
            <span>View All</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Organization</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Users</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Clients</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Deals</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {tenants.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                    No organizations found
                  </td>
                </tr>
              ) : (
                tenants.map((tenant) => (
                  <tr key={tenant._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 bg-orange-100 rounded-full flex items-center justify-center">
                          <span className="text-orange-600 font-semibold text-sm">
                            {tenant.name?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{tenant.name}</p>
                          <p className="text-xs text-gray-500">{tenant.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4"><StatusBadge status={tenant.status} /></td>
                    <td className="px-6 py-4 text-gray-700">{tenant.usage?.totalUsers || 0}</td>
                    <td className="px-6 py-4 text-gray-700">{tenant.usage?.totalClients || 0}</td>
                    <td className="px-6 py-4 text-gray-700">{tenant.usage?.totalDeals || 0}</td>
                    <td className="px-6 py-4 text-gray-500 text-sm">
                      {new Date(tenant.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Super Admin Info Card */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-6 text-white">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-white/20 rounded-xl">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold">Super Admin Access</h3>
            <p className="text-orange-100 text-sm mt-1">
              You have full platform access. You can create organizations, manage subscriptions, and view all data across the platform.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;