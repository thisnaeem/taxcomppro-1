"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useRef, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signUp, signIn } from "@/lib/auth-client";
import { z } from "zod";
import {
  Mail,
  Lock,
  User,
  Phone,
  ArrowRight,
  Globe,
  Eye,
  EyeOff,
  ChevronDown,
  Check,
  Search,
} from "lucide-react";
import Image from "next/image";

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

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") || "/feed";
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Country selection state - initialized to USA
  const [selectedCountry, setSelectedCountry] = useState<Country>(COUNTRIES[0]);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");
  const countryPickerRef = useRef<HTMLDivElement>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { agreeTerms: false, phone: "" },
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

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    clearErrors("phone");

    if (selectedCountry.code === "US" || selectedCountry.code === "CA") {
      const formatted = formatUSPhone(rawVal);
      setValue("phone", formatted, { shouldValidate: false });
    } else {
      const cleaned = rawVal.replace(/[^\d\s\-()]/g, "").slice(0, 16);
      setValue("phone", cleaned, { shouldValidate: false });
    }
  };

  const onSubmit = async (data: FormData) => {
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
      const res = await signUp.email({
        email: data.email,
        password: data.password,
        name: data.name,
        phone: fullPhoneNumber,
      } as any);

      if (res.error) {
        setServerError(res.error.message || "Registration failed.");
      } else {
        router.push(nextPath);
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
      await signIn.social({ provider: "google", callbackURL: nextPath });
    } catch {
      setServerError("Google sign-in failed.");
    } finally {
      setGoogleLoading(false);
    }
  };

  const filteredCountries = COUNTRIES.filter(
    (c) =>
      c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
      c.dialCode.includes(countrySearch) ||
      c.code.toLowerCase().includes(countrySearch.toLowerCase())
  );

  const inputCls = (err: boolean) =>
    `w-full font-[inherit] text-sm pl-10 pr-10 py-3 border rounded-xl outline-none transition-all ${
      err
        ? "border-red-400 focus:ring-2 focus:ring-red-100"
        : "border-slate-200 focus:border-[#0a1628] focus:ring-2 focus:ring-[#0a1628]/8"
    }`;

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 font-[var(--font-urbanist,Urbanist),sans-serif] px-4 py-12">
      <div className="w-full max-w-[440px]">
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

        {/* Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-8">
          <h1 className="text-2xl font-black text-[#0a1628] mb-1">Create your account</h1>
          <p className="text-slate-500 text-sm mb-6">
            Already have an account?{" "}
            <Link href="/login" className="text-[#d4a017] font-bold hover:underline">
              Sign in
            </Link>
          </p>

          {serverError && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-5">
              {serverError}
            </div>
          )}

          {/* Google */}
          <button
            onClick={handleGoogle}
            disabled={googleLoading}
            className="w-full flex items-center justify-center gap-3 border border-slate-200 rounded-xl py-3 font-semibold text-sm text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all mb-5 disabled:opacity-60 cursor-pointer"
          >
            <Globe className="w-4 h-4" />
            {googleLoading ? "Redirecting…" : "Continue with Google"}
          </button>

          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-slate-100" />
            <span className="text-xs text-slate-400">or register with email</span>
            <div className="flex-1 h-px bg-slate-100" />
          </div>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
            {/* Full Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-semibold text-[#0a1628] mb-1.5">
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

            {/* Email Address */}
            <div>
              <label htmlFor="reg-email" className="block text-sm font-semibold text-[#0a1628] mb-1.5">
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

            {/* Phone Number with Country Code & Flag Selector */}
            <div>
              <label htmlFor="phone" className="block text-sm font-semibold text-[#0a1628] mb-1.5">
                Phone Number
              </label>
              <div
                className={`relative flex items-center border rounded-xl transition-all bg-white ${
                  errors.phone
                    ? "border-red-400 ring-2 ring-red-100"
                    : "border-slate-200 focus-within:border-[#0a1628] focus-within:ring-2 focus-within:ring-[#0a1628]/8"
                }`}
              >
                {/* Country Code Selector Trigger */}
                <div className="relative" ref={countryPickerRef}>
                  <button
                    type="button"
                    onClick={() => setShowCountryPicker((p) => !p)}
                    className="flex items-center gap-1.5 px-3 py-3 text-slate-800 hover:bg-slate-50 rounded-l-xl transition-colors text-sm font-semibold border-r border-slate-200 cursor-pointer shrink-0"
                    title="Select Country"
                  >
                    <span className="text-base leading-none select-none">{selectedCountry.flag}</span>
                    <span className="text-xs text-slate-700 font-mono font-bold">
                      {selectedCountry.dialCode}
                    </span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
                        showCountryPicker ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {/* Dropdown Menu */}
                  {showCountryPicker && (
                    <div className="absolute left-0 top-full mt-1.5 w-64 max-h-64 overflow-hidden flex flex-col bg-white border border-slate-200 rounded-xl shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-100">
                      {/* Search in countries */}
                      <div className="p-2 border-b border-slate-100 bg-slate-50/70">
                        <div className="relative">
                          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                          <input
                            type="text"
                            placeholder="Search country..."
                            value={countrySearch}
                            onChange={(e) => setCountrySearch(e.target.value)}
                            className="w-full text-xs pl-7 pr-2.5 py-1.5 bg-white border border-slate-200 rounded-lg outline-none focus:border-[#0a1628]"
                            autoFocus
                          />
                        </div>
                      </div>

                      <div className="overflow-y-auto p-1 divide-y divide-slate-50 max-h-48">
                        {filteredCountries.map((c) => (
                          <button
                            key={c.code}
                            type="button"
                            onClick={() => {
                              setSelectedCountry(c);
                              setShowCountryPicker(false);
                              setCountrySearch("");
                              // reformat current input if switched
                              if (phoneValue) {
                                if (c.code === "US" || c.code === "CA") {
                                  setValue("phone", formatUSPhone(phoneValue));
                                }
                              }
                            }}
                            className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-lg transition-colors cursor-pointer text-left ${
                              selectedCountry.code === c.code
                                ? "bg-amber-50 text-amber-950 font-bold"
                                : "hover:bg-slate-50 text-slate-700"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-base leading-none">{c.flag}</span>
                              <span>{c.name}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-slate-400 text-[11px] font-semibold">
                                {c.dialCode}
                              </span>
                              {selectedCountry.code === c.code && (
                                <Check className="w-3.5 h-3.5 text-amber-600" />
                              )}
                            </div>
                          </button>
                        ))}

                        {filteredCountries.length === 0 && (
                          <div className="py-4 text-center text-xs text-slate-400">
                            No country found
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Phone Input */}
                <div className="relative flex-1 flex items-center">
                  <Phone className="absolute left-3 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    id="phone"
                    type="tel"
                    placeholder={
                      selectedCountry.code === "US" || selectedCountry.code === "CA"
                        ? "(555) 000-0000"
                        : "Phone number"
                    }
                    value={phoneValue}
                    onChange={handlePhoneChange}
                    className="w-full font-[inherit] text-sm pl-9 pr-3 py-3 outline-none bg-transparent"
                  />
                </div>
              </div>
              {errors.phone && <p className="text-red-500 text-xs mt-1.5">{errors.phone.message}</p>}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="reg-password" className="block text-sm font-semibold text-[#0a1628] mb-1.5">
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
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-500 text-xs mt-1.5">{errors.password.message}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-semibold text-[#0a1628] mb-1.5"
              >
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
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-red-500 text-xs mt-1.5">{errors.confirmPassword.message}</p>
              )}
            </div>

            {/* Terms */}
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                {...register("agreeTerms")}
                className="mt-0.5 w-4 h-4 shrink-0 accent-[#0a1628]"
              />
              <span className="text-sm text-slate-500">
                I agree to the{" "}
                <Link href="/terms" className="text-[#0a1628] font-semibold underline">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="text-[#0a1628] font-semibold underline">
                  Privacy Policy
                </Link>
              </span>
            </label>
            {errors.agreeTerms && (
              <p className="text-red-500 text-xs -mt-2">{errors.agreeTerms.message}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#f0c040] to-[#d4a017] text-[#0a1628] font-bold text-sm py-3.5 rounded-full hover:shadow-[0_0_20px_rgba(212,160,23,0.4)] hover:-translate-y-0.5 transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none cursor-pointer"
            >
              {loading ? (
                "Creating Account…"
              ) : (
                <>
                  <span>Create Free Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
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
