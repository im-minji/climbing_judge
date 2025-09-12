from fastapi import APIRouter
from app.db import supabase
from app.schemas import CompeitionCreate

router = APIRouter()

@router.post("/competitions")
def create_compeition(competition: CompeitionCreate):
    competition_data = competition.model.dump()
    response = supabase.from_("compeitions").insert(competition_data).execute()
    return response.data


