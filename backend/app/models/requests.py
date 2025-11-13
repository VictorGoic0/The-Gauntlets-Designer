"""Request models for API endpoints."""
from typing import Optional
from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    """Request model for chat endpoint."""
    
    message: str = Field(..., description="User's natural language request")
    model: Optional[str] = Field(None, description="Optional model override (e.g., 'gpt-4-turbo', 'gpt-4o')")
    
    class Config:
        """Pydantic config."""
        json_schema_extra = {
            "example": {
                "message": "Create a login form",
                "model": "gpt-4-turbo"
            }
        }

