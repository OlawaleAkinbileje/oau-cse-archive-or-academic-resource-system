"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { useAuth } from "@/components/AuthProvider";

interface RailItem {
  href: string;
  label: string;
  match: (pathname: string) => boolean;
  icon: ReactNode;
}

export function WorkspaceRail() {
  const pathname = usePathname();
  const { session } = useAuth();
  const userName = session.userProfile?.fullName ?? (session.userRole 
    ? session.userRole.charAt(0).toUpperCase() + session.userRole.slice(1) 
    : "User");
  const userInitial = userName.charAt(0).toUpperCase();

  const items: RailItem[] = [
    {
      href: "/",
      label: "Home",
      match: (value) => value === "/",
      icon: (
        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      href: "/results?q=",
      label: "My Resources",
      match: (value) => value.startsWith("/results") || value.startsWith("/documents/"),
      icon: (
        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
        </svg>
      ),
    },
  ];

  if (session.userRole === "staff") {
    items.push({
      href: "/dashboard/staff",
      label: "Archive",
      match: (value) => value.startsWith("/dashboard/staff"),
      icon: (
        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
    });
  }

  return (
    <aside className="w-64 flex-shrink-0 sticky top-8">
      <div className="glass-panel p-6">
        <div className="flex items-center gap-3 mb-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-white font-semibold shadow-md">
            {userInitial}
          </div>
          <div>
            <p className="font-semibold text-slate-900">{userName}</p>
            <p className="text-xs text-slate-500">Signed in {session.userRole}</p>
          </div>
        </div>

        <nav className="space-y-2">
          {items.map((item) => {
            const active = item.match(pathname);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`sidebar-link ${active ? "active" : ""}`}
              >
                <div className="flex items-center gap-3">
                  {item.icon}
                  {item.label}
                </div>
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
