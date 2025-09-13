# app/main.py
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from app.routers import judges, competitions, auth

app = FastAPI()

app.mount("static/", StaticFiles(directory="static", name="static"))

# 기본 "/" 경로
@app.get("/")
def read_root():
    return {"message": "Server is running"}

# judges.py에 있는 모든 API 경로들을 앱에 포함
app.include_router(judges.router)
app.include_router(competitions.router)
app.include_router(auth.router, prefix="/auth")