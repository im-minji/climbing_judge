# app/main.py
from fastapi import FastAPI
from app.routers import judges, competitions

app = FastAPI()

# 기본 "/" 경로
@app.get("/")
def read_root():
    return {"message": "Server is running"}

# judges.py에 있는 모든 API 경로들을 앱에 포함
app.include_router(judges.router)
app.include_router(competitions.router)