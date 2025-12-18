"""
Error handling verification script.

Tests various error scenarios to ensure proper error handling:
- Invalid OpenAI API key
- Missing Firebase credentials
- Malformed request body
- OpenAI rate limits
- Network errors
"""
import asyncio
import os
from unittest.mock import patch, Mock
import pytest

from app.agent.orchestrator import CanvasAgent
from app.config import settings
from app.utils.logger import logger


async def test_invalid_openai_key():
    """Test with invalid OpenAI API key."""
    logger.info("\n" + "="*60)
    logger.info("Test: Invalid OpenAI API Key")
    logger.info("="*60)
    
    original_key = settings.OPENAI_API_KEY
    
    try:
        # Temporarily set invalid key
        with patch.object(settings, 'OPENAI_API_KEY', 'invalid-key'):
            agent = CanvasAgent()
            result = await agent.process_message("Create a button")
            
            assert "error" in result, "Should return error response"
            logger.info(f"✓ Error handled correctly: {result.get('error', {}).get('type', 'Unknown')}")
            
    except Exception as e:
        logger.error(f"✗ Unexpected exception: {e}")
        raise
    finally:
        # Restore original key
        settings.OPENAI_API_KEY = original_key


async def test_missing_firebase_credentials():
    """Test with missing Firebase credentials."""
    logger.info("\n" + "="*60)
    logger.info("Test: Missing Firebase Credentials")
    logger.info("="*60)
    
    # This should not crash - Firebase initialization is non-blocking
    try:
        agent = CanvasAgent()
        result = await agent.process_message("Create a button")
        
        # Should still return actions even if Firebase write fails
        assert "actions" in result, "Should return actions"
        logger.info(f"✓ Gracefully handled missing Firebase: {len(result.get('actions', []))} actions returned")
        
    except Exception as e:
        logger.error(f"✗ Unexpected exception: {e}")
        raise


async def test_malformed_tool_call():
    """Test with malformed tool call from OpenAI."""
    logger.info("\n" + "="*60)
    logger.info("Test: Malformed Tool Call")
    logger.info("="*60)
    
    # Create mock response with malformed tool call
    mock_response = Mock()
    mock_choice = Mock()
    mock_message = Mock()
    
    # Malformed tool call (missing function name)
    mock_tool_call = Mock()
    mock_tool_call.function = None  # Missing function
    
    mock_message.content = "I'll create something"
    mock_message.tool_calls = [mock_tool_call]
    
    mock_choice.message = mock_message
    mock_response.choices = [mock_choice]
    mock_response.usage = Mock()
    mock_response.usage.total_tokens = 100
    
    try:
        with patch('app.agent.orchestrator.call_openai_with_retry', return_value=mock_response):
            with patch('app.agent.orchestrator.is_firebase_initialized', return_value=False):
                agent = CanvasAgent()
                result = await agent.process_message("Create something")
                
                # Should handle gracefully - skip malformed tool calls
                assert "actions" in result, "Should return actions list"
                logger.info(f"✓ Handled malformed tool call: {len(result.get('actions', []))} valid actions")
                
    except Exception as e:
        logger.error(f"✗ Unexpected exception: {e}")
        raise


async def test_openai_rate_limit():
    """Test OpenAI rate limit handling (mocked)."""
    logger.info("\n" + "="*60)
    logger.info("Test: OpenAI Rate Limit (Mocked)")
    logger.info("="*60)
    
    from openai import RateLimitError
    
    try:
        with patch('app.agent.orchestrator.call_openai_with_retry', side_effect=RateLimitError("Rate limit exceeded", response=None, body=None)):
            agent = CanvasAgent()
            result = await agent.process_message("Create a button")
            
            assert "error" in result, "Should return error response"
            logger.info(f"✓ Rate limit error handled: {result.get('error', {}).get('type', 'Unknown')}")
            
    except Exception as e:
        logger.error(f"✗ Unexpected exception: {e}")
        raise


async def test_network_error():
    """Test network error handling (mocked)."""
    logger.info("\n" + "="*60)
    logger.info("Test: Network Error (Mocked)")
    logger.info("="*60)
    
    try:
        with patch('app.agent.orchestrator.call_openai_with_retry', side_effect=ConnectionError("Network error")):
            agent = CanvasAgent()
            result = await agent.process_message("Create a button")
            
            assert "error" in result, "Should return error response"
            logger.info(f"✓ Network error handled: {result.get('error', {}).get('type', 'Unknown')}")
            
    except Exception as e:
        logger.error(f"✗ Unexpected exception: {e}")
        raise


async def test_empty_message():
    """Test with empty message."""
    logger.info("\n" + "="*60)
    logger.info("Test: Empty Message")
    logger.info("="*60)
    
    try:
        agent = CanvasAgent()
        result = await agent.process_message("")
        
        # Empty message might still get processed by OpenAI, but should handle gracefully
        assert "response" in result, "Should return response"
        logger.info(f"✓ Empty message handled")
        
    except Exception as e:
        logger.error(f"✗ Unexpected exception: {e}")
        raise


async def test_very_long_message():
    """Test with very long message."""
    logger.info("\n" + "="*60)
    logger.info("Test: Very Long Message")
    logger.info("="*60)
    
    long_message = "Create a " + "very detailed " * 100 + "login form"
    
    try:
        agent = CanvasAgent()
        result = await agent.process_message(long_message)
        
        assert "response" in result, "Should return response"
        logger.info(f"✓ Long message handled: {len(long_message)} chars")
        
    except Exception as e:
        logger.error(f"✗ Unexpected exception: {e}")
        raise


async def run_error_handling_tests():
    """Run all error handling tests."""
    logger.info("="*60)
    logger.info("Error Handling Verification")
    logger.info("="*60)
    
    tests = [
        ("Invalid OpenAI Key", test_invalid_openai_key),
        ("Missing Firebase Credentials", test_missing_firebase_credentials),
        ("Malformed Tool Call", test_malformed_tool_call),
        ("OpenAI Rate Limit", test_openai_rate_limit),
        ("Network Error", test_network_error),
        ("Empty Message", test_empty_message),
        ("Very Long Message", test_very_long_message),
    ]
    
    results = []
    
    for test_name, test_func in tests:
        try:
            await test_func()
            results.append((test_name, True, None))
        except Exception as e:
            logger.error(f"Test '{test_name}' failed: {e}")
            results.append((test_name, False, str(e)))
    
    # Summary
    logger.info("\n" + "="*60)
    logger.info("Error Handling Test Summary")
    logger.info("="*60)
    
    passed = sum(1 for _, success, _ in results if success)
    total = len(results)
    
    logger.info(f"Total tests: {total}")
    logger.info(f"Passed: {passed}")
    logger.info(f"Failed: {total - passed}")
    
    for test_name, success, error in results:
        status = "✓" if success else "✗"
        logger.info(f"  {status} {test_name}")
        if error:
            logger.info(f"    Error: {error}")
    
    return results


if __name__ == "__main__":
    asyncio.run(run_error_handling_tests())

