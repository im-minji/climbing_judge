# app/routers/users.py
from fastapi import APIRouter, Depends, HTTPException, Request
from app.db import supabase
from gotrue.errors import AuthApiError

router = APIRouter()

# 의존성 함수: 요청 헤더에서 유효한 토큰을 확인하고 사용자 정보를 반환
async def get_current_user(request: Request):
    auth_header = request.headers.get("Authorization")
    if not auth_header:
        raise HTTPException(status_code=401, detail="Authorization header missing")
    
    token = auth_header.split(" ")[1] # "Bearer <token>" 형식에서 토큰만 추출
    try:
        user_response = supabase.auth.get_user(token)
        return user_response.user
    except AuthApiError:
        raise HTTPException(status_code=401, detail="Invalid token")

@router.get("/me")
def get_my_profile(current_user: dict = Depends(get_current_user)):
    """
    로그인한 사용자의 프로필 정보(judges 테이블)를 반환합니다.
    """
    user_id = current_user.id
    response = supabase.from_("judges").select("*").eq("id", user_id).single().execute()
    
    if not response.data:
        raise HTTPException(status_code=404, detail="Profile not found")
        
    return response.data