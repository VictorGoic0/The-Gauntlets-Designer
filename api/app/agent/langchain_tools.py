"""
LangChain tool definitions for canvas operations.

This module defines all canvas manipulation tools using LangChain's @tool decorator.
Each tool writes to both Firestore (for persistent storage) and Realtime DB (for live updates).

Tools:
- createRectangle: Create rectangle with position, size, fill, stroke
- createCircle: Create circle with position, radius, fill, stroke
- createText: Create text with position, content, fontSize, fill
- moveObject: Move object to new position
- resizeObject: Resize object (width/height or radius)
- changeColor: Change object fill color
- rotateObject: Rotate object by degrees

Each tool returns: {"success": bool, "objectId": str, "message": str}
"""
import asyncio
from typing import Dict, Any
from langchain.tools import tool
import firebase_admin
from firebase_admin import firestore, db as realtime_db

from app.services.firebase_service import get_firestore_client, is_firebase_initialized
from app.utils.logger import logger


def _get_realtime_db_ref():
    """Get Firebase Realtime Database reference."""
    try:
        return realtime_db.reference()
    except Exception as e:
        logger.warning(f"Could not get Realtime DB reference: {e}")
        return None


@tool
def create_rectangle(
    x: float,
    y: float,
    width: float = 100,
    height: float = 100,
    fill: str = "#3B82F6",
    rotation: float = 0
) -> Dict[str, Any]:
    """Create a rectangle shape on the canvas at the specified position with optional dimensions and color.
    
    Args:
        x: X position of the rectangle (0-5000)
        y: Y position of the rectangle (0-5000)
        width: Width of the rectangle in pixels (default: 100)
        height: Height of the rectangle in pixels (default: 100)
        fill: Fill color in hex format (e.g., #3B82F6, #FF0000). Default: #3B82F6 (blue)
        rotation: Rotation in degrees (0-360). Default: 0
        
    Returns:
        Dictionary with success status, objectId, and message
    """
    try:
        if not is_firebase_initialized():
            return {
                "success": False,
                "objectId": "",
                "message": "Firebase not initialized"
            }
        
        db = get_firestore_client()
        
        # Prepare object data
        object_data = {
            "type": "rectangle",
            "x": x,
            "y": y,
            "width": width,
            "height": height,
            "fill": fill,
            "rotation": rotation,
            "zIndex": 0,
            "createdAt": firestore.SERVER_TIMESTAMP,
        }
        
        # Write to Firestore
        doc_ref = db.collection("projects").document("shared-canvas").collection("objects").document()
        doc_ref.set(object_data)
        object_id = doc_ref.id
        
        # Write position to Realtime DB for live tracking
        try:
            rtdb_ref = _get_realtime_db_ref()
            if rtdb_ref:
                rtdb_ref.child(f"objectPositions/{object_id}").set({
                    "x": x,
                    "y": y,
                    "timestamp": {".sv": "timestamp"}
                })
        except Exception as e:
            logger.warning(f"Error writing position to Realtime DB: {e}")
            # Continue anyway - object exists in Firestore
        
        return {
            "success": True,
            "objectId": object_id,
            "message": f"Created rectangle at ({x}, {y})"
        }
        
    except Exception as e:
        logger.error(f"Error in createRectangle: {e}", exc_info=True)
        return {
            "success": False,
            "objectId": "",
            "message": f"Error creating rectangle: {str(e)}"
        }


@tool
def create_circle(
    x: float,
    y: float,
    radius: float = 50,
    fill: str = "#10B981",
    rotation: float = 0
) -> Dict[str, Any]:
    """Create a circle shape on the canvas at the specified position with optional radius and color.
    
    Args:
        x: X position of the circle center (0-5000)
        y: Y position of the circle center (0-5000)
        radius: Radius of the circle in pixels (default: 50)
        fill: Fill color in hex format (e.g., #10B981, #FF0000). Default: #10B981 (green)
        rotation: Rotation in degrees (0-360). Default: 0
        
    Returns:
        Dictionary with success status, objectId, and message
    """
    try:
        if not is_firebase_initialized():
            return {
                "success": False,
                "objectId": "",
                "message": "Firebase not initialized"
            }
        
        db = get_firestore_client()
        
        # Prepare object data
        object_data = {
            "type": "circle",
            "x": x,
            "y": y,
            "radius": radius,
            "fill": fill,
            "rotation": rotation,
            "zIndex": 0,
            "createdAt": firestore.SERVER_TIMESTAMP,
        }
        
        # Write to Firestore
        doc_ref = db.collection("projects").document("shared-canvas").collection("objects").document()
        doc_ref.set(object_data)
        object_id = doc_ref.id
        
        # Write position to Realtime DB for live tracking
        try:
            rtdb_ref = _get_realtime_db_ref()
            if rtdb_ref:
                rtdb_ref.child(f"objectPositions/{object_id}").set({
                    "x": x,
                    "y": y,
                    "timestamp": {".sv": "timestamp"}
                })
        except Exception as e:
            logger.warning(f"Error writing position to Realtime DB: {e}")
            # Continue anyway - object exists in Firestore
        
        return {
            "success": True,
            "objectId": object_id,
            "message": f"Created circle at ({x}, {y}) with radius {radius}"
        }
        
    except Exception as e:
        logger.error(f"Error in createCircle: {e}", exc_info=True)
        return {
            "success": False,
            "objectId": "",
            "message": f"Error creating circle: {str(e)}"
        }


@tool
def create_text(
    x: float,
    y: float,
    text: str,
    fontSize: float = 16,
    fill: str = "#FFFFFF",
    fontFamily: str = "Arial",
    width: float = 200,
    rotation: float = 0
) -> Dict[str, Any]:
    """Create a text element on the canvas with specified content and styling.
    
    Args:
        x: X position of the text (0-5000)
        y: Y position of the text (0-5000)
        text: The text content to display
        fontSize: Font size in pixels (default: 16)
        fill: Text color in hex format (e.g., #FFFFFF, #000000). Default: #FFFFFF (white)
        fontFamily: Font family (default: Arial)
        width: Text box width in pixels (default: 200)
        rotation: Rotation in degrees (0-360). Default: 0
        
    Returns:
        Dictionary with success status, objectId, and message
    """
    try:
        if not is_firebase_initialized():
            return {
                "success": False,
                "objectId": "",
                "message": "Firebase not initialized"
            }
        
        db = get_firestore_client()
        
        # Prepare object data
        object_data = {
            "type": "text",
            "x": x,
            "y": y,
            "text": text,
            "fontSize": fontSize,
            "fontFamily": fontFamily,
            "width": width,
            "fill": fill,
            "rotation": rotation,
            "zIndex": 0,
            "createdAt": firestore.SERVER_TIMESTAMP,
        }
        
        # Write to Firestore
        doc_ref = db.collection("projects").document("shared-canvas").collection("objects").document()
        doc_ref.set(object_data)
        object_id = doc_ref.id
        
        # Write position to Realtime DB for live tracking
        try:
            rtdb_ref = _get_realtime_db_ref()
            if rtdb_ref:
                rtdb_ref.child(f"objectPositions/{object_id}").set({
                    "x": x,
                    "y": y,
                    "timestamp": {".sv": "timestamp"}
                })
        except Exception as e:
            logger.warning(f"Error writing position to Realtime DB: {e}")
            # Continue anyway - object exists in Firestore
        
        return {
            "success": True,
            "objectId": object_id,
            "message": f"Created text \"{text}\" at ({x}, {y})"
        }
        
    except Exception as e:
        logger.error(f"Error in createText: {e}", exc_info=True)
        return {
            "success": False,
            "objectId": "",
            "message": f"Error creating text: {str(e)}"
        }


@tool
def move_object(
    objectId: str,
    x: float,
    y: float
) -> Dict[str, Any]:
    """Move an existing object to a new position on the canvas.
    
    Args:
        objectId: The ID of the object to move
        x: New X position (0-5000)
        y: New Y position (0-5000)
        
    Returns:
        Dictionary with success status, objectId, and message
    """
    try:
        if not is_firebase_initialized():
            return {
                "success": False,
                "objectId": objectId,
                "message": "Firebase not initialized"
            }
        
        db = get_firestore_client()
        
        # Get document reference
        doc_ref = db.collection("projects").document("shared-canvas").collection("objects").document(objectId)
        
        # Check if object exists
        doc = doc_ref.get()
        if not doc.exists:
            return {
                "success": False,
                "objectId": objectId,
                "message": f"Object {objectId} not found"
            }
        
        # Update position
        doc_ref.update({
            "x": x,
            "y": y,
            "lastEditedAt": firestore.SERVER_TIMESTAMP,
        })
        
        # Update Realtime DB position
        try:
            rtdb_ref = _get_realtime_db_ref()
            if rtdb_ref:
                rtdb_ref.child(f"objectPositions/{objectId}").update({
                    "x": x,
                    "y": y,
                    "timestamp": {".sv": "timestamp"}
                })
        except Exception as e:
            logger.warning(f"Error updating position in Realtime DB: {e}")
        
        return {
            "success": True,
            "objectId": objectId,
            "message": f"Moved object to ({x}, {y})"
        }
        
    except Exception as e:
        logger.error(f"Error in moveObject: {e}", exc_info=True)
        return {
            "success": False,
            "objectId": objectId,
            "message": f"Error moving object: {str(e)}"
        }


@tool
def resize_object(
    objectId: str,
    width: float = None,
    height: float = None,
    radius: float = None
) -> Dict[str, Any]:
    """Resize an existing object. For rectangles/text, provide width and height. For circles, provide radius.
    
    Args:
        objectId: The ID of the object to resize
        width: New width in pixels (for rectangles and text)
        height: New height in pixels (for rectangles and text)
        radius: New radius in pixels (for circles)
        
    Returns:
        Dictionary with success status, objectId, and message
    """
    try:
        if not is_firebase_initialized():
            return {
                "success": False,
                "objectId": objectId,
                "message": "Firebase not initialized"
            }
        
        db = get_firestore_client()
        
        # Get document reference
        doc_ref = db.collection("projects").document("shared-canvas").collection("objects").document(objectId)
        
        # Check if object exists
        doc = doc_ref.get()
        if not doc.exists:
            return {
                "success": False,
                "objectId": objectId,
                "message": f"Object {objectId} not found"
            }
        
        object_data = doc.to_dict()
        object_type = object_data.get("type", "")
        
        # Prepare updates
        updates = {
            "lastEditedAt": firestore.SERVER_TIMESTAMP,
        }
        
        # For circles, update radius
        if object_type == "circle":
            if radius is not None:
                updates["radius"] = radius
            else:
                return {
                    "success": False,
                    "objectId": objectId,
                    "message": "Radius required for resizing circles"
                }
        else:
            # For rectangles and text, update width/height
            if width is not None:
                updates["width"] = width
            if height is not None:
                updates["height"] = height
        
        # Update document
        doc_ref.update(updates)
        
        return {
            "success": True,
            "objectId": objectId,
            "message": f"Resized {object_type}"
        }
        
    except Exception as e:
        logger.error(f"Error in resizeObject: {e}", exc_info=True)
        return {
            "success": False,
            "objectId": objectId,
            "message": f"Error resizing object: {str(e)}"
        }


@tool
def change_color(
    objectId: str,
    fill: str
) -> Dict[str, Any]:
    """Change the color/fill of an existing object.
    
    Args:
        objectId: The ID of the object to recolor
        fill: New fill color in hex format (e.g., #FF0000 for red, #00FF00 for green)
        
    Returns:
        Dictionary with success status, objectId, and message
    """
    try:
        if not is_firebase_initialized():
            return {
                "success": False,
                "objectId": objectId,
                "message": "Firebase not initialized"
            }
        
        db = get_firestore_client()
        
        # Get document reference
        doc_ref = db.collection("projects").document("shared-canvas").collection("objects").document(objectId)
        
        # Check if object exists
        doc = doc_ref.get()
        if not doc.exists:
            return {
                "success": False,
                "objectId": objectId,
                "message": f"Object {objectId} not found"
            }
        
        # Update color
        doc_ref.update({
            "fill": fill,
            "lastEditedAt": firestore.SERVER_TIMESTAMP,
        })
        
        return {
            "success": True,
            "objectId": objectId,
            "message": f"Changed color to {fill}"
        }
        
    except Exception as e:
        logger.error(f"Error in changeColor: {e}", exc_info=True)
        return {
            "success": False,
            "objectId": objectId,
            "message": f"Error changing color: {str(e)}"
        }


@tool
def rotate_object(
    objectId: str,
    rotation: float
) -> Dict[str, Any]:
    """Rotate an existing object by a specified angle.
    
    Args:
        objectId: The ID of the object to rotate
        rotation: Rotation angle in degrees (0-360). 0 = no rotation, 90 = quarter turn clockwise
        
    Returns:
        Dictionary with success status, objectId, and message
    """
    try:
        if not is_firebase_initialized():
            return {
                "success": False,
                "objectId": objectId,
                "message": "Firebase not initialized"
            }
        
        db = get_firestore_client()
        
        # Get document reference
        doc_ref = db.collection("projects").document("shared-canvas").collection("objects").document(objectId)
        
        # Check if object exists
        doc = doc_ref.get()
        if not doc.exists:
            return {
                "success": False,
                "objectId": objectId,
                "message": f"Object {objectId} not found"
            }
        
        # Update rotation
        doc_ref.update({
            "rotation": rotation,
            "lastEditedAt": firestore.SERVER_TIMESTAMP,
        })
        
        return {
            "success": True,
            "objectId": objectId,
            "message": f"Rotated to {rotation} degrees"
        }
        
    except Exception as e:
        logger.error(f"Error in rotateObject: {e}", exc_info=True)
        return {
            "success": False,
            "objectId": objectId,
            "message": f"Error rotating object: {str(e)}"
        }


def get_langchain_tools() -> list:
    """
    Get list of all LangChain tools for the agent.
    
    Returns:
        List of LangChain tool objects
    """
    return [
        create_rectangle,
        create_circle,
        create_text,
        move_object,
        resize_object,
        change_color,
        rotate_object,
    ]
