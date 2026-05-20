// frontend/src/pages/agent/Leads.js
import React, { useEffect, useMemo, useState } from "react";
import {
  Search, Plus, Mail, MessageCircle,
  LayoutGrid, Table as TableIcon, ArrowRightLeft,
  Calendar, StickyNote, X, Send, Users, CheckSquare,
  ChevronDown, Flame, Thermometer, Snowflake, Star,
  TrendingUp, UserCheck, AlertCircle, Filter, MoreHorizontal,
  Clock, Building2, User, Hash, RefreshCw,
} from "lucide-react";
import { clientsAPI, usersAPI } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";

const LEAD_STATUSES = ["New", "Contacted", "Unqualified", "Qualified", "Converted"];
const LEAD_RATINGS  = ["Cold", "Warm", "Hot"];

const STATUS_META = {
  New:         { color: "bg-amber-50 text-amber-700 border border-amber-200",         dot: "bg-amber-400",   label: "New"         },
  Contacted:   { color: "bg-sky-50 text-sky-700 border border-sky-200",               dot: "bg-sky-400",     label: "Contacted"   },
  Unqualified: { color: "bg-rose-50 text-rose-700 border border-rose-200",            dot: "bg-rose-400",    label: "Unqualified" },
  Qualified:   { color: "bg-emerald-50 text-emerald-700 border border-emerald-200",   dot: "bg-emerald-400", label: "Qualified"   },
  Converted:   { color: "bg-violet-50 text-violet-700 border border-violet-200",      dot: "bg-violet-500",  label: "Converted"   },
};

const RATING_META = {
  Cold: { color: "bg-slate-100 text-slate-600 border border-slate-200", icon: Snowflake,   iconColor: "text-sky-400"    },
  Warm: { color: "bg-orange-50 text-orange-600 border border-orange-200", icon: Thermometer, iconColor: "text-orange-400" },
  Hot:  { color: "bg-red-50 text-red-600 border border-red-200",         icon: Flame,       iconColor: "text-red-500"    },
};

const KANBAN_COLORS = {
  New:         { header: "bg-amber-500",   bg: "bg-amber-50",   border: "border-amber-200"   },
  Contacted:   { header: "bg-sky-500",     bg: "bg-sky-50",     border: "border-sky-200"     },
  Unqualified: { header: "bg-rose-500",    bg: "bg-rose-50",    border: "border-rose-200"    },
  Qualified:   { header: "bg-emerald-500", bg: "bg-emerald-50", border: "border-emerald-200" },
  Converted:   { header: "bg-violet-500",  bg: "bg-violet-50",  border: "border-violet-200"  },
};

// ── Utility: avatar initials ───────────────────────────────────────────────
function Avatar({ name, size = "md" }) {
  const initials = (name || "?").split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase();
  const sz = size === "sm" ? "w-8 h-8 text-xs" : "w-10 h-10 text-sm";
  const colors = [
    "from-orange-400 to-rose-500",
    "from-sky-400 to-indigo-500",
    "from-emerald-400 to-teal-500",
    "from-violet-400 to-purple-500",
    "from-amber-400 to-orange-500",
  ];
  const idx = (name || "").charCodeAt(0) % colors.length;
  return (
    <div className={`${sz} rounded-xl bg-gradient-to-br ${colors[idx]} flex items-center justify-center text-white font-bold flex-shrink-0`}>
      {initials}
    </div>
  );
}

// ── Action icon button ─────────────────────────────────────────────────────
function ActionBtn({ onClick, title, icon: Icon, hoverClass = "hover:bg-slate-100 hover:text-slate-800" }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 transition-all duration-150 ${hoverClass}`}
    >
      <Icon size={15} />
    </button>
  );
}

// ── Modal wrapper ──────────────────────────────────────────────────────────
function Modal({ open, onClose, title, subtitle, children, maxW = "max-w-lg" }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(15,23,42,0.55)", backdropFilter: "blur(4px)" }}>
      <div className={`bg-white rounded-2xl w-full ${maxW} shadow-2xl animate-in`} style={{ animation: "modalIn 0.18s ease" }}>
        <div className="flex items-start justify-between p-6 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-800">{title}</h2>
            {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 transition-colors ml-4 mt-0.5">
            <X size={17} />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
      <style>{`@keyframes modalIn { from { opacity:0; transform:translateY(12px) scale(0.98); } to { opacity:1; transform:translateY(0) scale(1); } }`}</style>
    </div>
  );
}

// ── Form field wrappers ────────────────────────────────────────────────────
function Field({ label, children, required }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-slate-700 mb-1.5">
        {label}{required && <span className="text-rose-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls = "w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all bg-slate-50 focus:bg-white placeholder:text-slate-400";
const selectCls = `${inputCls} cursor-pointer appearance-none`;

// ── Main component ─────────────────────────────────────────────────────────
export default function Leads() {
  const { user } = useAuth();
  const [leads,   setLeads]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("table");
  const [search,   setSearch]  = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [ratingFilter, setRatingFilter] = useState("All");

  // ── Create modal ──
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ contactName:"", telephone:"", email:"", position:"", companyName:"", companyEmail:"", rating:"Cold", leadStatus:"New" });

  // ── Email modal ──
  const [emailModal, setEmailModal] = useState({ open:false, lead:null });
  const [emailForm,  setEmailForm]  = useState({ subject:"", message:"" });
  const [sendingEmail, setSendingEmail] = useState(false);

  // ── Note modal ──
  const [noteModal, setNoteModal] = useState({ open:false, lead:null });
  const [noteText,  setNoteText]  = useState("");
  const [savingNote, setSavingNote] = useState(false);

  // ── Task modal ──
  const [taskModal, setTaskModal] = useState({ open:false, lead:null });
  const [taskForm,  setTaskForm]  = useState({ title:"", dueDate:"", priority:"Medium" });
  const [savingTask, setSavingTask] = useState(false);

  // ── Forward modal ──
  const [fwdModal,  setFwdModal]  = useState({ open:false, lead:null });
  const [agents,    setAgents]    = useState([]);
  const [selAgent,  setSelAgent]  = useState("");
  const [forwarding, setForwarding] = useState(false);

// ── Row action menu ──
   const [openMenu, setOpenMenu] = useState(null);

   useEffect(() => { fetchLeads(); }, []);
  useEffect(() => {
    const close = () => setOpenMenu(null);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const res = await clientsAPI.getAll({ status:"prospect", limit:500 });
      setLeads(res?.data?.clients || res?.data || []);
    } catch { toast.error("Failed to load leads"); }
    finally { setLoading(false); }
  };

  const filtered = useMemo(() => leads.filter(l => {
    const name    = (l.contactName || l.name || "").toLowerCase();
    const company = (l.companyName || l.company || "").toLowerCase();
    const email   = (l.email || "").toLowerCase();
    const q       = search.toLowerCase();
    const matchSearch = !q || name.includes(q) || company.includes(q) || email.includes(q);
    const matchStatus = statusFilter === "All" || (l.leadStatus || "New") === statusFilter;
    const matchRating = ratingFilter === "All" || (l.rating || "Cold") === ratingFilter;
    return matchSearch && matchStatus && matchRating;
  }), [leads, search, statusFilter, ratingFilter]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: form.contactName,
        phone: form.telephone,
        email: form.email,
        position: form.position,
        company: form.companyName,
        rating: form.rating,
        leadStatus: form.leadStatus,
        status: "prospect",
        agent: user?.id || user?._id
      };
      const res = await clientsAPI.create(payload);
      setLeads(p => [res.data, ...p]);
      toast.success("Lead created!");
      setShowCreate(false);
      setForm({ contactName:"", telephone:"", email:"", position:"", companyName:"", companyEmail:"", rating:"Cold", leadStatus:"New" });
    } catch (err) { toast.error(err.response?.data?.message || "Failed to create lead"); }
  };

  const handleStatusChange = async (id, status) => {
    setLeads(p => p.map(l => l._id===id ? {...l, leadStatus:status, status:status==="Converted"?"active":"prospect"} : l));
    try {
      await clientsAPI.update(id, { leadStatus:status, status:status==="Converted"?"active":"prospect" });
      if (status==="Converted") { toast.success("Lead converted to active client! 🎉"); setLeads(p=>p.filter(l=>l._id!==id)); }
    } catch { toast.error("Failed to update status"); fetchLeads(); }
  };

const handleWhatsApp = (lead) => {
    const n = (lead.telephone||lead.phone||"").replace(/\D/g,"");
    if (!n) return toast.error("No phone number");
    window.open(`https://wa.me/${n}?text=Hello ${encodeURIComponent(lead.contactName||lead.name||"")}`, "_blank");
  };

  const handleSendEmail = async (e) => {
    e.preventDefault();
    if (!emailForm.subject.trim() || !emailForm.message.trim()) return toast.error("Subject and message required");
    setSendingEmail(true);
    try {
      await clientsAPI.sendEmail(emailModal.lead._id, emailForm);
      toast.success("Email sent!");
      setEmailModal({ open:false, lead:null });
    } catch { toast.error("Failed to send email"); }
    finally { setSendingEmail(false); }
  };

  const handleSaveNote = async (e) => {
    e.preventDefault();
    if (!noteText.trim()) return toast.error("Note cannot be empty");
    setSavingNote(true);
    try {
      await clientsAPI.addInteraction(noteModal.lead._id, { type:"other", notes:noteText });
      toast.success("Note saved!");
      setNoteModal({ open:false, lead:null });
      setNoteText("");
    } catch { toast.error("Failed to save note"); }
    finally { setSavingNote(false); }
  };

  const handleSaveTask = async (e) => {
    e.preventDefault();
    if (!taskForm.title.trim()) return toast.error("Task title required");
    setSavingTask(true);
    try {
      await clientsAPI.addInteraction(taskModal.lead._id, { type:"task", notes:`Task: ${taskForm.title} | Due: ${taskForm.dueDate} | Priority: ${taskForm.priority}` });
      toast.success("Task created!");
      setTaskModal({ open:false, lead:null });
      setTaskForm({ title:"", dueDate:"", priority:"Medium" });
    } catch { toast.error("Failed to create task"); }
    finally { setSavingTask(false); }
  };

  const handleOpenForward = async (lead) => {
    setFwdModal({ open:true, lead });
    setSelAgent("");
    try {
      const res = await usersAPI.getAll();
      const all = Array.isArray(res.data) ? res.data : (res.data?.users||[]);
      setAgents(all.filter(u=>u.role==="agent" && u._id!==user?.id && u.id!==user?.id));
    } catch { toast.error("Failed to load agents"); }
  };

  const handleForward = async (e) => {
    e.preventDefault();
    if (!selAgent) return toast.error("Please select an agent");
    setForwarding(true);
    try {
      await clientsAPI.update(fwdModal.lead._id, { agent:selAgent });
      toast.success("Lead forwarded!");
      setLeads(p=>p.filter(l=>l._id!==fwdModal.lead._id));
      setFwdModal({ open:false, lead:null });
    } catch { toast.error("Failed to forward lead"); }
    finally { setForwarding(false); }
  };

  const handleEvent = (lead) => {
    window.location.href = `/agent/schedules?leadId=${lead._id}&leadName=${encodeURIComponent(lead.contactName||lead.name||"")}`;
  };

  // ── Stats ─────────────────────────────────────────────────────────────────
  const stats = useMemo(() => ({
    total:     leads.length,
    hot:       leads.filter(l=>l.rating==="Hot").length,
    qualified: leads.filter(l=>l.leadStatus==="Qualified").length,
    converted: leads.filter(l=>l.leadStatus==="Converted").length,
  }), [leads]);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50 p-6 space-y-6 font-sans">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        .font-sans { font-family: 'Plus Jakarta Sans', sans-serif; }
        .table-row-hover:hover { background: #fafafa; }
        .status-select { -webkit-appearance: none; appearance: none; }
        .kanban-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.08); }
        .kanban-card { transition: all 0.18s ease; }
        .action-btn:hover { transform: scale(1.08); }
        .action-btn { transition: all 0.15s ease; }
        .stat-card { transition: all 0.2s ease; }
        .stat-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.08); }
      `}</style>

      {/* ── Header ── */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-rose-500 flex items-center justify-center shadow-lg shadow-orange-200">
              <TrendingUp size={20} className="text-white" />
            </div>
            <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Leads</h1>
          </div>
          <p className="text-sm text-slate-500 pl-13 ml-13" style={{ marginLeft: "52px" }}>Track, qualify and convert your prospects</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white px-5 py-3 rounded-xl font-semibold text-sm shadow-lg shadow-orange-200 transition-all duration-200 hover:shadow-orange-300 hover:-translate-y-0.5 self-start lg:self-auto"
        >
          <Plus size={17} />
          New Lead
        </button>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label:"Total Leads",   value:stats.total,     icon:Users,     gradient:"from-slate-700 to-slate-900",   shadow:"shadow-slate-200" },
          { label:"Hot Leads",     value:stats.hot,       icon:Flame,     gradient:"from-rose-500 to-red-600",      shadow:"shadow-rose-200"  },
          { label:"Qualified",     value:stats.qualified, icon:UserCheck, gradient:"from-emerald-500 to-teal-600",  shadow:"shadow-emerald-200"},
          { label:"Converted",     value:stats.converted, icon:Star,      gradient:"from-violet-500 to-purple-600", shadow:"shadow-violet-200" },
        ].map(({ label, value, icon: Icon, gradient, shadow }) => (
          <div key={label} className={`stat-card bg-white rounded-2xl p-5 shadow-sm border border-slate-100 relative overflow-hidden`}>
            <div className={`absolute -right-3 -top-3 w-20 h-20 rounded-full bg-gradient-to-br ${gradient} opacity-[0.07]`} />
            <div className={`inline-flex w-9 h-9 rounded-xl bg-gradient-to-br ${gradient} items-center justify-center mb-3 shadow-md ${shadow}`}>
              <Icon size={16} className="text-white" />
            </div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</p>
            <p className="text-3xl font-extrabold text-slate-800 mt-1 tracking-tight">{loading ? "—" : value}</p>
          </div>
        ))}
      </div>

      {/* ── Controls ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
        <div className="flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
          <div className="relative w-full lg:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search by name, company, email…"
              value={search}
              onChange={e=>setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent bg-slate-50 focus:bg-white transition-all placeholder:text-slate-400"
            />
          </div>
          <div className="flex gap-2.5 flex-wrap items-center">
            <div className="relative">
              <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}
                className="pl-8 pr-8 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 bg-slate-50 appearance-none cursor-pointer font-medium text-slate-700">
                <option value="All">All Statuses</option>
                {LEAD_STATUSES.map(s=><option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="relative">
              <Flame size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <select value={ratingFilter} onChange={e=>setRatingFilter(e.target.value)}
                className="pl-8 pr-8 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 bg-slate-50 appearance-none cursor-pointer font-medium text-slate-700">
                <option value="All">All Ratings</option>
                {LEAD_RATINGS.map(r=><option key={r}>{r}</option>)}
              </select>
            </div>
            <div className="flex bg-slate-100 rounded-xl p-1 gap-0.5">
              {[["table",TableIcon,"Table"],["kanban",LayoutGrid,"Kanban"]].map(([mode,Icon,label])=>(
                <button key={mode} onClick={()=>setViewMode(mode)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all ${viewMode===mode?"bg-white text-slate-800 shadow-sm":"text-slate-500 hover:text-slate-700"}`}>
                  <Icon size={14} />{label}
                </button>
              ))}
            </div>
            <button onClick={fetchLeads} className="w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-slate-700 transition-colors" title="Refresh">
              <RefreshCw size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* ── TABLE VIEW ── */}
      {viewMode === "table" && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  {["Contact","Company","Rating","Status","Actions"].map(h=>(
                    <th key={h} className="text-left px-6 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-widest">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  [...Array(5)].map((_,i)=>(
                    <tr key={i}>
                      {[...Array(5)].map((_,j)=>(
                        <td key={j} className="px-6 py-5"><div className="h-4 bg-slate-100 rounded-full animate-pulse" style={{width:`${60+Math.random()*30}%`}} /></td>
                      ))}
                    </tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={5} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center">
                        <Users size={28} className="text-slate-300" />
                      </div>
                      <p className="font-semibold text-slate-500">No leads found</p>
                      <p className="text-sm text-slate-400">Try adjusting your filters or create a new lead</p>
                    </div>
                  </td></tr>
                ) : filtered.map(lead=>(
                  <tr key={lead._id} className="table-row-hover group">
                    {/* Contact */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar name={lead.contactName||lead.name} size="sm" />
                        <div>
                          <p className="font-semibold text-slate-800 text-sm">{lead.contactName||lead.name}</p>
                          <p className="text-xs text-slate-400 mt-0.5">{lead.email}</p>
                          <p className="text-xs text-slate-400">{lead.telephone||lead.phone}</p>
                        </div>
                      </div>
                    </td>
                    {/* Company */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                          <Building2 size={13} className="text-slate-500" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-700">{lead.companyName||lead.company||"—"}</p>
                          {lead.position && <p className="text-xs text-slate-400">{lead.position}</p>}
                        </div>
                      </div>
                    </td>
                    {/* Rating */}
                    <td className="px-6 py-4">
                      {(() => {
                        const r = lead.rating||"Cold";
                        const m = RATING_META[r]||RATING_META.Cold;
                        const Icon = m.icon;
                        return (
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${m.color}`}>
                            <Icon size={12} className={m.iconColor} />{r}
                          </span>
                        );
                      })()}
                    </td>
                    {/* Status */}
                    <td className="px-6 py-4">
                      <div className="relative inline-block">
                        <select
                          value={lead.leadStatus||"New"}
                          onChange={e=>handleStatusChange(lead._id,e.target.value)}
                          className={`status-select pl-2.5 pr-7 py-1.5 rounded-lg text-xs font-semibold cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-orange-400 ${STATUS_META[lead.leadStatus||"New"]?.color||STATUS_META.New.color}`}
                        >
                          {LEAD_STATUSES.map(s=><option key={s}>{s}</option>)}
                        </select>
                        <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-60" />
                      </div>
                    </td>
{/* Actions */}
                     <td className="px-6 py-4">
                       <div className="flex items-center gap-0.5">
                         <ActionBtn onClick={()=>{ setEmailModal({open:true,lead}); setEmailForm({subject:"",message:""}); }} title="Email"            icon={Mail}         hoverClass="hover:bg-orange-50 hover:text-orange-600" />
                         <ActionBtn onClick={()=>handleWhatsApp(lead)}                                          title="WhatsApp"         icon={MessageCircle} hoverClass="hover:bg-green-50 hover:text-green-600" />
                         <ActionBtn onClick={()=>{ setNoteModal({open:true,lead}); setNoteText(""); }}           title="Add Note"         icon={StickyNote}    hoverClass="hover:bg-yellow-50 hover:text-yellow-600" />
                         <ActionBtn onClick={()=>{ setTaskModal({open:true,lead}); setTaskForm({title:"",dueDate:"",priority:"Medium"}); }} title="Add Task" icon={CheckSquare}   hoverClass="hover:bg-indigo-50 hover:text-indigo-600" />
                         <ActionBtn onClick={()=>handleEvent(lead)}                                             title="Schedule Event"   icon={Calendar}      hoverClass="hover:bg-purple-50 hover:text-purple-600" />
                         <ActionBtn onClick={()=>handleOpenForward(lead)}                                       title="Forward to Agent" icon={ArrowRightLeft} hoverClass="hover:bg-rose-50 hover:text-rose-600" />
                       </div>
                     </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!loading && filtered.length > 0 && (
            <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <p className="text-xs text-slate-500 font-medium">Showing <span className="text-slate-700">{filtered.length}</span> of <span className="text-slate-700">{leads.length}</span> leads</p>
            </div>
          )}
        </div>
      )}

      {/* ── KANBAN VIEW ── */}
      {viewMode === "kanban" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {LEAD_STATUSES.map(status => {
            const col = KANBAN_COLORS[status];
            const cards = filtered.filter(l=>(l.leadStatus||"New")===status);
            return (
              <div key={status} className="rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-sm">
                <div className={`${col.header} px-4 py-3 flex items-center justify-between`}>
                  <span className="text-white font-bold text-sm">{status}</span>
                  <span className="bg-white/25 text-white text-xs font-bold px-2 py-0.5 rounded-full">{cards.length}</span>
                </div>
                <div className={`${col.bg} p-3 space-y-3 min-h-32`}>
                  {cards.length === 0 && (
                    <div className="flex items-center justify-center py-8">
                      <p className="text-xs text-slate-400 font-medium">No leads here</p>
                    </div>
                  )}
                  {cards.map(lead => {
                    const r = lead.rating||"Cold";
                    const rm = RATING_META[r]||RATING_META.Cold;
                    const RIcon = rm.icon;
                    return (
                      <div key={lead._id} className={`kanban-card bg-white rounded-xl p-3.5 border ${col.border} shadow-sm cursor-default`}>
                        <div className="flex items-start justify-between gap-2 mb-2.5">
                          <div className="flex items-center gap-2 min-w-0">
                            <Avatar name={lead.contactName||lead.name} size="sm" />
                            <div className="min-w-0">
                              <p className="font-bold text-slate-800 text-sm leading-tight truncate">{lead.contactName||lead.name}</p>
                              <p className="text-xs text-slate-400 truncate">{lead.companyName||lead.company||"—"}</p>
                            </div>
                          </div>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold flex-shrink-0 ${rm.color}`}>
                            <RIcon size={11} className={rm.iconColor} />{r}
                          </span>
                        </div>
                        {lead.position && (
                          <p className="text-xs text-slate-500 mb-2.5 flex items-center gap-1.5">
                            <User size={11} className="text-slate-400" />{lead.position}
                          </p>
                        )}
<div className="flex items-center gap-0.5 pt-2 border-t border-slate-100">
                           <ActionBtn onClick={()=>{ setEmailModal({open:true,lead}); setEmailForm({subject:"",message:""}); }} title="Email" icon={Mail}          hoverClass="hover:bg-orange-50 hover:text-orange-600" />
                           <ActionBtn onClick={()=>handleWhatsApp(lead)}                                               title="WhatsApp" icon={MessageCircle}  hoverClass="hover:bg-green-50 hover:text-green-600" />
                           <ActionBtn onClick={()=>{ setNoteModal({open:true,lead}); setNoteText(""); }}                title="Note"    icon={StickyNote}     hoverClass="hover:bg-yellow-50 hover:text-yellow-600" />
                           <ActionBtn onClick={()=>{ setTaskModal({open:true,lead}); setTaskForm({title:"",dueDate:"",priority:"Medium"}); }} title="Task" icon={CheckSquare}    hoverClass="hover:bg-indigo-50 hover:text-indigo-600" />
                           <ActionBtn onClick={()=>handleOpenForward(lead)}                                            title="Forward" icon={ArrowRightLeft}  hoverClass="hover:bg-rose-50 hover:text-rose-600" />
                         </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── CREATE LEAD MODAL ── */}
      <Modal open={showCreate} onClose={()=>setShowCreate(false)} title="Create New Lead" subtitle="Add a prospect to your sales funnel" maxW="max-w-2xl">
        <form onSubmit={handleCreate} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Contact Name" required><input name="contactName" value={form.contactName} onChange={e=>setForm(p=>({...p,contactName:e.target.value}))} required className={inputCls} placeholder="e.g. Jane Smith" /></Field>
            <Field label="Telephone" required><input name="telephone" value={form.telephone} onChange={e=>setForm(p=>({...p,telephone:e.target.value}))} required className={inputCls} placeholder="+256 700 000 000" /></Field>
            <Field label="Email" required><input type="email" value={form.email} onChange={e=>setForm(p=>({...p,email:e.target.value}))} required className={inputCls} placeholder="jane@example.com" /></Field>
            <Field label="Position"><input value={form.position} onChange={e=>setForm(p=>({...p,position:e.target.value}))} className={inputCls} placeholder="e.g. CEO" /></Field>
            <Field label="Company Name" required><input value={form.companyName} onChange={e=>setForm(p=>({...p,companyName:e.target.value}))} required className={inputCls} placeholder="Acme Corp" /></Field>
            <Field label="Company Email"><input type="email" value={form.companyEmail} onChange={e=>setForm(p=>({...p,companyEmail:e.target.value}))} className={inputCls} placeholder="info@acme.com" /></Field>
            <Field label="Lead Rating">
              <select value={form.rating} onChange={e=>setForm(p=>({...p,rating:e.target.value}))} className={selectCls}>
                {LEAD_RATINGS.map(r=><option key={r}>{r}</option>)}
              </select>
            </Field>
            <Field label="Lead Status">
              <select value={form.leadStatus} onChange={e=>setForm(p=>({...p,leadStatus:e.target.value}))} className={selectCls}>
                {LEAD_STATUSES.map(s=><option key={s}>{s}</option>)}
              </select>
            </Field>
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
            <button type="button" onClick={()=>setShowCreate(false)} className="px-5 py-2.5 text-sm font-semibold rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors">Cancel</button>
            <button type="submit" className="px-5 py-2.5 text-sm font-semibold rounded-xl bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white shadow-md shadow-orange-200 transition-all flex items-center gap-2">
              <Plus size={15} />Create Lead
            </button>
          </div>
        </form>
      </Modal>

      {/* ── EMAIL MODAL ── */}
      <Modal open={emailModal.open} onClose={()=>setEmailModal({open:false,lead:null})} title="Send Email" subtitle={emailModal.lead ? `To: ${emailModal.lead.contactName||emailModal.lead.name} · ${emailModal.lead.email}` : ""}>
        <form onSubmit={handleSendEmail} className="space-y-4">
          <Field label="Subject" required><input value={emailForm.subject} onChange={e=>setEmailForm(p=>({...p,subject:e.target.value}))} className={inputCls} placeholder="e.g. Following up on our conversation" /></Field>
          <Field label="Message" required>
            <textarea rows={6} value={emailForm.message} onChange={e=>setEmailForm(p=>({...p,message:e.target.value}))} className={`${inputCls} resize-none`} placeholder={`Dear ${emailModal.lead?.contactName||emailModal.lead?.name||""},\n\n`} />
          </Field>
          <div className="flex justify-end gap-3 pt-1">
            <button type="button" onClick={()=>setEmailModal({open:false,lead:null})} className="px-5 py-2.5 text-sm font-semibold rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors">Cancel</button>
            <button type="submit" disabled={sendingEmail} className="px-5 py-2.5 text-sm font-semibold rounded-xl bg-gradient-to-r from-orange-500 to-rose-500 text-white shadow-md shadow-orange-200 transition-all flex items-center gap-2 disabled:opacity-60">
              <Send size={14} />{sendingEmail?"Sending…":"Send Email"}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── NOTE MODAL ── */}
      <Modal open={noteModal.open} onClose={()=>setNoteModal({open:false,lead:null})} title="Add Note" subtitle={noteModal.lead?.contactName||noteModal.lead?.name}>
        <form onSubmit={handleSaveNote} className="space-y-4">
          <textarea rows={5} value={noteText} onChange={e=>setNoteText(e.target.value)} className={`${inputCls} resize-none`} placeholder="Write your note here…" autoFocus />
          <div className="flex justify-end gap-3">
            <button type="button" onClick={()=>setNoteModal({open:false,lead:null})} className="px-5 py-2.5 text-sm font-semibold rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors">Cancel</button>
            <button type="submit" disabled={savingNote} className="px-5 py-2.5 text-sm font-semibold rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md shadow-amber-200 transition-all flex items-center gap-2 disabled:opacity-60">
              <StickyNote size={14} />{savingNote?"Saving…":"Save Note"}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── TASK MODAL ── */}
      <Modal open={taskModal.open} onClose={()=>setTaskModal({open:false,lead:null})} title="Create Task" subtitle={taskModal.lead?.contactName||taskModal.lead?.name}>
        <form onSubmit={handleSaveTask} className="space-y-4">
          <Field label="Task Title" required><input value={taskForm.title} onChange={e=>setTaskForm(p=>({...p,title:e.target.value}))} className={inputCls} placeholder="e.g. Follow up call" autoFocus /></Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Due Date"><input type="date" value={taskForm.dueDate} onChange={e=>setTaskForm(p=>({...p,dueDate:e.target.value}))} className={inputCls} /></Field>
            <Field label="Priority">
              <select value={taskForm.priority} onChange={e=>setTaskForm(p=>({...p,priority:e.target.value}))} className={selectCls}>
                {["Low","Medium","High"].map(p=><option key={p}>{p}</option>)}
              </select>
            </Field>
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={()=>setTaskModal({open:false,lead:null})} className="px-5 py-2.5 text-sm font-semibold rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors">Cancel</button>
            <button type="submit" disabled={savingTask} className="px-5 py-2.5 text-sm font-semibold rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-md shadow-indigo-200 transition-all flex items-center gap-2 disabled:opacity-60">
              <CheckSquare size={14} />{savingTask?"Saving…":"Create Task"}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── FORWARD MODAL ── */}
      <Modal open={fwdModal.open} onClose={()=>setFwdModal({open:false,lead:null})} title="Forward Lead" subtitle={fwdModal.lead ? `Reassign ${fwdModal.lead.contactName||fwdModal.lead.name} to another agent` : ""}>
        <form onSubmit={handleForward} className="space-y-4">
          <Field label="Select Agent" required>
            <select value={selAgent} onChange={e=>setSelAgent(e.target.value)} className={selectCls}>
              <option value="">— Choose an agent —</option>
              {agents.map(a=><option key={a._id} value={a._id}>{a.name} ({a.email})</option>)}
            </select>
            {agents.length===0 && <p className="text-xs text-slate-400 mt-1.5">No other agents found in your organisation.</p>}
          </Field>
          <div className="flex justify-end gap-3 pt-1">
            <button type="button" onClick={()=>setFwdModal({open:false,lead:null})} className="px-5 py-2.5 text-sm font-semibold rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors">Cancel</button>
            <button type="submit" disabled={forwarding||!selAgent} className="px-5 py-2.5 text-sm font-semibold rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-md shadow-rose-200 transition-all flex items-center gap-2 disabled:opacity-60">
              <ArrowRightLeft size={14} />{forwarding?"Forwarding…":"Forward Lead"}
            </button>
          </div>
        </form>
</Modal>
    </div>
  );
}