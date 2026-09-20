import os
from datetime import datetime
from datetime import timedelta
from datetime import timezone

from fastapi import APIRouter
from fastapi import Depends
from fastapi import HTTPException
from fastapi import status

from fastapi.security import OAuth2PasswordBearer

from jose import JWTError
from jose import jwt

from passlib.context import CryptContext

from pydantic import BaseModel
from pydantic import EmailStr

from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User


router = APIRouter(
    prefix="/api/auth",
    tags=["Authentication"],
)


# ============================================================
# JWT CONFIGURATION
# ============================================================

SECRET_KEY = os.getenv("SECRET_KEY")

if not SECRET_KEY:
    raise RuntimeError("SECRET_KEY is not configured.")

ALGORITHM = "HS256"

ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24


# ============================================================
# PASSWORD HASHING
# ============================================================

pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto",
)


# ============================================================
# OAUTH2 BEARER
# ============================================================

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/api/auth/login",
)


# ============================================================
# REQUEST / RESPONSE MODELS
# ============================================================

class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    created_at: datetime


class AuthResponse(BaseModel):
    message: str
    user: UserResponse
    access_token: str


# ============================================================
# PASSWORD FUNCTIONS
# ============================================================

def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(
    plain_password: str,
    hashed_password: str,
) -> bool:

    return pwd_context.verify(
        plain_password,
        hashed_password,
    )


# ============================================================
# JWT FUNCTIONS
# ============================================================

def create_access_token(
    user_id: int,
) -> str:

    expire = datetime.now(
        timezone.utc
    ) + timedelta(
        minutes=ACCESS_TOKEN_EXPIRE_MINUTES
    )

    payload = {
        "sub": str(user_id),
        "exp": expire,
    }

    return jwt.encode(
        payload,
        SECRET_KEY,
        algorithm=ALGORITHM,
    )


# ============================================================
# GET CURRENT USER
# ============================================================

def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials.",
        headers={
            "WWW-Authenticate": "Bearer",
        },
    )

    try:

        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM],
        )

        user_id = payload.get("sub")

        if user_id is None:
            raise credentials_exception

        user_id = int(user_id)

    except (
        JWTError,
        ValueError,
    ):

        raise credentials_exception

    user = db.query(User).filter(
        User.id == user_id
    ).first()

    if user is None:
        raise credentials_exception

    return user


# ============================================================
# REGISTER
# ============================================================

@router.post(
    "/register",
    response_model=AuthResponse,
)
async def register(
    request: RegisterRequest,
    db: Session = Depends(get_db),
):

    name = request.name.strip()

    email = request.email.lower().strip()

    password = request.password

    if not name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Name is required.",
        )

    if len(password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must contain at least 8 characters.",
        )

    existing_user = db.query(User).filter(
        User.email == email
    ).first()

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists.",
        )

    password_hash = hash_password(
        password
    )

    user = User(
        name=name,
        email=email,
        password_hash=password_hash,
    )

    db.add(user)

    db.commit()

    db.refresh(user)

    access_token = create_access_token(
        user.id
    )

    return {
        "message": "Account created successfully.",
        "user": user,
        "access_token": access_token,
    }


# ============================================================
# LOGIN
# ============================================================

@router.post(
    "/login",
    response_model=AuthResponse,
)
async def login(
    request: LoginRequest,
    db: Session = Depends(get_db),
):

    email = request.email.lower().strip()

    user = db.query(User).filter(
        User.email == email
    ).first()

    if not user:

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    if not verify_password(
        request.password,
        user.password_hash,
    ):

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    access_token = create_access_token(
        user.id
    )

    return {
        "message": "Login successful.",
        "user": user,
        "access_token": access_token,
    }


# ============================================================
# CURRENT USER
# ============================================================

@router.get(
    "/me",
    response_model=UserResponse,
)
async def me(
    current_user: User = Depends(
        get_current_user
    ),
):

    return current_user
