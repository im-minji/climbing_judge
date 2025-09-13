import os
from supabase import create_client, Client

url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")

# --- [디버깅 코드] ---
# 앱이 시작될 때, 사용 중인 키의 앞 10자리와 길이를 로그에 출력합니다.
if key:
    print(f"--- SERVER IS USING KEY: STARTS WITH {key[:10]}..., LENGTH {len(key)} ---")
else:
    print("--- ERROR: SUPABASE_KEY NOT FOUND ---")
# --- [디버깅 코드 끝] ---


supabase: Client = create_client(url, key)
