"use client";

import { useEffect, useState, useRef } from "react";
import { 
  Search, 
  Loader2, 
  LifeBuoy, 
  Mail, 
  User, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  HelpCircle,
  MessageSquare
} from "lucide-react";

interface SupportTicket {
  id: string;
  userId: string | null;
  name: string;
  email: string;
  subject: string;
  description: string;
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED";
  feedback: string | null;
  createdAt: string;
  updatedAt: string;
}

const statusConfig = {
  OPEN: { label: "Open", className: "bg-rose-500/10 text-rose-500 border-rose-500/20" },
  IN_PROGRESS: { label: "In Progress", className: "bg-sky-500/10 text-sky-500 border-sky-500/20" },
  RESOLVED: { label: "Resolved", className: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" },
};

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "OPEN" | "IN_PROGRESS" | "RESOLVED">("ALL");
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  
  // Status change and feedback state
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [adminFeedback, setAdminFeedback] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Load ticket feedback text when selection changes
  useEffect(() => {
    if (selectedTicket) {
      setAdminFeedback(selectedTicket.feedback || "");
      setSaveSuccess(false);
    } else {
      setAdminFeedback("");
    }
  }, [selectedTicket]);

  const fetchTickets = () => {
    setLoading(true);
    fetch("/api/support")
      .then(r => r.json())
      .then(data => {
        setTickets(Array.isArray(data) ? data : []);
      })
      .catch(() => setTickets([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const updateStatus = async (ticketId: string, newStatus: "OPEN" | "IN_PROGRESS" | "RESOLVED") => {
    setUpdatingId(ticketId);
    try {
      const res = await fetch("/api/support", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: ticketId, status: newStatus }),
      });
      if (res.ok) {
        const updated = await res.json();
        setTickets(prev => prev.map(t => t.id === ticketId ? updated : t));
        if (selectedTicket?.id === ticketId) {
          setSelectedTicket(updated);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingId(null);
    }
  };

  const saveFeedback = async () => {
    if (!selectedTicket) return;
    setUpdatingId(selectedTicket.id);
    setSaveSuccess(false);
    try {
      const res = await fetch("/api/support", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selectedTicket.id, feedback: adminFeedback }),
      });
      if (res.ok) {
        const updated = await res.json();
        setTickets(prev => prev.map(t => t.id === selectedTicket.id ? updated : t));
        setSelectedTicket(updated);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredTickets = tickets.filter(t => {
    const matchesStatus = statusFilter === "ALL" || t.status === statusFilter;
    const matchesSearch = 
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.email.toLowerCase().includes(search.toLowerCase()) ||
      t.subject.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "OPEN": return <AlertCircle className="w-4 h-4 text-rose-500" />;
      case "IN_PROGRESS": return <HelpCircle className="w-4 h-4 text-sky-500" />;
      case "RESOLVED": return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      default: return null;
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <LifeBuoy className="w-7 h-7 text-amber-500 animate-spin-slow" />
            Support Tickets
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Manage user bug reports, feedback, and support inquiries</p>
        </div>
        <button onClick={fetchTickets} className="px-4 py-2 text-xs font-bold text-white bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 transition-all">
          Refresh Tickets
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Tickets", count: tickets.length, color: "border-slate-800 text-white bg-slate-900/50" },
          { label: "Open", count: tickets.filter(t => t.status === "OPEN").length, color: "border-rose-900/30 text-rose-400 bg-rose-950/20" },
          { label: "In Progress", count: tickets.filter(t => t.status === "IN_PROGRESS").length, color: "border-sky-900/30 text-sky-400 bg-sky-950/20" },
          { label: "Resolved", count: tickets.filter(t => t.status === "RESOLVED").length, color: "border-emerald-900/30 text-emerald-400 bg-emerald-950/20" }
        ].map((stat, i) => (
          <div key={i} className={`border p-4 rounded-2xl flex flex-col gap-1 shadow-sm ${stat.color}`}>
            <span className="text-xs font-semibold opacity-60">{stat.label}</span>
            <span className="text-2xl font-black">{stat.count}</span>
          </div>
        ))}
      </div>

      {/* Filters & Search */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input 
            type="text" 
            placeholder="Search by name, email, subject, content..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-[#060f1e] text-slate-100 text-sm pl-10 pr-4 py-2.5 border border-slate-800 rounded-xl outline-none focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/10 transition-all font-[inherit]" 
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {(["ALL", "OPEN", "IN_PROGRESS", "RESOLVED"] as const).map(status => (
            <button 
              key={status} 
              onClick={() => setStatusFilter(status)}
              className={`text-xs font-semibold px-4 py-2 rounded-xl transition-all ${
                statusFilter === status 
                  ? "bg-amber-500 text-[#0a1628] shadow-lg shadow-amber-500/10" 
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700/50"
              }`}
            >
              {status === "ALL" ? "All Statuses" : status.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-24">
          <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Tickets List */}
          <div className="lg:col-span-2 space-y-3">
            {filteredTickets.length === 0 ? (
              <div className="text-center py-16 bg-slate-900/40 border border-slate-800 rounded-2xl">
                <LifeBuoy className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400 text-sm font-medium">No tickets found matching current filters.</p>
              </div>
            ) : (
              filteredTickets.map(ticket => {
                const cfg = statusConfig[ticket.status];
                return (
                  <div 
                    key={ticket.id}
                    onClick={() => setSelectedTicket(ticket)}
                    className={`p-5 bg-slate-900/40 hover:bg-slate-900/80 border rounded-2xl transition-all cursor-pointer flex flex-col gap-3 group relative ${
                      selectedTicket?.id === ticket.id ? "border-amber-500 bg-slate-900/80" : "border-slate-800"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${cfg.className}`}>
                            {cfg.label}
                          </span>
                          {ticket.feedback && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                              <MessageSquare className="w-3 h-3" /> Replied
                            </span>
                          )}
                        </div>
                        <h3 className="font-bold text-slate-100 text-sm mt-1">{ticket.subject}</h3>
                      </div>
                      <span className="text-[10px] text-slate-500 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(ticket.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {ticket.description}
                    </p>

                    <div className="flex items-center gap-6 text-[11px] text-slate-500 mt-2 border-t border-slate-800/60 pt-2.5">
                      <span className="flex items-center gap-1.5 font-medium">
                        <User className="w-3.5 h-3.5 text-slate-500" />
                        {ticket.name}
                      </span>
                      <span className="flex items-center gap-1.5 font-medium">
                        <Mail className="w-3.5 h-3.5 text-slate-500" />
                        {ticket.email}
                      </span>
                    </div>

                    {updatingId === ticket.id && (
                      <div className="absolute inset-0 bg-slate-950/40 rounded-2xl flex items-center justify-center">
                        <Loader2 className="w-6 h-6 text-amber-500 animate-spin" />
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Ticket Detail Drawer/Card */}
          <div className="lg:col-span-1">
            {selectedTicket ? (
              <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 sticky top-6 space-y-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                      Ticket details
                    </span>
                    <h2 className="text-base font-bold text-white leading-snug">{selectedTicket.subject}</h2>
                  </div>
                  <button 
                    onClick={() => setSelectedTicket(null)}
                    className="text-xs text-slate-500 hover:text-white"
                  >
                    Close
                  </button>
                </div>

                <div className="space-y-4 border-y border-slate-800/80 py-5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-300">
                      <User className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">{selectedTicket.name}</p>
                      <p className="text-[10px] text-slate-400">{selectedTicket.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(selectedTicket.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Description</h4>
                  <div className="bg-[#060f1e] border border-slate-800 p-4 rounded-xl text-xs text-slate-300 leading-relaxed whitespace-pre-wrap max-h-[140px] overflow-y-auto">
                    {selectedTicket.description}
                  </div>
                </div>

                {/* Admin Feedback Input */}
                <div className="space-y-2 pt-2 border-t border-slate-800/80">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Admin Feedback / Reply</h4>
                  <textarea 
                    value={adminFeedback} 
                    onChange={e => setAdminFeedback(e.target.value)}
                    placeholder="Type feedback, response, or resolution details here..."
                    rows={3}
                    className="w-full bg-[#060f1e] border border-slate-800 p-3 rounded-xl text-xs text-slate-300 leading-relaxed outline-none focus:border-amber-500/50 transition-all resize-none font-[inherit]" 
                  />
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={saveFeedback}
                      disabled={updatingId !== null}
                      className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-[#0a1628] font-bold text-xs rounded-xl transition-all border-0 flex items-center justify-center gap-1.5"
                    >
                      {updatingId === selectedTicket.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : "Save Feedback"}
                    </button>
                  </div>
                  {saveSuccess && (
                    <p className="text-[10px] text-emerald-400 font-bold text-center animate-pulse">Feedback updated successfully!</p>
                  )}
                </div>

                <div className="space-y-3 pt-2 border-t border-slate-800/80">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Change Status</h4>
                  <div className="flex flex-col gap-2">
                    {(["OPEN", "IN_PROGRESS", "RESOLVED"] as const).map(status => {
                      const isActive = selectedTicket.status === status;
                      return (
                        <button
                          key={status}
                          onClick={() => updateStatus(selectedTicket.id, status)}
                          disabled={updatingId !== null}
                          className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all border flex items-center gap-2 ${
                            isActive
                              ? "bg-[#fcd34d]/10 text-amber-300 border-amber-500/20"
                              : "bg-[#060f1e] hover:bg-slate-800/50 text-slate-400 border-slate-800"
                          }`}
                        >
                          {getStatusIcon(status)}
                          Mark as {status.replace("_", " ")}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-slate-900/20 border border-slate-800 border-dashed rounded-2xl p-8 text-center flex flex-col items-center justify-center h-48">
                <LifeBuoy className="w-8 h-8 text-slate-700 mb-2" />
                <p className="text-xs text-slate-500">Select a support ticket from the list to view its description, details, and change its resolution status.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
