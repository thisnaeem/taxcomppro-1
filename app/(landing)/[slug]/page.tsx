"use client";

import { useEffect, useState } from "react";
import { useParams, notFound, useRouter } from "next/navigation";
import Link from "next/link";
import { useAppSelector } from "@/store/hooks";
import {
  Loader2, Download, ExternalLink, Play, BookOpen, Clock,
  Users, CheckCircle2, ChevronDown, ChevronUp, Lock, FileText,
  HelpCircle, Award, Sparkles, Star, X
} from "lucide-react";
import {
  ArrowLeft01Icon, StarIcon, EyeIcon, ShoppingBag01Icon,
  GlobeIcon, Briefcase01Icon, School01Icon, BookOpen01Icon,
  Tag01Icon, ArrowRight01Icon, Share01Icon, Flag01Icon,
  CrownIcon, Clock01Icon,
} from "hugeicons-react";

interface Lesson {
  id: string;
  title: string;
  description: string | null;
  duration: number;
  order: number;
  isFree: boolean;
  contentType: "VIDEO" | "TEXT" | "QUIZ";
  downloadUrl?: string | null;
  downloadName?: string | null;
}

interface Section {
  id: string;
  title: string;
  order: number;
  lessons: Lesson[];
}

interface CourseData {
  id: string;
  slug: string;
  title: string;
  description: string;
  thumbnail: string | null;
  level: string;
  category: string;
  price: number;
  isFree: boolean;
  totalDuration: number;
  tags: string[];
  learningOutcomes: string[];
  requirements: string[];
  instructor: { id: string; name: string; image: string | null; headline: string | null; role?: string };
  sections: Section[];
  _count: { enrollments: number };
  totalLessons: number;
  isEnrolled: boolean;
}

interface Listing {
  id: string;
  slug: string | null;
  title: string;
  description: string;
  category: string;
  price: number | null;
  tags: string[];
  images: string[];
  metadata: Record<string, string> | null;
  hasPurchased?: boolean;
  isFeatured: boolean;
  viewCount: number;
  createdAt: string;
  user: { id: string; name: string; image: string | null; headline: string | null; role: string; tier: string };
  course?: CourseData | null;
}

const CAT_CONFIG: Record<string, {
  label: string; icon: React.ElementType;
  pill: string; cta: string; ctaCls: string;
}> = {
  SERVICE:  { label: "Service",  icon: Briefcase01Icon, pill: "bg-blue-100 text-blue-700",       cta: "Learn More",   ctaCls: "bg-blue-600 hover:bg-blue-700 text-white" },
  PRODUCT:  { label: "Product",  icon: ShoppingBag01Icon, pill: "bg-amber-100 text-amber-700",   cta: "Buy Now",      ctaCls: "bg-[#0a1628] hover:bg-[#1a3a6b] text-white" },
  NETWORK:  { label: "Network",  icon: GlobeIcon,       pill: "bg-emerald-100 text-emerald-700", cta: "Join Network", ctaCls: "bg-emerald-600 hover:bg-emerald-700 text-white" },
  TRAINING: { label: "Course",   icon: School01Icon,    pill: "bg-purple-100 text-purple-700",   cta: "Enroll in Course", ctaCls: "bg-purple-600 hover:bg-purple-700 text-white" },
};
const DEFAULT_CFG = { label: "Other", icon: BookOpen01Icon, pill: "bg-slate-100 text-slate-600", cta: "View", ctaCls: "bg-[#0a1628] hover:bg-[#1a3a6b] text-white" };

const LEVEL_COLORS: Record<string, string> = {
  BEGINNER: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300",
  INTERMEDIATE: "bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300",
  ADVANCED: "bg-purple-100 text-purple-800 dark:bg-purple-500/20 dark:text-purple-300",
};

const CT_ICONS = { VIDEO: Play, TEXT: FileText, QUIZ: HelpCircle };

function fmtDur(s: number) {
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function timeAgo(date: string) {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

/* ─── Skeleton ──────────────────────────────────────────────── */
function SkeletonDetail() {
  return (
    <div className="min-h-screen bg-slate-100 pt-4 pb-12">
      <div className="max-w-5xl mx-auto px-4">
        <div className="h-6 w-48 bg-slate-200 rounded animate-pulse mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5">
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-6 animate-pulse space-y-3">
              <div className="flex gap-3">
                <div className="w-12 h-12 bg-slate-200 rounded-2xl" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-200 rounded w-1/4" />
                  <div className="h-6 bg-slate-200 rounded w-3/4" />
                </div>
              </div>
              <div className="h-4 bg-slate-200 rounded w-full" />
              <div className="h-4 bg-slate-200 rounded w-5/6" />
              <div className="h-4 bg-slate-200 rounded w-4/6" />
            </div>
          </div>
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-5 animate-pulse space-y-4">
              <div className="w-16 h-16 rounded-full bg-slate-200 mx-auto" />
              <div className="h-4 bg-slate-200 rounded w-2/3 mx-auto" />
              <div className="h-10 bg-slate-200 rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ListingDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const router   = useRouter();
  const user     = useAppSelector(s => s.auth.user);

  const [listing,     setListing]     = useState<Listing | null>(null);
  const [loading,     setLoading]     = useState(true);
  const [isNotFound,  setIsNotFound]  = useState(false);
  const [copied,      setCopied]      = useState(false);
  const [purchasing,  setPurchasing]  = useState(false);
  const [openSecs,    setOpenSecs]    = useState<Set<string>>(new Set());

  // Coupon & Referral state
  const [couponInput,      setCouponInput]      = useState("");
  const [appliedCoupon,    setAppliedCoupon]    = useState<{
    code: string; discountType: string; discountValue: number;
    originalPrice: number; discountedPrice: number; savings: number; label: string;
  } | null>(null);
  const [couponError,      setCouponError]      = useState("");
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [refCode,          setRefCode]          = useState("");

  const applyPromo = async (codeToApply: string, curListing?: Listing | null) => {
    const l = curListing ?? listing;
    if (!codeToApply.trim() || !l) return;
    setValidatingCoupon(true);
    setCouponError("");
    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: codeToApply,
          listingId: l.id,
          courseSlug: l.course?.slug,
        }),
      });
      const data = await res.json();
      if (data.valid) {
        setAppliedCoupon(data);
        setCouponInput(data.code);
      } else {
        setCouponError(data.error || "Invalid promo code");
      }
    } catch {
      setCouponError("Failed to apply promo code");
    } finally {
      setValidatingCoupon(false);
    }
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    const searchParams = new URLSearchParams(window.location.search);
    const qCoupon = searchParams.get("coupon");
    const qRef = searchParams.get("ref");
    if (qRef) setRefCode(qRef);

    fetch(`/api/listing/${slug}`)
      .then(r => { if (!r.ok) { setIsNotFound(true); return null; } return r.json(); })
      .then(data => {
        if (data) {
          if (typeof window !== "undefined" && window.location.search.includes("success=true")) {
            data.hasPurchased = true;
          }
          setListing(data);
          if (data.course?.sections?.length) {
            setOpenSecs(new Set(data.course.sections.map((s: Section) => s.id)));
          }
          if (qCoupon && (data.price > 0 || (data.course && data.course.price > 0))) {
            applyPromo(qCoupon, data);
          }
        }
      })
      .catch(() => setIsNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  const toggleSec = (id: string) => {
    setOpenSecs(p => {
      const n = new Set(p);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  };

  const toggleAllSecs = () => {
    if (!listing?.course?.sections) return;
    if (openSecs.size === listing.course.sections.length) {
      setOpenSecs(new Set());
    } else {
      setOpenSecs(new Set(listing.course.sections.map(s => s.id)));
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleEnrollCourse = async () => {
    if (!listing?.course) return;
    const course = listing.course;
    if (!user) {
      router.push(`/login?redirect=/${listing.slug ?? listing.id}`);
      return;
    }
    if (course.isEnrolled) {
      router.push(`/courses/${course.slug}/learn`);
      return;
    }
    const currentPrice = appliedCoupon ? appliedCoupon.discountedPrice : course.price;
    if (course.isFree || currentPrice <= 0) {
      setPurchasing(true);
      try {
        const res = await fetch(`/api/courses/${course.slug}/enroll`, { method: "POST" });
        if (res.ok) {
          router.push(`/courses/${course.slug}/learn`);
        } else {
          alert("Failed to enroll in free course.");
        }
      } catch {
        alert("Something went wrong with enrollment.");
      } finally {
        setPurchasing(false);
      }
      return;
    }

    // Paid Course Checkout
    setPurchasing(true);
    try {
      const res = await fetch("/api/stripe/course-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: course.slug,
          couponCode: appliedCoupon?.code,
          refCode: refCode || undefined,
        }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else if (data.success) {
        router.push(`/courses/${course.slug}/learn`);
      } else {
        alert(data.error || "Failed to start course checkout.");
      }
    } catch {
      alert("Something went wrong with checkout.");
    } finally {
      setPurchasing(false);
    }
  };

  const handleBuyListing = async () => {
    if (!user || !listing) return;
    setPurchasing(true);
    try {
      const res = await fetch("/api/stripe/marketplace-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId: listing.id,
          couponCode: appliedCoupon?.code,
          refCode: refCode || undefined,
        }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else if (data.isFree || data.alreadyPurchased || data.success) {
        setListing(prev => prev ? { ...prev, hasPurchased: true } : prev);
      } else if (data.error) {
        alert(data.error);
      }
    } catch {
      alert("Something went wrong with checkout.");
    } finally {
      setPurchasing(false);
    }
  };

  if (loading) return <SkeletonDetail />;

  if (isNotFound || !listing) {
    notFound();
  }

  const isCourse = listing.category === "TRAINING" || !!listing.course;
  const course = listing.course;
  const cfg = CAT_CONFIG[listing.category] ?? DEFAULT_CFG;
  const Icon = cfg.icon;

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0c1527] pt-4 pb-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-400 mb-5 flex-wrap">
          <Link href="/marketplace" className="hover:text-[#0a1628] dark:hover:text-white transition-colors flex items-center gap-1 font-semibold">
            <ArrowLeft01Icon className="w-3.5 h-3.5" /> Marketplace
          </Link>
          <span className="text-slate-300 dark:text-slate-700">/</span>
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${cfg.pill}`}>{cfg.label}</span>
          <span className="text-slate-300 dark:text-slate-700">/</span>
          <span className="text-slate-600 dark:text-slate-300 font-medium line-clamp-1 max-w-[240px]">{listing.title}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* ── LEFT COLUMN ── */}
          <div className="lg:col-span-8 space-y-6">

            {/* Main Header / Banner Card */}
            <div className="bg-white dark:bg-[#131d2e] rounded-3xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-sm">
              
              {/* Media Thumbnail Container */}
              {(listing.images?.[0] || course?.thumbnail) && (
                <div className="relative w-full h-72 sm:h-96 bg-gradient-to-br from-[#0a1628] via-[#0d1f3c] to-[#1a3a6b] flex items-center justify-center p-4 sm:p-6 overflow-hidden">
                  <img
                    src={listing.images?.[0] || course?.thumbnail || ""}
                    alt={listing.title}
                    className="w-full h-full object-contain drop-shadow-2xl rounded-xl"
                  />
                  {course?.level && (
                    <div className="absolute top-4 left-4">
                      <span className={`text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-full shadow-sm ${LEVEL_COLORS[course.level] || "bg-emerald-100 text-emerald-800"}`}>
                        {course.level}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Title & Metadata Details */}
              <div className="p-6 sm:p-8">
                <div className="flex items-center gap-2 flex-wrap mb-3">
                  <span className={`text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider ${cfg.pill}`}>
                    {course?.category || cfg.label}
                  </span>
                  {listing.isFeatured && (
                    <span className="flex items-center gap-1 text-xs font-bold text-amber-500 bg-amber-50 dark:bg-amber-500/10 px-2.5 py-1 rounded-full">
                      <StarIcon className="w-3.5 h-3.5 fill-amber-400" /> Featured
                    </span>
                  )}
                  <span className="flex items-center gap-1 text-xs text-slate-400 ml-auto">
                    <EyeIcon className="w-3.5 h-3.5" /> {listing.viewCount} views
                  </span>
                </div>

                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#0a1628] dark:text-white leading-tight mb-4">
                  {listing.title}
                </h1>

                {/* Course Meta Stats Strip */}
                {course && (
                  <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs sm:text-sm text-slate-500 dark:text-slate-400 pb-5 mb-5 border-b border-slate-100 dark:border-slate-800/80">
                    <span className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300">
                      <BookOpen className="w-4 h-4 text-amber-500" />
                      {course.totalLessons} lessons
                    </span>
                    {course.totalDuration > 0 && (
                      <span className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300">
                        <Clock className="w-4 h-4 text-amber-500" />
                        {fmtDur(course.totalDuration)}
                      </span>
                    )}
                    <span className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300">
                      <Users className="w-4 h-4 text-amber-500" />
                      {course._count.enrollments} enrolled
                    </span>
                  </div>
                )}

                {/* Creator / Instructor Strip */}
                <div className="flex items-center gap-3.5 pt-2">
                  <div className="w-12 h-12 rounded-2xl bg-[#0a1628] border border-slate-200 dark:border-slate-700 overflow-hidden flex items-center justify-center shrink-0">
                    {course?.instructor?.role !== "ADMIN" && (course?.instructor?.image || listing.user.image) ? (
                      <img
                        src={course?.instructor?.image || listing.user.image || ""}
                        alt={course?.instructor?.name || listing.user.name}
                        className="w-full h-full object-cover"
                      />
                    ) : course?.instructor?.role !== "ADMIN" ? (
                      <span className="text-white font-black text-lg">
                        {(course?.instructor?.name || listing.user.name)?.[0]?.toUpperCase()}
                      </span>
                    ) : (
                      <img src="/fevicon.webp" alt="TaxCompPro" className="w-full h-full object-contain p-1.5" />
                    )}
                  </div>
                  <div>
                    <div className="font-extrabold text-sm sm:text-base text-[#0a1628] dark:text-white">
                      {course?.instructor?.role !== "ADMIN" ? (course?.instructor?.name || listing.user.name) : "TaxCompPro Academy"}
                    </div>
                    <div className="text-xs text-amber-600 dark:text-amber-400 font-semibold">
                      {course?.instructor?.role !== "ADMIN"
                        ? (course?.instructor?.headline || listing.user.headline || "Course Creator")
                        : "Official Platform Course"}
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Description Section */}
            <div className="bg-white dark:bg-[#131d2e] rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-sm">
              <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3">
                {isCourse ? "Course Overview" : "About This Listing"}
              </h2>
              <p className="text-slate-700 dark:text-slate-300 text-sm sm:text-base leading-relaxed whitespace-pre-line">
                {listing.description}
              </p>
            </div>

            {/* What You'll Learn (Course Only) */}
            {course && course.learningOutcomes && course.learningOutcomes.length > 0 && (
              <div className="bg-amber-50/70 dark:bg-amber-500/10 border border-amber-200/70 dark:border-amber-400/20 rounded-3xl p-6 sm:p-8">
                <h2 className="text-base sm:text-lg font-black text-[#0a1628] dark:text-amber-300 mb-4 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-500" />
                  What you&apos;ll learn in this course
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {course.learningOutcomes.map((item, i) => (
                    <div key={i} className="flex items-start gap-2.5 text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Course Curriculum Accordion (Course Only) */}
            {course && course.sections && course.sections.length > 0 && (
              <div className="bg-white dark:bg-[#131d2e] rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <h2 className="text-lg sm:text-xl font-black text-[#0a1628] dark:text-white">
                      Course Curriculum
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {course.sections.length} module{course.sections.length !== 1 ? "s" : ""} • {course.totalLessons} lectures
                    </p>
                  </div>
                  <button
                    onClick={toggleAllSecs}
                    className="text-xs font-bold text-[#1a3a6b] dark:text-amber-400 hover:underline"
                  >
                    {openSecs.size === course.sections.length ? "Collapse all" : "Expand all"}
                  </button>
                </div>

                <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-200 dark:divide-slate-800">
                  {course.sections.map((sec, si) => {
                    const isOpen = openSecs.has(sec.id);
                    const secDur = sec.lessons.reduce((s, l) => s + (l.duration || 0), 0);
                    return (
                      <div key={sec.id} className="bg-slate-50/50 dark:bg-white/5">
                        <button
                          type="button"
                          onClick={() => toggleSec(sec.id)}
                          className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-slate-100 dark:hover:bg-white/10 transition-all"
                        >
                          {isOpen ? (
                            <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                          )}
                          <span className="flex-1 font-bold text-sm text-[#0a1628] dark:text-white">
                            {si + 1}. {sec.title}
                          </span>
                          <span className="text-xs text-slate-400 shrink-0 font-medium">
                            {sec.lessons.length} lecture{sec.lessons.length !== 1 ? "s" : ""}
                            {secDur > 0 && ` • ${fmtDur(secDur)}`}
                          </span>
                        </button>

                        {isOpen && (
                          <div className="bg-white dark:bg-[#131d2e] divide-y divide-slate-100 dark:divide-slate-800/80">
                            {sec.lessons.map((lesson, li) => {
                              const LIcon = CT_ICONS[lesson.contentType] ?? Play;
                              const canPlay = course.isEnrolled || lesson.isFree;
                              return (
                                <div
                                  key={lesson.id}
                                  className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 dark:hover:bg-white/5 transition-all text-xs sm:text-sm"
                                >
                                  <div className="w-5 flex justify-center shrink-0">
                                    <LIcon className={`w-4 h-4 ${canPlay ? "text-[#1a3a6b] dark:text-amber-400" : "text-slate-300 dark:text-slate-600"}`} />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                                      {li + 1}. {lesson.title}
                                    </div>
                                    {lesson.description && (
                                      <p className="text-[11px] text-slate-400 truncate mt-0.5">
                                        {lesson.description}
                                      </p>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2 shrink-0">
                                    {lesson.downloadUrl && (
                                      <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-full flex items-center gap-1">
                                        <Download className="w-3 h-3" /> File
                                      </span>
                                    )}
                                    {lesson.isFree && !course.isEnrolled && (
                                      <Link
                                        href={`/courses/${course.slug}/learn`}
                                        className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-full hover:underline"
                                      >
                                        Free Preview
                                      </Link>
                                    )}
                                    {!canPlay && <Lock className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600" />}
                                    {lesson.duration > 0 && (
                                      <span className="text-xs text-slate-400">{fmtDur(lesson.duration)}</span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Requirements (Course Only) */}
            {course && course.requirements && course.requirements.length > 0 && (
              <div className="bg-white dark:bg-[#131d2e] rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-sm">
                <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3">
                  Requirements & Prerequisites
                </h2>
                <ul className="space-y-2">
                  {course.requirements.map((req, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                      <span className="text-amber-500 font-bold">•</span>
                      <span>{req}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Tags */}
            {listing.tags.length > 0 && (
              <div className="bg-white dark:bg-[#131d2e] rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3">
                  <Tag01Icon className="w-3.5 h-3.5" /> Tags
                </div>
                <div className="flex flex-wrap gap-2">
                  {listing.tags.map(t => (
                    <span key={t} className="text-xs bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 px-3 py-1.5 rounded-full font-medium">
                      #{t}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Share & Report Actions */}
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={handleShare}
                className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-[#0a1628] dark:hover:text-white px-4 py-2.5 rounded-2xl bg-white dark:bg-[#131d2e] border border-slate-200 dark:border-slate-800 hover:bg-slate-50 transition-all shadow-sm"
              >
                <Share01Icon className="w-4 h-4" />
                {copied ? "Link Copied!" : "Share"}
              </button>
              <button className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-400 hover:text-red-500 px-4 py-2.5 rounded-2xl hover:bg-red-50 dark:hover:bg-red-500/10 transition-all">
                <Flag01Icon className="w-4 h-4" /> Report
              </button>
            </div>

          </div>

          {/* ── RIGHT COLUMN: PRICING & ENROLL / BUY SIDEBAR ── */}
          <div className="lg:col-span-4 space-y-5 sticky top-[90px]">

            {/* Main Action / Purchase Card */}
            <div className="bg-white dark:bg-[#131d2e] rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-md space-y-5">
              
              {/* Price Banner */}
              <div className="bg-slate-50 dark:bg-white/5 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Pricing
                    </span>
                    <div className="flex items-baseline gap-2">
                      {appliedCoupon && appliedCoupon.savings > 0 ? (
                        <>
                          <span className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
                            ${appliedCoupon.discountedPrice}
                          </span>
                          <span className="text-base text-slate-400 line-through">
                            ${appliedCoupon.originalPrice}
                          </span>
                        </>
                      ) : (
                        <div className="text-2xl sm:text-3xl font-black text-[#0a1628] dark:text-white">
                          {listing.price != null && listing.price > 0 ? `$${listing.price}` : "Free"}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    {appliedCoupon ? (
                      <span className="text-[10px] font-black text-emerald-700 bg-emerald-100 dark:bg-emerald-500/20 dark:text-emerald-300 px-2.5 py-1 rounded-full uppercase tracking-wider">
                        {appliedCoupon.label}
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-1 rounded-full uppercase tracking-wider">
                        Full Access
                      </span>
                    )}
                  </div>
                </div>

                {/* Applied Coupon Tag */}
                {appliedCoupon && (
                  <div className="pt-1 flex items-center justify-between text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100/60 dark:bg-emerald-500/10 px-3 py-1.5 rounded-xl">
                    <span className="flex items-center gap-1.5 truncate">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      Promo <span className="font-mono font-black">{appliedCoupon.code}</span> applied (-${appliedCoupon.savings.toFixed(2)})
                    </span>
                    <button
                      type="button"
                      onClick={() => { setAppliedCoupon(null); setCouponInput(""); }}
                      className="text-slate-400 hover:text-red-500 p-0.5 ml-2"
                      title="Remove promo code"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Promo Code Input */}
              {((listing.price != null && listing.price > 0) || (course && course.price > 0)) && !appliedCoupon && (
                <div className="space-y-1.5">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Have a promo code?"
                      value={couponInput}
                      onChange={e => setCouponInput(e.target.value.toUpperCase())}
                      onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); applyPromo(couponInput); } }}
                      className="flex-1 text-xs font-bold uppercase tracking-wider border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 outline-none focus:border-[#0a1628] dark:focus:border-amber-400 bg-transparent text-slate-800 dark:text-white placeholder:normal-case placeholder:font-normal"
                    />
                    <button
                      type="button"
                      onClick={() => applyPromo(couponInput)}
                      disabled={validatingCoupon || !couponInput.trim()}
                      className="px-3.5 py-2 text-xs font-bold bg-[#0a1628] hover:bg-[#1a3a6b] dark:bg-amber-500 dark:hover:bg-amber-400 text-white dark:text-[#0a1628] rounded-xl transition-all disabled:opacity-50"
                    >
                      {validatingCoupon ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Apply"}
                    </button>
                  </div>
                  {couponError && (
                    <p className="text-[11px] font-bold text-red-500">{couponError}</p>
                  )}
                </div>
              )}

              {/* Primary Action Button */}
              {isCourse && course ? (
                <div>
                  {course.isEnrolled ? (
                    <Link
                      href={`/courses/${course.slug}/learn`}
                      className="w-full flex items-center justify-center gap-2 font-black text-sm py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg transition-all"
                    >
                      <Play className="w-4 h-4 fill-white" /> Continue Learning →
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={handleEnrollCourse}
                      disabled={purchasing}
                      className="w-full flex items-center justify-center gap-2 font-black text-sm py-4 rounded-2xl bg-[#0a1628] dark:bg-amber-500 hover:bg-[#1a3a6b] dark:hover:bg-amber-400 text-white dark:text-[#0a1628] shadow-lg transition-all disabled:opacity-60"
                    >
                      {purchasing ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          <School01Icon className="w-5 h-5" />
                          {course.isFree || (appliedCoupon ? appliedCoupon.discountedPrice <= 0 : course.price <= 0)
                            ? "Enroll in Course (Free)"
                            : `Enroll Now • $${appliedCoupon ? appliedCoupon.discountedPrice : course.price}`}
                        </>
                      )}
                    </button>
                  )}
                </div>
              ) : (
                /* Non-course listing purchase / contact action */
                (() => {
                  const isFree = !listing.price || listing.price <= 0;
                  const isOwner = user?.id === listing.user.id || user?.role === "ADMIN";
                  const downloadUrl = listing.metadata?.downloadUrl;
                  const linkUrl = listing.metadata?.linkUrl || listing.metadata?.externalUrl || listing.metadata?.actionUrl;
                  const hasAccess = isFree || listing.hasPurchased || isOwner;

                  if (downloadUrl && hasAccess) {
                    return (
                      <a
                        href={downloadUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        download
                        className="w-full flex items-center justify-center gap-2 font-bold text-sm py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md transition-all"
                      >
                        <Download className="w-4 h-4" /> Download Product
                      </a>
                    );
                  }

                  if (downloadUrl && !hasAccess) {
                    if (!user) {
                      return (
                        <Link
                          href={`/login?redirect=/${listing.slug ?? listing.id}`}
                          className="w-full flex items-center justify-center gap-2 font-bold text-sm py-4 rounded-2xl bg-[#0a1628] hover:bg-[#1a3a6b] text-white transition-all"
                        >
                          Sign in to Buy (${listing.price}) <ArrowRight01Icon className="w-4 h-4" />
                        </Link>
                      );
                    }
                    return (
                      <button
                        onClick={handleBuyListing}
                        disabled={purchasing}
                        className="w-full flex items-center justify-center gap-2 font-bold text-sm py-4 rounded-2xl bg-[#0a1628] hover:bg-[#1a3a6b] text-white shadow-md transition-all disabled:opacity-60"
                      >
                        {purchasing ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShoppingBag01Icon className="w-4 h-4" />}
                        {purchasing ? "Processing…" : `Buy & Unlock Download ($${listing.price})`}
                      </button>
                    );
                  }

                  if (linkUrl) {
                    return (
                      <a
                        href={linkUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`w-full flex items-center justify-center gap-2 font-bold text-sm py-4 rounded-2xl transition-all ${cfg.ctaCls}`}
                      >
                        {cfg.cta} <ExternalLink className="w-4 h-4" />
                      </a>
                    );
                  }

                  if (!isFree && !hasAccess) {
                    if (!user) {
                      return (
                        <Link
                          href={`/login?redirect=/${listing.slug ?? listing.id}`}
                          className={`w-full flex items-center justify-center gap-2 font-bold text-sm py-4 rounded-2xl transition-all ${cfg.ctaCls}`}
                        >
                          Sign in to Buy (${listing.price}) <ArrowRight01Icon className="w-4 h-4" />
                        </Link>
                      );
                    }
                    return (
                      <button
                        onClick={handleBuyListing}
                        disabled={purchasing}
                        className={`w-full flex items-center justify-center gap-2 font-bold text-sm py-4 rounded-2xl transition-all disabled:opacity-60 ${cfg.ctaCls}`}
                      >
                        {purchasing ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShoppingBag01Icon className="w-4 h-4" />}
                        {purchasing ? "Processing…" : `Buy Now ($${listing.price})`}
                      </button>
                    );
                  }

                  return (
                    <Link
                      href={user ? `/messages?receiverId=${listing.user.id}` : `/login?redirect=/${listing.slug ?? listing.id}`}
                      className={`w-full flex items-center justify-center gap-2 font-bold text-sm py-4 rounded-2xl transition-all ${cfg.ctaCls}`}
                    >
                      Contact Seller <ArrowRight01Icon className="w-4 h-4" />
                    </Link>
                  );
                })()
              )}

              {/* Feature Checklist */}
              <div className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-400">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Full lifetime access</span>
                </div>
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-emerald-500" />
                  <span>Certificate of completion</span>
                </div>
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-emerald-500" />
                  <span>Access on Mobile & Desktop</span>
                </div>
              </div>

            </div>

            {/* Seller Box Card */}
            <div className="bg-white dark:bg-[#131d2e] rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                {isCourse ? "Instructor" : "About the Seller"}
              </h3>

              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#0a1628] border border-slate-200 dark:border-slate-700 overflow-hidden flex items-center justify-center shrink-0">
                  {listing.user.image ? (
                    <img src={listing.user.image} alt={listing.user.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-white font-black text-base">{listing.user.name?.[0]?.toUpperCase()}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-extrabold text-sm text-[#0a1628] dark:text-white truncate">
                    {listing.user.name}
                  </div>
                  {listing.user.headline && (
                    <div className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      {listing.user.headline}
                    </div>
                  )}
                </div>
              </div>

              <Link
                href={user ? `/messages?receiverId=${listing.user.id}` : `/login?redirect=/${listing.slug ?? listing.id}`}
                className="w-full block text-center py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-white/5 font-bold text-xs text-slate-700 dark:text-slate-300 transition-all"
              >
                Send Message
              </Link>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
