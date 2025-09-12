from pydantic import BaseModel

class JudgeCreate(BaseModel): 
	judge_number: str
	name: str
	affiliation: str
	national_license_grade: int
