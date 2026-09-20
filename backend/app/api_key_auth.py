import hashlib

from fastapi import Depends
from fastapi import HTTPException
from fastapi import status

from fastapi.security import HTTPAuthorizationCredentials
from fastapi.security import HTTPBearer

from sqlalchemy.orm import Session

from app.database import get_db
from app.models import APIKey
from app.models import User


security = HTTPBearer()


def hash_api_key(api_key: str) -> str:
    """
    Hash an API key using SHA-256.
    """

    return hashlib.sha256(
        api_key.encode("utf-8")
    ).hexdigest()


def get_api_key_user(
    credentials: HTTPAuthorizationCredentials = Depends(
        security
    ),
    db: Session = Depends(get_db),
) -> User:
    """
    Authenticate a user using an nx_live API key.

    Expected header:

    Authorization: Bearer nx_live_...
    """

    api_key = credentials.credentials

    if not api_key.startswith("nx_live_"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid API key.",
        )

    key_hash = hash_api_key(api_key)

    stored_key = (
        db.query(APIKey)
        .filter(
            APIKey.key_hash == key_hash,
        )
        .first()
    )

    if stored_key is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid API key.",
        )

    if stored_key.revoked_at is not None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="API key has been revoked.",
        )

    user = (
        db.query(User)
        .filter(
            User.id == stored_key.user_id,
        )
        .first()
    )

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="API key owner not found.",
        )

    return user