"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal, flushSync } from "react-dom";
import { VideoTrack, type TrackReference } from "@livekit/components-react";
import { Maximize2, Minimize2, Monitor } from "lucide-react";

export default function ScreenShareView({ trackRef }: { trackRef: TrackReference }) {
  const container = useRef<HTMLDivElement>(null);
  const nativeFullscreen = useRef(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    function fullscreenChanged() {
      const active = document.fullscreenElement === container.current;
      if (active || nativeFullscreen.current) setExpanded(active);
      nativeFullscreen.current = active;
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape" && !document.fullscreenElement) setExpanded(false);
    }
    document.addEventListener("fullscreenchange", fullscreenChanged);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("fullscreenchange", fullscreenChanged);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  async function toggleFullscreen() {
    if (expanded) {
      if (document.fullscreenElement === container.current) await document.exitFullscreen();
      setExpanded(false);
      return;
    }
    // Also enlarge in browsers/embedded views where the fullscreen API is unavailable.
    flushSync(() => setExpanded(true));
    try { await container.current?.requestFullscreen?.(); } catch { /* viewport fallback */ }
  }

  const content = (
    <div ref={container} className={`sr-screen ${expanded ? "sr-screen-fullscreen" : ""}`}>
      <header className="sr-screen-toolbar">
        <div><Monitor size={16} /><span>{trackRef.participant.name || trackRef.participant.identity} is sharing screen</span></div>
        <button type="button" onClick={toggleFullscreen} aria-pressed={expanded} aria-label={expanded ? "Exit full screen" : "View screen share full screen"}>
          {expanded ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
        </button>
      </header>
      <div className="sr-screen-media"><VideoTrack trackRef={trackRef} /></div>
    </div>
  );
  return expanded ? createPortal(content, document.body) : content;
}
