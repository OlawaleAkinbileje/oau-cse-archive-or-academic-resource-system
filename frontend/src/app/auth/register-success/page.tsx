"use client";

import Link from "next/link";

import { BackButton } from "@/components/BackButton";
import { useAuth } from "@/components/AuthProvider";

export default function RegisterSuccessPage() {
  const { session } = useAuth();
  const userName = session.userProfile?.fullName || "there";

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 relative overflow-hidden">
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
      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-10">
        <section className="glass-panel w-full max-w-md p-8 text-center animate-fade-in-up">
          <div className="text-left animate-fade-in" style={{ animationDelay: "100ms" }}>
            <BackButton fallbackHref="/auth/login" label="Back" />
          </div>
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-blue-50 text-blue-700 shadow-[0_0_30px_rgba(59,130,246,0.18)] animate-fade-in-up" style={{ animationDelay: "200ms" }}>
            <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="section-label animate-fade-in-up" style={{ animationDelay: "300ms" }}>Registration Complete</p>
          <h1 className="mt-3 text-3xl font-semibold text-slate-900 animate-fade-in-up" style={{ animationDelay: "400ms" }}>
            Welcome, {userName}!
          </h1>
          <p className="mt-4 text-sm leading-7 text-slate-600 animate-fade-in-up" style={{ animationDelay: "500ms" }}>
            We&apos;ve sent a confirmation email to your inbox.
            Please click the link in the email to verify your account.
          </p>

          <div className="mt-8 space-y-4">
            <Link
              href="/"
              className="primary-button w-full text-sm animate-fade-in-up"
              style={{ animationDelay: "600ms" }}
            >
              Go to Homepage
            </Link>

            <div className="border-t border-slate-200 pt-2 animate-fade-in-up" style={{ animationDelay: "700ms" }}>
              <p className="mb-2 text-xs text-slate-500">Quick access to popular email providers:</p>
              <div className="flex justify-center gap-3">
                {[
                  { label: "Gmail", href: "https://mail.google.com" },
                  { label: "Outlook", href: "https://outlook.live.com" },
                  { label: "Yahoo", href: "https://yahoo.com/mail" }
                ].map((provider, i) => (
                  <a
                    key={provider.label}
                    href={provider.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="secondary-button px-3 py-2 text-xs font-medium animate-fade-in-up hover:-translate-y-1"
                    style={{ animationDelay: `${800 + i * 100}ms` }}
                  >
                    {provider.label}
                  </a>
                ))}
              </div>
            </div>
          </div>

          <p className="mt-6 text-xs text-slate-500 animate-fade-in" style={{ animationDelay: "1100ms" }}>
            Didn&apos;t receive the email? Check your spam folder or try logging in again.
          </p>
        </section>
      </div>
    </main>
  );
}
