"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

interface BackButtonProps {
  fallbackHref: string;
  label?: string;
  className?: string;
}

export function BackButton({
  fallbackHref,
  label = "Back",
  className = "",
}: BackButtonProps) {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => {
        if (typeof window !== "undefined" && window.history.length > 1) {
          router.back();
          return;
        }
        router.push(fallbackHref);
      }}
      className={`secondary-button text-sm font-semibold ${className}`.trim()}
    >
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="m15 18-6-6 6-6" />
      </svg>
      {label}
    </button>
  );
}
