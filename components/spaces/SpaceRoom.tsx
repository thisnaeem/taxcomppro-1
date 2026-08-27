"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  LiveKitRoom,
  useParticipants,
  useLocalParticipant,
  useTracks,
  VideoTrack,
  useRoomContext,
  RoomAudioRenderer,
  StartAudio,
} from "@livekit/components-react";
import { RoomEvent, Track, ConnectionState } from "livekit-client";
import { Mic01Icon, MicOff02Icon, PhoneOff01Icon, Radio01Icon, Message01Icon } from "hugeicons-react";
import {
  Loader2, X, Hand, Send, Users, Monitor, MonitorOff,
  Maximize2, Minimize2, Link2, Check, UserPlus, UserMinus, Sparkles,
  Video, VideoOff, Camera
} from "lucide-react";

interface SpaceHost { id: string; name: string; image: string | null; headline: string | null; }
interface Space { id: string; name: string; description: string | null; roomName: string; hostId: string; host: SpaceHost; }
interface ChatMsg { id: string; from: string; text: string; }
interface Props { space: Space; token: string; isAdmin: boolean; userId: string; onEnd: () => void; ending: boolean; }

const enc = new TextEncoder();
const dec = new TextDecoder();

function Avatar({
  name, image, isHost, isSpeaking, micOn, handUp, isSpeaker,
  canManage, onPromote, onDemote, size = "lg",
}: {
  name: string;
  image?: string | null;
  isHost: boolean;
  isSpeaking: boolean;
  micOn: boolean;
  handUp: boolean;
  isSpeaker: boolean;
  canManage: boolean;
  onPromote?: () => void;
  onDemote?: () => void;
  size?: "sm" | "lg";
}) {
  const dim = size === "lg" ? "w-16 h-16" : "w-12 h-12";
  const text = size === "lg" ? "text-2xl" : "text-base";

  return (
    <div className="flex flex-col items-center gap-2 group relative">
      <div className="relative">
        {/* Speaking pulse ring */}
        {isSpeaking && micOn && (
          <div className="absolute -inset-1.5 rounded-full bg-gradient-to-r from-lime-400 via-emerald-500 to-teal-500 animate-pulse opacity-90 blur-[1px]" />
        )}
        <div
          className={`relative ${dim} rounded-full flex items-center justify-center overflow-hidden border-2 ${
            isSpeaking && micOn
              ? "border-lime-400 shadow-lg shadow-emerald-500/50"
              : isHost
              ? "border-lime-400"
              : isSpeaker
              ? "border-emerald-500/80"
              : "border-white/15"
          } z-10`}
          style={{ background: "linear-gradient(135deg,#06172e,#0a2e4c)" }}
        >
          {image ? (
            <img src={image} alt={name} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
          ) : (
            <span className={`text-white font-black ${text}`}>{name[0]?.toUpperCase()}</span>
          )}
        </div>

        {/* Mic status badge (for speakers) */}
        {isSpeaker && (
          <div
            className={`absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full flex items-center justify-center border border-white/20 z-20 ${
              micOn ? "bg-emerald-500" : "bg-[#061426]"
            }`}
          >
            {micOn ? (
              <Mic01Icon className="w-2.5 h-2.5 text-[#060e1a]" />
            ) : (
              <MicOff02Icon className="w-2.5 h-2.5 text-red-400" />
            )}
          </div>
        )}

        {/* Hand up badge */}
        {handUp && (
          <div className="absolute -top-1 -right-1 w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center text-[12px] z-20 shadow-lg animate-bounce">
            ✋
          </div>
        )}
      </div>

      <div className="text-center max-w-[80px]">
        <p className="text-white/90 text-xs font-semibold leading-tight truncate">{name.split(" ")[0]}</p>
        {isHost ? (
          <p className="text-lime-400 text-[10px] font-bold mt-0.5">Host</p>
        ) : isSpeaker ? (
          <p className="text-emerald-400 text-[10px] font-semibold mt-0.5">Speaker</p>
        ) : (
          <p className="text-white/40 text-[10px] mt-0.5">Attendee</p>
        )}
      </div>

      {/* Host quick-action overlay button */}
      {canManage && !isHost && (
        <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-2 -right-2 z-30">
          {!isSpeaker && onPromote && (
            <button
              onClick={onPromote}
              title="Invite to Stage as Speaker"
              className="px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold flex items-center gap-1 shadow-lg"
            >
              <UserPlus className="w-3 h-3" /> Make Speaker
            </button>
          )}
          {isSpeaker && onDemote && (
            <button
              onClick={onDemote}
              title="Move to Attendees"
              className="px-2 py-1 rounded-lg bg-red-600/80 hover:bg-red-600 text-white text-[10px] font-bold flex items-center gap-1 shadow-lg"
            >
              <UserMinus className="w-3 h-3" /> Demote
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Live Video Tile for webcam-enabled speakers ───────────────────────────────
function VideoTile({
  name,
  isHost,
  isSpeaking,
  micOn,
  handUp,
  trackRef,
  canManage,
  onDemote,
}: {
  name: string;
  isHost: boolean;
  isSpeaking: boolean;
  micOn: boolean;
  handUp: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  trackRef: any;
  canManage: boolean;
  onDemote?: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-2 group relative">
      <div className="relative w-48 sm:w-56 md:w-64 aspect-video rounded-2xl overflow-hidden border-2 border-emerald-400 bg-black shadow-xl shadow-emerald-500/20">
        <VideoTrack trackRef={trackRef} className="w-full h-full object-cover" />

        {/* Speaking pulse overlay */}
        {isSpeaking && micOn && (
          <div className="absolute inset-0 ring-4 ring-lime-400 ring-inset pointer-events-none rounded-2xl animate-pulse" />
        )}

        {/* Hand up indicator */}
        {handUp && (
          <div className="absolute top-2 left-2 w-7 h-7 bg-amber-500 rounded-full flex items-center justify-center text-[13px] z-20 shadow-lg animate-bounce">
            ✋
          </div>
        )}

        {/* Bottom bar with name and status */}
        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-[#040a14]/90 via-[#040a14]/50 to-transparent px-3 py-2 flex items-center justify-between z-20">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-white text-xs font-bold truncate drop-shadow">{name.split(" ")[0]}</span>
            {isHost && (
              <span className="bg-lime-400 text-[#060e1a] text-[9px] font-black px-1.5 py-0.5 rounded tracking-wider">
                HOST
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <div className={`w-5 h-5 rounded-full flex items-center justify-center border border-white/20 ${micOn ? "bg-emerald-500 text-[#060e1a]" : "bg-[#061426] text-red-400"}`}>
              {micOn ? <Mic01Icon className="w-2.5 h-2.5" /> : <MicOff02Icon className="w-2.5 h-2.5" />}
            </div>
            <div className="w-5 h-5 rounded-full bg-emerald-500 text-[#060e1a] flex items-center justify-center border border-white/20">
              <Video className="w-2.5 h-2.5" />
            </div>
          </div>
        </div>

        {/* Host action overlay */}
        {canManage && !isHost && onDemote && (
          <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute top-2 right-2 z-30">
            <button
              onClick={onDemote}
              title="Move to Attendees"
              className="px-2 py-1 rounded-lg bg-red-600/90 hover:bg-red-600 text-white text-[10px] font-bold flex items-center gap-1 shadow-lg"
            >
              <UserMinus className="w-3 h-3" /> Demote
            </button>
          </div>
        )}
      </div>

      <div className="text-center max-w-[120px]">
        <p className="text-white/90 text-xs font-semibold leading-tight truncate">{name}</p>
        {isHost ? (
          <p className="text-lime-400 text-[10px] font-bold mt-0.5">Host • Live Video</p>
        ) : (
          <p className="text-emerald-400 text-[10px] font-semibold mt-0.5">Speaker • Live Video</p>
        )}
      </div>
    </div>
  );
}

function getParticipantImage(metadata?: string): string | null {
  if (!metadata) return null;
  try { return (JSON.parse(metadata) as { image?: string | null }).image ?? null; }
  catch { return null; }
}

function RoomInner({ space, isAdmin, userId, onEnd, ending }: Props) {
  const router           = useRouter();
  const room             = useRoomContext();
  const participants     = useParticipants();
  const { isMicrophoneEnabled, isScreenShareEnabled, isCameraEnabled, localParticipant } = useLocalParticipant();

  const [chatOpen,     setChatOpen]     = useState(false);
  const [chat,         setChat]         = useState<ChatMsg[]>([]);
  const [chatInput,    setChatInput]    = useState("");
  const [unread,       setUnread]       = useState(0);
  const [raised,       setRaised]       = useState<Map<string, string>>(new Map());
  const [myHandUp,     setMyHandUp]     = useState(false);
  const [screenError,  setScreenError]  = useState("");
  const [cameraError,  setCameraError]  = useState("");
  const [copied,       setCopied]       = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Set of approved speaker identities (host is always approved)
  const [approvedSpeakers, setApprovedSpeakers] = useState<Set<string>>(
    () => new Set([space.hostId])
  );

  const screenContainerRef = useRef<HTMLDivElement>(null);
  const chatEndRef         = useRef<HTMLDivElement>(null);

  const isHost = (localParticipant?.identity === space.hostId) || (userId === space.hostId) || isAdmin;
  const isLocalSpeaker = isHost || (localParticipant ? approvedSpeakers.has(localParticipant.identity) : false);

  // Show a temporary toast banner
  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  }, []);

  // Safe data publishing helper (catches transient datachannel errors on disconnect)
  const safePublishData = useCallback((payload: object) => {
    try {
      if (room.state === ConnectionState.Connected && room.localParticipant) {
        room.localParticipant.publishData(enc.encode(JSON.stringify(payload)), { reliable: true });
      }
    } catch (err) {
      console.debug("[ProTalk] DataChannel message skipped:", err);
    }
  }, [room]);

  const copyShareLink = useCallback(() => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }).catch(() => {
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

  const screenTracks = useTracks([Track.Source.ScreenShare], { onlySubscribed: false });
  const cameraTracks = useTracks([Track.Source.Camera], { onlySubscribed: false });

  const toggleScreenShare = useCallback(async () => {
    setScreenError("");
    try {
      await localParticipant.setScreenShareEnabled(!isScreenShareEnabled);
    } catch (e: unknown) {
      const err = e as Error;
      if (!err?.message?.includes("denied")) setScreenError("Screen share failed.");
    }
  }, [isScreenShareEnabled, localParticipant]);

  const toggleCamera = useCallback(async () => {
    if (!isLocalSpeaker) {
      // If attendee tries to turn on camera without speaker role, raise hand
      setMyHandUp(true);
      safePublishData({
        type: "hand",
        identity: localParticipant.identity,
        name: localParticipant.name ?? "Attendee",
        up: true,
      });
      showToast("✋ Hand raised! The host has been notified to bring you to the stage.");
      return;
    }
    setCameraError("");
    try {
      await localParticipant.setCameraEnabled(!isCameraEnabled);
      showToast(!isCameraEnabled ? "Webcam turned ON 📷" : "Webcam turned OFF");
    } catch (e: unknown) {
      const err = e as Error;
      if (!err?.message?.includes("denied") && !err?.message?.includes("cancelled")) {
        setCameraError("Camera permission needed");
        showToast("Unable to start video: please check camera permissions");
      }
    }
  }, [isLocalSpeaker, isCameraEnabled, localParticipant, safePublishData, showToast]);

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

  // Broadcast speaker sync to all participants
  const broadcastSpeakerSync = useCallback((speakersList: string[], promoted?: string, demoted?: string) => {
    safePublishData({
      type: "speaker_sync",
      speakers: speakersList,
      promoted,
      demoted,
    });
  }, [safePublishData]);

  // Host: promote an attendee to speaker
  const promoteToSpeaker = useCallback((targetIdentity: string, targetName: string) => {
    if (!isHost) return;
    setApprovedSpeakers(prev => {
      const next = new Set(prev);
      next.add(targetIdentity);
      broadcastSpeakerSync(Array.from(next), targetIdentity);
      return next;
    });
    // Remove hand raise if present
    setRaised(prev => {
      const next = new Map(prev);
      next.delete(targetIdentity);
      return next;
    });
    showToast(`Invited ${targetName} to Speak on Stage!`);
  }, [isHost, broadcastSpeakerSync, showToast]);

  // Host: demote speaker back to attendee
  const demoteSpeaker = useCallback((targetIdentity: string) => {
    if (!isHost || targetIdentity === space.hostId) return;
    setApprovedSpeakers(prev => {
      const next = new Set(prev);
      next.delete(targetIdentity);
      broadcastSpeakerSync(Array.from(next), undefined, targetIdentity);
      return next;
    });
  }, [isHost, space.hostId, broadcastSpeakerSync]);

  // Handle incoming LiveKit data messages (chat, hand raises, speaker sync)
  useEffect(() => {
    const handler = (data: Uint8Array) => {
      try {
        const msg = JSON.parse(dec.decode(data)) as {
          type: string;
          from?: string;
          text?: string;
          identity?: string;
          name?: string;
          up?: boolean;
          speakers?: string[];
          promoted?: string;
          demoted?: string;
        };

        if (msg.type === "chat") {
          setChat(p => [...p, { id: `${Date.now()}${Math.random()}`, from: msg.from!, text: msg.text! }]);
          if (!chatOpen) setUnread(u => u + 1);
        } else if (msg.type === "hand") {
          setRaised(prev => {
            const next = new Map(prev);
            if (msg.up) {
              next.set(msg.identity!, msg.name ?? "Attendee");
            } else {
              next.delete(msg.identity!);
            }
            return next;
          });
        } else if (msg.type === "speaker_sync") {
          if (Array.isArray(msg.speakers)) {
            setApprovedSpeakers(new Set(msg.speakers));
          }
          if (msg.promoted && localParticipant?.identity === msg.promoted) {
            showToast("🎉 You have been approved as a Speaker! You can now unmute your mic and share your webcam.");
          }
          if (msg.demoted && localParticipant?.identity === msg.demoted) {
            localParticipant.setMicrophoneEnabled(false);
            localParticipant.setCameraEnabled(false);
            showToast("You have been moved back to the Attendees section.");
          }
        } else if (msg.type === "request_speaker_sync" && isHost) {
          broadcastSpeakerSync(Array.from(approvedSpeakers));
        }
      } catch {}
    };

    room.on(RoomEvent.DataReceived, handler);
    return () => { room.off(RoomEvent.DataReceived, handler); };
  }, [room, chatOpen, isHost, localParticipant, approvedSpeakers, broadcastSpeakerSync, showToast]);

  // Sync speaker state when room connects
  useEffect(() => {
    if (isHost) return;

    const requestSync = () => {
      if (room.state === ConnectionState.Connected && room.localParticipant) {
        safePublishData({ type: "request_speaker_sync", identity: room.localParticipant.identity });
      }
    };

    if (room.state === ConnectionState.Connected) {
      requestSync();
    } else {
      room.once(RoomEvent.Connected, requestSync);
    }

    return () => {
      room.off(RoomEvent.Connected, requestSync);
    };
  }, [isHost, room, safePublishData]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chat]);
  useEffect(() => { if (chatOpen) setUnread(0); }, [chatOpen]);

  const sendChat = useCallback(() => {
    if (!chatInput.trim() || !localParticipant) return;
    const text = chatInput.trim();
    safePublishData({ type: "chat", from: localParticipant.name ?? "You", text });
    setChat(p => [...p, { id: `${Date.now()}`, from: "You", text }]);
    setChatInput("");
  }, [chatInput, localParticipant, safePublishData]);

  const toggleHand = useCallback(() => {
    if (!localParticipant) return;
    const up = !myHandUp;
    setMyHandUp(up);
    safePublishData({
      type: "hand",
      identity: localParticipant.identity,
      name: localParticipant.name ?? "Attendee",
      up,
    });
    setRaised(prev => {
      const next = new Map(prev);
      up ? next.set(localParticipant.identity, localParticipant.name ?? "You") : next.delete(localParticipant.identity);
      return next;
    });
    if (up) {
      showToast("✋ Hand raised! The host has been notified to bring you to the stage.");
    }
  }, [myHandUp, localParticipant, safePublishData, showToast]);

  // Handle microphone toggle
  const handleMicToggle = useCallback(async () => {
    if (!isLocalSpeaker) {
      // If attendee tries to unmute without speaker role, raise hand
      toggleHand();
      return;
    }
    await localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled);
  }, [isLocalSpeaker, isMicrophoneEnabled, localParticipant, toggleHand]);

  // Compute speakers and attendees strictly based on approved speaker status
  const speakers   = participants.filter(p => p.identity === space.hostId || approvedSpeakers.has(p.identity));
  const attendees  = participants.filter(p => p.identity !== space.hostId && !approvedSpeakers.has(p.identity));

  return (
    <div className="flex h-full w-full bg-[#040a14] overflow-hidden relative">
      {/* LiveKit remote audio playback engine */}
      <RoomAudioRenderer />
      <StartAudio label="Click anywhere to enable room audio" className="hidden" />

      {/* Ambient background glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full bg-emerald-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-80 h-80 rounded-full bg-blue-600/10 blur-[120px] pointer-events-none" />

      {/* Toast alert banner */}
      {toastMessage && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 bg-gradient-to-r from-lime-400 via-emerald-500 to-teal-500 text-[#060e1a] px-5 py-2.5 rounded-full shadow-2xl flex items-center gap-2 text-xs font-black animate-fade-in-up">
          <Sparkles className="w-4 h-4 text-[#060e1a]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ── Main stage ── */}
      <div className="flex-1 flex flex-col min-w-0 relative">

        {/* Top bar */}
        <div className="flex items-center gap-4 px-6 py-4 border-b border-emerald-950/60 bg-[#061224]">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-lime-400 via-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 shrink-0">
            <Radio01Icon className="w-4 h-4 text-[#060e1a]" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-lime-400 animate-pulse" />
              <h1 className="text-white font-bold text-sm truncate">{space.name}</h1>
            </div>
            {space.description && <p className="text-slate-400 text-xs truncate mt-0.5">{space.description}</p>}
          </div>

          {/* Share link + participant count */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              id="pro-talk-share-btn"
              onClick={copyShareLink}
              title="Share this Pro Talk"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                copied
                  ? "bg-emerald-500/20 border border-emerald-500/40 text-lime-300"
                  : "bg-white/8 border border-white/15 text-white/60 hover:text-white hover:bg-white/15"
              }`}
            >
              {copied ? <><Check className="w-3.5 h-3.5 text-lime-400" /> Copied!</> : <><Link2 className="w-3.5 h-3.5" /> Share Link</>}
            </button>
            <div className="flex items-center gap-1.5 bg-white/6 rounded-full px-3 py-1.5 border border-white/10">
              <Users className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-300 text-xs font-medium">{participants.length}</span>
            </div>
          </div>
        </div>

        {/* Host pending hand raise request bar */}
        {isHost && raised.size > 0 && (
          <div className="bg-amber-500/15 border-b border-amber-500/30 px-6 py-2.5 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-amber-300 font-bold">
              <Hand className="w-4 h-4 text-amber-400 animate-bounce" />
              <span>
                {raised.size} attendee{raised.size > 1 ? "s" : ""} requested to speak
              </span>
            </div>
            <div className="flex items-center gap-2 overflow-x-auto">
              {Array.from(raised.entries()).map(([reqId, reqName]) => (
                <div key={reqId} className="flex items-center gap-1 bg-amber-500/20 px-2.5 py-1 rounded-lg">
                  <span className="text-white font-medium truncate max-w-[100px]">{reqName}</span>
                  <button
                    onClick={() => promoteToSpeaker(reqId, reqName)}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-2 py-0.5 rounded text-[10px]"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => setRaised(prev => { const n = new Map(prev); n.delete(reqId); return n; })}
                    className="text-white/50 hover:text-white text-[10px] ml-1"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Screen share panel ── */}
        {screenTracks.length > 0 && (
          <div ref={screenContainerRef} className="mx-4 mt-4 rounded-2xl overflow-hidden border border-emerald-500/30 bg-black shrink-0">
            <div className="flex items-center gap-2 px-3 py-2 bg-emerald-950/60 border-b border-emerald-500/20">
              <Monitor className="w-3.5 h-3.5 text-lime-400" />
              <span className="text-emerald-200 text-xs font-semibold flex-1 truncate">
                {screenTracks[0].participant.name ?? screenTracks[0].participant.identity} is sharing screen
              </span>
              {screenTracks.length > 1 && (
                <span className="text-emerald-400/60 text-[10px]">+{screenTracks.length - 1} more</span>
              )}
              <button
                onClick={toggleFullscreen}
                title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
                className="ml-2 w-6 h-6 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-emerald-300 hover:text-white transition-all shrink-0"
              >
                {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>
            </div>
            <VideoTrack trackRef={screenTracks[0]} className="w-full max-h-[45vh] object-contain bg-black" />
          </div>
        )}

        {/* Participants Stage */}
        <div className="flex-1 overflow-y-auto px-6 py-8 space-y-10">
          
          {/* 🎤 Speakers Section (Supports Live Webcam Tiles & Avatars) */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <p className="text-slate-400 text-[11px] font-black uppercase tracking-[0.15em] flex items-center gap-2">
                <span>🎤 Stage Speakers</span>
                <span className="bg-emerald-500/20 text-lime-300 px-2 py-0.5 rounded-full text-[10px] font-bold">
                  {speakers.length}
                </span>
              </p>
            </div>
            <div className="flex flex-wrap gap-8 items-start">
              {speakers.map(p => {
                const pCameraTrack = cameraTracks.find(
                  t => t.participant.identity === p.identity && !t.publication?.isMuted && t.publication?.track
                );

                if (pCameraTrack) {
                  return (
                    <VideoTile
                      key={p.identity}
                      name={p.name ?? p.identity}
                      isHost={p.identity === space.hostId}
                      isSpeaking={p.isSpeaking}
                      micOn={p.isMicrophoneEnabled}
                      handUp={raised.has(p.identity)}
                      trackRef={pCameraTrack}
                      canManage={isHost}
                      onDemote={() => demoteSpeaker(p.identity)}
                    />
                  );
                }

                return (
                  <Avatar
                    key={p.identity}
                    name={p.name ?? p.identity}
                    image={getParticipantImage(p.metadata)}
                    isHost={p.identity === space.hostId}
                    isSpeaking={p.isSpeaking}
                    micOn={p.isMicrophoneEnabled}
                    handUp={raised.has(p.identity)}
                    isSpeaker={true}
                    canManage={isHost}
                    onDemote={() => demoteSpeaker(p.identity)}
                  />
                );
              })}
            </div>
          </section>

          {/* Divider */}
          <div className="border-t border-emerald-950/40" />

          {/* 👥 Attendees Section */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <p className="text-slate-400 text-[11px] font-black uppercase tracking-[0.15em] flex items-center gap-1.5">
                <span>👥 Attendees</span>
                <span className="bg-white/8 text-slate-300 px-2 py-0.5 rounded-full text-[10px]">
                  {attendees.length}
                </span>
              </p>
            </div>
            {attendees.length > 0 ? (
              <div className="flex flex-wrap gap-6">
                {attendees.map(p => (
                  <Avatar
                    key={p.identity}
                    name={p.name ?? p.identity}
                    image={getParticipantImage(p.metadata)}
                    size="sm"
                    isHost={false}
                    isSpeaking={false}
                    micOn={false}
                    handUp={raised.has(p.identity)}
                    isSpeaker={false}
                    canManage={isHost}
                    onPromote={() => promoteToSpeaker(p.identity, p.name ?? p.identity)}
                  />
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-xs italic">No other attendees in room yet.</p>
            )}
          </section>

          {participants.length === 0 && (
            <div className="flex-1 flex items-center justify-center py-20 text-slate-500 text-sm">Connecting to stage…</div>
          )}
        </div>

        {/* Control bar */}
        <div className="border-t border-emerald-950/60 bg-[#040a14]/95 backdrop-blur-xl px-6 py-4">
          <div className="flex items-center justify-center gap-3 flex-wrap">
            
            {/* Mic / Request to Speak Button */}
            {isLocalSpeaker ? (
              <CtrlBtn
                active={isMicrophoneEnabled}
                activeClass="bg-gradient-to-r from-lime-400 via-emerald-500 to-teal-500 text-[#060e1a] font-bold shadow-lg shadow-emerald-500/30"
                inactiveClass="bg-white/8 hover:bg-white/12 text-white/60"
                onClick={handleMicToggle}
              >
                {isMicrophoneEnabled ? <><Mic01Icon className="w-4 h-4" /> Mute</> : <><MicOff02Icon className="w-4 h-4" /> Unmute</>}
              </CtrlBtn>
            ) : (
              <CtrlBtn
                active={myHandUp}
                activeClass="bg-amber-500 hover:bg-amber-400 text-white shadow-lg shadow-amber-500/30"
                inactiveClass="bg-white/8 hover:bg-white/12 text-white/60"
                onClick={toggleHand}
              >
                <Hand className="w-4 h-4" /> {myHandUp ? "Lower Hand" : "Request to Speak"}
              </CtrlBtn>
            )}

            {/* Webcam / Camera Toggle (for speakers & host) */}
            {isLocalSpeaker && (
              <CtrlBtn
                active={isCameraEnabled}
                activeClass="bg-gradient-to-r from-lime-400 via-emerald-500 to-teal-500 text-[#060e1a] font-bold shadow-lg shadow-emerald-500/30"
                inactiveClass="bg-white/8 hover:bg-white/12 text-white/60"
                onClick={toggleCamera}
              >
                {isCameraEnabled
                  ? <><Video className="w-4 h-4" /> Camera On</>
                  : <><VideoOff className="w-4 h-4" /> Camera Off</>}
              </CtrlBtn>
            )}

            {/* Hand button (for speakers) */}
            {isLocalSpeaker && (
              <CtrlBtn
                active={myHandUp}
                activeClass="bg-amber-500 hover:bg-amber-400 text-white"
                inactiveClass="bg-white/8 hover:bg-white/12 text-white/60"
                onClick={toggleHand}
              >
                <Hand className="w-4 h-4" /> {myHandUp ? "Lower Hand" : "Raise Hand"}
              </CtrlBtn>
            )}

            {/* Screen share (for speakers & host) */}
            {isLocalSpeaker && (
              <CtrlBtn
                active={isScreenShareEnabled}
                activeClass="bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/30"
                inactiveClass="bg-white/8 hover:bg-white/12 text-white/60"
                onClick={toggleScreenShare}
              >
                {isScreenShareEnabled
                  ? <><MonitorOff className="w-4 h-4" /> Stop Share</>
                  : <><Monitor className="w-4 h-4" /> Share Screen</>}
              </CtrlBtn>
            )}

            {/* Chat button */}
            <button
              onClick={() => setChatOpen(v => !v)}
              className={`relative flex items-center gap-2 px-5 py-2.5 rounded-2xl font-semibold text-sm transition-all border ${
                chatOpen ? "bg-white/12 border-white/20 text-white" : "bg-white/8 hover:bg-white/12 border-transparent text-white/60"
              }`}
            >
              <Message01Icon className="w-4 h-4" /> Chat
              {unread > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4.5 h-4.5 bg-emerald-500 rounded-full text-[10px] font-bold text-[#060e1a] flex items-center justify-center">
                  {unread}
                </span>
              )}
            </button>

            {/* Leave button */}
            <button
              onClick={() => router.push("/pro-talks")}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white/8 hover:bg-red-500/15 text-white/60 hover:text-red-400 font-semibold text-sm transition-all border border-transparent"
            >
              <PhoneOff01Icon className="w-4 h-4" /> Leave
            </button>

            {/* Host: End room */}
            {(isAdmin || isHost) && (
              <button
                onClick={onEnd}
                disabled={ending}
                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-bold text-sm transition-all shadow-lg shadow-red-500/20 disabled:opacity-40"
              >
                {ending ? <Loader2 className="w-4 h-4 animate-spin" /> : <PhoneOff01Icon className="w-4 h-4" />} End Room
              </button>
            )}
          </div>

          {screenError && (
            <p className="text-center text-red-400/80 text-xs mt-2">{screenError}</p>
          )}
          {cameraError && (
            <p className="text-center text-amber-400/80 text-xs mt-2">{cameraError}</p>
          )}
        </div>
      </div>

      {/* ── Chat panel ── */}
      <div className={`flex flex-col shrink-0 border-l border-emerald-950/60 bg-[#061224] transition-all duration-300 overflow-hidden ${chatOpen ? "w-80" : "w-0"}`}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-emerald-950/60">
          <div>
            <h3 className="text-white font-bold text-sm">Live Chat</h3>
            <p className="text-slate-400 text-xs mt-0.5">{chat.length} messages</p>
          </div>
          <button
            onClick={() => setChatOpen(false)}
            className="w-7 h-7 rounded-full bg-white/8 hover:bg-white/15 flex items-center justify-center text-white/50 hover:text-white transition-all"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {chat.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full gap-3 py-10">
              <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                <Message01Icon className="w-5 h-5 text-emerald-400/30" />
              </div>
              <p className="text-slate-500 text-xs text-center">No messages yet.<br />Say hello! 👋</p>
            </div>
          )}
          {chat.map(m => (
            <div key={m.id} className={`flex gap-2.5 ${m.from === "You" ? "flex-row-reverse" : ""}`}>
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-lime-400 to-emerald-600 flex items-center justify-center shrink-0 text-[#060e1a] text-[11px] font-black">
                {m.from[0]?.toUpperCase()}
              </div>
              <div className={`max-w-[180px] ${m.from === "You" ? "items-end" : "items-start"} flex flex-col gap-0.5`}>
                <span className="text-slate-400 text-[10px] font-medium px-1">{m.from === "You" ? "You" : m.from}</span>
                <div className={`px-3 py-2 rounded-2xl text-xs leading-relaxed ${m.from === "You" ? "bg-emerald-600 text-white rounded-tr-sm" : "bg-white/8 text-slate-200 rounded-tl-sm"}`}>
                  {m.text}
                </div>
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        <div className="p-4 border-t border-emerald-950/60">
          <div className="flex gap-2 items-center bg-white/6 border border-white/12 rounded-2xl px-3 py-2 focus-within:border-emerald-400/50 transition-all">
            <input
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && sendChat()}
              placeholder="Message the room…"
              className="flex-1 bg-transparent text-white placeholder-slate-500 outline-none text-xs"
            />
            <button
              onClick={sendChat}
              disabled={!chatInput.trim()}
              className="w-7 h-7 rounded-full bg-gradient-to-r from-lime-400 to-emerald-500 hover:from-lime-300 hover:to-emerald-400 flex items-center justify-center text-[#060e1a] transition-all disabled:opacity-30 shrink-0"
            >
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
    <LiveKitRoom
      serverUrl={lkUrl}
      token={token}
      connect={true}
      audio={true}
      video={false}
      onConnected={() => setConnected(true)}
      onDisconnected={() => router.push("/pro-talks")}
      style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", flexDirection: "column" }}
    >
      {!connected ? (
        <div className="fixed inset-0 z-[100] bg-[#040a14] flex flex-col items-center justify-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-lime-400 via-emerald-500 to-teal-600 flex items-center justify-center mb-2 shadow-xl shadow-emerald-500/30">
            <Radio01Icon className="w-7 h-7 text-[#060e1a]" />
          </div>
          <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
          <p className="text-slate-400 text-sm">Connecting to <span className="text-white font-medium">{space.name}</span>…</p>
        </div>
      ) : (
        <RoomInner space={space} token={token} isAdmin={isAdmin} userId={userId} onEnd={onEnd} ending={ending} />
      )}
    </LiveKitRoom>
  );
}
