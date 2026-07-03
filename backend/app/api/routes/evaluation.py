
"""
Evaluation API endpoints for performance testing and metric calculation.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.services.evaluation_service import EvaluationService

router = APIRouter(prefix="/evaluation", tags=["evaluation"])


@router.get("/run")
async def run_evaluation(db: Session = Depends(get_db)):
    service = EvaluationService(db)
    return service.run_full_evaluation()


@router.get("/health")
async def health_check():
    return {"status": "ok", "message": "Evaluation service is operational"}
