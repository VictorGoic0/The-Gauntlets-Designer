#!/usr/bin/env python3
"""
Test script to verify prompts module loads correctly.
Run with: python test_prompts.py
"""
import sys
from app.agent.prompts import SYSTEM_PROMPT, FEW_SHOT_EXAMPLES

def main():
    print("Testing prompts module...")
    
    # Test system prompt
    print(f"\n✓ System prompt loaded")
    print(f"  Length: {len(SYSTEM_PROMPT)} characters")
    # Rough token estimate: ~4 characters per token
    estimated_tokens = len(SYSTEM_PROMPT) // 4
    print(f"  Estimated tokens: ~{estimated_tokens}")
    
    # Test few-shot examples
    print(f"\n✓ Few-shot examples loaded")
    print(f"  Number of messages: {len(FEW_SHOT_EXAMPLES)}")
    
    # Count tool calls in assistant message
    assistant_msg = next((msg for msg in FEW_SHOT_EXAMPLES if msg.get("role") == "assistant"), None)
    if assistant_msg and "tool_calls" in assistant_msg:
        print(f"  Tool calls in example: {len(assistant_msg['tool_calls'])}")
    
    # Count tool responses
    tool_responses = [msg for msg in FEW_SHOT_EXAMPLES if msg.get("role") == "tool"]
    print(f"  Tool responses: {len(tool_responses)}")
    
    # Estimate total tokens for few-shot examples
    import json
    few_shot_str = json.dumps(FEW_SHOT_EXAMPLES)
    few_shot_tokens = len(few_shot_str) // 4
    print(f"  Estimated tokens: ~{few_shot_tokens}")
    
    # Total estimate
    total_tokens = estimated_tokens + few_shot_tokens
    print(f"\n✓ Total estimated tokens per request: ~{total_tokens}")
    print(f"  (System prompt + Few-shot examples, before user message)")
    
    # Verify structure (arguments are now Python dicts, not JSON strings)
    try:
        for msg in FEW_SHOT_EXAMPLES:
            if "tool_calls" in msg:
                for tool_call in msg["tool_calls"]:
                    # Verify arguments are Python dicts
                    args = tool_call["function"]["arguments"]
                    if not isinstance(args, dict):
                        raise ValueError(f"Tool call arguments should be dict, got {type(args)}")
            if msg.get("role") == "tool":
                # Verify content is a dict
                content = msg.get("content")
                if not isinstance(content, dict):
                    raise ValueError(f"Tool response content should be dict, got {type(content)}")
        print("\n✓ All tool call arguments are valid Python dicts")
    except Exception as e:
        print(f"\n✗ Structure validation failed: {e}")
        sys.exit(1)
    
    print("\n✓ All tests passed!")

if __name__ == "__main__":
    main()

