import logging
from fastapi import Request, Header
from typing import Optional

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

from app.api.router import api_router
from app.core.database import Base, engine
from app.models import comment, document, metadata, user  # noqa: F401

logger = logging.getLogger(__name__)

app = FastAPI(title="Academic Search Engine API")

# Add logging middleware FIRST
@app.middleware("http")
async def log_requests(request: Request, call_next):
    logger.info("Incoming request: %s %s", request.method, request.url)
    logger.info("Headers: %s", dict(request.headers))
    response = await call_next(request)
    logger.info("Response status: %s", response.status_code)
    return response

# Then add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)

# Test endpoint to debug token issues
@app.get("/test-token")
def test_token(authorization: Optional[str] = Header(None)):
    print("Test token endpoint called!")
    print("Authorization header:", authorization)
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ")[1]
        print("Extracted token:", token)
        
        # Let's try to decode without signature first
        try:
            from jose import jwt
            print("Trying to decode without signature...")
            payload = jwt.decode(token, options={"verify_signature": False})
            print("Payload:", payload)
            return {"status": "ok", "payload": payload, "token_preview": token[:50]}
        except Exception as e:
            print("Error decoding token:", str(e))
            return {"status": "error", "message": str(e)}
    return {"status": "no token"}


@app.on_event("startup")
def startup_db_init() -> None:
    try:
        Base.metadata.create_all(bind=engine)
        with engine.begin() as connection:
            connection.execute(text("CREATE EXTENSION IF NOT EXISTS pg_trgm"))
    except SQLAlchemyError as exc:
        logger.warning("Database initialization skipped: %s", exc)


@app.get("/health")
def health_check():
    return {"status": "ok"}
