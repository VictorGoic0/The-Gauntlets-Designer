"""
Model comparison testing script.

Tests the same prompt with all available models and compares:
- Tool calls generated
- Token usage
- Response time
- Estimated cost
- Quality assessment (manual review needed)
"""
import asyncio
import time
from typing import Dict, Any, List
from datetime import datetime

from app.agent.orchestrator import CanvasAgent
from app.config import settings
from app.models.models import AVAILABLE_MODELS
from app.utils.logger import logger


# Model pricing (per 1M tokens, as of 2024 - update as needed)
# Pricing: input/output
MODEL_PRICING = {
    "gpt-4-turbo": {"input": 10.0, "output": 30.0},  # $10/$30 per 1M tokens
    "gpt-4o": {"input": 5.0, "output": 15.0},  # $5/$15 per 1M tokens
    "gpt-4o-mini": {"input": 0.15, "output": 0.6},  # $0.15/$0.6 per 1M tokens
    "gpt-4": {"input": 30.0, "output": 60.0},  # $30/$60 per 1M tokens
}


def estimate_cost(model: str, input_tokens: int, output_tokens: int) -> float:
    """Estimate cost for a request."""
    if model not in MODEL_PRICING:
        return 0.0
    
    pricing = MODEL_PRICING[model]
    input_cost = (input_tokens / 1_000_000) * pricing["input"]
    output_cost = (output_tokens / 1_000_000) * pricing["output"]
    
    return input_cost + output_cost


async def test_model(
    model: str,
    test_message: str
) -> Dict[str, Any]:
    """Test a single model with a test message."""
    logger.info(f"\n{'='*60}")
    logger.info(f"Testing model: {model}")
    logger.info(f"Message: {test_message}")
    logger.info(f"{'='*60}")
    
    start_time = time.time()
    
    try:
        agent = CanvasAgent()
        result = await agent.process_message(
            user_message=test_message,
            model=model
        )
        
        elapsed_time = time.time() - start_time
        
        # Extract metrics
        tool_calls = result.get("toolCalls", 0)
        tokens_used = result.get("tokensUsed", 0)
        actions = result.get("actions", [])
        response_text = result.get("response", "")
        
        # Estimate token breakdown (rough estimate - OpenAI doesn't always provide this)
        # Assume 70% input, 30% output for estimation
        input_tokens_est = int(tokens_used * 0.7)
        output_tokens_est = int(tokens_used * 0.3)
        
        estimated_cost = estimate_cost(model, input_tokens_est, output_tokens_est)
        
        logger.info(f"✓ Success")
        logger.info(f"  Tool calls: {tool_calls}")
        logger.info(f"  Actions: {len(actions)}")
        logger.info(f"  Tokens used: {tokens_used}")
        logger.info(f"  Response time: {elapsed_time:.2f}s")
        logger.info(f"  Estimated cost: ${estimated_cost:.6f}")
        
        # Log sample actions
        if actions:
            logger.info(f"  Sample actions: {len(actions)} actions generated")
            if len(actions) > 0:
                logger.info(f"    First action type: {actions[0].get('type', 'unknown')}")
        
        return {
            "success": True,
            "model": model,
            "tool_calls": tool_calls,
            "actions_count": len(actions),
            "tokens_used": tokens_used,
            "input_tokens_est": input_tokens_est,
            "output_tokens_est": output_tokens_est,
            "response_time": elapsed_time,
            "estimated_cost": estimated_cost,
            "response_text": response_text[:200],  # First 200 chars
            "actions": actions[:3],  # First 3 actions for review
            "error": None
        }
        
    except Exception as e:
        elapsed_time = time.time() - start_time
        logger.error(f"✗ Failed: {e}")
        logger.error(f"  Response time: {elapsed_time:.2f}s")
        
        return {
            "success": False,
            "model": model,
            "tool_calls": 0,
            "actions_count": 0,
            "tokens_used": 0,
            "input_tokens_est": 0,
            "output_tokens_est": 0,
            "response_time": elapsed_time,
            "estimated_cost": 0.0,
            "response_text": "",
            "actions": [],
            "error": str(e)
        }


async def compare_models(test_message: str = "Create a login form"):
    """Compare all available models with the same test message."""
    logger.info("="*60)
    logger.info("Model Comparison Test")
    logger.info("="*60)
    logger.info(f"Test message: {test_message}")
    logger.info(f"Available models: {', '.join(AVAILABLE_MODELS)}")
    logger.info("="*60)
    
    results: List[Dict[str, Any]] = []
    
    for model in AVAILABLE_MODELS:
        result = await test_model(model, test_message)
        results.append(result)
        
        # Delay between tests to avoid rate limits
        await asyncio.sleep(2)
    
    # Summary
    logger.info("\n" + "="*60)
    logger.info("Comparison Summary")
    logger.info("="*60)
    
    successful_results = [r for r in results if r["success"]]
    
    if not successful_results:
        logger.error("No successful tests!")
        return results
    
    # Sort by response time
    successful_results.sort(key=lambda x: x["response_time"])
    
    logger.info("\nResponse Time Ranking (fastest to slowest):")
    for i, result in enumerate(successful_results, 1):
        logger.info(
            f"  {i}. {result['model']}: {result['response_time']:.2f}s "
            f"({result['tool_calls']} tool calls, ${result['estimated_cost']:.6f})"
        )
    
    # Sort by cost
    successful_results.sort(key=lambda x: x["estimated_cost"])
    
    logger.info("\nCost Ranking (cheapest to most expensive):")
    for i, result in enumerate(successful_results, 1):
        logger.info(
            f"  {i}. {result['model']}: ${result['estimated_cost']:.6f} "
            f"({result['tokens_used']} tokens, {result['response_time']:.2f}s)"
        )
    
    # Sort by tool calls (quality indicator)
    successful_results.sort(key=lambda x: x["tool_calls"], reverse=True)
    
    logger.info("\nTool Calls Ranking (most to least):")
    for i, result in enumerate(successful_results, 1):
        logger.info(
            f"  {i}. {result['model']}: {result['tool_calls']} tool calls "
            f"({result['response_time']:.2f}s, ${result['estimated_cost']:.6f})"
        )
    
    # Detailed comparison table
    logger.info("\n" + "="*60)
    logger.info("Detailed Comparison")
    logger.info("="*60)
    logger.info(f"{'Model':<15} {'Tool Calls':<12} {'Tokens':<10} {'Time (s)':<10} {'Cost ($)':<12} {'Status':<10}")
    logger.info("-" * 70)
    
    for result in results:
        status = "✓" if result["success"] else "✗"
        logger.info(
            f"{result['model']:<15} "
            f"{result['tool_calls']:<12} "
            f"{result['tokens_used']:<10} "
            f"{result['response_time']:<10.2f} "
            f"{result['estimated_cost']:<12.6f} "
            f"{status:<10}"
        )
    
    # Save results to file
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    results_file = f"model_comparison_{timestamp}.json"
    
    import json
    with open(results_file, "w") as f:
        json.dump({
            "test_message": test_message,
            "timestamp": timestamp,
            "results": results
        }, f, indent=2)
    
    logger.info(f"\nResults saved to: {results_file}")
    logger.info("\nNote: Manual quality review recommended - check actions in results file")
    
    return results


if __name__ == "__main__":
    import sys
    
    test_message = "Create a login form"
    if len(sys.argv) > 1:
        test_message = " ".join(sys.argv[1:])
    
    asyncio.run(compare_models(test_message))

