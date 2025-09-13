# app/main.py
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from app.routers import judges, competitions, auth, users

app = FastAPI()

app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/")
async def read_index():
    return FileResponse("static/index.html")

# 라우터들을 메인 앱에 포함
app.include_router(judges.router)
app.include_router(competitions.router)
app.include_router(auth.router, prefix="/auth")
app.include_router(users.router, prefix="/users")