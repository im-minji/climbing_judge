from fastapi import APIRouter, Depends, HTTPException, Request
from supabase import Client
from app.db import get_supabase_client

router = APIRouter()

async def get_current_user_with_profile(request: Request, db: Client = Depends(get_supabase_client)):
    auth_header = request.headers.get("Authorization")
    if not auth_header:
        raise HTTPException(status_code=401, detail="Authorization header missing")
    token = auth_header.split(" ")[1]
    
    try:
        user_response = db.auth.get_user(token)
        user = user_response.user
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

    profile_response = db.from_("judges").select("*").eq("id", user.id).single().execute()
    if not profile_response.data:
        raise HTTPException(status_code=404, detail="Profile not found for authenticated user")
    
    return profile_response.data

async def get_current_admin_user(current_user: dict = Depends(get_current_user_with_profile)):
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin privileges required")
    return current_user

@router.get("/me")
def get_my_profile(current_user: dict = Depends(get_current_user_with_profile)):
    return current_user