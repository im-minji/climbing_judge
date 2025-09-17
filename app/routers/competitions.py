# app/routers/competitions.py

# [수정] Depends, Client, get_supabase_client를 새로 import 합니다.
from fastapi import APIRouter, HTTPException, Depends
from supabase import Client
from app.db import get_supabase_client
from app.schemas import CompetitionCreate, JudgeAssignmentCreate
from app.routers.users import get_current_user_with_profile, get_current_admin_user



router = APIRouter()

@router.get("/competitions")
def get_competitions(current_user: dict = Depends(get_current_user_with_profile), db: Client = Depends(get_supabase_client)):
    response = db.from_("competitions").select("*").order("start_date", desc=True).execute()
    return response.data


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


@router.get("/competitions/{competition_id}")
def get_competition_details(competition_id: int, current_user: dict = Depends(get_current_user_with_profile), db: Client = Depends(get_supabase_client)):
    """
    특정 대회 정보와, 그 대회에 배정된 심판들의 목록을 함께 조회합니다.
    """
    # Supabase의 JOIN 문법: "competition_assignments 테이블을 통해 judges 테이블의 모든 정보를 함께 가져온다"
    response = db.from_("competitions").select("*, competition_assignments(*, judges(*))").eq("id", competition_id).single().execute()
    
    if not response.data:
        raise HTTPException(status_code=404, detail="Competition not found")
        
    return response.data


@router.delete("/competitions/{competition_id}", dependencies=[Depends(get_current_admin_user)])
def delete_competition(competition_id: int, db: Client = Depends(get_supabase_client)):
    """
    특정 ID의 대회를 삭제합니다. (관리자만 가능)
    """
    response = db.from_("competitions").delete().eq("id", competition_id).execute()
    
    # 삭제된 데이터가 없으면 (존재하지 않는 ID), 404 에러 발생
    if not response.data:
        raise HTTPException(status_code=404, detail="Competition not found")
        
    return {"message": f"Competition with id {competition_id} deleted successfully."}



@router.delete("/competitions/{competition_id}/judges/{judge_id}", dependencies=[Depends(get_current_admin_user)])
def unassign_judge_from_competition(competition_id: int, judge_id: str, db: Client = Depends(get_supabase_client)):
    """
    특정 대회에서 특정 심판의 배정을 취소(삭제)합니다. (관리자만 가능)
    """
    response = db.from_("competition_assignments").delete().eq("competition_id", competition_id).eq("judge_id", judge_id).execute()
    
    if not response.data:
        raise HTTPException(status_code=404, detail="Assignment not found to delete")
        
    return {"message": "Judge assignment deleted successfully."}
    