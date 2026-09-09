"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "@/lib/auth-client";
import { loginSchema, type LoginInput } from "@/lib/schemas";
import { Mail, Lock, ArrowRight, Eye, EyeOff, Check, AlertCircle, Loader2 } from "lucide-react";
import AuthShell from "@/components/auth/AuthShell";
import GoogleMark from "@/components/auth/GoogleMark";

// Radius system for this page: inputs and secondary buttons 12px, cards 16px,
// primary CTA full pill. Applied consistently across both auth screens.
const inputBase =
  "w-full font-[inherit] text-sm rounded-xl border bg-white text-[#0a1628] placeholder:text-slate-500 outline-none transition-all " +
  "dark:bg-[#0c1a2e] dark:text-white dark:placeholder:text-slate-400";
const inputOk =
  "border-slate-200 focus:border-[#0a1628] focus:ring-4 focus:ring-[#0a1628]/10 dark:border-white/15 dark:focus:border-amber-400 dark:focus:ring-amber-400/20";
const inputErr =
  "border-red-400 focus:border-red-500 focus:ring-4 focus:ring-red-500/15";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") || searchParams.get("redirect") || "/feed";
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  // Pre-fill email from localStorage if previously remembered.
  // rememberMe already defaults to true, so only the field value needs restoring.
  useEffect(() => {
    const saved = localStorage.getItem("tcp_remembered_email");
    if (saved) setValue("email", saved);
  }, [setValue]);

  const onSubmit = async (data: LoginInput) => {
    setLoading(true); setServerError("");
    try {
      const res = await signIn.email({ email: data.email, password: data.password, rememberMe });
      if (res.error) {
        setServerError(res.error.message || "Invalid email or password.");
      } else {
        // Save or clear remembered email
        if (rememberMe) localStorage.setItem("tcp_remembered_email", data.email);
        else localStorage.removeItem("tcp_remembered_email");
        router.push(nextPath);
      }
    } catch { setServerError("Something went wrong. Please try again."); }
    finally { setLoading(false); }
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    try { await signIn.social({ provider: "google", callbackURL: nextPath }); }
    catch { setServerError("Google sign-in failed."); setGoogleLoading(false); }
  };

  return (
    <>
      <header className="mb-8">
        <h1 className="text-[28px] sm:text-[32px] font-black leading-tight tracking-tight text-[#0a1628] dark:text-white">
          Welcome back
        </h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          New to Tax Compliance Pro?{" "}
          <Link
            href="/register"
            className="font-bold text-[#b8860b] underline-offset-2 hover:underline dark:text-[#f0c040]"
          >
            Create an account
          </Link>
        </p>
      </header>

      {serverError && (
        <div
          role="alert"
          className="mb-6 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{serverError}</span>
        </div>
      )}

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
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">or sign in with email</span>
        <div className="h-px flex-1 bg-slate-200 dark:bg-white/10" />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        <div className="space-y-2">
          <label htmlFor="email" className="block text-sm font-semibold text-[#0a1628] dark:text-white">
            Email address
          </label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 dark:text-slate-400" />
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@firm.com"
              aria-invalid={Boolean(errors.email) || undefined}
              aria-describedby={errors.email ? "email-error" : undefined}
              className={`${inputBase} ${errors.email ? inputErr : inputOk} py-3 pl-11 pr-4`}
              {...register("email")}
            />
          </div>
          {errors.email && (
            <p id="email-error" className="text-xs font-medium text-red-600 dark:text-red-400">
              {errors.email.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="block text-sm font-semibold text-[#0a1628] dark:text-white">
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-xs font-semibold text-slate-600 transition-colors hover:text-[#b8860b] dark:text-slate-300 dark:hover:text-[#f0c040]"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 dark:text-slate-400" />
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="Enter your password"
              aria-invalid={Boolean(errors.password) || undefined}
              aria-describedby={errors.password ? "password-error" : undefined}
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
          {errors.password && (
            <p id="password-error" className="text-xs font-medium text-red-600 dark:text-red-400">
              {errors.password.message}
            </p>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            role="checkbox"
            aria-checked={rememberMe}
            onClick={() => setRememberMe((p) => !p)}
            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-all ${
              rememberMe
                ? "border-[#0a1628] bg-[#0a1628] dark:border-amber-400 dark:bg-amber-400"
                : "border-slate-300 bg-white hover:border-[#0a1628] dark:border-white/25 dark:bg-transparent"
            }`}
          >
            {rememberMe && <Check className="h-3 w-3 text-white dark:text-[#0a1628]" strokeWidth={3} />}
          </button>
          <span
            onClick={() => setRememberMe((p) => !p)}
            className="cursor-pointer select-none text-sm text-slate-600 dark:text-slate-300"
          >
            Keep me signed in
          </span>
        </div>

        <button
          type="submit"
          disabled={loading || googleLoading}
          className="mt-1 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#f0c040] to-[#d4a017] py-3.5 text-sm font-bold text-[#0a1628] transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(212,160,23,0.35)] active:translate-y-0 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-none"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Signing in…</span>
            </>
          ) : (
            <>
              <span>Sign in</span>
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </form>

      <p className="mt-7 text-center text-xs leading-relaxed text-slate-500 dark:text-slate-400">
        By signing in you agree to our{" "}
        <Link href="/terms" className="underline underline-offset-2 hover:text-[#0a1628] dark:hover:text-white">Terms</Link>{" "}
        and{" "}
        <Link href="/privacy" className="underline underline-offset-2 hover:text-[#0a1628] dark:hover:text-white">Privacy Policy</Link>.
      </p>
    </>
  );
}

function FormSkeleton() {
  return (
    <div className="animate-pulse space-y-5" aria-hidden="true">
      <div className="h-8 w-2/3 rounded-lg bg-slate-200 dark:bg-white/10" />
      <div className="h-4 w-1/2 rounded bg-slate-200 dark:bg-white/10" />
      <div className="h-12 rounded-xl bg-slate-200 dark:bg-white/10" />
      <div className="h-4 w-1/3 rounded bg-slate-200 dark:bg-white/10" />
      <div className="h-12 rounded-xl bg-slate-200 dark:bg-white/10" />
      <div className="h-12 rounded-xl bg-slate-200 dark:bg-white/10" />
      <div className="h-12 rounded-full bg-slate-200 dark:bg-white/10" />
    </div>
  );
}

export default function LoginPage() {
  return (
    <AuthShell>
      <Suspense fallback={<FormSkeleton />}>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
