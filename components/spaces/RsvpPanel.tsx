"use client";

import { useEffect, useState, useCallback } from "react";
import { Loader2, Download, Users } from "lucide-react";
import { UserGroupIcon } from "hugeicons-react";

interface RsvpEntry {
  id: string;
  name: string;
  email: string | null;
  createdAt: string;
  user?: { id: string; name: string; image: string | null; headline: string | null } | null;
}

interface RsvpPanelProps {
  spaceId: string;
  /** Poll interval in ms, default 30 000 */
  pollMs?: number;
}

function timeAgo(d: string) {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  return `${Math.floor(s / 3600)}h ago`;
}

export default function RsvpPanel({ spaceId, pollMs = 30_000 }: RsvpPanelProps) {
  const [rsvps,   setRsvps]   = useState<RsvpEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRsvps = useCallback(async () => {
    try {
      const res = await fetch(`/api/spaces/${spaceId}/rsvp`);
      if (res.ok) setRsvps(await res.json());
    } finally {
      setLoading(false);
    }
  }, [spaceId]);

  useEffect(() => {
    fetchRsvps();
    const interval = setInterval(fetchRsvps, pollMs);
    return () => clearInterval(interval);
  }, [fetchRsvps, pollMs]);

  // Build & download CSV
  const downloadCsv = () => {
    const rows = [
      ["Name", "Email", "Member?", "RSVP Time"],
      ...rsvps.map(r => [
        r.name,
        r.email ?? "",
        r.user ? "Yes" : "No",
        new Date(r.createdAt).toLocaleString(),
      ]),
    ];
    const csv  = rows.map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `pro-talk-rsvps-${spaceId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-gradient-to-br from-[#061426] to-[#040a14] border border-emerald-500/25 rounded-3xl overflow-hidden shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-emerald-950/60">
        <div className="flex items-center gap-2">
          <UserGroupIcon className="w-4 h-4 text-emerald-400" />
          <span className="text-white font-bold text-sm">Attendees</span>
          {!loading && (
            <span className="ml-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-lime-300 text-xs font-bold">
              {rsvps.length}
            </span>
          )}
        </div>
        {rsvps.length > 0 && (
          <button
            onClick={downloadCsv}
            title="Download CSV"
            className="flex items-center gap-1.5 text-slate-400 hover:text-lime-300 text-xs transition-colors font-medium"
          >
            <Download className="w-3.5 h-3.5" />
            Export
          </button>
        )}
      </div>

      {/* Body */}
      <div className="max-h-80 overflow-y-auto divide-y divide-emerald-950/40">
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-emerald-400" />
          </div>
        ) : rsvps.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-10">
            <Users className="w-8 h-8 text-slate-600" />
            <p className="text-slate-400 text-sm">No RSVPs yet</p>
            <p className="text-slate-500 text-xs">Share the invite link to get people to RSVP</p>
          </div>
        ) : (
          rsvps.map(r => (
            <div key={r.id} className="flex items-center gap-3 px-5 py-3">
              {/* Avatar */}
              <div
                className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-white text-xs font-bold overflow-hidden border border-emerald-500/40"
                style={{ background: "linear-gradient(135deg,#06172e,#0a2e4c)" }}
              >
                {r.user?.image ? (
                  <img src={r.user.image} alt={r.name} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                ) : (
                  r.name[0].toUpperCase()
                )}
              </div>
              {/* Info */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-white/90 text-sm font-semibold truncate">{r.name}</span>
                  {r.user && (
                    <span className="shrink-0 px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-lime-300 text-[10px] font-bold">
                      Member
                    </span>
                  )}
                </div>
                {r.email && <p className="text-slate-400 text-xs truncate">{r.email}</p>}
              </div>
              {/* Time */}
              <span className="shrink-0 text-slate-500 text-xs">{timeAgo(r.createdAt)}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
