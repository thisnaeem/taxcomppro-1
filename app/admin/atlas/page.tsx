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
  BookOpen,
  HelpCircle,
  Plus,
  Trash2,
  Edit2,
  Search,
  CheckCircle2,
  ExternalLink,
  MessageSquare,
  X,
  AlertTriangle,
} from "lucide-react";
import { ATLAS_WEBSITE_QA, KnowledgeItem as StaticKnowledgeItem } from "@/lib/atlas-support-knowledge";

interface AtlasSettings {
  widgetEnabled: boolean;
  defaultProvider: string;
  maxTokens: number;
  allowedTiers: string[];
  systemPrompt: string;
}

interface CustomKnowledgeItem {
  id: string;
  question: string;
  alternatePhrasings: string[];
  approvedAnswer: string;
  category: string;
  relatedUrl: string | null;
  membershipRequired: string | null;
  productRequired: string | null;
  active: boolean;
  createdAt: string;
}

interface UnansweredQuestion {
  id: string;
  question: string;
  accountEmail: string | null;
  pageUrl: string | null;
  category: string | null;
  conversationContext: string | null;
  suggestedAnswer: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
}

const ALL_TIERS = ["FREE", "VIP", "MARKETPLACE", "MARKETPLACE_PLUS"];
const TIER_LABELS: Record<string, string> = {
  FREE: "Free Members",
  VIP: "VIP Members",
  MARKETPLACE: "Marketplace Sellers",
  MARKETPLACE_PLUS: "Marketplace Plus",
};

const CATEGORIES = [
  "ALL",
  "NAVIGATION",
  "ACCOUNT",
  "MEMBERSHIP",
  "BILLING",
  "TOOLKITS",
  "ACADEMY",
  "PRO_TALKS",
  "MARKETPLACE",
  "PROCONNECT",
  "FULL_ATLAS",
  "SUPPORT",
  "GENERAL",
];

export default function AdminAtlasSettingsPage() {
  const [activeTab, setActiveTab] = useState<"settings" | "knowledge" | "unanswered">("knowledge");

  // Settings State
  const [settings, setSettings] = useState<AtlasSettings | null>(null);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [savedSettings, setSavedSettings] = useState(false);

  // Knowledge Base State
  const [customKnowledge, setCustomKnowledge] = useState<CustomKnowledgeItem[]>([]);
  const [loadingKnowledge, setLoadingKnowledge] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<CustomKnowledgeItem | null>(null);

  // Modal Form State
  const [modalQuestion, setModalQuestion] = useState("");
  const [modalAnswer, setModalAnswer] = useState("");
  const [modalCategory, setModalCategory] = useState("GENERAL");
  const [modalUrl, setModalUrl] = useState("");
  const [modalAlternates, setModalAlternates] = useState("");
  const [savingItem, setSavingItem] = useState(false);

  // Unanswered Questions State
  const [unansweredList, setUnansweredList] = useState<UnansweredQuestion[]>([]);
  const [loadingUnanswered, setLoadingUnanswered] = useState(false);
  const [answeringQuestion, setAnsweringQuestion] = useState<UnansweredQuestion | null>(null);
  const [approveAnswerText, setApproveAnswerText] = useState("");
  const [submittingApproval, setSubmittingApproval] = useState(false);

  // Fetch Settings
  useEffect(() => {
    fetch("/api/admin/atlas-settings")
      .then((r) => r.json())
      .then((d) => {
        setSettings(d);
        setLoadingSettings(false);
      })
      .catch(() => setLoadingSettings(false));
  }, []);

  // Fetch Knowledge Items
  const loadKnowledge = async () => {
    setLoadingKnowledge(true);
    try {
      const res = await fetch("/api/admin/atlas-knowledge");
      if (res.ok) {
        const data = await res.json();
        setCustomKnowledge(Array.isArray(data) ? data : []);
      }
    } catch {}
    setLoadingKnowledge(false);
  };

  // Fetch Unanswered Questions
  const loadUnanswered = async () => {
    setLoadingUnanswered(true);
    try {
      const res = await fetch("/api/admin/atlas-unanswered");
      if (res.ok) {
        const data = await res.json();
        setUnansweredList(Array.isArray(data) ? data : []);
      }
    } catch {}
    setLoadingUnanswered(false);
  };

  useEffect(() => {
    if (activeTab === "knowledge") loadKnowledge();
    if (activeTab === "unanswered") loadUnanswered();
  }, [activeTab]);

  const handleSaveSettings = async () => {
    if (!settings) return;
    setSavingSettings(true);
    try {
      const res = await fetch("/api/admin/atlas-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
        setSavedSettings(true);
        setTimeout(() => setSavedSettings(false), 3000);
      }
    } finally {
      setSavingSettings(false);
    }
  };

  const toggleTier = (tier: string) => {
    if (!settings) return;
    const cur = settings.allowedTiers;
    const next = cur.includes(tier) ? cur.filter((t) => t !== tier) : [...cur, tier];
    setSettings({ ...settings, allowedTiers: next });
  };

  // Save or Update Knowledge Item
  const handleSaveKnowledgeItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalQuestion.trim() || !modalAnswer.trim()) return;

    setSavingItem(true);
    try {
      const alternates = modalAlternates
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);

      if (editingItem) {
        const res = await fetch("/api/admin/atlas-knowledge", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingItem.id,
            question: modalQuestion,
            approvedAnswer: modalAnswer,
            category: modalCategory,
            relatedUrl: modalUrl,
            alternatePhrasings: alternates,
          }),
        });
        if (res.ok) {
          setShowAddModal(false);
          setEditingItem(null);
          loadKnowledge();
        }
      } else {
        const res = await fetch("/api/admin/atlas-knowledge", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            question: modalQuestion,
            approvedAnswer: modalAnswer,
            category: modalCategory,
            relatedUrl: modalUrl,
            alternatePhrasings: alternates,
          }),
        });
        if (res.ok) {
          setShowAddModal(false);
          resetModal();
          loadKnowledge();
        }
      }
    } finally {
      setSavingItem(false);
    }
  };

  const handleDeleteKnowledge = async (id: string) => {
    if (!confirm("Are you sure you want to remove this approved knowledge item?")) return;
    try {
      const res = await fetch(`/api/admin/atlas-knowledge?id=${id}`, { method: "DELETE" });
      if (res.ok) loadKnowledge();
    } catch {}
  };

  const handleApproveUnanswered = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!answeringQuestion || !approveAnswerText.trim()) return;

    setSubmittingApproval(true);
    try {
      const res = await fetch("/api/admin/atlas-unanswered", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: answeringQuestion.id,
          approvedAnswer: approveAnswerText.trim(),
          status: "APPROVED",
          category: answeringQuestion.category || "GENERAL",
          addToKnowledgeBase: true,
        }),
      });
      if (res.ok) {
        setAnsweringQuestion(null);
        setApproveAnswerText("");
        loadUnanswered();
      }
    } finally {
      setSubmittingApproval(false);
    }
  };

  const handleDismissUnanswered = async (id: string) => {
    if (!confirm("Dismiss this unanswered question?")) return;
    try {
      const res = await fetch(`/api/admin/atlas-unanswered?id=${id}`, { method: "DELETE" });
      if (res.ok) loadUnanswered();
    } catch {}
  };

  const resetModal = () => {
    setModalQuestion("");
    setModalAnswer("");
    setModalCategory("GENERAL");
    setModalUrl("");
    setModalAlternates("");
    setEditingItem(null);
  };

  const openEditModal = (item: CustomKnowledgeItem) => {
    setEditingItem(item);
    setModalQuestion(item.question);
    setModalAnswer(item.approvedAnswer);
    setModalCategory(item.category || "GENERAL");
    setModalUrl(item.relatedUrl || "");
    setModalAlternates(item.alternatePhrasings?.join("\n") || "");
    setShowAddModal(true);
  };

  // Filter combined knowledge list
  const filteredCustom = customKnowledge.filter((item) => {
    const matchesCat = selectedCategory === "ALL" || item.category === selectedCategory;
    const matchesQuery =
      searchQuery === "" ||
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.approvedAnswer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesQuery;
  });

  const filteredStatic = ATLAS_WEBSITE_QA.filter((item) => {
    const matchesCat = selectedCategory === "ALL" || item.category === selectedCategory;
    const matchesQuery =
      searchQuery === "" ||
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesQuery;
  });

  if (loadingSettings) {
    return (
      <div className="flex justify-center py-24">
        <Loading02Icon className="w-8 h-8 text-amber-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2.5">
            <AiMagicIcon className="w-7 h-7 text-[#f0c040]" />
            Atlas Support Concierge Admin
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">
            Manage TaxCompPro website support knowledge, unanswered question queue, and widget settings.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-2xl border border-white/10">
          <button
            onClick={() => setActiveTab("knowledge")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === "knowledge"
                ? "bg-amber-400 text-slate-950 shadow-md font-black"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" /> Knowledge Base
          </button>
          <button
            onClick={() => setActiveTab("unanswered")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === "unanswered"
                ? "bg-amber-400 text-slate-950 shadow-md font-black"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" /> Unanswered Questions
            {unansweredList.filter((q) => q.status === "PENDING").length > 0 && (
              <span className="bg-rose-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-black ml-1">
                {unansweredList.filter((q) => q.status === "PENDING").length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === "settings"
                ? "bg-amber-400 text-slate-950 shadow-md font-black"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Settings01Icon className="w-3.5 h-3.5" /> Widget Settings
          </button>
        </div>
      </div>

      {/* ── TAB 1: KNOWLEDGE BASE ── */}
      {activeTab === "knowledge" && (
        <div className="space-y-5">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-slate-800/60 p-4 rounded-2xl border border-white/8">
            <div className="flex items-center gap-3 w-full sm:w-auto flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search Q&A..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-900/80 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-amber-400"
                />
              </div>

              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-slate-900/80 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-400"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => {
                resetModal();
                setShowAddModal(true);
              }}
              className="w-full sm:w-auto bg-[#f0c040] hover:bg-amber-400 text-slate-950 font-black text-xs px-4 py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-md"
            >
              <Plus className="w-4 h-4" /> Add Approved Q&A
            </button>
          </div>

          {/* List of Custom Approved Knowledge Items */}
          {filteredCustom.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-xs font-black text-amber-400 uppercase tracking-widest px-1">
                Custom Admin-Approved Answers ({filteredCustom.length})
              </h2>
              <div className="grid gap-3">
                {filteredCustom.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-2xl bg-slate-800/80 border border-amber-400/20 space-y-2 shadow-lg relative group"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          {item.category}
                        </span>
                        <h3 className="font-bold text-sm text-white">{item.question}</h3>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEditModal(item)}
                          className="p-1.5 text-slate-400 hover:text-amber-400 transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteKnowledge(item.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-400 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-3 rounded-xl border border-white/5">
                      {item.approvedAnswer}
                    </p>

                    {item.alternatePhrasings?.length > 0 && (
                      <p className="text-[11px] text-slate-500">
                        <span className="font-semibold text-slate-400">Alternates:</span>{" "}
                        {item.alternatePhrasings.join(", ")}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* List of Base System Knowledge Items */}
          <div className="space-y-3 pt-3">
            <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">
              Core TaxCompPro Support Knowledge Base ({filteredStatic.length})
            </h2>
            <div className="grid gap-3">
              {filteredStatic.map((item, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-slate-800/40 border border-white/5 space-y-2 hover:border-white/10 transition-all"
                >
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-700/50 text-slate-300">
                      {item.category}
                    </span>
                    <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Core Verified
                    </span>
                  </div>
                  <h3 className="font-bold text-sm text-white">{item.question}</h3>
                  <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/40 p-3 rounded-xl border border-white/5">
                    {item.answer}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: UNANSWERED QUESTIONS QUEUE ── */}
      {activeTab === "unanswered" && (
        <div className="space-y-4">
          <div className="bg-slate-800/60 p-4 rounded-2xl border border-white/8">
            <p className="text-xs text-slate-300 leading-relaxed">
              When customers ask questions Atlas cannot answer with high confidence, they are logged here for
              administrator review. Once you supply the approved answer, Atlas will answer it automatically for all
              future customers!
            </p>
          </div>

          {unansweredList.length === 0 ? (
            <div className="p-12 text-center text-slate-400 bg-slate-800/30 rounded-2xl border border-white/5">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-80" />
              <p className="font-bold text-white text-sm">No Unanswered Questions in Queue</p>
              <p className="text-xs text-slate-500 mt-1">Atlas is answering customer queries with verified support knowledge.</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {unansweredList.map((q) => (
                <div
                  key={q.id}
                  className="p-5 rounded-2xl bg-slate-800/80 border border-white/8 space-y-3 shadow-lg"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                            q.status === "PENDING"
                              ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                              : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                          }`}
                        >
                          {q.status}
                        </span>
                        <span className="text-xs text-slate-400">{new Date(q.createdAt).toLocaleString()}</span>
                      </div>
                      <h3 className="font-bold text-base text-white pt-1">{q.question}</h3>
                    </div>

                    <div className="flex items-center gap-2">
                      {q.status === "PENDING" && (
                        <button
                          onClick={() => {
                            setAnsweringQuestion(q);
                            setApproveAnswerText(q.suggestedAnswer || "");
                          }}
                          className="bg-[#f0c040] hover:bg-amber-400 text-slate-950 font-bold text-xs px-3.5 py-1.5 rounded-xl shadow transition-all"
                        >
                          Approve & Answer
                        </button>
                      )}
                      <button
                        onClick={() => handleDismissUnanswered(q.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-400 transition-colors"
                        title="Dismiss"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="text-xs text-slate-400 space-y-1 bg-slate-900/60 p-3 rounded-xl border border-white/5">
                    {q.accountEmail && (
                      <p>
                        <span className="font-semibold text-slate-300">Customer Email:</span> {q.accountEmail}
                      </p>
                    )}
                    {q.pageUrl && (
                      <p>
                        <span className="font-semibold text-slate-300">Page URL:</span> {q.pageUrl}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── TAB 3: WIDGET SETTINGS ── */}
      {activeTab === "settings" && settings && (
        <div className="space-y-5">
          {/* General */}
          <div className="bg-slate-800/60 border border-white/8 rounded-2xl p-5 space-y-4 shadow-xl backdrop-blur-sm">
            <h2 className="font-black text-white flex items-center gap-2 text-sm">
              <Settings01Icon className="w-4 h-4 text-amber-400" /> General Controls
            </h2>
            <div className="flex items-center justify-between p-3.5 bg-slate-900/60 border border-white/5 rounded-xl">
              <div>
                <div className="font-bold text-white text-sm">Widget Enabled</div>
                <div className="text-xs text-slate-400">Show or hide the Atlas AI support concierge on front-end pages</div>
              </div>
              <button onClick={() => setSettings((s) => (s ? { ...s, widgetEnabled: !s.widgetEnabled } : s))}>
                {settings.widgetEnabled ? (
                  <ToggleOnIcon className="w-9 h-9 text-emerald-400" />
                ) : (
                  <ToggleOffIcon className="w-9 h-9 text-slate-600" />
                )}
              </button>
            </div>

            {/* Provider */}
            <div className="p-3.5 bg-slate-900/60 border border-white/5 rounded-xl">
              <div className="font-bold text-white text-sm mb-2">Default AI Provider</div>
              <div className="flex gap-2">
                {[
                  { value: "openai", label: "GPT-4o", color: "bg-blue-600" },
                  { value: "claude", label: "Claude", color: "bg-violet-600" },
                ].map((p) => (
                  <button
                    key={p.value}
                    onClick={() => setSettings((s) => (s ? { ...s, defaultProvider: p.value } : s))}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
                      settings.defaultProvider === p.value
                        ? `${p.color} text-white shadow-md font-black`
                        : "bg-slate-800 text-slate-400 border border-white/10 hover:text-white"
                    }`}
                  >
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
              <input
                type="range"
                min={256}
                max={4096}
                step={128}
                value={settings.maxTokens}
                onChange={(e) => setSettings((s) => (s ? { ...s, maxTokens: parseInt(e.target.value) } : s))}
                className="w-full accent-[#f0c040]"
              />
            </div>
          </div>

          {/* Access Control */}
          <div className="bg-slate-800/60 border border-white/8 rounded-2xl p-5 space-y-4 shadow-xl backdrop-blur-sm">
            <h2 className="font-black text-white flex items-center gap-2 text-sm">
              <InformationCircleIcon className="w-4 h-4 text-blue-400" /> Access Control
            </h2>
            <div className="space-y-2">
              {ALL_TIERS.map((tier) => {
                const active = settings.allowedTiers.includes(tier);
                return (
                  <div
                    key={tier}
                    className="flex items-center justify-between p-3.5 bg-slate-900/60 border border-white/5 rounded-xl"
                  >
                    <div>
                      <div className="font-bold text-white text-sm">{TIER_LABELS[tier]}</div>
                      <div className="text-xs text-slate-400">{tier} tier members</div>
                    </div>
                    <button onClick={() => toggleTier(tier)}>
                      {active ? (
                        <ToggleOnIcon className="w-9 h-9 text-emerald-400" />
                      ) : (
                        <ToggleOffIcon className="w-9 h-9 text-slate-600" />
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end gap-3 pt-2">
            {savedSettings && (
              <div className="flex items-center gap-1.5 text-emerald-400 text-sm font-bold bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-xl">
                <CheckmarkCircle02Icon className="w-4 h-4" /> Settings Saved!
              </div>
            )}
            <button
              onClick={handleSaveSettings}
              disabled={savingSettings}
              className="flex items-center gap-2 bg-[#f0c040] hover:bg-amber-400 text-slate-950 font-black text-sm px-6 py-3 rounded-xl shadow-lg shadow-amber-400/20 transition-all disabled:opacity-50"
            >
              {savingSettings ? <Loading02Icon className="w-4 h-4 animate-spin" /> : <FloppyDiskIcon className="w-4 h-4" />}
              Save Settings
            </button>
          </div>
        </div>
      )}

      {/* ── MODAL: ADD / EDIT APPROVED KNOWLEDGE ITEM ── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 rounded-3xl max-w-xl w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h3 className="font-bold text-base text-white">
                {editingItem ? "Edit Approved Knowledge Item" : "Add Approved Knowledge Item"}
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveKnowledgeItem} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Category</label>
                <select
                  value={modalCategory}
                  onChange={(e) => setModalCategory(e.target.value)}
                  className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-amber-400"
                >
                  {CATEGORIES.filter((c) => c !== "ALL").map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Customer Question</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. How do I upgrade my membership?"
                  value={modalQuestion}
                  onChange={(e) => setModalQuestion(e.target.value)}
                  className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-amber-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Approved Answer</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Provide concise, natural 1-3 sentence approved answer..."
                  value={modalAnswer}
                  onChange={(e) => setModalAnswer(e.target.value)}
                  className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-amber-400 resize-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Alternate Phrasings (1 per line)</label>
                <textarea
                  rows={2}
                  placeholder="Optional alternate question phrasings..."
                  value={modalAlternates}
                  onChange={(e) => setModalAlternates(e.target.value)}
                  className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2 text-xs text-white outline-none focus:border-amber-400 resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingItem}
                  className="bg-[#f0c040] hover:bg-amber-400 text-slate-950 font-black text-xs px-5 py-2.5 rounded-xl shadow transition-all disabled:opacity-50"
                >
                  {savingItem ? "Saving..." : "Save to Knowledge Base"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: ANSWER UNANSWERED QUESTION ── */}
      {answeringQuestion && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 rounded-3xl max-w-xl w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h3 className="font-bold text-base text-white">Approve Answer for Customer Question</h3>
              <button
                onClick={() => setAnsweringQuestion(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-slate-800/80 border border-white/5 text-xs text-slate-300">
              <p className="font-bold text-white mb-1">Customer Question:</p>
              <p>{answeringQuestion.question}</p>
            </div>

            <form onSubmit={handleApproveUnanswered} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Approved Answer</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Enter the official approved answer. Atlas will learn this and answer it automatically in the future..."
                  value={approveAnswerText}
                  onChange={(e) => setApproveAnswerText(e.target.value)}
                  className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-amber-400 resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setAnsweringQuestion(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingApproval}
                  className="bg-[#f0c040] hover:bg-amber-400 text-slate-950 font-black text-xs px-5 py-2.5 rounded-xl shadow transition-all disabled:opacity-50"
                >
                  {submittingApproval ? "Saving..." : "Approve & Add to Atlas"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
