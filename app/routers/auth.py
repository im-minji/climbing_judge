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
    

    # --- [새로운 디버깅용 API 추가] ---
@router.get("/check-admin")
def check_admin_privileges():
    """
    서버의 Supabase 클라이언트가 관리자 권한을 가졌는지 테스트합니다.
    """
    try:
        # 관리자만 가능한 '모든 사용자 목록 조회'를 시도합니다.
        response = supabase.auth.admin.list_users()
        return {
            "status": "SUCCESS", 
            "message": "Server has admin privileges.", 
            "user_count": len(response.users)
        }
    except Exception as e:
        # 실패 시, 에러 내용을 그대로 반환합니다.
        raise HTTPException(
            status_code=403, 
            detail=f"Server does NOT have admin privileges. Error: {e}"
        )