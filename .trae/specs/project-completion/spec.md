# OAU CSE Academic Search Engine - Product Requirements Document

## Overview
- **Summary**: Complete an Academic Search Engine for Obafemi Awolowo University (OAU) Computer Science & Engineering department. The system allows students & staff to search academic resources (PDF notes, past questions, code examples, slides), staff to upload and manage resources, authenticated users to comment on documents, and all users to browse via filters.
- **Purpose**: Provide a centralized, searchable archive of course materials for the OAU CSE community.
- **Target Users**:
  - Students: Search, browse, view, download, and comment on resources.
  - Verified Staff: Upload documents, manage metadata, and view a dashboard of upload activity.

## Goals
- Every core user flow from registration → search → view → comment → upload works end-to-end.
- Backend and frontend type/schema contracts are consistent.
- Authentication and authorization protect staff-only routes and actions.
- PostgreSQL FTS search returns ranked results with highlighting.
- Documents are stored in Supabase Storage with public URLs.
- All pages render with proper layout, styling, and error/loading states.

## Non-Goals
- Payment/paywall or monetization features.
- Admin/moderation UI for staff approval (an existing `/auth/make-staff` backdoor is acceptable for now).
- Real-time push notifications or websockets.
- Mobile-native apps (responsive web is fine).
- Migration system beyond SQLAlchemy `create_all`.

## Background & Context
Existing repository:
- Backend: FastAPI + SQLAlchemy (psycopg2) + Supabase (Auth, Storage, Postgres via pooler). Modules: `app/api/{router,deps}` routes for auth/documents/upload/search/comments/evaluation; `app/core/{config,database,supabase_client}`; `app/models/{user,document,metadata,comment}`; `app/services/{auth_service,document_service,storage_service,fts_search_service,comment_service,supabase_document_service,evaluation_service,metadata_extractor,search_service,staff_documents_service}`; `app/schemas/{auth,user,document,search,staff_documents,comment}`.
- Frontend: Next.js 16 (App Router) + React 19 + TypeScript + Tailwind 4 + Supabase JS browser client. Pages: home (`/`), auth (`/auth/login`, `/auth/register`, `/auth/register-success`), redirects (`/login`→`/auth/login`, `/register`→`/auth/register`, `/upload`→`/dashboard/staff`), results (`/results`), document detail (`/documents/[id]`), staff dashboard (`/dashboard/staff`), code preview (`/code-preview`). Shared components: AuthProvider, AppNavbar, SearchBar, ResultCard, FiltersSidebar, LoadingSpinner, BackButton, WorkspaceRail, UploadModalProvider, CodePreview. Lib: `api.ts` (fetch wrapper), `auth-session.ts` (localStorage + cookies), `search-cache.ts`, `supabase-browser.ts`. Middleware guards `/upload*` and `/dashboard/staff*` via role cookie.
- Both env files populated with Supabase keys. Backend is started via a local-deps wrapper (`run_backend.py`) that prepends `.pydeps/` to `sys.path` because sandbox blocks writes to AppData; Python packages live in `backend/.pydeps`.
- Known gaps from audit: frontend never integrates comment create/list UI; document detail page never loads comments nor uses dynamic doc content; upload modal is missing from staff dashboard; multiple endpoint/type mismatches (e.g. `/upload` form POSTs level as string but backend accepts int; staff documents list uses int ids not strings); login logout never calls supabase signOut; middleware role cookie is written but session.userRole is not fetched from backend after login so UI shows the wrong role; `SearchResult.file_url` vs `file_path` inconsistency; backend stats endpoint never returns dynamic data for views/downloads; register success uses nonexistent CSS classes (glass-panel/primary-button etc.); `AppNavbar` clears session but doesn't sign out of Supabase; search filter UI has course counts hardcoded not from backend; level filter passes string but backend schema Metadata.level is String and SearchResult expects string; `/documents/{id}` detail page title is hardcoded not dynamic from doc; staff dashboard references `UploadModalProvider` but no upload UI is present there.

## Functional Requirements
- **FR-1 Auth (Register)**: A visitor can register with email+password via Supabase Auth; backend creates a local profile row; redirects to register-success page.
- **FR-2 Auth (Login)**: A user can login with email+password (Supabase), backend validates token and returns role/status; frontend persists session (token, role, profile) to localStorage and cookies; redirects to appropriate page (staff→dashboard, student→results).
- **FR-3 Auth (Logout)**: Logout button clears local session AND signs out of Supabase; middleware cookie cleared.
- **FR-4 Role-based Access**: `/upload*`, `/dashboard/staff*` and backend upload endpoints require verified staff role (403 otherwise).
- **FR-5 Home Search**: Home page search bar → `/results?q=...` with working query.
- **FR-6 Results Page**: Query backend `/search?q=...&course_code=&level=&programming_language=`, display result cards, support filters, show errors or empty states, and render cached/mock results when backend unavailable.
- **FR-7 Document Detail**: By id, dynamic title, metadata, file URL, file preview, comments list, and comment submission (authenticated only).
- **FR-8 Comments (Authenticated)**: POST `/comments` creates comment + parent threading; GET `/comments/{id}` returns nested list with author names.
- **FR-9 Staff Upload**: Upload UI (modal or form) with file, course_code, level, optional title; POSTs to `/upload` with auth; success message and fresh list.
- **FR-10 Staff Documents List + Update + Delete**: `/documents/mine` returns current staffer's docs; PATCH/DELETE by id.
- **FR-11 Dashboard Stats**: `/documents/dashboard/stats` returns counts (docs, comments, staff docs, code/video splits, recent activity).
- **FR-12 Search Ranking**: PostgreSQL FTS with ts_rank + headline, filters applied, results limited.

## Non-Functional Requirements
- **NFR-1 Schema Contracts**: Frontend types (`types/index.ts`, `types/auth.ts`) match backend schemas. No broken field names like `file_path`/`file_url` mismatches.
- **NFR-2 Type/Lint Clean**: `tsc --noEmit` on frontend passes without semantic errors; backend imports all resolve on startup.
- **NFR-3 Reliable Startup**: Backend starts via `python run_backend.py` on :8000; frontend via `npm run dev` on :3000; `/health` and `/` return 200.
- **NFR-4 Error Handling**: All API pages show user-friendly error messages for failed fetches and 404 for missing documents.
- **NFR-5 Security**: Staff actions verified server-side; never trust client role alone; service_key never exposed to frontend.

## Constraints
- **Technical**: Must use existing stack (FastAPI, SQLAlchemy, Supabase Auth/Storage/Postgres, Next 16 App Router, Tailwind 4, TypeScript).
- **Business**: Staff verification via email domain heuristics (`@oauife.edu.ng`, `@pg-student.oauife.edu.ng`) with backend super-admin override only.
- **Dependencies**: Supabase project and bucket already exist; reuse existing keys.

## Assumptions
- Supabase bucket `academic-resources` is public or has RLS allowing service_role upload + download; no RLS changes are required within scope (if missing, rely on backend errors).
- Supabase Auth email confirmation can be disabled or auto-confirmed in project settings; register success email mention is decorative for this scope.
- Users will run backend via `python run_backend.py` (because sandbox-installed packages live in `.pydeps`); regular `uvicorn` CLI won't work out of the box but we don't need to change docs for scope.

## Acceptance Criteria

### AC-1: Registration Flow Works End-to-End
- **Type**: `rule`
- **Given**: A visitor navigates to `/auth/register`, enters valid full_name, email, matching passwords, accepts terms
- **When**: Submits the form
- **Then**: Supabase Auth creates user → backend `POST /auth/signup` returns 200 with `user` + `message` → browser redirects to `/auth/register-success` which renders with user's name and proper styling
- **Pass Condition**: HTTP 200 from /auth/signup; redirect lands on register-success; console shows no uncaught errors; page renders without missing CSS classes causing broken layout
- **Evidence**: Network panel screenshot/logs + rendered success DOM

### AC-2: Login Sets Correct Role and Session Persists
- **Type**: `rule`
- **Given**: An existing student and an existing verified-staff user (staff can be created via /auth/make-staff after first login)
- **When**: User logs in via /auth/login
- **Then**: (a) supabase token valid → backend `/auth/login` returns `{user: {role, is_staff_verified, status}}`; (b) frontend updates AuthProvider session, sets both localStorage keys AND cookies (oau_access_token, oau_user_role); (c) student redirects to `/results?q=`; staff redirects to `/dashboard/staff` and can open it (middleware allows); (d) hard refresh keeps user logged in with role intact
- **Pass Condition**: Session role matches backend; cookies visible in DevTools; staff dashboard page loads without redirect back to `/`
- **Evidence**: Login response JSON + localStorage/cookies state + staff dashboard rendered

### AC-3: Logout Clears Session and Signs Out of Supabase
- **Type**: `rule`
- **Given**: An authenticated user on home page with visible Logout button
- **When**: Clicks Logout
- **Then**: (a) frontend `clearSession` removes localStorage + cookies; (b) frontend calls `supabase.auth.signOut()`; (c) next request to a guarded route redirects to /
- **Pass Condition**: localStorage keys and cookies both empty after logout; /dashboard/staff redirects unauth
- **Evidence**: Storage state after logout + redirect

### AC-4: Full-Text Search Returns Ranked Results
- **Type**: `rule`
- **Given**: At least one document row + matching metadata in Postgres (create during task if none)
- **When**: `GET /search?q=binary+search` (or an existing term) is called from results page with optional course_code/level filters
- **Then**: Returns JSON array of SearchResult items sorted by `relevance_score` desc; each contains `document_id, title, relevance_score, snippet, metadata{course_code,level,programming_language,key_snippet}, file_url`; limit≤50; course_code filter narrows results
- **Pass Condition**: Response 200; array items have required fields; order by relevance
- **Evidence**: Raw HTTP response + DB row count match

### AC-5: Document Detail Uses Dynamic Data and Supports Comments
- **Type**: `rule`
- **Given**: A document with id=N exists in DB
- **When**: Navigating to `/documents/N` as guest and as authenticated user
- **Then**: (a) GET `/documents/N` returns doc data; page title, course, author info rendered from response not hardcoded; (b) PDF iframe src uses real `file_url`; (c) comments list loads via GET `/comments/N` and shows nested threads with author name; (d) authenticated user sees comment form and POST `/comments` returns 201 comment structure; comment appears in list without refresh
- **Pass Condition**: Title in H1 matches DB row title; ≥1 GET comments /comments returns nested; POST comment works
- **Evidence**: Document response + comments response + rendered page

### AC-6: Staff Can Upload a Document and It Appears in Search
- **Type**: `rule`
- **Given**: A verified staff user is logged in and on /dashboard/staff
- **When**: Uses the upload UI to attach a small PDF/TXT/Python file, fills course_code (e.g. CSC 201), level (200), submits
- **Then**: (a) Multipart POST `/upload` with Authorization: Bearer returns 200 JSON with `file_url` + document_id; (b) file exists in Supabase storage bucket `academic-resources`; (c) new row in `documents` + `document_metadata`; (d) new item visible in `/documents/mine` list; (e) a search query that matches title/content returns the new document
- **Pass Condition**: All 5 subconditions met; no 403 for verified staff; 403 if student tries
- **Evidence**: Upload response + documents/mine response + search result containing new doc id

### AC-7: Staff Can Update/Delete Own Documents
- **Type**: `rule`
- **Given**: Uploaded document (see AC-6) owned by current staff user
- **When**: (1) PATCH `/documents/{id}` with `{title, course_code, level}` payload; (2) DELETE `/documents/{id}` of a different upload
- **Then**: (1) 200 and changes persisted; (2) 200; row removed from documents and file removed from storage (best-effort; if RLS blocks storage delete, at least DB row is gone)
- **Pass Condition**: PATCH changes reflected in /mine list; DELETE returns 200 and GET detail returns 404
- **Evidence**: PATCH response + GET detail after DELETE (404)

### AC-8: Dashboard Stats Reflect Real Data
- **Type**: `rule`
- **Given**: Known N documents and M comments in DB with K uploaded by current staff
- **When**: GET `/documents/dashboard/stats` as staff
- **Then**: Response contains `{total_documents, total_comments, staff_documents, total_code_documents, total_video_documents, staff_code_documents, staff_video_documents, new_views, new_downloads, recent_activity[], pending_approvals[]}`; numeric counts match actual DB queries (not hardcoded placeholders)
- **Pass Condition**: total_documents = DB `count(documents.id)`; total_comments = DB `count(comments.id)`; recent_activity has 5 or fewer recent docs sorted desc
- **Evidence**: Endpoint response compared with SQL counts

### AC-9: Middleware Guards Work and Match Cookie Names
- **Type**: `rule`
- **Given**: No session or wrong role set
- **When**: Visiting `/upload` or `/dashboard/staff` without staff cookies
- **Then**: Redirected to `/?error=staff-only`; with valid staff cookies, page loads normally
- **Pass Condition**: 307/308 to /?error=staff-only when unauth; staff loads without redirect
- **Evidence**: Next middleware response (network + redirect)

### AC-10: Type and Naming Contract Consistency (no mismatched file_url vs file_path)
- **Type**: `rule`
- **Given**: All frontend types and backend schemas are in place
- **When**: Compare frontend types (SearchResult, StaffDocument, DocumentDetail) against backend schema fields / endpoint JSON
- **Then**: `file_url` used consistently in responses; no frontend code references a missing `file_path` from search responses; `id`/`document_id` usage matches types (`StaffDocument.id` matches the backend int id if backend returns numeric, otherwise backend must serialize as string consistently)
- **Pass Condition**: TypeScript find-all-references of `file_path` on frontend API types return zero hits; SearchResult and DocumentDetail both use `file_url`
- **Evidence**: grep result + type inspection

### AC-11: Frontend TypeScript Compiles Semantically Clean
- **Type**: `rule`
- **Given**: The final code state
- **When**: `cd frontend && npx tsc --noEmit`
- **Then**: Zero errors (warnings permitted)
- **Pass Condition**: Exit code 0 and no error lines in output
- **Evidence**: Command output

### AC-12: Frontend Styling Uses Existing Utility Classes (No Missing Classes That Break Render)
- **Type**: `rubric`
- **Dimension**: UI rendering coherence across every page (home, login, register, register-success, results, detail, staff dashboard)
- **Scale**: 1-5
- **Anchors**: 1 = multiple pages visibly broken due to nonexistent CSS classes / missing imports; 3 = most pages render OK, 1-2 pages have minor cosmetic issues with undefined utility classes; 5 = every page renders cleanly, buttons/cards/forms all styled and responsive
- **Pass Threshold**: >= 4
- **Evidence**: Screenshots or live inspection of each page

### AC-13: Backend Startup and All Core Endpoints Reachable
- **Type**: `rule`
- **Given**: Python deps in `.pydeps`, backend run with `python run_backend.py`
- **When**: Start backend, then issue: GET /health, GET /docs (openapi), POST /auth/login (bad token → 401), GET /search?q=test, GET /documents/999999
- **Then**: /health → 200 OK {"status":"ok"}; /docs → 200 HTML; bad login → 401; search → 200 []; nonexistent doc → 404
- **Pass Condition**: All 5 return correct status codes as above
- **Evidence**: curl/Invoke-WebRequest outputs

## Open Questions
- (Optional) Do we need `/auth/make-staff` to also require admin token? For now keep as-is for testing convenience but noted.
- (Optional) Are video file uploads needed in scope? Backend stats counts them; frontend upload should accept common document formats and code, no explicit video handling for UI beyond the allow-all UploadFile default (acceptable).
