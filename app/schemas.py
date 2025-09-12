from pydantic import BaseModel
import datetime

class JudgeCreate(BaseModel): 
	judge_number: str
	name: str
	affiliation: str
	national_license_grade: int

class CompetitionCreate(BaseModel):
		name: str
		start_date: datetime.date
		end_date: datetime.date
		location: str
