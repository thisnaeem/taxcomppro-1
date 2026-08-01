"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Loader2, Phone, Mail, Globe, Calendar, MapPin, Share2, Download, ExternalLink,
  ArrowRight, UserPlus,
} from "lucide-react";
import { Linkedin02Icon, NewTwitterIcon, Facebook01Icon } from "hugeicons-react";
import { useSession } from "@/lib/auth-client";
import { CARD_THEMES, qrCodeUrl, cardPublicUrl } from "@/lib/connectCard";

interface Service { id: string; title: string; description: string | null; price: string | null; emoji: string; }
interface CardLink { id: string; label: string; url: string; icon: string | null; color: string | null; }
interface CardData {
  username: string; isOwner: boolean; proId: string; name: string; image: string | null;
  professionalTitle: string | null; businessName: string | null; businessDescription: string | null;
  logoUrl: string | null; theme: string; accentColor: string; role: string;
  phone: string | null; email: string | null; website: string | null; bookingUrl: string | null;
  businessAddress: string | null; social: { linkedIn: string | null; twitter: string | null; facebook: string | null } | null;
  services: Service[]; links: CardLink[];
}

function GatePrompt({ username, onClose }: { username: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-sm w-full p-6 text-center" onClick={e => e.stopPropagation()}>
        <div className="w-12 h-12 rounded-2xl bg-[#0a1628] flex items-center justify-center mx-auto mb-4">
          <UserPlus className="w-6 h-6 text-white" />
        </div>
        <h2 className="text-lg font-black text-[#0a1628] mb-1.5">Join Tax Compliance Pro — Free</h2>
        <p className="text-sm text-slate-500 mb-6 leading-relaxed">
          Create a free profile to view complete professional profiles, connect with members, save
          professionals, and access the Tax Compliance Pro community.
        </p>
        <div className="space-y-2">
          <Link href={`/register?next=/pro/${username}`}
            className="block w-full bg-gradient-to-r from-[#f0c040] to-[#d4a017] text-[#0a1628] font-bold text-sm py-3 rounded-full hover:shadow-lg transition-all">
            Create Free Profile
          </Link>
          <Link href={`/login?next=/pro/${username}`}
            className="block w-full border-2 border-[#0a1628] text-[#0a1628] font-bold text-sm py-3 rounded-full hover:bg-[#0a1628] hover:text-white transition-all">
            Log In
          </Link>
          <button onClick={onClose} className="w-full text-slate-400 font-semibold text-xs py-2 hover:text-slate-600">
            Not Now
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TapCardPage() {
  const { username } = useParams<{ username: string }>();
  const router = useRouter();
  const { data: session } = useSession();
  const [card, setCard] = useState<CardData | null | undefined>(undefined);
  const [showGate, setShowGate] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const src = new URLSearchParams(window.location.search).get("src");
    const qs = src ? `?src=${src}` : "";
    fetch(`/api/connect/${username}${qs}`)
      .then(r => r.ok ? r.json() as Promise<CardData> : Promise.reject())
      .then(setCard)
      .catch(() => setCard(null));
  }, [username]);

  const track = useCallback((type: string, linkId?: string) => {
    fetch(`/api/connect/${username}/event`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, linkId }),
    }).catch(() => {});
  }, [username]);

  if (card === undefined) {
    return <div className="min-h-screen flex items-center justify-center bg-[#f4f6fb]"><Loader2 className="w-8 h-8 animate-spin text-[#0a1628]" /></div>;
  }
  if (card === null) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f4f6fb] px-4 text-center">
        <p className="text-lg font-black text-[#0a1628] mb-2">Card not found</p>
        <p className="text-sm text-slate-500 mb-6">This Connect Card doesn&apos;t exist or hasn&apos;t been activated yet.</p>
        <Link href="/connect" className="bg-[#0a1628] text-white font-bold text-sm px-6 py-3 rounded-full">Activate Your Own Card</Link>
      </div>
    );
  }

  const theme = CARD_THEMES.find(t => t.value === card.theme) ?? CARD_THEMES[0];
  const publicUrl = cardPublicUrl(card.username);

  const handleViewFullProfile = () => {
    track("FULL_PROFILE_CLICK");
    if (session) router.push(`/pro/${card.username}`);
    else setShowGate(true);
  };

  const handleShare = async () => {
    track("SHARE");
    if (navigator.share) {
      try { await navigator.share({ title: card.name, url: publicUrl }); return; } catch { /* cancelled */ }
    }
    await navigator.clipboard.writeText(publicUrl);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveContact = () => {
    track("CONTACT_SAVE");
    window.location.href = `/api/connect/${card.username}/vcard`;
  };

  const ActionBtn = ({ href, icon: Icon, label }: { href: string; icon: React.ElementType; label: string }) => (
    <a href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer"
      className="flex flex-col items-center gap-1.5 flex-1 py-3 rounded-2xl bg-white/10 hover:bg-white/20 transition-all backdrop-blur-sm">
      <Icon className="w-5 h-5" /><span className="text-[10px] font-bold uppercase tracking-wide">{label}</span>
    </a>
  );

  return (
    <div className="min-h-screen" style={{ background: theme.bg }}>
      {showGate && <GatePrompt username={card.username} onClose={() => setShowGate(false)} />}

      <div className="max-w-md mx-auto px-5 py-10" style={{ color: theme.text }}>
        {card.isOwner && (
          <Link href="/profile" className="block text-center text-[10px] font-bold uppercase tracking-widest opacity-60 hover:opacity-100 mb-4">
            ✎ This is your card — edit it
          </Link>
        )}

        {/* Identity */}
        <div className="text-center mb-6">
          {card.logoUrl && (
            <img src={card.logoUrl} alt="" className="w-14 h-14 object-contain mx-auto mb-3 rounded-xl bg-white/90 p-1.5" />
          )}
          <div className="w-24 h-24 rounded-full mx-auto mb-4 overflow-hidden border-4 border-white/20 shadow-xl bg-white/10 flex items-center justify-center">
            {card.image ? <img src={card.image} alt={card.name} className="w-full h-full object-cover" /> : <span className="text-3xl font-black">{card.name[0]}</span>}
          </div>
          <h1 className="text-2xl font-black">{card.name}</h1>
          {card.professionalTitle && <p className="text-sm opacity-80 mt-0.5">{card.professionalTitle}</p>}
          {card.businessName && <p className="text-sm font-bold opacity-90 mt-1">{card.businessName}</p>}
          {card.businessDescription && <p className="text-xs opacity-70 mt-2 leading-relaxed">{card.businessDescription}</p>}
        </div>

        {/* Quick actions */}
        <div className="flex gap-2 mb-4">
          {card.phone && <ActionBtn href={`tel:${card.phone}`} icon={Phone} label="Call" />}
          {card.email && <ActionBtn href={`mailto:${card.email}`} icon={Mail} label="Email" />}
          {card.website && <ActionBtn href={card.website} icon={Globe} label="Website" />}
          {card.bookingUrl && <ActionBtn href={card.bookingUrl} icon={Calendar} label="Book" />}
        </div>

        {card.businessAddress && (
          <div className="flex items-center gap-2 justify-center text-xs opacity-70 mb-6">
            <MapPin className="w-3.5 h-3.5 shrink-0" />{card.businessAddress}
          </div>
        )}

        {/* Save / Share */}
        <div className="flex gap-2 mb-6">
          <button onClick={handleSaveContact} className="flex-1 flex items-center justify-center gap-1.5 bg-white text-[#0a1628] font-bold text-xs py-3 rounded-full hover:opacity-90 transition-all">
            <Download className="w-3.5 h-3.5" />Save Contact
          </button>
          <button onClick={handleShare} className="flex-1 flex items-center justify-center gap-1.5 border-2 border-white/40 font-bold text-xs py-3 rounded-full hover:bg-white/10 transition-all">
            <Share2 className="w-3.5 h-3.5" />{copied ? "Copied!" : "Share My Card"}
          </button>
        </div>

        {/* Services */}
        {card.services.length > 0 && (
          <div className="mb-6">
            <p className="text-[10px] font-black uppercase tracking-widest opacity-50 mb-2 text-center">Services</p>
            <div className="flex flex-wrap gap-1.5 justify-center">
              {card.services.map(s => (
                <span key={s.id} className="text-xs font-semibold bg-white/10 px-3 py-1.5 rounded-full">{s.emoji} {s.title}</span>
              ))}
            </div>
          </div>
        )}

        {/* Custom links */}
        {card.links.length > 0 && (
          <div className="space-y-2 mb-6">
            {card.links.map(l => (
              <a key={l.id} href={l.url} target="_blank" rel="noopener noreferrer" onClick={() => track("LINK_CLICK", l.id)}
                className="flex items-center justify-between gap-2 w-full px-5 py-3.5 rounded-2xl font-bold text-sm transition-all hover:opacity-90"
                style={{ background: l.color || "rgba(255,255,255,0.12)" }}>
                <span>{l.label}</span><ExternalLink className="w-3.5 h-3.5 opacity-60" />
              </a>
            ))}
          </div>
        )}

        {/* Social */}
        {card.social && (card.social.linkedIn || card.social.twitter || card.social.facebook) && (
          <div className="flex justify-center gap-4 mb-6">
            {card.social.linkedIn && <a href={card.social.linkedIn} target="_blank" rel="noopener noreferrer"><Linkedin02Icon className="w-5 h-5 opacity-70 hover:opacity-100" /></a>}
            {card.social.twitter && <a href={card.social.twitter} target="_blank" rel="noopener noreferrer"><NewTwitterIcon className="w-5 h-5 opacity-70 hover:opacity-100" /></a>}
            {card.social.facebook && <a href={card.social.facebook} target="_blank" rel="noopener noreferrer"><Facebook01Icon className="w-5 h-5 opacity-70 hover:opacity-100" /></a>}
          </div>
        )}

        {/* View Full Profile */}
        <button onClick={handleViewFullProfile}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#f0c040] to-[#d4a017] text-[#0a1628] font-bold text-sm py-3.5 rounded-full hover:shadow-lg transition-all mb-4">
          View Full Tax Compliance Pro Profile <ArrowRight className="w-4 h-4" />
        </button>

        {/* QR code */}
        <div className="bg-white/10 rounded-2xl p-4 flex flex-col items-center mb-6">
          <img src={qrCodeUrl(`${publicUrl}?src=qr`, 160)} alt="QR code" className="w-28 h-28 rounded-lg bg-white p-1.5" />
          <p className="text-[10px] opacity-60 mt-2">Scan to open this card</p>
        </div>

        {/* Create your own */}
        <Link href="/connect" className="block text-center text-xs font-bold opacity-70 hover:opacity-100 underline underline-offset-4">
          Create Your Free Connect Card
        </Link>
      </div>
    </div>
  );
}
