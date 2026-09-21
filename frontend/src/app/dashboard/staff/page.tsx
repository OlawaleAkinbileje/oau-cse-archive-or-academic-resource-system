"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { useAuth } from "@/components/AuthProvider";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { getDashboardStats, getMyStaffDocuments, uploadDocument, updateStaffDocument, deleteStaffDocument } from "@/lib/api";
import type { StaffDocument } from "@/types";
import {
  Shield,
  LayoutDashboard,
  UploadCloud,
  FolderKanban,
  Database,
  Search,
  Users,
  BarChart3,
  Activity,
  Settings,
  Bell,
  FileText,
  Presentation,
  Pencil,
  Trash2,
  X,
} from "lucide-react";

interface DashboardRecentActivity {
  title: string;
  created_at: string;
}

interface DashboardStats {
  total_documents: number;
  total_comments: number;
  staff_documents: number;
  staff_code_documents: number;
  staff_video_documents: number;
  total_code_documents: number;
  total_video_documents: number;
  new_views: number;
  new_downloads: number;
  recent_activity: DashboardRecentActivity[];
  pending_approvals: unknown[];
}

function SparklineChart({ data, color }: { data: number[]; color: string }) {
  const width = 120;
  const height = 40;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  const points = data
    .map((val, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((val - min) / range) * height;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
}

function DonutChart({
  indexed,
  processing,
  pending,
  failed,
}: {
  indexed: number;
  processing: number;
  pending: number;
  failed: number;
}) {
  const total = indexed + processing + pending + failed;
  const size = 200;
  const strokeWidth = 28;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const indexedPct = (indexed / total) * circumference;
  const processingPct = (processing / total) * circumference;
  const pendingPct = (pending / total) * circumference;

  const percentIndexed = ((indexed / total) * 100).toFixed(1);

  return (
    <div className="flex flex-col items-center">
      <div className="donut-chart" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#f1f5f9"
            strokeWidth={strokeWidth}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#10b981"
            strokeWidth={strokeWidth}
            strokeDasharray={`${indexedPct} ${circumference}`}
            strokeDashoffset={0}
            strokeLinecap="butt"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#f59e0b"
            strokeWidth={strokeWidth}
            strokeDasharray={`${processingPct} ${circumference}`}
            strokeDashoffset={-indexedPct}
            strokeLinecap="butt"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#3b82f6"
            strokeWidth={strokeWidth}
            strokeDasharray={`${pendingPct} ${circumference}`}
            strokeDashoffset={-(indexedPct + processingPct)}
            strokeLinecap="butt"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-slate-900">{percentIndexed}%</span>
          <span className="text-sm text-slate-500">Indexed</span>
        </div>
      </div>
      <div className="mt-6 grid grid-cols-2 gap-x-8 gap-y-3 w-full">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-green-500" />
          <span className="text-sm text-slate-600">Indexed: {indexed.toLocaleString()}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-orange-500" />
          <span className="text-sm text-slate-600">Processing: {processing.toLocaleString()}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-blue-500" />
          <span className="text-sm text-slate-600">Pending: {pending.toLocaleString()}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-red-500" />
          <span className="text-sm text-slate-600">Failed: {failed}</span>
        </div>
      </div>
    </div>
  );
}

export default function StaffDashboardPage() {
  const { session, isHydrated } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [myDocs, setMyDocs] = useState<StaffDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadForm, setUploadForm] = useState<{file: File | null; courseCode: string; level: string; title: string}>({file: null, courseCode: "", level: "200", title: ""});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{title: string; courseCode: string; level: string}>({title: "", courseCode: "", level: ""});
  const [editing, setEditing] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!isHydrated) return;
    if (session.userRole !== "staff") return;

    let cancelled = false;
    async function loadData() {
      try {
        setLoading(true);
        setError(null);
        const [statsData, docsData] = await Promise.all([
          getDashboardStats(),
          getMyStaffDocuments().catch(() => [] as StaffDocument[]),
        ]);
        if (cancelled) return;
        setStats(statsData);
        setMyDocs(docsData);
      } catch (err) {
        if (cancelled) return;
        console.error("Dashboard load error:", err);
        setError(err instanceof Error ? err.message : "Failed to load dashboard data");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadData();
    return () => {
      cancelled = true;
    };
  }, [isHydrated, session.userRole, session.accessToken]);

  const isStaff = session.userRole === "staff";
  const userName = session.userProfile?.fullName ?? "Staff User";

  const totalResources = stats?.total_documents ?? 0;
  const indexedDocs = Math.max(0, Math.round(totalResources * 0.958));
  const processingDocs = Math.max(0, totalResources - indexedDocs);
  const totalUsers = 2158;
  const storagePercent = 61;

  const searchesData = [320, 410, 380, 520, 490, 620, 780];
  const downloadsData = [80, 110, 95, 130, 140, 125, 160];
  const uploadsData = [12, 18, 15, 22, 20, 24, 32];
  const activeUsersData = [80, 95, 100, 115, 120, 130, 145];

  const navItems = [
    { label: "Dashboard", icon: LayoutDashboard, active: true, href: "/dashboard/staff" },
    { label: "Upload Resources", icon: UploadCloud, href: "/upload" },
    { label: "Manage Resources", icon: FolderKanban, href: "/upload" },
    { label: "Metadata Management", icon: Database, href: "#" },
    { label: "Indexing & Search", icon: Search, href: "/results?q=" },
    { label: "Users & Permissions", icon: Users, href: "#" },
    { label: "Analytics & Reports", icon: BarChart3, href: "#" },
    { label: "Activity Logs", icon: Activity, href: "#" },
    { label: "Settings", icon: Settings, href: "#" },
  ];

  const recentUploads =
    myDocs.length > 0
      ? myDocs
      : stats?.recent_activity?.slice(0, 3) ?? [];

  function formatDate(dateStr: string | null | undefined): string {
    if (!dateStr) return "";
    try {
      return new Date(dateStr).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateStr;
    }
  }

  function getBadgeForTitle(title: string | null): { label: string; className: string; iconClass: string } {
    const t = (title ?? "").toLowerCase();
    if (t.endsWith(".pdf")) return { label: "PDF", className: "badge-pdf", iconClass: "resource-icon-pdf" };
    if (t.endsWith(".ppt") || t.endsWith(".pptx")) return { label: "PPTX", className: "badge-ppt", iconClass: "resource-icon-ppt" };
    if (t.endsWith(".doc") || t.endsWith(".docx")) return { label: "DOC", className: "badge-type", iconClass: "resource-icon-doc" };
    if (/\.(py|js|ts|java|c|cpp|h|cs|php|rb|go|rs|kt|swift|html|css|sql)$/.test(t)) {
      return { label: "CODE", className: "badge-py", iconClass: "resource-icon-code" };
    }
    return { label: "FILE", className: "badge-default", iconClass: "resource-icon-doc" };
  }

  async function handleUploadSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!uploadForm.file || !uploadForm.courseCode) return;
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("file", uploadForm.file);
      formData.append("course_code", uploadForm.courseCode);
      formData.append("level", uploadForm.level);
      if (uploadForm.title) formData.append("title", uploadForm.title);
      await uploadDocument(formData);
      setShowUploadModal(false);
      setUploadForm({file: null, courseCode: "", level: "200", title: ""});
      alert("Upload successful!");
      const freshDocs = await getMyStaffDocuments().catch(() => [] as StaffDocument[]);
      setMyDocs(freshDocs);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function handleEditSave(id: string) {
    try {
      setEditing(true);
      await updateStaffDocument(id, {
        title: editForm.title || undefined,
        course_code: editForm.courseCode || undefined,
        level: editForm.level ? (editForm.level as any) : undefined,
      });
      setEditingId(null);
      alert("Updated");
      const freshDocs = await getMyStaffDocuments().catch(() => [] as StaffDocument[]);
      setMyDocs(freshDocs);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Update failed");
    } finally {
      setEditing(false);
    }
  }

  async function handleDeleteConfirm(id: string) {
    try {
      await deleteStaffDocument(id);
      setDeletingId(null);
      const freshDocs = await getMyStaffDocuments().catch(() => [] as StaffDocument[]);
      setMyDocs(freshDocs);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Delete failed");
    }
  }

  if (!isHydrated || loading) {
    return (
      <main className="min-h-screen bg-slate-50">
        <LoadingSpinner />
      </main>
    );
  }

  if (!isStaff) {
    return (
      <main className="min-h-screen bg-slate-50">
        <div className="flex min-h-screen items-center justify-center px-4 py-10">
          <section className="card w-full max-w-3xl p-10 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-600">
              Restricted Workspace
            </p>
            <h1 className="mt-4 text-3xl font-semibold text-slate-900 md:text-4xl">
              Staff dashboard access required
            </h1>
            <p className="mt-4 text-base leading-8 text-slate-600">
              Only verified staff accounts can manage departmental resources, update metadata,
              and upload new archive items.
            </p>
            <Link
              href="/auth/login"
              className="btn-primary mt-8 inline-flex text-sm"
            >
              Login as Staff
            </Link>
          </section>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-slate-50">
        <div style={{ marginLeft: 280, padding: "2rem" }}>
          <div className="card p-6 max-w-2xl">
            <h2 className="text-lg font-bold text-red-600 mb-2">Could not load dashboard</h2>
            <p className="text-sm text-slate-600">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="btn-primary mt-4 text-sm"
            >
              Retry
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <aside
        className="dashboard-sidebar fixed top-0 left-0 h-screen flex flex-col"
        style={{ width: 280, padding: "1.5rem" }}
      >
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-1">
            <div
              className="shield-logo w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            >
              <Shield className="w-6 h-6 text-white" strokeWidth={2.5} />
            </div>
            <div className="flex flex-col">
              <span className="text-white font-bold text-lg leading-tight">OAU CSE</span>
              <span className="text-slate-400 text-xs mt-0.5">Academic Search Engine</span>
            </div>
          </div>
        </div>

        <nav className="space-y-1 flex-1">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={`dashboard-nav-item ${item.active ? "active" : ""}`}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" strokeWidth={2} />
              <span className="text-sm">{item.label}</span>
            </Link>
          ))}
        </nav>
      </aside>

      <div style={{ marginLeft: 280, padding: "2rem" }}>
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
            <p className="text-slate-500 mt-1">Welcome back, {userName}</p>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/results?q="
              className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <Search className="w-5 h-5" strokeWidth={2} />
            </Link>
            <button
              onClick={() => setShowUploadModal(true)}
              className="md:hidden w-10 h-10 rounded-full bg-amber-500 text-white flex items-center justify-center hover:bg-amber-600 transition-colors"
            >
              <UploadCloud className="w-5 h-5" strokeWidth={2} />
            </button>
            <button
              onClick={() => setShowUploadModal(true)}
              className="hidden md:inline-flex btn-primary text-sm rounded-full px-5 py-2.5 items-center gap-2"
            >
              <UploadCloud className="w-4 h-4" /> Upload Resource
            </button>
            <button className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-colors relative">
              <Bell className="w-5 h-5" strokeWidth={2} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-amber-500 rounded-full" />
            </button>
            <div className="flex items-center gap-3 pl-2">
              <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-amber-400">
                <img
                  src="https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=professional%20african%20american%20male%20professor%20portrait%20headshot%20friendly%20smile%20in%20suit&image_size=square"
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </header>

        <section className="grid grid-cols-4 gap-6 mb-8">
          <div className="stat-card">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm text-slate-500 font-medium">Total Resources</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">
                  {totalResources.toLocaleString()}
                </p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                <Database className="w-5 h-5" strokeWidth={2} />
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-semibold text-green-600">
                {stats?.staff_documents ? `${stats.staff_documents} by you` : "—"}
              </span>
            </div>
          </div>

          <div className="stat-card">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm text-slate-500 font-medium">Indexed Documents</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">
                  {indexedDocs.toLocaleString()}
                </p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-green-50 flex items-center justify-center text-green-600">
                <Search className="w-5 h-5" strokeWidth={2} />
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-semibold text-green-600">
                {totalResources > 0 ? `${((indexedDocs / totalResources) * 100).toFixed(1)}%` : "0%"}
              </span>
              <span className="text-sm text-slate-500">indexed</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm text-slate-500 font-medium">Total Comments</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">
                  {(stats?.total_comments ?? 0).toLocaleString()}
                </p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
                <Users className="w-5 h-5" strokeWidth={2} />
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-semibold text-green-600">
                {totalUsers.toLocaleString()}
              </span>
              <span className="text-sm text-slate-500">total users</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm text-slate-500 font-medium">Code Resources</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">
                  {(stats?.total_code_documents ?? 0).toLocaleString()}
                </p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
                <FolderKanban className="w-5 h-5" strokeWidth={2} />
              </div>
            </div>
            <div className="space-y-2">
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-600"
                  style={{ width: `${storagePercent}%` }}
                />
              </div>
              <p className="text-xs text-slate-500">{stats?.total_video_documents ? `${stats.total_video_documents} videos` : `${storagePercent}% storage used`}</p>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-2 gap-6 mb-8">
          <div className="card p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-slate-900">Recent Uploads</h2>
              <Link
                href="/upload"
                className="text-sm text-blue-600 font-medium hover:text-blue-700"
              >
                View all
              </Link>
            </div>
            <div className="space-y-4">
              {recentUploads.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-slate-500">No uploads yet.</p>
                  <Link
                    href="/upload"
                    className="btn-outline mt-4 inline-flex text-xs"
                  >
                    Upload your first resource
                  </Link>
                </div>
              ) : (
                recentUploads.map((item, i) => {
                  const doc = item as StaffDocument;
                  const isStaffDoc = typeof doc.id === "string";
                  const title = doc.title ?? (item as DashboardRecentActivity).title;
                  const dateStr = doc.created_at ?? (item as DashboardRecentActivity).created_at;
                  const badge = getBadgeForTitle(title);
                  const IconComponent = badge.label === "PPTX" ? Presentation : FileText;
                  const docId = doc.id;

                  if (isStaffDoc && editingId === docId) {
                    return (
                      <div
                        key={i}
                        className="flex items-center gap-3 p-3 rounded-xl bg-amber-50/60 border border-amber-200"
                      >
                        <div className={`resource-icon ${badge.iconClass} flex-shrink-0`}>
                          <IconComponent className="w-5 h-5" strokeWidth={2} />
                        </div>
                        <div className="flex-1 min-w-0 space-y-2">
                          <input
                            type="text"
                            value={editForm.title}
                            onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                            placeholder="Title"
                            className="w-full text-sm px-2 py-1.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-400"
                          />
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={editForm.courseCode}
                              onChange={(e) => setEditForm({...editForm, courseCode: e.target.value})}
                              placeholder="Course code"
                              className="flex-1 text-xs px-2 py-1 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-400"
                            />
                            <select
                              value={editForm.level}
                              onChange={(e) => setEditForm({...editForm, level: e.target.value})}
                              className="text-xs px-2 py-1 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-400"
                            >
                              <option value="100">100</option>
                              <option value="200">200</option>
                              <option value="300">300</option>
                              <option value="400">400</option>
                              <option value="500">500</option>
                            </select>
                          </div>
                        </div>
                        <div className="flex flex-col gap-1.5 flex-shrink-0">
                          <button
                            onClick={() => handleEditSave(docId)}
                            disabled={editing}
                            className="btn-outline text-xs px-3 py-1 rounded-lg"
                          >
                            {editing ? "Saving..." : "Save"}
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            disabled={editing}
                            className="btn-outline text-xs px-3 py-1 rounded-lg text-slate-500"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    );
                  }

                  if (isStaffDoc && deletingId === docId) {
                    return (
                      <div
                        key={i}
                        className="flex items-center gap-3 p-3 rounded-xl bg-red-50/60 border border-red-200"
                      >
                        <div className={`resource-icon ${badge.iconClass} flex-shrink-0`}>
                          <IconComponent className="w-5 h-5" strokeWidth={2} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-900 truncate">
                            {title ?? "Untitled document"}
                          </p>
                          <p className="text-xs font-semibold text-red-600 mt-0.5">
                            Are you sure?
                          </p>
                        </div>
                        <div className="flex flex-col gap-1.5 flex-shrink-0">
                          <button
                            onClick={() => handleDeleteConfirm(docId)}
                            className="text-xs px-3 py-1 rounded-lg bg-red-600 text-white hover:bg-red-700 font-medium"
                          >
                            Delete
                          </button>
                          <button
                            onClick={() => setDeletingId(null)}
                            className="btn-outline text-xs px-3 py-1 rounded-lg text-slate-500"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={i}
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors"
                    >
                      <div className={`resource-icon ${badge.iconClass} flex-shrink-0`}>
                        <IconComponent className="w-5 h-5" strokeWidth={2} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate">
                          {title ?? "Untitled document"}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {formatDate(dateStr)}
                          {isStaffDoc && (doc.course_code || doc.level) && (
                            <span className="ml-2">
                              {doc.course_code && <span className="text-blue-600">{doc.course_code}</span>}
                              {doc.course_code && doc.level && <span className="mx-1">·</span>}
                              {doc.level && <span className="text-emerald-600">{doc.level}L</span>}
                            </span>
                          )}
                        </p>
                      </div>
                      <span className={`badge ${badge.className} flex-shrink-0`}>
                        {badge.label}
                      </span>
                      {isStaffDoc && (
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            onClick={() => {
                              setEditingId(docId);
                              setEditForm({
                                title: doc.title || "",
                                courseCode: doc.course_code || "",
                                level: (doc.level as any)?.toString() || "",
                              });
                            }}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            title="Edit"
                          >
                            <Pencil className="w-4 h-4" strokeWidth={2} />
                          </button>
                          <button
                            onClick={() => setDeletingId(docId)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" strokeWidth={2} />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-slate-900">Indexing Status</h2>
              <span className="badge badge-default">Live</span>
            </div>
            <DonutChart
              indexed={indexedDocs}
              processing={processingDocs}
              pending={Math.ceil(totalResources * 0.02)}
              failed={0}
            />
          </div>
        </section>

        <section className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900">System Activity (Last 7 days)</h2>
              <p className="text-sm text-slate-500 mt-1">
                Daily metrics across search, downloads, uploads and active users
              </p>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-6">
            <div className="p-5 rounded-xl bg-slate-50/70">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Searches
                </span>
                <span className="text-xs font-semibold text-green-600">+12.5%</span>
              </div>
              <p className="text-2xl font-bold text-slate-900 mb-3">
                {searchesData.reduce((a, b) => a + b, 0).toLocaleString()}
              </p>
              <SparklineChart data={searchesData} color="#3b82f6" />
            </div>

            <div className="p-5 rounded-xl bg-slate-50/70">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Downloads
                </span>
                <span className="text-xs font-semibold text-green-600">+8.3%</span>
              </div>
              <p className="text-2xl font-bold text-slate-900 mb-3">
                {(stats?.new_downloads ?? downloadsData.reduce((a, b) => a + b, 0)).toLocaleString()}
              </p>
              <SparklineChart data={downloadsData} color="#10b981" />
            </div>

            <div className="p-5 rounded-xl bg-slate-50/70">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Uploads
                </span>
                <span className="text-xs font-semibold text-green-600">+15.7%</span>
              </div>
              <p className="text-2xl font-bold text-slate-900 mb-3">
                {(stats?.staff_documents ?? uploadsData.reduce((a, b) => a + b, 0)).toLocaleString()}
              </p>
              <SparklineChart data={uploadsData} color="#f59e0b" />
            </div>

            <div className="p-5 rounded-xl bg-slate-50/70">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Active Users
                </span>
                <span className="text-xs font-semibold text-green-600">+10.2%</span>
              </div>
              <p className="text-2xl font-bold text-slate-900 mb-3">
                {activeUsersData[activeUsersData.length - 1].toLocaleString()}
              </p>
              <SparklineChart data={activeUsersData} color="#8b5cf6" />
            </div>
          </div>
        </section>
      </div>

      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowUploadModal(false)}
          />
          <div className="relative card w-full max-w-lg p-8 z-10 shadow-2xl">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Upload New Resource</h2>
                <p className="text-sm text-slate-500 mt-1">
                  Share a document, code file, or presentation with the archive.
                </p>
              </div>
              <button
                onClick={() => setShowUploadModal(false)}
                disabled={uploading}
                className="w-9 h-9 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors flex-shrink-0"
              >
                <X className="w-5 h-5" strokeWidth={2} />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Title <span className="text-slate-400 font-normal">(optional — uses filename if empty)</span>
                </label>
                <input
                  type="text"
                  value={uploadForm.title}
                  onChange={(e) => setUploadForm({...uploadForm, title: e.target.value})}
                  placeholder="e.g. Introduction to Data Structures Lecture Notes"
                  disabled={uploading}
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent disabled:opacity-60"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  File <span className="text-red-500">*</span>
                </label>
                <label className="block">
                  <input
                    type="file"
                    accept=".pdf,.txt,.py,.js,.ts,.c,.cpp,.h,.java,.ppt,.pptx,.doc,.docx"
                    disabled={uploading}
                    onChange={(e) => {
                      const file = e.target.files?.[0] ?? null;
                      setUploadForm({...uploadForm, file});
                      if (file && !uploadForm.title) {
                        setUploadForm((prev) => ({...prev, title: file.name.replace(/\.[^.]+$/, "")}));
                      }
                    }}
                    className="block w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-5 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100 file:cursor-pointer cursor-pointer border border-slate-200 rounded-xl p-1.5 disabled:opacity-60"
                  />
                </label>
                {uploadForm.file && (
                  <p className="text-xs text-emerald-600 mt-2 font-medium">
                    ✓ Selected: {uploadForm.file.name} ({(uploadForm.file.size / 1024).toFixed(1)} KB)
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Course Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={uploadForm.courseCode}
                    onChange={(e) => setUploadForm({...uploadForm, courseCode: e.target.value})}
                    placeholder="e.g. CSC 201"
                    disabled={uploading}
                    className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent disabled:opacity-60"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Level
                  </label>
                  <select
                    value={uploadForm.level}
                    onChange={(e) => setUploadForm({...uploadForm, level: e.target.value})}
                    disabled={uploading}
                    className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent disabled:opacity-60 bg-white"
                  >
                    <option value="100">100 Level</option>
                    <option value="200">200 Level</option>
                    <option value="300">300 Level</option>
                    <option value="400">400 Level</option>
                    <option value="500">500 Level</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  disabled={uploading}
                  className="btn-outline text-sm rounded-full px-5 py-2.5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading || !uploadForm.file || !uploadForm.courseCode}
                  className="btn-primary text-sm rounded-full px-6 py-2.5 inline-flex items-center gap-2 disabled:opacity-60"
                >
                  {uploading ? (
                    <>
                      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                        <path fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" className="opacity-75" />
                      </svg>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <UploadCloud className="w-4 h-4" />
                      Upload
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
