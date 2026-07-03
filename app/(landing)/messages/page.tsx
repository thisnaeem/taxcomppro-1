"use client";

import { Suspense, useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAppSelector } from "@/store/hooks";
import { Send, MessageSquare, Loader2, ArrowLeft, Check, CheckCheck, Search, Megaphone, Paperclip, X, FileText, Image as ImageIcon, Download } from "lucide-react";
import { Room, RoomEvent } from "livekit-client";
import UpgradeGate from "@/components/ui/UpgradeGate";

interface MiniUser { id: string; name: string; image: string | null; headline?: string | null; }
interface Message  { id: string; senderId: string; receiverId: string; content: string; fileUrl?: string|null; fileName?: string|null; fileType?: string|null; isRead: boolean; isSponsored?: boolean; createdAt: string; }
interface Thread   { id: string; senderId: string; receiverId: string; content: string; createdAt: string; partner: MiniUser; }

function Avatar({ user, size = "md" }: { user: { name: string; image?: string | null }; size?: "sm"|"md"|"lg" }) {
  const sz = size === "lg" ? "w-12 h-12 text-lg" : size === "sm" ? "w-9 h-9 text-xs" : "w-10 h-10 text-sm";
  return (
    <div className={`${sz} rounded-full bg-[#0a1628] overflow-hidden flex items-center justify-center shrink-0`}>
      {user.image
        ? <img src={user.image} alt={user.name} className="w-full h-full object-cover" />
        : <span className="text-white font-bold">{user.name?.[0]?.toUpperCase()}</span>}
    </div>
  );
}

function timeStr(date: string) {
  const d = new Date(date), now = new Date();
  if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

function MessagesContent() {
  const searchParams = useSearchParams();
  const initUserId   = searchParams.get("user");
  const me           = useAppSelector(s => s.auth.user);

  const [threads, setThreads]     = useState<Thread[]>([]);
  const [contacts, setContacts]   = useState<MiniUser[]>([]);
  const [activeId, setActiveId]   = useState<string | null>(initUserId);
  const [partner, setPartner]     = useState<MiniUser | null>(null);
  const [messages, setMessages]   = useState<Message[]>([]);
  const [draft, setDraft]         = useState("");
  const [sending, setSending]     = useState(false);
  const [threadsLoading, setThreadsLoading] = useState(true);
  const [chatLoading, setChatLoading]       = useState(false);
  const [search, setSearch]       = useState("");
  // File attachment state
  const [attachFile, setAttachFile]   = useState<File | null>(null);
  const [attachPreview, setAttachPreview] = useState<string | null>(null);
  const [uploading, setUploading]     = useState(false);
  const [sendError, setSendError]     = useState<string | null>(null);
  const bottomRef   = useRef<HTMLDivElement>(null);
  const textareaRef  = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lkRoom       = useRef<Room | null>(null);
  const enc          = useRef(new TextEncoder());
  const dec          = useRef(new TextDecoder());

  const loadThreads = useCallback(async () => {
    if (!me) return;
    try {
      const res = await fetch("/api/messages");
      const data = await res.json();
      setThreads(Array.isArray(data) ? data : []);
    } catch { /**/ } finally { setThreadsLoading(false); }
  }, [me]);

  const loadChat = useCallback(async (userId: string) => {
    setChatLoading(true);
    try {
      const res = await fetch(`/api/messages/${userId}`);
      const data = await res.json();
      setMessages(data.messages ?? []);
      setPartner(data.partner ?? null);
    } catch { /**/ } finally { setChatLoading(false); }
  }, []);

  useEffect(() => { loadThreads(); }, [loadThreads]);
  useEffect(() => { if (activeId) loadChat(activeId); }, [activeId, loadChat]);

  useEffect(() => {
    if (!me) return;
    fetch("/api/connections")
      .then(r => r.ok ? r.json() : {})
      .then((data: { connections?: { requester: MiniUser; receiver: MiniUser }[] }) => {
        const conns = data.connections ?? [];
        const people: MiniUser[] = conns.map((c: { requester: MiniUser; receiver: MiniUser }) =>
          c.requester.id === me.id ? c.receiver : c.requester
        );
        setContacts(people);
        if (initUserId) {
          const found = people.find((p: MiniUser) => p.id === initUserId);
          if (found) setPartner(found);
        }
      })
      .catch(() => {});
  }, [me, initUserId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Scroll to bottom only on new messages
  useEffect(() => {
    if (messages.length > 0) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  // ── LiveKit real-time channel ──────────────────────────────────────
  useEffect(() => {
    if (!activeId || !me?.id) return;
    let room: Room | null = null;
    let cancelled = false;

    const connect = async () => {
      try {
        const res  = await fetch("/api/messages/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ partnerId: activeId }),
        });
        const { token, url } = await res.json() as { token: string; url: string };
        if (cancelled) return;

        room = new Room();
        lkRoom.current = room;

        room.on(RoomEvent.DataReceived, (data: Uint8Array) => {
          try {
            const msg = JSON.parse(dec.current.decode(data)) as Message;
            setMessages(prev =>
              prev.some(m => m.id === msg.id) ? prev : [...prev, msg]
            );
          } catch { /**/ }
        });

        await room.connect(url, token);
      } catch { /**/ }
    };

    connect();
    return () => {
      cancelled = true;
      lkRoom.current?.disconnect();
      lkRoom.current = null;
    };
  }, [activeId, me?.id]);
  // ─────────────────────────────────────────────────────────────────

  // Upload file via server-side API (uses Cloudinary signed upload — works for all file types)
  const uploadToCloudinary = async (file: File): Promise<{ url: string; fileType: string } | null> => {
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res  = await fetch("/api/upload/message", { method: "POST", body: fd });
      if (!res.ok) return null;
      const data = await res.json() as { url?: string; fileType?: string };
      return data.url ? { url: data.url, fileType: data.fileType ?? file.type } : null;
    } catch { return null; }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAttachFile(file);
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (ev) => setAttachPreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setAttachPreview(null);
    }
    // Reset input so same file can be re-selected
    e.target.value = "";
  };

  const removeAttachment = () => { setAttachFile(null); setAttachPreview(null); };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!draft.trim() && !attachFile) || !activeId) return;
    setSending(true);
    const content = draft.trim();
    setDraft("");
    const fileToSend = attachFile;
    removeAttachment();
    setSendError(null);
    try {
      let fileUrl: string | null = null;
      let fileName: string | null = null;
      let fileType: string | null = null;
      if (fileToSend) {
        setUploading(true);
        const uploaded = await uploadToCloudinary(fileToSend);
        setUploading(false);
        if (!uploaded) {
          setSendError("File upload failed. Please try again.");
          setTimeout(() => setSendError(null), 4000);
          setSending(false);
          return;
        }
        fileUrl  = uploaded.url;
        fileName = fileToSend.name;
        fileType = uploaded.fileType;
      }
      const res = await fetch(`/api/messages/${activeId}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, fileUrl, fileName, fileType }),
      });
      if (res.ok) {
        const newMsg = await res.json() as Message;
        setMessages(prev => [...prev, newMsg]);
        lkRoom.current?.localParticipant?.publishData(
          enc.current.encode(JSON.stringify(newMsg)),
          { reliable: true }
        );
        loadThreads();
      } else {
        const err = await res.json().catch(() => ({})) as { error?: string };
        const msg = err.error ?? "Failed to send message";
        setSendError(msg);
        setTimeout(() => setSendError(null), 4000);
      }
    } catch { /**/ } finally { setSending(false); setUploading(false); }
  };

  if (!me) return (
    <div className="fixed inset-0 top-[68px] bg-slate-100 flex items-center justify-center text-center px-4">
      <div>
        <MessageSquare className="w-16 h-16 text-slate-200 mx-auto mb-4" />
        <h1 className="text-xl font-black text-[#0a1628] mb-2">Sign in to view messages</h1>
        <Link href="/login" className="inline-flex items-center gap-2 bg-[#0a1628] text-white font-bold text-sm px-6 py-3 rounded-full mt-3 hover:bg-[#1a3a6b] transition-all">Sign In</Link>
      </div>
    </div>
  );

  if (me.tier === "FREE" && me.role !== "ADMIN") return (
    <UpgradeGate
      feature="Private Messaging"
      description="Send and receive private messages with your connections. Available exclusively for VIP members."
    />
  );

  const filteredContacts = search
    ? contacts.filter(c => c.name.toLowerCase().includes(search.toLowerCase()))
    : contacts;

  return (
    /* Fixed: sits below navbar (68px), above nothing — hides footer completely */
    <div className="fixed inset-0 top-[68px] bg-slate-100 flex overflow-hidden">
      <div className="max-w-[1200px] w-full mx-auto flex gap-0 h-full overflow-hidden">

        {/* ── Left: Thread + Contacts list ── */}
        <div className={`bg-white flex flex-col overflow-hidden border-r border-slate-200
          ${activeId ? "hidden md:flex md:w-[320px] shrink-0" : "flex flex-1 md:flex-none md:w-[320px] md:shrink-0"}`}>

          {/* Header */}
          <div className="px-5 py-4 border-b border-slate-100 shrink-0">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-black text-[#0a1628] text-lg">Messages</h2>
              <Link href="/connections" className="text-xs font-semibold text-[#d4a017] hover:text-[#a07810] transition-colors">+ Connect</Link>
            </div>
            {/* Search */}
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
              <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <input type="text" placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)}
                className="flex-1 bg-transparent font-[inherit] text-xs text-slate-600 outline-none placeholder-slate-400" />
            </div>
          </div>

          {/* Your Network row */}
          {contacts.length > 0 && (
            <div className="px-5 py-3 border-b border-slate-100 shrink-0">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Your Network</p>
              <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none">
                {filteredContacts.map(c => (
                  <button key={c.id} onClick={() => setActiveId(c.id)} title={c.name}
                    className={`flex flex-col items-center gap-1 shrink-0 transition-all p-1.5 rounded-xl ${activeId === c.id ? "bg-slate-100" : "hover:bg-slate-50"}`}>
                    <div className={`w-10 h-10 rounded-full overflow-hidden flex items-center justify-center border-2 transition-all ${activeId === c.id ? "border-[#0a1628]" : "border-transparent bg-[#0a1628]"}`}>
                      {c.image
                        ? <img src={c.image} alt={c.name} className="w-full h-full object-cover" />
                        : <span className="text-white font-bold text-xs">{c.name[0]?.toUpperCase()}</span>}
                    </div>
                    <span className="text-[10px] text-slate-500 max-w-[44px] truncate leading-tight">{c.name.split(" ")[0]}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Thread list — scrollable */}
          <div className="flex-1 overflow-y-auto min-h-0">
            {threadsLoading ? (
              <div className="flex items-center justify-center h-24">
                <Loader2 className="w-5 h-5 text-[#d4a017] animate-spin" />
              </div>
            ) : threads.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center gap-2">
                <MessageSquare className="w-8 h-8 text-slate-200" />
                <p className="text-xs font-semibold text-slate-400">No conversations yet</p>
                <p className="text-xs text-slate-400">Click a contact above to start chatting</p>
              </div>
            ) : (
              threads
                .filter(t => !search || t.partner.name.toLowerCase().includes(search.toLowerCase()))
                .map(t => (
                <button key={t.id} onClick={() => setActiveId(t.partner.id)}
                  className={`w-full flex items-center gap-3 px-5 py-3.5 text-left transition-all hover:bg-slate-50 border-b border-slate-50 last:border-0 ${activeId === t.partner.id ? "bg-blue-50/50 border-l-2 border-l-[#0a1628]" : ""}`}>
                  <Avatar user={t.partner} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-[#0a1628] text-sm truncate">{t.partner.name}</div>
                    <div className="text-xs text-slate-400 truncate mt-0.5">{t.content}</div>
                  </div>
                  <div className="text-[10px] text-slate-400 shrink-0 leading-none">{timeStr(t.createdAt)}</div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* ── Right: Chat window ── */}
        {activeId ? (
          <div className="flex-1 bg-white flex flex-col overflow-hidden min-w-0">
            {/* Chat header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3 shrink-0">
              <button onClick={() => setActiveId(null)} className="md:hidden p-1.5 hover:bg-slate-100 rounded-lg transition-all">
                <ArrowLeft className="w-4 h-4 text-slate-500" />
              </button>
              {partner ? (
                <>
                  <Avatar user={partner} size="sm" />
                  <div>
                    <div className="font-bold text-[#0a1628] text-sm">{partner.name}</div>
                    {partner.headline && <div className="text-xs text-slate-400">{partner.headline}</div>}
                  </div>
                </>
              ) : (
                <div className="w-32 h-4 bg-slate-100 rounded animate-pulse" />
              )}
            </div>

            {/* Messages — scrollable */}
            <div className="flex-1 overflow-y-auto min-h-0 px-5 py-4 space-y-2.5">
              {chatLoading ? (
                <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 text-[#d4a017] animate-spin" /></div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center gap-2">
                  <MessageSquare className="w-10 h-10 text-slate-100" />
                  <p className="text-slate-300 font-semibold">Say hello! 👋</p>
                </div>
              ) : (
                messages.map(msg => {
                  const isMine = msg.senderId === me.id;

                  // Sponsored message — distinct amber card layout
                  if (msg.isSponsored) {
                    // content is stored as "**subject**\n\nbody"
                    const raw = msg.content;
                    const subjectMatch = raw.match(/^\*\*(.+?)\*\*/);
                    const subject = subjectMatch ? subjectMatch[1] : "";
                    const body = raw.replace(/^\*\*.+?\*\*\n\n?/, "").trim();
                    return (
                      <div key={msg.id} className="flex justify-start">
                        <div className="max-w-[75%] rounded-2xl rounded-bl-none border-l-4 border-amber-400 bg-amber-50 overflow-hidden">
                          <div className="flex items-center gap-2 bg-amber-400/20 px-4 py-1.5">
                            <Megaphone className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            <span className="text-[10px] font-black text-amber-700 uppercase tracking-wider">Sponsored</span>
                          </div>
                          <div className="px-4 py-3">
                            {subject && <p className="font-bold text-[#0a1628] text-sm mb-1">{subject}</p>}
                            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{body || raw}</p>
                            <span className="text-[10px] text-amber-500 mt-2 block">{timeStr(msg.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[65%] rounded-2xl text-sm leading-relaxed overflow-hidden ${
                        isMine ? "bg-[#0a1628] text-white rounded-br-none" : "bg-slate-100 text-slate-800 rounded-bl-none"}`}>
                        {/* File attachment */}
                        {msg.fileUrl && (() => {
                          const isImg = msg.fileType?.startsWith("image/");
                          if (isImg) return (
                            <a href={msg.fileUrl} target="_blank" rel="noreferrer">
                              <img src={msg.fileUrl} alt={msg.fileName ?? "image"} className="max-w-[260px] w-full object-cover rounded-xl" />
                            </a>
                          );
                          return (() => {
                            // Add fl_attachment to force download instead of inline display
                            const dlUrl = msg.fileUrl!.replace(/\/upload\/(?!fl_attachment)/, "/upload/fl_attachment/");
                            return (
                            <a
                              href={dlUrl}
                              download={msg.fileName ?? "file"}
                              target="_blank"
                              rel="noreferrer"
                              className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${
                                isMine ? "border-white/20 hover:bg-white/10" : "border-slate-200 hover:bg-slate-200"
                              } transition-all`}>
                              <FileText className={`w-6 h-6 shrink-0 ${isMine ? "text-white/70" : "text-slate-500"}`} />
                              <div className="flex-1 min-w-0">
                                <div className={`text-xs font-semibold truncate ${isMine ? "text-white" : "text-slate-700"}`}>{msg.fileName ?? "File"}</div>
                                <div className={`text-[10px] ${isMine ? "text-white/50" : "text-slate-400"}`}>Click to download</div>
                              </div>
                              <Download className={`w-4 h-4 shrink-0 ${isMine ? "text-white/50" : "text-slate-400"}`} />
                            </a>
                          );
                          })();
                        })()}
                        {/* Text content */}
                        {msg.content && <p className="px-4 py-2.5">{msg.content}</p>}
                        <div className={`flex items-center gap-1 px-4 pb-2 ${isMine ? "justify-end" : "justify-start"}`}>
                          <span className={`text-[10px] ${isMine ? "text-white/50" : "text-slate-400"}`}>{timeStr(msg.createdAt)}</span>
                          {isMine && (msg.isRead
                            ? <CheckCheck className="w-3 h-3 text-blue-300" />
                            : <Check className="w-3 h-3 text-white/40" />)}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={bottomRef} />
            </div>

            {/* Composer */}
            <form onSubmit={sendMessage} className="border-t border-slate-100 shrink-0">
              {/* Error banner */}
              {sendError && (
                <div className="mx-4 mt-3 px-4 py-2.5 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2">
                  <span className="text-red-500 text-xs font-semibold flex-1">{sendError}</span>
                  <button type="button" onClick={() => setSendError(null)} className="text-red-400 hover:text-red-600">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
              {/* File preview strip */}
              {attachFile && (
                <div className="flex items-center gap-3 px-4 pt-3">
                  <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 flex-1 min-w-0">
                    {attachPreview
                      ? <img src={attachPreview} alt="preview" className="w-10 h-10 rounded-lg object-cover shrink-0" />
                      : <FileText className="w-8 h-8 text-slate-400 shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-slate-700 truncate">{attachFile.name}</div>
                      <div className="text-[10px] text-slate-400">{(attachFile.size / 1024).toFixed(1)} KB</div>
                    </div>
                    <button type="button" onClick={removeAttachment} className="p-1 hover:bg-slate-200 rounded-lg transition-all">
                      <X className="w-3.5 h-3.5 text-slate-500" />
                    </button>
                  </div>
                </div>
              )}
              <div className="px-4 py-3 flex gap-3 items-center">
                {/* Hidden file input */}
                <input ref={fileInputRef} type="file"
                  accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip"
                  className="hidden" onChange={handleFileSelect} />
                {/* Attach button */}
                <button type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-9 h-9 flex items-center justify-center rounded-full border border-slate-200 hover:bg-slate-50 text-slate-400 hover:text-[#0a1628] transition-all shrink-0"
                  title="Attach file">
                  <Paperclip className="w-4 h-4" />
                </button>
                <input ref={textareaRef as unknown as React.RefObject<HTMLInputElement>}
                  type="text" value={draft}
                  onChange={e => setDraft(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); sendMessage(e as unknown as React.FormEvent); }}}
                  placeholder={attachFile ? "Add a caption… (optional)" : "Type a message…"}
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-full px-5 py-3 text-sm font-[inherit] outline-none focus:border-slate-300 transition-all" />
                <button type="submit" disabled={sending || uploading || (!draft.trim() && !attachFile)}
                  className="w-11 h-11 bg-[#0a1628] hover:bg-[#1a3a6b] text-white rounded-full flex items-center justify-center transition-all disabled:opacity-40 shrink-0 shadow-sm">
                  {(sending || uploading) ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="flex-1 bg-white hidden md:flex flex-col items-center justify-center text-center gap-3">
            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center">
              <MessageSquare className="w-8 h-8 text-slate-300" />
            </div>
            <p className="font-black text-slate-300 text-lg">Select a conversation</p>
            <p className="text-slate-400 text-sm max-w-[220px]">
              Pick from your network above or{" "}
              <Link href="/connections" className="text-[#0a1628] font-semibold hover:underline">connect with someone</Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-100" />}>
      <MessagesContent />
    </Suspense>
  );
}
