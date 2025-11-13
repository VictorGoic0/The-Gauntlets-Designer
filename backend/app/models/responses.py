"""Response models for API endpoints."""
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class ChatResponse(BaseModel):
    """Response model for successful chat endpoint."""
    
    response: str = Field(..., description="Assistant's text response")
    actions: List[Dict[str, Any]] = Field(default_factory=list, description="List of actions to execute on canvas")
    toolCalls: int = Field(0, description="Number of tool calls made")
    tokensUsed: int = Field(0, description="Total tokens consumed")
    model: str = Field(..., description="Model used for the request")
    
    class Config:
        """Pydantic config."""
        json_schema_extra = {
            "example": {
                "response": "I've created a login form with email and password fields.",
                "actions": [
                    {
                        "type": "rectangle",
                        "params": {
                            "x": 100,
                            "y": 100,
                            "width": 300,
                            "height": 200,
                            "fill": "#FFFFFF",
                            "cornerRadius": 8
                        }
                    }
                ],
                "toolCalls": 8,
                "tokensUsed": 1250,
                "model": "gpt-4-turbo"
            }
        }


class ErrorResponse(BaseModel):
    """Error response model for API endpoints."""
    
    error: str = Field(..., description="Error message")
    detail: Optional[str] = Field(None, description="Additional error details")
    
    class Config:
        """Pydantic config."""
        json_schema_extra = {
            "example": {
                "error": "Validation error",
                "detail": "sessionId is required and cannot be empty"
            }
        }

