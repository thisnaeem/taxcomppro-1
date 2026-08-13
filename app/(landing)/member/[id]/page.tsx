"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, notFound } from "next/navigation";
import Link from "next/link";
import { useAppSelector } from "@/store/hooks";
import {
  Loader2, Globe, ExternalLink,
  MapPin, Briefcase, MessageSquare, UserPlus, BadgeCheck, ChevronLeft,
} from "lucide-react";
import { VoiceMemoPlayer } from "@/components/profile/VoiceMemo";

interface PublicUser {
  id: string; name: string; image: string | null; coverImage: string | null;
  headline: string | null; bio: string | null; mission: string | null;
  location: string | null; yearsExperience: number | null;
  website: string | null; linkedIn: string | null; twitter: string | null; facebook: string | null;
  specialties: string[]; certifications: string[]; languages: string[];
  mediaPhotos: string[]; role: string; tier: string; createdAt: string;
  voiceMemoUrl: string | null;
  instructorCourses: { id: string; slug: string; title: string; thumbnail: string | null; level: string; price: number; isFree: boolean }[];
  listings: { id: string; slug: string | null; title: string; description: string; price: number | null; category: string; images: string[] }[];
}

const TIER_BADGE: Record<string, { label: string; cls: string }> = {
  FREE:             { label: "Member",           cls: "bg-slate-100 text-slate-600" },
  VIP:              { label: "VIP",              cls: "bg-amber-100 text-amber-700" },
  MARKETPLACE:      { label: "Marketplace",      cls: "bg-indigo-100 text-indigo-700" },
  MARKETPLACE_PLUS: { label: "Marketplace Plus", cls: "bg-emerald-100 text-emerald-700" },
};

export default function MemberProfilePage() {
  const { id } = useParams<{ id: string }>();
  const router  = useRouter();
  const me      = useAppSelector(s => s.auth.user);

  const [profile,    setProfile]    = useState<PublicUser | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [isNotFound, setIsNotFound] = useState(false);
  const [connState,  setConnState]  = useState<"idle" | "pending" | "connected" | "sending">("idle");

  useEffect(() => {
    if (!id) return;
    if (me?.id === id) { router.replace("/profile"); return; }
    fetch(`/api/user/${id}`)
      .then(r => { if (r.status === 404) { setIsNotFound(true); return null; } return r.json(); })
      .then(d => { if (d) setProfile(d); })
      .catch(() => setIsNotFound(true))
      .finally(() => setLoading(false));
  }, [id, me, router]);

  // Check existing connection status
  useEffect(() => {
    if (!me || !id || me.id === id) return;
    fetch("/api/connections")
      .then(r => r.json())
      .then((data: { id: string; status: string; requesterId: string; receiverId: string }[]) => {
        if (!Array.isArray(data)) return;
        const match = data.find(c =>
          (c.requesterId === me.id && c.receiverId === id) ||
          (c.receiverId === me.id && c.requesterId === id)
        );
        if (!match) return;
        if (match.status === "ACCEPTED") setConnState("connected");
        else if (match.status === "PENDING") setConnState("pending");
      })
      .catch(() => {});
  }, [me, id]);

  const sendConnect = async () => {
    if (!me || connState !== "idle") return;
    setConnState("sending");
    try {
      const res = await fetch("/api/connections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiverId: id }),
      });
      if (res.ok) setConnState("pending");
      else setConnState("idle");
    } catch { setConnState("idle"); }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#f4f6fb] flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-[#0a1628]" />
    </div>
  );

  if (isNotFound || !profile) {
    notFound();
  }

  const tierInfo = TIER_BADGE[profile.tier] ?? TIER_BADGE["FREE"];
  const isPro    = profile.role === "PROFESSIONAL";

  return (
    <div className="min-h-screen bg-[#f4f6fb]">
      {/* Cover */}
      <div className="relative h-48 sm:h-64 bg-gradient-to-br from-[#0a1628] to-[#1a3a6b] overflow-hidden">
        {profile.coverImage && (
          <img src={profile.coverImage} alt="Cover" className="w-full h-full object-cover opacity-60" />
        )}
        {/* Back button */}
        <button onClick={() => router.back()}
          className="absolute top-4 left-4 flex items-center gap-1.5 text-white/80 hover:text-white text-sm font-semibold bg-black/20 hover:bg-black/30 backdrop-blur-sm px-3 py-1.5 rounded-full transition-all">
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
      </div>

      <div className="max-w-4xl mx-auto px-4 pb-16">
        {/* Avatar + name row */}
        <div className="relative -mt-16 mb-6 flex flex-col sm:flex-row sm:items-end gap-4">
          <div className="w-28 h-28 rounded-2xl border-4 border-white bg-[#0a1628] overflow-hidden shrink-0 shadow-xl">
            {profile.image
              ? <img src={profile.image} alt={profile.name} className="w-full h-full object-cover" />
              : <span className="w-full h-full flex items-center justify-center text-white text-4xl font-black">{profile.name?.[0]?.toUpperCase()}</span>}
          </div>
          <div className="flex-1 pb-1">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="text-2xl font-black text-[#0a1628]">{profile.name}</h1>
              {isPro && <BadgeCheck className="w-5 h-5 text-blue-500" />}
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${tierInfo.cls}`}>{tierInfo.label}</span>
            </div>
            {profile.headline && <p className="text-slate-600 text-sm">{profile.headline}</p>}
            <div className="flex flex-wrap gap-3 mt-2">
              {profile.location && (
                <span className="flex items-center gap-1 text-xs text-slate-500"><MapPin className="w-3.5 h-3.5" />{profile.location}</span>
              )}
              {profile.yearsExperience && (
                <span className="flex items-center gap-1 text-xs text-slate-500"><Briefcase className="w-3.5 h-3.5" />{profile.yearsExperience}+ yrs experience</span>
              )}
            </div>
          </div>
          {/* Action buttons */}
          {me && me.id !== profile.id && (
            <div className="flex gap-2 sm:pb-1">
              <Link href={`/messages?user=${profile.id}`}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0a1628] text-white font-bold text-sm hover:bg-[#1a3a6b] transition-all">
                <MessageSquare className="w-4 h-4" /> Message
              </Link>
              <button
                onClick={sendConnect}
                disabled={connState !== "idle"}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border font-bold text-sm transition-all
                  ${ connState === "connected" ? "border-emerald-200 bg-emerald-50 text-emerald-700 cursor-default"
                    : connState === "pending"  ? "border-slate-200 bg-slate-50 text-slate-400 cursor-default"
                    : "border-slate-200 bg-white text-[#0a1628] hover:border-[#0a1628]" }`}>
                {connState === "sending"   ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                {connState === "connected" ? "Connected" : connState === "pending" ? "Request Sent" : "Connect"}
              </button>
            </div>
          )}
        </div>

        <div className="grid sm:grid-cols-3 gap-6">
          {/* Left sidebar */}
          <div className="space-y-4">
            {/* About */}
            {(profile.bio || profile.mission) && (
              <div className="bg-white rounded-2xl p-5 border border-slate-100">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">About</p>
                {profile.bio && <p className="text-sm text-slate-600 leading-relaxed mb-3">{profile.bio}</p>}
                {profile.mission && <p className="text-xs text-slate-500 italic leading-relaxed">{profile.mission}</p>}
              </div>
            )}

            {/* Specialties */}
            {profile.specialties?.length > 0 && (
              <div className="bg-white rounded-2xl p-5 border border-slate-100">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Specialties</p>
                <div className="flex flex-wrap gap-2">
                  {profile.specialties.map(s => (
                    <span key={s} className="text-xs font-semibold bg-[#0a1628]/8 text-[#0a1628] px-2.5 py-1 rounded-lg">{s}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Certifications */}
            {profile.certifications?.length > 0 && (
              <div className="bg-white rounded-2xl p-5 border border-slate-100">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Certifications</p>
                <ul className="space-y-1">
                  {profile.certifications.map(c => (
                    <li key={c} className="flex items-center gap-2 text-xs text-slate-600">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#d4a017] shrink-0" />{c}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Languages */}
            {profile.languages?.length > 0 && (
              <div className="bg-white rounded-2xl p-5 border border-slate-100">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Languages</p>
                <div className="flex flex-wrap gap-2">
                  {profile.languages.map(l => (
                    <span key={l} className="text-xs font-semibold bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg">{l}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Social links */}
            {(profile.website || profile.linkedIn || profile.twitter || profile.facebook) && (
              <div className="bg-white rounded-2xl p-5 border border-slate-100">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Links</p>
                <div className="space-y-2">
                  {profile.website && <a href={profile.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-[#0a1628] font-medium hover:text-[#d4a017] transition-colors"><Globe className="w-4 h-4 text-slate-400" />Website</a>}
                  {profile.linkedIn && <a href={profile.linkedIn} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-[#0a1628] font-medium hover:text-[#d4a017] transition-colors"><ExternalLink className="w-4 h-4 text-slate-400" />LinkedIn</a>}
                  {profile.twitter && <a href={profile.twitter} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-[#0a1628] font-medium hover:text-[#d4a017] transition-colors"><ExternalLink className="w-4 h-4 text-slate-400" />Twitter</a>}
                  {profile.facebook && <a href={profile.facebook} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-[#0a1628] font-medium hover:text-[#d4a017] transition-colors"><ExternalLink className="w-4 h-4 text-slate-400" />Facebook</a>}
                </div>
              </div>
            )}
          </div>

          {/* Right main content */}
          <div className="sm:col-span-2 space-y-6">

            {/* Voice Memo */}
            {profile.voiceMemoUrl && (
              <VoiceMemoPlayer url={profile.voiceMemoUrl} name={profile.name} />
            )}

            {/* Courses */}
            {profile.instructorCourses?.length > 0 && (
              <div>
                <h2 className="font-black text-[#0a1628] text-base mb-3">Courses</h2>
                <div className="grid grid-cols-2 gap-3">
                  {profile.instructorCourses.map(c => (
                    <Link key={c.id} href={`/courses/${c.slug}`}
                      className="bg-white rounded-xl border border-slate-100 overflow-hidden hover:border-slate-200 hover:shadow-md transition-all">
                      {c.thumbnail
                        ? <img src={c.thumbnail} alt={c.title} className="w-full h-28 object-cover" />
                        : <div className="w-full h-28 bg-gradient-to-br from-[#0a1628] to-[#1a3a6b]" />}
                      <div className="p-3">
                        <p className="font-bold text-xs text-[#0a1628] line-clamp-2 mb-1">{c.title}</p>
                        <p className="text-xs text-[#d4a017] font-bold">{c.isFree ? "Free" : `$${c.price}`}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Marketplace listings */}
            {profile.listings?.length > 0 && (
              <div>
                <h2 className="font-black text-[#0a1628] text-base mb-3">Services</h2>
                <div className="space-y-3">
                  {profile.listings.map(l => (
                    <Link key={l.id} href={l.slug ? `/marketplace/${l.slug}` : `/marketplace`}
                      className="flex gap-3 bg-white rounded-xl border border-slate-100 p-3 hover:border-slate-200 hover:shadow-md transition-all">
                      {l.images?.[0]
                        ? <img src={l.images[0]} alt={l.title} className="w-16 h-16 rounded-lg object-cover shrink-0" />
                        : <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-[#0a1628] to-[#1a3a6b] shrink-0" />}
                      <div className="min-w-0">
                        <p className="font-bold text-sm text-[#0a1628] line-clamp-1">{l.title}</p>
                        <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">{l.description}</p>
                        {l.price != null && <p className="text-xs font-bold text-[#d4a017] mt-1">${l.price}</p>}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Media photos */}
            {profile.mediaPhotos?.length > 0 && (
              <div>
                <h2 className="font-black text-[#0a1628] text-base mb-3">Photos</h2>
                <div className="grid grid-cols-3 gap-2">
                  {profile.mediaPhotos.map((p, i) => (
                    <img key={i} src={p} alt={`Photo ${i + 1}`} className="w-full aspect-square object-cover rounded-xl" />
                  ))}
                </div>
              </div>
            )}

            {/* Empty state */}
            {!profile.bio && !profile.mission && profile.specialties.length === 0 &&
              profile.instructorCourses.length === 0 && profile.listings.length === 0 && (
              <div className="bg-white rounded-2xl p-10 text-center border border-slate-100">
                <p className="text-slate-400 text-sm">This member hasn't filled out their profile yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
