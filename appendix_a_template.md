# Appendix A: JSON Schema Reference

This appendix provides comprehensive JSON schema definitions for the key components of unified agentic systems discussed throughout the book. These schemas serve as both reference material and practical templates for implementing your own agentic frameworks.

## Table of Contents

1. [Core Schemas](#core-schemas)
   - [Request Schema](#request-schema)
   - [Response Schema](#response-schema)
   - [Error Schema](#error-schema)
2. [Tool Integration](#tool-integration)
   - [Tool Definition Schema](#tool-definition-schema)
   - [Tool Invocation Schema](#tool-invocation-schema)
   - [Tool Result Schema](#tool-result-schema)
3. [Context and Memory](#context-and-memory)
   - [Session Schema](#session-schema)
   - [Memory Entry Schema](#memory-entry-schema)
   - [Context Model Schema](#context-model-schema)
4. [Resource Access](#resource-access)
   - [File System Operation Schema](#file-system-operation-schema)
   - [Environment Access Schema](#environment-access-schema)
   - [Network Request Schema](#network-request-schema)
5. [Execution Management](#execution-management)
   - [Execution Plan Schema](#execution-plan-schema)
   - [Pipeline Definition Schema](#pipeline-definition-schema)
   - [Decision Tree Schema](#decision-tree-schema)

## Core Schemas

### Request Schema

The Request Schema defines the structure of incoming user requests to the agentic system.

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "https://unifiedagents.org/schemas/request.json",
  "title": "AgentRequest",
  "description": "Schema for user requests to the agentic system",
  "type": "object",
  "required": ["id", "timestamp", "input"],
  "properties": {
    "id": {
      "type": "string",
      "description": "Unique identifier for the request",
      "pattern": "^req-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$"
    },
    "timestamp": {
      "type": "string",
      "format": "date-time",
      "description": "ISO 8601 timestamp of when the request was created"
    },
    "input": {
      "type": "string",
      "description": "The natural language input from the user",
      "minLength": 1
    },
    "session_id": {
      "type": "string",
      "description": "Identifier for the user's session, used for context retrieval",
      "pattern": "^sess-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$"
    },
    "user_id": {
      "type": "string",
      "description": "Identifier for the user making the request"
    },
    "metadata": {
      "type": "object",
      "description": "Additional metadata about the request context",
      "properties": {
        "environment": {
          "type": "object",
          "description": "Information about the user's development environment",
          "properties": {
            "editor": {
              "type": "string",
              "description": "The user's code editor or IDE"
            },
            "open_files": {
              "type": "array",
              "description": "List of files currently open in the editor",
              "items": {
                "type": "string"
              }
            },
            "cursor_position": {
              "type": "object",
              "description": "The current position of the cursor",
              "properties": {
                "file": {
                  "type": "string"
                },
                "line": {
                  "type": "integer"
                },
                "column": {
                  "type": "integer"
                }
              }
            }
          }
        },
        "project": {
          "type": "object",
          "description": "Information about the user's project",
          "properties": {
            "name": {
              "type": "string"
            },
            "root_directory": {
              "type": "string"
            },
            "language": {
              "type": "string"
            },
            "framework": {
              "type": "string"
            }
          }
        }
      }
    }
  }
}
```

### Response Schema

The Response Schema defines the structure of the agentic system's responses to user requests.

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "https://unifiedagents.org/schemas/response.json",
  "title": "AgentResponse",
  "description": "Schema for responses from the agentic system",
  "type": "object",
  "required": ["id", "request_id", "timestamp", "content"],
  "properties": {
    "id": {
      "type": "string",
      "description": "Unique identifier for the response",
      "pattern": "^resp-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$"
    },
    "request_id": {
      "type": "string",
      "description": "Identifier of the request this is responding to",
      "pattern": "^req-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$"
    },
    "timestamp": {
      "type": "string",
      "format": "date-time",
      "description": "ISO 8601 timestamp of when the response was created"
    },
    "content": {
      "type": "string",
      "description": "The natural language response to the user"
    },
    "actions": {
      "type": "array",
      "description": "Actions taken by the system in response to the request",
      "items": {
        "type": "object",
        "required": ["action_type", "timestamp"],
        "properties": {
          "action_type": {
            "type": "string",
            "description": "Type of action taken",
            "enum": ["file_edit", "file_create", "command_execution", "search", "visualization"]
          },
          "timestamp": {
            "type": "string",
            "format": "date-time",
            "description": "When the action was performed"
          },
          "details": {
            "type": "object",
            "description": "Action-specific details"
          }
        }
      }
    },
    "metadata": {
      "type": "object",
      "description": "Additional metadata about the response",
      "properties": {
        "execution_time_ms": {
          "type": "integer",
          "description": "Total time to process the request in milliseconds"
        },
        "tools_used": {
          "type": "array",
          "description": "List of tools used to generate the response",
          "items": {
            "type": "string"
          }
        }
      }
    }
  }
}
```

### Error Schema

The Error Schema defines the structure of error responses from the agentic system.

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "https://unifiedagents.org/schemas/error.json",
  "title": "AgentError",
  "description": "Schema for error responses from the agentic system",
  "type": "object",
  "required": ["error_id", "request_id", "timestamp", "error_type", "user_message"],
  "properties": {
    "error_id": {
      "type": "string",
      "description": "Unique identifier for the error",
      "pattern": "^err-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$"
    },
    "request_id": {
      "type": "string",
      "description": "Identifier of the request that resulted in this error",
      "pattern": "^req-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$"
    },
    "timestamp": {
      "type": "string",
      "format": "date-time",
      "description": "ISO 8601 timestamp of when the error occurred"
    },
    "error_type": {
      "type": "string",
      "description": "Categorization of the error",
      "enum": [
        "input_error",
        "execution_error",
        "resource_error",
        "permission_error",
        "timeout_error",
        "system_error"
      ]
    },
    "error_code": {
      "type": "string",
      "description": "Specific error code for more detailed categorization"
    },
    "user_message": {
      "type": "string",
      "description": "User-friendly error message"
    },
    "technical_details": {
      "type": "object",
      "description": "Technical information about the error (for debugging)"
    },
    "recommended_actions": {
      "type": "array",
      "description": "Suggested actions to resolve the error",
      "items": {
        "type": "object",
        "required": ["description", "action_type"],
        "properties": {
          "description": {
            "type": "string",
            "description": "Description of the recommended action"
          },
          "action_type": {
            "type": "string",
            "description": "Type of action being recommended",
            "enum": ["user_action", "system_retry", "alternative_approach", "contact_support"]
          },
          "details": {
            "type": "object",
            "description": "Additional details about the recommended action"
          }
        }
      }
    }
  }
}
```

## Tool Integration

### Tool Definition Schema

The Tool Definition Schema specifies how tools are registered with the agentic system.

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "https://unifiedagents.org/schemas/tool-definition.json",
  "title": "ToolDefinition",
  "description": "Schema for defining tools available to the agentic system",
  "type": "object",
  "required": ["id", "name", "description", "parameters", "result_schema"],
  "properties": {
    "id": {
      "type": "string",
      "description": "Unique identifier for the tool",
      "pattern": "^tool-[a-z0-9-]+$"
    },
    "name": {
      "type": "string",
      "description": "Human-readable name for the tool"
    },
    "description": {
      "type": "string",
      "description": "Detailed description of what the tool does and when to use it"
    },
    "parameters": {
      "type": "object",
      "description": "Parameters that the tool accepts",
      "additionalProperties": {
        "type": "object",
        "required": ["type", "description"],
        "properties": {
          "type": {
            "type": "string",
            "description": "Data type of the parameter",
            "enum": ["string", "number", "integer", "boolean", "array", "object"]
          },
          "description": {
            "type": "string",
            "description": "Description of the parameter"
          },
          "required": {
            "type": "boolean",
            "description": "Whether the parameter is required",
            "default": false
          },
          "default": {
            "description": "Default value if parameter is not provided"
          },
          "enum": {
            "type": "array",
            "description": "List of allowed values for the parameter"
          }
        }
      }
    },
    "result_schema": {
      "type": "object",
      "description": "JSON Schema for the tool's result"
    },
    "examples": {
      "type": "array",
      "description": "Example invocations of the tool",
      "items": {
        "type": "object",
        "required": ["input", "output"],
        "properties": {
          "input": {
            "type": "object",
            "description": "Example input parameters"
          },
          "output": {
            "description": "Example output result"
          }
        }
      }
    },
    "permission_level": {
      "type": "string",
      "description": "Permission level required to use this tool",
      "enum": ["user", "system", "admin"],
      "default": "user"
    },
    "rate_limit": {
      "type": "object",
      "description": "Rate limiting configuration for the tool",
      "properties": {
        "requests_per_minute": {
          "type": "integer",
          "description": "Maximum number of requests allowed per minute"
        },
        "burst": {
          "type": "integer",
          "description": "Maximum burst size for requests"
        }
      }
    }
  }
}
```

## Context and Memory

### Memory Entry Schema

The Memory Entry Schema defines how information is stored in the system's long-term memory.

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "https://unifiedagents.org/schemas/memory-entry.json",
  "title": "MemoryEntry",
  "description": "Schema for entries in the system's long-term memory",
  "type": "object",
  "required": ["id", "title", "content", "created_at", "tags"],
  "properties": {
    "id": {
      "type": "string",
      "description": "Unique identifier for the memory entry",
      "pattern": "^mem-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$"
    },
    "title": {
      "type": "string",
      "description": "Brief title summarizing the memory"
    },
    "content": {
      "type": "string",
      "description": "The actual content of the memory"
    },
    "created_at": {
      "type": "string",
      "format": "date-time",
      "description": "When the memory was initially created"
    },
    "updated_at": {
      "type": "string",
      "format": "date-time",
      "description": "When the memory was last updated"
    },
    "tags": {
      "type": "array",
      "description": "Tags for categorizing and retrieving memories",
      "items": {
        "type": "string"
      },
      "minItems": 1
    },
    "metadata": {
      "type": "object",
      "description": "Additional metadata about the memory",
      "properties": {
        "source": {
          "type": "string",
          "description": "Source of the memory (e.g., 'user_statement', 'system_observation')"
        },
        "associated_files": {
          "type": "array",
          "description": "Files associated with this memory",
          "items": {
            "type": "string"
          }
        },
        "importance": {
          "type": "integer",
          "description": "Importance ranking from 1 (low) to 10 (high)",
          "minimum": 1,
          "maximum": 10
        }
      }
    },
    "related_memories": {
      "type": "array",
      "description": "IDs of related memory entries",
      "items": {
        "type": "string",
        "pattern": "^mem-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$"
      }
    }
  }
}
```

## Execution Management

### Execution Plan Schema

The Execution Plan Schema defines how complex operations are planned and executed by the system.

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "https://unifiedagents.org/schemas/execution-plan.json",
  "title": "ExecutionPlan",
  "description": "Schema for planning the execution of complex operations",
  "type": "object",
  "required": ["id", "request_id", "steps"],
  "properties": {
    "id": {
      "type": "string",
      "description": "Unique identifier for the execution plan",
      "pattern": "^plan-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$"
    },
    "request_id": {
      "type": "string",
      "description": "ID of the request this plan is for",
      "pattern": "^req-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$"
    },
    "created_at": {
      "type": "string",
      "format": "date-time",
      "description": "When the plan was created"
    },
    "steps": {
      "type": "array",
      "description": "Ordered steps in the execution plan",
      "items": {
        "type": "object",
        "required": ["id", "tool", "parameters"],
        "properties": {
          "id": {
            "type": "string",
            "description": "Identifier for this step",
            "pattern": "^step-[0-9]{3}$"
          },
          "name": {
            "type": "string",
            "description": "Descriptive name for the step"
          },
          "tool": {
            "type": "string",
            "description": "ID of the tool to execute"
          },
          "parameters": {
            "type": "object",
            "description": "Parameters to pass to the tool"
          },
          "dependencies": {
            "type": "array",
            "description": "IDs of steps that must complete before this step",
            "items": {
              "type": "string",
              "pattern": "^step-[0-9]{3}$"
            }
          },
          "condition": {
            "type": "object",
            "description": "Condition that must be met for this step to execute",
            "properties": {
              "type": {
                "type": "string",
                "description": "Type of condition",
                "enum": ["step_success", "step_failure", "expression"]
              },
              "step_id": {
                "type": "string",
                "description": "Step ID this condition depends on"
              },
              "expression": {
                "type": "string",
                "description": "Expression to evaluate"
              }
            }
          },
          "retry": {
            "type": "object",
            "description": "Retry configuration for this step",
            "properties": {
              "max_attempts": {
                "type": "integer",
                "description": "Maximum number of retry attempts",
                "minimum": 1
              },
              "delay_ms": {
                "type": "integer",
                "description": "Delay between retries in milliseconds",
                "minimum": 0
              }
            }
          },
          "timeout_ms": {
            "type": "integer",
            "description": "Maximum execution time in milliseconds",
            "minimum": 0
          }
        }
      },
      "minItems": 1
    },
    "error_handling": {
      "type": "object",
      "description": "Global error handling strategy",
      "properties": {
        "on_step_failure": {
          "type": "string",
          "description": "Action to take when a step fails",
          "enum": ["abort_plan", "continue_plan", "execute_fallback"]
        },
        "fallback_plan_id": {
          "type": "string",
          "description": "ID of fallback plan to execute on failure"
        }
      }
    },
    "metadata": {
      "type": "object",
      "description": "Additional metadata about the execution plan"
    }
  }
}
```

---

*Note: These schema definitions are provided as reference implementations. In production environments, you should adapt these schemas to your specific requirements and carefully consider security implications.*
