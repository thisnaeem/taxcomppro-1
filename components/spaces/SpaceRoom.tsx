"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  LiveKitRoom,
  useParticipants,
  useLocalParticipant,
  useTracks,
  AudioTrack,
  VideoTrack,
  useRoomContext,
} from "@livekit/components-react";
import { RoomEvent, Track } from "livekit-client";
import { Mic01Icon, MicOff02Icon, PhoneOff01Icon, Radio01Icon, Message01Icon } from "hugeicons-react";
import { Loader2, X, Hand, Send, Users, Monitor, MonitorOff, Maximize2, Minimize2, Link2, Check } from "lucide-react";

interface SpaceHost { id: string; name: string; image: string | null; headline: string | null; }
interface Space { id: string; name: string; description: string | null; roomName: string; hostId: string; host: SpaceHost; }
interface ChatMsg { id: string; from: string; text: string; }
interface Props { space: Space; token: string; isAdmin: boolean; userId: string; onEnd: () => void; ending: boolean; }

const enc = new TextEncoder();
const dec = new TextDecoder();

function Avatar({ name, image, isHost, isSpeaking, micOn, handUp, size = "lg" }: {
  name: string; image?: string | null; isHost: boolean; isSpeaking: boolean; micOn: boolean; handUp: boolean; size?: "sm" | "lg";
}) {
  const dim = size === "lg" ? "w-16 h-16" : "w-10 h-10";
  const text = size === "lg" ? "text-2xl" : "text-base";
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative">
        {/* Speaking glow ring */}
        {isSpeaking && (
          <div className={`absolute -inset-1 rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 animate-pulse opacity-80`} />
        )}
        <div className={`relative ${dim} rounded-full flex items-center justify-center overflow-hidden border-2 ${isSpeaking ? "border-violet-400" : isHost ? "border-indigo-500/70" : "border-white/15"} z-10`}
          style={{ background: "linear-gradient(135deg,#1e1b4b,#312e81)" }}>
          {image
            ? <img src={image} alt={name} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
            : <span className={`text-white font-black ${text}`}>{name[0]?.toUpperCase()}</span>}
        </div>
        {/* Mic off badge */}
        {!micOn && (
          <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-[#0d1635] rounded-full flex items-center justify-center border border-white/20 z-20">
            <MicOff02Icon className="w-2.5 h-2.5 text-red-400" />
          </div>
        )}
        {/* Hand up badge */}
        {handUp && (
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center text-[11px] z-20 shadow-lg">✋</div>
        )}
      </div>
      <div className="text-center">
        <p className="text-white/80 text-xs font-semibold leading-none truncate max-w-[60px]">{name.split(" ")[0]}</p>
        {isHost && <p className="text-violet-400 text-[10px] font-bold mt-0.5">Host</p>}
      </div>
    </div>
  );
}

function getParticipantImage(metadata?: string): string | null {
  if (!metadata) return null;
  try { return (JSON.parse(metadata) as { image?: string | null }).image ?? null; }
  catch { return null; }
}

function RoomInner({ space, isAdmin, userId, onEnd, ending }: Omit<Props, "token">) {
  const router = useRouter();
  const room = useRoomContext();
  const participants = useParticipants();
  const { localParticipant, isMicrophoneEnabled } = useLocalParticipant();
  const isHost = isAdmin || localParticipant?.identity === space.hostId || userId === space.hostId;

  const [chat, setChat]           = useState<ChatMsg[]>([]);
  const [chatOpen, setChatOpen]   = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [raised, setRaised]       = useState<Set<string>>(new Set());
  const [myHandUp, setMyHandUp]   = useState(false);
  const [unread, setUnread]       = useState(0);
  const [screenError, setScreenError] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const screenContainerRef = useRef<HTMLDivElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  const copyShareLink = useCallback(() => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }).catch(() => {
      // Fallback for non-HTTPS or old browsers
      const el = document.createElement("textarea");
      el.value = url;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }, []);

  const audioTracks  = useTracks([Track.Source.Microphone], { onlySubscribed: false });
  const screenTracks = useTracks([Track.Source.ScreenShare], { onlySubscribed: false });
  const { isScreenShareEnabled } = useLocalParticipant();

  const toggleScreenShare = useCallback(async () => {
    setScreenError("");
    try {
      await localParticipant.setScreenShareEnabled(!isScreenShareEnabled);
    } catch (e: unknown) {
      const err = e as Error;
      if (!err?.message?.includes("denied")) setScreenError("Screen share failed.");
    }
  }, [isScreenShareEnabled, localParticipant]);

  const toggleFullscreen = useCallback(async () => {
    if (!screenContainerRef.current) return;
    if (!document.fullscreenElement) {
      await screenContainerRef.current.requestFullscreen();
    } else {
      await document.exitFullscreen();
    }
  }, []);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  useEffect(() => {
    const handler = (data: Uint8Array) => {
      try {
        const msg = JSON.parse(dec.decode(data)) as { type: string; from?: string; text?: string; identity?: string; up?: boolean };
        if (msg.type === "chat") {
          setChat(p => [...p, { id: `${Date.now()}${Math.random()}`, from: msg.from!, text: msg.text! }]);
          if (!chatOpen) setUnread(u => u + 1);
        } else if (msg.type === "hand") {
          setRaised(prev => { const s = new Set(prev); msg.up ? s.add(msg.identity!) : s.delete(msg.identity!); return s; });
        }
      } catch {}
    };
    room.on(RoomEvent.DataReceived, handler);
    return () => { room.off(RoomEvent.DataReceived, handler); };
  }, [room, chatOpen]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chat]);
  useEffect(() => { if (chatOpen) setUnread(0); }, [chatOpen]);

  const sendChat = useCallback(() => {
    if (!chatInput.trim()) return;
    const msg = { type: "chat", from: localParticipant.name ?? "You", text: chatInput.trim() };
    room.localParticipant.publishData(enc.encode(JSON.stringify(msg)), { reliable: true });
    setChat(p => [...p, { id: `${Date.now()}`, from: "You", text: chatInput.trim() }]);
    setChatInput("");
  }, [chatInput, room, localParticipant]);

  const toggleHand = useCallback(() => {
    const up = !myHandUp;
    setMyHandUp(up);
    const msg = { type: "hand", identity: localParticipant.identity, up };
    room.localParticipant.publishData(enc.encode(JSON.stringify(msg)), { reliable: true });
    setRaised(prev => { const s = new Set(prev); up ? s.add(localParticipant.identity) : s.delete(localParticipant.identity); return s; });
  }, [myHandUp, room, localParticipant]);

  const speakers  = participants.filter(p => p.identity === space.hostId || p.isMicrophoneEnabled);
  const listeners = participants.filter(p => p.identity !== space.hostId && !p.isMicrophoneEnabled);

  return (
    <div className="flex h-full w-full bg-[#06091a] overflow-hidden relative">
      {/* Ambient blobs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full bg-violet-700/10 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-80 h-80 rounded-full bg-indigo-700/10 blur-[100px] pointer-events-none" />

      {/* ── Main stage ── */}
      <div className="flex-1 flex flex-col min-w-0 relative">

        {/* Top bar */}
        <div className="flex items-center gap-4 px-6 py-4 border-b-2 border-violet-900/60 bg-[#0b0f28]">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20 shrink-0">
            <Radio01Icon className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" />
              <h1 className="text-white font-bold text-sm truncate">{space.name}</h1>
            </div>
            {space.description && <p className="text-white/35 text-xs truncate mt-0.5">{space.description}</p>}
          </div>
          {/* Share link + participant count */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              id="pro-talk-share-btn"
              onClick={copyShareLink}
              title="Share this Pro Talk"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                copied
                  ? "bg-emerald-500/20 border border-emerald-500/40 text-emerald-300"
                  : "bg-white/8 border border-white/15 text-white/60 hover:text-white hover:bg-white/15"
              }`}
            >
              {copied ? <><Check className="w-3.5 h-3.5" /> Copied!</> : <><Link2 className="w-3.5 h-3.5" /> Share Link</>}
            </button>
            <div className="flex items-center gap-1.5 bg-white/6 rounded-full px-3 py-1.5">
              <Users className="w-3.5 h-3.5 text-white/40" />
              <span className="text-white/50 text-xs font-medium">{participants.length}</span>
            </div>
          </div>
        </div>

        {/* Audio (invisible) */}
        {audioTracks.map(t => t.participant.isLocal ? null : <AudioTrack key={t.publication.trackSid} trackRef={t} />)}

        {/* ── Screen share panel ── */}
        {screenTracks.length > 0 && (
          <div ref={screenContainerRef} className="mx-4 mt-4 rounded-2xl overflow-hidden border border-violet-500/30 bg-black shrink-0">
            <div className="flex items-center gap-2 px-3 py-2 bg-violet-900/40 border-b border-violet-500/20">
              <Monitor className="w-3.5 h-3.5 text-violet-400" />
              <span className="text-violet-300 text-xs font-semibold flex-1 truncate">
                {screenTracks[0].participant.name ?? screenTracks[0].participant.identity} is sharing their screen
              </span>
              {screenTracks.length > 1 && (
                <span className="text-violet-400/60 text-[10px]">+{screenTracks.length - 1} more</span>
              )}
              <button
                onClick={toggleFullscreen}
                title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
                className="ml-2 w-6 h-6 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-violet-300 hover:text-white transition-all shrink-0">
                {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>
            </div>
            <VideoTrack trackRef={screenTracks[0]} className="w-full max-h-[45vh] object-contain bg-black" />
          </div>
        )}

        {/* Participants */}
        <div className="flex-1 overflow-y-auto px-6 py-8 space-y-10">
          {/* Speakers */}
          {speakers.length > 0 && (
            <section>
              <p className="text-white/25 text-[11px] font-bold uppercase tracking-[0.15em] mb-6">
                🎤 Speakers · {speakers.length}
              </p>
              <div className="flex flex-wrap gap-8">
                {speakers.map(p => (
                  <Avatar key={p.identity} name={p.name ?? p.identity}
                    image={getParticipantImage(p.metadata)}
                    isHost={p.identity === space.hostId} isSpeaking={p.isSpeaking}
                    micOn={p.isMicrophoneEnabled} handUp={raised.has(p.identity)} />
                ))}
              </div>
            </section>
          )}

          {/* Divider */}
          {speakers.length > 0 && listeners.length > 0 && (
            <div className="border-t border-white/6" />
          )}

          {/* Listeners */}
          {listeners.length > 0 && (
            <section>
              <p className="text-white/25 text-[11px] font-bold uppercase tracking-[0.15em] mb-6">
                👂 Listeners · {listeners.length}
              </p>
              <div className="flex flex-wrap gap-5">
                {listeners.map(p => (
                  <Avatar key={p.identity} name={p.name ?? p.identity}
                    image={getParticipantImage(p.metadata)}
                    size="sm" isHost={false} isSpeaking={p.isSpeaking}
                    micOn={p.isMicrophoneEnabled} handUp={raised.has(p.identity)} />
                ))}
              </div>
            </section>
          )}

          {participants.length === 0 && (
            <div className="flex-1 flex items-center justify-center py-20 text-white/20 text-sm">Connecting…</div>
          )}
        </div>

        {/* Control bar */}
        <div className="border-t border-white/8 bg-[#06091a]/80 backdrop-blur-xl px-6 py-4">
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <CtrlBtn
              active={isMicrophoneEnabled}
              activeClass="bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-500/30"
              inactiveClass="bg-white/8 hover:bg-white/12 text-white/60"
              onClick={() => localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled)}>
              {isMicrophoneEnabled ? <><Mic01Icon className="w-4 h-4" /> Mute</> : <><MicOff02Icon className="w-4 h-4" /> Unmute</>}
            </CtrlBtn>

            <CtrlBtn
              active={myHandUp}
              activeClass="bg-amber-500 hover:bg-amber-400 text-white"
              inactiveClass="bg-white/8 hover:bg-white/12 text-white/60"
              onClick={toggleHand}>
              <Hand className="w-4 h-4" /> {myHandUp ? "Lower Hand" : "Raise Hand"}
            </CtrlBtn>

            <CtrlBtn
              active={isScreenShareEnabled}
              activeClass="bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/30"
              inactiveClass="bg-white/8 hover:bg-white/12 text-white/60"
              onClick={toggleScreenShare}>
              {isScreenShareEnabled
                ? <><MonitorOff className="w-4 h-4" /> Stop Share</>
                : <><Monitor className="w-4 h-4" /> Share Screen</>}
            </CtrlBtn>

            <button onClick={() => setChatOpen(v => !v)}
              className={`relative flex items-center gap-2 px-5 py-2.5 rounded-2xl font-semibold text-sm transition-all border ${chatOpen ? "bg-white/12 border-white/20 text-white" : "bg-white/8 hover:bg-white/12 border-transparent text-white/60"}`}>
              <Message01Icon className="w-4 h-4" /> Chat
              {unread > 0 && <span className="absolute -top-1.5 -right-1.5 w-4.5 h-4.5 bg-violet-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center">{unread}</span>}
            </button>

            <button onClick={() => router.push("/pro-talks")}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white/8 hover:bg-red-500/15 text-white/60 hover:text-red-400 font-semibold text-sm transition-all border border-transparent">
              <PhoneOff01Icon className="w-4 h-4" /> Leave
            </button>

            {(isAdmin || isHost) && (
              <button onClick={onEnd} disabled={ending}
                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-bold text-sm transition-all shadow-lg shadow-red-500/20 disabled:opacity-40">
                {ending ? <Loader2 className="w-4 h-4 animate-spin" /> : <PhoneOff01Icon className="w-4 h-4" />} End Room
              </button>
            )}
          </div>
          {screenError && (
            <p className="text-center text-red-400/80 text-xs mt-2">{screenError}</p>
          )}
        </div>
      </div>

      {/* ── Chat panel ── slides in from right, never absolute */}
      <div className={`flex flex-col shrink-0 border-l border-white/8 bg-[#080c20] transition-all duration-300 overflow-hidden ${chatOpen ? "w-80" : "w-0"}`}>
        {/* Chat header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
          <div>
            <h3 className="text-white font-bold text-sm">Live Chat</h3>
            <p className="text-white/30 text-xs mt-0.5">{chat.length} messages</p>
          </div>
          <button onClick={() => setChatOpen(false)}
            className="w-7 h-7 rounded-full bg-white/8 hover:bg-white/15 flex items-center justify-center text-white/50 hover:text-white transition-all">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {chat.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full gap-3 py-10">
              <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                <Message01Icon className="w-5 h-5 text-white/20" />
              </div>
              <p className="text-white/20 text-xs text-center">No messages yet.<br />Say hello! 👋</p>
            </div>
          )}
          {chat.map(m => (
            <div key={m.id} className={`flex gap-2.5 ${m.from === "You" ? "flex-row-reverse" : ""}`}>
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shrink-0 text-white text-[11px] font-bold">
                {m.from[0]?.toUpperCase()}
              </div>
              <div className={`max-w-[180px] ${m.from === "You" ? "items-end" : "items-start"} flex flex-col gap-0.5`}>
                <span className="text-white/35 text-[10px] font-medium px-1">{m.from === "You" ? "You" : m.from}</span>
                <div className={`px-3 py-2 rounded-2xl text-xs leading-relaxed ${m.from === "You" ? "bg-violet-600/70 text-white rounded-tr-sm" : "bg-white/8 text-white/80 rounded-tl-sm"}`}>
                  {m.text}
                </div>
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-white/8">
          <div className="flex gap-2 items-center bg-white/6 border border-white/12 rounded-2xl px-3 py-2 focus-within:border-violet-500/50 transition-all">
            <input value={chatInput} onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && sendChat()}
              placeholder="Message the room…"
              className="flex-1 bg-transparent text-white placeholder-white/25 outline-none text-xs" />
            <button onClick={sendChat} disabled={!chatInput.trim()}
              className="w-7 h-7 rounded-full bg-violet-600 hover:bg-violet-500 flex items-center justify-center text-white transition-all disabled:opacity-30 shrink-0">
              <Send className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CtrlBtn({ active, activeClass, inactiveClass, onClick, children }: { active: boolean; activeClass: string; inactiveClass: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-semibold text-sm transition-all ${active ? activeClass : inactiveClass}`}>
      {children}
    </button>
  );
}

export default function SpaceRoom({ space, token, isAdmin, userId, onEnd, ending }: Props) {
  const [connected, setConnected] = useState(false);
  const lkUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL ?? "";
  const router = useRouter();

  return (
    <LiveKitRoom serverUrl={lkUrl} token={token} connect audio video={false}
      onConnected={() => setConnected(true)}
      onDisconnected={() => router.push("/pro-talks")}
      style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", flexDirection: "column" }}>
      {!connected ? (
        <div className="fixed inset-0 z-[100] bg-[#06091a] flex flex-col items-center justify-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center mb-2 shadow-xl shadow-violet-500/30">
            <Radio01Icon className="w-7 h-7 text-white" />
          </div>
          <Loader2 className="w-6 h-6 animate-spin text-violet-400" />
          <p className="text-white/40 text-sm">Connecting to <span className="text-white/70 font-medium">{space.name}</span>…</p>
        </div>
      ) : (
        <RoomInner space={space} isAdmin={isAdmin} userId={userId} onEnd={onEnd} ending={ending} />
      )}
    </LiveKitRoom>
  );
}
