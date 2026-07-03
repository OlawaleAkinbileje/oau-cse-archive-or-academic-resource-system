# Academic Search Backend (FastAPI)

## Setup

1. Create and activate a virtual environment.
2. Install dependencies:
   `pip install -r requirements.txt`
3. Copy `.env.example` to `.env` and fill values.
4. Run the API:
   `uvicorn app.main:app --reload`

## API Endpoints

- `POST /auth/login` - Validate Supabase session token.
- `POST /documents/upload` - Staff-only document upload with metadata.
- `GET /search` - Authenticated hybrid text + metadata search.
- `POST /comments` - Authenticated comment creation.

## Notes

- Authentication uses Supabase JWT (`SUPABASE_JWT_SECRET`) and role lookup from `profiles`.
- Search uses PostgreSQL full-text search (`to_tsvector`, `ts_rank`) and trigram typo-tolerance (`pg_trgm` similarity) plus filters (`course_code`, `programming_language`, `level`).
- `documents/upload` extracts:
  - Programming language for code files (`.py`, `.js`, `.java`)
  - First 500 characters from PDF text (via `PyPDF2`) as metadata snippet.
