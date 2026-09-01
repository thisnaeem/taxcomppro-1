"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import NetworkBadge from "@/components/networks/NetworkBadge";
import {
  Home,
  MessageSquare,
  Images,
  FolderDown,
  Radio,
  Calendar,
  Users,
  MessagesSquare,
  Settings,
  BarChart2,
  Shield,
  Mail,
  Headphones,
  Bell,
  MoreHorizontal,
  Search,
  Plus,
  Play,
  FileText,
  Download,
  CheckCircle2,
  Lock,
  ChevronRight,
  ChevronLeft,
  Crown,
  Share2,
  X,
  Send,
  Loader2,
  ArrowRight,
  Sparkles,
  ExternalLink,
  MessageCircle,
  Phone,
  HelpCircle,
  Eye,
  DollarSign,
  TrendingUp,
  UserPlus,
  Upload,
  Video,
  File,
  Image as ImageIcon,
  Mic,
  AlertCircle,
} from "lucide-react";

interface ProNetworkDetails {
  id: string;
  name: string;
  slug: string;
  tagline: string | null;
  description: string;
  category: string;
  coverImage: string | null;
  logoImage: string | null;
  monthlyPrice: number;
  memberCount: number;
  followerCount: number;
  memberBenefits: string[];
  rules: string | null;
  welcomeMessage: string | null;
  badgeShape: string;
  badgeInitials: string | null;
  badgeText: string;
  badgeIcon: string;
  badgeBgColor: string;
  badgeTextColor: string;
  badgeBorderColor: string;
  badgeCustomImage: string | null;
  allowDirectMessage: boolean;
  allowDirectText: boolean;
  directTextPhone: string | null;
  allowQuestions: boolean;
  allowConsultations: boolean;
  consultationUrl: string | null;
  isOwner: boolean;
  isMember: boolean;
  membershipRole: string | null;
  isFollowing: boolean;
  owner: {
    id: string;
    name: string;
    email: string;
    image: string | null;
    role: string;
    tier: string;
    headline: string | null;
    bio: string | null;
    location: string | null;
    specialties: string[];
    certifications: string[];
    digitalCard?: { username: string } | null;
  };
  _count: {
    members: number;
    followers: number;
    discussions: number;
    media: number;
    resources: number;
    events: number;
  };
}

interface StripeStatus {
  connected: boolean;
  onboarded: boolean;
  accountId: string | null;
  accountDetails: {
    id: string;
    email: string | null;
    country: string | null;
    chargesEnabled: boolean;
    payoutsEnabled: boolean;
    onboarded: boolean;
  } | null;
}

export default function ProNetworkHubPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const router = useRouter();
  const { data: session } = useSession();

  const [network, setNetwork] = useState<ProNetworkDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "home" | "discussions" | "media" | "resources" | "protalks" | "events" | "members" | "chat" | "manage"
  >("home");

  // Host Stripe Connect State
  const [stripeStatus, setStripeStatus] = useState<StripeStatus | null>(null);
  const [connectingStripe, setConnectingStripe] = useState(false);
  const [disconnectingStripe, setDisconnectingStripe] = useState(false);

  // Dynamic Data States (100% from Database)
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [discussions, setDiscussions] = useState<any[]>([]);
  const [mediaList, setMediaList] = useState<any[]>([]);
  const [resourcesList, setResourcesList] = useState<any[]>([]);
  const [eventsList, setEventsList] = useState<any[]>([]);
  const [membersList, setMembersList] = useState<any[]>([]);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatChannel, setChatChannel] = useState("general");
  const [newChatMessage, setNewChatMessage] = useState("");

  // Modals
  const [showNewDiscussionModal, setShowNewDiscussionModal] = useState(false);
  const [newDiscussionTitle, setNewDiscussionTitle] = useState("");
  const [newDiscussionContent, setNewDiscussionContent] = useState("");
  const [newDiscussionCategory, setNewDiscussionCategory] = useState("General");
  const [submittingDiscussion, setSubmittingDiscussion] = useState(false);

  const [showUploadMediaModal, setShowUploadMediaModal] = useState(false);
  const [mediaTitle, setMediaTitle] = useState("");
  const [mediaType, setMediaType] = useState<"PHOTO" | "VIDEO" | "FILE" | "AUDIO">("VIDEO");
  const [mediaDuration, setMediaDuration] = useState("");
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaThumbnailFile, setMediaThumbnailFile] = useState<File | null>(null);
  const [uploadingMedia, setUploadingMedia] = useState(false);

  const [showUploadResourceModal, setShowUploadResourceModal] = useState(false);
  const [resourceTitle, setResourceTitle] = useState("");
  const [resourceDesc, setResourceDesc] = useState("");
  const [resourceFileType, setResourceFileType] = useState("PDF");
  const [resourceFile, setResourceFile] = useState<File | null>(null);
  const [uploadingResource, setUploadingResource] = useState(false);

  const [showHostProTalkModal, setShowHostProTalkModal] = useState(false);
  const [proTalkTitle, setProTalkTitle] = useState("");
  const [proTalkDesc, setProTalkDesc] = useState("");
  const [proTalkScheduleDate, setProTalkScheduleDate] = useState("");
  const [isGoLiveImmediate, setIsGoLiveImmediate] = useState(true);
  const [creatingProTalk, setCreatingProTalk] = useState(false);

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const [selectedMediaItem, setSelectedMediaItem] = useState<any | null>(null);
  const [selectedDiscussion, setSelectedDiscussion] = useState<any | null>(null);
  const [discussionReplies, setDiscussionReplies] = useState<any[]>([]);
  const [newReplyContent, setNewReplyContent] = useState("");

  const [joining, setJoining] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchStripeStatus = async () => {
    try {
      const res = await fetch("/api/seller/stripe-connect");
      if (res.ok) {
        const data = await res.json();
        setStripeStatus(data);
      }
    } catch (err) {
      console.error("Failed to load Stripe status:", err);
    }
  };

  const handleConnectStripe = async () => {
    setConnectingStripe(true);
    try {
      const res = await fetch("/api/seller/stripe-connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ returnUrl: `/pro-networks/${slug}?tab=manage` }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert("Failed to start Stripe onboarding.");
      }
    } catch {
      alert("Network error. Please try again.");
    } finally {
      setConnectingStripe(false);
    }
  };

  const handleDisconnectStripe = async () => {
    if (!confirm("Disconnect your Stripe account? Member subscription payments won't be transferred directly to you.")) return;
    setDisconnectingStripe(true);
    try {
      await fetch("/api/seller/stripe-connect", { method: "DELETE" });
      setStripeStatus({ connected: false, onboarded: false, accountId: null, accountDetails: null });
    } finally {
      setDisconnectingStripe(false);
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("tab") === "manage") {
        setActiveTab("manage");
      }
      if (params.get("stripe") === "success" || params.get("stripe") === "refresh") {
        setActiveTab("manage");
        fetchStripeStatus();
      }
    }
  }, []);

  useEffect(() => {
    fetchNetworkDetails();
  }, [slug]);

  const fetchNetworkDetails = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/pro-networks/${slug}`);
      if (res.ok) {
        const data = await res.json();
        setNetwork(data.network);
        if (data.network?.isOwner) {
          fetchStripeStatus();
        }
        fetchAllTabData();
      } else {
        router.push("/pro-networks");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllTabData = async () => {
    try {
      const [annRes, discRes, mediaRes, resRes, eventRes, memRes] = await Promise.all([
        fetch(`/api/pro-networks/${slug}/announcements`),
        fetch(`/api/pro-networks/${slug}/discussions`),
        fetch(`/api/pro-networks/${slug}/media`),
        fetch(`/api/pro-networks/${slug}/resources`),
        fetch(`/api/pro-networks/${slug}/events`),
        fetch(`/api/pro-networks/${slug}/members`),
      ]);

      if (annRes.ok) setAnnouncements((await annRes.json()).announcements || []);
      if (discRes.ok) setDiscussions((await discRes.json()).discussions || []);
      if (mediaRes.ok) setMediaList((await mediaRes.json()).media || []);
      if (resRes.ok) setResourcesList((await resRes.json()).resources || []);
      if (eventRes.ok) setEventsList((await eventRes.json()).events || []);
      if (memRes.ok) setMembersList((await memRes.json()).members || []);
    } catch (err) {
      console.error("Error loading tab data:", err);
    }
  };

  useEffect(() => {
    if (activeTab === "chat" && network?.isMember) {
      fetchChatMessages();
    }
  }, [activeTab, chatChannel, network?.isMember]);

  const fetchChatMessages = async () => {
    try {
      const res = await fetch(`/api/pro-networks/${slug}/chat?channel=${chatChannel}`);
      if (res.ok) {
        const data = await res.json();
        setChatMessages(data.messages || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChatMessage.trim()) return;

    try {
      const res = await fetch(`/api/pro-networks/${slug}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel: chatChannel,
          content: newChatMessage.trim(),
        }),
      });
      if (res.ok) {
        setNewChatMessage("");
        fetchChatMessages();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleJoinNetwork = async () => {
    if (!session?.user) {
      router.push(`/login?next=/pro-networks/${slug}`);
      return;
    }

    setJoining(true);
    try {
      const res = await fetch(`/api/pro-networks/${slug}/checkout`, {
        method: "POST",
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else if (data.redirectUrl) {
        fetchNetworkDetails();
      } else if (data.error) {
        alert(data.error);
      }
    } catch (err) {
      alert("Failed to join network.");
    } finally {
      setJoining(false);
    }
  };

  const renderPaywall = (title?: string, desc?: string) => (
    <div className="bg-gradient-to-b from-[#0a1628] via-[#0f1d33] to-[#0a1628] border border-amber-400/30 rounded-3xl p-6 sm:p-10 shadow-2xl text-white space-y-8 relative overflow-hidden">
      <div className="absolute -right-16 -top-16 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -left-16 -bottom-16 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3 relative z-10">
        <div className="inline-flex items-center gap-2 bg-amber-400/15 border border-amber-400/30 text-amber-300 text-xs font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-md">
          <Lock className="w-3.5 h-3.5 text-amber-400" />
          <span>Members-Only Access Required</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight">
          Join <span className="text-amber-400">{network?.name}</span> to Unlock {title || "Full Access"}
        </h2>
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
          {desc || network?.tagline || network?.description || "Join fellow tax practitioners and gain direct access to private feeds, document vaults, live Pro Talks, and exclusive templates."}
        </p>
      </div>

      {/* Pricing and Host Direct Payout Guarantee */}
      <div className="max-w-xl mx-auto bg-white/5 border border-white/10 rounded-2xl p-5 text-center space-y-2 relative z-10 backdrop-blur-md">
        <div className="flex items-baseline justify-center gap-1.5">
          <span className="text-3xl sm:text-4xl font-black text-amber-400">
            ${network?.monthlyPrice.toFixed(2)}
          </span>
          <span className="text-xs font-bold text-slate-300">/ month</span>
        </div>
        <div className="flex items-center justify-center gap-2 text-xs font-semibold text-emerald-400">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>0% Platform Commission — 100% of your membership goes directly to host <strong>{network?.owner.name}</strong></span>
        </div>
      </div>

      {/* Unlocked Member Benefits Grid */}
      <div className="max-w-2xl mx-auto space-y-3 relative z-10">
        <h4 className="text-xs font-black uppercase tracking-wider text-slate-300 text-center">
          Everything Included In Your Membership:
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {((network?.memberBenefits && network.memberBenefits.length > 0) ? network.memberBenefits : [
            "Private Network Discussion Board & Audit Q&A",
            "Members-Only Resource & Workpaper Vault",
            "Exclusive Live Pro Talks & Strategy Workshops",
            "Direct Messaging & Consultation Access to Host",
            "Private Member Directory & Network Chat",
            "Custom Verified Pro Network Member Badge",
          ]).map((b, idx) => (
            <div key={idx} className="flex items-center gap-2.5 p-3 rounded-xl bg-white/5 border border-white/5 text-xs font-bold text-slate-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="truncate">{b}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Member Badge Preview */}
      {network && (
        <div className="max-w-md mx-auto bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between gap-4 relative z-10">
          <div className="space-y-0.5">
            <div className="text-xs font-bold text-white">Your Custom Member Badge</div>
            <div className="text-[11px] text-slate-400">Displayed across Tax Compliance Pro</div>
          </div>
          <NetworkBadge
            shape={network.badgeShape}
            initials={network.badgeInitials || "PRO"}
            text={network.badgeText || "MEMBER"}
            icon={network.badgeIcon || "Star"}
            bgColor={network.badgeBgColor || "#0a1628"}
            textColor={network.badgeTextColor || "#f0c040"}
            borderColor={network.badgeBorderColor || "#d4a017"}
            customImage={network.badgeCustomImage}
          />
        </div>
      )}

      {/* Big Checkout CTA Button */}
      <div className="text-center relative z-10">
        <button
          type="button"
          disabled={joining}
          onClick={handleJoinNetwork}
          className="bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-[#0a1628] font-black text-sm sm:text-base px-10 py-4 rounded-full transition-all shadow-2xl hover:scale-105 active:scale-95 disabled:opacity-50 inline-flex items-center gap-2.5"
        >
          {joining ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Connecting to Checkout...</span>
            </>
          ) : (
            <>
              <Crown className="w-5 h-5" />
              <span>Join Now &amp; Unlock Access — ${network?.monthlyPrice.toFixed(2)}/mo</span>
            </>
          )}
        </button>
        <p className="text-[11px] text-slate-400 mt-2">
          Secure Stripe checkout • Cancel anytime • Instant access
        </p>
      </div>
    </div>
  );

  const handleToggleFollow = async () => {
    if (!session?.user) {
      router.push(`/login?next=/pro-networks/${slug}`);
      return;
    }
    try {
      const res = await fetch(`/api/pro-networks/${slug}/follow`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setNetwork((prev) =>
          prev
            ? {
                ...prev,
                isFollowing: data.following,
                followerCount: data.following ? prev.followerCount + 1 : Math.max(0, prev.followerCount - 1),
              }
            : null
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleEventRsvp = async (eventId: string) => {
    if (!network?.isMember) return;
    try {
      const res = await fetch(`/api/pro-networks/${slug}/events/${eventId}/rsvp`, {
        method: "POST",
      });
      if (res.ok) {
        const data = await res.json();
        setEventsList((prev) =>
          prev.map((e) =>
            e.id === eventId
              ? {
                  ...e,
                  isRegistered: data.registered,
                  rsvpCount: data.registered ? e.rsvpCount + 1 : Math.max(0, e.rsvpCount - 1),
                }
              : e
          )
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateDiscussion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDiscussionTitle.trim() || !newDiscussionContent.trim()) return;

    setSubmittingDiscussion(true);
    try {
      const res = await fetch(`/api/pro-networks/${slug}/discussions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newDiscussionTitle.trim(),
          content: newDiscussionContent.trim(),
          category: newDiscussionCategory,
        }),
      });
      if (res.ok) {
        setShowNewDiscussionModal(false);
        setNewDiscussionTitle("");
        setNewDiscussionContent("");
        const discRes = await fetch(`/api/pro-networks/${slug}/discussions`);
        if (discRes.ok) setDiscussions((await discRes.json()).discussions || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingDiscussion(false);
    }
  };

  // Cloudinary Upload for Media (Video / Photo)
  const handleUploadMedia = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mediaFile || !mediaTitle.trim()) {
      alert("Please provide a title and select a file.");
      return;
    }

    setUploadingMedia(true);
    try {
      // 1. Upload file to Cloudinary
      const fd = new FormData();
      fd.append("file", mediaFile);
      fd.append("folder", "taxcomppro/networks/media");

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: fd,
      });

      if (!uploadRes.ok) throw new Error("File upload failed");
      const uploadData = await uploadRes.json();
      const fileUrl = uploadData.url;

      let thumbUrl = null;
      if (mediaThumbnailFile) {
        const thumbFd = new FormData();
        thumbFd.append("file", mediaThumbnailFile);
        thumbFd.append("folder", "taxcomppro/networks/media");
        const thumbRes = await fetch("/api/upload", { method: "POST", body: thumbFd });
        if (thumbRes.ok) {
          const thumbData = await thumbRes.json();
          thumbUrl = thumbData.url;
        }
      }

      // 2. Save record in database
      const res = await fetch(`/api/pro-networks/${slug}/media`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: mediaTitle.trim(),
          type: mediaType,
          url: fileUrl,
          thumbnailUrl: thumbUrl,
          duration: mediaDuration.trim() || null,
          isMembersOnly: true,
        }),
      });

      if (res.ok) {
        setShowUploadMediaModal(false);
        setMediaTitle("");
        setMediaDuration("");
        setMediaFile(null);
        setMediaThumbnailFile(null);
        const refreshRes = await fetch(`/api/pro-networks/${slug}/media`);
        if (refreshRes.ok) setMediaList((await refreshRes.json()).media || []);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to upload media item.");
    } finally {
      setUploadingMedia(false);
    }
  };

  // Cloudinary Upload for Resource Files (PDF, DOCX, XLSX, Templates)
  const handleUploadResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resourceFile || !resourceTitle.trim()) {
      alert("Please provide a title and select a document file.");
      return;
    }

    setUploadingResource(true);
    try {
      // 1. Upload to Cloudinary
      const fd = new FormData();
      fd.append("file", resourceFile);
      fd.append("folder", "taxcomppro/networks/resources");

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: fd,
      });

      if (!uploadRes.ok) throw new Error("Document upload failed");
      const uploadData = await uploadRes.json();
      const fileUrl = uploadData.url;

      const sizeFormatted = resourceFile.size > 1024 * 1024
        ? `${(resourceFile.size / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.round(resourceFile.size / 1024)} KB`;

      // 2. Save record in database
      const res = await fetch(`/api/pro-networks/${slug}/resources`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: resourceTitle.trim(),
          description: resourceDesc.trim() || null,
          fileType: resourceFileType,
          fileUrl,
          fileSize: sizeFormatted,
          isMembersOnly: true,
        }),
      });

      if (res.ok) {
        setShowUploadResourceModal(false);
        setResourceTitle("");
        setResourceDesc("");
        setResourceFile(null);
        const refreshRes = await fetch(`/api/pro-networks/${slug}/resources`);
        if (refreshRes.ok) setResourcesList((await refreshRes.json()).resources || []);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to upload resource file.");
    } finally {
      setUploadingResource(false);
    }
  };

  // Host Pro Talk / Schedule Event Integration with TCP Spaces
  const handleHostProTalk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proTalkTitle.trim()) {
      alert("Please provide a title for the Pro Talk.");
      return;
    }

    setCreatingProTalk(true);
    try {
      if (isGoLiveImmediate) {
        // Create Live Pro Talk Space on TCP
        const res = await fetch("/api/spaces", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: `${proTalkTitle.trim()} — ${network?.name}`,
            description: proTalkDesc.trim() || network?.tagline || "",
          }),
        });

        if (res.ok) {
          const space = await res.json();
          router.push(`/pro-talks/${space.id}`);
          return;
        } else {
          const err = await res.json();
          alert(err.error || "Failed to start live Pro Talk.");
        }
      } else {
        // Schedule Upcoming Event
        const res = await fetch(`/api/pro-networks/${slug}/events`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: proTalkTitle.trim(),
            description: proTalkDesc.trim() || null,
            eventType: "PRO_TALK",
            scheduledAt: proTalkScheduleDate || new Date(Date.now() + 86400000).toISOString(),
            isLive: false,
            isMembersOnly: true,
          }),
        });

        if (res.ok) {
          setShowHostProTalkModal(false);
          setProTalkTitle("");
          setProTalkDesc("");
          setProTalkScheduleDate("");
          const refreshRes = await fetch(`/api/pro-networks/${slug}/events`);
          if (refreshRes.ok) setEventsList((await refreshRes.json()).events || []);
        }
      }
    } catch (err) {
      console.error(err);
      alert("Failed to create Pro Talk.");
    } finally {
      setCreatingProTalk(false);
    }
  };

  const openDiscussionThread = async (disc: any) => {
    setSelectedDiscussion(disc);
    try {
      const res = await fetch(`/api/pro-networks/${slug}/discussions/${disc.id}/replies`);
      if (res.ok) {
        const data = await res.json();
        setDiscussionReplies(data.replies || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handlePostReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReplyContent.trim() || !selectedDiscussion) return;

    try {
      const res = await fetch(
        `/api/pro-networks/${slug}/discussions/${selectedDiscussion.id}/replies`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: newReplyContent.trim() }),
        }
      );
      if (res.ok) {
        setNewReplyContent("");
        const repliesRes = await fetch(
          `/api/pro-networks/${slug}/discussions/${selectedDiscussion.id}/replies`
        );
        if (repliesRes.ok) {
          setDiscussionReplies((await repliesRes.json()).replies || []);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCopyInviteLink = () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  if (loading || !network) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a1628] text-white">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
          <p className="text-sm font-bold text-slate-300">Entering Pro Network...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f0f4f9] dark:bg-[#0a1424] text-slate-900 dark:text-slate-100 flex flex-col font-sans">
      {/* ── TOP NETWORK BRAND HEADER (Dynamic — Clean Background, No Watermark/Dummy Text) ── */}
      <header className="bg-[#0a1628] border-b border-white/10 text-white sticky top-0 z-40 shadow-xl">
        <div className="max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4">
          {/* Left: Owner Profile Chip */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="relative">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 overflow-hidden ring-2 ring-amber-400/40 shrink-0">
                {network.owner.image ? (
                  <img
                    src={network.owner.image}
                    alt={network.owner.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center font-black text-sm text-[#0a1628]">
                    {network.owner.name[0]}
                  </div>
                )}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-[#0a1628]" />
            </div>

            <div className="min-w-0 hidden sm:block">
              <div className="flex items-center gap-2">
                <span className="font-black text-sm text-white tracking-tight truncate">
                  {network.owner.name}
                </span>
                <span className="bg-blue-600/80 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-full tracking-wider">
                  VERIFIED PRO
                </span>
              </div>
              <p className="text-[11px] font-bold text-slate-400">Network Owner</p>
            </div>
          </div>

          {/* Center Brand Identity */}
          <div className="flex-1 flex flex-col items-center justify-center text-center px-2">
            <div className="flex items-center gap-2">
              {network.logoImage && (
                <img src={network.logoImage} alt={network.name} className="h-8 w-auto object-contain" />
              )}
              <h1 className="text-base sm:text-xl font-black text-white flex items-center gap-1.5 truncate">
                <span>{network.name}</span>
                <Crown className="w-4 h-4 text-amber-400 shrink-0" />
              </h1>
            </div>

            <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-300 mt-0.5">
              <span className="flex items-center gap-1 text-slate-300">
                <Lock className="w-3 h-3 text-amber-400" /> Private Network
              </span>
              <span>•</span>
              <span className="font-bold text-amber-300">
                {network.memberCount.toLocaleString()} Members
              </span>
              {network.tagline && (
                <>
                  <span className="hidden md:inline">•</span>
                  <span className="hidden md:inline text-slate-400 italic truncate max-w-xs">
                    {network.tagline}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2.5 shrink-0">
            {!network.isMember && (
              <button
                type="button"
                disabled={joining}
                onClick={handleJoinNetwork}
                className="bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-[#0a1628] font-black text-xs px-4 py-2 rounded-full transition-all shadow-lg hover:scale-105 active:scale-95 flex items-center gap-1.5"
              >
                <Crown className="w-3.5 h-3.5" />
                <span>Join ${network.monthlyPrice.toFixed(2)}/mo</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowInviteModal(true)}
              className="bg-blue-600 hover:bg-blue-500 text-white font-black text-xs px-4 py-2 rounded-full transition-all shadow-md flex items-center gap-1.5"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Invite Members</span>
            </button>

            <button
              type="button"
              onClick={handleToggleFollow}
              className={`p-2 rounded-full border transition-all ${
                network.isFollowing
                  ? "bg-amber-400/20 border-amber-400 text-amber-300"
                  : "border-white/15 hover:bg-white/10 text-white/70"
              }`}
              title={network.isFollowing ? "Following" : "Follow"}
            >
              <Bell className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* ── MAIN LAYOUT: Sidebar + Tabs + 100% Dynamic Content ── */}
      <div className="max-w-[1720px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 flex-1 flex gap-6">
        {/* Left Internal Network Navigation Sidebar */}
        <aside className="w-64 shrink-0 hidden lg:flex flex-col gap-6">
          <div className="bg-white dark:bg-[#121e33] border border-slate-200 dark:border-white/10 rounded-3xl p-4 shadow-sm space-y-6">
            {/* MY NETWORK Section */}
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 px-3 mb-2">
                MY NETWORK
              </p>
              <div className="space-y-1">
                {[
                  { id: "home", label: "Network Home", icon: Home },
                  { id: "discussions", label: "Discussions", icon: MessageSquare },
                  { id: "media", label: "Media Gallery", icon: Images },
                  { id: "resources", label: "Resources", icon: FolderDown },
                  { id: "protalks", label: "Pro Talks", icon: Radio },
                  { id: "events", label: "Events", icon: Calendar },
                  { id: "members", label: "Members", icon: Users },
                  { id: "chat", label: "Members Chat", icon: MessagesSquare },
                ].map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setActiveTab(item.id as any)}
                      className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all text-left ${
                        isActive
                          ? "bg-blue-600 text-white font-black shadow-md"
                          : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5"
                      }`}
                    >
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-white" : "text-slate-400"}`} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* NETWORK TOOLS (For Owner/Admin) */}
            {(network.isOwner || (session?.user as { role?: string })?.role === "ADMIN") && (
              <div className="pt-4 border-t border-slate-100 dark:border-white/10">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 px-3 mb-2">
                  NETWORK TOOLS
                </p>
                <div className="space-y-1">
                  <button
                    type="button"
                    onClick={() => setActiveTab("manage")}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all text-left ${
                      activeTab === "manage"
                        ? "bg-amber-400 text-[#0a1628] font-black shadow-md"
                        : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5"
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <Settings className="w-4 h-4 shrink-0" />
                      <span>Manage Network</span>
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowUploadMediaModal(true)}
                    className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 text-left"
                  >
                    <span className="flex items-center gap-3">
                      <Video className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>Upload Video / Media</span>
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowUploadResourceModal(true)}
                    className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 text-left"
                  >
                    <span className="flex items-center gap-3">
                      <FolderDown className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>Upload Resource File</span>
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowHostProTalkModal(true)}
                    className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 text-left"
                  >
                    <span className="flex items-center gap-3">
                      <Radio className="w-4 h-4 text-rose-400 shrink-0" />
                      <span>Host Live Pro Talk</span>
                    </span>
                  </button>
                </div>
              </div>
            )}

            {/* Need Help Box */}
            <div className="pt-4 border-t border-slate-100 dark:border-white/10">
              <Link
                href="/contact"
                className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 transition-all text-xs font-bold text-slate-700 dark:text-slate-300"
              >
                <span className="flex items-center gap-2.5">
                  <Headphones className="w-4 h-4 text-blue-500" />
                  <span>
                    Need Help? <br />
                    <span className="text-[10px] font-normal text-slate-400">Contact Support</span>
                  </span>
                </span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </Link>
            </div>
          </div>
        </aside>

        {/* Center & Right Main Content Area */}
        <main className="flex-1 min-w-0 space-y-6">
          {/* Top Horizontal Navigation Bar */}
          <div className="bg-white dark:bg-[#121e33] border border-slate-200 dark:border-white/10 rounded-2xl p-2 shadow-sm flex items-center justify-between gap-2 overflow-x-auto">
            <div className="flex items-center gap-1 shrink-0">
              {[
                { id: "home", label: "Home", icon: Home },
                { id: "discussions", label: "Discussions", icon: MessageSquare },
                { id: "media", label: "Media", icon: Images },
                { id: "resources", label: "Resources", icon: FolderDown },
                { id: "protalks", label: "Pro Talks", icon: Radio },
                { id: "events", label: "Events", icon: Calendar },
                { id: "members", label: "Members", icon: Users },
                { id: "chat", label: "Members Chat", icon: MessagesSquare },
              ].map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveTab(item.id as any)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                      isActive
                        ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-black"
                        : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Search Input in Top Nav */}
            <div className="relative hidden md:block w-56 shrink-0">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search this network..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
              />
            </div>
          </div>

          {/* ── TAB 1: HOME DASHBOARD (Dynamic from DB) ── */}
          {activeTab === "home" && (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              {/* Left 2/3 Column */}
              <div className="xl:col-span-2 space-y-6">
                {/* Non-Member Paywall Banner */}
                {!network.isMember && !network.isOwner && (
                  renderPaywall()
                )}

                {/* 1. ANNOUNCEMENT CARD */}
                {announcements.length > 0 && (
                  <div className="bg-white dark:bg-[#121e33] border border-slate-200 dark:border-white/10 rounded-3xl p-6 shadow-sm space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/10 pb-3">
                      <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                        <span>📢 ANNOUNCEMENT</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveTab("discussions")}
                        className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        View All
                      </button>
                    </div>

                    <div>
                      <h3 className="text-base font-black text-slate-900 dark:text-white">
                        {announcements[0]?.title}
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed whitespace-pre-line">
                        {announcements[0]?.content}
                      </p>
                      <div className="flex items-center gap-2 mt-3 text-[11px] font-bold text-slate-400">
                        <span>{announcements[0]?.author?.name || network.owner.name}</span>
                        <span>•</span>
                        <span>{new Date(announcements[0]?.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. DISCUSSIONS FEED (MEMBERS ONLY) */}
                <div className="bg-white dark:bg-[#121e33] border border-slate-200 dark:border-white/10 rounded-3xl p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/10 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                        DISCUSSIONS FEED
                      </span>
                      <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                        (MEMBERS ONLY)
                      </span>
                    </div>

                    {network.isMember && (
                      <button
                        type="button"
                        onClick={() => setShowNewDiscussionModal(true)}
                        className="bg-blue-600 hover:bg-blue-500 text-white font-black text-xs px-3.5 py-1.5 rounded-xl transition-all shadow-sm flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>New Discussion</span>
                      </button>
                    )}
                  </div>

                  {/* Discussion Items List */}
                  {discussions.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-400 space-y-2">
                      <MessageSquare className="w-8 h-8 text-slate-400 mx-auto" />
                      <p className="font-bold">No discussions started yet.</p>
                      {network.isMember && (
                        <button
                          type="button"
                          onClick={() => setShowNewDiscussionModal(true)}
                          className="text-blue-500 font-bold hover:underline inline-block mt-1"
                        >
                          + Start the first discussion
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {discussions.slice(0, 5).map((disc) => (
                        <div
                          key={disc.id}
                          onClick={() => openDiscussionThread(disc)}
                          className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 transition-all cursor-pointer border border-slate-100 dark:border-transparent"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {disc.isPinned && (
                              <span className="text-amber-500 shrink-0">⭐</span>
                            )}
                            <div className="w-9 h-9 rounded-full bg-slate-300 dark:bg-slate-700 overflow-hidden shrink-0">
                              {disc.author.image ? (
                                <img
                                  src={disc.author.image}
                                  alt={disc.author.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center font-bold text-xs">
                                  {disc.author.name[0]}
                                </div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-xs font-black text-slate-900 dark:text-white truncate hover:text-blue-500 transition-colors">
                                {disc.title}
                              </h4>
                              <p className="text-[11px] text-slate-400 font-medium truncate mt-0.5">
                                Started by {disc.author.name} • {disc._count?.replies || 0} Replies
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 shrink-0 ml-2">
                            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full hidden sm:inline">
                              Members Only
                            </span>
                            <div className="flex items-center gap-1 text-xs font-bold text-slate-400">
                              <MessageSquare className="w-3.5 h-3.5" />
                              <span>{disc._count?.replies || 0}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {discussions.length > 5 && (
                    <div className="text-center pt-2">
                      <button
                        type="button"
                        onClick={() => setActiveTab("discussions")}
                        className="text-xs font-black text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        View All Discussions
                      </button>
                    </div>
                  )}
                </div>

                {/* 3. MEDIA GALLERY (MEMBERS ONLY) */}
                <div className="bg-white dark:bg-[#121e33] border border-slate-200 dark:border-white/10 rounded-3xl p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/10 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                        MEDIA GALLERY
                      </span>
                      <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                        (MEMBERS ONLY)
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {network.isOwner && (
                        <button
                          type="button"
                          onClick={() => setShowUploadMediaModal(true)}
                          className="bg-blue-600 hover:bg-blue-500 text-white font-black text-xs px-3 py-1 rounded-xl shadow-sm flex items-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Upload Video</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setActiveTab("media")}
                        className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        View All
                      </button>
                    </div>
                  </div>

                  {/* Media Grid */}
                  {mediaList.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-400 space-y-2">
                      <Images className="w-8 h-8 text-slate-400 mx-auto" />
                      <p className="font-bold">No media or recordings uploaded yet.</p>
                      {network.isOwner && (
                        <button
                          type="button"
                          onClick={() => setShowUploadMediaModal(true)}
                          className="text-blue-500 font-bold hover:underline inline-block mt-1"
                        >
                          + Upload first video or photo
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 overflow-x-auto">
                      {mediaList.slice(0, 4).map((item) => (
                        <div
                          key={item.id}
                          onClick={() => setSelectedMediaItem(item)}
                          className="group relative rounded-2xl overflow-hidden bg-slate-900 cursor-pointer shadow-sm hover:shadow-lg transition-all"
                        >
                          <div className="relative h-28 bg-slate-800">
                            {item.thumbnailUrl || (item.type === "PHOTO" && item.url) ? (
                              <img
                                src={item.thumbnailUrl || item.url}
                                alt={item.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-slate-800 text-slate-400">
                                <Video className="w-8 h-8" />
                              </div>
                            )}

                            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                              <div className="w-8 h-8 rounded-full bg-white/30 backdrop-blur-md flex items-center justify-center text-white">
                                <Play className="w-4 h-4 fill-white" />
                              </div>
                            </div>

                            {item.duration && (
                              <span className="absolute bottom-2 right-2 bg-black/70 text-white text-[9px] font-black px-1.5 py-0.5 rounded">
                                {item.duration}
                              </span>
                            )}
                          </div>
                          <div className="p-2.5 bg-slate-900 text-white">
                            <h5 className="text-[11px] font-bold truncate">{item.title}</h5>
                            <p className="text-[9px] text-slate-400">
                              {new Date(item.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Right 1/3 Column */}
              <div className="space-y-6">
                {/* 1. UPCOMING PRO TALKS ((MEMBERS ONLY)) */}
                <div className="bg-white dark:bg-[#121e33] border border-slate-200 dark:border-white/10 rounded-3xl p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/10 pb-3">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                        UPCOMING PRO TALKS
                      </span>
                      <span className="text-[9px] font-bold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded-full">
                        (MEMBERS ONLY)
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {network.isOwner && (
                        <button
                          type="button"
                          onClick={() => setShowHostProTalkModal(true)}
                          className="bg-rose-600 hover:bg-rose-500 text-white font-black text-xs px-2.5 py-1 rounded-xl shadow-sm flex items-center gap-1"
                        >
                          <Radio className="w-3 h-3" />
                          <span>Host Talk</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setActiveTab("protalks")}
                        className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        View All
                      </button>
                    </div>
                  </div>

                  {eventsList.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-400 space-y-2">
                      <Radio className="w-8 h-8 text-slate-400 mx-auto" />
                      <p className="font-bold">No upcoming Pro Talks scheduled.</p>
                      {network.isOwner && (
                        <button
                          type="button"
                          onClick={() => setShowHostProTalkModal(true)}
                          className="text-rose-500 font-bold hover:underline inline-block mt-1"
                        >
                          + Host or schedule a live Pro Talk
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {eventsList.slice(0, 3).map((ev) => (
                        <div
                          key={ev.id}
                          className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 space-y-3"
                        >
                          <div className="flex items-center justify-between">
                            {ev.isLive ? (
                              <span className="inline-flex items-center gap-1.5 bg-rose-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
                                <span className="w-1.5 h-1.5 rounded-full bg-white" />
                                LIVE NOW
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold text-blue-500 uppercase">
                                Scheduled Pro Talk
                              </span>
                            )}
                            <span className="text-[11px] font-bold text-slate-400">
                              {new Date(ev.scheduledAt).toLocaleDateString()}
                            </span>
                          </div>

                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <h4 className="text-xs font-black text-slate-900 dark:text-white leading-snug">
                                {ev.title}
                              </h4>
                              {ev.description && (
                                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                                  {ev.description}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-1">
                            {ev.isLive ? (
                              <Link
                                href={ev.liveUrl || "/pro-talks"}
                                className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black shadow-md flex items-center gap-1.5"
                              >
                                <Radio className="w-3.5 h-3.5" /> Join Live
                              </Link>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleToggleEventRsvp(ev.id)}
                                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                                  ev.isRegistered
                                    ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                                    : "bg-blue-600 hover:bg-blue-500 text-white shadow-sm"
                                }`}
                              >
                                {ev.isRegistered ? "✓ Registered" : "Register"}
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 2. RECENT RESOURCES ((MEMBERS ONLY)) */}
                <div className="bg-white dark:bg-[#121e33] border border-slate-200 dark:border-white/10 rounded-3xl p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/10 pb-3">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                        RECENT RESOURCES
                      </span>
                      <span className="text-[9px] font-bold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded-full">
                        (MEMBERS ONLY)
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {network.isOwner && (
                        <button
                          type="button"
                          onClick={() => setShowUploadResourceModal(true)}
                          className="bg-blue-600 hover:bg-blue-500 text-white font-black text-xs px-2.5 py-1 rounded-xl shadow-sm flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Upload</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setActiveTab("resources")}
                        className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        View All
                      </button>
                    </div>
                  </div>

                  {resourcesList.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-400 space-y-2">
                      <FolderDown className="w-8 h-8 text-slate-400 mx-auto" />
                      <p className="font-bold">No resources uploaded yet.</p>
                      {network.isOwner && (
                        <button
                          type="button"
                          onClick={() => setShowUploadResourceModal(true)}
                          className="text-blue-500 font-bold hover:underline inline-block mt-1"
                        >
                          + Upload first template or guide
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {resourcesList.slice(0, 4).map((res) => (
                        <a
                          key={res.id}
                          href={network.isMember ? res.fileUrl : undefined}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 transition-all group cursor-pointer"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="w-7 h-7 rounded-xl flex items-center justify-center text-[10px] font-black bg-blue-600/10 text-blue-600">
                              {res.fileType || "PDF"}
                            </span>
                            <div className="min-w-0">
                              <h5 className="text-xs font-bold text-slate-900 dark:text-white truncate group-hover:text-blue-500 transition-colors">
                                {res.title}
                              </h5>
                              <span className="text-[10px] text-slate-400">
                                {res.fileType} {res.fileSize ? `• ${res.fileSize}` : ""}
                              </span>
                            </div>
                          </div>
                          <Download className="w-4 h-4 text-slate-400 group-hover:text-blue-500 shrink-0 ml-2" />
                        </a>
                      ))}
                    </div>
                  )}
                </div>

                {/* 3. NETWORK MEMBERS (MEMBERS ONLY) */}
                <div className="bg-white dark:bg-[#121e33] border border-slate-200 dark:border-white/10 rounded-3xl p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/10 pb-3">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                        NETWORK MEMBERS ({network.memberCount.toLocaleString()})
                      </span>
                      <span className="text-[9px] font-bold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded-full">
                        (MEMBERS ONLY)
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setActiveTab("members")}
                      className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      View All
                    </button>
                  </div>

                  <div className="space-y-3">
                    {membersList.slice(0, 5).map((m) => (
                      <div key={m.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-200 shrink-0">
                            {m.user.image ? (
                              <img src={m.user.image} alt={m.user.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center font-bold text-xs bg-slate-300">
                                {m.user.name[0]}
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <h5 className="text-xs font-black text-slate-900 dark:text-white truncate">
                              {m.user.name}
                            </h5>
                            <p className="text-[10px] text-slate-400 truncate">
                              {m.user.location || m.user.headline || "Tax Professional"}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                            Active
                          </span>
                          <Link
                            href="/messages"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-500 hover:bg-slate-100 dark:hover:bg-white/5"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>

                  {membersList.length > 5 && (
                    <div className="text-center pt-2">
                      <button
                        type="button"
                        onClick={() => setActiveTab("members")}
                        className="text-xs font-black text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        See All Members
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── TAB 2: DISCUSSIONS FULL TAB ── */}
          {activeTab === "discussions" && (
            !network.isMember && !network.isOwner ? (
              renderPaywall("Private Discussions Board", "Ask questions, share audit findings, and collaborate with network peers.")
            ) : (
            <div className="bg-white dark:bg-[#121e33] border border-slate-200 dark:border-white/10 rounded-3xl p-6 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/10 pb-4">
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">
                    Private Discussions Board
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Ask questions, share audit findings, and collaborate with network peers.
                  </p>
                </div>

                {network.isMember && (
                  <button
                    type="button"
                    onClick={() => setShowNewDiscussionModal(true)}
                    className="bg-blue-600 hover:bg-blue-500 text-white font-black text-xs px-4 py-2.5 rounded-full shadow-md flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Start Discussion</span>
                  </button>
                )}
              </div>

              {discussions.length === 0 ? (
                <div className="text-center py-16 text-xs text-slate-400 space-y-3">
                  <MessageSquare className="w-10 h-10 text-slate-400 mx-auto" />
                  <p className="font-bold text-sm">No discussions in this network yet.</p>
                  <button
                    type="button"
                    onClick={() => setShowNewDiscussionModal(true)}
                    className="px-5 py-2.5 rounded-full bg-blue-600 text-white font-bold text-xs"
                  >
                    Create First Discussion
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {discussions.map((disc) => (
                    <div
                      key={disc.id}
                      onClick={() => openDiscussionThread(disc)}
                      className="p-5 rounded-2xl bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 transition-all cursor-pointer border border-slate-200 dark:border-white/5 space-y-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-300 dark:bg-slate-700 overflow-hidden shrink-0">
                            {disc.author.image ? (
                              <img
                                src={disc.author.image}
                                alt={disc.author.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center font-bold text-xs">
                                {disc.author.name[0]}
                              </div>
                            )}
                          </div>
                          <div>
                            <h4 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                              {disc.isPinned && <span className="text-amber-500">⭐</span>}
                              <span>{disc.title}</span>
                            </h4>
                            <p className="text-xs text-slate-400">
                              {disc.author.name} • {disc.author.headline || "Tax Professional"}
                            </p>
                          </div>
                        </div>

                        <span className="text-xs font-black text-slate-400 bg-slate-200 dark:bg-white/10 px-2.5 py-1 rounded-xl">
                          {disc.category}
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                        {disc.content}
                      </p>

                      <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-200/60 dark:border-white/5">
                        <span>{disc._count?.replies || 0} Replies</span>
                        <span className="text-blue-500 font-bold">Join Conversation →</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            )
          )}

          {/* ── TAB 3: MEDIA GALLERY FULL TAB ── */}
          {activeTab === "media" && (
            !network.isMember && !network.isOwner ? (
              renderPaywall("Media & Video Recordings", "Recorded workshops, backstage recaps, and video breakdowns.")
            ) : (
            <div className="bg-white dark:bg-[#121e33] border border-slate-200 dark:border-white/10 rounded-3xl p-6 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/10 pb-4">
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">
                    Media &amp; Video Recordings
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Recorded workshops, backstage recaps, and video breakdowns.
                  </p>
                </div>

                {network.isOwner && (
                  <button
                    type="button"
                    onClick={() => setShowUploadMediaModal(true)}
                    className="bg-blue-600 hover:bg-blue-500 text-white font-black text-xs px-4 py-2.5 rounded-full shadow-md flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Upload Media</span>
                  </button>
                )}
              </div>

              {mediaList.length === 0 ? (
                <div className="text-center py-16 text-xs text-slate-400 space-y-3">
                  <Images className="w-10 h-10 text-slate-400 mx-auto" />
                  <p className="font-bold text-sm">No media files uploaded yet.</p>
                  {network.isOwner && (
                    <button
                      type="button"
                      onClick={() => setShowUploadMediaModal(true)}
                      className="px-5 py-2.5 rounded-full bg-blue-600 text-white font-bold text-xs"
                    >
                      Upload First Video / Photo
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {mediaList.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => setSelectedMediaItem(item)}
                      className="group rounded-2xl overflow-hidden bg-slate-900 cursor-pointer shadow-md hover:shadow-xl transition-all"
                    >
                      <div className="relative h-44 bg-slate-800">
                        {item.thumbnailUrl || (item.type === "PHOTO" && item.url) ? (
                          <img
                            src={item.thumbnailUrl || item.url}
                            alt={item.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-slate-800 text-slate-400">
                            <Video className="w-12 h-12" />
                          </div>
                        )}

                        <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                          <div className="w-12 h-12 rounded-full bg-white/30 backdrop-blur-md flex items-center justify-center text-white">
                            <Play className="w-6 h-6 fill-white" />
                          </div>
                        </div>

                        {item.duration && (
                          <span className="absolute bottom-2.5 right-2.5 bg-black/80 text-white text-xs font-black px-2 py-0.5 rounded-lg">
                            {item.duration}
                          </span>
                        )}
                      </div>
                      <div className="p-4 bg-slate-900 text-white">
                        <h4 className="text-xs font-black truncate">{item.title}</h4>
                        <p className="text-[10px] text-slate-400 mt-1">
                          {new Date(item.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            )
          )}

          {/* ── TAB 4: RESOURCES FULL TAB ── */}
          {activeTab === "resources" && (
            !network.isMember && !network.isOwner ? (
              renderPaywall("Exclusive Resource Vault", "Download proprietary guides, questionnaires, checklists, and templates.")
            ) : (
            <div className="bg-white dark:bg-[#121e33] border border-slate-200 dark:border-white/10 rounded-3xl p-6 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/10 pb-4">
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">
                    Exclusive Resource Vault
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Download proprietary guides, questionnaires, checklists, and templates.
                  </p>
                </div>

                {network.isOwner && (
                  <button
                    type="button"
                    onClick={() => setShowUploadResourceModal(true)}
                    className="bg-blue-600 hover:bg-blue-500 text-white font-black text-xs px-4 py-2.5 rounded-full shadow-md flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Upload Resource File</span>
                  </button>
                )}
              </div>

              {resourcesList.length === 0 ? (
                <div className="text-center py-16 text-xs text-slate-400 space-y-3">
                  <FolderDown className="w-10 h-10 text-slate-400 mx-auto" />
                  <p className="font-bold text-sm">No resources in the vault yet.</p>
                  {network.isOwner && (
                    <button
                      type="button"
                      onClick={() => setShowUploadResourceModal(true)}
                      className="px-5 py-2.5 rounded-full bg-blue-600 text-white font-bold text-xs"
                    >
                      Upload First Resource File
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {resourcesList.map((item) => (
                    <a
                      key={item.id}
                      href={network.isMember ? item.fileUrl : undefined}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 hover:border-blue-500 transition-all cursor-pointer group flex flex-col justify-between space-y-3"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-lg bg-blue-600/10 text-blue-600 dark:text-blue-400">
                            {item.fileType} {item.fileSize ? `• ${item.fileSize}` : ""}
                          </span>
                          <Download className="w-4 h-4 text-slate-400 group-hover:text-blue-500 transition-colors" />
                        </div>
                        <h4 className="text-sm font-black text-slate-900 dark:text-white group-hover:text-blue-500 transition-colors">
                          {item.title}
                        </h4>
                        {item.description && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                            {item.description}
                          </p>
                        )}
                      </div>

                      <div className="text-xs font-bold text-blue-500 pt-2 flex items-center gap-1">
                        <span>Download File</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </div>
            )
          )}

          {/* ── TAB 5: PRO TALKS & EVENTS FULL TAB ── */}
          {(activeTab === "protalks" || activeTab === "events") && (
            !network.isMember && !network.isOwner ? (
              renderPaywall("Live Pro Talks & Events", "Live audio rooms, training masterclasses, and Q&A sessions.")
            ) : (
            <div className="bg-white dark:bg-[#121e33] border border-slate-200 dark:border-white/10 rounded-3xl p-6 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/10 pb-4">
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">
                    Network Pro Talks &amp; Live Events
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Live audio rooms, training masterclasses, and Q&amp;A sessions.
                  </p>
                </div>

                {network.isOwner && (
                  <button
                    type="button"
                    onClick={() => setShowHostProTalkModal(true)}
                    className="bg-rose-600 hover:bg-rose-500 text-white font-black text-xs px-4 py-2.5 rounded-full shadow-md flex items-center gap-1.5"
                  >
                    <Radio className="w-4 h-4" />
                    <span>Host / Schedule Pro Talk</span>
                  </button>
                )}
              </div>

              {eventsList.length === 0 ? (
                <div className="text-center py-16 text-xs text-slate-400 space-y-3">
                  <Radio className="w-10 h-10 text-slate-400 mx-auto" />
                  <p className="font-bold text-sm">No Pro Talks or events scheduled yet.</p>
                  {network.isOwner && (
                    <button
                      type="button"
                      onClick={() => setShowHostProTalkModal(true)}
                      className="px-5 py-2.5 rounded-full bg-rose-600 text-white font-bold text-xs"
                    >
                      Host Live Pro Talk
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {eventsList.map((ev) => (
                    <div
                      key={ev.id}
                      className="p-5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 flex flex-col justify-between space-y-4"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          {ev.isLive ? (
                            <span className="inline-flex items-center gap-1.5 bg-rose-500 text-white text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider animate-pulse">
                              <span className="w-1.5 h-1.5 rounded-full bg-white" />
                              LIVE NOW
                            </span>
                          ) : (
                            <span className="text-xs font-bold text-blue-500">
                              {new Date(ev.scheduledAt).toLocaleDateString([], {
                                weekday: "short",
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          )}
                        </div>

                        <h4 className="text-sm font-black text-slate-900 dark:text-white">
                          {ev.title}
                        </h4>
                        {ev.description && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                            {ev.description}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-white/5">
                        <span className="text-xs font-bold text-slate-400">
                          {ev.rsvpCount} Registered
                        </span>

                        {ev.isLive ? (
                          <Link
                            href={ev.liveUrl || "/pro-talks"}
                            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black shadow-md flex items-center gap-1.5"
                          >
                            <Radio className="w-4 h-4" /> Join Live
                          </Link>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleToggleEventRsvp(ev.id)}
                            className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                              ev.isRegistered
                                ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                                : "bg-blue-600 hover:bg-blue-500 text-white shadow-md"
                            }`}
                          >
                            {ev.isRegistered ? "✓ Registered" : "Register to Attend"}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            )
          )}

          {/* ── TAB 6: MEMBERS CHAT ── */}
          {activeTab === "chat" && (
            !network.isMember && !network.isOwner ? (
              renderPaywall("Members Live Chat", "Chat in real-time with verified network members.")
            ) : (
            <div className="bg-white dark:bg-[#121e33] border border-slate-200 dark:border-white/10 rounded-3xl overflow-hidden shadow-sm flex flex-col h-[650px]">
              {/* Channel Header Bar */}
              <div className="p-4 bg-slate-100 dark:bg-slate-900/60 border-b border-slate-200 dark:border-white/10 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 overflow-x-auto">
                  {[
                    { id: "general", label: "#general" },
                    { id: "tax-season", label: "#tax-season" },
                    { id: "due-diligence", label: "#due-diligence" },
                    { id: "marketing", label: "#marketing" },
                    { id: "questions-for-owner", label: "#owner-qa" },
                  ].map((ch) => (
                    <button
                      key={ch.id}
                      type="button"
                      onClick={() => setChatChannel(ch.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                        chatChannel === ch.id
                          ? "bg-blue-600 text-white font-black"
                          : "text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10"
                      }`}
                    >
                      {ch.label}
                    </button>
                  ))}
                </div>

                <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full shrink-0">
                  Active Member Chat
                </span>
              </div>

              {/* Chat Messages Log */}
              <div className="flex-1 p-6 overflow-y-auto space-y-4">
                {chatMessages.length === 0 ? (
                  <div className="text-center py-16 text-xs text-slate-400 space-y-2">
                    <MessagesSquare className="w-8 h-8 text-slate-400 mx-auto" />
                    <p className="font-bold">Welcome to the #{chatChannel} channel!</p>
                    <p>Be the first member to say hello.</p>
                  </div>
                ) : (
                  chatMessages.map((msg) => (
                    <div key={msg.id} className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-300 dark:bg-slate-700 overflow-hidden shrink-0">
                        {msg.sender.image ? (
                          <img
                            src={msg.sender.image}
                            alt={msg.sender.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center font-bold text-xs">
                            {msg.sender.name[0]}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-slate-900 dark:text-white">
                            {msg.sender.name}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(msg.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <p className="text-xs text-slate-700 dark:text-slate-200 mt-1 leading-relaxed">
                          {msg.content}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Chat Input Bar */}
              <form
                onSubmit={handleSendChatMessage}
                className="p-4 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-200 dark:border-white/10 flex items-center gap-2"
              >
                <input
                  type="text"
                  placeholder={`Message #${chatChannel}...`}
                  value={newChatMessage}
                  onChange={(e) => setNewChatMessage(e.target.value)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#121e33] text-xs font-medium focus:outline-none"
                />
                <button
                  type="submit"
                  className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-md transition-all shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
            )
          )}

          {/* ── TAB 7: MEMBERS DIRECTORY ── */}
          {activeTab === "members" && (
            !network.isMember && !network.isOwner ? (
              renderPaywall("Members Directory", "Connect and collaborate directly with fellow network members.")
            ) : (
            <div className="bg-white dark:bg-[#121e33] border border-slate-200 dark:border-white/10 rounded-3xl p-6 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/10 pb-4">
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">
                    Network Member Directory ({network.memberCount.toLocaleString()})
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Connect and collaborate directly with fellow network members.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {membersList.map((m) => (
                  <div
                    key={m.id}
                    className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 flex items-center justify-between gap-3 shadow-sm"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-11 h-11 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden ring-2 ring-amber-400/30 shrink-0">
                        {m.user.image ? (
                          <img
                            src={m.user.image}
                            alt={m.user.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center font-black text-sm">
                            {m.user.name[0]}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-black text-slate-900 dark:text-white truncate">
                          {m.user.name}
                        </h4>
                        <p className="text-[10px] text-slate-400 truncate">
                          {m.user.headline || m.user.location || "Tax Professional"}
                        </p>
                        <span className="text-[9px] font-bold text-amber-500 bg-amber-500/10 px-1.5 py-0.2 rounded mt-1 inline-block">
                          {m.role}
                        </span>
                      </div>
                    </div>

                    <Link
                      href="/messages"
                      className="p-2 rounded-xl bg-blue-600/10 hover:bg-blue-600 text-blue-600 hover:text-white transition-colors"
                      title="Send Direct Message"
                    >
                      <MessageCircle className="w-4 h-4" />
                    </Link>
                  </div>
                ))}
              </div>
            </div>
            )
          )}

          {/* ── TAB 8: OWNER MANAGEMENT DASHBOARD ── */}
          {activeTab === "manage" && network.isOwner && (
            <div className="bg-white dark:bg-[#121e33] border border-slate-200 dark:border-white/10 rounded-3xl p-6 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/10 pb-4">
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">
                    Network Owner Management Dashboard
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Track members, subscription earnings (0% TCP fee), and upload exclusive content.
                  </p>
                </div>
              </div>

              {/* Key Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 space-y-1">
                  <span className="text-xs text-slate-400 font-bold">Total Members</span>
                  <div className="text-2xl font-black text-slate-900 dark:text-white">
                    {network.memberCount.toLocaleString()}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 space-y-1">
                  <span className="text-xs text-slate-400 font-bold">Monthly Revenue</span>
                  <div className="text-2xl font-black text-emerald-500">
                    ${(network.memberCount * network.monthlyPrice).toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                    })}
                  </div>
                  <span className="text-[10px] text-emerald-600 font-bold">0% TCP Fee Deducted</span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 space-y-1">
                  <span className="text-xs text-slate-400 font-bold">Total Followers</span>
                  <div className="text-2xl font-black text-slate-900 dark:text-white">
                    {network.followerCount.toLocaleString()}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 space-y-1">
                  <span className="text-xs text-slate-400 font-bold">Monthly Price</span>
                  <div className="text-2xl font-black text-amber-500">
                    ${network.monthlyPrice.toFixed(2)}/mo
                  </div>
                </div>
              </div>

              {/* ── Host Stripe Connect Integration Card (0% Platform Fee) ── */}
              <div className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-6 space-y-5">
                <div className="flex items-start sm:items-center justify-between gap-4 flex-col sm:flex-row border-b border-slate-200/60 dark:border-white/10 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#6772e5]/15 flex items-center justify-center shrink-0">
                      <svg viewBox="0 0 24 24" className="w-5 h-5 fill-[#6772e5]">
                        <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.591-7.305z"/>
                      </svg>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-black text-slate-900 dark:text-white text-base">Host Stripe Connect Account</h4>
                        {stripeStatus?.connected && stripeStatus?.onboarded ? (
                          <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-0.5 rounded-full">
                            <CheckCircle2 className="w-3 h-3" /> Connected &amp; Active
                          </span>
                        ) : stripeStatus?.connected && !stripeStatus?.onboarded ? (
                          <span className="flex items-center gap-1 text-[11px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-500/10 px-2.5 py-0.5 rounded-full">
                            <AlertCircle className="w-3 h-3" /> Incomplete Onboarding
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[11px] font-bold text-rose-600 bg-rose-50 dark:bg-rose-500/10 px-2.5 py-0.5 rounded-full">
                            <AlertCircle className="w-3 h-3" /> Not Connected
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Receive 100% of member subscription payments directly into your bank account (0% TCP platform cut).
                      </p>
                    </div>
                  </div>
                </div>

                {/* Warning if not connected */}
                {(!stripeStatus?.connected || !stripeStatus?.onboarded) && (
                  <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs font-semibold flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-sm text-amber-900 dark:text-amber-200">
                        Connect your Stripe account to receive direct member payouts
                      </div>
                      <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-300">
                        When members pay ${network.monthlyPrice.toFixed(2)}/mo to join your Pro Network, Stripe routes 100% of the recurring membership revenue directly into your connected bank account.
                      </p>
                    </div>
                  </div>
                )}

                {/* Account Details if connected */}
                {stripeStatus?.connected && stripeStatus?.accountDetails && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { label: "Stripe Email", value: stripeStatus.accountDetails.email ?? "—" },
                      { label: "Charges", value: stripeStatus.accountDetails.chargesEnabled ? "Enabled" : "Disabled" },
                      { label: "Payouts", value: stripeStatus.accountDetails.payoutsEnabled ? "Enabled" : "Disabled" },
                      { label: "Account ID", value: (stripeStatus.accountId?.slice(0, 16) ?? "—") + "…" },
                    ].map((s) => (
                      <div key={s.label} className="bg-white dark:bg-black/20 rounded-xl px-3.5 py-2.5 border border-slate-200/60 dark:border-white/5">
                        <div className="text-[10px] text-slate-400 font-semibold">{s.label}</div>
                        <div className="text-xs font-bold text-slate-900 dark:text-white truncate">{s.value}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center gap-3 flex-wrap pt-1">
                  {!stripeStatus?.connected ? (
                    <button
                      type="button"
                      onClick={handleConnectStripe}
                      disabled={connectingStripe}
                      className="inline-flex items-center gap-2 bg-[#6772e5] hover:bg-[#5469d4] text-white font-black text-xs px-5 py-2.5 rounded-xl transition-all shadow-md disabled:opacity-60"
                    >
                      {connectingStripe ? <Loader2 className="w-4 h-4 animate-spin" /> : <ExternalLink className="w-4 h-4" />}
                      <span>{connectingStripe ? "Connecting..." : "Connect Stripe Account"}</span>
                    </button>
                  ) : (
                    <>
                      {!stripeStatus?.onboarded && (
                        <button
                          type="button"
                          onClick={handleConnectStripe}
                          disabled={connectingStripe}
                          className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all disabled:opacity-60"
                        >
                          {connectingStripe ? <Loader2 className="w-4 h-4 animate-spin" /> : <AlertCircle className="w-4 h-4" />}
                          <span>{connectingStripe ? "Loading..." : "Complete Stripe Onboarding"}</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={handleDisconnectStripe}
                        disabled={disconnectingStripe}
                        className="inline-flex items-center gap-2 text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 font-bold text-xs px-4 py-2.5 rounded-xl transition-all disabled:opacity-60"
                      >
                        {disconnectingStripe ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                        <span>{disconnectingStripe ? "Disconnecting..." : "Disconnect Stripe"}</span>
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Direct Actions Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUploadMediaModal(true)}
                  className="p-5 rounded-2xl border border-slate-200 dark:border-white/10 hover:border-blue-500 bg-slate-50 dark:bg-white/5 transition-all text-left space-y-2 group"
                >
                  <Video className="w-6 h-6 text-blue-500" />
                  <h4 className="text-xs font-black text-slate-900 dark:text-white group-hover:text-blue-500">
                    Upload Video / Media
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Upload masterclass recordings and training clips via Cloudinary.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setShowUploadResourceModal(true)}
                  className="p-5 rounded-2xl border border-slate-200 dark:border-white/10 hover:border-emerald-500 bg-slate-50 dark:bg-white/5 transition-all text-left space-y-2 group"
                >
                  <FolderDown className="w-6 h-6 text-emerald-500" />
                  <h4 className="text-xs font-black text-slate-900 dark:text-white group-hover:text-emerald-500">
                    Upload Resource File
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Add PDFs, checklists, and templates to the members vault.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setShowHostProTalkModal(true)}
                  className="p-5 rounded-2xl border border-slate-200 dark:border-white/10 hover:border-rose-500 bg-slate-50 dark:bg-white/5 transition-all text-left space-y-2 group"
                >
                  <Radio className="w-6 h-6 text-rose-500" />
                  <h4 className="text-xs font-black text-slate-900 dark:text-white group-hover:text-rose-500">
                    Host Live Pro Talk
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Go live instantly or schedule an exclusive workshop on TCP.
                  </p>
                </button>
              </div>
            </div>
          )}

          {/* ── BOTTOM ACCESS STATUS BANNER ── */}
          <div className="bg-white dark:bg-[#121e33] border border-slate-200 dark:border-white/10 rounded-2xl p-4 text-center text-xs font-bold text-slate-500 dark:text-slate-400 shadow-sm flex items-center justify-center gap-2">
            <Lock className="w-3.5 h-3.5 text-blue-500" />
            <span>
              {network.isMember
                ? `You have full access as an active member of ${network.name}. Thank you for being part of our community!`
                : `Join ${network.name} ($${network.monthlyPrice.toFixed(2)}/mo) to unlock full access to all private feeds, resources, and live Pro Talks.`}
            </span>
          </div>
        </main>
      </div>

      {/* ── FLOATING ACTION BUTTON (+ New Post) ── */}
      {network.isMember && (
        <button
          type="button"
          onClick={() => setShowNewDiscussionModal(true)}
          className="fixed bottom-8 right-8 z-40 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs px-5 py-3.5 rounded-full shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>New Post</span>
        </button>
      )}

      {/* ── MODAL: Start New Discussion ── */}
      {showNewDiscussionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#172135] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/10 pb-3">
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                New Discussion Thread
              </h3>
              <button
                type="button"
                onClick={() => setShowNewDiscussionModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDiscussion} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Topic Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Schedule C inventory valuation questions..."
                  value={newDiscussionTitle}
                  onChange={(e) => setNewDiscussionTitle(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Category
                </label>
                <select
                  value={newDiscussionCategory}
                  onChange={(e) => setNewDiscussionCategory(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold"
                >
                  <option value="General">General</option>
                  <option value="Tax Season">Tax Season</option>
                  <option value="Due Diligence">Due Diligence</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Software">Software</option>
                  <option value="Owner Q&A">Questions for Host</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Discussion Content
                </label>
                <textarea
                  rows={4}
                  placeholder="Write your question, scenario, or advice..."
                  value={newDiscussionContent}
                  onChange={(e) => setNewDiscussionContent(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewDiscussionModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingDiscussion}
                  className="px-5 py-2 rounded-xl bg-blue-600 text-white text-xs font-black hover:bg-blue-500 disabled:opacity-50"
                >
                  {submittingDiscussion ? "Posting..." : "Post Discussion"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: Upload Media (Cloudinary) ── */}
      {showUploadMediaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#172135] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/10 pb-3">
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Video className="w-5 h-5 text-blue-500" />
                <span>Upload Media / Video to Gallery</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowUploadMediaModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUploadMedia} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Tax Season Preparation Breakdown"
                  value={mediaTitle}
                  onChange={(e) => setMediaTitle(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Media Type
                  </label>
                  <select
                    value={mediaType}
                    onChange={(e) => setMediaType(e.target.value as any)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold"
                  >
                    <option value="VIDEO">Video</option>
                    <option value="PHOTO">Photo</option>
                    <option value="AUDIO">Audio</option>
                    <option value="FILE">File</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Duration (e.g. 12:45)
                  </label>
                  <input
                    type="text"
                    placeholder="12:45"
                    value={mediaDuration}
                    onChange={(e) => setMediaDuration(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Select Video or Media File (Cloudinary) *
                </label>
                <input
                  type="file"
                  accept="video/*,image/*,audio/*"
                  onChange={(e) => setMediaFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Custom Video Thumbnail Image (Optional)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setMediaThumbnailFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUploadMediaModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploadingMedia}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-black hover:bg-blue-500 disabled:opacity-50 flex items-center gap-2"
                >
                  {uploadingMedia ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Uploading to Cloudinary...</span>
                    </>
                  ) : (
                    <span>Upload to Gallery</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: Upload Resource (Cloudinary) ── */}
      {showUploadResourceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#172135] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/10 pb-3">
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <FolderDown className="w-5 h-5 text-emerald-500" />
                <span>Upload Document / Template to Vault</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowUploadResourceModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUploadResource} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Resource Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Schedule C Audit Workpaper Template"
                  value={resourceTitle}
                  onChange={(e) => setResourceTitle(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  File Format
                </label>
                <select
                  value={resourceFileType}
                  onChange={(e) => setResourceFileType(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold"
                >
                  <option value="PDF">PDF Guide</option>
                  <option value="DOCX">DOCX Template</option>
                  <option value="XLSX">Excel Spreadsheet</option>
                  <option value="ZIP">ZIP Bundle</option>
                  <option value="VIDEO">Video Masterclass</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Brief description of this resource for members..."
                  value={resourceDesc}
                  onChange={(e) => setResourceDesc(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Select Document File (Cloudinary) *
                </label>
                <input
                  type="file"
                  onChange={(e) => setResourceFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUploadResourceModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploadingResource}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-black hover:bg-emerald-500 disabled:opacity-50 flex items-center gap-2"
                >
                  {uploadingResource ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Uploading to Vault...</span>
                    </>
                  ) : (
                    <span>Add to Resource Vault</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: Host / Schedule Pro Talk (TCP Pro Talks Integration) ── */}
      {showHostProTalkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#172135] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/10 pb-3">
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Radio className="w-5 h-5 text-rose-500" />
                <span>Host / Schedule TCP Pro Talk</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowHostProTalkModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleHostProTalk} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Pro Talk Session Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Entity Selection Strategies That Save Thousands"
                  value={proTalkTitle}
                  onChange={(e) => setProTalkTitle(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Description / Topics
                </label>
                <textarea
                  rows={2}
                  placeholder="What will be covered in this live session..."
                  value={proTalkDesc}
                  onChange={(e) => setProTalkDesc(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium"
                />
              </div>

              <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="talkTiming"
                    checked={isGoLiveImmediate}
                    onChange={() => setIsGoLiveImmediate(true)}
                    className="accent-rose-500"
                  />
                  <span className="text-xs font-black text-slate-900 dark:text-white">
                    🔴 Start Live Room Now
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="talkTiming"
                    checked={!isGoLiveImmediate}
                    onChange={() => setIsGoLiveImmediate(false)}
                    className="accent-rose-500"
                  />
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                    📅 Schedule for Later
                  </span>
                </label>
              </div>

              {!isGoLiveImmediate && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Scheduled Date &amp; Time
                  </label>
                  <input
                    type="datetime-local"
                    value={proTalkScheduleDate}
                    onChange={(e) => setProTalkScheduleDate(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold"
                    required
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowHostProTalkModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingProTalk}
                  className="px-6 py-2.5 rounded-xl bg-rose-600 text-white text-xs font-black hover:bg-rose-500 disabled:opacity-50 flex items-center gap-2"
                >
                  {creatingProTalk ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Creating Pro Talk...</span>
                    </>
                  ) : (
                    <span>{isGoLiveImmediate ? "Launch Live Room Now" : "Schedule Pro Talk"}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: Invite Members ── */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#172135] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-blue-600/20 text-blue-500 mx-auto flex items-center justify-center">
              <UserPlus className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-black text-slate-900 dark:text-white">
              Invite Professionals to {network.name}
            </h3>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Share your direct network link to enroll colleagues and practitioners.
            </p>

            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={typeof window !== "undefined" ? window.location.href : ""}
                className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 select-all"
              />
              <button
                type="button"
                onClick={handleCopyInviteLink}
                className="px-4 py-2 rounded-xl bg-blue-600 text-white font-black text-xs shrink-0 hover:bg-blue-500"
              >
                {copiedLink ? "Copied!" : "Copy Link"}
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShowInviteModal(false)}
              className="text-xs font-bold text-slate-400 hover:text-slate-600 pt-2"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* ── MODAL: Media Video Player / Photo Viewer ── */}
      {selectedMediaItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#0f1a2e] border border-white/15 rounded-3xl p-6 max-w-3xl w-full shadow-2xl space-y-4 text-white">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-black truncate">{selectedMediaItem.title}</h3>
              <button
                type="button"
                onClick={() => setSelectedMediaItem(null)}
                className="p-1 text-white/60 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative aspect-video rounded-2xl overflow-hidden bg-black flex items-center justify-center">
              {selectedMediaItem.url ? (
                selectedMediaItem.type === "PHOTO" ? (
                  <img
                    src={selectedMediaItem.url}
                    alt={selectedMediaItem.title}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <video
                    src={selectedMediaItem.url}
                    controls
                    autoPlay
                    className="w-full h-full object-contain"
                  />
                )
              ) : (
                <div className="text-center p-8 space-y-2">
                  <Lock className="w-8 h-8 text-amber-400 mx-auto" />
                  <p className="font-black text-sm">Members Only Content</p>
                  <p className="text-xs text-slate-400">Join this Pro Network to stream full videos.</p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 pt-2">
              <span>{selectedMediaItem.duration ? `Duration: ${selectedMediaItem.duration}` : "Media Vault"}</span>
              <button
                type="button"
                onClick={() => setSelectedMediaItem(null)}
                className="px-4 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs"
              >
                Close Viewer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: Discussion Thread Reader & Replies ── */}
      {selectedDiscussion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#172135] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-2xl w-full shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase text-blue-500">
                  {selectedDiscussion.category}
                </span>
                <span className="text-xs font-bold text-slate-400">• Discussion</span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDiscussion(null)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                {selectedDiscussion.title}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                {selectedDiscussion.content}
              </p>
            </div>

            {/* Replies List */}
            <div className="flex-1 overflow-y-auto border-t border-b border-slate-100 dark:border-white/10 py-4 space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
                Replies ({discussionReplies.length})
              </h4>
              {discussionReplies.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No replies yet. Be the first to share your thoughts.</p>
              ) : (
                discussionReplies.map((reply) => (
                  <div key={reply.id} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/5 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-slate-900 dark:text-white">
                        {reply.author.name}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(reply.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 dark:text-slate-300">{reply.content}</p>
                  </div>
                ))
              )}
            </div>

            {/* Reply Input */}
            {network.isMember ? (
              <form onSubmit={handlePostReply} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Write a reply..."
                  value={newReplyContent}
                  onChange={(e) => setNewReplyContent(e.target.value)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs"
                />
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-black text-xs hover:bg-blue-500 shrink-0"
                >
                  Reply
                </button>
              </form>
            ) : (
              <div className="text-center py-2 text-xs font-bold text-slate-400">
                Join this network to participate in discussions.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
