"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "@/lib/auth-client";
import { loginSchema, type LoginInput } from "@/lib/schemas";
import { Mail, Lock, ArrowRight, Globe, Eye, EyeOff, Check } from "lucide-react";
import Image from "next/image";

// Inner component that uses useSearchParams — must be inside <Suspense>
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

  // Pre-fill email from localStorage if previously remembered
  useEffect(() => {
    const saved = localStorage.getItem("tcp_remembered_email");
    if (saved) {
      setValue("email", saved);
      setRememberMe(true);
    }
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
    catch { setServerError("Google sign-in failed."); }
    finally { setGoogleLoading(false); }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-8">
      <h1 className="text-2xl font-black text-[#0a1628] mb-1">Welcome back</h1>
      <p className="text-slate-500 text-sm mb-6">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="text-[#d4a017] font-bold hover:underline">Create one free</Link>
      </p>

      {serverError && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-5">{serverError}</div>
      )}

      {/* Google */}
      <button onClick={handleGoogle} disabled={googleLoading}
        className="w-full flex items-center justify-center gap-3 border border-slate-200 rounded-xl py-3 font-semibold text-sm text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all mb-5 disabled:opacity-60">
        <Globe className="w-4 h-4" />
        {googleLoading ? "Redirecting…" : "Continue with Google"}
      </button>

      <div className="flex items-center gap-3 mb-5">
        <div className="flex-1 h-px bg-slate-100" />
        <span className="text-xs text-slate-400">or sign in with email</span>
        <div className="flex-1 h-px bg-slate-100" />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-semibold text-[#0a1628] mb-1.5">Email Address</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input id="email" type="email" placeholder="you@example.com"
              className={`w-full font-[inherit] text-sm pl-10 pr-4 py-3 border rounded-xl outline-none transition-all ${errors.email ? "border-red-400 focus:ring-2 focus:ring-red-100" : "border-slate-200 focus:border-[#0a1628] focus:ring-2 focus:ring-[#0a1628]/8"}`}
              {...register("email")} />
          </div>
          {errors.email && <p className="text-red-500 text-xs mt-1.5">{errors.email.message}</p>}
        </div>

        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label htmlFor="password" className="block text-sm font-semibold text-[#0a1628]">Password</label>
            <Link href="/forgot-password" className="text-xs text-slate-400 hover:text-[#d4a017] transition-colors">Forgot password?</Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input id="password" type={showPassword ? "text" : "password"} placeholder="••••••••"
              className={`w-full font-[inherit] text-sm pl-10 pr-10 py-3 border rounded-xl outline-none transition-all ${errors.password ? "border-red-400 focus:ring-2 focus:ring-red-100" : "border-slate-200 focus:border-[#0a1628] focus:ring-2 focus:ring-[#0a1628]/8"}`}
              {...register("password")} />
            <button type="button" onClick={() => setShowPassword(p => !p)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && <p className="text-red-500 text-xs mt-1.5">{errors.password.message}</p>}
        </div>

        {/* Remember Me */}
        <div className="flex items-center gap-3 pt-0.5">
          <button
            type="button"
            id="remember-me"
            onClick={() => setRememberMe(p => !p)}
            className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all duration-150 ${
              rememberMe
                ? "bg-[#0a1628] border-[#0a1628]"
                : "bg-white border-slate-300 hover:border-[#0a1628]"
            }`}
          >
            {rememberMe && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
          </button>
          <label
            htmlFor="remember-me"
            className="text-sm text-slate-600 cursor-pointer select-none"
            onClick={() => setRememberMe(p => !p)}
          >
            Remember me
          </label>
        </div>

        <button type="submit" disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#f0c040] to-[#d4a017] text-[#0a1628] font-bold text-sm py-3.5 rounded-full hover:shadow-[0_0_20px_rgba(212,160,23,0.4)] hover:-translate-y-0.5 transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none mt-1">
          {loading ? "Signing in…" : <><span>Sign In</span><ArrowRight className="w-4 h-4" /></>}
        </button>
      </form>

      <p className="text-center text-xs text-slate-400 mt-6">
        By signing in you agree to our{" "}
        <Link href="/terms" className="underline hover:text-[#0a1628]">Terms</Link> and{" "}
        <Link href="/privacy" className="underline hover:text-[#0a1628]">Privacy Policy</Link>.
      </p>
    </div>
  );
}

// Outer page — wraps LoginForm in Suspense to satisfy Next.js build requirement
export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 font-[var(--font-urbanist,Urbanist),sans-serif] px-4 py-12">
      <div className="w-full max-w-[420px]">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Link href="/">
            <Image src="/logo.webp"      alt="TaxCompPro" width={160} height={60} className="object-contain dark:hidden" style={{ width: "auto", height: "auto" }} loading="eager" />
            <Image src="/logo_dark.webp" alt="TaxCompPro" width={160} height={60} className="object-contain hidden dark:block" style={{ width: "auto", height: "auto" }} loading="eager" />
          </Link>
        </div>

        <Suspense fallback={
          <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-8 flex items-center justify-center min-h-[400px]">
            <div className="w-8 h-8 border-2 border-[#d4a017] border-t-transparent rounded-full animate-spin" />
          </div>
        }>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
