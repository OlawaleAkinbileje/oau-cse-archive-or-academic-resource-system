import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AppNavbar } from "@/components/AppNavbar";
import { AuthProvider } from "@/components/AuthProvider";
import { UploadModalProvider } from "@/components/UploadModalProvider";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "OAU CSE Search",
  description: "Academic search engine for OAU Computer Science materials",
  manifest: "/manifest.json",
  themeColor: "#3b82f6",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[var(--background)] text-[var(--foreground)]">
        <AuthProvider>
          <UploadModalProvider>
            <AppNavbar />
            {children}
          </UploadModalProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
