"use client";

import { useState, ChangeEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { useAuth } from "@/components/AuthProvider";
import { API_BASE } from "@/lib/api";
import { supabase } from "@/lib/supabase-browser";
import { UserRole } from "@/types/auth";

interface LoginValidationResponse {
  user: {
    role: "staff" | "student";
    status: string;
    is_staff_verified: boolean;
  };
}

export default function AuthLoginPage() {
  const router = useRouter();
  const { setSession } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (event: ChangeEvent) => {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.session?.access_token) {
      setLoading(false);
      setMessage(error?.message ?? "Unable to login.");
      return;
    }

    let validationResponse;
    try {
      validationResponse = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ access_token: data.session.access_token }),
      });
    } catch (fetchError) {
      setLoading(false);
      setMessage("Backend login validation failed - could not connect to server.");
      return;
    }

    if (!validationResponse.ok) {
      setLoading(false);
      setMessage(`Backend login validation failed (status ${validationResponse.status}).`);
      return;
    }

    const payload = (await validationResponse.json()) as LoginValidationResponse;

    let userRole: UserRole = "student";
    if (payload.user.status === "Pending Staff Verification") {
      userRole = "pending";
    } else if (payload.user.role === "staff" && payload.user.is_staff_verified) {
      userRole = "staff";
    }

    setSession({
      accessToken: data.session.access_token,
      userRole: userRole,
      userProfile: {
        id: data.session.user.id,
        email: data.session.user.email || "",
        fullName: data.session.user.user_metadata?.full_name || null,
      },
    });

    setLoading(false);
    router.push(userRole === "staff" ? "/dashboard/staff" : "/results?q=");
  };

  const socialLogins = [
    {
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.255c0-.709-.064-1.39-.182-2.041H12v3.869h5.923a5.1 5.1 0 0 1-2.096 3.344v2.776h3.345c1.96-1.805 3.088-4.465 3.088-7.948z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.457-.99 7.282-2.68l-3.345-2.776c-.99.665-2.246 1.062-3.937 1.062-3.021 0-5.585-2.04-6.496-4.778H2.117v2.87C3.868 20.067 7.66 23 12 23z" />
          <path fill="#FBBC05" d="M5.504 13.828a6.976 6.976 0 0 1 0-4.396V6.562H2.117a11.996 11.996 0 0 0 0 10.876l3.387-2.87z" />
          <path fill="#EA4335" d="M12 4.578c1.696 0 3.218.583 4.415 1.725l3.297-3.297C17.44 1.187 14.97 0 12 0 7.66 0 3.868 2.933 2.117 6.562l3.387 2.87c.91-2.738 3.475-4.778 6.496-4.778z" />
        </svg>
      ),
      label: "Google"
    },
    {
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <rect x="2" y="2" width="20" height="20" rx="2" fill="#F25022" />
          <rect x="2" y="2" width="9" height="9" rx="1" fill="#00A4EF" />
          <rect x="13" y="2" width="9" height="9" rx="1" fill="#7FBA00" />
          <rect x="2" y="13" width="9" height="9" rx="1" fill="#FFB900" />
          <rect x="13" y="13" width="9" height="9" rx="1" fill="#00A1F1" />
        </svg>
      ),
      label: "Microsoft"
    },
    {
      icon: (
        <svg className="w-5 h-5 text-[#0A66C2]" viewBox="0 0 24 24" fill="currentColor">
          <path d="M4.98 3.5c0 1.381-1.11 2.5-2.48 2.5-1.38 0-2.48-1.119-2.48-2.5 0-1.38 1.1-2.5 2.48-2.5 1.37 0 2.48 1.12 2.48 2.5zm0 0M6.004 6h3.996v14.25h-3.996zm4.496 0h3.836l.018 2.208c.577-.988 1.77-2.208 3.91-2.208 2.804 0 4.736 1.716 4.736 5.83v6.42h-3.996v-5.532c0-1.392-.497-2.346-1.664-2.346-1.343 0-2.087 1.02-2.087 2.394v5.484h-3.997z" />
        </svg>
      ),
      label: "LinkedIn"
    }
  ];

  const features = [
    "Search 12,458+ resources",
    "Browse by course & level",
    "Download & cite materials instantly"
  ];

  return (
    <main className="min-h-screen w-full flex">
      <div className="w-full grid lg:grid-cols-2 grid-cols-1">
        {/* LEFT SIDE - Dark Navy Panel (desktop-only) */}
        <div className="hidden lg:flex relative flex-col justify-between min-h-screen overflow-hidden" style={{ backgroundColor: "#0a1628" }}>
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-15"
            style={{
              backgroundImage: `url('https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=obafemi%20awolowo%20university%20campus%20building%20aerial%20view%20green%20landscape%20academic%20architecture&image_size=portrait_4_3')`
            }}
          />
          <div className="absolute inset-0 hero-overlay" />

          <div className="relative z-10 p-12 flex flex-col h-full">
            <div className="flex items-center gap-4 mb-16">
              <div className="shield-logo w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg shadow-[#d4a017]/20">
                <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2L4 6v6c0 5.55 3.84 10.74 8 12 4.16-1.26 8-6.45 8-12V6l-8-4zm0 10.99h6c-.53 4.12-3.28 7.79-6 8.94V12.99H6V7.07l6-3v8.92z" />
                </svg>
              </div>
              <div>
                <h2 className="text-white text-2xl font-extrabold tracking-tight">OAU CSE</h2>
                <p className="text-gray-400 text-sm">Academic Search Engine</p>
              </div>
            </div>

            <div className="flex-1 flex flex-col justify-center max-w-md">
              <h1 className="text-white text-4xl font-bold leading-tight mb-6">
                Welcome to OAU CSE Academic Search Engine
              </h1>
              <p className="text-gray-300 text-base leading-relaxed mb-10">
                Access and search through thousands of lecture materials, research papers, and academic resources curated for the Department of Computer Science & Engineering community.
              </p>

              <ul className="space-y-5">
                {features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-4">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "rgba(212, 160, 23, 0.15)" }}>
                      <svg className="w-4 h-4" style={{ color: "#d4a017" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                    <span className="text-gray-200 font-medium">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-8">
              <div className="flex items-center gap-2 opacity-60">
                <div className="h-px flex-1 bg-gray-500" />
                <span className="text-gray-400 text-xs">Obafemi Awolowo University</span>
                <div className="h-px flex-1 bg-gray-500" />
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE - White/Light Form Panel */}
        <div className="flex items-center justify-center min-h-screen bg-gray-50 p-6 lg:p-12">
          <div className="w-full max-w-md">
            {/* Mobile brand header */}
            <div className="lg:hidden flex items-center justify-center gap-3 mb-10">
              <div className="shield-logo w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg shadow-[#d4a017]/20">
                <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2L4 6v6c0 5.55 3.84 10.74 8 12 4.16-1.26 8-6.45 8-12V6l-8-4zm0 10.99h6c-.53 4.12-3.28 7.79-6 8.94V12.99H6V7.07l6-3v8.92z" />
                </svg>
              </div>
              <div>
                <h2 className="text-[#0a1628] text-xl font-extrabold tracking-tight">OAU CSE</h2>
                <p className="text-gray-500 text-xs">Academic Search Engine</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 md:p-10">
              <div className="mb-8">
                <h1 className="text-[#0a1628] text-2xl md:text-3xl font-bold mb-2">Sign in to your account</h1>
                <p className="text-gray-500 text-sm">Enter your credentials to continue</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-[#0a1628] mb-2">Email Address</label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                        <polyline points="22,6 12,13 2,6" />
                      </svg>
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full pl-12 pr-4 py-3.5 rounded-lg border border-gray-200 text-[#0a1628] bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#d4a017]/30 focus:border-[#d4a017] outline-none transition-all text-sm"
                      placeholder="you@oauife.edu.ng"
                      autoComplete="email"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#0a1628] mb-2">Password</label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full pl-12 pr-12 py-3.5 rounded-lg border border-gray-200 text-[#0a1628] bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#d4a017]/30 focus:border-[#d4a017] outline-none transition-all text-sm"
                      placeholder="••••••••"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#0a1628] transition-colors"
                    >
                      {showPassword ? (
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                          <line x1="1" y1="1" x2="23" y2="23" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Link href="#" className="text-sm font-medium hover:underline" style={{ color: "#d4a017" }}>
                    Forgot password?
                  </Link>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full py-3.5 rounded-lg disabled:opacity-60 disabled:cursor-not-allowed text-sm shadow-lg shadow-[#0a1628]/20 hover:shadow-xl hover:shadow-[#0a1628]/25 transition-all"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Signing in...
                    </span>
                  ) : (
                    "Sign In"
                  )}
                </button>
              </form>

              {message && (
                <div className="mt-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  {message}
                </div>
              )}

              <div className="mt-8 flex items-center gap-4">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs text-gray-500 font-medium">Or continue with</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              <div className="mt-6 grid grid-cols-3 gap-3">
                {socialLogins.map((social) => (
                  <button
                    key={social.label}
                    type="button"
                    className="btn-outline py-3 rounded-lg hover:border-[#d4a017] hover:bg-[#d4a017]/5 transition-all"
                  >
                    {social.icon}
                  </button>
                ))}
              </div>

              <div className="mt-8 pt-6 border-t border-gray-100">
                <p className="text-center text-sm text-gray-600">
                  Don&apos;t have an account?{" "}
                  <Link href="/auth/register" className="font-bold hover:underline" style={{ color: "#d4a017" }}>
                    Sign Up
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
