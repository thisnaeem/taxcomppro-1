"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { networkAccentInk } from "@/lib/networkBranding";
import NetworkDetailsSettings from "@/components/networks/NetworkDetailsSettings";
import NetworkBranding from "@/components/networks/NetworkBranding";
import NetworkEvents from "@/components/networks/NetworkEvents";
import ProfessionalTitleEditor from "@/components/networks/ProfessionalTitleEditor";
import "@/components/networks/network-settings.css";
import NetworkBadge from "@/components/networks/NetworkBadge";
import "@/components/networks/networks.css";
import "@/components/networks/networks-light.css";
import "@/components/networks/network-hub-theme.css";
import NetworkSkeleton from "@/components/networks/NetworkSkeleton";
import NetworkPosts from "@/components/networks/NetworkPosts";
import "@/components/networks/network-posts.css";
import MemberBubbleCloud from "@/components/networks/MemberBubbleCloud";
import {
  Home01Icon as Home,
  BubbleChatIcon as MessageSquare,
  Image01Icon as Images,
  FolderDownloadIcon as FolderDown,
  LiveStreaming01Icon as Radio,
  Calendar03Icon as Calendar,
  UserGroupIcon as Users,
  GridViewIcon as LayoutGrid,
  BubbleChatIcon as MessagesSquare,
  Settings01Icon as Settings,
  Edit01Icon as Pencil,
  ChartHistogramIcon as BarChart2,
  Shield01Icon as Shield,
  Mail01Icon as Mail,
  HeadphonesIcon as Headphones,
  Notification01Icon as Bell,
  MoreHorizontalIcon as MoreHorizontal,
  Search01Icon as Search,
  Add01Icon as Plus,
  PlayIcon as Play,
  File01Icon as FileText,
  Download01Icon as Download,
  CheckmarkCircle02Icon as CheckCircle2,
  LockIcon as Lock,
  ArrowRight01Icon as ChevronRight,
  ArrowLeft01Icon as ChevronLeft,
  CrownIcon as Crown,
  Share08Icon as Share2,
  Cancel01Icon as X,
  SentIcon as Send,
  Loading03Icon as Loader2,
  ArrowRight02Icon as ArrowRight,
  SparklesIcon as Sparkles,
  LinkSquare02Icon as ExternalLink,
  BubbleChatIcon as MessageCircle,
  Call02Icon as Phone,
  HelpCircleIcon as HelpCircle,
  ViewIcon as Eye,
  Dollar01Icon as DollarSign,
  ChartIncreaseIcon as TrendingUp,
  UserAdd01Icon as UserPlus,
  Upload01Icon as Upload,
  Video01Icon as Video,
  File01Icon as File,
  Image01Icon as ImageIcon,
  Mic01Icon as Mic,
  AlertCircleIcon as AlertCircle
} from "hugeicons-react";

const NETWORK_TABS = [
  { id: "home", label: "Posts", icon: Home },
  { id: "media", label: "Media library", icon: Images },
  { id: "resources", label: "Resources", icon: FolderDown },
  { id: "protalks", label: "Pro Talks", icon: Radio },
  { id: "events", label: "Events", icon: Calendar },
  { id: "members", label: "Members", icon: Users },
  { id: "chat", label: "Member chat", icon: MessagesSquare },
] as const;
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
  accentColor: string;
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
  canManage: boolean;
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
  const [loadError, setLoadError] = useState("");
  const [activeTab, setActiveTab] = useState<
    | "home"
    | "media"
    | "resources"
    | "protalks"
    | "events"
    | "members"
    | "chat"
    | "manage"
  >("home");

  // Host Stripe Connect State
  const [stripeStatus, setStripeStatus] = useState<StripeStatus | null>(null);
  const [connectingStripe, setConnectingStripe] = useState(false);
  const [disconnectingStripe, setDisconnectingStripe] = useState(false);

  // Dynamic Data States (100% from Database)
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [discussions, setDiscussions] = useState<any[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [postsError, setPostsError] = useState("");
  const [mediaList, setMediaList] = useState<any[]>([]);
  const [resourcesList, setResourcesList] = useState<any[]>([]);
  const [eventsList, setEventsList] = useState<any[]>([]);
  const [membersList, setMembersList] = useState<any[]>([]);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatChannel, setChatChannel] = useState("general");
  const [newChatMessage, setNewChatMessage] = useState("");

  // Modals
  const [showUploadMediaModal, setShowUploadMediaModal] = useState(false);
  const [mediaTitle, setMediaTitle] = useState("");
  const [mediaType, setMediaType] = useState<
    "PHOTO" | "VIDEO" | "FILE" | "AUDIO"
  >("VIDEO");
  const [mediaDuration, setMediaDuration] = useState("");
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaThumbnailFile, setMediaThumbnailFile] = useState<File | null>(
    null,
  );
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
  const [joining, setJoining] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Pricing Update State
  const [showEditPricingModal, setShowEditPricingModal] = useState(false);
  const [editPriceType, setEditPriceType] = useState<"free" | "paid">("paid");
  const [editMonthlyPrice, setEditMonthlyPrice] = useState("19.99");
  const [savingPrice, setSavingPrice] = useState(false);
  const [pricingSuccessMsg, setPricingSuccessMsg] = useState("");

  const openEditPricingModal = () => {
    if (network) {
      if (network.monthlyPrice <= 0) {
        setEditPriceType("free");
        setEditMonthlyPrice("0");
      } else {
        setEditPriceType("paid");
        setEditMonthlyPrice(network.monthlyPrice.toString());
      }
    }
    setShowEditPricingModal(true);
  };

  const handleSavePricing = async () => {
    const finalPrice =
      editPriceType === "free"
        ? 0
        : Math.max(0, parseFloat(editMonthlyPrice || "0"));
    if (!Number.isFinite(finalPrice) || (editPriceType === "paid" && finalPrice <= 0)) { alert("Enter a monthly price greater than zero, or choose Free."); return; }
    setSavingPrice(true);
    try {
      const res = await fetch(`/api/pro-networks/${slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ monthlyPrice: finalPrice }),
      });
      const data = await res.json();
      if (res.ok) {
        setNetwork((prev) =>
          prev ? { ...prev, monthlyPrice: finalPrice } : prev,
        );
        setShowEditPricingModal(false);
        setPricingSuccessMsg(
          `Network pricing successfully updated to ${finalPrice <= 0 ? "FREE" : `$${finalPrice.toFixed(2)}/mo`}!`,
        );
        setTimeout(() => setPricingSuccessMsg(""), 5000);
      } else {
        alert(data.error || "Failed to update network pricing.");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to update pricing.");
    } finally {
      setSavingPrice(false);
    }
  };

  // Member View Mode ("bubble" or "grid")
  const [memberViewMode, setMemberViewMode] = useState<"bubble" | "grid">(
    "bubble",
  );

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
      const data = await res.json().catch(() => null);
      if (res.ok && data?.url) {
        window.location.href = data.url;
      } else {
        alert(data?.error || "Failed to start Stripe onboarding. Please check your Stripe settings.");
      }
    } catch (err: any) {
      alert(err?.message || "Network error. Please try again.");
    } finally {
      setConnectingStripe(false);
    }
  };

  const handleDisconnectStripe = async () => {
    if (
      !confirm(
        "Disconnect your Stripe account? Member subscription payments won't be transferred directly to you.",
      )
    )
      return;
    setDisconnectingStripe(true);
    try {
      await fetch("/api/seller/stripe-connect", { method: "DELETE" });
      setStripeStatus({
        connected: false,
        onboarded: false,
        accountId: null,
        accountDetails: null,
      });
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
      if (
        params.get("stripe") === "success" ||
        params.get("stripe") === "refresh"
      ) {
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
        setLoadError(
          res.status === 404
            ? "This network could not be found."
            : "We couldn’t load this network. Please try again.",
        );
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPosts = async () => {
    setPostsLoading(true); setPostsError("");
    try {
      const res = await fetch(`/api/pro-networks/${slug}/discussions`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not load posts.");
      setDiscussions(data.discussions || []);
    } catch (error) { setPostsError(error instanceof Error ? error.message : "Could not load posts."); }
    finally { setPostsLoading(false); }
  };

  const fetchAllTabData = async () => {
    void fetchPosts();
    try {
      const [annRes, mediaRes, resRes, eventRes, memRes] =
        await Promise.all([
          fetch(`/api/pro-networks/${slug}/announcements`),
          fetch(`/api/pro-networks/${slug}/media`),
          fetch(`/api/pro-networks/${slug}/resources`),
          fetch(`/api/pro-networks/${slug}/events`),
          fetch(`/api/pro-networks/${slug}/members`),
        ]);

      if (annRes.ok)
        setAnnouncements((await annRes.json()).announcements || []);
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
      const res = await fetch(
        `/api/pro-networks/${slug}/chat?channel=${chatChannel}`,
      );
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
    <div className="pn-paywall space-y-6">
      <div className="absolute -right-16 -top-16 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -left-16 -bottom-16 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="pn-paywall-intro space-y-3">
        <div className="inline-flex items-center gap-2 bg-amber-400/15 border border-amber-400/30 text-amber-300 text-xs font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-md">
          <Lock className="w-3.5 h-3.5 text-amber-400" />
          <span>Members-Only Access Required</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight">
          Join <span className="text-amber-400">{network?.name}</span> to Unlock{" "}
          {title || "Full Access"}
        </h2>
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
          {desc ||
            network?.tagline ||
            network?.description ||
            "Join fellow tax practitioners and gain direct access to private feeds, document vaults, live Pro Talks, and exclusive templates."}
        </p>
      </div>

      {/* Pricing and Host Direct Payout Guarantee */}
      <div className="max-w-xl mx-auto bg-white/5 border border-white/10 rounded-2xl p-5 text-center space-y-2 relative z-10 backdrop-blur-md">
        <div className="flex items-baseline justify-center gap-1.5">
          <span className="text-3xl sm:text-4xl font-black text-amber-400">
            {network && network.monthlyPrice > 0
              ? `$${network.monthlyPrice.toFixed(2)}`
              : "FREE"}
          </span>
          {network && network.monthlyPrice > 0 && (
            <span className="text-xs font-bold text-slate-300">/ month</span>
          )}
        </div>
        <div className="flex items-center justify-center gap-2 text-xs font-semibold text-emerald-400">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>
            {network && network.monthlyPrice > 0 ? (
              <>
                0% Platform Commission — 100% of your membership goes directly
                to host <strong>{network.owner.name}</strong>
              </>
            ) : (
              "Free Network Access — 100% free for all verified tax professionals"
            )}
          </span>
        </div>
      </div>

      {/* Unlocked Member Benefits Grid */}
      <div className="max-w-2xl mx-auto space-y-3 relative z-10">
        <h4 className="text-xs font-black uppercase tracking-wider text-slate-300 text-center">
          Everything Included In Your Membership:
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {(network?.memberBenefits && network.memberBenefits.length > 0
            ? network.memberBenefits
            : [
                "Private Network Discussion Board & Audit Q&A",
                "Members-Only Resource & Workpaper Vault",
                "Exclusive Live Pro Talks & Strategy Workshops",
                "Direct Messaging & Consultation Access to Host",
                "Private Member Directory & Network Chat",
                "Custom Verified Pro Network Member Badge",
              ]
          ).map((b, idx) => (
            <div
              key={idx}
              className="flex items-center gap-2.5 p-3 rounded-xl bg-white/5 border border-white/5 text-xs font-bold text-slate-200"
            >
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
            <div className="text-xs font-bold text-white">
              Your Custom Member Badge
            </div>
            <div className="text-[11px] text-slate-400">
              Displayed across Tax Compliance Pro
            </div>
          </div>
          <NetworkBadge
            shape={network.badgeShape}
            initials={network.badgeInitials || "PRO"}
            text={network.badgeText || "MEMBER"}
            icon={network.badgeIcon || "Star"}
            bgColor={network.badgeBgColor || "#0a1628"}
            textColor={network.badgeTextColor || "#ffbe24"}
            borderColor={network.badgeBorderColor || "#ffbe24"}
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
              <span>
                {network && network.monthlyPrice > 0
                  ? "Connecting to Checkout..."
                  : "Activating Free Membership..."}
              </span>
            </>
          ) : (
            <>
              <Crown className="w-5 h-5" />
              <span>
                {network && network.monthlyPrice > 0
                  ? `Join Now & Unlock Access — $${network.monthlyPrice.toFixed(2)}/mo`
                  : "Join Now & Unlock Free Access"}
              </span>
            </>
          )}
        </button>
        <p className="text-[11px] text-slate-400 mt-2">
          {network && network.monthlyPrice > 0
            ? "Secure Stripe checkout • Cancel anytime • Instant access"
            : "Free membership • No credit card required • Instant access"}
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
      const res = await fetch(`/api/pro-networks/${slug}/follow`, {
        method: "POST",
      });
      if (res.ok) {
        const data = await res.json();
        setNetwork((prev) =>
          prev
            ? {
                ...prev,
                isFollowing: data.following,
                followerCount: data.following
                  ? prev.followerCount + 1
                  : Math.max(0, prev.followerCount - 1),
              }
            : null,
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleEventRsvp = async (eventId: string) => {
    if (!network?.isMember) return;
    try {
      const res = await fetch(
        `/api/pro-networks/${slug}/events/${eventId}/rsvp`,
        {
          method: "POST",
        },
      );
      if (res.ok) {
        const data = await res.json();
        setEventsList((prev) =>
          prev.map((e) =>
            e.id === eventId
              ? {
                  ...e,
                  isRegistered: data.registered,
                  rsvpCount: data.registered
                    ? e.rsvpCount + 1
                    : Math.max(0, e.rsvpCount - 1),
                }
              : e,
          ),
        );
      }
    } catch (err) {
      console.error(err);
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
        const thumbRes = await fetch("/api/upload", {
          method: "POST",
          body: thumbFd,
        });
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

      const sizeFormatted =
        resourceFile.size > 1024 * 1024
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
        if (refreshRes.ok)
          setResourcesList((await refreshRes.json()).resources || []);
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
            scheduledAt:
              proTalkScheduleDate ||
              new Date(Date.now() + 86400000).toISOString(),
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
          if (refreshRes.ok)
            setEventsList((await refreshRes.json()).events || []);
        }
      }
    } catch (err) {
      console.error(err);
      alert("Failed to create Pro Talk.");
    } finally {
      setCreatingProTalk(false);
    }
  };

  const handleCopyInviteLink = () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  const searchTerm = searchQuery.trim().toLowerCase();
  const matchesSearch = (...values: (string | null | undefined)[]) =>
    !searchTerm ||
    values.filter(Boolean).join(" ").toLowerCase().includes(searchTerm);
  const filteredDiscussions = discussions.filter((item) =>
    matchesSearch(item.title, item.content, item.author?.name),
  );
  const filteredMedia = mediaList.filter((item) =>
    matchesSearch(item.title, item.description, item.type),
  );
  const filteredResources = resourcesList.filter((item) =>
    matchesSearch(item.title, item.description, item.fileType),
  );
  const filteredEvents = eventsList.filter((item) =>
    matchesSearch(item.title, item.description),
  );
  const filteredMembers = membersList.filter((item) =>
    matchesSearch(item.user?.name, item.user?.professionalTitle, item.user?.headline, item.user?.location),
  );
  const filteredChat = chatMessages.filter((item) =>
    matchesSearch(item.content, item.sender?.name),
  );
  if (!loading && (loadError || !network))
    return (
      <div className="pn-page pn-hub-status">
        <Lock size={35} />
        <h1>{loadError || "This network is unavailable."}</h1>
        <button className="pn-button pn-primary" onClick={fetchNetworkDetails}>
          Try again
        </button>
        <Link href="/pro-networks">Back to all networks</Link>
      </div>
    );
  if (loading || !network) return <NetworkSkeleton />;
  const canManage = network.canManage === true;
  const currentTab = activeTab === "manage" && !canManage ? "home" : activeTab;

  return (
    <div className="pn-page pn-hub" style={{"--pn-accent": network.accentColor || "#65a832", "--pn-accent-ink": networkAccentInk(network.accentColor || "#65a832")} as React.CSSProperties}>
      {/* ── MAIN LAYOUT: Sidebar + Tabs + 100% Dynamic Content ── */}
      <div className="pn-hub-layout">
        {/* Left Internal Network Navigation Sidebar */}
        <aside className="pn-hub-sidebar">
          <div className="bg-white dark:bg-[#121e33] border border-slate-200 dark:border-white/10 rounded-3xl p-4 shadow-sm space-y-6">
            <div className="np-sidebar-identity">
              <h2>Pro Network</h2>
              {network.logoImage && <img src={network.logoImage} alt="" />}
              <strong>{network.name}</strong>
              <span>{network._count.members} members</span>
            </div>
            {/* YOUR NETWORK Section */}
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 px-3 mb-2">
                THIS NETWORK
              </p>
              <div className="space-y-1">
                {[
                  { id: "home", label: "Posts", icon: Home },
                  { id: "media", label: "Media Gallery", icon: Images },
                  { id: "resources", label: "Resources", icon: FolderDown },
                  { id: "protalks", label: "Pro Talks", icon: Radio },
                  { id: "events", label: "Events", icon: Calendar },
                  { id: "members", label: "Members", icon: Users },
                  { id: "chat", label: "Members Chat", icon: MessagesSquare },
                ].map((item) => {
                  const Icon = item.icon;
                  const isActive = currentTab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setActiveTab(item.id as typeof activeTab);
                        setSearchQuery("");
                      }}
                      aria-pressed={isActive}
                      className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all text-left ${
                        isActive
                          ? "bg-blue-600 text-white font-black shadow-md"
                          : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5"
                      }`}
                    >
                      <Icon
                        className={`w-4 h-4 shrink-0 ${isActive ? "text-white" : "text-slate-400"}`}
                      />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* NETWORK TOOLS (For Owner/Admin) */}
            {canManage && (
              <div className="pt-4 border-t border-slate-100 dark:border-white/10">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 px-3 mb-2">
                  NETWORK TOOLS
                </p>
                <div className="space-y-1">
                  <button
                    type="button"
                    onClick={() => setActiveTab("manage")}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all text-left ${
                      currentTab === "manage"
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
                    onClick={() => setActiveTab("events")}
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
                    <span className="text-[10px] font-normal text-slate-400">
                      Contact Support
                    </span>
                  </span>
                </span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </Link>
            </div>
          </div>
        </aside>

        {/* Center & Right Main Content Area */}
        <main className="pn-hub-main">
          <Link className="pn-back np-inline-back" href="/pro-networks"><ChevronLeft size={17} /> All networks</Link>
          {currentTab === "home" && (
            <section className="np-network-hero">
              <div className="np-network-cover">
                {network.coverImage ? <img src={network.coverImage} alt="" /> : <Users size={64} />}
                <span className="np-cover-label"><Lock size={14} /> Private network</span>
              </div>
              <div className="np-network-identity">
                <div>
                  <h1>{network.name}</h1>
                  <div className="np-meta"><Users size={15} /> {network._count.members} members <span>·</span> {network._count.discussions} posts {network.isMember || network.isOwner ? <span>· You're a member</span> : null}</div>
                  {network.tagline && <p>{network.tagline}</p>}
                </div>
                <div className="pn-header-actions">
            {!network.isMember && !network.isOwner && (
              <button
                className="pn-button pn-primary"
                disabled={joining}
                onClick={handleJoinNetwork}
              >
                {joining
                  ? "Joining…"
                  : network.monthlyPrice > 0
                    ? "Join $" + network.monthlyPrice.toFixed(2) + "/mo"
                    : "Join for free"}
                <span>
                  <ArrowRight size={16} />
                </span>
              </button>
            )}
            {canManage && (
              <button
                className="pn-button pn-secondary"
                onClick={openEditPricingModal}
              >
                <Pencil size={15} />
                Edit pricing
              </button>
            )}
            <button
              className="pn-button pn-secondary"
              onClick={() => setShowInviteModal(true)}
              aria-label="Invite members"
            >
              <UserPlus size={16} />
              <span className="pn-invite-label">Invite</span>
            </button>
            <button
              className="pn-icon-button"
              onClick={handleToggleFollow}
              aria-label={
                network.isFollowing ? "Unfollow network" : "Follow network"
              }
              aria-pressed={network.isFollowing}
            >
              <Bell size={18} />
            </button>
          </div>
              </div>
              <nav className="np-network-tabs" aria-label="Network shortcuts">
                <button aria-current="page" onClick={() => setActiveTab("home")}><MessageSquare size={17} /> Posts</button>
                <button onClick={() => setActiveTab("members")}><Users size={17} /> Members</button>
                <button onClick={() => setActiveTab("events")}><Calendar size={17} /> Events</button>
                {canManage && <button onClick={() => setActiveTab("manage")}><Settings size={17} /> Settings</button>}
              </nav>
            </section>
          )}

          <div className="pn-hub-toolbar">
            <div>
              <span className="pn-eyebrow">{network.category}</span>
              <h2>
                {currentTab === "manage"
                  ? "Network settings"
                  : NETWORK_TABS.find((item) => item.id === currentTab)?.label}
              </h2>
            </div>
            <div className="pn-hub-search pn-search">
              <Search size={17} />
              <input
                aria-label="Search this network"
                placeholder="Search this network…"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
              />
              {searchQuery && (
                <button
                  aria-label="Clear search"
                  onClick={() => setSearchQuery("")}
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>
          <div className="pn-mobile-navigation">
            <label htmlFor="network-section">Explore your network</label>
            <select
              id="network-section"
              value={currentTab}
              onChange={(event) => {
                setActiveTab(event.target.value as typeof activeTab);
                setSearchQuery("");
              }}
            >
              {NETWORK_TABS.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
              {canManage && (
                <option value="manage">Manage network</option>
              )}
            </select>
          </div>
          {searchTerm && (
            <div className="pn-search-summary" role="status">
              Showing matches for “{searchQuery}” in this section.{" "}
              <button onClick={() => setSearchQuery("")}>Clear search</button>
            </div>
          )}
          {currentTab === "home" && (
            <div className="np-workspace">
              <div>
                {!network.isMember && !network.isOwner ? renderPaywall() : (
                  <NetworkPosts slug={slug} posts={filteredDiscussions} user={session?.user} loading={postsLoading} loadError={postsError} onRetry={fetchPosts}
                    canPost={network.isMember || network.isOwner} searching={Boolean(searchQuery)}
                    onCreated={(post) => {
                      setDiscussions(previous => [...previous, post].sort((a, b) => Number(Boolean(b.isPinned)) - Number(Boolean(a.isPinned)) || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
                      setNetwork(previous => previous ? { ...previous, _count: { ...previous._count, discussions: previous._count.discussions + 1 } } : previous);
                    }} />
                )}
              </div>
              <aside className="np-details">
                <section className="np-card np-info"><h3>About this network</h3><p>{network.description}</p><div className="np-info-line"><Lock size={17} /> Private member conversations</div><button className="np-info-line" onClick={() => setActiveTab("members")}><Users size={17} /> {network._count.members} members <ChevronRight size={15} /></button></section>
                {announcements.length > 0 && <section className="np-card np-info"><h3><Bell size={18} /> Network announcement</h3><strong>{announcements[0].title}</strong><p className="np-announcement">{announcements[0].content}</p></section>}
                <section className="np-card np-info"><h3><Calendar size={18} /> Events & Pro Talks</h3><p>Make time to connect, learn, and share with your network.</p><button className="pn-button pn-secondary" onClick={() => setActiveTab("events")}>Open calendar <ArrowRight size={16} /></button></section>
                <section className="np-card np-info"><h3><FolderDown size={18} /> Resource library</h3><p>{network._count.resources} resources shared with this network.</p><button className="np-text-button" onClick={() => setActiveTab("resources")}>Browse resources <ChevronRight size={16} /></button></section>
              </aside>
            </div>
          )}

          {currentTab === "media" &&
            (!network.isMember && !network.isOwner ? (
              renderPaywall(
                "Media & Video Recordings",
                "Recorded workshops, backstage recaps, and video breakdowns.",
              )
            ) : (
              <div className="bg-white dark:bg-[#121e33] border border-slate-200 dark:border-white/10 rounded-3xl p-6 shadow-sm space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/10 pb-4">
                  <div>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white">
                      Media &amp; Video Recordings
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Recorded workshops, backstage recaps, and video
                      breakdowns.
                    </p>
                  </div>

                  {canManage && (
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

                {filteredMedia.length === 0 ? (
                  <div className="text-center py-16 text-xs text-slate-400 space-y-3">
                    <Images className="w-10 h-10 text-slate-400 mx-auto" />
                    <p className="font-bold text-sm">
                      {searchTerm
                        ? "No matches in this section."
                        : "No media files uploaded yet."}
                    </p>
                    {canManage && (
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
                    {filteredMedia.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => setSelectedMediaItem(item)}
                        className="group rounded-2xl overflow-hidden bg-slate-900 cursor-pointer shadow-md hover:shadow-xl transition-all"
                      >
                        <div className="relative h-44 bg-slate-800">
                          {item.thumbnailUrl ||
                          (item.type === "PHOTO" && item.url) ? (
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
                          <h4 className="text-xs font-black truncate">
                            {item.title}
                          </h4>
                          <p className="text-[10px] text-slate-400 mt-1">
                            {new Date(item.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}

          {/* ── TAB 4: RESOURCES FULL TAB ── */}
          {currentTab === "resources" &&
            (!network.isMember && !network.isOwner ? (
              renderPaywall(
                "Exclusive Resource Vault",
                "Download proprietary guides, questionnaires, checklists, and templates.",
              )
            ) : (
              <div className="bg-white dark:bg-[#121e33] border border-slate-200 dark:border-white/10 rounded-3xl p-6 shadow-sm space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/10 pb-4">
                  <div>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white">
                      Exclusive Resource Vault
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Download proprietary guides, questionnaires, checklists,
                      and templates.
                    </p>
                  </div>

                  {canManage && (
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

                {filteredResources.length === 0 ? (
                  <div className="text-center py-16 text-xs text-slate-400 space-y-3">
                    <FolderDown className="w-10 h-10 text-slate-400 mx-auto" />
                    <p className="font-bold text-sm">
                      {searchTerm
                        ? "No matches in this section."
                        : "No resources in the vault yet."}
                    </p>
                    {canManage && (
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
                    {filteredResources.map((item) => (
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
                              {item.fileType}{" "}
                              {item.fileSize ? `• ${item.fileSize}` : ""}
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
            ))}

          {(currentTab === "events" || currentTab === "protalks") &&
            (!network.isMember && !network.isOwner ? renderPaywall("Network events", "Join to attend live events and workshops.") :
              <NetworkEvents slug={slug} isOwner={canManage} onEventsChange={setEventsList} />)}

          {/* ── TAB 6: MEMBERS CHAT ── */}
          {currentTab === "chat" &&
            (!network.isMember && !network.isOwner ? (
              renderPaywall(
                "Members Live Chat",
                "Chat in real-time with verified network members.",
              )
            ) : (
              <div className="pn-member-chat bg-white dark:bg-[#121e33] border border-slate-200 dark:border-white/10 rounded-3xl overflow-hidden shadow-sm flex flex-col h-[650px]">
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
                  {filteredChat.length === 0 ? (
                    <div className="text-center py-16 text-xs text-slate-400 space-y-2">
                      <MessagesSquare className="w-8 h-8 text-slate-400 mx-auto" />
                      <p className="font-bold">
                        Welcome to the #{chatChannel} channel!
                      </p>
                      <p>Be the first member to say hello.</p>
                    </div>
                  ) : (
                    filteredChat.map((msg) => (
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
            ))}

          {/* ── TAB 7: MEMBERS DIRECTORY ── */}
          {currentTab === "members" &&
            (!network.isMember && !network.isOwner ? (
              renderPaywall(
                "Members Directory",
                "Connect and collaborate directly with fellow network members.",
              )
            ) : (
              <div className="bg-white dark:bg-[#121e33] border border-slate-200 dark:border-white/10 rounded-3xl p-6 shadow-sm space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/10 pb-4 flex-wrap gap-3">
                  <div>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                      <Users className="w-5 h-5 text-amber-500" />
                      <span>
                        Network Member Directory (
                        {network.memberCount.toLocaleString()})
                      </span>
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Connect, hover, and collaborate directly with fellow
                      network members.
                    </p>
                  </div>

                  {/* View Switcher: Bubble Galaxy vs Directory Grid */}
                  <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-white/10 text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => setMemberViewMode("bubble")}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                        memberViewMode === "bubble"
                          ? "bg-amber-400 text-[#0a1628] font-black shadow-xs"
                          : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Bubble Galaxy</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setMemberViewMode("grid")}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                        memberViewMode === "grid"
                          ? "bg-amber-400 text-[#0a1628] font-black shadow-xs"
                          : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                      }`}
                    >
                      <LayoutGrid className="w-3.5 h-3.5" />
                      <span>Directory Grid</span>
                    </button>
                  </div>
                </div>

                <ProfessionalTitleEditor onSaved={() => { fetch(`/api/pro-networks/${slug}/members`).then(r => r.json()).then(data => setMembersList(data.members || [])).catch(() => {}); }} />
                {/* ── BUBBLE GALAXY VIEW ── */}
                {memberViewMode === "bubble" ? (
                  <MemberBubbleCloud
                    members={filteredMembers}
                    networkName={network.name}
                    isOwner={network.isOwner}
                    onInviteClick={() => setShowInviteModal(true)}
                  />
                ) : (
                  /* ── TRADITIONAL DIRECTORY GRID VIEW ── */
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {filteredMembers.map((m) => (
                      <div
                        key={m.id}
                        className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 flex items-center justify-between gap-3 shadow-sm hover:border-amber-400/30 transition-all"
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
                              <div className="w-full h-full flex items-center justify-center font-black text-sm text-amber-400">
                                {m.user.name
                                  ? m.user.name[0].toUpperCase()
                                  : "?"}
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-xs font-black text-slate-900 dark:text-white truncate flex items-center gap-1">
                              <span>{m.user.name}</span>
                              {m.role.toUpperCase() === "OWNER" && (
                                <Crown className="w-3 h-3 text-amber-400 fill-amber-400 shrink-0" />
                              )}
                            </h4>
                            <p className="text-[10px] text-slate-400 truncate">
                              {m.user.professionalTitle || m.user.headline ||
                                m.user.location ||
                                "Tax Professional"}
                            </p>
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.2 rounded mt-1 inline-block ${
                                m.role.toUpperCase() === "OWNER"
                                  ? "text-amber-500 bg-amber-500/10"
                                  : "text-blue-500 bg-blue-500/10"
                              }`}
                            >
                              {m.role}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <Link
                            href={`/messages?userId=${m.user.id}`}
                            className="p-2 rounded-xl bg-blue-600/10 hover:bg-blue-600 text-blue-600 hover:text-white transition-colors"
                            title="Send Direct Message"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}

          {/* ── TAB 8: OWNER MANAGEMENT DASHBOARD ── */}
          {currentTab === "manage" && canManage && (
            <div className="bg-white dark:bg-[#121e33] border border-slate-200 dark:border-white/10 rounded-3xl p-6 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/10 pb-4">
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">
                    Network Owner Management Dashboard
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Track members, subscription earnings (0% TCP fee), and
                    upload exclusive content.
                  </p>
                </div>
              </div>

              {/* Key Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 space-y-1">
                  <span className="text-xs text-slate-400 font-bold">
                    Total Members
                  </span>
                  <div className="text-2xl font-black text-slate-900 dark:text-white">
                    {network.memberCount.toLocaleString()}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 space-y-1">
                  <span className="text-xs text-slate-400 font-bold">
                    Monthly Revenue
                  </span>
                  <div className="text-2xl font-black text-emerald-500">
                    $
                    {(
                      network.memberCount * network.monthlyPrice
                    ).toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                    })}
                  </div>
                  <span className="text-[10px] text-emerald-600 font-bold">
                    0% TCP Fee Deducted
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 space-y-1">
                  <span className="text-xs text-slate-400 font-bold">
                    Total Followers
                  </span>
                  <div className="text-2xl font-black text-slate-900 dark:text-white">
                    {network.followerCount.toLocaleString()}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400 font-bold">
                      Monthly Price
                    </span>
                    <button
                      type="button"
                      onClick={openEditPricingModal}
                      className="text-[11px] font-bold text-amber-500 hover:text-amber-400 inline-flex items-center gap-1 hover:underline"
                    >
                      <Pencil className="w-3 h-3" />
                      <span>Edit</span>
                    </button>
                  </div>
                  <div className="text-2xl font-black text-amber-500">
                    {network.monthlyPrice <= 0
                      ? "FREE"
                      : `$${network.monthlyPrice.toFixed(2)}/mo`}
                  </div>
                </div>
              </div>

              {/* Pricing Update Success Alert */}
              {pricingSuccessMsg && (
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>{pricingSuccessMsg}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setPricingSuccessMsg("")}
                    className="text-emerald-600 hover:text-emerald-800 p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              <NetworkDetailsSettings slug={slug} initial={{name:network.name,tagline:network.tagline,description:network.description,rules:network.rules,welcomeMessage:network.welcomeMessage}} onSaved={details => setNetwork(previous => previous ? {...previous,...details} : previous)} />
              <NetworkBranding slug={slug} initial={{accentColor:network.accentColor || "#65a832", logoImage:network.logoImage, coverImage:network.coverImage}} onSaved={branding => setNetwork(previous => previous ? {...previous,...branding} : previous)} />
              <section className="pn-settings-card"><h3>Bots &amp; integrations</h3><p>Network-specific bots are not available yet. You can open Atlas AI from the site navigation for personal assistance.</p></section>
              {/* ── Network Pricing & Subscription Model Settings ── */}
              <div className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-6 space-y-4">
                <div className="flex items-start sm:items-center justify-between gap-4 flex-col sm:flex-row border-b border-slate-200/60 dark:border-white/10 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-400/15 flex items-center justify-center shrink-0">
                      <DollarSign className="w-5 h-5 text-amber-500" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-black text-slate-900 dark:text-white text-base">
                          Network Pricing &amp; Membership Model
                        </h4>
                        <span
                          className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                            network.monthlyPrice <= 0
                              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                              : "bg-amber-400/15 text-amber-700 dark:text-amber-300"
                          }`}
                        >
                          {network.monthlyPrice <= 0
                            ? "Active: Free Network"
                            : `Active: $${network.monthlyPrice.toFixed(2)} / month`}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Set your membership dues or make this Pro Network free
                        to join anytime. Changes apply to new signups; existing subscriptions retain their current billing terms.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={openEditPricingModal}
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-[#0a1628] font-black text-xs px-5 py-2.5 rounded-xl transition-all shadow-md hover:scale-105 active:scale-95 shrink-0"
                  >
                    <Pencil className="w-4 h-4" />
                    <span>Change Network Pricing</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div className="p-4 rounded-xl bg-white dark:bg-black/20 border border-slate-200/60 dark:border-white/5 space-y-1">
                    <div className="text-[10px] uppercase tracking-wider text-slate-400 font-black">
                      Current Access Mode
                    </div>
                    <div className="text-sm font-black text-slate-900 dark:text-white">
                      {network.monthlyPrice <= 0
                        ? "Free Network ($0.00/mo)"
                        : `$${network.monthlyPrice.toFixed(2)} USD / month`}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {network.monthlyPrice <= 0
                        ? "Members can join immediately with zero payment or credit card entry."
                        : "Subscribers pay via Stripe. Dues are charged directly to your connected account; Stripe deducts its processing fees and the platform takes 0%."}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-white dark:bg-black/20 border border-slate-200/60 dark:border-white/5 space-y-1">
                    <div className="text-[10px] uppercase tracking-wider text-slate-400 font-black">
                      Projected Monthly Earnings
                    </div>
                    <div className="text-sm font-black text-emerald-500">
                      $
                      {(
                        network.memberCount * network.monthlyPrice
                      ).toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                      })}
                      /mo
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Based on {network.memberCount} active member
                      {network.memberCount === 1 ? "" : "s"} with 0% platform
                      commission taken by TCP.
                    </p>
                  </div>
                </div>
              </div>

              {/* ── Host Stripe Connect Integration Card (0% Platform Fee) ── */}
              <div className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-6 space-y-5">
                <div className="flex items-start sm:items-center justify-between gap-4 flex-col sm:flex-row border-b border-slate-200/60 dark:border-white/10 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#6772e5]/15 flex items-center justify-center shrink-0">
                      <svg
                        viewBox="0 0 24 24"
                        className="w-5 h-5 fill-[#6772e5]"
                      >
                        <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.591-7.305z" />
                      </svg>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-black text-slate-900 dark:text-white text-base">
                          Host Stripe Connect Account
                        </h4>
                        {stripeStatus?.connected && stripeStatus?.onboarded ? (
                          <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-0.5 rounded-full">
                            <CheckCircle2 className="w-3 h-3" /> Connected &amp;
                            Active
                          </span>
                        ) : stripeStatus?.connected &&
                          !stripeStatus?.onboarded ? (
                          <span className="flex items-center gap-1 text-[11px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-500/10 px-2.5 py-0.5 rounded-full">
                            <AlertCircle className="w-3 h-3" /> Incomplete
                            Onboarding
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[11px] font-bold text-rose-600 bg-rose-50 dark:bg-rose-500/10 px-2.5 py-0.5 rounded-full">
                            <AlertCircle className="w-3 h-3" /> Not Connected
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Receive member subscription payments directly; Stripe processing fees are deducted from your account
                        into your bank account (0% TCP platform cut).
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
                        Connect your Stripe account to receive direct member
                        payouts
                      </div>
                      <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-300">
                        When members pay ${network.monthlyPrice.toFixed(2)}/mo
                        to join your Pro Network, Stripe routes 100% of the
                        recurring membership revenue directly into your
                        connected bank account.
                      </p>
                    </div>
                  </div>
                )}

                {/* Account Details if connected */}
                {stripeStatus?.connected && stripeStatus?.accountDetails && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      {
                        label: "Stripe Email",
                        value: stripeStatus.accountDetails.email ?? "—",
                      },
                      {
                        label: "Charges",
                        value: stripeStatus.accountDetails.chargesEnabled
                          ? "Enabled"
                          : "Disabled",
                      },
                      {
                        label: "Payouts",
                        value: stripeStatus.accountDetails.payoutsEnabled
                          ? "Enabled"
                          : "Disabled",
                      },
                      {
                        label: "Account ID",
                        value:
                          (stripeStatus.accountId?.slice(0, 16) ?? "—") + "…",
                      },
                    ].map((s) => (
                      <div
                        key={s.label}
                        className="bg-white dark:bg-black/20 rounded-xl px-3.5 py-2.5 border border-slate-200/60 dark:border-white/5"
                      >
                        <div className="text-[10px] text-slate-400 font-semibold">
                          {s.label}
                        </div>
                        <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {s.value}
                        </div>
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
                      {connectingStripe ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <ExternalLink className="w-4 h-4" />
                      )}
                      <span>
                        {connectingStripe
                          ? "Connecting..."
                          : "Connect Stripe Account"}
                      </span>
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
                          {connectingStripe ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <AlertCircle className="w-4 h-4" />
                          )}
                          <span>
                            {connectingStripe
                              ? "Loading..."
                              : "Complete Stripe Onboarding"}
                          </span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={handleDisconnectStripe}
                        disabled={disconnectingStripe}
                        className="inline-flex items-center gap-2 text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 font-bold text-xs px-4 py-2.5 rounded-xl transition-all disabled:opacity-60"
                      >
                        {disconnectingStripe ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : null}
                        <span>
                          {disconnectingStripe
                            ? "Disconnecting..."
                            : "Disconnect Stripe"}
                        </span>
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
                    Upload masterclass recordings and training clips via
                    Cloudinary.
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
                  onClick={() => setActiveTab("events")}
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
                : `Join ${network.name} (${network.monthlyPrice > 0 ? `$${network.monthlyPrice.toFixed(2)}/mo` : "FREE"}) to unlock full access to all private feeds, resources, and live Pro Talks.`}
            </span>
          </div>
        </main>
      </div>

      {/* ── MODAL: Upload Media (Cloudinary) ── */}
      {showUploadMediaModal && (
        <div className="pn-modal fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
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
                  onChange={(e) =>
                    setMediaThumbnailFile(e.target.files?.[0] || null)
                  }
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
        <div className="pn-modal fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
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
        <div className="pn-modal fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
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
                    <span>
                      {isGoLiveImmediate
                        ? "Launch Live Room Now"
                        : "Schedule Pro Talk"}
                    </span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: Invite Members ── */}
      {showInviteModal && (
        <div className="pn-modal fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#172135] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-blue-600/20 text-blue-500 mx-auto flex items-center justify-center">
              <UserPlus className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-black text-slate-900 dark:text-white">
              Invite Professionals to {network.name}
            </h3>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Share your direct network link to enroll colleagues and
              practitioners.
            </p>

            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={
                  typeof window !== "undefined" ? window.location.href : ""
                }
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
        <div className="pn-modal fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#0f1a2e] border border-white/15 rounded-3xl p-6 max-w-3xl w-full shadow-2xl space-y-4 text-white">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-black truncate">
                {selectedMediaItem.title}
              </h3>
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
                  <p className="text-xs text-slate-400">
                    Join this Pro Network to stream full videos.
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 pt-2">
              <span>
                {selectedMediaItem.duration
                  ? `Duration: ${selectedMediaItem.duration}`
                  : "Media Vault"}
              </span>
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

      {/* ── MODAL: Update Network Pricing ── */}
      {showEditPricingModal && (
        <div className="pn-modal fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#172135] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/10 pb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-amber-500" />
                  <span>Update Network Pricing</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Change your monthly dues or make your Pro Network completely
                  free.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowEditPricingModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Model Selector */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Choose Access &amp; Pricing Model
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Free Option */}
                <button
                  type="button"
                  onClick={() => {
                    setEditPriceType("free");
                    setEditMonthlyPrice("0");
                  }}
                  className={`p-4 rounded-2xl border text-left transition-all ${
                    editPriceType === "free"
                      ? "border-emerald-500 bg-emerald-500/10 dark:bg-emerald-500/15 ring-2 ring-emerald-500/30"
                      : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-[#1a263d]"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="inline-flex items-center gap-1.5 text-xs font-black text-emerald-600 dark:text-emerald-400">
                      <Sparkles className="w-4 h-4 text-emerald-500" />
                      <span>Free Network</span>
                    </span>
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                      $0 / mo
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                    100% free. Members join instantly without entering payment
                    information.
                  </p>
                </button>

                {/* Paid Option */}
                <button
                  type="button"
                  onClick={() => {
                    setEditPriceType("paid");
                    if (parseFloat(editMonthlyPrice || "0") <= 0) {
                      setEditMonthlyPrice("19.99");
                    }
                  }}
                  className={`p-4 rounded-2xl border text-left transition-all ${
                    editPriceType === "paid"
                      ? "border-amber-400 bg-amber-400/10 dark:bg-amber-400/15 ring-2 ring-amber-400/30"
                      : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-[#1a263d]"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="inline-flex items-center gap-1.5 text-xs font-black text-amber-500 dark:text-amber-400">
                      <Crown className="w-4 h-4 text-amber-400" />
                      <span>Paid Dues</span>
                    </span>
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-800 dark:text-amber-300">
                      Custom Price
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                    Set recurring dues. 0% platform fee — 100% direct payouts
                    via Stripe.
                  </p>
                </button>
              </div>

              {/* Price Details if Paid */}
              {editPriceType === "paid" ? (
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#121e33] border border-slate-200 dark:border-slate-700 space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Monthly Member Dues ($ USD / month)
                    </label>
                    {/* Presets */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {["9.99", "19.99", "29.99", "49.99", "99.00"].map(
                        (preset) => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => setEditMonthlyPrice(preset)}
                            className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${
                              editMonthlyPrice === preset
                                ? "bg-amber-400 text-[#0a1628] font-black shadow-xs"
                                : "bg-white dark:bg-white/5 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100"
                            }`}
                          >
                            ${preset}
                          </button>
                        ),
                      )}
                    </div>
                  </div>

                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-400">
                      $
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      placeholder="e.g. 29.99"
                      value={editMonthlyPrice}
                      onChange={(e) => {
                        const val = e.target.value;
                        setEditMonthlyPrice(val);
                        if (parseFloat(val) <= 0) {
                          setEditPriceType("free");
                        }
                      }}
                      className="w-full pl-8 pr-16 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 font-black text-sm text-slate-900 dark:text-white bg-white dark:bg-[#1a263d]"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                      USD / mo
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs space-y-1">
                  <div className="flex items-center gap-2 font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Free Network Membership ($0.00 / month)</span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                    Existing and new members will have instant access to your
                    private board and resources without requiring payment.
                  </p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100 dark:border-white/10">
              <button
                type="button"
                onClick={() => setShowEditPricingModal(false)}
                disabled={savingPrice}
                className="px-5 py-2.5 rounded-full border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSavePricing}
                disabled={savingPrice}
                className="px-6 py-2.5 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 text-[#0a1628] font-black text-xs hover:from-amber-300 hover:to-amber-400 shadow-md hover:scale-105 active:scale-95 disabled:opacity-50 inline-flex items-center gap-2"
              >
                {savingPrice ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving Pricing...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Save Pricing Changes</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
