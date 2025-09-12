from fastapi import APIRouter
from app.db import supabase
from app.schemas import CompetitionCreate
router = APIRouter()

@router.post("/competitions")
def create_compeition(competition: CompetitionCreate):
    competition_data = competition.model_dump()
    response = supabase.from_("compeitions").insert(competition_data).execute()
    return response.data


