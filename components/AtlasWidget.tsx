"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { useAppSelector } from "@/store/hooks";
import { Scale, ClipboardList, MessageSquare, LifeBuoy, ArrowLeft, CheckCircle2, Loader2, X } from "lucide-react";

type Provider = "openai" | "claude";
type Mode = "standard" | "compliance";
interface Msg { id: string; role: "user" | "assistant"; content: string; streaming?: boolean; }

interface SupportTicket {
  id: string;
  subject: string;
  description: string;
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED";
  feedback: string | null;
  createdAt: string;
}

const statusConfig = {
  OPEN: { label: "Open", className: "bg-rose-500/10 text-rose-500 border-rose-500/20" },
  IN_PROGRESS: { label: "In Progress", className: "bg-sky-500/10 text-sky-500 border-sky-500/20" },
  RESOLVED: { label: "Resolved", className: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" },
};

const HINTS = ["Schedule C Help", "IRS Audit Defense", "Max My Deductions", "W-2 Question"];
const WIDGET_SIZE = 104;
const PADDING = 16;

function TypingDots() {
  return (
    <div className="flex items-end gap-2">
      <div className="flex gap-1.5 items-center bg-slate-100 rounded-2xl rounded-bl-none px-4 py-3">
        {[0,1,2].map(i => (
          <span key={i} className="w-2 h-2 rounded-full bg-slate-400 inline-block"
            style={{ animation: `atlasTyping 1.2s ${i*0.2}s ease-in-out infinite` }} />
        ))}
      </div>
    </div>
  );
}

function MsgBubble({ m }: { m: Msg }) {
  const isUser = m.role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[82%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
        isUser ? "bg-[#0a1628] text-white rounded-br-none" : "bg-slate-100 text-slate-800 rounded-bl-none"
      }`}>
        {m.content || <span className="opacity-40 italic">thinking…</span>}
      </div>
    </div>
  );
}

export default function AtlasWidget() {
  const user = useAppSelector(s => s.auth.user);
  const [open, setOpen]           = useState(false);
  const [view, setView]           = useState<"menu" | "chat" | "support" | "tickets" | "success">("menu");
  
  // Chat state
  const [msgs, setMsgs]           = useState<Msg[]>([]);
  const [input, setInput]         = useState("");
  const [loading, setLoading]     = useState(false);
  const [provider, setProvider]   = useState<Provider>("openai");
  const [mode, setMode]           = useState<Mode>("standard");
  const [unread, setUnread]       = useState(false);
  const [enabled, setEnabled]     = useState(true);
  
  // Support ticket form state
  const [supportName, setSupportName] = useState("");
  const [supportEmail, setSupportEmail] = useState("");
  const [supportSubject, setSupportSubject] = useState("");
  const [supportDesc, setSupportDesc] = useState("");
  const [submittingSupport, setSubmittingSupport] = useState(false);
  const [supportError, setSupportError] = useState("");

  // User tickets list state
  const [myTickets, setMyTickets] = useState<SupportTicket[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [ticketError, setTicketError] = useState("");
  const [expandedTicketId, setExpandedTicketId] = useState<string | null>(null);

  // Draggable floating positioning state
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ mouseX: number; mouseY: number; posX: number; posY: number } | null>(null);
  const hasMovedRef = useRef(false);

  const bottomRef  = useRef<HTMLDivElement>(null);
  const inputRef   = useRef<HTMLInputElement>(null);

  // Clamp position to viewport bounds
  const clampPos = useCallback((x: number, y: number) => {
    if (typeof window === "undefined") return { x, y };
    const maxX = Math.max(PADDING, window.innerWidth - WIDGET_SIZE - PADDING);
    const maxY = Math.max(PADDING, window.innerHeight - WIDGET_SIZE - PADDING);
    return {
      x: Math.min(Math.max(PADDING, x), maxX),
      y: Math.min(Math.max(PADDING, y), maxY),
    };
  }, []);

  // Initialize position from localStorage or default to bottom-right
  useEffect(() => {
    try {
      const saved = localStorage.getItem("atlas_widget_pos");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.x === "number" && typeof parsed.y === "number") {
          setPos(clampPos(parsed.x, parsed.y));
          return;
        }
      }
    } catch {}

    setPos(clampPos(window.innerWidth - WIDGET_SIZE - 24, window.innerHeight - WIDGET_SIZE - 24));
  }, [clampPos]);

  // Keep inside viewport on window resize
  useEffect(() => {
    const handleResize = () => {
      setPos(prev => (prev ? clampPos(prev.x, prev.y) : null));
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [clampPos]);

  // Mouse Drag Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Left click only
    if (!pos) return;
    hasMovedRef.current = false;
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      posX: pos.x,
      posY: pos.y,
    };

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!dragStartRef.current) return;
      const dx = moveEvent.clientX - dragStartRef.current.mouseX;
      const dy = moveEvent.clientY - dragStartRef.current.mouseY;

      if (Math.hypot(dx, dy) > 4) {
        hasMovedRef.current = true;
        setIsDragging(true);
      }

      if (hasMovedRef.current) {
        const newPos = clampPos(
          dragStartRef.current.posX + dx,
          dragStartRef.current.posY + dy
        );
        setPos(newPos);
      }
    };

    const handleMouseUp = () => {
      if (hasMovedRef.current) {
        setPos(currentPos => {
          if (currentPos) {
            try {
              localStorage.setItem("atlas_widget_pos", JSON.stringify(currentPos));
            } catch {}
          }
          return currentPos;
        });
      }
      setIsDragging(false);
      dragStartRef.current = null;
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  // Touch Drag Handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1 || !pos) return;
    const touch = e.touches[0];
    hasMovedRef.current = false;
    dragStartRef.current = {
      mouseX: touch.clientX,
      mouseY: touch.clientY,
      posX: pos.x,
      posY: pos.y,
    };

    const handleTouchMove = (moveEvent: TouchEvent) => {
      if (!dragStartRef.current || moveEvent.touches.length !== 1) return;
      const t = moveEvent.touches[0];
      const dx = t.clientX - dragStartRef.current.mouseX;
      const dy = t.clientY - dragStartRef.current.mouseY;

      if (Math.hypot(dx, dy) > 4) {
        hasMovedRef.current = true;
        setIsDragging(true);
        if (moveEvent.cancelable) moveEvent.preventDefault();
      }

      if (hasMovedRef.current) {
        const newPos = clampPos(
          dragStartRef.current.posX + dx,
          dragStartRef.current.posY + dy
        );
        setPos(newPos);
      }
    };

    const handleTouchEnd = () => {
      if (hasMovedRef.current) {
        setPos(currentPos => {
          if (currentPos) {
            try {
              localStorage.setItem("atlas_widget_pos", JSON.stringify(currentPos));
            } catch {}
          }
          return currentPos;
        });
      }
      setIsDragging(false);
      dragStartRef.current = null;
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
    };

    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("touchend", handleTouchEnd);
  };

  const handleWidgetClick = () => {
    if (hasMovedRef.current) return;
    setOpen(o => !o);
    if (!open) setView("menu");
  };

  // Compute panel position dynamically near widget
  const getPanelStyle = (): React.CSSProperties => {
    if (!pos || typeof window === "undefined") {
      return { bottom: 124, right: 24 };
    }

    const panelWidth = Math.min(380, window.innerWidth - 24);
    const panelHeight = Math.min(560, window.innerHeight - 100);
    const widgetSize = WIDGET_SIZE;

    let top: number;
    if (pos.y > window.innerHeight / 2) {
      // Position above widget
      top = Math.max(12, pos.y - panelHeight - 12);
    } else {
      // Position below widget
      top = Math.min(window.innerHeight - panelHeight - 12, pos.y + widgetSize + 12);
    }

    let left: number;
    if (pos.x > window.innerWidth / 2) {
      left = Math.max(12, Math.min(pos.x + widgetSize - panelWidth, window.innerWidth - panelWidth - 12));
    } else {
      left = Math.max(12, Math.min(pos.x, window.innerWidth - panelWidth - 12));
    }

    return {
      position: "fixed",
      top: `${top}px`,
      left: `${left}px`,
      width: `${panelWidth}px`,
      height: `${panelHeight}px`,
    };
  };

  // Autofill name/email if user is loaded
  useEffect(() => {
    if (user) {
      setSupportName(user.name || "");
      setSupportEmail(user.email || "");
    }
  }, [user]);

  // Fetch admin settings on mount
  useEffect(() => {
    fetch("/api/atlas-settings")
      .then(r => r.json())
      .then((s: { widgetEnabled: boolean; defaultProvider: string }) => {
        setEnabled(s.widgetEnabled);
        if (s.defaultProvider === "claude" || s.defaultProvider === "openai") {
          setProvider(s.defaultProvider as Provider);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (open) {
      setUnread(false);
      if (view === "chat") {
        inputRef.current?.focus();
      }
    }
  }, [open, view]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, loading]);

  const send = useCallback(async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || loading) return;
    setInput("");
    const userMsg: Msg = { id: `u-${Date.now()}`, role: "user", content };
    const asstMsg: Msg = { id: `a-${Date.now()}`, role: "assistant", content: "", streaming: true };
    setMsgs(p => [...p, userMsg, asstMsg]);
    setLoading(true);

    try {
      const history = msgs.map(m => ({ role: m.role, content: m.content }));
      const res = await fetch("/api/atlas-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: content, history, provider, compliance: mode === "compliance" }),
      });
      if (!res.ok || !res.body) throw new Error("Server error");
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = dec.decode(value, { stream: true });
        setMsgs(p => p.map(m => m.id === asstMsg.id ? { ...m, content: m.content + chunk } : m));
      }
      setMsgs(p => p.map(m => m.id === asstMsg.id ? { ...m, streaming: false } : m));
      if (!open) setUnread(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error";
      setMsgs(p => p.map(m => m.id === asstMsg.id ? { ...m, content: `Error: ${msg}`, streaming: false } : m));
    } finally {
      setLoading(false);
    }
  }, [input, loading, msgs, provider, mode, open]);

  const fetchMyTickets = async () => {
    setLoadingTickets(true);
    setTicketError("");
    try {
      const res = await fetch("/api/support");
      if (!res.ok) throw new Error("Failed to load tickets");
      const data = await res.json();
      setMyTickets(Array.isArray(data) ? data : []);
    } catch (err) {
      setTicketError(err instanceof Error ? err.message : "Error fetching tickets");
    } finally {
      setLoadingTickets(false);
    }
  };

  const submitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supportName.trim() || !supportEmail.trim() || !supportSubject.trim() || !supportDesc.trim()) {
      setSupportError("All fields are required");
      return;
    }
    setSubmittingSupport(true);
    setSupportError("");
    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: supportName,
          email: supportEmail,
          subject: supportSubject,
          description: supportDesc
        })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to submit ticket");
      }
      // Reset input fields but keep name/email
      setSupportSubject("");
      setSupportDesc("");
      setView("success");
    } catch (err) {
      setSupportError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmittingSupport(false);
    }
  };

  const isLastStreaming = loading && msgs.length > 0 && msgs[msgs.length - 1].content === "";

  if (!enabled) return null;

  return (
    <>
      <style>{`
        @keyframes atlasFloat {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-7px) rotate(1deg); }
        }
        .atlas-floating { animation: atlasFloat 3.8s ease-in-out infinite; }
        @keyframes atlasTyping { 0%,80%,100%{transform:scale(0.7);opacity:0.4} 40%{transform:scale(1);opacity:1} }
        @keyframes atlasPop { from{opacity:0;transform:translateY(16px) scale(0.96)} to{opacity:1;transform:translateY(0) scale(1)} }
        .atlas-panel { animation: atlasPop 0.22s cubic-bezier(0.34,1.56,0.64,1) both; }
        @keyframes atlasPulse { 0%,100%{box-shadow:0 0 0 0 rgba(212,160,23,0.5)} 50%{box-shadow:0 0 0 8px rgba(212,160,23,0)} }
        .atlas-unread { animation: atlasPulse 1.8s ease-in-out infinite; }
      `}</style>

      {/* ── Draggable Floating Atlas Character ── */}
      <div
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onClick={handleWidgetClick}
        role="button"
        tabIndex={0}
        aria-label="Chat with Atlas AI - Click to open, drag to move"
        title="Chat with Atlas AI · Drag to move anywhere"
        className={`fixed z-50 select-none touch-none group flex items-center justify-center ${
          isDragging ? "cursor-grabbing scale-105" : "cursor-grab hover:scale-105"
        }`}
        style={{
          width: WIDGET_SIZE,
          height: WIDGET_SIZE,
          left: pos ? `${pos.x}px` : "calc(100vw - 124px)",
          top: pos ? `${pos.y}px` : "calc(100vh - 124px)",
          transition: isDragging ? "none" : "transform 0.2s ease, filter 0.2s ease",
        }}
      >
        <div className={`w-full h-full relative ${!isDragging ? "atlas-floating" : ""}`}>
          {/* Full unclipped robot character */}
          <img
            src="/icon.webp"
            alt="Atlas AI"
            draggable={false}
            className="w-full h-full object-contain pointer-events-none drop-shadow-[0_12px_24px_rgba(10,22,40,0.28)] group-hover:drop-shadow-[0_18px_32px_rgba(10,22,40,0.4)] transition-all"
          />

          {/* Unread badge */}
          {unread && !open && (
            <span className="absolute top-1 right-2 flex h-4 w-4 pointer-events-none">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-amber-500 border-2 border-white shadow-sm"></span>
            </span>
          )}

          {/* Close button indicator when panel is open */}
          {open && (
            <div className="absolute top-0 right-0 w-7 h-7 rounded-full bg-[#0a1628] text-white border-2 border-white shadow-xl flex items-center justify-center animate-in zoom-in-50 duration-150 pointer-events-none">
              <X className="w-3.5 h-3.5 text-white" />
            </div>
          )}
        </div>
      </div>

      {/* ── Chat panel ── */}
      {open && (
        <div
          className="atlas-panel fixed z-50 flex flex-col rounded-3xl overflow-hidden shadow-2xl"
          style={{
            ...getPanelStyle(),
            background: "#fff",
            border: "1px solid rgba(10,22,40,0.1)",
            boxShadow: "0 32px 64px rgba(0,0,0,0.18),0 8px 20px rgba(23,52,115,0.1)",
          }}
        >
          {/* ── VIEW: MENU ── */}
          {view === "menu" && (
            <div className="flex flex-col h-full bg-white">
              {/* Header */}
              <div className="flex items-center justify-between gap-3 px-5 py-5 flex-shrink-0"
                style={{ background: "linear-gradient(135deg,#060d1a 0%,#0d1e4a 50%,#173473 100%)" }}>
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 ring-2 ring-white/20 flex items-center justify-center bg-white/5">
                    <MessageSquare className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-white leading-tight">TaxCompPro Support</p>
                    <p className="text-[10px] text-slate-300 mt-0.5 font-medium">How can we help you today?</p>
                  </div>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-all flex-shrink-0"
                  title="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Menu Content */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {/* Chat Option */}
                <button onClick={() => setView("chat")}
                  className="w-full text-left p-5 rounded-2xl border border-slate-100 bg-slate-50 hover:bg-slate-100/70 hover:border-slate-200 transition-all flex items-start gap-4 shadow-sm group">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-[#0a1628] text-white flex-shrink-0 shadow-md group-hover:scale-105 transition-transform overflow-hidden">
                    <img src="/icon.webp" alt="Atlas" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-black text-sm text-[#0a1628] flex items-center gap-2">
                      Chat with Atlas AI
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" />
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      Get instant, real-time tax guidance, compliance advice, and CPA intelligence.
                    </p>
                  </div>
                </button>

                {/* Ticket Option */}
                <button onClick={() => { setView("support"); setSupportError(""); }}
                  className="w-full text-left p-5 rounded-2xl border border-slate-100 bg-slate-50 hover:bg-slate-100/70 hover:border-slate-200 transition-all flex items-start gap-4 shadow-sm group">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-amber-500 text-white flex-shrink-0 shadow-md group-hover:scale-105 transition-transform">
                    <LifeBuoy className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-black text-sm text-[#0a1628]">
                      Submit Support Ticket
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      Report an issue, ask billing questions, or request human support directly.
                    </p>
                  </div>
                </button>

                {/* My Tickets Option (Only visible if logged in) */}
                {user && (
                  <button onClick={() => { setView("tickets"); fetchMyTickets(); }}
                    className="w-full text-left p-5 rounded-2xl border border-slate-100 bg-slate-50 hover:bg-slate-100/70 hover:border-slate-200 transition-all flex items-start gap-4 shadow-sm group">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-emerald-500 text-white flex-shrink-0 shadow-md group-hover:scale-105 transition-transform">
                      <ClipboardList className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-black text-sm text-[#0a1628]">
                        My Tickets
                      </h3>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        Track your requests, check resolution status, and see replies from our admins.
                      </p>
                    </div>
                  </button>
                )}
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-slate-100 text-center flex-shrink-0">
                <span className="text-[11px] text-slate-400 font-medium">Typically responds within 24 hours</span>
              </div>
            </div>
          )}

          {/* ── VIEW: CHAT WITH ATLAS AI ── */}
          {view === "chat" && (
            <div className="flex flex-col h-full bg-white">
              {/* Header */}
              <div className="flex items-center gap-3 px-5 py-4 flex-shrink-0"
                style={{ background: "linear-gradient(135deg,#060d1a 0%,#0d1e4a 50%,#173473 100%)" }}>
                <button onClick={() => setView("menu")}
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-all flex-shrink-0">
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 ring-2 ring-white/20">
                  <img src="/icon.webp" alt="Atlas" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-white leading-tight">Atlas AI</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <p className="text-[10px] text-emerald-300 font-semibold">Tax Intelligence Assistant</p>
                  </div>
                </div>
                {msgs.length > 0 && (
                  <button onClick={() => setMsgs([])} title="Clear chat"
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all flex-shrink-0">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6m4-6v6"/></svg>
                  </button>
                )}
                <button
                  onClick={() => setOpen(false)}
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-all flex-shrink-0"
                  title="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Mode bar */}
              <div className="flex items-center justify-between px-5 py-2.5 border-b border-slate-100 flex-shrink-0">
                <span className="text-xs text-slate-400 font-semibold">
                  {msgs.length === 0 ? "How can I help?" : `${msgs.filter(m=>m.role==="user").length} question${msgs.filter(m=>m.role==="user").length!==1?"s":""}`}
                </span>
                <button onClick={() => setMode(m => m === "standard" ? "compliance" : "standard")}
                  className="text-[11px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 transition-all"
                  style={mode === "compliance"
                    ? { background: "#fbbf24", color: "#78350f" }
                    : { background: "rgba(10,22,40,0.06)", color: "#64748b" }}>
                  {mode === "compliance"
                    ? <><Scale className="w-3 h-3" /> Compliance</>
                    : <><ClipboardList className="w-3 h-3" /> Standard</>}
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 min-h-0">
                {msgs.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full gap-5 text-center">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                      style={{ background: "linear-gradient(135deg,#0a1628,#173473)" }}>
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
                      </svg>
                    </div>
                    <div>
                      <p className="font-black text-lg text-[#0a1628]">Ask Atlas AI</p>
                      <p className="text-sm text-slate-400 mt-1 max-w-[220px] leading-relaxed">
                        {user ? "Your always-on tax intelligence assistant." : "Sign in for personalized tax guidance."}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {HINTS.map(h => (
                        <button key={h} onClick={() => send(h)}
                          className="text-xs font-semibold px-3 py-1.5 rounded-full border border-[#0a1628]/15 bg-[#0a1628]/5 text-[#0a1628] hover:bg-[#0a1628]/10 transition-all">
                          {h}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {msgs.map(m => <MsgBubble key={m.id} m={m} />)}
                {isLastStreaming && <TypingDots />}
                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <div className="px-4 py-3 border-t border-slate-100 flex-shrink-0">
                {mode === "compliance" && (
                  <div className="h-0.5 mb-3 rounded-full" style={{ background: "linear-gradient(90deg,#f59e0b,#fcd34d,#f59e0b)" }} />
                )}
                <form onSubmit={e => { e.preventDefault(); send(); }} className="flex items-center gap-2">
                  <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)}
                    placeholder={mode === "compliance" ? "Ask for compliance guidance…" : "Ask a tax question…"}
                    disabled={loading}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-full px-4 py-2.5 text-sm outline-none focus:border-[#0a1628]/30 transition-all disabled:opacity-50 font-[inherit]"
                  />
                  <button type="submit" disabled={!input.trim() || loading}
                    className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all active:scale-90 disabled:opacity-40"
                    style={{ background: "linear-gradient(135deg,#0a1628,#173473)" }}>
                    {loading
                      ? <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M21 12a9 9 0 11-6.219-8.56"/></svg>
                      : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>}
                  </button>
                </form>
                <p className="text-center text-[10px] text-slate-300 mt-2">
                  Atlas AI · Powered by {provider === "claude" ? "Claude" : "GPT-4o"}
                </p>
              </div>
            </div>
          )}

          {/* ── VIEW: SUBMIT SUPPORT TICKET ── */}
          {view === "support" && (
            <div className="flex flex-col h-full bg-white">
              {/* Header */}
              <div className="flex items-center justify-between gap-3 px-5 py-4 flex-shrink-0"
                style={{ background: "linear-gradient(135deg,#060d1a 0%,#0d1e4a 50%,#173473 100%)" }}>
                <div className="flex items-center gap-3 min-w-0">
                  <button onClick={() => setView("menu")}
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-all flex-shrink-0">
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-white leading-tight">Submit Support Ticket</p>
                    <p className="text-[10px] text-slate-300 mt-0.5 font-medium">We're here to help</p>
                  </div>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-all flex-shrink-0"
                  title="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={submitTicket} className="flex-1 overflow-y-auto p-5 space-y-4 min-h-0">
                {supportError && (
                  <div className="p-3 text-xs bg-rose-50 text-rose-600 rounded-xl border border-rose-100">
                    {supportError}
                  </div>
                )}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#0a1628]">Full Name</label>
                  <input type="text" value={supportName} onChange={e => setSupportName(e.target.value)}
                    required placeholder="e.g. John Doe"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-[#0a1628]/30 transition-all" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#0a1628]">Email Address</label>
                  <input type="email" value={supportEmail} onChange={e => setSupportEmail(e.target.value)}
                    required placeholder="e.g. john@example.com"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-[#0a1628]/30 transition-all" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#0a1628]">Subject</label>
                  <input type="text" value={supportSubject} onChange={e => setSupportSubject(e.target.value)}
                    required placeholder="Brief summary of the issue"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-[#0a1628]/30 transition-all" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#0a1628]">Description</label>
                  <textarea value={supportDesc} onChange={e => setSupportDesc(e.target.value)}
                    required placeholder="Provide details about your problem or request..."
                    rows={3}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-[#0a1628]/30 transition-all resize-none" />
                </div>
                <button type="submit" disabled={submittingSupport}
                  className="w-full font-bold py-3 px-4 rounded-xl text-white text-xs transition-all active:scale-95 disabled:opacity-50 mt-2 flex items-center justify-center gap-2 border-0"
                  style={{ background: "linear-gradient(135deg,#0a1628,#173473)" }}>
                  {submittingSupport ? (
                    <>
                      <svg className="animate-spin w-4 h-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                      Submitting...
                    </>
                  ) : "Submit Ticket"}
                </button>
              </form>
            </div>
          )}

          {/* ── VIEW: MY TICKETS LIST ── */}
          {view === "tickets" && (
            <div className="flex flex-col h-full bg-white">
              {/* Header */}
              <div className="flex items-center justify-between gap-3 px-5 py-4 flex-shrink-0"
                style={{ background: "linear-gradient(135deg,#060d1a 0%,#0d1e4a 50%,#173473 100%)" }}>
                <div className="flex items-center gap-3 min-w-0">
                  <button onClick={() => setView("menu")}
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-all flex-shrink-0">
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-white leading-tight">My Support Tickets</p>
                    <p className="text-[10px] text-slate-300 mt-0.5 font-medium">Track your requests</p>
                  </div>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-all flex-shrink-0"
                  title="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Tickets List Content */}
              {loadingTickets ? (
                <div className="flex-1 flex items-center justify-center">
                  <Loader2 className="w-7 h-7 text-amber-500 animate-spin" />
                </div>
              ) : ticketError ? (
                <div className="p-4 text-xs text-rose-600 bg-rose-50 border border-rose-100 rounded-xl m-4">
                  {ticketError}
                </div>
              ) : myTickets.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-3">
                  <LifeBuoy className="w-10 h-10 text-slate-300" />
                  <p className="text-xs text-slate-400 font-medium">You haven't submitted any support tickets yet.</p>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {myTickets.map(ticket => {
                    const cfg = statusConfig[ticket.status] || statusConfig.OPEN;
                    const isExpanded = expandedTicketId === ticket.id;
                    return (
                      <div key={ticket.id} 
                        className={`border rounded-2xl p-4 transition-all ${isExpanded ? "border-amber-500/50 bg-amber-50/10" : "border-slate-100 hover:bg-slate-50/50"}`}>
                        <div className="flex items-start justify-between gap-3 cursor-pointer"
                          onClick={() => setExpandedTicketId(isExpanded ? null : ticket.id)}>
                          <div className="space-y-1">
                            <h4 className="font-bold text-xs text-[#0a1628] leading-tight">{ticket.subject}</h4>
                            <p className="text-[9px] text-slate-400">{new Date(ticket.createdAt).toLocaleDateString()}</p>
                          </div>
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${cfg.className}`}>
                            {cfg.label}
                          </span>
                        </div>

                        {isExpanded && (
                          <div className="mt-3 pt-3 border-t border-slate-100 space-y-3 text-[11px] animate-[atlasPop_0.15s_ease-out_both]">
                            <div className="space-y-1">
                              <p className="font-bold text-slate-400 uppercase text-[9px] tracking-wider">Your Description</p>
                              <p className="text-slate-600 leading-relaxed bg-slate-50 border border-slate-100 p-2.5 rounded-xl whitespace-pre-wrap">{ticket.description}</p>
                            </div>

                            {/* Response / Feedback Box */}
                            <div className="space-y-1">
                              <p className="font-bold text-[#0a1628] uppercase text-[9px] tracking-wider flex items-center gap-1">
                                <MessageSquare className="w-3 h-3 text-[#0a1628]" /> Response from Admin
                              </p>
                              {ticket.feedback ? (
                                <p className="text-[#0f2d1e] bg-emerald-500/5 border border-emerald-500/10 p-2.5 rounded-xl leading-relaxed whitespace-pre-wrap font-medium">
                                  {ticket.feedback}
                                </p>
                              ) : (
                                <p className="text-slate-400 italic bg-slate-50/80 border border-slate-100/50 p-2.5 rounded-xl">
                                  {ticket.status === "RESOLVED" 
                                    ? "This ticket has been marked as resolved by our admin." 
                                    : "Our support team is reviewing your ticket and will provide feedback shortly."}
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── VIEW: SUCCESS ── */}
          {view === "success" && (
            <div className="flex flex-col h-full bg-white">
              {/* Header */}
              <div className="flex items-center justify-between gap-3 px-5 py-4 flex-shrink-0"
                style={{ background: "linear-gradient(135deg,#060d1a 0%,#0d1e4a 50%,#173473 100%)" }}>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-white leading-tight">Ticket Submitted</p>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-all flex-shrink-0"
                  title="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Success Content */}
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4">
                <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500 shadow-inner">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="font-black text-base text-[#0a1628]">Ticket Created!</h3>
                  <p className="text-xs text-slate-500 mt-2 max-w-[245px] mx-auto leading-relaxed">
                    Thank you. Your support ticket has been recorded. Our administrators will review it shortly.
                  </p>
                </div>
                <button onClick={() => setView("menu")}
                  className="px-6 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-[#0a1628] transition-all bg-white">
                  Back to Menu
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
