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
