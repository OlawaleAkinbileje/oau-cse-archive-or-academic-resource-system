"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { useAuth } from "@/components/AuthProvider";
import { useUploadModal } from "@/components/UploadModalProvider";

export function AppNavbar() {
  const { session, clearSession, isHydrated } = useAuth();
  const { setShowUploadModal } = useUploadModal();
  const pathname = usePathname();
  const isLandingPage = pathname === "/";
  const isAuthPage = pathname.startsWith("/auth/");
  const isStaff = session.userRole === "staff";
  const isStaffDashboard = pathname === "/dashboard/staff";
  const roleLabel = session.userRole === "staff" ? "Staff" : session.userRole === "pending" ? "Pending" : "Student";

  if (!isHydrated) {
    return null;
  }

  if (isAuthPage || isStaffDashboard) {
    return null;
  }

  return (
    <header className="sticky top-0 z-40 px-4 pt-4 md:px-8 md:pt-6">
      <nav className="app-shell glass-panel flex items-center justify-between gap-4 px-4 py-4 md:px-6">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-[0_4px_20px_rgba(30,64,175,0.3)]">
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6 fill-current">
              <path d="M10.5 3.75c-1.67 0-3 1.33-3 3 0 .9.39 1.7 1.01 2.25-.84.49-1.41 1.4-1.41 2.44v1.31H5.75a2.75 2.75 0 1 0 0 5.5h2.5a2.75 2.75 0 0 0 2.75-2.75v-4c0-.69.56-1.25 1.25-1.25h.5a2.75 2.75 0 1 0 0-5.5h-2.25Z" />
            </svg>
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-blue-600">Department Archive</p>
            <p className="text-lg font-semibold text-slate-900">OAU CSE</p>
          </div>
        </Link>

        <div className="hidden md:flex items-center gap-6">
          <Link
            href="/"
            className={`text-sm font-medium transition-colors ${isLandingPage ? "text-blue-700 border-b-2 border-blue-600 pb-1" : "text-slate-600 hover:text-slate-900 pb-1"}`}
          >
            Home
          </Link>
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          {isStaffDashboard && session.accessToken && (
            <button type="button" onClick={() => setShowUploadModal(true)} className="primary-button text-sm">
              Upload
            </button>
          )}
          {session.accessToken ? (
            <>
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-sm font-semibold text-white shadow-md">
                {roleLabel.charAt(0)}
              </span>
              <button type="button" onClick={clearSession} className="secondary-button text-sm font-semibold">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/auth/login" className="ghost-button text-sm font-medium">
                Login
              </Link>
              <Link href="/auth/register" className="primary-button text-sm">
                Register
              </Link>
            </>
          )}
          {!session.accessToken && isLandingPage && (
            <Link href="/results?q=" className="secondary-button hidden text-sm font-medium lg:inline-flex">
              Explore
            </Link>
          )}
          {session.accessToken && isLandingPage && (
            <Link href={isStaff ? "/dashboard/staff" : "/results?q="} className="ghost-button hidden text-sm font-medium lg:inline-flex">
              Open Workspace
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
