"use client";

import { useEffect, useState } from "react";
import {
  Sparkles as AiMagicIcon,
  Settings as Settings01Icon,
  Info as InformationCircleIcon,
  ToggleRight as ToggleOnIcon,
  ToggleLeft as ToggleOffIcon,
  Save as FloppyDiskIcon,
  Loader2 as Loading02Icon,
  Check as CheckmarkCircle02Icon,
  FileText,
} from "lucide-react";

interface AtlasSettings {
  widgetEnabled: boolean;
  defaultProvider: string;
  maxTokens: number;
  allowedTiers: string[];
  systemPrompt: string;
}

const ALL_TIERS = ["FREE", "VIP", "MARKETPLACE", "MARKETPLACE_PLUS"];
const TIER_LABELS: Record<string, string> = {
  FREE: "Free Members",
  VIP: "VIP Members",
  MARKETPLACE: "Marketplace Sellers",
  MARKETPLACE_PLUS: "Marketplace Plus",
};

export default function AdminAtlasSettingsPage() {
  const [settings, setSettings] = useState<AtlasSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/admin/atlas-settings")
      .then(r => r.json())
      .then(d => { setSettings(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/atlas-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } finally {
      setSaving(false);
    }
  };

  const toggleTier = (tier: string) => {
    if (!settings) return;
    const cur = settings.allowedTiers;
    const next = cur.includes(tier) ? cur.filter(t => t !== tier) : [...cur, tier];
    setSettings({ ...settings, allowedTiers: next });
  };

  if (loading) return (
    <div className="flex justify-center py-24">
      <Loading02Icon className="w-8 h-8 text-amber-400 animate-spin" />
    </div>
  );

  if (!settings) return (
    <div className="p-8 text-center text-slate-400 bg-slate-800/40 rounded-2xl border border-white/8 max-w-xl mx-auto mt-10">
      Failed to load settings.
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto space-y-5 pb-16">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-white flex items-center gap-2">
          <AiMagicIcon className="w-6 h-6 text-[#f0c040]" />
          Atlas AI Settings
        </h1>
        <p className="text-slate-400 text-sm mt-0.5">Control the Atlas AI chat widget for all users.</p>
      </div>

      {/* Widget Enable/Disable */}
      <div className="bg-slate-800/60 border border-white/8 rounded-2xl p-5 space-y-4 shadow-xl backdrop-blur-sm">
        <h2 className="font-black text-white flex items-center gap-2 text-sm">
          <Settings01Icon className="w-4 h-4 text-amber-400" /> General
        </h2>
        <div className="flex items-center justify-between p-3.5 bg-slate-900/60 border border-white/5 rounded-xl">
          <div>
            <div className="font-bold text-white text-sm">Widget Enabled</div>
            <div className="text-xs text-slate-400">Show or hide the Atlas AI chat bubble on front-end pages</div>
          </div>
          <button onClick={() => setSettings(s => s ? { ...s, widgetEnabled: !s.widgetEnabled } : s)}>
            {settings.widgetEnabled
              ? <ToggleOnIcon className="w-9 h-9 text-emerald-400" />
              : <ToggleOffIcon className="w-9 h-9 text-slate-600" />}
          </button>
        </div>

        {/* Default Provider */}
        <div className="p-3.5 bg-slate-900/60 border border-white/5 rounded-xl">
          <div className="font-bold text-white text-sm mb-2">Default AI Provider</div>
          <div className="flex gap-2">
            {[
              { value: "openai",  label: "GPT-4o",  color: "bg-blue-600" },
              { value: "claude",  label: "Claude",   color: "bg-violet-600" },
            ].map(p => (
              <button key={p.value} onClick={() => setSettings(s => s ? { ...s, defaultProvider: p.value } : s)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  settings.defaultProvider === p.value
                    ? `${p.color} text-white shadow-md font-black`
                    : "bg-slate-800 text-slate-400 border border-white/10 hover:text-white"
                }`}>
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Max Tokens */}
        <div className="p-3.5 bg-slate-900/60 border border-white/5 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <div className="font-bold text-white text-sm">Max Response Tokens</div>
            <span className="text-sm font-black text-amber-400">{settings.maxTokens}</span>
          </div>
          <input type="range" min={256} max={4096} step={128}
            value={settings.maxTokens}
            onChange={e => setSettings(s => s ? { ...s, maxTokens: parseInt(e.target.value) } : s)}
            className="w-full accent-[#f0c040]" />
          <div className="flex justify-between text-xs text-slate-400 mt-1">
            <span>256 (Fast)</span><span>4096 (Detailed)</span>
          </div>
        </div>
      </div>

      {/* Access Control */}
      <div className="bg-slate-800/60 border border-white/8 rounded-2xl p-5 space-y-4 shadow-xl backdrop-blur-sm">
        <h2 className="font-black text-white flex items-center gap-2 text-sm">
          <InformationCircleIcon className="w-4 h-4 text-blue-400" /> Access Control
        </h2>
        <p className="text-xs text-slate-400">Choose which membership tiers can use the Atlas AI widget.</p>
        <div className="space-y-2">
          {ALL_TIERS.map(tier => {
            const active = settings.allowedTiers.includes(tier);
            return (
              <div key={tier} className="flex items-center justify-between p-3.5 bg-slate-900/60 border border-white/5 rounded-xl">
                <div>
                  <div className="font-bold text-white text-sm">{TIER_LABELS[tier]}</div>
                  <div className="text-xs text-slate-400">{tier} tier members</div>
                </div>
                <button onClick={() => toggleTier(tier)}>
                  {active
                    ? <ToggleOnIcon className="w-9 h-9 text-emerald-400" />
                    : <ToggleOffIcon className="w-9 h-9 text-slate-600" />}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* System Prompt */}
      <div className="bg-slate-800/60 border border-white/8 rounded-2xl p-5 space-y-3 shadow-xl backdrop-blur-sm">
        <h2 className="font-black text-white flex items-center gap-2 text-sm">
          <FileText className="w-4 h-4 text-purple-400" /> System Prompt Override
        </h2>
        <p className="text-xs text-slate-400">Custom instructions prepended to every conversation.</p>
        <textarea
          rows={6}
          value={settings.systemPrompt}
          onChange={e => setSettings(s => s ? { ...s, systemPrompt: e.target.value } : s)}
          className="w-full bg-slate-900/70 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 outline-none focus:border-amber-400 resize-none font-mono text-xs"
          placeholder="Leave blank to use default system instructions..."
        />
      </div>

      {/* Save Button */}
      <div className="flex justify-end gap-3 pt-2">
        {saved && (
          <div className="flex items-center gap-1.5 text-emerald-400 text-sm font-bold bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-xl">
            <CheckmarkCircle02Icon className="w-4 h-4" /> Settings Saved!
          </div>
        )}
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-[#f0c040] hover:bg-amber-400 text-slate-950 font-black text-sm px-6 py-3 rounded-xl shadow-lg shadow-amber-400/20 transition-all disabled:opacity-50"
        >
          {saving ? (
            <>
              <Loading02Icon className="w-4 h-4 animate-spin" /> Saving...
            </>
          ) : (
            <>
              <FloppyDiskIcon className="w-4 h-4" /> Save Settings
            </>
          )}
        </button>
      </div>
    </div>
  );
}
