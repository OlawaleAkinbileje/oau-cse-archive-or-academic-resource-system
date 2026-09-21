"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { useAuth } from "@/components/AuthProvider";
import { useNavbar } from "@/components/NavbarProvider";
import { supabase } from "@/lib/supabase-browser";

export function AppNavbar() {
  const { session, clearSession, isHydrated } = useAuth();
  const navbar = useNavbar();
  const pathname = usePathname();
  const router = useRouter();

  const isStaffDashboard = pathname === "/dashboard/staff";
  const isCodePreview = pathname.startsWith("/code-preview");
  const hideSharedNavbar = isStaffDashboard || isCodePreview;

  const roleLabel =
    session?.userRole === "staff"
      ? "Staff"
      : session?.userRole === "pending"
        ? "Pending"
        : "Student";

  const profileName = session?.userProfile?.fullName;
  const profileInitials = profileName
    ? profileName
        .split(/\s+/)
        .map((w: string) => w[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : roleLabel.charAt(0).toUpperCase();

  if (!isHydrated) {
    return (
      <header
        className="sticky top-0 z-50 h-16 bg-white/80 border-b border-slate-200 backdrop-blur-md"
        aria-hidden="true"
      />
    );
  }

  if (hideSharedNavbar) {
    return null;
  }

  const handleRefresh = () => {
    router.refresh();
  };

  const navLinks = [
    { href: "/", label: "Home", match: (p: string) => p === "/" },
    {
      href: "/results?q=",
      label: "Resources",
      match: (p: string) => p.startsWith("/results") || p.startsWith("/documents/"),
    },
    ...(session?.userRole === "staff"
      ? [
          {
            href: "/dashboard/staff",
            label: "Dashboard",
            match: (p: string) => p.startsWith("/dashboard/"),
          },
        ]
      : []),
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/80 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <div className="app-shell px-4 py-3 md:px-8">
        <nav className="flex items-center justify-between gap-3 lg:gap-6 h-12">
          {navbar.showBrand ? (
            <Link
              href="/"
              className="flex items-center gap-3 flex-shrink-0 group min-w-0"
              aria-label="OAU CSE Academic Search Engine - Home"
            >
              <span className="shield-logo flex h-10 w-10 items-center justify-center rounded-xl shadow-[0_4px_18px_rgba(212,160,23,0.28)] group-hover:shadow-[0_6px_22px_rgba(212,160,23,0.36)] transition-shadow">
                <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-white">
                  <path d="M12 2 4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3Zm0 9.99h6c-.53 4.12-3.28 7.79-6 8.94V12H6V6.3l6-2.26v7.95Z" />
                </svg>
              </span>
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#d4a017] leading-none">
                  OAU CSE
                </p>
                <p className="text-sm font-semibold text-slate-900 mt-1 truncate">
                  Academic Search Engine
                </p>
              </div>
            </Link>
          ) : (
            <span className="w-0 md:w-4 flex-shrink-0" />
          )}

          {navbar.showPrimaryNav && (
            <div className="hidden lg:flex items-center gap-8 flex-shrink-0">
              {navLinks.map((link) => {
                const active = link.match(pathname);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`relative text-sm font-medium transition-colors py-1 ${
                      active
                        ? "text-slate-900"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    {link.label}
                    <span
                      className={`pointer-events-none absolute -bottom-0.5 left-0 h-0.5 rounded-full transition-all ${
                        active
                          ? "w-full bg-[#d4a017] shadow-[0_0_10px_rgba(212,160,23,0.5)]"
                          : "w-0 bg-[#d4a017] group-hover:w-full"
                      }`}
                    />
                  </Link>
                );
              })}
            </div>
          )}

          {navbar.centerSlot ? (
            <div className="flex-1 flex items-center justify-center min-w-0">
              {navbar.centerSlot}
            </div>
          ) : navbar.showPrimaryNav ? (
            <span className="flex-1" aria-hidden="true" />
          ) : (
            <span className="flex-1" aria-hidden="true" />
          )}

          <div className="flex items-center gap-1.5 md:gap-2 flex-shrink-0">
            {navbar.rightSlot}

            {navbar.showAuthActions && !navbar.rightSlot && (
              <>
                <button
                  type="button"
                  onClick={handleRefresh}
                  className="hidden sm:flex h-10 w-10 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                  aria-label="Refresh"
                  title="Refresh"
                >
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    className="h-5 w-5 fill-none stroke-current"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 0 0 4.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 0 1-15.357-2m15.357 2H15"
                    />
                  </svg>
                </button>

                {session?.accessToken ? (
                  <>
                    <div className="hidden sm:flex items-center gap-2 px-2 py-1 rounded-full hover:bg-slate-50 transition-colors">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full shield-logo text-sm font-semibold text-white shadow-md">
                        {profileInitials}
                      </span>
                      <div className="flex flex-col leading-tight pr-1">
                        {profileName ? (
                          <span className="text-sm font-semibold text-slate-900 truncate max-w-[120px]">
                            {profileName}
                          </span>
                        ) : null}
                        <span
                          className={`text-[11px] font-medium ${
                            session.userRole === "staff"
                              ? "text-emerald-600"
                              : session.userRole === "pending"
                                ? "text-amber-600"
                                : "text-slate-500"
                          }`}
                        >
                          {roleLabel}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await supabase.auth.signOut();
                        } catch {
                          /* ignore */
                        }
                        clearSession();
                      }}
                      className="btn-outline text-sm font-semibold"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/auth/login"
                      className="btn-outline text-sm font-medium rounded-full px-4 md:px-5 py-2"
                    >
                      Login
                    </Link>
                    <Link
                      href="/auth/login?staff=true"
                      className="btn-primary text-sm rounded-full px-4 md:px-5 py-2"
                    >
                      Staff
                    </Link>
                  </>
                )}

                {session?.accessToken && pathname === "/" && (
                  <Link
                    href={
                      session?.userRole === "staff" ? "/dashboard/staff" : "/results?q="
                    }
                    className="hidden xl:inline-flex btn-outline text-sm font-medium rounded-full px-5 py-2"
                  >
                    Open Workspace
                  </Link>
                )}
              </>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
