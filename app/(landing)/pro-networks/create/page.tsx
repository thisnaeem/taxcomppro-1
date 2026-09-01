"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "@/lib/auth-client";
import BadgeCreator, { BadgeConfig } from "@/components/networks/BadgeCreator";
import {
  Crown,
  Sparkles,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Image as ImageIcon,
  DollarSign,
  Shield,
  HelpCircle,
  MessageCircle,
  Phone,
  Calendar,
  Layers,
  Loader2,
  Plus,
  Trash2,
} from "lucide-react";

const categories = [
  "Tax Strategy",
  "Tax Office Growth",
  "Due Diligence",
  "CPA Practice",
  "Audit Defense",
  "Marketing & Growth",
  "Software & Systems",
  "General",
];

const defaultBenefits = [
  "Private Network Discussion Board",
  "Members-Only Resource & Template Library",
  "Exclusive Live Pro Talks & Workshops",
  "Direct Q&A with Network Owner",
  "Private Member Directory Access",
  "Exclusive Media & Training Videos",
  "Dedicated Live Channel Chat",
];

const coverPresets = [
  "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=1200&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1200&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&auto=format&fit=crop&q=80",
];

export default function CreateProNetworkPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();

  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Form State
  const [name, setName] = useState("");
  const [tagline, setTagline] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Tax Strategy");
  const [monthlyPrice, setMonthlyPrice] = useState("19.99");
  const [coverImage, setCoverImage] = useState(coverPresets[0]);
  const [customCoverUrl, setCustomCoverUrl] = useState("");
  const [logoImage, setLogoImage] = useState("");

  // Badge Config
  const [badge, setBadge] = useState<BadgeConfig>({
    badgeShape: "rounded",
    badgeInitials: "PRO",
    badgeText: "MEMBER",
    badgeIcon: "Star",
    badgeBgColor: "#0a1628",
    badgeTextColor: "#f0c040",
    badgeBorderColor: "#d4a017",
    badgeCustomImage: null,
  });

  // Benefits & Content
  const [benefits, setBenefits] = useState<string[]>(defaultBenefits);
  const [newBenefit, setNewBenefit] = useState("");
  const [welcomeMessage, setWelcomeMessage] = useState(
    "Welcome to our private Pro Network! Introduce yourself in the discussion feed and download our latest member guides."
  );
  const [rules, setRules] = useState(
    "1. Maintain professional courtesy at all times.\n2. Keep client-specific taxpayer identifying details confidential.\n3. Share insights freely and support fellow practitioners."
  );

  // Direct Access Settings
  const [allowDirectMessage, setAllowDirectMessage] = useState(true);
  const [allowDirectText, setAllowDirectText] = useState(false);
  const [directTextPhone, setDirectTextPhone] = useState("");
  const [allowQuestions, setAllowQuestions] = useState(true);
  const [allowConsultations, setAllowConsultations] = useState(true);
  const [consultationUrl, setConsultationUrl] = useState("");

  const handleAddBenefit = () => {
    if (!newBenefit.trim()) return;
    setBenefits([...benefits, newBenefit.trim()]);
    setNewBenefit("");
  };

  const handleRemoveBenefit = (index: number) => {
    setBenefits(benefits.filter((_, i) => i !== index));
  };

  const handlePublish = async () => {
    if (!name.trim()) {
      setErrorMsg("Please provide a name for your Pro Network.");
      setStep(1);
      return;
    }

    setSubmitting(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/pro-networks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          tagline,
          description,
          category,
          monthlyPrice: parseFloat(monthlyPrice || "0"),
          coverImage: customCoverUrl || coverImage,
          logoImage: logoImage || null,
          badgeShape: badge.badgeShape,
          badgeInitials: badge.badgeInitials,
          badgeText: badge.badgeText,
          badgeIcon: badge.badgeIcon,
          badgeBgColor: badge.badgeBgColor,
          badgeTextColor: badge.badgeTextColor,
          badgeBorderColor: badge.badgeBorderColor,
          badgeCustomImage: badge.badgeCustomImage,
          memberBenefits: benefits,
          welcomeMessage,
          rules,
          allowDirectMessage,
          allowDirectText,
          directTextPhone: allowDirectText ? directTextPhone : null,
          allowQuestions,
          allowConsultations,
          consultationUrl: allowConsultations ? consultationUrl : null,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        router.push(`/pro-networks/${data.network.slug}`);
      } else {
        const err = await res.json();
        setErrorMsg(err.error || "Failed to publish Pro Network.");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("An unexpected network error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f4f6fb] dark:bg-[#0c1527]">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f4f6fb] dark:bg-[#0c1527] p-4">
        <div className="bg-white dark:bg-[#172135] border border-slate-200 dark:border-slate-800 rounded-3xl p-8 max-w-md w-full text-center space-y-5 shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-amber-400/20 text-amber-500 mx-auto flex items-center justify-center">
            <Crown className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">
            Sign In Required
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Please log in or create an account to launch your own Pro Network.
          </p>
          <Link
            href="/login?next=/pro-networks/create"
            className="block w-full py-3.5 rounded-full bg-[#0a1628] dark:bg-amber-400 text-white dark:text-[#0a1628] font-black text-sm shadow-xl"
          >
            Sign In to Continue
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f6fb] dark:bg-[#0c1527] pb-24">
      {/* Top Header */}
      <header className="bg-white dark:bg-[#172135] border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link
            href="/pro-networks"
            className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Pro Networks</span>
          </Link>

          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-amber-500">Step {step} of 5</span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-8">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between text-xs font-black text-slate-400 mb-2">
            <span className={step >= 1 ? "text-amber-500" : ""}>1. Details</span>
            <span className={step >= 2 ? "text-amber-500" : ""}>2. Branding</span>
            <span className={step >= 3 ? "text-amber-500" : ""}>3. Member Badge</span>
            <span className={step >= 4 ? "text-amber-500" : ""}>4. Benefits</span>
            <span className={step >= 5 ? "text-amber-500" : ""}>5. Access Settings</span>
          </div>
          <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-400 to-amber-500 transition-all duration-300 rounded-full"
              style={{ width: `${(step / 5) * 100}%` }}
            />
          </div>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-2">
            <span>⚠️ {errorMsg}</span>
          </div>
        )}

        <div className="bg-white dark:bg-[#172135] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-10 shadow-xl space-y-8">
          {/* STEP 1: Details */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Network Basics &amp; Pricing</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Define your network name, positioning, and monthly subscription price.
                </p>
              </div>

              {/* Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Pro Network Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. RedLine1 Tax Network or Tax Office Growth Network"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 font-bold text-sm text-slate-900 dark:text-white"
                />
              </div>

              {/* Tagline */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Short Tagline
                </label>
                <input
                  type="text"
                  placeholder="e.g. Strategies. Resources. Training. Success."
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 font-medium text-sm text-slate-900 dark:text-white"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 font-bold text-sm text-slate-900 dark:text-white"
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* Monthly Subscription Price */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Monthly Member Subscription Price ($ USD / month)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-400">
                    $
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="19.99"
                    value={monthlyPrice}
                    onChange={(e) => setMonthlyPrice(e.target.value)}
                    className="w-full pl-8 pr-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 font-black text-sm text-slate-900 dark:text-white"
                  />
                </div>

                <div className="mt-3 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs space-y-1.5">
                  <div className="flex items-center gap-2 font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>0% TCP Platform Fee • Direct Stripe Host Payouts</span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                    You keep <strong>100% of recurring member subscriptions</strong>. Connect your Stripe account in your network dashboard after creation, and all member payments will transfer directly to your bank account.
                  </p>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  About Your Network (Description &amp; Public Preview)
                </label>
                <textarea
                  rows={4}
                  placeholder="Describe what members will gain, live sessions you host, and why professionals should join..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white"
                />
              </div>
            </div>
          )}

          {/* STEP 2: Branding & Imagery */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white">
                  Visual Branding &amp; Cover
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Upload your own custom header banner and brand logo using Cloudinary, or choose from presets.
                </p>
              </div>

              {/* Cover Upload */}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Network Cover Banner
                </label>

                {/* Preview current cover */}
                <div className="relative h-36 rounded-2xl overflow-hidden bg-gradient-to-r from-[#0a1628] via-[#112240] to-[#0a1628] border border-slate-200 dark:border-slate-700 shadow-inner">
                  {coverImage ? (
                    <img src={coverImage} alt="Cover Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs font-bold text-slate-400">
                      Default Sleek Gradient Background (No image uploaded)
                    </div>
                  )}

                  {coverImage && (
                    <button
                      type="button"
                      onClick={() => setCoverImage("")}
                      className="absolute top-2.5 right-2.5 bg-black/70 hover:bg-black text-white text-[10px] font-bold px-2.5 py-1 rounded-lg backdrop-blur-md"
                    >
                      Clear Image
                    </button>
                  )}
                </div>

                {/* File Upload Input */}
                <div className="flex items-center gap-3">
                  <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs shadow-md transition-all">
                    <ImageIcon className="w-4 h-4" />
                    <span>Upload Cover from Device</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const fd = new FormData();
                        fd.append("file", file);
                        fd.append("folder", "taxcomppro/networks/covers");
                        try {
                          const res = await fetch("/api/upload", { method: "POST", body: fd });
                          if (res.ok) {
                            const data = await res.json();
                            setCoverImage(data.url);
                          } else {
                            alert("Failed to upload image.");
                          }
                        } catch {
                          alert("Upload error.");
                        }
                      }}
                    />
                  </label>
                  <span className="text-[11px] text-slate-400">PNG, JPG, or WebP up to 10MB</span>
                </div>
              </div>

              {/* Logo / Brand Icon Upload */}
              <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Network Brand Logo / Icon (Optional)
                </label>

                {logoImage && (
                  <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 w-fit">
                    <img src={logoImage} alt="Logo" className="h-10 w-auto object-contain" />
                    <button
                      type="button"
                      onClick={() => setLogoImage("")}
                      className="text-xs text-rose-500 hover:underline font-bold"
                    >
                      Remove
                    </button>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 font-bold text-xs text-slate-700 dark:text-slate-200 transition-all">
                    <ImageIcon className="w-4 h-4 text-slate-400" />
                    <span>Upload Logo Image</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const fd = new FormData();
                        fd.append("file", file);
                        fd.append("folder", "taxcomppro/networks/logos");
                        try {
                          const res = await fetch("/api/upload", { method: "POST", body: fd });
                          if (res.ok) {
                            const data = await res.json();
                            setLogoImage(data.url);
                          } else {
                            alert("Failed to upload logo.");
                          }
                        } catch {
                          alert("Upload error.");
                        }
                      }}
                    />
                  </label>
                  <span className="text-[11px] text-slate-400">Transparent PNG recommended</span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Badge Creator */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white">
                  Custom Member Badge
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Every active member of your Pro Network receives this custom badge next to their
                  name throughout TCP.
                </p>
              </div>

              <BadgeCreator value={badge} onChange={setBadge} />
            </div>
          )}

          {/* STEP 4: Benefits, Welcome Message & Rules */}
          {step === 4 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white">
                  Member Benefits &amp; Welcome
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Set expectations, welcome new members, and list the exclusive perks you offer.
                </p>
              </div>

              {/* Benefits Checklist */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Member Benefits Checklist
                </label>
                <div className="space-y-2 mb-3">
                  {benefits.map((b, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200"
                    >
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>{b}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveBenefit(idx)}
                        className="text-slate-400 hover:text-rose-500 transition-colors p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add custom benefit (e.g. Weekly SOP teardowns)..."
                    value={newBenefit}
                    onChange={(e) => setNewBenefit(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddBenefit())}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium"
                  />
                  <button
                    type="button"
                    onClick={handleAddBenefit}
                    className="px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add
                  </button>
                </div>
              </div>

              {/* Welcome Message */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Welcome Announcement Message
                </label>
                <textarea
                  rows={3}
                  value={welcomeMessage}
                  onChange={(e) => setWelcomeMessage(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white"
                />
              </div>

              {/* Network Rules */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Community Rules
                </label>
                <textarea
                  rows={3}
                  value={rules}
                  onChange={(e) => setRules(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white"
                />
              </div>
            </div>
          )}

          {/* STEP 5: Direct Access & Privacy Settings */}
          {step === 5 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white">
                  Direct Access &amp; Privacy Controls
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Control how members can contact you. (Phone calls are never permitted).
                </p>
              </div>

              <div className="space-y-4">
                {/* Allow DMs */}
                <div className="flex items-center justify-between p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <div>
                    <div className="text-xs font-black text-slate-900 dark:text-white">
                      Members Can DM Me
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      Allow paying network members to send direct private messages on TCP.
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={allowDirectMessage}
                    onChange={(e) => setAllowDirectMessage(e.target.checked)}
                    className="w-5 h-5 accent-amber-500 rounded cursor-pointer"
                  />
                </div>

                {/* Allow Text */}
                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-black text-slate-900 dark:text-white">
                        Members Can Text Me
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        Allow members to send SMS messages to your provided business texting line.
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={allowDirectText}
                      onChange={(e) => setAllowDirectText(e.target.checked)}
                      className="w-5 h-5 accent-amber-500 rounded cursor-pointer"
                    />
                  </div>

                  {allowDirectText && (
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                        Business Texting Number
                      </label>
                      <input
                        type="tel"
                        placeholder="e.g. +1 (555) 019-2834"
                        value={directTextPhone}
                        onChange={(e) => setDirectTextPhone(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold"
                      />
                    </div>
                  )}
                </div>

                {/* Allow Questions */}
                <div className="flex items-center justify-between p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <div>
                    <div className="text-xs font-black text-slate-900 dark:text-white">
                      Members Can Submit Questions
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      Enable a dedicated Q&amp;A consultation board for questions to the host.
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={allowQuestions}
                    onChange={(e) => setAllowQuestions(e.target.checked)}
                    className="w-5 h-5 accent-amber-500 rounded cursor-pointer"
                  />
                </div>

                {/* Allow Consultations */}
                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-black text-slate-900 dark:text-white">
                        Members Can Request Consultations
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        Provide your booking or calendar link for member 1-on-1s.
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={allowConsultations}
                      onChange={(e) => setAllowConsultations(e.target.checked)}
                      className="w-5 h-5 accent-amber-500 rounded cursor-pointer"
                    />
                  </div>

                  {allowConsultations && (
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                        Calendar / Booking Link (Optional)
                      </label>
                      <input
                        type="url"
                        placeholder="e.g. https://calendly.com/your-name/pro-consult"
                        value={consultationUrl}
                        onChange={(e) => setConsultationUrl(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Navigation Controls */}
          <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep((s) => (s - 1) as any)}
                className="px-6 py-3 rounded-full border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" /> Previous
              </button>
            ) : (
              <div />
            )}

            {step < 5 ? (
              <button
                type="button"
                onClick={() => {
                  if (step === 1 && !name.trim()) {
                    setErrorMsg("Please enter a network name to proceed.");
                    return;
                  }
                  setErrorMsg("");
                  setStep((s) => (s + 1) as any);
                }}
                className="px-7 py-3 rounded-full bg-[#0a1628] dark:bg-amber-400 text-white dark:text-[#0a1628] text-xs font-black hover:scale-105 transition-all shadow-lg flex items-center gap-2"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                disabled={submitting}
                onClick={handlePublish}
                className="px-8 py-3.5 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 text-[#0a1628] text-xs font-black hover:from-amber-300 hover:to-amber-400 transition-all shadow-xl shadow-amber-400/20 hover:scale-105 active:scale-95 disabled:opacity-50 flex items-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Publishing Pro Network...</span>
                  </>
                ) : (
                  <>
                    <Crown className="w-4 h-4" />
                    <span>Launch &amp; Publish My Pro Network</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
