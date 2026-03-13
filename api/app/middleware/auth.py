"""
Firebase ID token verification for agent endpoints.

Expects: Authorization: Bearer <firebase_id_token>
Returns: verified uid (str) or raises HTTP 401.
"""
from typing import Optional

import firebase_admin.auth
from fastapi import Header, HTTPException, status

from app.services.firebase_service import is_firebase_initialized
from app.utils.logger import logger


async def get_current_user_uid(
    authorization: Optional[str] = Header(None, alias="Authorization"),
) -> str:
    """
    Verify Firebase ID token from Authorization header and return the user's uid.

    The frontend must send: Authorization: Bearer <token>
    where <token> is from firebase.auth().currentUser.getIdToken().

    Returns:
        Firebase UID string (e.g. "abc123").

    Raises:
        HTTPException 401: Missing header, invalid token, or expired token.
        HTTPException 503: Firebase not initialized (server config error).
    """
    if not is_firebase_initialized():
        logger.error("Firebase not initialized; cannot verify ID token")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Authentication service is not available",
        )

    if not authorization or not authorization.strip():
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing Authorization header",
        )

    if not authorization.strip().lower().startswith("bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header must be: Bearer <token>",
        )

    token = authorization.strip()[7:].strip()  # drop "Bearer "
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing token after Bearer",
        )

    try:
        decoded = firebase_admin.auth.verify_id_token(token)
        uid = decoded.get("uid")
        if not uid:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token: no uid in payload",
            )
        return uid
    except firebase_admin.auth.ExpiredIdTokenError:
        logger.warning("Expired Firebase ID token")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Firebase token has expired",
        )
    except firebase_admin.auth.InvalidIdTokenError:
        logger.warning("Invalid Firebase ID token")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Firebase token",
        )
    except Exception as e:
        logger.error(f"Token verification failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token verification failed",
        )
