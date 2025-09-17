from fastapi import APIRouter, Depends, HTTPException, Request
from supabase import Client
from app.db import get_supabase_client

router = APIRouter()

async def get_current_user_with_profile(request: Request, db: Client = Depends(get_supabase_client)):
    auth_header = request.headers.get("Authorization")
    if not auth_header:
        raise HTTPException(status_code=401, detail="Authorization header missing")
    token = auth_header.split(" ")[1]
    
    try:
        user_response = db.auth.get_user(token)
        user = user_response.user
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

    profile_response = db.from_("judges").select("*").eq("id", user.id).single().execute()
    if not profile_response.data:
        raise HTTPException(status_code=404, detail="Profile not found for authenticated user")
    
    return profile_response.data

async def get_current_admin_user(current_user: dict = Depends(get_current_user_with_profile)):
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin privileges required")
    return current_user

@router.get("/me")
def get_my_profile(current_user: dict = Depends(get_current_user_with_profile)):
    return current_user


# --- [아래 함수를 새로 추가] ---
@router.get("/me/competitions")
def get_my_competitions(current_user: dict = Depends(get_current_user_with_profile), db: Client = Depends(get_supabase_client)):
    """
    로그인한 심판에게 배정된 모든 대회 목록을 조회합니다.
    """
    user_id = current_user.get("id")
    
    # judges -> competition_assignments -> competitions 순서로 JOIN하여 데이터 조회
    response = db.from_("judges").select("*, competition_assignments(*, competitions(*))").eq("id", user_id).single().execute()

    if not response.data:
        raise HTTPException(status_code=404, detail="Could not find assignments for the user.")
    
    # 필요한 대회 정보만 추출하여 반환
    assignments = response.data.get("competition_assignments", [])
    competitions = [a.get("competitions") for a in assignments if a.get("competitions")]
    
    return competitions