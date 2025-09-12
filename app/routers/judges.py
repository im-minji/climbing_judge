from fastapi import APIRouter
from app.db import supabase
from app.schemas import JudgeCreate

router = APIRouter()

@router.get("/judges")
def get_judges():
	response = supabase.from_("judges").select("*").execute()
	return response.data

@router.post("/judges")
def create_judge(judge: JudgeCreate):
	judge_data = judge.model_dump()
	response = supabase.from_("judges").insert(judge_data).execute()
	return response.data

# --- 아래 함수를 새로 추가 ---
@router.get("/judges/{judge_id}")
def get_judge_by_id(judge_id: str):
    # .eq('컬럼명', '값')는 SQL의 WHERE 절과 같이 특정 조건에 맞는 데이터만 필터링합니다.
    response = supabase.from_("judges").select("*").eq("id", judge_id).execute()
    
    # 데이터가 없을 경우를 대비한 처리
    if not response.data:
        return {"message": "Judge not found"}
    return response.data[0]
