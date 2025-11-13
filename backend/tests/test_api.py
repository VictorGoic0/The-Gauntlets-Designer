"""Tests for API endpoints."""
import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, AsyncMock

from app.main import app
from app.agent.orchestrator import CanvasAgent


@pytest.fixture
def client():
    """Create test client."""
    return TestClient(app)


@pytest.fixture
def mock_agent_response():
    """Mock agent response."""
    return {
        "response": "I've created a login form for you.",
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


class TestHealthEndpoint:
    """Test health check endpoint."""
    
    def test_health_endpoint(self, client):
        """Test that health endpoint returns 200."""
        response = client.get("/api/health")
        assert response.status_code == 200
        data = response.json()
        assert "status" in data
        assert data["status"] == "healthy"


class TestAgentChatEndpoint:
    """Test agent chat endpoint."""
    
    @pytest.mark.asyncio
    async def test_chat_endpoint_success(self, client, mock_agent_response):
        """Test successful chat request."""
        with patch.object(CanvasAgent, 'process_message', new_callable=AsyncMock) as mock_process:
            mock_process.return_value = mock_agent_response
            
            response = client.post(
                "/api/agent/chat",
                json={
                    "message": "Create a login form"
                }
            )
            
            assert response.status_code == 200
            data = response.json()
            assert "response" in data
            assert "actions" in data
            assert "toolCalls" in data
            assert data["toolCalls"] == 8
    
    def test_chat_endpoint_missing_message(self, client):
        """Test chat endpoint with missing message."""
        response = client.post(
            "/api/agent/chat",
            json={}
        )
        
        assert response.status_code == 422  # Validation error
    
    def test_chat_endpoint_empty_message(self, client):
        """Test chat endpoint with empty message."""
        response = client.post(
            "/api/agent/chat",
            json={
                "message": ""
            }
        )
        
        assert response.status_code == 400
    
    def test_chat_endpoint_invalid_model(self, client):
        """Test chat endpoint with invalid model."""
        response = client.post(
            "/api/agent/chat",
            json={
                "message": "Create a button",
                "model": "invalid-model"
            }
        )
        
        assert response.status_code == 400
    
    @pytest.mark.asyncio
    async def test_chat_endpoint_valid_model_override(self, client, mock_agent_response):
        """Test chat endpoint with valid model override."""
        with patch.object(CanvasAgent, 'process_message', new_callable=AsyncMock) as mock_process:
            mock_process.return_value = mock_agent_response
            
            response = client.post(
                "/api/agent/chat",
                json={
                    "message": "Create a button",
                    "model": "gpt-4o"
                }
            )
            
            assert response.status_code == 200
            # Verify model was passed to agent
            mock_process.assert_called_once()
            call_args = mock_process.call_args
            assert call_args.kwargs.get("model") == "gpt-4o"
    
    @pytest.mark.asyncio
    async def test_chat_endpoint_agent_error(self, client):
        """Test chat endpoint when agent returns error."""
        error_response = {
            "response": "Error occurred",
            "actions": [],
            "toolCalls": 0,
            "tokensUsed": 0,
            "model": "gpt-4-turbo",
            "error": {
                "type": "APIError",
                "message": "OpenAI API error"
            }
        }
        
        with patch.object(CanvasAgent, 'process_message', new_callable=AsyncMock) as mock_process:
            mock_process.return_value = error_response
            
            response = client.post(
                "/api/agent/chat",
                json={
                    "message": "Create something"
                }
            )
            
            assert response.status_code == 500
            data = response.json()
            assert "detail" in data
    
    @pytest.mark.asyncio
    async def test_chat_endpoint_unexpected_error(self, client):
        """Test chat endpoint with unexpected error."""
        with patch.object(CanvasAgent, 'process_message', side_effect=Exception("Unexpected error")):
            response = client.post(
                "/api/agent/chat",
                json={
                    "message": "Create something"
                }
            )
            
            assert response.status_code == 500

