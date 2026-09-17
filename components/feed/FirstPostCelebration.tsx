"use client";

import { useEffect, type CSSProperties } from "react";
import { Cancel01Icon, SparklesIcon } from "hugeicons-react";

export default function FirstPostCelebration({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const timer = window.setTimeout(onClose, 6500);
    return () => window.clearTimeout(timer);
  }, [onClose]);

  return (
    <>
      <div className="feed-confetti" aria-hidden="true">
        {Array.from({ length: 48 }, (_, i) => (
          <i key={i} style={{
            "--x": `${(i * 37) % 100}vw`,
            "--delay": `${(i % 8) * 70}ms`,
            "--drift": `${((i * 19) % 180) - 90}px`,
            "--spin": `${(i % 2 ? 1 : -1) * (360 + i * 17)}deg`,
            background: ["#e9c44c", "#fff0ad", "#ffffff", "#8ba2cb"][i % 4],
          } as CSSProperties} />
        ))}
      </div>
      <div className="feed-first-post" role="status">
        <SparklesIcon size={26} aria-hidden="true" />
        <div><strong>Your first post is live!</strong><p>Thanks for sharing. Your voice belongs here.</p></div>
        <button type="button" onClick={onClose} aria-label="Dismiss celebration"><Cancel01Icon size={20} /></button>
      </div>
    </>
  );
}
