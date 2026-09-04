"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize, Loader2 } from "lucide-react";

interface Props {
  src: string;
  poster?: string;
  className?: string;
}

/** Automatically derives a high-quality JPEG poster frame for videos (e.g. from Cloudinary) */
export function getVideoPoster(src?: string | null, customPoster?: string): string | undefined {
  if (customPoster) return customPoster;
  if (!src) return undefined;

  // Cloudinary video URLs: swap video extension to .jpg for instant poster frame
  if (src.includes("res.cloudinary.com") && src.includes("/video/upload/")) {
    try {
      const url = new URL(src);
      let pathname = url.pathname;
      pathname = pathname.replace(/\.(mp4|mov|webm|mkv|avi|wmv|m4v|flv)$/i, ".jpg");
      if (!pathname.endsWith(".jpg")) {
        pathname = `${pathname}.jpg`;
      }
      return `${url.origin}${pathname}${url.search}`;
    } catch {
      return src.replace(/\.(mp4|mov|webm|mkv|avi|wmv|m4v|flv)$/i, ".jpg");
    }
  }

  return undefined;
}

function formatTime(seconds: number): string {
  if (isNaN(seconds) || !isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? "0" : ""}${s}`;
}

export default function FeedVideoPlayer({ src, poster, className = "" }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [posterFailed, setPosterFailed] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isBuffering, setIsBuffering] = useState(false);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const computedPoster = !posterFailed ? getVideoPoster(src, poster) : undefined;
  // Append #t=0.001 to hint browser decoders to paint the first frame even before playback
  const videoSrc = src && !src.includes("#") ? `${src}#t=0.001` : src;

  // Auto-hide controls during playback
  const resetHideTimer = useCallback(() => {
    setShowControls(true);
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    if (videoRef.current && !videoRef.current.paused) {
      hideTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 2500);
    }
  }, []);

  const togglePlay = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    const v = videoRef.current;
    if (!v) return;

    if (v.paused) {
      setHasStarted(true);
      v.play().then(() => setIsPlaying(true)).catch(() => {});
    } else {
      v.pause();
      setIsPlaying(false);
      setShowControls(true);
    }
  }, []);

  const toggleMute = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setIsMuted(v.muted);
  }, []);

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = videoRef.current;
    if (!v) return;
    const time = parseFloat(e.target.value);
    setHasStarted(true);
    v.currentTime = time;
    setCurrentTime(time);
  };

  const toggleFullscreen = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    const container = containerRef.current;
    const video = videoRef.current;
    if (!container || !video) return;

    if (!document.fullscreenElement) {
      try {
        if (container.requestFullscreen) {
          await container.requestFullscreen();
        } else if ((video as any).webkitEnterFullscreen) {
          // iOS Safari fallback
          (video as any).webkitEnterFullscreen();
        }
        setIsFullscreen(true);
      } catch {}
    } else {
      try {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        }
        setIsFullscreen(false);
      } catch {}
    }
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  // Time & playback update listeners
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    const onTimeUpdate = () => setCurrentTime(v.currentTime);
    const onLoadedMetadata = () => {
      setDuration(v.duration || 0);
      setIsMuted(v.muted);
    };
    const onWaiting = () => setIsBuffering(true);
    const onPlaying = () => {
      setIsBuffering(false);
      setIsPlaying(true);
      setHasStarted(true);
      resetHideTimer();
    };
    const onPause = () => {
      setIsPlaying(false);
      setShowControls(true);
    };
    const onEnded = () => {
      setIsPlaying(false);
      setShowControls(true);
    };

    v.addEventListener("timeupdate", onTimeUpdate);
    v.addEventListener("loadedmetadata", onLoadedMetadata);
    v.addEventListener("waiting", onWaiting);
    v.addEventListener("playing", onPlaying);
    v.addEventListener("pause", onPause);
    v.addEventListener("ended", onEnded);

    return () => {
      v.removeEventListener("timeupdate", onTimeUpdate);
      v.removeEventListener("loadedmetadata", onLoadedMetadata);
      v.removeEventListener("waiting", onWaiting);
      v.removeEventListener("playing", onPlaying);
      v.removeEventListener("pause", onPause);
      v.removeEventListener("ended", onEnded);
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    };
  }, [resetHideTimer]);

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      ref={containerRef}
      onMouseMove={resetHideTimer}
      onClick={togglePlay}
      onContextMenu={(e) => {
        // Prevent right click context menu to block "Save video as"
        e.preventDefault();
        return false;
      }}
      className={`relative group bg-black rounded-2xl overflow-hidden select-none cursor-pointer flex items-center justify-center max-h-[480px] ${className}`}
      style={{ aspectRatio: "16/9" }}
    >
      {/* Ambient background glow from video frame */}
      {computedPoster && !hasStarted && (
        <div
          className="absolute inset-0 bg-cover bg-center blur-2xl opacity-35 scale-125 pointer-events-none"
          style={{ backgroundImage: `url(${computedPoster})` }}
        />
      )}

      {/* Video Element */}
      <video
        ref={videoRef}
        src={videoSrc}
        poster={computedPoster}
        playsInline
        preload="metadata"
        disablePictureInPicture
        controlsList="nodownload nofullscreen noremoteplayback"
        onContextMenu={(e) => e.preventDefault()}
        className="w-full h-full object-contain pointer-events-none relative z-[2]"
      />

      {/* Instant Video Preview Thumbnail Overlay (shown until user clicks play) */}
      {computedPoster && !hasStarted && (
        <img
          src={computedPoster}
          alt="Video preview"
          onError={() => setPosterFailed(true)}
          className="absolute inset-0 w-full h-full object-contain pointer-events-none z-[3] transition-opacity duration-300"
          loading="lazy"
        />
      )}

      {/* Buffering Spinner */}
      {isBuffering && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 pointer-events-none z-10">
          <Loader2 className="w-10 h-10 text-[#f0c040] animate-spin" />
        </div>
      )}

      {/* Big Center Play/Pause Button */}
      {(!isPlaying || showControls) && (
        <div
          className={`absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity duration-200 z-10 ${
            !isPlaying ? "opacity-100" : showControls ? "opacity-90" : "opacity-0"
          }`}
        >
          <button
            type="button"
            onClick={togglePlay}
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#0a1628]/80 backdrop-blur-md border border-[#f0c040]/40 text-[#f0c040] shadow-2xl flex items-center justify-center pointer-events-auto hover:scale-110 active:scale-95 hover:bg-[#0a1628] hover:border-[#f0c040] transition-all"
            aria-label={isPlaying ? "Pause video" : "Play video"}
          >
            {isPlaying ? (
              <Pause className="w-6 h-6 sm:w-7 sm:h-7 fill-current" />
            ) : (
              <Play className="w-6 h-6 sm:w-7 sm:h-7 fill-current translate-x-0.5" />
            )}
          </button>
        </div>
      )}

      {/* Bottom Control Bar */}
      <div
        onClick={(e) => e.stopPropagation()}
        className={`absolute bottom-0 left-0 right-0 z-20 px-3 sm:px-4 pt-8 pb-3 bg-gradient-to-t from-black/90 via-black/50 to-transparent transition-all duration-200 ${
          showControls || !isPlaying ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"
        }`}
      >
        {/* Scrubber track */}
        <div className="relative flex items-center w-full mb-2 group/scrubber">
          {/* Custom Track Background */}
          <div className="w-full h-1.5 bg-white/25 rounded-full overflow-hidden relative cursor-pointer group-hover/scrubber:h-2 transition-all">
            <div
              className="h-full bg-gradient-to-r from-[#f0c040] to-[#d4a017] rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          {/* Range Input overlay for smooth seeking */}
          <input
            type="range"
            min={0}
            max={duration || 0}
            step={0.1}
            value={currentTime}
            onChange={handleSeek}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            aria-label="Seek video"
          />
        </div>

        {/* Buttons and Time */}
        <div className="flex items-center justify-between text-white text-xs">
          {/* Left: Play/Pause & Time */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={togglePlay}
              className="p-1 rounded-lg hover:bg-white/15 transition-colors text-white hover:text-[#f0c040]"
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
            </button>

            <span className="font-mono text-[11px] sm:text-xs text-slate-300 font-semibold tracking-wide">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          {/* Right: Mute & Fullscreen */}
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              type="button"
              onClick={toggleMute}
              className="p-1.5 rounded-lg hover:bg-white/15 transition-colors text-white hover:text-[#f0c040]"
              aria-label={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={toggleFullscreen}
              className="p-1.5 rounded-lg hover:bg-white/15 transition-colors text-white hover:text-[#f0c040]"
              aria-label={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
            >
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
