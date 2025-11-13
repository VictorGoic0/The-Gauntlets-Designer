"""
Test script for API endpoint.

This script tests the /api/agent/chat endpoint with various scenarios.

Usage:
    python test_api_endpoint.py

Prerequisites:
    - Server must be running at http://localhost:8000
    - OpenAI API key must be configured
"""
import requests
import json
import sys

BASE_URL = "http://localhost:8000/api/agent/chat"


def test_valid_request():
    """Test with valid login form request."""
    print("\n=== Test 1: Valid Login Form Request ===")
    payload = {
        "message": "Create a login form"
    }
    
    try:
        response = requests.post(BASE_URL, json=payload, timeout=60)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Response: {data.get('response', '')[:100]}...")
            print(f"Actions: {len(data.get('actions', []))} actions")
            print(f"Tool Calls: {data.get('toolCalls', 0)}")
            print(f"Tokens Used: {data.get('tokensUsed', 0)}")
            print(f"Model: {data.get('model', 'unknown')}")
            print("✅ Test passed")
            return True
        else:
            print(f"❌ Test failed: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Test failed with exception: {e}")
        return False


def test_missing_message():
    """Test with missing message."""
    print("\n=== Test 2: Missing Message ===")
    payload = {}
    
    try:
        response = requests.post(BASE_URL, json=payload, timeout=10)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 422:  # FastAPI validation error
            print("✅ Test passed (validation error as expected)")
            return True
        elif response.status_code == 400:
            print("✅ Test passed (400 Bad Request as expected)")
            return True
        else:
            print(f"❌ Unexpected status code: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Test failed with exception: {e}")
        return False


def test_empty_message():
    """Test with empty message."""
    print("\n=== Test 3: Empty Message ===")
    payload = {
        "message": ""
    }
    
    try:
        response = requests.post(BASE_URL, json=payload, timeout=10)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 400:
            print("✅ Test passed (400 Bad Request as expected)")
            print(f"Error: {response.json()}")
            return True
        else:
            print(f"❌ Unexpected status code: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Test failed with exception: {e}")
        return False


def test_invalid_model():
    """Test with invalid model name."""
    print("\n=== Test 4: Invalid Model ===")
    payload = {
        "message": "Create a button",
        "model": "invalid-model-name"
    }
    
    try:
        response = requests.post(BASE_URL, json=payload, timeout=10)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 400:
            print("✅ Test passed (400 Bad Request as expected)")
            print(f"Error: {response.json()}")
            return True
        else:
            print(f"❌ Unexpected status code: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Test failed with exception: {e}")
        return False


def test_valid_model_override():
    """Test with valid model override."""
    print("\n=== Test 5: Valid Model Override ===")
    payload = {
        "message": "Create a button",
        "model": "gpt-4o"
    }
    
    try:
        response = requests.post(BASE_URL, json=payload, timeout=60)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Model Used: {data.get('model', 'unknown')}")
            if data.get('model') == 'gpt-4o':
                print("✅ Test passed (model override worked)")
                return True
            else:
                print(f"❌ Model mismatch: expected 'gpt-4o', got '{data.get('model')}'")
                return False
        else:
            print(f"❌ Test failed: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Test failed with exception: {e}")
        return False


def main():
    """Run all tests."""
    print("=" * 60)
    print("API Endpoint Test Suite")
    print("=" * 60)
    print(f"Testing endpoint: {BASE_URL}")
    print("\nMake sure the server is running at http://localhost:8000")
    
    # Check if server is running
    try:
        health_check = requests.get("http://localhost:8000/api/health", timeout=5)
        if health_check.status_code != 200:
            print("\n❌ Server health check failed. Is the server running?")
            sys.exit(1)
        print("✅ Server is running")
    except Exception as e:
        print(f"\n❌ Cannot connect to server: {e}")
        print("Please start the server with: python run_local.py")
        sys.exit(1)
    
    # Run tests
    results = []
    results.append(("Valid Request", test_valid_request()))
    results.append(("Missing Message", test_missing_message()))
    results.append(("Empty Message", test_empty_message()))
    results.append(("Invalid Model", test_invalid_model()))
    results.append(("Valid Model Override", test_valid_model_override()))
    
    # Summary
    print("\n" + "=" * 60)
    print("Test Summary")
    print("=" * 60)
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status}: {test_name}")
    
    print(f"\nTotal: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n🎉 All tests passed!")
        sys.exit(0)
    else:
        print("\n⚠️  Some tests failed")
        sys.exit(1)


if __name__ == "__main__":
    main()

