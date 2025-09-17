from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from supabase import Client
from app.db import get_supabase_client
from app.schemas import LoginRequest

router = APIRouter()

@router.post("/token")
def login(request: LoginRequest, db: Client = Depends(get_supabase_client)):
    try:
        profile_res = db.from_("judges").select("email").eq("judge_number", request.judge_number).single().execute()
        
        if not profile_res.data:
            raise HTTPException(status_code=404, detail="Judge number not found")
        
        user_email = profile_res.data['email']
        
        auth_res = db.auth.sign_in_with_password({
            "email": user_email,
            "password": request.password
        })
        
        return auth_res.session
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid login credentials: {e}")

@router.get("/check-admin")
def check_admin_privileges(db: Client = Depends(get_supabase_client)):
    try:
        user_list = db.auth.admin.list_users()
        return {
            "status": "SUCCESS", 
            "message": "Server has admin privileges.", 
            "user_count": len(user_list.users if hasattr(user_list, 'users') else user_list)
        }
    except Exception as e:
        raise HTTPException(
            status_code=403, 
            detail=f"Server does NOT have admin privileges. Error: {e}"
        )