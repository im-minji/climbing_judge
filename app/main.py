from fastapi import FastAPI

# 1️⃣ FastAPI 앱 생성
app = FastAPI(
    title="Climbing Judge Portal",
    description="심판 등록 및 대회 관리용 최소 FastAPI 서버",
    version="0.1.0"
)

# 2️⃣ 기본 테스트 라우트
@app.get("/")
def root():
    """
    루트 URL 테스트용
    GET 요청 시 {"message": "Server is running"} 반환
    """
    return {"message": "Server is running"}

# 확장용: 추후 기능 라우트 추가
# 예시:
# from app import users, competitions
# app.include_router(users.router)
# app.include_router(competitions.router)
