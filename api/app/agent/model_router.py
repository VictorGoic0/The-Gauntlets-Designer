"""
Model routing logic for the Canvas AI Agent.

Classifies incoming user messages as either "fast" (Grok, no reasoning) or
"reasoning" (OpenAI GPT) and returns the appropriate OpenAI-compatible client
and model name.

Classification strategy:
- Default to FAST (Grok) — err on the side of cost
- Upgrade to REASONING only when explicit compositional UI intent is detected
- Compositional signals: named multi-component UI patterns (forms, dashboards, etc.)
- Fast signals: count + primitive shape, or no clear composition needed
"""
import re
from typing import Literal, Tuple

from openai import OpenAI

from app.config import settings
from app.utils.logger import logger


ModelTier = Literal["fast", "reasoning"]

# Compositional UI keywords that warrant reasoning.
# These imply multi-component spatial layout decisions.
_REASONING_KEYWORDS = frozenset({
    "form",
    "login",
    "signup",
    "sign up",
    "register",
    "dashboard",
    "navbar",
    "nav bar",
    "navigation",
    "sidebar",
    "side bar",
    "header",
    "footer",
    "modal",
    "dialog",
    "card",
    "layout",
    "page",
    "landing",
    "hero",
    "banner",
    "profile",
    "settings",
    "checkout",
    "onboarding",
    "wizard",
    "stepper",
    "accordion",
    "tab",
    "menu",
    "dropdown",
    "toolbar",
    "panel",
    "section",
    "component",
})

# Pattern: "N <primitive>" where primitive is a basic shape.
# These never require compositional reasoning.
_PRIMITIVE_SHAPE_PATTERN = re.compile(
    r"\b(\d+)\s+(squares?|rectangles?|circles?|lines?|dots?|boxes?)\b",
    re.IGNORECASE,
)


def classify_complexity(message: str) -> ModelTier:
    """
    Classify a user message as requiring fast or reasoning model.

    Rules (in priority order):
    1. If message contains a compositional UI keyword → reasoning
    2. If message matches "N <primitive shape>" pattern → fast
    3. Default → fast (cost-first)

    Args:
        message: Raw user message string.

    Returns:
        "reasoning" or "fast"
    """
    lowered = message.lower()

    for keyword in _REASONING_KEYWORDS:
        if keyword in lowered:
            logger.debug(f"Model router: reasoning tier (keyword='{keyword}')")
            return "reasoning"

    if _PRIMITIVE_SHAPE_PATTERN.search(message):
        logger.debug("Model router: fast tier (primitive shape pattern)")
        return "fast"

    logger.debug("Model router: fast tier (default)")
    return "fast"


def get_model_client(tier: ModelTier) -> Tuple[OpenAI, str]:
    """
    Return an OpenAI-compatible client and model name for the given tier.

    Grok's API is OpenAI-compatible, so we just swap the base_url and api_key.

    Args:
        tier: "fast" or "reasoning"

    Returns:
        Tuple of (client, model_name)
    """
    if tier == "reasoning":
        client = OpenAI(api_key=settings.OPENAI_API_KEY)
        model = settings.REASONING_MODEL
        logger.debug(f"Model router: using OpenAI client, model={model}")
    else:
        client = OpenAI(
            api_key=settings.GROK_API_KEY,
            base_url=settings.GROK_BASE_URL,
        )
        model = settings.FAST_MODEL
        logger.debug(f"Model router: using Grok client, model={model}")

    return client, model


def route(message: str) -> Tuple[OpenAI, str, ModelTier]:
    """
    Classify message and return (client, model_name, tier).

    Convenience wrapper combining classify_complexity + get_model_client.

    Args:
        message: Raw user message string.

    Returns:
        Tuple of (client, model_name, tier)
    """
    tier = classify_complexity(message)
    client, model = get_model_client(tier)
    logger.info(f"Model router: routed to tier={tier}, model={model}")
    return client, model, tier
