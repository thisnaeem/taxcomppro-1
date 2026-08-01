"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signUp, signIn } from "@/lib/auth-client";
import { z } from "zod";
import { Mail, Lock, User, ArrowRight, Globe, Eye, EyeOff } from "lucide-react";
import Image from "next/image";

const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
  agreeTerms: z.boolean().refine((v) => v === true, "You must agree to the terms"),
}).refine((d) => d.password === d.confirmPassword, { message: "Passwords do not match", path: ["confirmPassword"] });

type FormData = z.infer<typeof schema>;

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") || "/feed";
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { agreeTerms: false },
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true); setServerError("");
    try {
      const res = await signUp.email({ email: data.email, password: data.password, name: data.name });
      if (res.error) setServerError(res.error.message || "Registration failed.");
      else router.push(nextPath);
    } catch { setServerError("Something went wrong. Please try again."); }
    finally { setLoading(false); }
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    try { await signIn.social({ provider: "google", callbackURL: nextPath }); }
    catch { setServerError("Google sign-in failed."); }
    finally { setGoogleLoading(false); }
  };

  const inputCls = (err: boolean) =>
    `w-full font-[inherit] text-sm pl-10 pr-10 py-3 border rounded-xl outline-none transition-all ${err ? "border-red-400 focus:ring-2 focus:ring-red-100" : "border-slate-200 focus:border-[#0a1628] focus:ring-2 focus:ring-[#0a1628]/8"}`;

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

        {/* Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-8">
          <h1 className="text-2xl font-black text-[#0a1628] mb-1">Create your account</h1>
          <p className="text-slate-500 text-sm mb-6">
            Already have an account?{" "}
            <Link href="/login" className="text-[#d4a017] font-bold hover:underline">Sign in</Link>
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
            <span className="text-xs text-slate-400">or register with email</span>
            <div className="flex-1 h-px bg-slate-100" />
          </div>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-semibold text-[#0a1628] mb-1.5">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input id="name" type="text" placeholder="John Smith" className={inputCls(!!errors.name)} {...register("name")} />
              </div>
              {errors.name && <p className="text-red-500 text-xs mt-1.5">{errors.name.message}</p>}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="reg-email" className="block text-sm font-semibold text-[#0a1628] mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input id="reg-email" type="email" placeholder="you@example.com" className={inputCls(!!errors.email)} {...register("email")} />
              </div>
              {errors.email && <p className="text-red-500 text-xs mt-1.5">{errors.email.message}</p>}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="reg-password" className="block text-sm font-semibold text-[#0a1628] mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input id="reg-password" type={showPassword ? "text" : "password"} placeholder="At least 8 characters" className={inputCls(!!errors.password)} {...register("password")} />
                <button type="button" onClick={() => setShowPassword(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1.5">{errors.password.message}</p>}
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-semibold text-[#0a1628] mb-1.5">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input id="confirmPassword" type={showConfirm ? "text" : "password"} placeholder="Repeat your password" className={inputCls(!!errors.confirmPassword)} {...register("confirmPassword")} />
                <button type="button" onClick={() => setShowConfirm(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.confirmPassword && <p className="text-red-500 text-xs mt-1.5">{errors.confirmPassword.message}</p>}
            </div>

            {/* Terms */}
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" {...register("agreeTerms")} className="mt-0.5 w-4 h-4 shrink-0 accent-[#0a1628]" />
              <span className="text-sm text-slate-500">
                I agree to the <Link href="/terms" className="text-[#0a1628] font-semibold underline">Terms of Service</Link> and{" "}
                <Link href="/privacy" className="text-[#0a1628] font-semibold underline">Privacy Policy</Link>
              </span>
            </label>
            {errors.agreeTerms && <p className="text-red-500 text-xs -mt-2">{errors.agreeTerms.message}</p>}

            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#f0c040] to-[#d4a017] text-[#0a1628] font-bold text-sm py-3.5 rounded-full hover:shadow-[0_0_20px_rgba(212,160,23,0.4)] hover:-translate-y-0.5 transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none">
              {loading ? "Creating Account…" : <><span>Create Free Account</span><ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>
        </div>
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
