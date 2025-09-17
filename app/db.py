# app/db.py

import os
from supabase import create_client, Client
from fastapi import Request

def get_supabase_client(request: Request) -> Client:
    """
    각 API 요청마다 새로운 Supabase 클라이언트를 생성하는 의존성 함수.
    서버 환경 변수에서 URL과 KEY를 가져옵니다.
    """
    url: str = os.environ.get("SUPABASE_URL")
    key: str = os.environ.get("SUPABASE_KEY")

    # --- [디버깅 코드] ---
    # API가 호출될 때마다, 사용 중인 키의 정보를 로그에 출력합니다.
    # 문제가 모두 해결되면 이 print 문은 삭제해도 좋습니다.
    if key:
        print(f"--- API Call using Key: STARTS WITH {key[:10]}..., LENGTH {len(key)} ---")
    else:
        print("--- ERROR: SUPABASE_KEY NOT FOUND in environment! ---")
    # --- [디버깅 코드 끝] ---

    return create_client(url, key)