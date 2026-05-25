"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { useAppSelector } from "@/store/hooks";
import { Scale, ClipboardList } from "lucide-react";

type Provider = "openai" | "claude";
type Mode = "standard" | "compliance";
interface Msg { id: string; role: "user" | "assistant"; content: string; streaming?: boolean; }

const HINTS = ["Schedule C Help", "IRS Audit Defense", "Max My Deductions", "W-2 Question"];

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
  const [msgs, setMsgs]           = useState<Msg[]>([]);
  const [input, setInput]         = useState("");
  const [loading, setLoading]     = useState(false);
  const [provider, setProvider]   = useState<Provider>("openai");
  const [mode, setMode]           = useState<Mode>("standard");
  const [unread, setUnread]       = useState(false);
  const [enabled, setEnabled]     = useState(true);
  const bottomRef  = useRef<HTMLDivElement>(null);
  const inputRef   = useRef<HTMLInputElement>(null);

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

  useEffect(() => { if (open) { setUnread(false); inputRef.current?.focus(); } }, [open]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, loading]);

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

  const isLastStreaming = loading && msgs.length > 0 && msgs[msgs.length - 1].content === "";

  if (!enabled) return null;

  return (
    <>
      <style>{`
        @keyframes atlasTyping { 0%,80%,100%{transform:scale(0.7);opacity:0.4} 40%{transform:scale(1);opacity:1} }
        @keyframes atlasPop { from{opacity:0;transform:translateY(20px) scale(0.95)} to{opacity:1;transform:translateY(0) scale(1)} }
        .atlas-panel { animation: atlasPop 0.22s cubic-bezier(0.34,1.56,0.64,1) both; }
        @keyframes atlasPulse { 0%,100%{box-shadow:0 0 0 0 rgba(212,160,23,0.5)} 50%{box-shadow:0 0 0 8px rgba(212,160,23,0)} }
        .atlas-unread { animation: atlasPulse 1.8s ease-in-out infinite; }
      `}</style>

      {/* ── Floating button ── */}
      <button
        onClick={() => setOpen(o => !o)}
        aria-label="Open Atlas AI"
        className={`fixed bottom-6 right-6 z-50 rounded-full overflow-hidden shadow-2xl transition-all hover:scale-105 active:scale-95 ring-2 ring-white/20 ${unread ? "atlas-unread" : ""}`}
        style={{ background: "linear-gradient(135deg,#0a1628 0%,#173473 100%)", width: 88, height: 88 }}>
        {open ? (
          <div className="w-full h-full flex items-center justify-center">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </div>
        ) : (
          <img src="/icon.webp" alt="Atlas AI" className="w-full h-full object-cover" />
        )}
        {unread && <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-[#d4a017] rounded-full border-2 border-white" />}
      </button>

      {/* ── Chat panel ── */}
      {open && (
        <div className="atlas-panel fixed right-6 z-50 w-[380px] max-w-[calc(100vw-2rem)] h-[560px] max-h-[calc(100vh-8rem)] flex flex-col rounded-3xl overflow-hidden shadow-2xl"
          style={{ bottom: 128, background: "#fff", border: "1px solid rgba(10,22,40,0.1)", boxShadow: "0 32px 64px rgba(0,0,0,0.18),0 8px 20px rgba(23,52,115,0.1)" }}>

          {/* Header */}
          <div className="flex items-center gap-3 px-5 py-4 flex-shrink-0"
            style={{ background: "linear-gradient(135deg,#060d1a 0%,#0d1e4a 50%,#173473 100%)" }}>
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
    </>
  );
}
