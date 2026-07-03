"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { API_BASE } from "@/lib/api";
import { supabase } from "@/lib/supabase-browser";

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    if (password !== confirmPassword) {
      setLoading(false);
      setMessage("Passwords do not match.");
      return;
    }

    if (!agreeTerms) {
      setLoading(false);
      setMessage("Please agree to the Terms of Service and Privacy Policy.");
      return;
    }

    // Step 1: First sign up via Supabase Auth
    const { data: supabaseData, error: supabaseError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    let userIdToUse: string | null = null;

    if (supabaseData.user) {
      userIdToUse = supabaseData.user.id;
    }

    // Step 2: Call backend to create user profile in our database regardless
    try {
      if (userIdToUse) {
        const response = await fetch(`${API_BASE}/auth/signup`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: userIdToUse,
            email: email,
            full_name: fullName,
            requested_role: "student",
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Backend Error:", response.status, errorText);
        }
      }
    } catch (backendError) {
      console.error("Backend registration failed:", backendError);
    }

    setLoading(false);

    if (supabaseError && !userIdToUse) {
      setMessage(`Registration Error: ${supabaseError.message}`);
    } else {
      router.push("/auth/register-success");
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <img
          src="https://coresg-normal.trae.ai/api/v1/text-to-image?prompt=education%20illustration%20books%20and%20gears%20in%20blue%20and%20orange%20colors&image_size=square"
          alt=""
          className="absolute -right-10 top-10 w-96 opacity-40 animate-float"
        />
        <img
          src="https://coresg-normal.trae.ai/api/v1/text-to-image?prompt=abstract%20educational%20shapes%20pencils%20books%20blue%20theme&image_size=square"
          alt=""
          className="absolute -left-20 bottom-20 w-72 opacity-30 animate-float"
          style={{ animationDelay: "1s" }}
        />
      </div>

      <div className="relative z-10 flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-5xl grid md:grid-cols-2 gap-8 items-center">
          {/* Left side (illustration) - hidden on mobile */}
          <div className="hidden md:block relative animate-fade-in-up" style={{ animationDelay: "400ms" }}>
            <img
              src="https://coresg-normal.trae.ai/api/v1/text-to-image?prompt=education%20illustration%20books%20study%20students%20blue%20and%20orange%20colors%20clean%20design&image_size=landscape_16_9"
              alt="Education illustration"
              className="w-full rounded-3xl shadow-2xl"
            />
          </div>

          {/* Right side (register form) */}
          <div className="bg-white rounded-3xl shadow-2xl p-6 md:p-8 animate-fade-in-up">
            <div className="flex items-center justify-between mb-6 animate-fade-in" style={{ animationDelay: "100ms" }}>
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-[0_4px_20px_rgba(30,64,175,0.3)] animate-float">
                  <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6 fill-current">
                    <path d="M10.5 3.75c-1.67 0-3 1.33-3 3 0 .9.39 1.7 1.01 2.25-.84.49-1.41 1.4-1.41 2.44v1.31H5.75a2.75 2.75 0 1 0 0 5.5h2.5a2.75 2.75 0 0 0 2.75-2.75v-4c0-.69.56-1.25 1.25-1.25h.5a2.75 2.75 0 1 0 0-5.5h-2.25Z" />
                  </svg>
                </span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-blue-600">Department Archive</p>
                  <p className="text-lg font-semibold text-slate-900">OAU CSE</p>
                </div>
              </div>
            </div>

            <h1 className="text-2xl font-bold text-slate-900 mb-2 animate-fade-in-up" style={{ animationDelay: "200ms" }}>Create Your OAU CSE Account</h1>
            <p className="text-slate-600 mb-6 animate-fade-in-up" style={{ animationDelay: "300ms" }}>Join your institutional network.</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full Name Field */}
              <div className="relative animate-fade-in-up" style={{ animationDelay: "400ms" }}>
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-300 text-slate-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  placeholder="Full Name"
                  autoComplete="name"
                />
              </div>

              {/* Email Field */}
              <div className="relative animate-fade-in-up" style={{ animationDelay: "500ms" }}>
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-300 text-slate-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  placeholder="Institutional Email Address"
                  autoComplete="email"
                />
              </div>

              {/* Password Field */}
              <div className="relative animate-fade-in-up" style={{ animationDelay: "600ms" }}>
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-300 text-slate-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  placeholder="Create Password"
                  autoComplete="new-password"
                />
              </div>

              {/* Confirm Password Field */}
              <div className="relative animate-fade-in-up" style={{ animationDelay: "700ms" }}>
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full pl-12 pr-12 py-3 rounded-xl border border-slate-300 text-slate-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  placeholder="Confirm Password"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </button>
              </div>

              {/* Terms Checkbox */}
              <label className="flex items-center gap-2 animate-fade-in-up" style={{ animationDelay: "800ms" }}>
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-slate-600">
                  I agree to the{" "}
                  <a href="#" className="text-blue-600 hover:text-blue-700 font-medium">Terms of Service</a>
                  {" "}and{" "}
                  <a href="#" className="text-blue-600 hover:text-blue-700 font-medium">Privacy Policy</a>
                </span>
              </label>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-800 text-white font-semibold py-3 rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40 hover:-translate-y-0.5 transition-all disabled:opacity-70 disabled:cursor-not-allowed animate-fade-in-up"
                style={{ animationDelay: "900ms" }}
              >
                {loading ? "Creating account..." : "Create Account"}
              </button>
            </form>

            {message && (
              <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 animate-fade-in" style={{ animationDelay: "1000ms" }}>
                {message}
              </div>
            )}

            {/* Divider */}
            <div className="mt-6 flex items-center gap-4 animate-fade-in" style={{ animationDelay: "1100ms" }}>
              <div className="flex-1 h-px bg-slate-300"></div>
              <span className="text-sm text-slate-500 font-medium">Or register with</span>
              <div className="flex-1 h-px bg-slate-300"></div>
            </div>

            {/* Social Logins */}
            <div className="mt-4 grid grid-cols-3 gap-3">
              {[
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
                    <svg className="w-5 h-5 text-blue-700" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M4.98 3.5c0 1.381-1.11 2.5-2.48 2.5-1.38 0-2.48-1.119-2.48-2.5 0-1.38 1.1-2.5 2.48-2.5 1.37 0 2.48 1.12 2.48 2.5zm0 0M6.004 6h3.996v14.25h-3.996zm4.496 0h3.836l.018 2.208c.577-.988 1.77-2.208 3.91-2.208 2.804 0 4.736 1.716 4.736 5.83v6.42h-3.996v-5.532c0-1.392-.497-2.346-1.664-2.346-1.343 0-2.087 1.02-2.087 2.394v5.484h-3.997z" />
                    </svg>
                  ),
                  label: "LinkedIn"
                }
              ].map((social, i) => (
                <button
                  key={social.label}
                  type="button"
                  className="flex items-center justify-center gap-2 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 transition-all shadow-sm animate-fade-in-up hover:-translate-y-1"
                  style={{ animationDelay: `${1200 + i * 100}ms` }}
                >
                  {social.icon}
                  <span className="font-semibold text-slate-700 text-sm">{social.label}</span>
                </button>
              ))}
            </div>

            <p className="mt-4 text-center text-sm text-slate-600 animate-fade-in" style={{ animationDelay: "1500ms" }}>
              Already have an account?{" "}
              <Link href="/auth/login" className="font-semibold text-blue-700 hover:text-blue-800">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
