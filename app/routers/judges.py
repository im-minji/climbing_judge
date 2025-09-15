from fastapi import APIRouter, HTTPException
from app.db import supabase
from app.schemas import JudgeCreate, JudgeUpdate

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

@router.patch("/judges/{judge_id}")
def update_judge(judge_id: str, judge_update: JudgeUpdate):
     # 사용자가 보낸 데이터만 필터링하여 update_data를 만들기
    update_data = judge_update.model_dump(exclude_unset=True)

    if not update_data:
        raise HTTPException(status_code=400, detail="No update data provided")

    response = supabase.from_("judges").update(update_data).eq("id", judge_id).execute()
    
    if not response.data:
        raise HTTPException(status_code=404, detail="Judge not found")

    return response.data

@router.delete("/judges/{judge_id}")
def delete_judge_by_id(judge_id: str):
    try:
        # 1. Supabase 인증 시스템에서 사용자를 삭제합니다.
        #    이 작업은 관리자 권한(service_role key)이 반드시 필요합니다.
        supabase.auth.admin.delete_user(judge_id)
        
        # 2. judges 테이블의 데이터는 foreign key 관계(ON DELETE CASCADE)에 의해 자동으로 삭제됩니다.
        
        return {"message": f"Judge with id {judge_id} deleted successfully."}
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Judge not found or failed to delete: {e}")