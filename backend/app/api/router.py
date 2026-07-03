from fastapi import APIRouter

from app.api.routes.auth import router as auth_router
from app.api.routes.comments import router as comments_router
from app.api.routes.documents import router as documents_router
from app.api.routes.evaluation import router as evaluation_router
from app.api.routes.search import router as search_router
from app.api.routes.upload import router as upload_router

api_router = APIRouter()
api_router.include_router(auth_router)
api_router.include_router(documents_router)
api_router.include_router(upload_router)
api_router.include_router(search_router)
api_router.include_router(comments_router)
api_router.include_router(evaluation_router)
