from pydantic import BaseModel, EmailStr, field_validator
from datetime import datetime


class UserBase(BaseModel):
    email: EmailStr

    @field_validator("email", mode="before")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        """Normalize email to lowercase and strip whitespace."""
        return v.strip().lower()


class UserCreate(UserBase):
    password: str

    @field_validator("password")
    @classmethod
    def validate_password_strength(cls, v: str) -> str:
        """Enforce minimum password strength: 8+ chars, at least one letter and one digit."""
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long")
        has_letter = any(c.isalpha() for c in v)
        has_digit = any(c.isdigit() for c in v)
        if not has_letter or not has_digit:
            raise ValueError("Password must contain at least one letter and one digit")
        return v


class UserLogin(UserBase):
    password: str


class UserResponse(UserBase):
    id: str
    created_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TokenRefresh(BaseModel):
    refresh_token: str
