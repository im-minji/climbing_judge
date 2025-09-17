# app/routers/judges.py

# [수정] Depends, Client, get_supabase_client를 새로 import 합니다.
from fastapi import APIRouter, HTTPException, Depends
from supabase import Client
from app.db import get_supabase_client
from app.schemas import JudgeCreate, JudgeUpdate

# from app.routers.users import get_current_admin_user, get_current_user_with_profile

router = APIRouter()

# [수정] 함수의 인자로 db: Client = Depends(...)를 추가하고, supabase를 db로 변경했습니다.
@router.get("/judges")
def get_judges(db: Client = Depends(get_supabase_client)):
    response = db.from_("judges").select("*").execute()
    return response.data

# [수정] 함수의 인자로 db: Client = Depends(...)를 추가하고, supabase를 db로 변경했습니다.
@router.post("/judges")
def create_judge(judge: JudgeCreate, db: Client = Depends(get_supabase_client)):
    """
    Supabase Auth에 사용자를 먼저 생성하고,
    그 user id를 이용해 public.judges 테이블에 프로필 정보를 저장합니다.
    """
    try:
        # [수정] supabase -> db
        auth_response = db.auth.admin.create_user({
            "email": judge.email,
            "password": judge.password,
            "email_confirm": True,
        })
        new_user = auth_response.user
        
        profile_data = {
            "id": new_user.id,
            "judge_number": judge.judge_number,
            "name": judge.name,
            "affiliation": judge.affiliation,
            "national_license_grade": judge.national_license_grade,
            "email": judge.email,
            "role": judge.role
        }
        
        # [수정] supabase -> db
        response = db.from_("judges").insert(profile_data).execute()
        
        return response.data

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# [수정] 함수의 인자로 db: Client = Depends(...)를 추가하고, supabase를 db로 변경했습니다.
@router.get("/judges/{judge_id}")
def get_judge_by_id(judge_id: str, db: Client = Depends(get_supabase_client)):
    # [수정] supabase -> db
    response = db.from_("judges").select("*").eq("id", judge_id).execute()
    
    if not response.data:
        return {"message": "Judge not found"}
    return response.data[0]

# [수정] 함수의 인자로 db: Client = Depends(...)를 추가하고, supabase를 db로 변경했습니다.
@router.patch("/judges/{judge_id}")
def update_judge(judge_id: str, judge_update: JudgeUpdate, db: Client = Depends(get_supabase_client)):
    update_data = judge_update.model_dump(exclude_unset=True)

    if not update_data:
        raise HTTPException(status_code=400, detail="No update data provided")

    # [수정] supabase -> db
    response = db.from_("judges").update(update_data).eq("id", judge_id).execute()
    
    if not response.data:
        raise HTTPException(status_code=404, detail="Judge not found")

    return response.data

# [수정] 함수의 인자로 db: Client = Depends(...)를 추가하고, supabase를 db로 변경했습니다.
@router.delete("/judges/{judge_id}")
def delete_judge_by_id(judge_id: str, db: Client = Depends(get_supabase_client)):
    try:
        # [수정] supabase -> db
        db.auth.admin.delete_user(judge_id)
        
        return {"message": f"Judge with id {judge_id} deleted successfully."}
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Judge not found or failed to delete: {e}")