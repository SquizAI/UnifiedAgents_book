"""
Tool Registry Implementation Example

This file demonstrates a practical implementation of a Tool Registry system
as described in Chapter 4 of "Unified Agentic Systems: The Ultimate Guide to AI-Driven Tool Integration."

The Tool Registry serves as the central catalog of available tools that an agentic system
can utilize to perform tasks. It provides mechanisms for:
1. Tool registration and discovery
2. Schema validation
3. Permission management
4. Tool metadata management
"""

import json
import jsonschema
from typing import Dict, List, Optional, Any, Callable
import logging
from enum import Enum
from datetime import datetime
import uuid

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class ToolPermissionLevel(Enum):
    """Permission levels for tools to control access and risk."""
    SAFE = 0  # No system changes, read-only operations
    USER_CONFIRMED = 1  # Requires user confirmation before execution
    SYSTEM_CHANGE = 2  # Can make changes to the system
    ELEVATED = 3  # Can make significant system changes with elevated privileges


class ToolCategory(Enum):
    """Categories to organize tools by their primary function."""
    FILE_SYSTEM = "file_system"
    CODE_ANALYSIS = "code_analysis"
    CODE_GENERATION = "code_generation"
    CODE_MANIPULATION = "code_manipulation"
    EXTERNAL_SERVICE = "external_service"
    SYSTEM_COMMAND = "system_command"
    RESEARCH = "research"
    UTILITY = "utility"


class ToolRegistry:
    """
    Central registry for all tools available to the agentic system.
    
    Responsible for:
    - Maintaining a catalog of available tools
    - Validating tool schemas
    - Managing tool permissions
    - Providing discovery and search capabilities
    """
    
    def __init__(self):
        """Initialize the tool registry."""
        self._tools: Dict[str, Dict[str, Any]] = {}
        self._schema_validator = ToolSchemaValidator()
        logger.info("Tool Registry initialized")
    
    def register_tool(self, 
                     name: str,
                     description: str,
                     schema: Dict[str, Any],
                     handler_func: Callable,
                     category: ToolCategory,
                     permission_level: ToolPermissionLevel,
                     version: str = "1.0.0",
                     author: str = "System",
                     examples: List[Dict[str, Any]] = None) -> str:
        """
        Register a new tool in the registry.
        
        Args:
            name: Unique name of the tool
            description: Human-readable description of the tool's purpose
            schema: JSON schema defining the tool's input parameters
            handler_func: Function that implements the tool's functionality
            category: Category the tool belongs to
            permission_level: Required permission level to use this tool
            version: Tool version
            author: Tool author or maintainer
            examples: Example usage of the tool
            
        Returns:
            tool_id: Unique identifier for the registered tool
        """
        # Validate the tool schema
        self._schema_validator.validate_tool_schema(schema)
        
        # Generate a unique tool ID
        tool_id = str(uuid.uuid4())
        
        # Create the tool record
        tool_record = {
            "id": tool_id,
            "name": name,
            "description": description,
            "schema": schema,
            "handler": handler_func,
            "category": category.value,
            "permission_level": permission_level.value,
            "version": version,
            "author": author,
            "examples": examples or [],
            "registration_time": datetime.utcnow().isoformat(),
            "usage_count": 0,
            "average_execution_time_ms": 0,
            "is_enabled": True
        }
        
        # Store the tool in the registry
        self._tools[tool_id] = tool_record
        logger.info(f"Tool registered: {name} (ID: {tool_id})")
        
        return tool_id
    
    def get_tool(self, tool_id: str) -> Optional[Dict[str, Any]]:
        """
        Retrieve a tool by its ID.
        
        Args:
            tool_id: The unique identifier of the tool
            
        Returns:
            The tool record if found, None otherwise
        """
        tool = self._tools.get(tool_id)
        if tool:
            # Return a copy without the handler function
            tool_copy = tool.copy()
            tool_copy.pop("handler", None)
            return tool_copy
        return None
    
    def get_tool_handler(self, tool_id: str) -> Optional[Callable]:
        """
        Get the handler function for a tool.
        
        Args:
            tool_id: The unique identifier of the tool
            
        Returns:
            The handler function if the tool exists, None otherwise
        """
        tool = self._tools.get(tool_id)
        return tool.get("handler") if tool else None
    
    def list_tools(self, 
                  category: Optional[ToolCategory] = None, 
                  permission_level: Optional[ToolPermissionLevel] = None,
                  enabled_only: bool = True) -> List[Dict[str, Any]]:
        """
        List tools in the registry, optionally filtered by category and permission level.
        
        Args:
            category: Filter tools by category
            permission_level: Filter tools by maximum permission level
            enabled_only: Only include enabled tools
            
        Returns:
            List of tool records matching the filters
        """
        results = []
        
        for tool in self._tools.values():
            # Apply filters
            if enabled_only and not tool.get("is_enabled", True):
                continue
                
            if category and tool.get("category") != category.value:
                continue
                
            if permission_level and tool.get("permission_level", 0) > permission_level.value:
                continue
            
            # Create a copy without the handler function
            tool_copy = tool.copy()
            tool_copy.pop("handler", None)
            results.append(tool_copy)
            
        return results
    
    def search_tools(self, query: str) -> List[Dict[str, Any]]:
        """
        Search for tools by name or description.
        
        Args:
            query: Search query string
            
        Returns:
            List of tool records matching the search query
        """
        query = query.lower()
        results = []
        
        for tool in self._tools.values():
            # Simple search implementation
            if (query in tool.get("name", "").lower() or 
                query in tool.get("description", "").lower()):
                
                # Create a copy without the handler function
                tool_copy = tool.copy()
                tool_copy.pop("handler", None)
                results.append(tool_copy)
                
        return results
    
    def update_tool_metadata(self, tool_id: str, metadata: Dict[str, Any]) -> bool:
        """
        Update metadata for a registered tool.
        
        Args:
            tool_id: The unique identifier of the tool
            metadata: Dictionary of metadata fields to update
            
        Returns:
            True if the update was successful, False otherwise
        """
        if tool_id not in self._tools:
            logger.warning(f"Cannot update metadata: Tool not found (ID: {tool_id})")
            return False
            
        # Prevent updating critical fields
        protected_fields = {"id", "handler", "registration_time"}
        update_fields = {k: v for k, v in metadata.items() if k not in protected_fields}
        
        # Update the tool record
        self._tools[tool_id].update(update_fields)
        logger.info(f"Tool metadata updated: {tool_id}")
        
        return True
    
    def disable_tool(self, tool_id: str) -> bool:
        """
        Disable a tool in the registry.
        
        Args:
            tool_id: The unique identifier of the tool
            
        Returns:
            True if the tool was disabled, False otherwise
        """
        if tool_id not in self._tools:
            return False
            
        self._tools[tool_id]["is_enabled"] = False
        logger.info(f"Tool disabled: {tool_id}")
        
        return True
    
    def enable_tool(self, tool_id: str) -> bool:
        """
        Enable a previously disabled tool.
        
        Args:
            tool_id: The unique identifier of the tool
            
        Returns:
            True if the tool was enabled, False otherwise
        """
        if tool_id not in self._tools:
            return False
            
        self._tools[tool_id]["is_enabled"] = True
        logger.info(f"Tool enabled: {tool_id}")
        
        return True
    
    def record_tool_usage(self, tool_id: str, execution_time_ms: float) -> None:
        """
        Record usage metrics for a tool.
        
        Args:
            tool_id: The unique identifier of the tool
            execution_time_ms: Execution time in milliseconds
        """
        if tool_id not in self._tools:
            return
            
        tool = self._tools[tool_id]
        
        # Update usage count
        usage_count = tool["usage_count"] + 1
        
        # Update average execution time
        current_avg = tool["average_execution_time_ms"]
        new_avg = ((current_avg * (usage_count - 1)) + execution_time_ms) / usage_count
        
        # Store updated metrics
        tool["usage_count"] = usage_count
        tool["average_execution_time_ms"] = new_avg
        tool["last_used"] = datetime.utcnow().isoformat()


class ToolSchemaValidator:
    """
    Validates tool schemas against the required format.
    Ensures that all tools have consistent and properly formed schemas.
    """
    
    def __init__(self):
        """Initialize the schema validator with the meta-schema for tool definitions."""
        # Meta-schema defining what a valid tool schema looks like
        self.tool_meta_schema = {
            "type": "object",
            "required": ["properties"],
            "properties": {
                "type": {"type": "string", "enum": ["object"]},
                "required": {
                    "type": "array",
                    "items": {"type": "string"}
                },
                "properties": {
                    "type": "object",
                    "additionalProperties": {
                        "type": "object",
                        "required": ["type", "description"],
                        "properties": {
                            "type": {"type": "string"},
                            "description": {"type": "string"},
                            "enum": {
                                "type": "array"
                            },
                            "format": {"type": "string"},
                            "default": {},
                            "minimum": {"type": "number"},
                            "maximum": {"type": "number"},
                            "minLength": {"type": "integer"},
                            "maxLength": {"type": "integer"},
                            "pattern": {"type": "string"}
                        }
                    }
                }
            }
        }
    
    def validate_tool_schema(self, schema: Dict[str, Any]) -> bool:
        """
        Validate that a tool schema conforms to the required format.
        
        Args:
            schema: The tool schema to validate
            
        Returns:
            True if valid
            
        Raises:
            jsonschema.exceptions.ValidationError: If the schema is invalid
        """
        jsonschema.validate(schema, self.tool_meta_schema)
        logger.debug("Tool schema validated successfully")
        return True


# Example tool handler functions
def search_code(query: str, file_types: List[str] = None, max_results: int = 10) -> Dict[str, Any]:
    """Example tool handler for code search functionality."""
    # Implementation would connect to actual code search backend
    return {
        "status": "success",
        "results_count": 3,
        "results": [
            {"file": "example.py", "line": 10, "snippet": "def example_function():"},
            {"file": "main.py", "line": 25, "snippet": "result = search_code(query)"},
            {"file": "utils.py", "line": 42, "snippet": "# This is an example comment"}
        ]
    }

# Example usage
if __name__ == "__main__":
    # Create a tool registry
    registry = ToolRegistry()
    
    # Register a search tool
    search_tool_id = registry.register_tool(
        name="code_search",
        description="Search code files for specific patterns or text",
        schema={
            "type": "object",
            "required": ["query"],
            "properties": {
                "query": {
                    "type": "string",
                    "description": "The search query"
                },
                "file_types": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "List of file extensions to search (e.g., '.py', '.js')"
                },
                "max_results": {
                    "type": "integer",
                    "description": "Maximum number of results to return",
                    "default": 10,
                    "minimum": 1,
                    "maximum": 100
                }
            }
        },
        handler_func=search_code,
        category=ToolCategory.CODE_ANALYSIS,
        permission_level=ToolPermissionLevel.SAFE,
        examples=[
            {
                "description": "Search for function definitions",
                "parameters": {
                    "query": "def ",
                    "file_types": [".py"],
                    "max_results": 5
                }
            }
        ]
    )
    
    # List all available tools
    tools = registry.list_tools()
    print(f"Found {len(tools)} tools in the registry")
    
    # Get a specific tool
    tool = registry.get_tool(search_tool_id)
    print(f"Tool details: {json.dumps(tool, indent=2)}")
    
    # Simulate tool usage
    handler = registry.get_tool_handler(search_tool_id)
    if handler:
        result = handler(query="function", file_types=[".py"], max_results=5)
        print(f"Search results: {json.dumps(result, indent=2)}")
        
        # Record usage metrics
        registry.record_tool_usage(search_tool_id, 150.5)  # 150.5ms execution time
        
        # Get updated tool details
        updated_tool = registry.get_tool(search_tool_id)
        print(f"Usage count: {updated_tool['usage_count']}")
        print(f"Average execution time: {updated_tool['average_execution_time_ms']:.2f}ms")
