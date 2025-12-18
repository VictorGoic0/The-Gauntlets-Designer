"""Test script for OpenAI integration."""
import asyncio
import sys
from pathlib import Path

# Add backend directory to path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

from app.services.openai_service import (
    initialize_openai_client,
    test_openai_connection,
    call_openai_with_retry,
    format_error_response,
)
from app.models.models import AVAILABLE_MODELS, get_model_name, validate_model
from app.utils.logger import logger


def test_model_configuration():
    """Test model configuration."""
    print("\n" + "="*60)
    print("Testing Model Configuration")
    print("="*60)
    
    # Test available models
    print(f"\nAvailable models: {list(AVAILABLE_MODELS.keys())}")
    
    for model_key, model_info in AVAILABLE_MODELS.items():
        print(f"\n{model_key}:")
        print(f"  Name: {model_info['name']}")
        print(f"  Cost: ${model_info['cost_per_1k_input']}/1k in, ${model_info['cost_per_1k_output']}/1k out")
        print(f"  Recommended: {model_info['recommended']}")
        print(f"  Notes: {model_info['notes']}")
    
    # Test model name retrieval
    print("\n" + "-"*60)
    print("Testing model name retrieval:")
    for model_key in AVAILABLE_MODELS.keys():
        model_name = get_model_name(model_key)
        print(f"  {model_key} -> {model_name}")
    
    # Test model validation
    print("\n" + "-"*60)
    print("Testing model validation:")
    for model_key in AVAILABLE_MODELS.keys():
        try:
            validate_model(model_key)
            print(f"  ✓ {model_key} is valid")
        except ValueError as e:
            print(f"  ✗ {model_key} validation failed: {e}")
    
    # Test invalid model
    try:
        validate_model("invalid-model")
        print("  ✗ Invalid model validation should have failed")
    except ValueError:
        print("  ✓ Invalid model correctly rejected")


def test_openai_connection():
    """Test OpenAI connection."""
    print("\n" + "="*60)
    print("Testing OpenAI Connection")
    print("="*60)
    
    try:
        result = test_openai_connection()
        if result:
            print("\n✓ OpenAI connection test successful")
        else:
            print("\n✗ OpenAI connection test failed")
    except Exception as e:
        print(f"\n✗ OpenAI connection test failed: {e}")
        return False
    
    return True


def test_basic_completion():
    """Test basic OpenAI completion (no tools)."""
    print("\n" + "="*60)
    print("Testing Basic OpenAI Completion")
    print("="*60)
    
    messages = [
        {"role": "user", "content": "Say 'Hello, World!' in exactly 3 words."}
    ]
    
    try:
        response = call_openai_with_retry(
            messages=messages,
            model="gpt-4-turbo",
            tools=None,
            tool_choice="auto"
        )
        
        print(f"\n✓ OpenAI API call successful")
        print(f"  Model: {response.model}")
        print(f"  Response: {response.choices[0].message.content if response.choices else 'N/A'}")
        
        if response.usage:
            print(f"  Tokens used: {response.usage.total_tokens}")
            print(f"    - Prompt tokens: {response.usage.prompt_tokens}")
            print(f"    - Completion tokens: {response.usage.completion_tokens}")
        
        return True
    except Exception as e:
        print(f"\n✗ OpenAI API call failed: {e}")
        error_response = format_error_response(e)
        print(f"  Error response: {error_response}")
        return False


def test_all_models():
    """Test all configured models."""
    print("\n" + "="*60)
    print("Testing All Models")
    print("="*60)
    
    test_message = "Say 'test' in one word."
    results = {}
    
    for model_key in AVAILABLE_MODELS.keys():
        print(f"\nTesting {model_key}...")
        try:
            messages = [{"role": "user", "content": test_message}]
            response = call_openai_with_retry(
                messages=messages,
                model=model_key,
                tools=None,
                tool_choice="auto"
            )
            
            tokens = response.usage.total_tokens if response.usage else 0
            model_info = AVAILABLE_MODELS[model_key]
            estimated_cost = (
                (response.usage.prompt_tokens / 1000 * model_info["cost_per_1k_input"]) +
                (response.usage.completion_tokens / 1000 * model_info["cost_per_1k_output"])
            ) if response.usage else 0
            
            results[model_key] = {
                "success": True,
                "tokens": tokens,
                "estimated_cost": estimated_cost,
                "response": response.choices[0].message.content if response.choices else "N/A"
            }
            
            print(f"  ✓ Success - Tokens: {tokens}, Estimated cost: ${estimated_cost:.6f}")
        except Exception as e:
            results[model_key] = {
                "success": False,
                "error": str(e)
            }
            print(f"  ✗ Failed: {e}")
    
    # Summary
    print("\n" + "-"*60)
    print("Summary:")
    for model_key, result in results.items():
        if result["success"]:
            print(f"  {model_key}: ✓ ({result['tokens']} tokens, ${result['estimated_cost']:.6f})")
        else:
            print(f"  {model_key}: ✗ ({result.get('error', 'Unknown error')})")


def test_error_formatting():
    """Test error response formatting."""
    print("\n" + "="*60)
    print("Testing Error Response Formatting")
    print("="*60)
    
    from openai import RateLimitError, APIError, APITimeoutError
    
    # Test RateLimitError
    try:
        raise RateLimitError("Rate limit exceeded", response=None, body=None)
    except RateLimitError as e:
        error_response = format_error_response(e, retry_attempt=2, will_retry=True)
        print(f"\nRateLimitError response: {error_response}")
    
    # Test APITimeoutError
    try:
        raise APITimeoutError("Request timed out", request=None)
    except APITimeoutError as e:
        error_response = format_error_response(e, retry_attempt=1, will_retry=True)
        print(f"\nAPITimeoutError response: {error_response}")
    
    # Test generic error
    try:
        raise ValueError("Generic error")
    except ValueError as e:
        error_response = format_error_response(e)
        print(f"\nGeneric error response: {error_response}")


def main():
    """Run all tests."""
    print("OpenAI Integration Test Suite")
    print("="*60)
    
    # Test 1: Model configuration
    test_model_configuration()
    
    # Test 2: OpenAI connection
    connection_ok = test_openai_connection()
    if not connection_ok:
        print("\n⚠️  OpenAI connection failed. Skipping API tests.")
        print("   Make sure OPENAI_API_KEY is set in your .env file.")
        return
    
    # Test 3: Basic completion
    test_basic_completion()
    
    # Test 4: All models (comment out to save API costs during development)
    # test_all_models()
    
    # Test 5: Error formatting
    test_error_formatting()
    
    print("\n" + "="*60)
    print("Test suite complete!")
    print("="*60)


if __name__ == "__main__":
    main()

