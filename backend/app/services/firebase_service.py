"""
Firebase Admin SDK service for Firestore operations.

This module handles:
- Firebase Admin SDK initialization
- Writing canvas actions to Firestore
- Error handling for Firebase operations

Firestore Structure:
    /projects/shared-canvas/objects/{objectId}

Each object document contains:
    - type: Action type (without "create_" prefix)
    - params: Action parameters dictionary
    - createdAt: Server timestamp
"""
import firebase_admin
from firebase_admin import credentials, firestore
from typing import Dict, List, Any, Optional
from pathlib import Path

from app.config import settings
from app.utils.logger import logger

# Global Firestore client instance
_db: Optional[firestore.Client] = None


def initialize_firebase() -> None:
    """
    Initialize Firebase Admin SDK with service account credentials.
    
    This function:
    1. Loads credentials from the configured path
    2. Initializes Firebase Admin app (if not already initialized)
    3. Gets Firestore client instance
    
    Raises:
        FileNotFoundError: If credentials file doesn't exist
        ValueError: If credentials are invalid
        Exception: For other Firebase initialization errors
    """
    global _db
    
    try:
        # Check if Firebase is already initialized
        try:
            firebase_admin.get_app()
            logger.info("Firebase Admin SDK already initialized")
            _db = firestore.client()
            return
        except ValueError:
            # Not initialized yet, proceed with initialization
            pass
        
        # Get credentials path
        creds_path = settings.get_firebase_credentials_path()
        creds_file = Path(creds_path)
        
        if not creds_file.exists():
            raise FileNotFoundError(
                f"Firebase credentials file not found at: {creds_path}. "
                f"Please download your service account key from Firebase Console and save it as "
                f"serviceAccountKey.json in the backend/ directory, or set FIREBASE_CREDENTIALS_PATH "
                f"to point to your credentials file."
            )
        
        logger.info(f"Initializing Firebase Admin SDK with credentials from: {creds_path}")
        
        # Initialize Firebase Admin with service account credentials
        cred = credentials.Certificate(str(creds_file))
        firebase_admin.initialize_app(cred)
        
        # Get Firestore client
        _db = firestore.client()
        
        logger.info("Firebase Admin SDK initialized successfully")
        
    except FileNotFoundError as e:
        logger.error(f"Firebase initialization failed - credentials file not found: {e}")
        raise
    except ValueError as e:
        logger.error(f"Firebase initialization failed - invalid credentials: {e}")
        raise
    except Exception as e:
        logger.error(f"Firebase initialization failed with unexpected error: {e}", exc_info=True)
        raise


def get_firestore_client() -> firestore.Client:
    """
    Get Firestore client instance.
    
    Returns:
        Firestore client instance
        
    Raises:
        RuntimeError: If Firebase is not initialized
    """
    global _db
    
    if _db is None:
        raise RuntimeError(
            "Firestore client not initialized. Call initialize_firebase() first."
        )
    
    return _db


def is_firebase_initialized() -> bool:
    """
    Check if Firebase Admin SDK is initialized.
    
    Returns:
        True if initialized, False otherwise
    """
    try:
        firebase_admin.get_app()
        return _db is not None
    except ValueError:
        return False


async def write_canvas_actions_to_firestore(
    actions: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """
    Write canvas actions to Firestore using batch write.
    
    This function:
    1. Gets reference to projects/shared-canvas/objects collection
    2. Creates a batch write for efficiency
    3. For each action, creates a document with flattened structure:
       - type: Object type (without "create_" prefix)
       - x, y, width, height, fill, rotation, etc. (all params flattened)
       - zIndex: Default 0
       - createdAt: Server timestamp
    4. Commits the batch atomically
    
    Document structure matches frontend expectations:
    - No 'params' wrapper - all properties are flat on the document
    - No 'metadata' field - metadata properties are ignored
    - Properties: type, x, y, width, height, fill, rotation, zIndex, createdAt
    
    Args:
        actions: List of action dictionaries with 'type' and 'params' keys
        
    Returns:
        Dictionary with:
        - success: Boolean indicating success
        - objectsCreated: Number of objects created
        - error: Error message if failed (optional)
        
    Raises:
        RuntimeError: If Firebase is not initialized
        Exception: For Firestore write errors
    """
    if not is_firebase_initialized():
        raise RuntimeError(
            "Firebase not initialized. Call initialize_firebase() first."
        )
    
    if not actions:
        logger.warning("No actions to write to Firestore")
        return {
            "success": True,
            "objectsCreated": 0
        }
    
    try:
        db = get_firestore_client()
        
        # Get reference to objects collection (matches frontend path)
        objects_ref = db.collection('projects').document('shared-canvas').collection('objects')
        
        # Create batch for atomic write
        batch = db.batch()
        
        objects_created = 0
        for action in actions:
            try:
                # Get action type (remove "create_" prefix if present)
                action_type = action.get('type', '')
                if action_type.startswith('create_'):
                    action_type = action_type[7:]  # Remove "create_" prefix
                
                # Get action parameters
                action_params = action.get('params', {})
                
                # Build document with flattened structure (no 'params' wrapper)
                document_data = {
                    'type': action_type,
                    'createdAt': firestore.SERVER_TIMESTAMP,
                    'rotation': 0,  # Default rotation
                    'zIndex': 0,    # Default zIndex
                }
                
                # Flatten all params directly onto the document
                # Exclude 'metadata' and 'boxShadow' (not supported by frontend yet)
                for key, value in action_params.items():
                    if key == 'metadata':
                        # Skip metadata - not part of frontend structure
                        continue
                    elif key == 'boxShadow':
                        # Skip boxShadow - not supported by frontend yet
                        # See commented example in tools.py for future enhancement
                        continue
                    elif value is not None:  # Only include non-None values
                        document_data[key] = value
                
                # Ensure required fields have defaults
                if 'x' not in document_data:
                    document_data['x'] = 0
                if 'y' not in document_data:
                    document_data['y'] = 0
                
                # Create document reference (Firestore will generate ID)
                object_ref = objects_ref.document()
                
                # Add to batch
                batch.set(object_ref, document_data)
                
                objects_created += 1
                
            except Exception as e:
                logger.error(f"Error preparing action for batch write: {e}. Action: {action}")
                # Continue with other actions
                continue
        
        if objects_created == 0:
            logger.warning("No valid actions to write to Firestore")
            return {
                "success": True,
                "objectsCreated": 0
            }
        
        # Commit batch (this is synchronous, but we're in async context)
        # Firestore batch.commit() is blocking, so we run it in a thread pool
        import asyncio
        await asyncio.to_thread(batch.commit)
        
        logger.info(
            f"Successfully wrote {objects_created} objects to Firestore"
        )
        
        return {
            "success": True,
            "objectsCreated": objects_created
        }
        
    except Exception as e:
        logger.error(
            f"Error writing canvas actions to Firestore: {e}",
            exc_info=True
        )
        return {
            "success": False,
            "objectsCreated": 0,
            "error": str(e)
        }

