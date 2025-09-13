from pydantic import BaseModel, Field
import datetime

class JudgeCreate(BaseModel): 
	judge_number: str
	name: str
	affiliation: str
	national_license_grade: int
	email: str
	password: str
	role: str = Field(default='judge')

class CompetitionCreate(BaseModel):
	name: str
	start_date: datetime.date
	end_date: datetime.date
	location: str

class JudgeAssignmentCreate(BaseModel):
	judge_id: str

class LoginRequest(BaseModel):
	judge_number: str
	password: str