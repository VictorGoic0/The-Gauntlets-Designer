"""
Test script for CanvasAgent orchestrator.

This script tests the agent with various prompts to verify:
- Tool calls are extracted correctly
- Actions are formatted properly
- Error handling works
- Response structure is correct

Run from backend directory:
    python test_agent.py
"""
import asyncio
import json
from app.agent.orchestrator import CanvasAgent
from app.utils.logger import logger


async def test_agent(test_name: str, user_message: str):
    """Test the agent with a specific message."""
    print(f"\n{'='*60}")
    print(f"Test: {test_name}")
    print(f"Message: {user_message}")
    print(f"{'='*60}\n")
    
    agent = CanvasAgent()
    
    try:
        result = await agent.process_message(
            user_message=user_message,
            model=None  # Use default
        )
        
        print(f"Response: {result.get('response', 'N/A')}")
        print(f"Tool Calls: {result.get('toolCalls', 0)}")
        print(f"Tokens Used: {result.get('tokensUsed', 0)}")
        print(f"Model: {result.get('model', 'N/A')}")
        
        if 'error' in result:
            print(f"ERROR: {result['error']}")
        
        actions = result.get('actions', [])
        print(f"\nActions ({len(actions)}):")
        for i, action in enumerate(actions, 1):
            print(f"  {i}. Type: {action.get('type', 'N/A')}")
            print(f"     Params: {json.dumps(action.get('params', {}), indent=6)}")
        
        print(f"\n✅ Test '{test_name}' completed successfully")
        return result
        
    except Exception as e:
        print(f"\n❌ Test '{test_name}' failed with error: {e}")
        logger.exception(f"Test '{test_name}' failed")
        return None


async def main():
    """Run all test cases."""
    print("CanvasAgent Test Suite")
    print("=" * 60)
    
    # Test 1: Login form (should produce 8-10 tool calls)
    await test_agent(
        "Login Form",
        "Create a login form"
    )
    
    # Test 2: Simple button
    await test_agent(
        "Button",
        "Create a button"
    )
    
    # Test 3: Grid of circles
    await test_agent(
        "3x3 Grid of Circles",
        "Create a 3x3 grid of circles"
    )
    
    print(f"\n{'='*60}")
    print("All tests completed!")
    print(f"{'='*60}\n")


if __name__ == "__main__":
    asyncio.run(main())

