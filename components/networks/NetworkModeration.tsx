"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  VolumeX,
  Volume2,
  UserX,
  UserCheck,
  Search,
  Filter,
  Clock,
  ExternalLink,
  MessageSquare,
  Users,
  Settings,
  Plus,
  X,
  AlertCircle,
  Eye,
  RefreshCw,
  Sliders,
  Check,
} from "lucide-react";

interface NetworkModerationProps {
  slug: string;
  network: any;
  discussions: any[];
  membersList: any[];
  onDiscussionRemoved?: (id: string) => void;
  onMemberUpdated?: (memberId: string, updates: any) => void;
}

interface FlaggedItem {
  id: string;
  type: "discussion" | "comment" | "chat";
  targetId: string;
  authorName: string;
  authorImage?: string;
  authorId?: string;
  contentSnippet: string;
  flagReason: string;
  reportedBy: string;
  reportedAt: string;
  severity: "high" | "medium" | "low";
}

interface AuditLogEntry {
  id: string;
  action: string;
  moderator: string;
  target: string;
  details: string;
  timestamp: string;
}

export default function NetworkModeration({
  slug,
  network,
  discussions = [],
  membersList = [],
  onDiscussionRemoved,
  onMemberUpdated,
}: NetworkModerationProps) {
  const [subTab, setSubTab] = useState<"queue" | "members" | "automod" | "audit">("queue");
  const [memberSearch, setMemberSearch] = useState("");
  const [memberStatusFilter, setMemberStatusFilter] = useState<"all" | "active" | "muted">("all");
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "warning" } | null>(null);

  const showToast = (text: string, type: "success" | "warning" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Flagged items queue state
  const [flaggedItems, setFlaggedItems] = useState<FlaggedItem[]>([
    {
      id: "flag-1",
      type: "discussion",
      targetId: discussions[0]?.id || "disc-101",
      authorName: discussions[0]?.author?.name || "Marcus Sterling",
      authorImage: discussions[0]?.author?.image,
      authorId: discussions[0]?.author?.id || "u-101",
      contentSnippet: discussions[0]?.content
        ? discussions[0].content.slice(0, 140) + "..."
        : "Offshore LLC structures with zero reporting requirements. Reach out to my telegram for fast formation packages.",
      flagReason: "Suspected unsolicited financial promotion / spam",
      reportedBy: "Elena Rostova, CPA",
      reportedAt: "25 minutes ago",
      severity: "high",
    },
    {
      id: "flag-2",
      type: "comment",
      targetId: "comm-202",
      authorName: "Jordan Vance",
      authorImage: "/pros/tonique-clay.jpg",
      authorId: "u-202",
      contentSnippet: "Stop posting nonsense, clearly you have no idea how 1031 exchanges work. Terrible advice.",
      flagReason: "Unprofessional decorum / aggressive tone",
      reportedBy: "Devon Reed, EA",
      reportedAt: "2 hours ago",
      severity: "medium",
    },
  ]);

  // Local moderation member overrides (e.g. muted status, role)
  const [memberOverrides, setMemberOverrides] = useState<Record<string, { isMuted?: boolean; role?: string }>>({});

  // Auto-mod configuration state
  const [autoModRules, setAutoModRules] = useState({
    autoSpamGuard: true,
    requireApprovalFirstPost: false,
    blockExternalLinksNewMembers: true,
    strictDecorumFilter: true,
    allowMediaUploads: true,
  });

  // Blocked keywords
  const [blockedKeywords, setBlockedKeywords] = useState<string[]>([
    "guaranteed refund",
    "whatsapp me",
    "telegram channel",
    "crypto scheme",
    "dm for tax evasion",
    "free bitcoin",
  ]);
  const [newKeywordInput, setNewKeywordInput] = useState("");

  // Audit Log State
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>([
    {
      id: "audit-1",
      action: "Rules Updated",
      moderator: network?.owner?.name || "Host Admin",
      target: "Auto-Spam Shield",
      details: "Enabled strict external link filtration for unverified members.",
      timestamp: "Today at 2:15 PM",
    },
    {
      id: "audit-2",
      action: "Post Approved",
      moderator: network?.owner?.name || "Host Admin",
      target: "IRS 2026 Audit Triggers",
      details: "Cleared flagged review after verifying source citations.",
      timestamp: "Yesterday at 4:30 PM",
    },
  ]);

  // Record audit action
  const logAudit = (action: string, target: string, details: string) => {
    const entry: AuditLogEntry = {
      id: `audit-${Date.now()}`,
      action,
      moderator: network?.owner?.name || "Network Admin",
      target,
      details,
      timestamp: "Just now",
    };
    setAuditLog((prev) => [entry, ...prev]);
  };

  // Action: Dismiss Flag
  const handleDismissFlag = (item: FlaggedItem) => {
    setFlaggedItems((prev) => prev.filter((f) => f.id !== item.id));
    logAudit("Dismissed Flag", item.targetId, `Marked content safe by author ${item.authorName}`);
    showToast(`Flag dismissed. Content marked clean.`);
  };

  // Action: Delete Flagged Post
  const handleDeleteFlaggedContent = (item: FlaggedItem) => {
    setFlaggedItems((prev) => prev.filter((f) => f.id !== item.id));
    if (onDiscussionRemoved && item.targetId) {
      onDiscussionRemoved(item.targetId);
    }
    logAudit("Deleted Content", item.targetId, `Removed ${item.type} from author ${item.authorName} for: ${item.flagReason}`);
    showToast(`Content permanently deleted from network.`, "warning");
  };

  // Action: Warn Member
  const handleWarnMember = (item: FlaggedItem) => {
    logAudit("Issued Warning", item.authorName, `Direct notification issued regarding: ${item.flagReason}`);
    showToast(`Formal community warning sent to ${item.authorName}.`);
  };

  // Action: Toggle Member Mute
  const handleToggleMute = (memberId: string, memberName: string) => {
    const currentMuted = memberOverrides[memberId]?.isMuted ?? false;
    const newMuted = !currentMuted;
    setMemberOverrides((prev) => ({
      ...prev,
      [memberId]: { ...prev[memberId], isMuted: newMuted },
    }));
    if (onMemberUpdated) {
      onMemberUpdated(memberId, { isMuted: newMuted });
    }
    logAudit(
      newMuted ? "Muted Member" : "Unmuted Member",
      memberName,
      newMuted ? "Restricted posting and chat access." : "Restored full participation."
    );
    showToast(
      newMuted ? `${memberName} has been muted.` : `${memberName} is unmuted.`,
      newMuted ? "warning" : "success"
    );
  };

  // Action: Change Member Role
  const handleToggleModerator = (memberId: string, memberName: string, currentRole: string) => {
    const newRole = currentRole === "MODERATOR" ? "MEMBER" : "MODERATOR";
    setMemberOverrides((prev) => ({
      ...prev,
      [memberId]: { ...prev[memberId], role: newRole },
    }));
    if (onMemberUpdated) {
      onMemberUpdated(memberId, { role: newRole });
    }
    logAudit("Role Changed", memberName, `Updated network role to ${newRole}`);
    showToast(`${memberName} is now assigned as ${newRole}.`);
  };

  // Action: Add Blocked Keyword
  const handleAddKeyword = (e: React.FormEvent) => {
    e.preventDefault();
    const word = newKeywordInput.trim().toLowerCase();
    if (!word) return;
    if (blockedKeywords.includes(word)) {
      showToast(`Keyword "${word}" is already in the blocklist.`, "warning");
      return;
    }
    setBlockedKeywords((prev) => [...prev, word]);
    setNewKeywordInput("");
    logAudit("Keyword Added", word, "Added to automated discussion & chat filter.");
    showToast(`Added "${word}" to blocked keywords.`);
  };

  // Action: Remove Blocked Keyword
  const handleRemoveKeyword = (word: string) => {
    setBlockedKeywords((prev) => prev.filter((w) => w !== word));
    logAudit("Keyword Removed", word, "Removed from automated filter.");
    showToast(`Removed "${word}" from blocklist.`);
  };

  // Filtered members
  const filteredMembers = useMemo(() => {
    return membersList.filter((m) => {
      const user = m.user || m;
      const name = (user.name || "").toLowerCase();
      const title = (user.professionalTitle || user.headline || "").toLowerCase();
      const search = memberSearch.toLowerCase().trim();
      const matchesText = !search || name.includes(search) || title.includes(search);

      const isMuted = memberOverrides[m.id]?.isMuted ?? false;
      if (memberStatusFilter === "muted") return matchesText && isMuted;
      if (memberStatusFilter === "active") return matchesText && !isMuted;
      return matchesText;
    });
  }, [membersList, memberSearch, memberStatusFilter, memberOverrides]);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* ── Toast Notification ── */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-2xl border text-xs font-bold flex items-center gap-2.5 transition-all ${
            toastMessage.type === "warning"
              ? "bg-amber-500/20 border-amber-500/40 text-amber-200"
              : "bg-emerald-500/20 border-emerald-500/40 text-emerald-200"
          }`}
        >
          {toastMessage.type === "warning" ? (
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* ── Top Header & Navigation ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <Shield className="w-5 h-5" />
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Community Moderation &amp; Safety
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
            Review reported discussions, manage member participation privileges, configure automated shields, and audit moderator interventions.
          </p>
        </div>

        {/* Sub-Tab Navigation Pills */}
        <div className="flex items-center p-1 rounded-2xl bg-black/40 border border-white/10 overflow-x-auto scrollbar-none">
          {[
            {
              id: "queue",
              label: "Review Queue",
              icon: ShieldAlert,
              badge: flaggedItems.length > 0 ? flaggedItems.length : undefined,
            },
            { id: "members", label: "Members", icon: Users },
            { id: "automod", label: "Auto-Shield", icon: Sliders },
            { id: "audit", label: "Audit Trail", icon: Clock },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = subTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSubTab(tab.id as any)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  isActive
                    ? "bg-[#1a56db] text-white shadow-md"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span className="w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-black flex items-center justify-center">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Status KPI Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-[#0f182c] border border-white/10 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold">
            <span>Pending Review</span>
            <ShieldAlert className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-white">{flaggedItems.length} Items</div>
          <p className="text-[11px] text-slate-400">
            {flaggedItems.length === 0 ? "All queues cleared" : "Requires moderator attention"}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-[#0f182c] border border-white/10 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold">
            <span>Muted Members</span>
            <VolumeX className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-2xl font-black text-white">
            {Object.values(memberOverrides).filter((v) => v.isMuted).length} Members
          </div>
          <p className="text-[11px] text-slate-400">Restricted from posting or chat</p>
        </div>

        <div className="p-4 rounded-2xl bg-[#0f182c] border border-white/10 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold">
            <span>Auto-Shield Rules</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">Active (5 Rules)</div>
          <p className="text-[11px] text-slate-400">{blockedKeywords.length} banned keywords</p>
        </div>

        <div className="p-4 rounded-2xl bg-[#0f182c] border border-white/10 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold">
            <span>Community Health</span>
            <CheckCircle2 className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-blue-400">99.8% Clean</div>
          <p className="text-[11px] text-slate-400">Zero critical infractions this month</p>
        </div>
      </div>

      {/* ── SUB-VIEW 1: REVIEW QUEUE ── */}
      {subTab === "queue" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <span>Reported Content Queue</span>
            </h3>
            {flaggedItems.length === 0 && (
              <button
                type="button"
                onClick={() =>
                  setFlaggedItems([
                    {
                      id: `flag-${Date.now()}`,
                      type: "discussion",
                      targetId: "disc-sample",
                      authorName: "External Marketer",
                      authorImage: "/pros/tonique-clay.jpg",
                      contentSnippet:
                        "Guaranteed tax credits through secret loophole. Contact my WhatsApp right now.",
                      flagReason: "Auto-flagged by keyword shield (spam)",
                      reportedBy: "Automated System Guard",
                      reportedAt: "Just now",
                      severity: "high",
                    },
                  ])
                }
                className="text-xs text-blue-400 hover:text-blue-300 font-bold hover:underline"
              >
                + Add Simulated Flag for Testing
              </button>
            )}
          </div>

          {flaggedItems.length === 0 ? (
            <div className="p-12 rounded-3xl bg-[#0f182c] border border-white/10 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="text-base font-black text-white">Your moderation queue is clean</h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                No discussions, comments, or chat messages have been flagged by members or auto-guardrails.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {flaggedItems.map((item) => (
                <div
                  key={item.id}
                  className="p-5 rounded-3xl bg-[#0f182c] border border-white/10 hover:border-white/20 transition-all space-y-4"
                >
                  {/* Top Bar of Card */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={item.authorImage || "/pros/tonique-clay.jpg"}
                        alt={item.authorName}
                        className="w-9 h-9 rounded-full object-cover ring-2 ring-white/10"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "/pros/tonique-clay.jpg";
                        }}
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-black text-white">{item.authorName}</h4>
                          <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-md bg-amber-400/15 text-amber-300 border border-amber-400/25">
                            {item.type}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400">
                          Reported by <strong className="text-slate-300">{item.reportedBy}</strong> • {item.reportedAt}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-xl border border-amber-500/20 flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                        <span>{item.flagReason}</span>
                      </span>
                    </div>
                  </div>

                  {/* Flagged Content Preview */}
                  <div className="p-3.5 rounded-2xl bg-black/40 border border-white/5 text-xs text-slate-200 leading-relaxed font-mono">
                    &quot;{item.contentSnippet}&quot;
                  </div>

                  {/* Actions Bar */}
                  <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
                    <span className="text-[11px] text-slate-400">
                      Target ID: <code className="text-blue-400">{item.targetId}</code>
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleDismissFlag(item)}
                        className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-slate-300 hover:text-white transition-all active:scale-95"
                      >
                        Dismiss &amp; Approve
                      </button>

                      <button
                        type="button"
                        onClick={() => handleWarnMember(item)}
                        className="px-3.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-xs font-bold text-amber-400 transition-all active:scale-95"
                      >
                        Warn Author
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteFlaggedContent(item)}
                        className="px-3.5 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-xs font-bold text-red-400 flex items-center gap-1.5 transition-all active:scale-95"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete Content</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── SUB-VIEW 2: MEMBER ACCESS & CONTROLS ── */}
      {subTab === "members" && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-72">
              <input
                type="text"
                placeholder="Search member by name or role..."
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-white/10 bg-[#0f182c] text-xs text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              {(["all", "active", "muted"] as const).map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setMemberStatusFilter(filter)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all ${
                    memberStatusFilter === filter
                      ? "bg-[#1a56db] text-white"
                      : "bg-[#0f182c] text-slate-400 hover:text-white border border-white/5"
                  }`}
                >
                  {filter === "all" ? "All Members" : filter}
                </button>
              ))}
            </div>
          </div>

          {/* Members Table */}
          <div className="rounded-3xl bg-[#0f182c] border border-white/10 overflow-hidden">
            <div className="divide-y divide-white/5">
              {filteredMembers.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  No members matched your search query.
                </div>
              ) : (
                filteredMembers.map((m) => {
                  const user = m.user || m;
                  const isMuted = memberOverrides[m.id]?.isMuted ?? false;
                  const role = memberOverrides[m.id]?.role || m.role || "MEMBER";

                  return (
                    <div
                      key={m.id}
                      className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={user.image || "/pros/tonique-clay.jpg"}
                          alt={user.name || "Member"}
                          className="w-10 h-10 rounded-full object-cover ring-2 ring-white/10 shrink-0"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "/pros/tonique-clay.jpg";
                          }}
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-black text-white truncate">
                              {user.name || "Tax Professional"}
                            </h4>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.2 rounded-md ${
                                role === "OWNER"
                                  ? "bg-amber-400/15 text-amber-300 border border-amber-400/20"
                                  : role === "MODERATOR"
                                  ? "bg-blue-500/15 text-blue-300 border border-blue-500/20"
                                  : "bg-white/5 text-slate-300"
                              }`}
                            >
                              {role}
                            </span>
                            {isMuted && (
                              <span className="text-[10px] font-bold px-2 py-0.2 rounded-md bg-red-500/20 text-red-300 border border-red-500/30">
                                Muted
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 truncate">
                            {user.professionalTitle || user.headline || "Active Member"}
                          </p>
                        </div>
                      </div>

                      {/* Action buttons */}
                      {role !== "OWNER" && (
                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                          <button
                            type="button"
                            onClick={() => handleToggleMute(m.id, user.name || "Member")}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                              isMuted
                                ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25"
                                : "bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10 hover:text-white"
                            }`}
                          >
                            {isMuted ? (
                              <>
                                <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                                <span>Unmute</span>
                              </>
                            ) : (
                              <>
                                <VolumeX className="w-3.5 h-3.5 text-slate-400" />
                                <span>Mute</span>
                              </>
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleToggleModerator(m.id, user.name || "Member", role)}
                            className="px-3 py-1.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-xs font-bold text-blue-400 transition-all"
                          >
                            {role === "MODERATOR" ? "Demote to Member" : "Make Moderator"}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── SUB-VIEW 3: AUTO-MOD RULES & KEYWORDS ── */}
      {subTab === "automod" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Guardrail Toggles (7 Cols) */}
          <div className="lg:col-span-7 p-6 rounded-3xl bg-[#0f182c] border border-white/10 space-y-6">
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-blue-400" />
                <span>Automated Community Protection Shields</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Configure real-time automated filters to safeguard discussions and chat channels.
              </p>
            </div>

            <div className="space-y-4">
              {[
                {
                  id: "autoSpamGuard",
                  title: "Auto-Spam & Phishing Guard",
                  desc: "Instantly flags unsolicited cryptocurrency, mass lead gen, or suspicious URL links.",
                },
                {
                  id: "blockExternalLinksNewMembers",
                  title: "Block External Links for New Members",
                  desc: "Requires members to have at least 3 approved posts before posting hyperlinked text.",
                },
                {
                  id: "requireApprovalFirstPost",
                  title: "Require First-Post Moderator Approval",
                  desc: "Holds a new member's initial discussion post in the review queue before public display.",
                },
                {
                  id: "strictDecorumFilter",
                  title: "Strict Professional Decorum Filter",
                  desc: "Scans for aggressive language, abusive replies, or personal insults.",
                },
                {
                  id: "allowMediaUploads",
                  title: "Allow Member Media & Document Uploads",
                  desc: "Permits verified members to attach image and PDF documents to posts.",
                },
              ].map((rule) => {
                const isEnabled = autoModRules[rule.id as keyof typeof autoModRules];
                return (
                  <div
                    key={rule.id}
                    className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between gap-4"
                  >
                    <div>
                      <h4 className="text-xs font-black text-white">{rule.title}</h4>
                      <p className="text-[11px] text-slate-400 mt-0.5 max-w-md">{rule.desc}</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const updated = !isEnabled;
                        setAutoModRules((prev) => ({ ...prev, [rule.id]: updated }));
                        logAudit("Rule Toggled", rule.title, updated ? "Enabled" : "Disabled");
                        showToast(`${rule.title} is now ${updated ? "Enabled" : "Disabled"}.`);
                      }}
                      className={`w-12 h-6 rounded-full p-1 transition-colors relative shrink-0 ${
                        isEnabled ? "bg-[#1a56db]" : "bg-white/10"
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full bg-white transition-transform ${
                          isEnabled ? "translate-x-6" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Blocked Keywords (5 Cols) */}
          <div className="lg:col-span-5 p-6 rounded-3xl bg-[#0f182c] border border-white/10 space-y-5">
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-400" />
                <span>Restricted Keywords &amp; Phrases</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Any post containing these terms will automatically be routed to the Review Queue.
              </p>
            </div>

            {/* Keyword Input Form */}
            <form onSubmit={handleAddKeyword} className="flex gap-2">
              <input
                type="text"
                placeholder="Add banned keyword or phrase..."
                value={newKeywordInput}
                onChange={(e) => setNewKeywordInput(e.target.value)}
                className="flex-1 px-3.5 py-2 rounded-xl border border-white/10 bg-black/40 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-[#1a56db] hover:bg-blue-600 text-white font-bold text-xs flex items-center gap-1 transition-all active:scale-95 shadow-sm shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </form>

            {/* Keywords Tag Cloud */}
            <div className="flex flex-wrap gap-2 pt-2">
              {blockedKeywords.map((word) => (
                <span
                  key={word}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold text-slate-300 hover:border-red-500/30 transition-colors group"
                >
                  <span>{word}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveKeyword(word)}
                    className="text-slate-400 hover:text-red-400 p-0.5"
                    title={`Remove "${word}"`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>

            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 text-[11px] text-slate-400 space-y-1">
              <span className="font-bold text-slate-300 block">Pro Tip:</span>
              <p>
                Keywords are matched case-insensitively across post titles, post content, and member chat channels.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── SUB-VIEW 4: AUDIT TRAIL ── */}
      {subTab === "audit" && (
        <div className="p-6 rounded-3xl bg-[#0f182c] border border-white/10 space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-400" />
                <span>Moderation Action Audit Log</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Permanent immutable record of administrative actions, flag resolutions, and role changes.
              </p>
            </div>
            <span className="text-xs text-slate-400 font-bold">
              {auditLog.length} Records
            </span>
          </div>

          <div className="divide-y divide-white/5">
            {auditLog.map((log) => (
              <div key={log.id} className="py-3.5 flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-white">{log.action}</span>
                    <span className="text-[11px] font-bold text-blue-400">• {log.target}</span>
                  </div>
                  <p className="text-xs text-slate-400">{log.details}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[11px] font-bold text-slate-400 block">{log.timestamp}</span>
                  <span className="text-[10px] text-slate-400">By {log.moderator}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
