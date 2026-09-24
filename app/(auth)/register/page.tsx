"use client";
import { safeAuthReturn, accountUrl } from "@/lib/auth-navigation";
import { PROFESSIONAL_TITLES } from "@/lib/professionalTitles";
import ProfessionalTitleEditor from "@/components/networks/ProfessionalTitleEditor";

import Link from "next/link";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useRef, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn, useSession } from "@/lib/auth-client";
import { z } from "zod";
import {
  Mail, Lock, User, Phone, ArrowRight, Eye, EyeOff, ChevronDown, Check,
  Search, CheckCircle2, Crown, Sparkles, ShieldCheck, Tag, Loader2, Zap,
  MailCheck, ArrowLeft, RefreshCw, AlertCircle,
} from "lucide-react";
import OtpInput from "@/components/auth/OtpInput";
import GoogleMark from "@/components/auth/GoogleMark";
import AuthShell, { StepRail } from "@/components/auth/AuthShell";
import { PRICING_PLANS, PlanTier } from "@/lib/pricing-plans";
import PricingCard from "@/components/pricing/PricingCard";

interface Country {
  code: string;
  name: string;
  flag: string;
  dialCode: string;
  format: string;
  minDigits: number;
  maxDigits: number;
}

const COUNTRIES: Country[] = [
  { code: "US", name: "United States", flag: "🇺🇸", dialCode: "+1", format: "(###) ###-####", minDigits: 10, maxDigits: 10 },
  { code: "CA", name: "Canada", flag: "🇨🇦", dialCode: "+1", format: "(###) ###-####", minDigits: 10, maxDigits: 10 },
  { code: "GB", name: "United Kingdom", flag: "🇬🇧", dialCode: "+44", format: "#### ######", minDigits: 10, maxDigits: 11 },
  { code: "AU", name: "Australia", flag: "🇦🇺", dialCode: "+61", format: "### ### ###", minDigits: 9, maxDigits: 10 },
  { code: "MX", name: "Mexico", flag: "🇲🇽", dialCode: "+52", format: "## #### ####", minDigits: 10, maxDigits: 10 },
  { code: "DE", name: "Germany", flag: "🇩🇪", dialCode: "+49", format: "### #######", minDigits: 10, maxDigits: 11 },
  { code: "FR", name: "France", flag: "🇫🇷", dialCode: "+33", format: "## ## ## ## ##", minDigits: 9, maxDigits: 9 },
  { code: "IN", name: "India", flag: "🇮🇳", dialCode: "+91", format: "##### #####", minDigits: 10, maxDigits: 10 },
  { code: "PK", name: "Pakistan", flag: "🇵🇰", dialCode: "+92", format: "### #######", minDigits: 10, maxDigits: 10 },
  { code: "AE", name: "United Arab Emirates", flag: "🇦🇪", dialCode: "+971", format: "## ### ####", minDigits: 9, maxDigits: 9 },
];

function formatUSPhone(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 10);
  if (digits.length === 0) return "";
  if (digits.length <= 3) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

const schema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Please enter a valid email address"),
    professionalTitle: z.enum(PROFESSIONAL_TITLES),
    phone: z.string().min(1, "Phone number is required"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
    agreeTerms: z.boolean().refine((v) => v === true, "You must agree to the terms"),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type FormData = z.infer<typeof schema>;

// Shared control tokens. Same radius and contrast system as the login screen:
// inputs 12px, cards 16px, primary CTA full pill.
const inputBase =
  "w-full font-[inherit] text-sm rounded-xl border bg-white text-[#0a1628] placeholder:text-slate-500 outline-none transition-all " +
  "dark:bg-[#0c1a2e] dark:text-white dark:placeholder:text-slate-400";
const inputOk =
  "border-slate-200 focus:border-[#0a1628] focus:ring-4 focus:ring-[#0a1628]/10 dark:border-white/15 dark:focus:border-amber-400 dark:focus:ring-amber-400/20";
const inputErr = "border-red-400 focus:border-red-500 focus:ring-4 focus:ring-red-500/15";
const fieldLabel = "block text-sm font-semibold text-[#0a1628] dark:text-white";
const fieldError = "text-xs font-medium text-red-600 dark:text-red-400";
const goldCta =
  "flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#ffbe24] to-[#ffbe24] py-3.5 text-sm font-bold text-[#0a1628] transition-all " +
  "hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(255, 190, 36,0.35)] active:translate-y-0 active:scale-[0.99] " +
  "disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-none";

function ErrorBanner({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="mb-6 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300"
    >
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{message}</span>
    </div>
  );
}

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = safeAuthReturn(searchParams.get("next") || searchParams.get("redirect"), "");
  const { data: session } = useSession();

  const [step, setStep] = useState<"account" | "verify" | "membership">("account");

  // Email verification (OTP) state. The account is only created once the code checks out.
  const [pendingSignup, setPendingSignup] = useState<{
    name: string; email: string; password: string; phone: string; professionalTitle: string;
  } | null>(null);
  const [otpCode, setOtpCode] = useState("");
  const [otpError, setOtpError] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [resendIn, setResendIn] = useState(0);
  const [resendLoading, setResendLoading] = useState(false);

  const urlPlan = searchParams.get("plan") as PlanTier | null;
  const initialTier: PlanTier =
    urlPlan && (["FREE", "VIP", "MARKETPLACE", "MARKETPLACE_PLUS"] as PlanTier[]).includes(urlPlan)
      ? urlPlan
      : "MARKETPLACE";

  const [selectedTier, setSelectedTier] = useState<PlanTier>(initialTier);
  const [couponCode, setCouponCode] = useState("");

  const [serverError, setServerError] = useState(searchParams.has("error") ? "Sign-up was not completed. Please try again." : "");
  const [loading, setLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Country selection state - initialized to USA
  const [selectedCountry, setSelectedCountry] = useState<Country>(COUNTRIES[0]);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");
  const countryPickerRef = useRef<HTMLDivElement>(null);

  // If user signed in via Google or has an active session, auto-advance to membership plan choice
  useEffect(() => {
    if (session?.user && nextPath) {
      window.location.replace(nextPath);
      return;
    }
    if (session?.user) {
      setStep("membership");
    }
  }, [searchParams, session, nextPath]);

  const {
    register, handleSubmit, setValue, watch, setError, clearErrors,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { agreeTerms: false, phone: "", email: searchParams.get("email") || "", name: searchParams.get("name") || "" },
  });

  const phoneValue = watch("phone") || "";

  // Close country picker on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (countryPickerRef.current && !countryPickerRef.current.contains(e.target as Node)) {
        setShowCountryPicker(false);
      }
    }
    if (showCountryPicker) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showCountryPicker]);

  // Resend cooldown ticker.
  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    clearErrors("phone");

    if (selectedCountry.code === "US" || selectedCountry.code === "CA") {
      setValue("phone", formatUSPhone(rawVal), { shouldValidate: false });
    } else {
      const cleaned = rawVal.replace(/[^\d\s\-()]/g, "").slice(0, 16);
      setValue("phone", cleaned, { shouldValidate: false });
    }
  };

  const onAccountSubmit = async (data: FormData) => {
    setLoading(true);
    setServerError("");

    const digitsOnly = data.phone.replace(/\D/g, "");
    if (selectedCountry.code === "US" || selectedCountry.code === "CA") {
      if (digitsOnly.length !== 10) {
        setError("phone", { message: "Please enter a valid 10-digit US phone number" });
        setLoading(false);
        return;
      }
    } else if (digitsOnly.length < selectedCountry.minDigits) {
      setError("phone", {
        message: `Please enter at least ${selectedCountry.minDigits} digits for ${selectedCountry.name}`,
      });
      setLoading(false);
      return;
    }

    const fullPhoneNumber = `${selectedCountry.dialCode} ${data.phone.trim()}`;

    try {
      // Prove the address before creating anything. The account is created server-side
      // in /api/auth/otp/verify only after the emailed code is accepted.
      const res = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.email, name: data.name }),
      });
      const payload = await res.json().catch(() => ({}));

      if (!res.ok) {
        setServerError(payload.error || "We could not send your verification code.");
        return;
      }

      setPendingSignup({
        name: data.name,
        email: data.email,
        password: data.password,
        phone: fullPhoneNumber,
        professionalTitle: data.professionalTitle,
      });
      setOtpCode("");
      setOtpError("");
      setResendIn(60);
      setStep("verify");
    } catch {
      setServerError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (code?: string) => {
    const submitted = (code ?? otpCode).replace(/\D/g, "");
    if (!pendingSignup || submitted.length !== 6) {
      setOtpError("Enter the 6-digit code from your email.");
      return;
    }

    setOtpLoading(true);
    setOtpError("");
    try {
      const res = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...pendingSignup, code: submitted }),
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        setOtpError(payload.error || "That code is not correct.");
        setOtpCode("");
        return;
      }

      if (nextPath) { window.location.assign(nextPath); return; }
      // Verified and signed in. Continue to plan selection.
      setStep("membership");
    } catch {
      setOtpError("Something went wrong. Please try again.");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!pendingSignup || resendIn > 0) return;
    setResendLoading(true);
    setOtpError("");
    try {
      const res = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: pendingSignup.email, name: pendingSignup.name }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        setOtpError(payload.error || "We could not resend the code.");
        setResendIn(payload.retryAfter ?? 60);
        return;
      }
      setOtpCode("");
      setResendIn(60);
    } catch {
      setOtpError("We could not resend the code. Please try again.");
    } finally {
      setResendLoading(false);
    }
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    try {
      const result = await signIn.social({ provider: "google", callbackURL: nextPath || "/register?step=membership", errorCallbackURL: accountUrl("/register", nextPath) });
      if (result.error) throw new Error(result.error.message);
    } catch {
      setServerError("Google sign-in failed.");
      setGoogleLoading(false);
    }
  };

  const handleProceedToCheckout = async () => {
    if (selectedTier === "FREE") {
      router.push(nextPath || "/feed?welcome=1");
      return;
    }
    setCheckoutLoading(true);
    setServerError("");
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tier: selectedTier,
          couponCode: couponCode.trim() || undefined,
          redirectUrl: nextPath || "/feed?welcome=1",
        }),
      });

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else if (data.error) {
        setServerError(data.error);
      } else {
        router.push(nextPath || "/feed?welcome=1");
      }
    } catch {
      setServerError("Failed to initiate checkout. Please try again.");
    } finally {
      setCheckoutLoading(false);
    }
  };

  const filteredCountries = COUNTRIES.filter(
    (c) =>
      c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
      c.dialCode.includes(countrySearch) ||
      c.code.toLowerCase().includes(countrySearch.toLowerCase())
  );

  /* ─────────────────────────── STEP 3: MEMBERSHIP ───────────────────────────
     Full width, clean 4-tier cards mirroring the /pricing page design. */
  if (step === "membership") {
    const selected = PRICING_PLANS.find((p) => p.id === selectedTier);

    return (
      <div className="min-h-[100dvh] bg-[#f8fafc] px-4 py-12 font-[var(--font-urbanist,Urbanist),sans-serif] dark:bg-[#0a1220] sm:px-6">
        <div className="mx-auto w-full max-w-7xl">
          <div className="mb-9 flex justify-center">
            <Link href="/">
              <Image src="/logo.webp" alt="TaxCompPro" width={150} height={52}
                className="object-contain dark:hidden" style={{ width: "150px", height: "auto" }} priority />
              <Image src="/logo_dark.webp" alt="TaxCompPro" width={150} height={52}
                className="hidden object-contain dark:block" style={{ width: "150px", height: "auto" }} priority />
            </Link>
          </div>

          <div className="mx-auto mb-10 max-w-2xl text-center">
            <div className="mx-auto mb-5 max-w-xs">
              <StepRail current={3} />
            </div>
            <h1 className="text-[28px] font-black leading-tight tracking-tight text-[#0a1628] sm:text-[34px] dark:text-white">
              Choose your membership
            </h1>
            <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              Every account needs an active plan to reach the tools, feed and directory.
              You can change or cancel it later.
            </p>
          </div>

          {serverError && (
            <div className="mx-auto mb-6 max-w-lg">
              <ErrorBanner message={serverError} />
            </div>
          )}

          {!pendingSignup && (
            <div className="mx-auto mb-8 max-w-xl">
              <ProfessionalTitleEditor />
            </div>
          )}

          {/* 4-tier Pricing Grid matching /pricing */}
          <div
            role="radiogroup"
            aria-label="Membership plan"
            className="pricing-grid mb-10"
          >
            {PRICING_PLANS.map((p) => (
              <PricingCard
                key={p.id}
                plan={p}
                mode="select"
                selected={selectedTier === p.id}
                onSelect={(tier) => setSelectedTier(tier)}
              />
            ))}
          </div>

          {/* Checkout / Free Continuation CTA */}
          <div className="mx-auto mt-9 max-w-lg">
            {selectedTier !== "FREE" ? (
              <>
                <div className="mb-4">
                  <label htmlFor="coupon" className={`${fieldLabel} mb-2`}>
                    Promo or referral code{" "}
                    <span className="font-normal text-slate-600 dark:text-slate-400">(optional)</span>
                  </label>
                  <div className="relative">
                    <Tag className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 dark:text-slate-400" />
                    <input
                      id="coupon"
                      type="text"
                      placeholder="Enter your code"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      className={`${inputBase} ${inputOk} py-3 pl-11 pr-4 uppercase tracking-wider placeholder:normal-case placeholder:tracking-normal`}
                    />
                  </div>
                  <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">
                    Codes are validated and applied at checkout.
                  </p>
                </div>

                <button type="button" disabled={checkoutLoading} onClick={handleProceedToCheckout} className={goldCta}>
                  {checkoutLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Connecting to Stripe…</span>
                    </>
                  ) : (
                    <>
                      <span>Continue to checkout{selected ? ` (${selected.price}${selected.period})` : ""}</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>

                <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                  <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
                  Secure 256-bit encrypted checkout on Stripe.
                </p>
              </>
            ) : (
              <>
                <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-5 text-center dark:border-white/10 dark:bg-white/[0.04]">
                  <p className="text-sm font-bold text-[#0a1628] dark:text-white">
                    You selected Basic Members Only (Free Forever)
                  </p>
                  <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                    No credit card required. You can explore the community and upgrade anytime from your settings.
                  </p>
                </div>

                <button type="button" onClick={handleProceedToCheckout} className={goldCta}>
                  <span>Get started for free</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  /* ─────────────────────────── STEP 2: VERIFY EMAIL ─────────────────────────── */
  if (step === "verify") {
    return (
      <AuthShell>
        <StepRail current={2} total={nextPath ? 2 : 3} />

        <header className="mb-7">
          <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#0a1628] dark:bg-amber-400/15">
            <MailCheck className="h-6 w-6 text-[#ffbe24]" strokeWidth={2} />
          </span>
          <h1 className="text-[28px] font-black leading-tight tracking-tight text-[#0a1628] sm:text-[32px] dark:text-white">
            Check your email
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            We sent a 6-digit code to{" "}
            <span className="break-all font-bold text-[#0a1628] dark:text-white">{pendingSignup?.email}</span>.
            Enter it below to confirm your address.
          </p>
        </header>

        <OtpInput
          value={otpCode}
          onChange={(v) => { setOtpCode(v); if (otpError) setOtpError(""); }}
          onComplete={(v) => handleVerifyOtp(v)}
          disabled={otpLoading}
          invalid={Boolean(otpError)}
          autoFocus
        />

        {otpError ? (
          <p role="alert" className="mt-3 text-sm font-medium text-red-600 dark:text-red-400">
            {otpError}
          </p>
        ) : (
          <p className="mt-3 text-xs text-slate-600 dark:text-slate-400">
            The code expires in 10 minutes.
          </p>
        )}

        <button
          type="button"
          onClick={() => handleVerifyOtp()}
          disabled={otpLoading || otpCode.replace(/\D/g, "").length !== 6}
          className={`${goldCta} mt-6`}
        >
          {otpLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Verifying…</span>
            </>
          ) : (
            <>
              <span>Verify and continue</span>
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>

        <div className="mt-6 flex items-center justify-between gap-4 border-t border-slate-200 pt-5 dark:border-white/10">
          <button
            type="button"
            onClick={() => { setStep("account"); setOtpCode(""); setOtpError(""); }}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 transition-colors hover:text-[#0a1628] dark:text-slate-300 dark:hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Change email
          </button>

          <button
            type="button"
            onClick={handleResendOtp}
            disabled={resendIn > 0 || resendLoading}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#ffbe24] hover:underline disabled:cursor-not-allowed disabled:text-slate-600 disabled:no-underline dark:text-[#ffbe24] dark:disabled:text-slate-400"
          >
            <RefreshCw className={`h-4 w-4 ${resendLoading ? "animate-spin" : ""}`} />
            {resendIn > 0 ? `Resend in ${resendIn}s` : resendLoading ? "Sending…" : "Resend code"}
          </button>
        </div>
      </AuthShell>
    );
  }

  /* ─────────────────────────── STEP 1: ACCOUNT ─────────────────────────── */
  return (
    <AuthShell>
      <StepRail current={1} total={nextPath ? 2 : 3} />

      <header className="mb-7">
        <h1 className="text-[28px] font-black leading-tight tracking-tight text-[#0a1628] sm:text-[32px] dark:text-white">
          Create your account
        </h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          Already have an account?{" "}
          <Link href={accountUrl("/login", nextPath || "/feed")} className="font-bold text-[#ffbe24] underline-offset-2 hover:underline dark:text-[#ffbe24]">
            Sign in
          </Link>
        </p>
      </header>

      {serverError && <ErrorBanner message={serverError} />}

      <button
        type="button"
        onClick={handleGoogle}
        disabled={googleLoading || loading}
        className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white py-3 text-sm font-semibold text-slate-700 transition-all hover:border-slate-300 hover:bg-slate-50 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/15 dark:bg-transparent dark:text-white dark:hover:bg-white/5"
      >
        {googleLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <GoogleMark />}
        {googleLoading ? "Redirecting…" : "Continue with Google"}
      </button>

      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-slate-200 dark:bg-white/10" />
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">or register with email</span>
        <div className="h-px flex-1 bg-slate-200 dark:bg-white/10" />
      </div>

      <form onSubmit={handleSubmit(onAccountSubmit)} noValidate className="space-y-5">
        {/* Full name */}
        <div className="space-y-2">
          <label htmlFor="name" className={fieldLabel}>Full name</label>
          <div className="relative">
            <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 dark:text-slate-400" />
            <input
              id="name" type="text" autoComplete="name" placeholder="Marcus Reyes"
              aria-invalid={Boolean(errors.name) || undefined}
              className={`${inputBase} ${errors.name ? inputErr : inputOk} py-3 pl-11 pr-4`}
              {...register("name")}
            />
          </div>
          {errors.name && <p className={fieldError}>{errors.name.message}</p>}
        </div>

        <div className="space-y-2"><label htmlFor="professional-title" className={fieldLabel}>Title / Role</label><select id="professional-title" className={`${inputBase} ${inputOk} p-3`} {...register("professionalTitle")} defaultValue=""><option value="" disabled>Select your professional title</option>{PROFESSIONAL_TITLES.map(title => <option key={title} value={title}>{title}</option>)}</select>{errors.professionalTitle && <p className={fieldError}>Please select your title / role.</p>}</div>
        {/* Email */}
        <div className="space-y-2">
          <label htmlFor="reg-email" className={fieldLabel}>Email address</label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 dark:text-slate-400" />
            <input
              id="reg-email" type="email" autoComplete="email" placeholder="you@firm.com"
              aria-invalid={Boolean(errors.email) || undefined}
              className={`${inputBase} ${errors.email ? inputErr : inputOk} py-3 pl-11 pr-4`}
              {...register("email")}
            />
          </div>
          {errors.email && <p className={fieldError}>{errors.email.message}</p>}
          <p className="text-xs text-slate-600 dark:text-slate-400">
            We send a verification code here before creating your account.
          </p>
        </div>

        {/* Phone with country selector */}
        <div className="space-y-2">
          <label htmlFor="phone" className={fieldLabel}>Phone number</label>
          <div
            className={`relative flex items-center rounded-xl border bg-white transition-all dark:bg-[#0c1a2e] ${
              errors.phone
                ? "border-red-400 ring-4 ring-red-500/15"
                : "border-slate-200 focus-within:border-[#0a1628] focus-within:ring-4 focus-within:ring-[#0a1628]/10 dark:border-white/15 dark:focus-within:border-amber-400 dark:focus-within:ring-amber-400/20"
            }`}
          >
            <div className="relative" ref={countryPickerRef}>
              <button
                type="button"
                onClick={() => setShowCountryPicker((p) => !p)}
                aria-expanded={showCountryPicker}
                aria-label={`Country code, currently ${selectedCountry.name} ${selectedCountry.dialCode}`}
                className="flex shrink-0 items-center gap-1.5 rounded-l-xl border-r border-slate-200 px-3 py-3 text-sm font-semibold text-slate-800 transition-colors hover:bg-slate-50 dark:border-white/10 dark:text-white dark:hover:bg-white/5"
              >
                <span className="select-none text-base leading-none">{selectedCountry.flag}</span>
                <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
                  {selectedCountry.dialCode}
                </span>
                <ChevronDown className={`h-3.5 w-3.5 text-slate-500 transition-transform dark:text-slate-400 ${showCountryPicker ? "rotate-180" : ""}`} />
              </button>

              {showCountryPicker && (
                <div className="absolute left-0 top-full z-50 mt-1.5 flex max-h-64 w-64 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl dark:border-white/10 dark:bg-[#0f1d33]">
                  <div className="border-b border-slate-100 bg-slate-50 p-2 dark:border-white/10 dark:bg-white/5">
                    <div className="relative">
                      <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500 dark:text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search country"
                        value={countrySearch}
                        onChange={(e) => setCountrySearch(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 bg-white py-1.5 pl-7 pr-2.5 text-xs text-slate-800 outline-none placeholder:text-slate-500 focus:border-[#0a1628] dark:border-white/10 dark:bg-[#0c1a2e] dark:text-white dark:focus:border-amber-400"
                        autoFocus
                      />
                    </div>
                  </div>

                  <div className="max-h-48 overflow-y-auto p-1">
                    {filteredCountries.map((c) => (
                      <button
                        key={c.code}
                        type="button"
                        onClick={() => {
                          setSelectedCountry(c);
                          setShowCountryPicker(false);
                          setCountrySearch("");
                          if (phoneValue && (c.code === "US" || c.code === "CA")) {
                            setValue("phone", formatUSPhone(phoneValue));
                          }
                        }}
                        className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs transition-colors ${
                          selectedCountry.code === c.code
                            ? "bg-amber-50 font-bold text-amber-900 dark:bg-amber-400/10 dark:text-amber-300"
                            : "text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-white/5"
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <span className="text-base leading-none">{c.flag}</span>
                          <span>{c.name}</span>
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className="font-mono text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                            {c.dialCode}
                          </span>
                          {selectedCountry.code === c.code && (
                            <Check className="h-3.5 w-3.5 text-amber-700 dark:text-amber-400" />
                          )}
                        </span>
                      </button>
                    ))}

                    {filteredCountries.length === 0 && (
                      <p className="py-6 text-center text-xs text-slate-600 dark:text-slate-400">
                        No country matches that search.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="relative flex flex-1 items-center">
              <Phone className="pointer-events-none absolute left-3 h-4 w-4 text-slate-500 dark:text-slate-400" />
              <input
                id="phone"
                type="tel"
                autoComplete="tel-national"
                placeholder={
                  selectedCountry.code === "US" || selectedCountry.code === "CA"
                    ? "(555) 000-0000"
                    : "Phone number"
                }
                value={phoneValue}
                onChange={handlePhoneChange}
                aria-invalid={Boolean(errors.phone) || undefined}
                className="w-full bg-transparent py-3 pl-9 pr-3 font-[inherit] text-sm text-slate-900 outline-none placeholder:text-slate-500 dark:text-white dark:placeholder:text-slate-400"
              />
            </div>
          </div>
          {errors.phone && <p className={fieldError}>{errors.phone.message}</p>}
        </div>

        {/* Password */}
        <div className="space-y-2">
          <label htmlFor="reg-password" className={fieldLabel}>Password</label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 dark:text-slate-400" />
            <input
              id="reg-password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="At least 8 characters"
              aria-invalid={Boolean(errors.password) || undefined}
              className={`${inputBase} ${errors.password ? inputErr : inputOk} py-3 pl-11 pr-11`}
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword((p) => !p)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-500 transition-colors hover:text-[#0a1628] dark:text-slate-400 dark:hover:text-white"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && <p className={fieldError}>{errors.password.message}</p>}
        </div>

        {/* Confirm password */}
        <div className="space-y-2">
          <label htmlFor="confirmPassword" className={fieldLabel}>Confirm password</label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 dark:text-slate-400" />
            <input
              id="confirmPassword"
              type={showConfirm ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Repeat your password"
              aria-invalid={Boolean(errors.confirmPassword) || undefined}
              className={`${inputBase} ${errors.confirmPassword ? inputErr : inputOk} py-3 pl-11 pr-11`}
              {...register("confirmPassword")}
            />
            <button
              type="button"
              onClick={() => setShowConfirm((p) => !p)}
              aria-label={showConfirm ? "Hide password" : "Show password"}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-500 transition-colors hover:text-[#0a1628] dark:text-slate-400 dark:hover:text-white"
            >
              {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.confirmPassword && <p className={fieldError}>{errors.confirmPassword.message}</p>}
        </div>

        {/* Terms */}
        <div className="space-y-2">
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              {...register("agreeTerms")}
              className="mt-0.5 h-4 w-4 shrink-0 accent-[#ffbe24]"
            />
            <span className="text-sm text-slate-600 dark:text-slate-300">
              I agree to the{" "}
              <Link href="/terms" className="font-semibold text-[#0a1628] underline underline-offset-2 dark:text-[#ffbe24]">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="font-semibold text-[#0a1628] underline underline-offset-2 dark:text-[#ffbe24]">
                Privacy Policy
              </Link>
            </span>
          </label>
          {errors.agreeTerms && <p className={fieldError}>{errors.agreeTerms.message}</p>}
        </div>

        <button type="submit" disabled={loading || googleLoading} className={goldCta}>
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Sending code…</span>
            </>
          ) : (
            <>
              <span>Continue</span>
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </form>
    </AuthShell>
  );
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}
