from fastapi import APIRouter, HTTPException
from app.db import supabase
from app.schemas import LoginRequest

router = APIRouter()

@router.post("/token")
def login(request: LoginRequest):
    """
    사용자 심판 번호와 비밀번호로 로그인하여 세션(토큰)을 반환
    """
    try:
        # 1. 전달받은 심판 번호로 judges 테이블에서 해당 심판의 이메일을 조회
        profile_res = supabase.from_("judges").select("email").eq("judge_number", request.judge_number).single().execute()
        
        if not profile_res.data:
            raise HTTPException(status_code=404, detail="Judge number not found")
        
        user_email = profile_res.data['email']
        
        # 2. 조회한 이메일과 전달받은 비밀번호로 Supabase에 로그인 요청
        auth_res = supabase.auth.sign_in_with_password({
            "email": user_email,
            "password": request.password
        })
        
        return auth_res.session
        
    except Exception as e:
        raise HTTPException(status_code=400, detail="Invalid login credentials")