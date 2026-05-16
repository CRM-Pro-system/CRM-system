// frontend/src/pages/agent/Leads.js

import React, { useEffect, useMemo, useState } from "react";
import {
  Search,
  Plus,
  Mail,
  Phone,
  MessageCircle,
  LayoutGrid,
  Table as TableIcon,
  ArrowRightLeft,
  Calendar,
  StickyNote,
} from "lucide-react";

import { clientsAPI } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";

const LEAD_STATUSES = [
  "New",
  "Contacted",
  "Unqualified",
  "Qualified",
  "Converted",
];

const LEAD_RATINGS = ["Cold", "Warm", "Hot"];

const statusColors = {
  New: "bg-blue-100 text-blue-700",
  Contacted: "bg-yellow-100 text-yellow-700",
  Unqualified: "bg-red-100 text-red-700",
  Qualified: "bg-green-100 text-green-700",
  Converted: "bg-emerald-100 text-emerald-700",
};

const ratingColors = {
  Cold: "bg-slate-100 text-slate-700",
  Warm: "bg-orange-100 text-orange-700",
  Hot: "bg-red-100 text-red-700",
};

export default function Leads() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  const [viewMode, setViewMode] = useState("table");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [showModal, setShowModal] = useState(false);

  const [formData, setFormData] = useState({
    contactName: "",
    telephone: "",
    email: "",
    position: "",
    companyName: "",
    companyEmail: "",
    rating: "Cold",
    leadStatus: "New",
  });

  useEffect(() => {
    fetchLeads();
  }, []);

  const { user } = useAuth();

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const response = await clientsAPI.getAll({ status: 'prospect', limit: 500 });
      const allClients = response?.data?.clients || response?.data || [];
      setLeads(allClients);
    } catch (error) {
      console.error("Error fetching leads:", error);
      toast.error("Failed to load leads");
    } finally {
      setLoading(false);
    }
  };

  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      // support both contactName (lead-specific) and name (existing client field)
      const displayName = lead.contactName || lead.name || '';
      const displayCompany = lead.companyName || lead.company || '';

      const matchesSearch =
        displayName.toLowerCase().includes(search.toLowerCase()) ||
        displayCompany.toLowerCase().includes(search.toLowerCase()) ||
        (lead.email || '').toLowerCase().includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === "All" ||
        lead.leadStatus === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [leads, search, statusFilter]);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleCreateLead = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        // map lead fields to existing Client model fields
        name: formData.contactName,
        phone: formData.telephone,
        email: formData.email,
        position: formData.position,
        company: formData.companyName,
        // lead-specific fields stored in Client model
        contactName: formData.contactName,
        telephone: formData.telephone,
        companyName: formData.companyName,
        companyEmail: formData.companyEmail,
        rating: formData.rating,
        leadStatus: formData.leadStatus,
        status: 'prospect',
        agent: user?._id || user?.id,
      };
      const response = await clientsAPI.create(payload);
      setLeads((prev) => [response.data, ...prev]);
      toast.success('Lead created successfully!');
      setShowModal(false);
      setFormData({
        contactName: '', telephone: '', email: '',
        position: '', companyName: '', companyEmail: '',
        rating: 'Cold', leadStatus: 'New',
      });
    } catch (error) {
      console.error('Error creating lead:', error);
      toast.error(error.response?.data?.message || 'Failed to create lead');
    }
  };

  const handleStatusChange = async (leadId, newStatus) => {
    // optimistic update
    setLeads((prev) =>
      prev.map((lead) =>
        lead._id === leadId
          ? { ...lead, leadStatus: newStatus, status: newStatus === 'Converted' ? 'active' : 'prospect' }
          : lead
      )
    );
    try {
      await clientsAPI.update(leadId, {
        leadStatus: newStatus,
        status: newStatus === 'Converted' ? 'active' : 'prospect',
      });
      if (newStatus === 'Converted') {
        toast.success('Lead converted to active client!');
        // remove from leads list since it\'s now active
        setLeads((prev) => prev.filter((l) => l._id !== leadId));
      }
    } catch (error) {
      console.error('Error updating lead:', error);
      toast.error('Failed to update lead status');
      fetchLeads(); // revert on error
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">
            Leads Management
          </h1>

          <p className="text-slate-500 mt-1">
            Track, qualify and convert potential clients.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-xl transition-all"
        >
          <Plus size={18} />
          Create Lead
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <p className="text-sm text-slate-500">Total Leads</p>
          <h2 className="text-3xl font-bold mt-2">
            {leads.length}
          </h2>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-5">
          <p className="text-sm text-slate-500">Hot Leads</p>
          <h2 className="text-3xl font-bold mt-2 text-red-600">
            {
              leads.filter((lead) => lead.rating === "Hot")
                .length
            }
          </h2>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-5">
          <p className="text-sm text-slate-500">
            Qualified Leads
          </p>
          <h2 className="text-3xl font-bold mt-2 text-green-600">
            {
              leads.filter(
                (lead) => lead.leadStatus === "Qualified"
              ).length
            }
          </h2>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-5">
          <p className="text-sm text-slate-500">
            Converted Leads
          </p>
          <h2 className="text-3xl font-bold mt-2 text-emerald-600">
            {
              leads.filter(
                (lead) => lead.leadStatus === "Converted"
              ).length
            }
          </h2>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-2xl shadow-sm p-5">
        <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
          <div className="relative w-full lg:w-96">
            <Search
              className="absolute left-3 top-3 text-slate-400"
              size={18}
            />

            <input
              type="text"
              placeholder="Search leads..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border border-slate-200 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex gap-3 flex-wrap">
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value)
              }
              className="border border-slate-200 rounded-xl px-4 py-3"
            >
              <option value="All">All Statuses</option>

              {LEAD_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>

            <div className="flex bg-slate-100 rounded-xl p-1">
              <button
                onClick={() => setViewMode("table")}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                  viewMode === "table"
                    ? "bg-white shadow-sm"
                    : ""
                }`}
              >
                <TableIcon size={16} />
                Table
              </button>

              <button
                onClick={() => setViewMode("kanban")}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                  viewMode === "kanban"
                    ? "bg-white shadow-sm"
                    : ""
                }`}
              >
                <LayoutGrid size={16} />
                Kanban
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* TABLE VIEW */}
      {viewMode === "table" && (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left px-6 py-4">
                    Contact
                  </th>
                  <th className="text-left px-6 py-4">
                    Company
                  </th>
                  <th className="text-left px-6 py-4">
                    Rating
                  </th>
                  <th className="text-left px-6 py-4">
                    Status
                  </th>
                  <th className="text-left px-6 py-4">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredLeads.map((lead) => (
                  <tr
                    key={lead._id}
                    className="border-t border-slate-100"
                  >
                    <td className="px-6 py-5">
                      <div>
                        <h3 className="font-semibold text-slate-800">
                          {lead.contactName || lead.name}
                        </h3>

                        <p className="text-sm text-slate-500">
                          {lead.email}
                        </p>

                        <p className="text-sm text-slate-500">
                          {lead.telephone || lead.phone}
                        </p>
                      </div>
                    </td>

                    <td className="px-6 py-5">
                      <div>
                        <h3 className="font-medium">
                          {lead.companyName || lead.company}
                        </h3>

                        <p className="text-sm text-slate-500">
                          {lead.position}
                        </p>
                      </div>
                    </td>

                    <td className="px-6 py-5">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          ratingColors[
                            lead.rating || "Cold"
                          ]
                        }`}
                      >
                        {lead.rating || "Cold"}
                      </span>
                    </td>

                    <td className="px-6 py-5">
                      <select
                        value={lead.leadStatus || "New"}
                        onChange={(e) =>
                          handleStatusChange(
                            lead._id,
                            e.target.value
                          )
                        }
                        className={`px-3 py-2 rounded-lg text-sm font-medium border-0 ${
                          statusColors[
                            lead.leadStatus || "New"
                          ]
                        }`}
                      >
                        {LEAD_STATUSES.map((status) => (
                          <option
                            key={status}
                            value={status}
                          >
                            {status}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <button className="text-slate-500 hover:text-indigo-600">
                          <Phone size={18} />
                        </button>

                        <button className="text-slate-500 hover:text-indigo-600">
                          <Mail size={18} />
                        </button>

                        <button className="text-slate-500 hover:text-green-600">
                          <MessageCircle size={18} />
                        </button>

                        <button className="text-slate-500 hover:text-orange-600">
                          <StickyNote size={18} />
                        </button>

                        <button className="text-slate-500 hover:text-blue-600">
                          <Calendar size={18} />
                        </button>

                        <button className="text-slate-500 hover:text-purple-600">
                          <ArrowRightLeft size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {!loading && filteredLeads.length === 0 && (
              <div className="text-center py-16 text-slate-500">
                No leads found.
              </div>
            )}
          </div>
        </div>
      )}

      {/* KANBAN VIEW */}
      {viewMode === "kanban" && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          {LEAD_STATUSES.map((status) => (
            <div
              key={status}
              className="bg-slate-100 rounded-2xl p-4"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-slate-700">
                  {status}
                </h2>

                <span className="bg-white px-3 py-1 rounded-full text-sm">
                  {
                    filteredLeads.filter(
                      (lead) =>
                        (lead.leadStatus || "New") === status
                    ).length
                  }
                </span>
              </div>

              <div className="space-y-4">
                {filteredLeads
                  .filter(
                    (lead) =>
                      (lead.leadStatus || "New") === status
                  )
                  .map((lead) => (
                    <div
                      key={lead._id}
                      className="bg-white rounded-xl p-4 shadow-sm"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold">
                            {lead.contactName || lead.name}
                          </h3>

                          <p className="text-sm text-slate-500">
                            {lead.companyName || lead.company}
                          </p>
                        </div>

                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            ratingColors[
                              lead.rating || "Cold"
                            ]
                          }`}
                        >
                          {lead.rating || "Cold"}
                        </span>
                      </div>

                      <div className="mt-4 flex gap-3">
                        <button className="text-slate-500 hover:text-indigo-600">
                          <Phone size={16} />
                        </button>

                        <button className="text-slate-500 hover:text-indigo-600">
                          <Mail size={16} />
                        </button>

                        <button className="text-slate-500 hover:text-green-600">
                          <MessageCircle size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE LEAD MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-3xl p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold">
                  Create New Lead
                </h2>

                <p className="text-slate-500 mt-1">
                  Add a new prospect into the sales funnel.
                </p>
              </div>

              <button
                onClick={() => setShowModal(false)}
                className="text-slate-500 text-2xl"
              >
                ×
              </button>
            </div>

            <form
              onSubmit={handleCreateLead}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block mb-2 font-medium">
                    Contact Name
                  </label>

                  <input
                    type="text"
                    name="contactName"
                    value={formData.contactName}
                    onChange={handleInputChange}
                    required
                    className="w-full border border-slate-200 rounded-xl px-4 py-3"
                  />
                </div>

                <div>
                  <label className="block mb-2 font-medium">
                    Telephone
                  </label>

                  <input
                    type="text"
                    name="telephone"
                    value={formData.telephone}
                    onChange={handleInputChange}
                    required
                    className="w-full border border-slate-200 rounded-xl px-4 py-3"
                  />
                </div>

                <div>
                  <label className="block mb-2 font-medium">
                    Email
                  </label>

                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full border border-slate-200 rounded-xl px-4 py-3"
                  />
                </div>

                <div>
                  <label className="block mb-2 font-medium">
                    Position
                  </label>

                  <input
                    type="text"
                    name="position"
                    value={formData.position}
                    onChange={handleInputChange}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3"
                  />
                </div>

                <div>
                  <label className="block mb-2 font-medium">
                    Company Name
                  </label>

                  <input
                    type="text"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleInputChange}
                    required
                    className="w-full border border-slate-200 rounded-xl px-4 py-3"
                  />
                </div>

                <div>
                  <label className="block mb-2 font-medium">
                    Company Email
                  </label>

                  <input
                    type="email"
                    name="companyEmail"
                    value={formData.companyEmail}
                    onChange={handleInputChange}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3"
                  />
                </div>

                <div>
                  <label className="block mb-2 font-medium">
                    Lead Rating
                  </label>

                  <select
                    name="rating"
                    value={formData.rating}
                    onChange={handleInputChange}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3"
                  >
                    {LEAD_RATINGS.map((rating) => (
                      <option
                        key={rating}
                        value={rating}
                      >
                        {rating}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block mb-2 font-medium">
                    Lead Status
                  </label>

                  <select
                    name="leadStatus"
                    value={formData.leadStatus}
                    onChange={handleInputChange}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3"
                  >
                    {LEAD_STATUSES.map((status) => (
                      <option
                        key={status}
                        value={status}
                      >
                        {status}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-3 rounded-xl border border-slate-300"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  Create Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}