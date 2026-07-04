"use client";

import { ChangeEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { BackButton } from "@/components/BackButton";
import { useAuth } from "@/components/AuthProvider";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { WorkspaceRail } from "@/components/WorkspaceRail";
import { useUploadModal } from "@/components/UploadModalProvider";
import { getMyStaffDocuments, updateStaffDocument, uploadDocument, getDashboardStats, deleteStaffDocument } from "@/lib/api";
import { StaffDocument } from "@/types";

interface DashboardStats {
  total_documents: number;
  total_comments: number;
  staff_documents: number;
  code_documents: number;
  video_documents: number;
  new_views: number;
  new_downloads: number;
  recent_activity: Array<{
    title: string;
    created_at: string;
  }>;
  pending_approvals: Array<{
    title?: string;
  } | string>;
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Recently added";
  }

  return new Intl.DateTimeFormat("en-NG", {
    hour: "numeric",
    minute: "2-digit",
    day: "numeric",
    month: "short",
  }).format(date);
}

export default function StaffDashboardPage() {
  const { session } = useAuth();
  const { showUploadModal, setShowUploadModal } = useUploadModal();
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState<StaffDocument[]>([]);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadCourseCode, setUploadCourseCode] = useState("");
  const [uploadLevel, setUploadLevel] = useState("");
  const [dashboardQuery, setDashboardQuery] = useState("");

  const userName = session.userProfile?.fullName || "Staff User";
  const userInitial = userName.charAt(0).toUpperCase();


  const [editingDoc, setEditingDoc] = useState<StaffDocument | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editCourseCode, setEditCourseCode] = useState("");
  const [editLevel, setEditLevel] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  const isStaff = session.userRole === "staff";

  const loadDocuments = async () => {
    setLoading(true);
    setError(null);
    try {
      const [docsData, statsData] = await Promise.all([
        getMyStaffDocuments(),
        getDashboardStats()
      ]);
      setDocuments(docsData);
      setDashboardStats(statsData);
    } catch (fetchError) {
      const message = fetchError instanceof Error ? fetchError.message : "Failed to load resources.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isStaff) {
      return;
    }
    const controller = new AbortController();

    const initLoad = async () => {
      await Promise.resolve();
      if (controller.signal.aborted) return;

      setError(null);
      try {
        const [docsData, statsData] = await Promise.all([
          getMyStaffDocuments(),
          getDashboardStats()
        ]);
        if (!controller.signal.aborted) {
          setDocuments(docsData);
          setDashboardStats(statsData);
        }
      } catch (fetchError) {
        if (!controller.signal.aborted) {
          const message = fetchError instanceof Error ? fetchError.message : "Failed to load resources.";
          setError(message);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    void initLoad();

    return () => {
      controller.abort();
    };
  }, [isStaff]);

  const filteredDocuments = useMemo(() => {
    const normalizedQuery = dashboardQuery.trim().toLowerCase();
    if (!normalizedQuery) {
      return documents;
    }

    return documents.filter((doc) =>
      [doc.title, doc.course_code, doc.programming_language]
        .filter(Boolean)
        .some((value) => value?.toLowerCase().includes(normalizedQuery)),
    );
  }, [dashboardQuery, documents]);

  const recentDocuments = useMemo(() => documents.slice(0, 5), [documents]);

  const stats = useMemo(() => {
    if (!dashboardStats) {
      return { total: 0, code: 0, video: 0 };
    }
    return {
      total: dashboardStats.staff_documents || 0,
      code: dashboardStats.code_documents || 0,
      video: dashboardStats.video_documents || 0,
    };
  }, [dashboardStats]);

  const onUploadSubmit = async (event: ChangeEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!uploadFile || !uploadCourseCode || !uploadLevel) {
      setError("File, course code, and level are required.");
      return;
    }
    const formData = new FormData();
    formData.append("file", uploadFile);
    formData.append("title", uploadTitle || uploadFile.name);
    formData.append("course_code", uploadCourseCode);
    formData.append("level", uploadLevel);

    setUploading(true);
    setError(null);
    try {
      await uploadDocument(formData);
      setShowUploadModal(false);
      setUploadFile(null);
      setUploadTitle("");
      setUploadCourseCode("");
      setUploadLevel("");
      await loadDocuments();
    } catch (uploadError) {
      const message = uploadError instanceof Error ? uploadError.message : "Upload failed.";
      setError(message);
    } finally {
      setUploading(false);
    }
  };

  const onSaveEdit = async () => {
    if (!editingDoc) return;
    setSavingEdit(true);
    setError(null);
    try {
      await updateStaffDocument(editingDoc.id, {
        title: editTitle || undefined,
        course_code: editCourseCode || undefined,
        level: editLevel ? Number(editLevel) : undefined,
      });
      setEditingDoc(null);
      await loadDocuments();
    } catch (updateError) {
      const message = updateError instanceof Error ? updateError.message : "Could not update metadata.";
      setError(message);
    } finally {
      setSavingEdit(false);
    }
  };


  const onDelete = async (documentId: string) => {
    if (!confirm("Delete this resource from database and storage?")) return;
    setError(null);
    try {
      await deleteStaffDocument(documentId);
      await loadDocuments();
    } catch (deleteError) {
      const message = deleteError instanceof Error ? deleteError.message : "Could not delete resource.";
      setError(message);
    }
  };

  if (!isStaff) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <img
            src="https://coresg-normal.trae.ai/api/v1/text-to-image?prompt=education%20illustration%20books%20and%20gears%20in%20blue%20and%20orange%20colors&image_size=square"
            alt=""
            className="absolute -right-10 top-10 w-96 opacity-40"
          />
          <img
            src="https://coresg-normal.trae.ai/api/v1/text-to-image?prompt=abstract%20educational%20shapes%20pencils%20books%20blue%20theme&image_size=square"
            alt=""
            className="absolute -left-20 bottom-20 w-72 opacity-30"
          />
        </div>
        <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-10">
          <section className="glass-panel w-full max-w-3xl p-10 text-center">
            <p className="section-label">Restricted Workspace</p>
            <h1 className="mt-4 text-3xl font-semibold text-slate-900 md:text-4xl">Staff dashboard access required</h1>
            <p className="mt-4 text-base leading-8 text-slate-600">
              Only verified staff accounts can manage departmental resources, update metadata, and upload new archive items.
            </p>
            <Link href="/auth/login" className="primary-button mt-8 inline-flex text-sm">
              Login as Staff
            </Link>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <img
          src="https://coresg-normal.trae.ai/api/v1/text-to-image?prompt=education%20illustration%20books%20and%20gears%20in%20blue%20and%20orange%20colors&image_size=square"
          alt=""
          className="absolute -right-10 top-10 w-96 opacity-40"
        />
        <img
          src="https://coresg-normal.trae.ai/api/v1/text-to-image?prompt=abstract%20educational%20shapes%20pencils%20books%20blue%20theme&image_size=square"
          alt=""
          className="absolute -left-20 bottom-20 w-72 opacity-30"
        />
      </div>

      <div className="relative z-10 min-h-screen">
        <nav className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-20">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-[0_4px_20px_rgba(30,64,175,0.3)]">
                  <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6 fill-current">
                    <path d="M10.5 3.75c-1.67 0-3 1.33-3 3 0 .9.39 1.7 1.01 2.25-.84.49-1.41 1.4-1.41 2.44v1.31H5.75a2.75 2.75 0 1 0 0 5.5h2.5a2.75 2.75 0 0 0 2.75-2.75v-4c0-.69.56-1.25 1.25-1.25h.5a2.75 2.75 0 1 0 0-5.5h-2.25Z" />
                  </svg>
                </span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-blue-600">Department Archive</p>
                  <p className="text-lg font-semibold text-slate-900">OAU CSE</p>
                </div>
              </div>
              <div className="hidden md:flex items-center gap-6">
                <Link href="/" className="text-sm font-medium text-slate-700 hover:text-blue-600">Home</Link>
              </div>
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(true)}
                  className="bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white font-bold py-2 px-6 rounded-lg shadow-md transition-all hover:-translate-y-0.5"
                >
                  UPLOAD RESOURCE
                </button>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-slate-700">{userName}</span>
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-white font-semibold shadow-md">
                    {userInitial}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </nav>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex gap-8">
            <aside className="w-64 flex-shrink-0">
              <div className="glass-panel p-6 sticky top-28">
                <div className="flex items-center gap-3 mb-8">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-white font-semibold shadow-md">
                    {userInitial}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{userName}</p>
                    <p className="text-xs text-slate-500">Signed in staff</p>
                  </div>
                </div>

                <nav className="space-y-2">
                  <Link href="/dashboard/staff" className="sidebar-link active">
                    <div className="flex items-center gap-3">
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                      </svg>
                      Dashboard
                    </div>
                    <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded-full font-medium">Active</span>
                  </Link>
                  <Link href="/results?q=" className="sidebar-link">
                    <div className="flex items-center gap-3">
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                      </svg>
                      My Resources
                    </div>
                  </Link>
                  <Link href="/results?q=CSC" className="sidebar-link">
                    <div className="flex items-center gap-3">
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                      Course Materials
                    </div>
                  </Link>
                  <Link href="/results?q=Project" className="sidebar-link">
                    <div className="flex items-center gap-3">
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Project Submissions
                    </div>
                  </Link>
                  <Link href="/results?q=Research" className="sidebar-link">
                    <div className="flex items-center gap-3">
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                      Research Papers
                    </div>
                  </Link>
                  <Link href="/" className="sidebar-link">
                    <div className="flex items-center gap-3">
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      Co-Authoring
                    </div>
                  </Link>
                  <Link href="/" className="sidebar-link">
                    <div className="flex items-center gap-3">
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Account Settings
                    </div>
                  </Link>
                </nav>
              </div>
            </aside>

            <div className="flex-1 space-y-6">
              <header className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-bold text-slate-900">Staff Resource Dashboard</h1>
                  <p className="mt-1 text-lg text-slate-600">Welcome back, Professor {userName}! (Computer Science Department)</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-slate-700">{userName}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">Profile</span>
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-white font-semibold shadow-md">
                      {userInitial}
                    </div>
                  </div>
                </div>
              </header>

              <div className="grid gap-6 md:grid-cols-3">
                <Link href="/results?q=" className="glass-card p-6 bg-gradient-to-br from-white to-blue-50 hover:-translate-y-1 transition-all block">
                  <h3 className="text-lg font-semibold text-slate-900 mb-1">Featured Collections & My Resources</h3>
                  <p className="text-sm text-slate-600 mb-4">Total uploaded files</p>
                  <p className="text-5xl font-bold text-slate-900 mb-4">{stats.total}</p>
                  <div className="flex items-center gap-6 mb-4">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                      <span className="text-sm text-slate-700">Documents: {stats.total}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-cyan-500"></span>
                      <span className="text-sm text-slate-700">Videos: {stats.video}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                      <span className="text-sm text-slate-700">Code: {stats.code}</span>
                    </div>
                  </div>
                  <div className="flex justify-center">
                    <div className="relative w-24 h-24">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="40" fill="none" stroke="#e2e8f0" strokeWidth="12" />
                        <circle
                          cx="50"
                          cy="50"
                          r="40"
                          fill="none"
                          stroke="url(#gradient)"
                          strokeWidth="12"
                          strokeDasharray={`${Math.min(stats.total * 2.5, 251.2)} 251.2`}
                          strokeLinecap="round"
                        />
                        <defs>
                          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#3b82f6" />
                            <stop offset="50%" stopColor="#06b6d4" />
                            <stop offset="100%" stopColor="#f59e0b" />
                          </linearGradient>
                        </defs>
                      </svg>
                    </div>
                  </div>
                  <div className="mt-4">
                    <button className="w-full bg-gradient-to-r from-blue-500 to-blue-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:-translate-y-0.5 transition-all text-center">
                      View All Collections
                    </button>
                  </div>
                </Link>

                <div className="glass-card p-6 bg-gradient-to-br from-white to-blue-100 relative overflow-hidden hover:-translate-y-1 transition-all cursor-pointer"
                  onClick={() => window.location.href = '/dashboard/staff'}
                >
                  <h3 className="text-lg font-semibold text-slate-900 mb-1">Departmental Activity</h3>
                  <p className="text-sm text-slate-600 mb-4">Computer Science Department</p>
                  <div className="space-y-2 relative z-10">
                    {dashboardStats?.recent_activity && dashboardStats.recent_activity.length > 0 ? (
                      dashboardStats.recent_activity.map((item: { title: string; created_at: string }, index: number) => (
                        <div key={index} className="flex items-center gap-2 text-sm animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
                          <span className="text-blue-600">▶</span>
                          <span className="text-slate-700">{item.title}</span>
                        </div>
                      ))
                    ) : (
                      <div className="text-sm text-slate-500">No recent activity yet</div>
                    )}
                  </div>
                  <div className="mt-4 flex justify-center">
                    <button className="bg-gradient-to-r from-blue-500 to-blue-700 text-white text-xs font-semibold py-2 px-4 rounded-lg shadow-md hover:-translate-y-0.5 transition-all">
                      View All Activity
                    </button>
                  </div>
                  <img
                    src="https://coresg-normal.trae.ai/api/v1/text-to-image?prompt=education%20illustration%20books%20and%20gears%20in%20blue%20and%20orange%20colors&image_size=square"
                    alt=""
                    className="absolute -right-4 -bottom-4 w-32 opacity-30"
                  />
                </div>

                <div className="glass-card p-6 bg-gradient-to-br from-white to-slate-50 relative overflow-hidden hover:-translate-y-1 transition-all cursor-pointer"
                  onClick={() => window.location.href = '/dashboard/staff'}
                >
                  <h3 className="text-lg font-semibold text-slate-900 mb-1">Student Engagement</h3>
                  <p className="text-sm text-slate-600 mb-4">Summary interactions</p>
                  <div className="space-y-4">
                    <div className="animate-fade-in" style={{ animationDelay: "100ms" }}>
                      <p className="text-5xl font-bold text-slate-900">{dashboardStats?.total_comments || 0}</p>
                      <p className="text-sm text-slate-600">New Comments</p>
                    </div>
                    <div className="animate-fade-in" style={{ animationDelay: "200ms" }}>
                      <p className="text-5xl font-bold text-slate-900">{dashboardStats?.new_views || 0}</p>
                      <p className="text-sm text-slate-600">New Views</p>
                    </div>
                    <div className="animate-fade-in" style={{ animationDelay: "300ms" }}>
                      <p className="text-5xl font-bold text-slate-900">{dashboardStats?.new_downloads || 0}</p>
                      <p className="text-sm text-slate-600">New Downloads</p>
                    </div>
                  </div>
                  <div className="mt-4 flex justify-center">
                    <button className="bg-gradient-to-r from-blue-500 to-blue-700 text-white text-xs font-semibold py-2 px-4 rounded-lg shadow-md hover:-translate-y-0.5 transition-all">
                      View Analytics
                    </button>
                  </div>
                  <img
                    src="https://coresg-normal.trae.ai/api/v1/text-to-image?prompt=abstract%20educational%20shapes%20pencils%20books%20blue%20theme&image_size=square"
                    alt=""
                    className="absolute -right-4 -bottom-4 w-32 opacity-30"
                  />
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="glass-panel p-6">
                  <h2 className="text-2xl font-bold text-slate-900 mb-4">My Recent Uploads</h2>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-slate-200">
                          <th className="text-left py-3 text-sm font-semibold text-slate-700">Type</th>
                          <th className="text-left py-3 text-sm font-semibold text-slate-700">Name</th>
                          <th className="text-left py-3 text-sm font-semibold text-slate-700">Date</th>
                          <th className="text-left py-3 text-sm font-semibold text-slate-700">Manage</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {loading ? (
                          <tr>
                            <td colSpan={4} className="py-8 text-center">
                              <LoadingSpinner />
                            </td>
                          </tr>
                        ) : recentDocuments.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="py-8 text-center text-slate-500">
                              No uploads yet
                            </td>
                          </tr>
                        ) : (
                          recentDocuments.map((doc) => (
                            <tr key={doc.id} className="hover:bg-slate-50">
                              <td className="py-3">
                                <div className="flex items-center gap-2">
                                  {doc.title?.toLowerCase().endsWith(".pdf") ? (
                                    <svg className="w-5 h-5 text-red-500" viewBox="0 0 24 24" fill="currentColor">
                                      <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20M10.91,11.22C10.68,10.54 10.15,8.44 11.55,8.44C13.34,8.45 12.54,12.27 14.24,12.27C14.67,12.27 15.05,12.07 15.31,11.77C15.73,12.31 16,13.04 16,13.82C16,15.45 14.5,16.89 12.27,16.89C10.42,16.89 9.36,15.67 9.31,13.72C9.29,13.16 9.42,12.53 9.76,12.04C10.09,11.56 10.63,11.3 11.06,11.24C11,11.42 10.95,11.62 10.95,11.82C10.95,12.55 11.34,13.23 12.27,13.23C12.65,13.23 12.97,13.07 13.18,12.81C13,13.16 12.63,13.66 12.27,13.66C11.95,13.66 11.74,13.38 11.74,13.04C11.74,12.69 11.96,12.35 12.27,12.35C12.84,12.35 13.4,11.07 12.82,9.82C12.67,9.5 12.5,9.18 12.27,8.88C12.1,9.17 11.93,9.5 11.8,9.79C11.46,10.56 11.14,11.46 10.91,11.22Z" />
                                    </svg>
                                  ) : doc.title?.toLowerCase().endsWith(".mp4") || doc.title?.toLowerCase().endsWith(".webm") ? (
                                    <svg className="w-5 h-5 text-purple-500" viewBox="0 0 24 24" fill="currentColor">
                                      <path d="M18,3.5A2.5,2.5 0 0,1 20.5,6V18A2.5,2.5 0 0,1 18,20.5H6A2.5,2.5 0 0,1 3.5,18V6A2.5,2.5 0 0,1 6,3.5H18M14,12L10,9V15L14,12Z" />
                                    </svg>
                                  ) : (
                                    <svg className="w-5 h-5 text-blue-500" viewBox="0 0 24 24" fill="currentColor">
                                      <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                                    </svg>
                                  )}
                                </div>
                              </td>
                              <td className="py-3 text-sm text-slate-900">{doc.title}</td>
                              <td className="py-3 text-sm text-slate-600">{formatDateTime(doc.created_at)}</td>
                              <td className="py-3">
                                <div className="flex gap-2">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingDoc(doc);
                                      setEditTitle(doc.title || "");
                                      setEditCourseCode(doc.course_code || "");
                                      setEditLevel(doc.level ? String(doc.level) : "");
                                    }}
                                    className="bg-white border border-blue-500 text-blue-600 text-xs font-semibold py-1 px-3 rounded-md hover:bg-blue-50 transition-all"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => onDelete(doc.id)}
                                    className="bg-white border border-red-500 text-red-600 text-xs font-semibold py-1 px-3 rounded-md hover:bg-red-50 transition-all"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="glass-panel p-6">
                  <h2 className="text-2xl font-bold text-slate-900 mb-4">Pending Approvals</h2>
                  <p className="text-sm text-slate-600 mb-4">Approve or reject student submissions and co-authored works.</p>
                  <div className="space-y-3">
                    {(dashboardStats?.pending_approvals?.length ?? 0) > 0 ? (
                      dashboardStats?.pending_approvals?.map((item: { title?: string } | string, index: number) => (
                        <div key={index} className="flex items-center justify-between py-3 border-b border-slate-100 last:border-b-0 animate-fade-in-up" style={{ animationDelay: `${index * 100}ms` }}>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-semibold">
                              {(typeof item === 'string' ? item : item.title || '').charAt(0)}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-slate-900">{typeof item === 'string' ? item : (item.title || 'Untitled')}</p>
                              <p className="text-xs text-slate-500">Submitted recently</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              className="bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xs font-semibold py-2 px-4 rounded-md hover:-translate-y-0.5 transition-all"
                            >
                              Approve
                            </button>
                            <button
                              className="bg-gradient-to-r from-rose-500 to-red-600 text-white text-xs font-semibold py-2 px-4 rounded-md hover:-translate-y-0.5 transition-all"
                            >
                              Reject
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-slate-500">No pending approvals</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showUploadModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <form onSubmit={onUploadSubmit} className="glass-panel w-full max-w-lg p-8">
            <h3 className="text-2xl font-semibold text-slate-900">Upload New Resource</h3>
            <div className="mt-6 space-y-4">
              <div className="space-y-1">
                <span className="text-sm font-medium text-slate-700">File</span>
                <input
                  type="file"
                  onChange={(event) => setUploadFile(event.target.files?.[0] || null)}
                  className="input-surface w-full px-3 py-3 text-sm text-slate-900"
                  required
                />
              </div>
              <div className="space-y-1">
                <span className="text-sm font-medium text-slate-700">Title</span>
                <input
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  placeholder="e.g., CSC401 Lecture Notes"
                  className="input-surface w-full px-3 py-3 text-sm text-slate-900 outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-sm font-medium text-slate-700">Course Code</span>
                  <input
                    value={uploadCourseCode}
                    onChange={(e) => setUploadCourseCode(e.target.value)}
                    placeholder="e.g., CSC401"
                    className="input-surface w-full px-3 py-3 text-sm text-slate-900 uppercase outline-none"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-sm font-medium text-slate-700">Level</span>
                  <input
                    value={uploadLevel}
                    onChange={(e) => setUploadLevel(e.target.value)}
                    placeholder="e.g., 400"
                    className="input-surface w-full px-3 py-3 text-sm text-slate-900 outline-none"
                    required
                  />
                </div>
              </div>
            </div>
            <div className="mt-8 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowUploadModal(false)}
                className="secondary-button text-sm font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={uploading}
                className="primary-button text-sm"
              >
                {uploading ? "Uploading..." : "Upload"}
              </button>
            </div>
          </form>
        </div>
      )}

      {editingDoc && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-lg p-8">
            <h3 className="text-2xl font-semibold text-slate-900">Edit Metadata</h3>
            <div className="mt-6 space-y-4">
              <div className="space-y-1">
                <span className="text-sm font-medium text-slate-700">Title</span>
                <input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="input-surface w-full px-3 py-3 text-sm text-slate-900 outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-sm font-medium text-slate-700">Course Code</span>
                  <input
                    value={editCourseCode}
                    onChange={(e) => setEditCourseCode(e.target.value)}
                    className="input-surface w-full px-3 py-3 text-sm text-slate-900 uppercase outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-sm font-medium text-slate-700">Level</span>
                  <input
                    value={editLevel}
                    onChange={(e) => setEditLevel(e.target.value)}
                    className="input-surface w-full px-3 py-3 text-sm text-slate-900 outline-none"
                  />
                </div>
              </div>
            </div>
            <div className="mt-8 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setEditingDoc(null)}
                className="secondary-button text-sm font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void onSaveEdit()}
                disabled={savingEdit}
                className="primary-button text-sm"
              >
                {savingEdit ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
