from fastapi import APIRouter, HTTPException
from app.db import supabase
from app.schemas import CompetitionCreate, JudgeAssignmentCreate
router = APIRouter()

@router.post("/competitions")
def create_compeition(competition: CompetitionCreate):
    competition_data = competition.model_dump(mode="json")
    response = supabase.from_("competitions").insert(competition_data).execute()
    return response.data


@router.post("/competitions/{competition_id}/judges")
def assign_judge_to_competition(competition_id: int, assignment: JudgeAssignmentCreate):
    assignment_data = {
        "competition_id": competition_id,
        "judge_id": assignment.judge_id
    }
    
    response = supabase.from_("competition_assignments").insert(assignment_data).execute()
    
    if not response.data:
        raise HTTPException(status_code=400, detail="Failed to assign judge. Check if IDs are correct.")
        
    return response.data