"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { useAuth } from "@/components/AuthProvider";
import { SearchBar } from "@/components/SearchBar";

const featuredCollections = [
  {
    title: "Introduction to Algorithms",
    subtitle: "Core foundations and worked examples",
    tag: "Algorithms",
    query: "introduction to algorithms",
    icon: "📚",
  },
  {
    title: "Python for Beginners",
    subtitle: "Lecture notes and starter code",
    tag: "Python",
    query: "python beginner",
    icon: "🐍",
  },
  {
    title: "Data Structures",
    subtitle: "Trees, graphs, heaps, and walkthroughs",
    tag: "Data Structures",
    query: "data structures",
    icon: "🌳",
  },
  {
    title: "Web Development",
    subtitle: "Frontend and backend class resources",
    tag: "Web",
    query: "web development",
    icon: "🌐",
  },
];

const quickTopics = ["Algorithms", "Web Development", "Data Structures", "Databases", "Python", "Machine Learning"];

export default function Home() {
  const router = useRouter();
  const { session } = useAuth();
  const workspaceHref = session.accessToken ? (session.userRole === "staff" ? "/dashboard/staff" : "/results?q=") : "/auth/login";

  return (
    <main className="min-h-screen pb-12 pt-8 md:pb-16 md:pt-10">
      <div className="app-shell space-y-8">
        {/* Hero Section */}
        <section className="glass-panel overflow-hidden px-5 py-10 md:px-10 md:py-12 relative">
          <div className="absolute inset-0 opacity-30 bg-gradient-to-tr from-blue-500/10 to-indigo-500/10" />
          <div className="grid gap-8 lg:grid-cols-[1.4fr_0.6fr] lg:items-center relative z-10">
            <div className="animate-fade-in-up">
              <p className="section-label">Welcome to the Department Archive</p>
              <h1 className="mt-5 max-w-3xl text-4xl font-semibold leading-tight text-slate-900 md:text-6xl">
                Your Unified Hub for Departmental Resources.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-8 text-slate-600 md:text-lg">
                Access lecture videos, documents, code files, projects, and more with ease.
              </p>
              <div className="mt-8 max-w-4xl">
                <SearchBar
                  onSearch={(query) => {
                    if (!query) return;
                    router.push(`/results?q=${encodeURIComponent(query)}`);
                  }}
                />
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                {quickTopics.map((topic, i) => (
                  <button
                    key={topic}
                    type="button"
                    onClick={() => router.push(`/results?q=${encodeURIComponent(topic)}`)}
                    className="status-pill transition-all hover:-translate-y-0.5 hover:shadow-[0_0_15px_rgba(59,130,246,0.2)] animate-fade-in"
                    style={{ animationDelay: `${i * 50}ms` }}
                  >
                    {topic}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4 animate-fade-in-up" style={{ animationDelay: "200ms" }}>
              <div className="glass-card neon-outline p-6 bg-gradient-to-br from-blue-50 to-indigo-50">
                <p className="text-sm font-semibold uppercase tracking-[0.28em] text-blue-700">Get Started</p>
                <h2 className="mt-3 text-2xl font-semibold text-slate-900">Find resources instantly.</h2>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  Our powerful search engine helps you locate exactly what you&apos;re looking for in seconds.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link href="/results?q=" className="primary-button text-sm">
                    Explore Now
                  </Link>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="glass-card-soft p-5 bg-gradient-to-br from-slate-50 to-white animate-float">
                  <p className="text-3xl font-semibold text-slate-900">100+</p>
                  <p className="mt-2 text-sm text-muted">Resources available</p>
                </div>
                <div className="glass-card-soft p-5 bg-gradient-to-br from-slate-50 to-white animate-float" style={{ animationDelay: "300ms" }}>
                  <p className="text-3xl font-semibold text-slate-900">5</p>
                  <p className="mt-2 text-sm text-muted">File types supported</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="grid gap-8 lg:grid-cols-3">
          {[
            { icon: "🔍", title: "Smart Search", desc: "Find resources quickly", content: "Search by keyword, course code, or file type to locate exactly what you need." },
            { icon: "📄", title: "In-App Viewing", desc: "View files without leaving", content: "View PDFs, videos, images, and Office documents directly in your browser." },
            { icon: "💬", title: "Collaborate", desc: "Share and discuss resources", content: "Leave comments and annotations on resources to help other students." },
          ].map((feature, i) => (
            <div
              key={i}
              className="glass-card p-6 bg-gradient-to-br from-blue-50 to-indigo-50 animate-fade-in-up"
              style={{ animationDelay: `${i * 100 + 200}ms` }}
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500 text-2xl shadow-md">
                  {feature.icon}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">{feature.title}</h3>
                  <p className="text-sm text-slate-500">{feature.desc}</p>
                </div>
              </div>
              <p className="mt-4 text-sm leading-7 text-slate-600">{feature.content}</p>
            </div>
          ))}
        </section>

        {/* Featured Collections */}
        <section className="glass-panel p-6 md:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="animate-fade-in">
              <p className="section-label">Featured Collections</p>
              <h2 className="mt-3 text-3xl font-semibold text-slate-900">Curated learning resources</h2>
            </div>
            <Link href="/results?q=" className="secondary-button text-sm font-semibold animate-fade-in" style={{ animationDelay: "100ms" }}>
              Browse All
            </Link>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {featuredCollections.map((collection, index) => (
              <Link
                key={collection.title}
                href={`/results?q=${encodeURIComponent(collection.query)}`}
                className="glass-card group p-6 transition-all hover:-translate-y-1 hover:shadow-[0_0_25px_rgba(59,130,246,0.15)] animate-fade-in-up"
                style={{ animationDelay: `${index * 100 + 300}ms` }}
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 text-3xl text-white shadow-md">
                  {collection.icon}
                </div>
                <p className="mt-5 text-xl font-semibold text-slate-900">{collection.title}</p>
                <p className="mt-2 text-sm text-muted">{collection.subtitle}</p>
                <div className="mt-5 flex items-center justify-between">
                  <span className="status-pill">{collection.tag}</span>
                  <span className="text-sm font-semibold text-blue-700 group-hover:translate-x-1 transition-transform">
                    Explore →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
