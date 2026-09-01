"use client";

import React, { useState } from "react";
import NetworkBadge, { BadgeIconType } from "./NetworkBadge";
import {
  Star,
  Shield,
  Crown,
  Zap,
  Flame,
  Award,
  CheckCircle2,
  Gem,
  Rocket,
  Sparkles,
  Upload,
  Palette,
} from "lucide-react";

export interface BadgeConfig {
  badgeShape: string;
  badgeInitials: string;
  badgeText: string;
  badgeIcon: BadgeIconType;
  badgeBgColor: string;
  badgeTextColor: string;
  badgeBorderColor: string;
  badgeCustomImage: string | null;
}

interface BadgeCreatorProps {
  value: BadgeConfig;
  onChange: (val: BadgeConfig) => void;
}

const icons: { name: BadgeIconType; label: string; icon: React.ElementType }[] = [
  { name: "Star", label: "Star", icon: Star },
  { name: "Crown", label: "Crown", icon: Crown },
  { name: "Shield", label: "Shield", icon: Shield },
  { name: "Gem", label: "Gem", icon: Gem },
  { name: "Zap", label: "Zap", icon: Zap },
  { name: "Flame", label: "Flame", icon: Flame },
  { name: "Award", label: "Award", icon: Award },
  { name: "CheckCircle", label: "Verified", icon: CheckCircle2 },
  { name: "Rocket", label: "Rocket", icon: Rocket },
  { name: "Sparkles", label: "Sparkles", icon: Sparkles },
];

const shapes = [
  { id: "rounded", label: "Rounded" },
  { id: "pill", label: "Pill / Oval" },
  { id: "shield", label: "Shield" },
  { id: "circle", label: "Circle" },
  { id: "hexagon", label: "Hexagon" },
];

const colorPalettes = [
  { name: "Classic Navy & Gold", bg: "#0a1628", text: "#f0c040", border: "#d4a017" },
  { name: "Midnight Onyx", bg: "#111827", text: "#e2e8f0", border: "#374151" },
  { name: "Emerald Pro", bg: "#064e3b", text: "#6ee7b7", border: "#10b981" },
  { name: "Sapphire Royal", bg: "#1e3a8a", text: "#93c5fd", border: "#3b82f6" },
  { name: "Crimson Elite", bg: "#881337", text: "#fecdd3", border: "#f43f5e" },
  { name: "Purple Mastermind", bg: "#581c87", text: "#e9d5ff", border: "#a855f7" },
  { name: "Amber VIP", bg: "#78350f", text: "#fde68a", border: "#f59e0b" },
];

export default function BadgeCreator({ value, onChange }: BadgeCreatorProps) {
  const [activeTab, setActiveTab] = useState<"builder" | "upload">("builder");

  const update = (patch: Partial<BadgeConfig>) => {
    onChange({ ...value, ...patch });
  };

  const handleCustomUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        update({ badgeCustomImage: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6">
      {/* Live Preview Box */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-center space-y-4 shadow-xl">
        <div className="text-xs font-black uppercase tracking-widest text-slate-400">
          Live Badge Preview
        </div>

        <div className="py-4 flex flex-col items-center justify-center gap-3">
          <NetworkBadge
            shape={value.badgeShape}
            initials={value.badgeInitials}
            text={value.badgeText}
            icon={value.badgeIcon}
            bgColor={value.badgeBgColor}
            textColor={value.badgeTextColor}
            borderColor={value.badgeBorderColor}
            customImage={value.badgeCustomImage}
            size="lg"
          />

          <div className="text-xs text-slate-400 mt-2">
            This badge will appear next to members&apos; names, on their profile, and in discussions.
          </div>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
        <button
          type="button"
          onClick={() => {
            setActiveTab("builder");
            update({ badgeCustomImage: null });
          }}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
            activeTab === "builder"
              ? "bg-white dark:bg-[#172135] text-[#0a1628] dark:text-white shadow-sm"
              : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          🎨 Create Badge Inside TCP
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("upload")}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
            activeTab === "upload"
              ? "bg-white dark:bg-[#172135] text-[#0a1628] dark:text-white shadow-sm"
              : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          📤 Upload Custom Badge/Logo
        </button>
      </div>

      {activeTab === "upload" ? (
        <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-6 text-center space-y-3">
          <Upload className="w-8 h-8 text-slate-400 mx-auto" />
          <div>
            <label className="cursor-pointer font-bold text-sm text-blue-600 hover:underline">
              Choose PNG or SVG file
              <input
                type="file"
                accept="image/png, image/jpeg, image/svg+xml, image/webp"
                className="hidden"
                onChange={handleCustomUpload}
              />
            </label>
            <p className="text-xs text-slate-400 mt-1">Recommended size: 128x128px transparent PNG</p>
          </div>
          {value.badgeCustomImage && (
            <button
              type="button"
              onClick={() => update({ badgeCustomImage: null })}
              className="text-xs text-rose-500 hover:underline font-bold"
            >
              Remove uploaded badge
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-5">
          {/* Badge Initials & Badge Text */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Network Initials (Optional)
              </label>
              <input
                type="text"
                maxLength={5}
                placeholder="e.g. TOG"
                value={value.badgeInitials}
                onChange={(e) => update({ badgeInitials: e.target.value.toUpperCase() })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-bold uppercase"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Badge Text
              </label>
              <input
                type="text"
                maxLength={14}
                placeholder="e.g. MEMBER"
                value={value.badgeText}
                onChange={(e) => update({ badgeText: e.target.value.toUpperCase() })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-bold uppercase"
              />
            </div>
          </div>

          {/* Icon Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
              Select Icon
            </label>
            <div className="grid grid-cols-5 gap-2">
              {icons.map((item) => {
                const Icon = item.icon;
                const isSelected = value.badgeIcon === item.name;
                return (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => update({ badgeIcon: item.name })}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-xl border transition-all ${
                      isSelected
                        ? "bg-amber-400/20 border-amber-400 text-amber-500 font-bold shadow-sm"
                        : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                    }`}
                  >
                    <Icon className="w-5 h-5 mb-1" />
                    <span className="text-[10px] truncate max-w-full">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Shape Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
              Badge Shape
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {shapes.map((s) => {
                const isSelected = value.badgeShape === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => update({ badgeShape: s.id })}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                      isSelected
                        ? "bg-blue-50 dark:bg-blue-900/30 border-blue-500 text-blue-600 dark:text-blue-400"
                        : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                    }`}
                  >
                    {s.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Color Palettes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5" /> Curated Color Schemes
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {colorPalettes.map((p) => {
                const isSelected =
                  value.badgeBgColor === p.bg &&
                  value.badgeTextColor === p.text &&
                  value.badgeBorderColor === p.border;
                return (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() =>
                      update({
                        badgeBgColor: p.bg,
                        badgeTextColor: p.text,
                        badgeBorderColor: p.border,
                      })
                    }
                    className={`flex items-center justify-between p-2.5 rounded-xl border transition-all text-left ${
                      isSelected
                        ? "ring-2 ring-blue-500 border-transparent shadow-sm"
                        : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                    }`}
                  >
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {p.name}
                    </span>
                    <div className="flex items-center gap-1">
                      <span
                        className="w-4 h-4 rounded-full border border-black/10"
                        style={{ backgroundColor: p.bg }}
                      />
                      <span
                        className="w-4 h-4 rounded-full border border-black/10"
                        style={{ backgroundColor: p.text }}
                      />
                      <span
                        className="w-4 h-4 rounded-full border border-black/10"
                        style={{ backgroundColor: p.border }}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
