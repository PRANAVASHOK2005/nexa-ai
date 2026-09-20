import hashlib
import secrets

from datetime import datetime

from fastapi import APIRouter
from fastapi import Depends
from fastapi import HTTPException
from fastapi import status

from pydantic import BaseModel
from pydantic import Field

from sqlalchemy.orm import Session

from app.database import get_db
from app.models import APIKey
from app.models import User
from app.routes.auth import get_current_user


router = APIRouter(
    prefix="/api/api-keys",
    tags=["API Keys"],
)


# --------------------------------------------------
# Schemas
# --------------------------------------------------

class CreateAPIKeyRequest(BaseModel):
    name: str = Field(
        min_length=1,
        max_length=100,
    )


class APIKeyResponse(BaseModel):
    id: int
    name: str
    key_prefix: str
    created_at: datetime
    revoked_at: datetime | None


class CreateAPIKeyResponse(BaseModel):
    message: str
    api_key: APIKeyResponse
    key: str


# --------------------------------------------------
# Helpers
# --------------------------------------------------

def generate_api_key() -> str:
    """
    Generate a cryptographically secure API key.
    """

    random_part = secrets.token_urlsafe(32)

    return f"nx_live_{random_part}"


def hash_api_key(api_key: str) -> str:
    """
    Hash the API key before storing it.
    """

    return hashlib.sha256(
        api_key.encode("utf-8")
    ).hexdigest()


# --------------------------------------------------
# Create API key
# --------------------------------------------------

@router.post(
    "/",
    response_model=CreateAPIKeyResponse,
)
async def create_api_key(
    request: CreateAPIKeyRequest,
    current_user: User = Depends(
        get_current_user
    ),
    db: Session = Depends(get_db),
):
    name = request.name.strip()

    if not name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="API key name is required.",
        )

    # Generate secure secret
    api_key = generate_api_key()

    # Store only the hash
    key_hash = hash_api_key(api_key)

    # Show only a short identifier in the dashboard
    key_prefix = api_key[:16]

    new_api_key = APIKey(
        user_id=current_user.id,
        name=name,
        key_prefix=key_prefix,
        key_hash=key_hash,
    )

    db.add(new_api_key)
    db.commit()
    db.refresh(new_api_key)

    return {
        "message": "API key created successfully.",
        "api_key": {
            "id": new_api_key.id,
            "name": new_api_key.name,
            "key_prefix": new_api_key.key_prefix,
            "created_at": new_api_key.created_at,
            "revoked_at": new_api_key.revoked_at,
        },
        "key": api_key,
    }


# --------------------------------------------------
# List API keys
# --------------------------------------------------

@router.get(
    "/",
    response_model=list[APIKeyResponse],
)
async def list_api_keys(
    current_user: User = Depends(
        get_current_user
    ),
    db: Session = Depends(get_db),
):
    api_keys = (
        db.query(APIKey)
        .filter(
            APIKey.user_id == current_user.id
        )
        .order_by(
            APIKey.created_at.desc()
        )
        .all()
    )

    return [
        {
            "id": api_key.id,
            "name": api_key.name,
            "key_prefix": api_key.key_prefix,
            "created_at": api_key.created_at,
            "revoked_at": api_key.revoked_at,
        }
        for api_key in api_keys
    ]


# --------------------------------------------------
# Revoke API key
# --------------------------------------------------

@router.delete(
    "/{api_key_id}",
)
async def revoke_api_key(
    api_key_id: int,
    current_user: User = Depends(
        get_current_user
    ),
    db: Session = Depends(get_db),
):
    api_key = (
        db.query(APIKey)
        .filter(
            APIKey.id == api_key_id,
            APIKey.user_id == current_user.id,
        )
        .first()
    )

    if api_key is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="API key not found.",
        )

    if api_key.revoked_at is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="API key is already revoked.",
        )

    api_key.revoked_at = datetime.utcnow()

    db.commit()

    return {
        "message": "API key revoked successfully.",
        "id": api_key.id,
    }
    