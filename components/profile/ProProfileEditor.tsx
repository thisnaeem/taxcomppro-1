"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setUser } from "@/store/slices/authSlice";
import {
  Loader2,
  MapPin,
  UserCheck,
  Share2,
  Clock,
  Award,
  ShieldCheck,
  Check,
  CreditCard,
  ChevronRight,
  Sparkles,
  Camera,
  Edit3,
  Mic,
  Image as ImageIcon,
  Briefcase,
  Target,
  Crown,
  X,
  Link2,
  Mail,
} from "lucide-react";
import EditProfileModal, { type ProfileFormData } from "@/components/profile/EditProfileModal";
import { VoiceMemoPlayer, VoiceMemoEditor } from "@/components/profile/VoiceMemo";
import ServiceEditor from "@/components/profile/ServiceEditor";
import MediaGallery from "@/components/profile/MediaGallery";
import ConnectCardManager from "@/components/profile/ConnectCardManager";

interface Service {
  id: string;
  title: string;
  description: string | null;
  price: string | null;
  emoji: string;
}

const PRO_SIDEBAR_TABS = [
  { id: "overview", label: "Overview", icon: UserCheck },
  { id: "basic", label: "Basic Info", icon: Edit3 },
  { id: "mission", label: "Mission & Story", icon: Target },
  { id: "services", label: "Services & Pricing", icon: Briefcase },
  { id: "credentials", label: "Credentials & Badges", icon: ShieldCheck },
  { id: "voice", label: "Voice Intro", icon: Mic },
  { id: "card", label: "Pro Connect Card", icon: CreditCard },
  { id: "media", label: "Media Gallery", icon: ImageIcon },
  { id: "membership", label: "Membership Plan", icon: Crown },
] as const;

export default function ProProfileEditor() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);

  const [activeTab, setActiveTab] = useState<typeof PRO_SIDEBAR_TABS[number]["id"]>("overview");
  const [loading, setLoading] = useState(true);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [savingInPage, setSavingInPage] = useState(false);
  const [saveToast, setSaveToast] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<ProfileFormData>({
    name: user?.name ?? "",
    headline: user?.headline ?? "",
    bio: user?.bio ?? "",
    mission: user?.mission ?? "",
    location: user?.location ?? "",
    yearsExperience: user?.yearsExperience ? String(user?.yearsExperience) : "",
    website: user?.website ?? "",
    linkedIn: user?.linkedIn ?? "",
    twitter: user?.twitter ?? "",
    facebook: user?.facebook ?? "",
    image: user?.image ?? null,
    coverImage: user?.coverImage ?? null,
    specialties: user?.specialties?.length ? user.specialties : [],
    certifications: user?.certifications?.length ? user.certifications : [],
    languages: user?.languages?.length ? user.languages : [],
    mediaPhotos: user?.mediaPhotos ?? [],
    voiceMemoUrl: user?.voiceMemoUrl ?? null,
  });

  const [services, setServices] = useState<Service[]>([]);
  const [memberStats, setMemberStats] = useState({
    memberSince: "",
    tierName: "PRO MEMBER",
    validThru: "",
  });

  const loadUserData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/user/me");
      if (res.ok) {
        const u = await res.json();
        setProfile({
          name: u.name || "",
          headline: u.headline || "",
          bio: u.bio || "",
          mission: u.mission || "",
          location: u.location || "",
          yearsExperience: u.yearsExperience != null ? String(u.yearsExperience) : "",
          website: u.website || "",
          linkedIn: u.linkedIn || "",
          twitter: u.twitter || "",
          facebook: u.facebook || "",
          image: u.image || null,
          coverImage: u.coverImage || null,
          specialties: u.specialties?.length ? u.specialties : [],
          certifications: u.certifications?.length ? u.certifications : [],
          languages: u.languages?.length ? u.languages : [],
          mediaPhotos: u.mediaPhotos || [],
          voiceMemoUrl: u.voiceMemoUrl || null,
        });

        const createdDate = u.createdAt ? new Date(u.createdAt) : new Date();
        const memberSinceStr = createdDate.toLocaleDateString("en-US", {
          month: "short",
          year: "numeric",
        });

        let validThruStr = "";
        if (u.subscription?.currentPeriodEnd) {
          validThruStr = new Date(u.subscription.currentPeriodEnd).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          });
        }

        const tierLabel =
          u.tier === "VIP"
            ? "VIP MEMBER"
            : u.tier === "MARKETPLACE_PLUS"
            ? "MARKETPLACE PLUS"
            : u.tier === "MARKETPLACE"
            ? "MARKETPLACE PRO"
            : "PRO MEMBER";

        setMemberStats({
          memberSince: memberSinceStr,
          tierName: tierLabel,
          validThru: validThruStr,
        });
      }

      if (user?.id) {
        const sRes = await fetch(`/api/pros/${user.id}/services`);
        if (sRes.ok) {
          const svcs = await sRes.json();
          if (Array.isArray(svcs) && svcs.length > 0) {
            setServices(svcs);
          }
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    const fd = new FormData();
    fd.append("files", file);
    fd.append("type", "avatar");
    try {
      const res = await fetch("/api/upload/profile", { method: "POST", body: fd });
      if (res.ok) {
        const { urls } = (await res.json()) as { urls: string[] };
        const url = urls[0];
        await fetch("/api/user/profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: url }),
        });
        setProfile((p) => ({ ...p, image: url }));
        if (user) dispatch(setUser({ ...user, image: url }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAvatarUploading(false);
      e.target.value = "";
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverUploading(true);
    const fd = new FormData();
    fd.append("files", file);
    fd.append("type", "cover");
    try {
      const res = await fetch("/api/upload/profile", { method: "POST", body: fd });
      if (res.ok) {
        const { urls } = (await res.json()) as { urls: string[] };
        const url = urls[0];
        await fetch("/api/user/profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ coverImage: url }),
        });
        setProfile((p) => ({ ...p, coverImage: url }));
        if (user) dispatch(setUser({ ...user, coverImage: url }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCoverUploading(false);
      e.target.value = "";
    }
  };

  const saveInPageProfile = async () => {
    setSavingInPage(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...profile,
          yearsExperience: profile.yearsExperience ? Number(profile.yearsExperience) : null,
        }),
      });
      if (res.ok) {
        setSaveToast(true);
        if (user) {
          dispatch(
            setUser({
              ...user,
              name: profile.name,
              headline: profile.headline,
              bio: profile.bio,
              image: profile.image,
              coverImage: profile.coverImage,
            })
          );
        }
        setTimeout(() => setSaveToast(false), 2500);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingInPage(false);
    }
  };

  const profileShareUrl = typeof window !== "undefined" ? `${window.location.origin}/find-a-pro/${user?.id || ""}` : "";
  const shareText = `Check out ${profile.name || "this tax professional"} on TaxComPro!`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(profileShareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const openStripePortal = async () => {
    setPortalLoading(true);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else {
        alert(data.error ?? "Could not open billing portal");
      }
    } catch {
      alert("Error opening subscription portal");
    } finally {
      setPortalLoading(false);
    }
  };

  const onProfileUpdated = (updated: ProfileFormData) => {
    setProfile(updated);
    if (user) {
      dispatch(
        setUser({
          ...user,
          name: updated.name,
          headline: updated.headline,
          bio: updated.bio,
          image: updated.image,
          coverImage: updated.coverImage,
        })
      );
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#1E56A0]" />
      </div>
    );
  }

  const displayName = profile.name || "Your Name";
  const headline = profile.headline || "Add your professional headline";
  const location = profile.location || "Add your location";
  const yearsExp = profile.yearsExperience || "–";

  return (
    <div className="max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Hidden file inputs */}
      <input type="file" ref={avatarInputRef} onChange={handleAvatarUpload} accept="image/*" className="hidden" />
      <input type="file" ref={coverInputRef} onChange={handleCoverUpload} accept="image/*" className="hidden" />

      <div className="flex flex-col lg:flex-row gap-6">
        {/* ── LEFT SIDEBAR ────────────────────────────────────────────────── */}
        <aside className="w-full lg:w-64 shrink-0 lg:sticky lg:top-24 self-start space-y-5">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-3 space-y-0.5">
            <div className="px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
              PROFILE MENU
            </div>
            {PRO_SIDEBAR_TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold tracking-wide transition-all text-left ${
                    isActive
                      ? "bg-[#EAF2FC] text-[#1E56A0]"
                      : "text-slate-600 hover:text-[#0A1628] hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <tab.icon className={`w-4 h-4 ${isActive ? "text-[#1E56A0]" : "text-slate-400"}`} />
                    <span>{tab.label}</span>
                  </div>
                  {isActive && <ChevronRight className="w-3.5 h-3.5 text-[#1E56A0]" />}
                </button>
              );
            })}
          </div>

          {/* Upgrade CTA - Only show if not already VIP/Marketplace Plus */}
          {user?.tier !== "VIP" && user?.tier !== "MARKETPLACE_PLUS" && (
            <div className="rounded-2xl bg-gradient-to-br from-[#0A1628] to-[#122A4A] p-5 text-white border border-slate-800">
              <span className="text-[9px] font-black uppercase tracking-widest text-amber-400">TAX PROFESSIONAL?</span>
              <h4 className="text-xs font-extrabold text-white leading-snug mt-1 mb-3">UPGRADE YOUR EXPERIENCE</h4>
              <ul className="space-y-1.5 text-[11px] text-slate-300 font-medium mb-4">
                <li className="flex items-center gap-1.5"><span className="text-amber-400 font-bold">✓</span> Exclusive Toolkits</li>
                <li className="flex items-center gap-1.5"><span className="text-amber-400 font-bold">✓</span> Advanced Training</li>
                <li className="flex items-center gap-1.5"><span className="text-amber-400 font-bold">✓</span> Priority Support</li>
              </ul>
              <Link
                href="/upgrade"
                className="w-full block text-center py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-[#0A1628] font-black text-xs uppercase tracking-wider transition-all active:scale-[0.98]"
              >
                UPGRADE NOW
              </Link>
            </div>
          )}
        </aside>

        {/* ── MAIN CONTENT AREA ───────────────────────────────────────────── */}
        <div className="flex-1 min-w-0 space-y-6">

          {/* ── HERO PROFILE CARD ─────────────────────────────────────────── */}
          <div className="rounded-2xl bg-white border border-slate-200 shadow-xs overflow-hidden">

            {/* Cover Image Area */}
            {profile.coverImage ? (
              <div className="relative h-40 sm:h-48 w-full overflow-hidden">
                <img src={profile.coverImage} alt="Cover" className="w-full h-full object-cover" />
                <button
                  onClick={() => coverInputRef.current?.click()}
                  disabled={coverUploading}
                  className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/50 hover:bg-black/70 backdrop-blur-sm text-white text-xs font-bold border border-white/20 transition-all"
                >
                  {coverUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
                  Change Cover
                </button>
              </div>
            ) : (
              <div className="relative h-28 sm:h-32 w-full bg-slate-100 flex items-center justify-center">
                <button
                  onClick={() => coverInputRef.current?.click()}
                  disabled={coverUploading}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-slate-300 text-slate-600 text-xs font-bold hover:border-[#1E56A0] hover:text-[#1E56A0] transition-all"
                >
                  {coverUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                  Add Cover Photo
                </button>
              </div>
            )}

            {/* Profile Info Section */}
            <div className="px-6 py-5 sm:px-8">
              <div className="flex flex-col sm:flex-row gap-5">
                {/* Square Avatar */}
                <div className="relative shrink-0 w-24 h-24 sm:w-28 sm:h-28 -mt-14 sm:-mt-16 group self-start">
                  <div className="w-full h-full rounded-2xl overflow-hidden bg-gradient-to-br from-[#0A1628] to-[#1E56A0] ring-4 ring-white shadow-lg flex items-center justify-center">
                    {profile.image ? (
                      <img src={profile.image} alt={profile.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-white font-black text-3xl">{(profile.name || "?")[0]?.toUpperCase()}</span>
                    )}
                  </div>
                  <button
                    onClick={() => avatarInputRef.current?.click()}
                    disabled={avatarUploading}
                    className="absolute inset-0 rounded-2xl bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer z-10"
                    title="Change photo"
                  >
                    {avatarUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Camera className="w-5 h-5" />}
                  </button>
                  {/* Online dot */}
                  <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-emerald-500 border-[3px] border-white z-20 pointer-events-none" />
                </div>

                {/* Name, headline, meta */}
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h1 className="text-xl sm:text-2xl font-black text-[#0A1628] tracking-tight truncate">
                      {displayName}
                    </h1>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-[#1E56A0] text-white text-[10px] font-black tracking-wider uppercase">
                      <ShieldCheck className="w-3 h-3" />
                      VERIFIED PRO
                    </span>
                  </div>

                  <p className="text-sm font-medium text-slate-600">{headline}</p>

                  <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-500 pt-0.5">
                    {location && (
                      <span className="flex items-center gap-1 text-[#1E56A0]">
                        <MapPin className="w-3.5 h-3.5" />
                        {location}
                      </span>
                    )}
                    {memberStats.memberSince && (
                      <span className="text-slate-400">Member Since: {memberStats.memberSince}</span>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap items-center gap-2.5 pt-3">
                    <button
                      onClick={() => setEditModalOpen(true)}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1E56A0] hover:bg-[#16437E] text-white text-xs font-bold transition-all shadow-sm"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      EDIT PROFILE
                    </button>

                    <button
                      onClick={() => setShareDialogOpen(true)}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 hover:border-[#1E56A0] hover:text-[#1E56A0] bg-white text-slate-600 text-xs font-bold transition-all"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      SHARE
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── OVERVIEW TAB ──────────────────────────────────────────────── */}
          {activeTab === "overview" && (
            <div className="grid lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7 space-y-6">
                {/* ABOUT ME */}
                <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="text-xs font-black text-[#0A1628] uppercase tracking-widest flex items-center gap-2">
                      <UserCheck className="w-4 h-4 text-[#1E56A0]" />
                      ABOUT ME
                    </h3>
                    <button onClick={() => setActiveTab("basic")} className="text-xs font-bold text-[#1E56A0] hover:underline flex items-center gap-1">
                      <Edit3 className="w-3 h-3" /> Edit
                    </button>
                  </div>

                  {profile.bio ? (
                    <p className="text-sm text-slate-600 leading-relaxed">{profile.bio}</p>
                  ) : (
                    <p className="text-sm text-slate-400 italic">No bio added yet. Click Edit to add your professional summary.</p>
                  )}

                  {/* Stats — only show real data */}
                  {(yearsExp !== "–" || profile.certifications.length > 0) && (
                    <div className="flex flex-wrap gap-3 pt-2">
                      {yearsExp !== "–" && (
                        <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-100">
                          <Clock className="w-4 h-4 text-[#1E56A0]" />
                          <div>
                            <p className="text-sm font-black text-[#0A1628]">{yearsExp}+ Years</p>
                            <p className="text-[10px] font-bold text-slate-400">Experience</p>
                          </div>
                        </div>
                      )}
                      {profile.certifications.length > 0 && (
                        <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-100">
                          <Award className="w-4 h-4 text-amber-600" />
                          <div>
                            <p className="text-sm font-black text-[#0A1628]">{profile.certifications[0]}</p>
                            <p className="text-[10px] font-bold text-slate-400">Credential</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* EXPERTISE */}
                {profile.specialties.length > 0 && (
                  <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-xs space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <h3 className="text-xs font-black text-[#0A1628] uppercase tracking-widest flex items-center gap-2">
                        <Award className="w-4 h-4 text-[#1E56A0]" />
                        EXPERTISE
                      </h3>
                      <button onClick={() => setActiveTab("credentials")} className="text-[11px] font-bold text-[#1E56A0] hover:underline">Manage</button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {profile.specialties.map((spec) => (
                        <span key={spec} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#EAF2FC] text-[#1E56A0] border border-[#1E56A0]/20">{spec}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* SERVICES */}
                {services.length > 0 && (
                  <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-xs space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <h3 className="text-xs font-black text-[#0A1628] uppercase tracking-widest flex items-center gap-2">
                        <Check className="w-4 h-4 text-[#1E56A0]" />
                        SERVICES OFFERED
                      </h3>
                      <button onClick={() => setActiveTab("services")} className="text-[11px] font-bold text-[#1E56A0] hover:underline">Manage</button>
                    </div>
                    <ul className="space-y-2 text-xs font-bold text-slate-700">
                      {services.map((svc) => (
                        <li key={svc.id} className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-[#1E56A0]">✓</span>
                            <span>{svc.title}</span>
                          </div>
                          {svc.price && <span className="text-[11px] font-semibold text-emerald-600">{svc.price}</span>}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* CREDENTIALS */}
                {profile.certifications.length > 0 && (
                  <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-xs space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <h3 className="text-xs font-black text-[#0A1628] uppercase tracking-widest flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                        CREDENTIALS
                      </h3>
                      <button onClick={() => setActiveTab("credentials")} className="text-[11px] font-bold text-[#1E56A0] hover:underline">Edit</button>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-3">
                      {profile.certifications.map((cert) => (
                        <div key={cert} className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                            <Award className="w-4 h-4" />
                          </div>
                          <p className="text-xs font-bold text-[#0A1628]">{cert}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* VOICE MEMO */}
                {profile.voiceMemoUrl && (
                  <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-xs space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <h3 className="text-xs font-black uppercase tracking-widest text-[#0A1628]">Voice Introduction</h3>
                      <button onClick={() => setActiveTab("voice")} className="text-[11px] font-bold text-[#1E56A0] hover:underline">Record New</button>
                    </div>
                    <VoiceMemoPlayer url={profile.voiceMemoUrl} name={profile.name} />
                  </div>
                )}
              </div>

              {/* RIGHT COLUMN */}
              <div className="lg:col-span-5 space-y-6">
                {/* MEMBERSHIP */}
                <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-xs space-y-4">
                  <h3 className="text-xs font-black text-[#0A1628] uppercase tracking-widest flex items-center gap-2 border-b border-slate-100 pb-3">
                    <Crown className="w-4 h-4 text-amber-500" />
                    MEMBERSHIP STATUS
                  </h3>
                  <div className="flex items-center justify-between gap-3 p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/60">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-white flex items-center justify-center shrink-0">
                        <Crown className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-[#0A1628]">{memberStats.tierName}</h4>
                        {memberStats.validThru && (
                          <p className="text-[11px] font-semibold text-slate-500">Valid Thru: {memberStats.validThru}</p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={openStripePortal}
                      disabled={portalLoading}
                      className="px-3 py-2 rounded-lg bg-white border border-slate-200 text-xs font-bold text-[#0A1628] hover:bg-slate-50 transition-all shrink-0"
                    >
                      {portalLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "MANAGE"}
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs font-bold text-slate-700 pt-1">
                    {["Unlimited Toolkit Access", "Priority Support", "All Course Access", "Exclusive Discounts", "Pro Talks Access", "Community Access"].map((b) => (
                      <div key={b} className="flex items-center gap-1.5">
                        <span className="text-[#1E56A0]">✓</span>
                        <span>{b}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* PRO CONNECT CARD PREVIEW */}
                <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="text-xs font-black text-[#0A1628] uppercase tracking-widest flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-[#1E56A0]" />
                      PRO CONNECT CARD
                    </h3>
                    <button onClick={() => setActiveTab("card")} className="text-[11px] font-bold text-[#1E56A0] hover:underline">Configure</button>
                  </div>
                  <div className="rounded-xl bg-gradient-to-br from-[#0A1628] to-[#1C3658] p-4 text-white flex items-center justify-between gap-3">
                    <div className="space-y-1 flex-1 min-w-0">
                      <h5 className="text-sm font-black truncate">{displayName}</h5>
                      <p className="text-[11px] text-slate-300 truncate">{headline}</p>
                      <p className="text-[10px] text-slate-400 italic">Let&apos;s Connect &amp; Grow Together</p>
                    </div>
                    <div className="w-16 h-20 rounded-lg overflow-hidden ring-2 ring-amber-400/40 bg-[#0A1628] shrink-0">
                      {profile.image ? (
                        <img src={profile.image} alt={profile.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white font-bold text-lg">
                          {(profile.name || "?")[0]}
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveTab("card")}
                    className="w-full py-2.5 rounded-xl bg-[#1E56A0] hover:bg-[#16437E] text-white font-bold text-xs uppercase tracking-wider transition-all"
                  >
                    VIEW MY PRO CONNECT CARD
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── BASIC INFO TAB ────────────────────────────────────────────── */}
          {activeTab === "basic" && (
            <div className="rounded-2xl bg-white border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <h2 className="text-base font-black text-[#0A1628] uppercase tracking-wider flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-[#1E56A0]" />
                  Basic Information
                </h2>
                <button
                  onClick={saveInPageProfile}
                  disabled={savingInPage}
                  className="px-5 py-2.5 rounded-xl bg-[#1E56A0] hover:bg-[#16437E] text-white text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-1.5"
                >
                  {savingInPage ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  {saveToast ? "Saved!" : savingInPage ? "Saving..." : "Save Changes"}
                </button>
              </div>
              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-1">Full Name & Suffix</label>
                  <input type="text" value={profile.name} onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:border-[#1E56A0] focus:ring-2 focus:ring-[#1E56A0]/10 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-1">Location</label>
                  <input type="text" value={profile.location} onChange={(e) => setProfile((p) => ({ ...p, location: e.target.value }))} placeholder="e.g. Houston, Texas" className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:border-[#1E56A0] focus:ring-2 focus:ring-[#1E56A0]/10 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-1">Professional Headline</label>
                  <input type="text" value={profile.headline} onChange={(e) => setProfile((p) => ({ ...p, headline: e.target.value }))} placeholder="e.g. Enrolled Agent | Tax Professional" className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:border-[#1E56A0] focus:ring-2 focus:ring-[#1E56A0]/10 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-1">Years of Experience</label>
                  <input type="number" value={profile.yearsExperience} onChange={(e) => setProfile((p) => ({ ...p, yearsExperience: e.target.value }))} placeholder="20" className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:border-[#1E56A0] focus:ring-2 focus:ring-[#1E56A0]/10 outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-1">About Me / Bio</label>
                <textarea rows={4} value={profile.bio} onChange={(e) => setProfile((p) => ({ ...p, bio: e.target.value }))} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:border-[#1E56A0] focus:ring-2 focus:ring-[#1E56A0]/10 outline-none resize-none" />
              </div>
            </div>
          )}

          {/* ── MISSION TAB ───────────────────────────────────────────────── */}
          {activeTab === "mission" && (
            <div className="rounded-2xl bg-white border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <h2 className="text-base font-black text-[#0A1628] uppercase tracking-wider flex items-center gap-2">
                  <Target className="w-5 h-5 text-[#1E56A0]" />
                  Mission &amp; Professional Philosophy
                </h2>
                <button onClick={saveInPageProfile} disabled={savingInPage} className="px-5 py-2.5 rounded-xl bg-[#1E56A0] hover:bg-[#16437E] text-white text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-1.5">
                  {savingInPage ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  {saveToast ? "Saved!" : "Save Changes"}
                </button>
              </div>
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-1.5">My Mission</label>
                <textarea rows={3} value={profile.mission} onChange={(e) => setProfile((p) => ({ ...p, mission: e.target.value }))} placeholder="e.g. Empowering individuals and business owners to navigate complex tax codes..." className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:border-[#1E56A0] focus:ring-2 focus:ring-[#1E56A0]/10 outline-none resize-none" />
              </div>
            </div>
          )}

          {/* ── SERVICES TAB ──────────────────────────────────────────────── */}
          {activeTab === "services" && (
            <div className="rounded-2xl bg-white border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-base font-black text-[#0A1628] uppercase tracking-wider flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-[#1E56A0]" /> Services &amp; Pricing
                </h2>
                <p className="text-xs text-slate-400 mt-1">Add and manage the tax services displayed on your public profile.</p>
              </div>
              <ServiceEditor proId={user?.id || ""} initial={services} />
            </div>
          )}

          {/* ── CREDENTIALS TAB ───────────────────────────────────────────── */}
          {activeTab === "credentials" && (
            <div className="rounded-2xl bg-white border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-base font-black text-[#0A1628] uppercase tracking-wider flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-600" /> Credentials &amp; Expertise
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">Manage your IRS licenses, PTIN, and focus specialties.</p>
                </div>
                <button onClick={() => setEditModalOpen(true)} className="px-4 py-2 rounded-xl bg-[#1E56A0] text-white text-xs font-bold hover:bg-[#16437E] transition-all">
                  Edit Badges
                </button>
              </div>
              {profile.certifications.length > 0 && (
                <div className="grid sm:grid-cols-3 gap-3">
                  {profile.certifications.map((cert) => (
                    <div key={cert} className="p-4 rounded-xl bg-amber-50/60 border border-amber-200 flex items-center gap-3">
                      <Award className="w-7 h-7 text-amber-600 shrink-0" />
                      <p className="text-sm font-black text-[#0A1628]">{cert}</p>
                    </div>
                  ))}
                </div>
              )}
              {profile.specialties.length > 0 && (
                <div className="space-y-3 pt-2">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">Active Expertise Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {profile.specialties.map((spec) => (
                      <span key={spec} className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#EAF2FC] text-[#1E56A0] border border-[#1E56A0]/20">{spec}</span>
                    ))}
                  </div>
                </div>
              )}
              {profile.certifications.length === 0 && profile.specialties.length === 0 && (
                <p className="text-sm text-slate-400 italic py-4">No credentials or expertise tags added yet. Click &quot;Edit Badges&quot; to add.</p>
              )}
            </div>
          )}

          {/* ── VOICE INTRO TAB ───────────────────────────────────────────── */}
          {activeTab === "voice" && (
            <div className="rounded-2xl bg-white border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-base font-black text-[#0A1628] uppercase tracking-wider flex items-center gap-2">
                  <Mic className="w-5 h-5 text-[#1E56A0]" /> Voice Introduction Memo
                </h2>
                <p className="text-xs text-slate-400 mt-1">Record a voice intro that plays on your public profile.</p>
              </div>
              <VoiceMemoEditor currentUrl={profile.voiceMemoUrl} onSaved={(url) => setProfile((p) => ({ ...p, voiceMemoUrl: url }))} />
            </div>
          )}

          {/* ── MEDIA GALLERY TAB ─────────────────────────────────────────── */}
          {activeTab === "media" && (
            <div className="rounded-2xl bg-white border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-base font-black text-[#0A1628] uppercase tracking-wider flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-[#1E56A0]" /> Media &amp; Certificate Gallery
                </h2>
                <p className="text-xs text-slate-400 mt-1">Upload photos of your office, speaking events, and certificates.</p>
              </div>
              <MediaGallery photos={profile.mediaPhotos} onChange={(photos) => setProfile((p) => ({ ...p, mediaPhotos: photos }))} />
            </div>
          )}

          {/* ── CONNECT CARD TAB ──────────────────────────────────────────── */}
          {activeTab === "card" && (
            <div className="rounded-2xl bg-white border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-base font-black text-[#0A1628] uppercase tracking-wider flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-[#1E56A0]" /> Pro Connect NFC &amp; Digital Tap Card
                </h2>
                <p className="text-xs text-slate-400 mt-1">Manage links, QR code, and business contact settings.</p>
              </div>
              <ConnectCardManager />
            </div>
          )}

          {/* ── MEMBERSHIP TAB ────────────────────────────────────────────── */}
          {activeTab === "membership" && (
            <div className="rounded-2xl bg-white border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-base font-black text-[#0A1628] uppercase tracking-wider flex items-center gap-2">
                  <Crown className="w-5 h-5 text-amber-500" /> Membership &amp; Subscription
                </h2>
                <p className="text-xs text-slate-400 mt-1">Manage your subscription tier, billing, and benefits.</p>
              </div>
              <div className="p-5 rounded-xl bg-gradient-to-r from-amber-500/10 to-amber-600/10 border border-amber-300/40 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-700">CURRENT TIER</span>
                  <h3 className="text-lg font-black text-[#0A1628]">{memberStats.tierName}</h3>
                  {memberStats.validThru && <p className="text-xs text-slate-500">Valid Thru: {memberStats.validThru}</p>}
                </div>
                <button
                  onClick={openStripePortal}
                  disabled={portalLoading}
                  className="px-5 py-2.5 bg-gradient-to-r from-amber-400 to-amber-500 text-[#0A1628] font-black text-xs uppercase tracking-wider rounded-xl shadow-md transition-all"
                >
                  {portalLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "MANAGE SUBSCRIPTION"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        initialData={profile}
        userId={user?.id || ""}
        role={user?.role || "PROFESSIONAL"}
        initialServices={services}
        onSaveSuccess={onProfileUpdated}
      />

      {/* Share Profile Dialog */}
      {shareDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShareDialogOpen(false)} />
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-5 animate-in fade-in zoom-in-95">
            {/* Header */}
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-[#0A1628] tracking-tight">Share Your Profile</h3>
              <button onClick={() => setShareDialogOpen(false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* URL Preview */}
            <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200">
              <Link2 className="w-4 h-4 text-slate-400 shrink-0" />
              <p className="text-xs font-medium text-slate-600 truncate flex-1">{profileShareUrl}</p>
              <button
                onClick={handleCopyLink}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
                  copied ? "bg-emerald-100 text-emerald-700" : "bg-[#1E56A0] text-white hover:bg-[#16437E]"
                }`}
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>

            {/* Social Media Grid */}
            <div className="grid grid-cols-3 gap-3">
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(profileShareUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-2 p-4 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-all group"
              >
                <div className="w-10 h-10 rounded-full bg-[#1877F2] flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
                </div>
                <span className="text-[11px] font-bold text-slate-600">Facebook</span>
              </a>

              <a
                href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(profileShareUrl)}&text=${encodeURIComponent(shareText)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-2 p-4 rounded-xl border border-slate-200 hover:border-slate-400 hover:bg-slate-50 transition-all group"
              >
                <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                </div>
                <span className="text-[11px] font-bold text-slate-600">X / Twitter</span>
              </a>

              <a
                href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(profileShareUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-2 p-4 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-all group"
              >
                <div className="w-10 h-10 rounded-full bg-[#0A66C2] flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>
                </div>
                <span className="text-[11px] font-bold text-slate-600">LinkedIn</span>
              </a>

              <a
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + " " + profileShareUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-2 p-4 rounded-xl border border-slate-200 hover:border-green-300 hover:bg-green-50 transition-all group"
              >
                <div className="w-10 h-10 rounded-full bg-[#25D366] flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
                </div>
                <span className="text-[11px] font-bold text-slate-600">WhatsApp</span>
              </a>

              <a
                href={`mailto:?subject=${encodeURIComponent(shareText)}&body=${encodeURIComponent(shareText + "\n\n" + profileShareUrl)}`}
                className="flex flex-col items-center gap-2 p-4 rounded-xl border border-slate-200 hover:border-red-300 hover:bg-red-50 transition-all group"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform">
                  <Mail className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-bold text-slate-600">Email</span>
              </a>

              <button
                onClick={handleCopyLink}
                className="flex flex-col items-center gap-2 p-4 rounded-xl border border-slate-200 hover:border-[#1E56A0]/30 hover:bg-blue-50 transition-all group"
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform ${copied ? "bg-emerald-500" : "bg-[#1E56A0]"}`}>
                  {copied ? <Check className="w-5 h-5" /> : <Link2 className="w-5 h-5" />}
                </div>
                <span className="text-[11px] font-bold text-slate-600">{copied ? "Copied!" : "Copy Link"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
