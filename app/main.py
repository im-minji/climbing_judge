import os
from fastapi import FastAPI
from supabase import create_client, Client # supabase 라이브러리 import

# Render에서 설정한 환경 변수를 불러옵니다.
url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")

# Supabase 클라이언트를 생성합니다. 이 클라이언트를 통해 데이터베이스와 통신합니다.
supabase: Client = create_client(url, key)

app = FastAPI()


@app.get("/")
def read_root():
    return {"message": "Server is running"}

# --- 데이터베이스 연결 테스트를 위한 코드 추가 ---
@app.get("/judges")
def get_judges():
    """
    judges 테이블에서 모든 데이터를 조회하는 테스트 API
    """
    # .from_("테이블이름").select("*").execute() 가 기본 조회 구문입니다.
    response = supabase.from_("judges").select("*").execute()
    
    # 데이터는 response 객체의 'data' 속성에 담겨 있습니다.
    return response.data
