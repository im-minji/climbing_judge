from fastapi import APIRouter, HTTPException
from app.db import supabase
from app.schemas import JudgeCreate

router = APIRouter()

@router.get("/judges")
def get_judges():
	response = supabase.from_("judges").select("*").execute()
	return response.data

@router.post("/judges")
def create_judge(judge: JudgeCreate):
    """
    Supabase Auth에 사용자를 먼저 생성하고,
    그 user id를 이용해 public.judges 테이블에 프로필 정보를 저장합니다.
    """
    try:
        # 1. 전달받은 실제 이메일로 Supabase Authentication에 사용자 생성
        auth_response = supabase.auth.admin.create_user({
            "email": judge.email,
            "password": judge.password,
            "email_confirm": True, # 바로 사용 가능하도록 설정
        })
        new_user = auth_response.user
        
        # 2. user id와 나머지 정보를 합쳐 judges 테이블에 프로필 정보 저장
        profile_data = {
            "id": new_user.id, # Auth user의 id와 public.judges의 id를 일치시킴
            "judge_number": judge.judge_number,
            "name": judge.name,
            "affiliation": judge.affiliation,
            "national_license_grade": judge.national_license_grade,
            "email": judge.email, # 실제 이메일도 함께 저장
            "role": judge.role
        }
        
        response = supabase.from_("judges").insert(profile_data).execute()
        
        return response.data

    except Exception as e:
        # 이메일 중복 등 에러 처리
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/judges/{judge_id}")
def get_judge_by_id(judge_id: str):
    # .eq('컬럼명', '값')는 SQL의 WHERE 절과 같이 특정 조건에 맞는 데이터만 필터링합니다.
    response = supabase.from_("judges").select("*").eq("id", judge_id).execute()
    
    # 데이터가 없을 경우를 대비한 처리
    if not response.data:
        return {"message": "Judge not found"}
    return response.data[0]
