from fastapi import APIRouter
from fastapi import Depends

from app.api_key_auth import get_api_key_user
from app.models import User


router = APIRouter(
    prefix="/api/v1",
    tags=["Developer API"],
)


@router.get("/me")
async def get_api_user(
    current_user: User = Depends(
        get_api_key_user
    ),
):
    """
    Test endpoint for API-key authentication.
    """

    return {
        "message": "API key authentication successful.",
        "user": {
            "id": current_user.id,
            "name": current_user.name,
            "email": current_user.email,
        },
    }