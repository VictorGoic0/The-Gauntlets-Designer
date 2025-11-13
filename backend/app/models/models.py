"""Model configuration and validation."""
from typing import Dict, Any

# Hardcoded model configuration (not in environment variables)
AVAILABLE_MODELS: Dict[str, Dict[str, Any]] = {
    "gpt-4-turbo": {
        "name": "gpt-4-turbo-2024-04-09",
        "cost_per_1k_input": 0.01,
        "cost_per_1k_output": 0.03,
        "recommended": True,
        "notes": "Best balance of cost and quality"
    },
    "gpt-4o": {
        "name": "gpt-4o",
        "cost_per_1k_input": 0.0025,
        "cost_per_1k_output": 0.01,
        "recommended": True,
        "notes": "Faster, cheaper, good quality"
    },
    "gpt-4o-mini": {
        "name": "gpt-4o-mini",
        "cost_per_1k_input": 0.00015,
        "cost_per_1k_output": 0.0006,
        "recommended": False,
        "notes": "Cheapest, test if quality sufficient"
    },
    "gpt-4": {
        "name": "gpt-4",
        "cost_per_1k_input": 0.03,
        "cost_per_1k_output": 0.06,
        "recommended": False,
        "notes": "Highest quality, most expensive, slower"
    }
}


def get_model_name(model_key: str) -> str:
    """
    Get the actual model name by key.
    
    Args:
        model_key: Model key (e.g., "gpt-4-turbo")
        
    Returns:
        Actual model name for OpenAI API (e.g., "gpt-4-turbo-2024-04-09")
        
    Raises:
        ValueError: If model key is not found
    """
    if model_key not in AVAILABLE_MODELS:
        raise ValueError(
            f"Model '{model_key}' not found. Available models: {list(AVAILABLE_MODELS.keys())}"
        )
    return AVAILABLE_MODELS[model_key]["name"]


def validate_model(model_key: str) -> bool:
    """
    Validate that a model key exists.
    
    Args:
        model_key: Model key to validate
        
    Returns:
        True if model exists
        
    Raises:
        ValueError: If model key is not found
    """
    if model_key not in AVAILABLE_MODELS:
        raise ValueError(
            f"Model '{model_key}' not found. Available models: {list(AVAILABLE_MODELS.keys())}"
        )
    return True

