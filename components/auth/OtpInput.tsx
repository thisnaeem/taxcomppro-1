"use client";

import { useRef, useEffect, type ClipboardEvent, type KeyboardEvent } from "react";

interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  /** Fired when the last digit lands and the code is complete. */
  onComplete?: (value: string) => void;
  length?: number;
  disabled?: boolean;
  invalid?: boolean;
  autoFocus?: boolean;
}

/**
 * Segmented one-time-code field.
 *
 * Handles the interactions people actually use: typing, pasting a full code from the
 * email, backspacing across boxes, and arrow-key navigation. The first box carries
 * `autoComplete="one-time-code"` so browser and OS autofill can fill the whole code.
 */
export default function OtpInput({
  value,
  onChange,
  onComplete,
  length = 6,
  disabled = false,
  invalid = false,
  autoFocus = false,
}: OtpInputProps) {
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    if (autoFocus) inputsRef.current[0]?.focus();
  }, [autoFocus]);

  const digits = value.padEnd(length, " ").slice(0, length).split("");

  const commit = (next: string) => {
    onChange(next);
    if (next.length === length) onComplete?.(next);
  };

  const focusBox = (index: number) => {
    const clamped = Math.max(0, Math.min(length - 1, index));
    inputsRef.current[clamped]?.focus();
    inputsRef.current[clamped]?.select();
  };

  const handleChange = (index: number, raw: string) => {
    const typed = raw.replace(/\D/g, "");
    if (!typed) return;

    // Typing into a box overwrites it; a multi-digit burst fills forward from here.
    const chars = value.padEnd(length, " ").split("");
    for (let i = 0; i < typed.length && index + i < length; i++) {
      chars[index + i] = typed[i];
    }
    const next = chars.join("").replace(/\s+$/, "");
    commit(next);
    focusBox(index + typed.length);
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      const chars = value.padEnd(length, " ").split("");
      if (chars[index] && chars[index] !== " ") {
        // Clear the current box and stay put.
        chars[index] = " ";
        commit(chars.join("").replace(/\s+$/, ""));
      } else if (index > 0) {
        // Already empty, so clear the previous box and step back.
        chars[index - 1] = " ";
        commit(chars.join("").replace(/\s+$/, ""));
        focusBox(index - 1);
      }
      return;
    }
    if (e.key === "ArrowLeft") { e.preventDefault(); focusBox(index - 1); }
    if (e.key === "ArrowRight") { e.preventDefault(); focusBox(index + 1); }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    if (!pasted) return;
    commit(pasted);
    focusBox(pasted.length);
  };

  return (
    <div
      className="grid grid-cols-6 gap-2 sm:gap-2.5"
      role="group"
      aria-label={`Enter the ${length} digit verification code`}
    >
      {Array.from({ length }).map((_, i) => {
        const char = digits[i]?.trim() ?? "";
        return (
          <input
            key={i}
            ref={(el) => { inputsRef.current[i] = el; }}
            type="text"
            inputMode="numeric"
            autoComplete={i === 0 ? "one-time-code" : "off"}
            maxLength={length}
            value={char}
            disabled={disabled}
            aria-label={`Digit ${i + 1}`}
            aria-invalid={invalid || undefined}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onPaste={handlePaste}
            onFocus={(e) => e.currentTarget.select()}
            className={`h-14 w-full rounded-xl border-2 text-center text-xl font-bold tabular-nums outline-none transition-all
              disabled:opacity-50 disabled:cursor-not-allowed
              ${
                invalid
                  ? "border-red-400 bg-red-50 text-red-700 focus:border-red-500 focus:ring-4 focus:ring-red-500/15 dark:bg-red-950/30 dark:text-red-300"
                  : char
                    ? "border-[#0a1628] bg-white text-[#0a1628] focus:ring-4 focus:ring-[#ffbe24]/25 dark:border-amber-400 dark:bg-[#0c1a2e] dark:text-white"
                    : "border-slate-200 bg-white text-[#0a1628] focus:border-[#0a1628] focus:ring-4 focus:ring-[#0a1628]/10 dark:border-white/15 dark:bg-[#0c1a2e] dark:text-white dark:focus:border-amber-400"
              }`}
          />
        );
      })}
    </div>
  );
}
