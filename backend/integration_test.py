"""
Integration test script for complete flow: API request → agent → Firestore.

This script tests the complete integration flow with real API calls.
Requires:
- Server running (or will start one)
- OpenAI API key configured
- Firebase credentials (optional - will skip Firestore writes if not configured)
"""
import asyncio
import time
import json
from typing import Dict, Any, List
import httpx

from app.agent.orchestrator import CanvasAgent
from app.config import settings
from app.utils.logger import logger


# Test cases
TEST_CASES = [
    {
        "name": "Login Form",
        "message": "Create a login form",
        "expected_min_tool_calls": 8,
        "expected_max_tool_calls": 12
    },
    {
        "name": "Button",
        "message": "Create a button",
        "expected_min_tool_calls": 2,
        "expected_max_tool_calls": 4
    },
    {
        "name": "3x3 Grid of Circles",
        "message": "Create a 3x3 grid of circles",
        "expected_min_tool_calls": 9,
        "expected_max_tool_calls": 9
    },
    {
        "name": "Card with Title and Text",
        "message": "Create a card with a title and some text",
        "expected_min_tool_calls": 4,
        "expected_max_tool_calls": 6
    }
]


async def test_agent_directly(test_case: Dict[str, Any]) -> Dict[str, Any]:
    """Test agent directly (without API)."""
    logger.info(f"\n{'='*60}")
    logger.info(f"Testing: {test_case['name']}")
    logger.info(f"Message: {test_case['message']}")
    logger.info(f"{'='*60}")
    
    start_time = time.time()
    
    try:
        agent = CanvasAgent()
        result = await agent.process_message(
            user_message=test_case["message"],
            model=None  # Use default
        )
        
        elapsed_time = time.time() - start_time
        
        # Validate results
        tool_calls = result.get("toolCalls", 0)
        tokens_used = result.get("tokensUsed", 0)
        actions = result.get("actions", [])
        
        logger.info(f"✓ Success")
        logger.info(f"  Tool calls: {tool_calls}")
        logger.info(f"  Actions: {len(actions)}")
        logger.info(f"  Tokens used: {tokens_used}")
        logger.info(f"  Response time: {elapsed_time:.2f}s")
        logger.info(f"  Model: {result.get('model', 'unknown')}")
        
        # Check if tool calls are within expected range
        if tool_calls < test_case["expected_min_tool_calls"]:
            logger.warning(
                f"  ⚠ Tool calls ({tool_calls}) below expected minimum "
                f"({test_case['expected_min_tool_calls']})"
            )
        elif tool_calls > test_case["expected_max_tool_calls"]:
            logger.warning(
                f"  ⚠ Tool calls ({tool_calls}) above expected maximum "
                f"({test_case['expected_max_tool_calls']})"
            )
        else:
            logger.info(f"  ✓ Tool calls within expected range")
        
        # Log first few actions for inspection
        if actions:
            logger.info(f"  First action: {json.dumps(actions[0], indent=2)}")
        
        return {
            "success": True,
            "test_name": test_case["name"],
            "tool_calls": tool_calls,
            "actions_count": len(actions),
            "tokens_used": tokens_used,
            "response_time": elapsed_time,
            "model": result.get("model"),
            "error": None
        }
        
    except Exception as e:
        elapsed_time = time.time() - start_time
        logger.error(f"✗ Failed: {e}")
        logger.error(f"  Response time: {elapsed_time:.2f}s")
        
        return {
            "success": False,
            "test_name": test_case["name"],
            "tool_calls": 0,
            "actions_count": 0,
            "tokens_used": 0,
            "response_time": elapsed_time,
            "model": None,
            "error": str(e)
        }


async def test_api_endpoint(
    base_url: str,
    test_case: Dict[str, Any]
) -> Dict[str, Any]:
    """Test API endpoint (requires server to be running)."""
    logger.info(f"\n{'='*60}")
    logger.info(f"Testing API: {test_case['name']}")
    logger.info(f"Message: {test_case['message']}")
    logger.info(f"{'='*60}")
    
    start_time = time.time()
    
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                f"{base_url}/api/agent/chat",
                json={
                    "message": test_case["message"]
                }
            )
            
            elapsed_time = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                tool_calls = data.get("toolCalls", 0)
                tokens_used = data.get("tokensUsed", 0)
                actions = data.get("actions", [])
                
                logger.info(f"✓ Success (HTTP {response.status_code})")
                logger.info(f"  Tool calls: {tool_calls}")
                logger.info(f"  Actions: {len(actions)}")
                logger.info(f"  Tokens used: {tokens_used}")
                logger.info(f"  Response time: {elapsed_time:.2f}s")
                logger.info(f"  Model: {data.get('model', 'unknown')}")
                
                return {
                    "success": True,
                    "test_name": test_case["name"],
                    "tool_calls": tool_calls,
                    "actions_count": len(actions),
                    "tokens_used": tokens_used,
                    "response_time": elapsed_time,
                    "model": data.get("model"),
                    "error": None
                }
            else:
                logger.error(f"✗ Failed (HTTP {response.status_code})")
                logger.error(f"  Response: {response.text}")
                
                return {
                    "success": False,
                    "test_name": test_case["name"],
                    "tool_calls": 0,
                    "actions_count": 0,
                    "tokens_used": 0,
                    "response_time": elapsed_time,
                    "model": None,
                    "error": f"HTTP {response.status_code}: {response.text}"
                }
                
    except Exception as e:
        elapsed_time = time.time() - start_time
        logger.error(f"✗ Failed: {e}")
        logger.error(f"  Response time: {elapsed_time:.2f}s")
        
        return {
            "success": False,
            "test_name": test_case["name"],
            "tool_calls": 0,
            "actions_count": 0,
            "tokens_used": 0,
            "response_time": elapsed_time,
            "model": None,
            "error": str(e)
        }


async def run_integration_tests(use_api: bool = False, api_url: str = "http://localhost:8000"):
    """Run all integration tests."""
    logger.info("="*60)
    logger.info("Integration Test Suite")
    logger.info("="*60)
    logger.info(f"OpenAI API Key configured: {bool(settings.OPENAI_API_KEY)}")
    logger.info(f"Default model: {settings.DEFAULT_MODEL}")
    logger.info(f"Testing mode: {'API endpoint' if use_api else 'Direct agent'}")
    logger.info("="*60)
    
    results: List[Dict[str, Any]] = []
    
    for test_case in TEST_CASES:
        if use_api:
            result = await test_api_endpoint(api_url, test_case)
        else:
            result = await test_agent_directly(test_case)
        
        results.append(result)
        
        # Small delay between tests
        await asyncio.sleep(1)
    
    # Summary
    logger.info("\n" + "="*60)
    logger.info("Test Summary")
    logger.info("="*60)
    
    successful = sum(1 for r in results if r["success"])
    total = len(results)
    
    logger.info(f"Total tests: {total}")
    logger.info(f"Successful: {successful}")
    logger.info(f"Failed: {total - successful}")
    
    if successful > 0:
        avg_tool_calls = sum(r["tool_calls"] for r in results if r["success"]) / successful
        avg_tokens = sum(r["tokens_used"] for r in results if r["success"]) / successful
        avg_time = sum(r["response_time"] for r in results if r["success"]) / successful
        
        logger.info(f"\nAverage metrics (successful tests):")
        logger.info(f"  Tool calls: {avg_tool_calls:.1f}")
        logger.info(f"  Tokens used: {avg_tokens:.0f}")
        logger.info(f"  Response time: {avg_time:.2f}s")
    
    # Detailed results
    logger.info("\nDetailed Results:")
    for result in results:
        status = "✓" if result["success"] else "✗"
        logger.info(
            f"  {status} {result['test_name']}: "
            f"{result['tool_calls']} tool calls, "
            f"{result['tokens_used']} tokens, "
            f"{result['response_time']:.2f}s"
        )
        if result["error"]:
            logger.info(f"    Error: {result['error']}")
    
    return results


if __name__ == "__main__":
    import sys
    
    use_api = "--api" in sys.argv
    api_url = "http://localhost:8000"
    
    if "--api-url" in sys.argv:
        idx = sys.argv.index("--api-url")
        if idx + 1 < len(sys.argv):
            api_url = sys.argv[idx + 1]
    
    asyncio.run(run_integration_tests(use_api=use_api, api_url=api_url))

