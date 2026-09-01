"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signUp, signIn, useSession } from "@/lib/auth-client";
import { z } from "zod";
import {
  Mail,
  Lock,
  User,
  ArrowRight,
  Globe,
  Eye,
  EyeOff,
  CheckCircle2,
  Crown,
  Sparkles,
  ShieldCheck,
  Tag,
  Loader2,
  ShoppingBag,
  Radio,
  Zap,
} from "lucide-react";
import Image from "next/image";

const schema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Please enter a valid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
    agreeTerms: z.boolean().refine((v) => v === true, "You must agree to the terms"),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type FormData = z.infer<typeof schema>;

const membershipPlans = [
  {
    id: "VIP",
    name: "VIP Members Only",
    price: "$39.99",
    period: "/month",
    badge: "Core Membership",
    popular: false,
    color: "from-amber-500/20 to-amber-600/10 border-amber-500/30",
    icon: Crown,
    features: [
      "Priority Access to Tax SOP & Due Diligence Library",
      "Private Discussion Forums & Feed Interaction",
      "Full Member Directory & Direct Networking",
      "ATLAS AI Tax Concierge & Assistant Bot",
      "Ongoing Tax Training & CE Masterclasses",
      "2 Months FREE with Annual / Promo",
    ],
  },
  {
    id: "MARKETPLACE",
    name: "VIP + Marketplace Bundle",
    price: "$79.99",
    period: "/month",
    badge: "Most Popular",
    popular: true,
    color: "from-blue-600/25 to-indigo-600/15 border-blue-500",
    icon: Sparkles,
    features: [
      "Everything in VIP Members Only",
      "Verified Seller Profile in Marketplace",
      "Sell Tax Services & Digital Products with 0% Platform Fee",
      "Verified Pro Badge next to your name",
      "Custom Marketplace Storefront & Showcase",
      "Connect Digital Business Card Integration",
    ],
  },
  {
    id: "MARKETPLACE_PLUS",
    name: "VIP + Marketplace Plus",
    price: "$129.99",
    period: "/month",
    badge: "Best Value",
    popular: false,
    color: "from-emerald-500/20 to-teal-600/15 border-emerald-500/40",
    icon: Zap,
    features: [
      "Everything in Marketplace Bundle",
      "Host Live Pro Talk Audio Rooms on TCP",
      "Host Video Training Workshops & Masterclasses",
      "Priority Search Ranking in Pro Directory",
      "Post Featured Ads, Banners & Announcements",
      "Unlimited Toolkit & Compliance Vault Downloads",
    ],
  },
];

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();

  const [step, setStep] = useState<"account" | "membership">("account");
  const [selectedTier, setSelectedTier] = useState<string>("MARKETPLACE");
  const [couponCode, setCouponCode] = useState("");
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponMsg, setCouponMsg] = useState("");

  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // If user signed in via Google or has an active session, auto-advance to membership plan choice
  useEffect(() => {
    if (searchParams.get("step") === "membership" || session?.user) {
      setStep("membership");
    }
  }, [searchParams, session]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { agreeTerms: false },
  });

  const onAccountSubmit = async (data: FormData) => {
    setLoading(true);
    setServerError("");
    try {
      const res = await signUp.email({
        email: data.email,
        password: data.password,
        name: data.name,
      });

      if (res.error) {
        setServerError(res.error.message || "Registration failed.");
      } else {
        // Successfully created account — proceed to choose membership plan
        setStep("membership");
      }
    } catch {
      setServerError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    try {
      await signIn.social({
        provider: "google",
        callbackURL: "/register?step=membership",
      });
    } catch {
      setServerError("Google sign-in failed.");
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleProceedToCheckout = async () => {
    setCheckoutLoading(true);
    setServerError("");
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tier: selectedTier,
          couponCode: couponCode.trim() || undefined,
          redirectUrl: "/feed?welcome=1",
        }),
      });

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else if (data.error) {
        setServerError(data.error);
      } else {
        router.push("/feed?welcome=1");
      }
    } catch {
      setServerError("Failed to initiate checkout. Please try again.");
    } finally {
      setCheckoutLoading(false);
    }
  };

  const inputCls = (err: boolean) =>
    `w-full font-[inherit] text-sm pl-10 pr-10 py-3 border rounded-xl outline-none transition-all ${
      err
        ? "border-red-400 focus:ring-2 focus:ring-red-100"
        : "border-slate-200 focus:border-[#0a1628] focus:ring-2 focus:ring-[#0a1628]/8"
    }`;

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#08101e] font-[var(--font-urbanist,Urbanist),sans-serif] px-4 py-12">
      <div className={`w-full transition-all duration-300 ${step === "membership" ? "max-w-4xl" : "max-w-[440px]"}`}>
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Link href="/">
            <Image
              src="/logo.webp"
              alt="TaxCompPro"
              width={160}
              height={60}
              className="object-contain dark:hidden"
              style={{ width: "auto", height: "auto" }}
              loading="eager"
            />
            <Image
              src="/logo_dark.webp"
              alt="TaxCompPro"
              width={160}
              height={60}
              className="object-contain hidden dark:block"
              style={{ width: "auto", height: "auto" }}
              loading="eager"
            />
          </Link>
        </div>

        {/* ── STEP 1: ACCOUNT DETAILS ── */}
        {step === "account" && (
          <div className="bg-white dark:bg-[#121e33] rounded-3xl border border-slate-200 dark:border-white/10 shadow-2xl p-6 sm:p-8 space-y-6">
            {/* Step Progress Indicator */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/10 pb-4">
              <span className="text-[11px] font-black uppercase tracking-widest text-amber-500">
                Step 1 of 2: Account Details
              </span>
              <span className="text-xs text-slate-400 font-bold">Next: Choose Plan</span>
            </div>

            <div>
              <h1 className="text-2xl font-black text-[#0a1628] dark:text-white">Create your account</h1>
              <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mt-1">
                Already have an account?{" "}
                <Link href="/login" className="text-amber-500 font-bold hover:underline">
                  Sign in
                </Link>
              </p>
            </div>

            {serverError && (
              <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-xl px-4 py-3 text-xs font-semibold">
                {serverError}
              </div>
            )}

            {/* Google Signup */}
            <button
              type="button"
              onClick={handleGoogle}
              disabled={googleLoading}
              className="w-full flex items-center justify-center gap-3 border border-slate-200 dark:border-white/10 rounded-xl py-3 font-bold text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5 transition-all disabled:opacity-60 cursor-pointer shadow-sm"
            >
              <Globe className="w-4 h-4 text-blue-500" />
              {googleLoading ? "Redirecting to Google…" : "Continue with Google"}
            </button>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-slate-100 dark:bg-white/10" />
              <span className="text-xs text-slate-400 font-bold">or register with email</span>
              <div className="flex-1 h-px bg-slate-100 dark:bg-white/10" />
            </div>

            <form onSubmit={handleSubmit(onAccountSubmit)} noValidate className="space-y-4">
              {/* Name */}
              <div>
                <label htmlFor="name" className="block text-xs font-bold text-[#0a1628] dark:text-slate-300 mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    id="name"
                    type="text"
                    placeholder="John Smith"
                    className={inputCls(!!errors.name)}
                    {...register("name")}
                  />
                </div>
                {errors.name && <p className="text-red-500 text-xs mt-1.5">{errors.name.message}</p>}
              </div>

              {/* Email */}
              <div>
                <label htmlFor="reg-email" className="block text-xs font-bold text-[#0a1628] dark:text-slate-300 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    id="reg-email"
                    type="email"
                    placeholder="you@example.com"
                    className={inputCls(!!errors.email)}
                    {...register("email")}
                  />
                </div>
                {errors.email && <p className="text-red-500 text-xs mt-1.5">{errors.email.message}</p>}
              </div>

              {/* Password */}
              <div>
                <label htmlFor="reg-password" className="block text-xs font-bold text-[#0a1628] dark:text-slate-300 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    id="reg-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="At least 8 characters"
                    className={inputCls(!!errors.password)}
                    {...register("password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((p) => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-red-500 text-xs mt-1.5">{errors.password.message}</p>}
              </div>

              {/* Confirm Password */}
              <div>
                <label htmlFor="confirmPassword" className="block text-xs font-bold text-[#0a1628] dark:text-slate-300 mb-1.5">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    id="confirmPassword"
                    type={showConfirm ? "text" : "password"}
                    placeholder="Repeat your password"
                    className={inputCls(!!errors.confirmPassword)}
                    {...register("confirmPassword")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((p) => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-red-500 text-xs mt-1.5">{errors.confirmPassword.message}</p>
                )}
              </div>

              {/* Terms */}
              <label className="flex items-start gap-3 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  {...register("agreeTerms")}
                  className="mt-0.5 w-4 h-4 shrink-0 accent-[#0a1628]"
                />
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  I agree to the{" "}
                  <Link href="/terms" className="text-[#0a1628] dark:text-amber-400 font-bold underline">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy" className="text-[#0a1628] dark:text-amber-400 font-bold underline">
                    Privacy Policy
                  </Link>
                </span>
              </label>
              {errors.agreeTerms && <p className="text-red-500 text-xs -mt-2">{errors.agreeTerms.message}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#f0c040] to-[#d4a017] text-[#0a1628] font-black text-sm py-3.5 rounded-full hover:shadow-[0_0_20px_rgba(212,160,23,0.4)] hover:-translate-y-0.5 transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer mt-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Setting Up Account…</span>
                  </>
                ) : (
                  <>
                    <span>Continue: Choose Plan</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* ── STEP 2: CHOOSE MEMBERSHIP PLAN & COMPLETE ON STRIPE ── */}
        {step === "membership" && (
          <div className="bg-white dark:bg-[#121e33] rounded-3xl border border-slate-200 dark:border-white/10 shadow-2xl p-6 sm:p-10 space-y-8 animate-in fade-in zoom-in-95 duration-200">
            {/* Top Progress & Banner */}
            <div className="text-center space-y-2">
              <div className="inline-flex items-center gap-2 bg-amber-400/15 border border-amber-400/30 text-amber-500 text-xs font-black uppercase tracking-widest px-3.5 py-1.5 rounded-full">
                <Crown className="w-3.5 h-3.5" />
                <span>Step 2 of 2: Select Your Membership Plan</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-[#0a1628] dark:text-white">
                Choose Your Membership Tier
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-lg mx-auto">
                All accounts require an active membership plan to access Tax Compliance Pro tools, feeds, and directory.
                Choose your plan below to complete setup on Stripe.
              </p>
            </div>

            {serverError && (
              <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-xl px-4 py-3 text-xs font-semibold text-center">
                {serverError}
              </div>
            )}

            {/* Plan Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {membershipPlans.map((p) => {
                const isSelected = selectedTier === p.id;
                const Icon = p.icon;
                return (
                  <div
                    key={p.id}
                    onClick={() => setSelectedTier(p.id)}
                    className={`relative rounded-2xl p-6 transition-all cursor-pointer flex flex-col justify-between border-2 ${
                      isSelected
                        ? "border-amber-400 bg-amber-400/5 dark:bg-amber-400/10 shadow-xl ring-2 ring-amber-400/30"
                        : "border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 bg-slate-50/50 dark:bg-white/5"
                    }`}
                  >
                    {/* Badge */}
                    {p.popular && (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] font-black uppercase tracking-wider px-3 py-0.5 rounded-full shadow-md">
                        {p.badge}
                      </span>
                    )}

                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 rounded-xl bg-[#0a1628] dark:bg-slate-800 text-amber-400 flex items-center justify-center shadow-md">
                          <Icon className="w-5 h-5" />
                        </div>
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                            isSelected
                              ? "border-amber-400 bg-amber-400 text-[#0a1628]"
                              : "border-slate-300 dark:border-slate-600"
                          }`}
                        >
                          {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                        </div>
                      </div>

                      <h3 className="font-black text-base text-[#0a1628] dark:text-white leading-tight">
                        {p.name}
                      </h3>

                      <div className="mt-3 flex items-baseline gap-1">
                        <span className="text-3xl font-black text-[#0a1628] dark:text-white">{p.price}</span>
                        <span className="text-xs text-slate-500 font-bold">{p.period}</span>
                      </div>

                      <div className="h-px bg-slate-200 dark:bg-white/10 my-4" />

                      <ul className="space-y-2.5">
                        {p.features.map((feat, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                            <span className="leading-snug">{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="pt-6">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTier(p.id);
                          handleProceedToCheckout();
                        }}
                        className={`w-full py-2.5 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-1.5 shadow-md ${
                          isSelected
                            ? "bg-[#f0c040] text-[#0a1628] hover:bg-amber-400"
                            : "bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-white hover:bg-slate-300 dark:hover:bg-white/20"
                        }`}
                      >
                        <span>Select {p.id === "MARKETPLACE_PLUS" ? "Plus" : p.id}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Promo Code Box */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 text-xs text-slate-600 dark:text-slate-300 font-bold">
                <Tag className="w-4 h-4 text-amber-500" />
                <span>Have a Promo or Referral Code?</span>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <input
                  type="text"
                  placeholder="Enter code (optional)"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0a1424] text-xs font-bold uppercase tracking-wider text-[#0a1628] dark:text-white placeholder:normal-case placeholder:font-normal"
                />
              </div>
            </div>

            {/* Big Complete Registration CTA */}
            <div className="text-center space-y-3 pt-2">
              <button
                type="button"
                disabled={checkoutLoading}
                onClick={handleProceedToCheckout}
                className="w-full sm:w-auto sm:min-w-[320px] mx-auto py-4 px-8 rounded-full bg-gradient-to-r from-[#f0c040] to-[#d4a017] hover:from-amber-300 hover:to-amber-400 text-[#0a1628] font-black text-sm shadow-xl hover:shadow-[0_0_30px_rgba(212,160,23,0.5)] transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {checkoutLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Connecting to Stripe Checkout…</span>
                  </>
                ) : (
                  <>
                    <span>Proceed to Stripe Checkout</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <p className="text-[11px] text-slate-400 font-medium">
                🔒 Safe &amp; Secure 256-bit Encrypted Checkout. After checkout, you will land directly in your private feed.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}
