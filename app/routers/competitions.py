# app/routers/competitions.py

# [수정] Depends, Client, get_supabase_client를 새로 import 합니다.
from fastapi import APIRouter, HTTPException, Depends
from supabase import Client
from app.db import get_supabase_client
from app.schemas import CompetitionCreate, JudgeAssignmentCreate

router = APIRouter()

# [수정] 함수의 인자로 db: Client = Depends(...)를 추가하고, supabase를 db로 변경했습니다.
# [수정] 함수 이름의 오타(compeition)를 수정했습니다.
@router.post("/competitions")
def create_competition(competition: CompetitionCreate, db: Client = Depends(get_supabase_client)):
    competition_data = competition.model_dump(mode="json")
    # [수정] supabase -> db
    response = db.from_("competitions").insert(competition_data).execute()
    return response.data

# [수정] 함수의 인자로 db: Client = Depends(...)를 추가하고, supabase를 db로 변경했습니다.
@router.post("/competitions/{competition_id}/judges")
def assign_judge_to_competition(competition_id: int, assignment: JudgeAssignmentCreate, db: Client = Depends(get_supabase_client)):
    assignment_data = {
        "competition_id": competition_id,
        "judge_id": assignment.judge_id
    }
    
    # [수정] supabase -> db
    response = db.from_("competition_assignments").insert(assignment_data).execute()
    
    if not response.data:
        raise HTTPException(status_code=400, detail="Failed to assign judge. Check if IDs are correct.")
        
    return response.data