/**
 * Comprehensive JSON Schema Validation Examples for Tool Management System
 * 
 * This file demonstrates various schema validation approaches for tool requests,
 * including basic validation, advanced conditional schemas, custom validation
 * functions, and dynamic schema generation.
 */

// Basic Tool Request Schema
const basicToolRequestSchema = {
  type: "object",
  required: ["toolName", "parameters"],
  properties: {
    toolName: {
      type: "string",
      enum: ["codeSearch", "syntaxAnalysis", "dependencyCheck", "securityScan", "performanceProfile"]
    },
    parameters: {
      type: "object"
    },
    executionOptions: {
      type: "object",
      properties: {
        priority: {
          type: "string",
          enum: ["low", "medium", "high"]
        },
        timeout: {
          type: "integer",
          minimum: 1000,
          maximum: 60000
        }
      }
    }
  }
};

// Tool-Specific Parameter Schemas
const toolParameterSchemas = {
  codeSearch: {
    type: "object",
    required: ["query"],
    properties: {
      query: { 
        type: "string",
        minLength: 2,
        maxLength: 100
      },
      filePatterns: {
        type: "array",
        items: { type: "string" }
      },
      caseSensitive: { type: "boolean" },
      maxResults: { 
        type: "integer",
        minimum: 1,
        maximum: 1000
      }
    }
  },
  
  syntaxAnalysis: {
    type: "object",
    required: ["targetFile"],
    properties: {
      targetFile: { type: "string" },
      analysisType: { 
        type: "string",
        enum: ["full", "errors", "warnings", "suggestions"]
      },
      includeLineNumbers: { type: "boolean" }
    }
  },
  
  dependencyCheck: {
    type: "object",
    required: ["targets"],
    properties: {
      targets: {
        oneOf: [
          { type: "string" },
          { 
            type: "array",
            items: { type: "string" }
          }
        ]
      },
      checkType: {
        type: "string",
        enum: ["direct", "recursive", "unused", "licenses"]
      },
      packageManager: {
        type: "string",
        enum: ["npm", "yarn", "pip", "maven", "gradle"]
      }
    }
  },
  
  securityScan: {
    type: "object",
    required: ["targetPath"],
    properties: {
      targetPath: { type: "string" },
      scanDepth: {
        type: "string",
        enum: ["shallow", "standard", "deep"]
      },
      vulnerabilityTypes: {
        type: "array",
        items: {
          type: "string",
          enum: ["injection", "authentication", "xss", "encryption", "configuration", "dependencies"]
        }
      },
      includeRemediation: { type: "boolean" }
    }
  },
  
  performanceProfile: {
    type: "object",
    required: ["targetComponent"],
    properties: {
      targetComponent: { type: "string" },
      iterations: {
        type: "integer",
        minimum: 1,
        maximum: 100
      },
      cpuProfiling: { type: "boolean" },
      memoryProfiling: { type: "boolean" },
      networkProfiling: { type: "boolean" },
      samplingRate: {
        type: "integer",
        minimum: 1,
        maximum: 1000
      }
    }
  }
};

// Advanced Conditional Schema
const conditionalToolRequestSchema = {
  type: "object",
  required: ["toolName", "parameters"],
  properties: {
    toolName: {
      type: "string",
      enum: ["codeSearch", "syntaxAnalysis", "dependencyCheck", "securityScan", "performanceProfile"]
    },
    parameters: {
      type: "object"
    },
    // Common properties shared across all tools
    executionContext: {
      type: "object",
      properties: {
        sessionId: { type: "string" },
        userId: { type: "string" },
        workspace: { type: "string" }
      }
    }
  },
  // Conditional schema validation based on toolName
  allOf: [
    {
      if: {
        properties: { toolName: { const: "codeSearch" } }
      },
      then: {
        properties: {
          parameters: toolParameterSchemas.codeSearch
        }
      }
    },
    {
      if: {
        properties: { toolName: { const: "syntaxAnalysis" } }
      },
      then: {
        properties: {
          parameters: toolParameterSchemas.syntaxAnalysis
        }
      }
    },
    {
      if: {
        properties: { toolName: { const: "dependencyCheck" } }
      },
      then: {
        properties: {
          parameters: toolParameterSchemas.dependencyCheck
        }
      }
    },
    {
      if: {
        properties: { toolName: { const: "securityScan" } }
      },
      then: {
        properties: {
          parameters: toolParameterSchemas.securityScan,
          securityCredentials: {
            type: "object",
            required: ["accessLevel"],
            properties: {
              accessLevel: {
                type: "string",
                enum: ["standard", "elevated"]
              },
              authToken: { type: "string" }
            }
          }
        },
        required: ["securityCredentials"]
      }
    },
    {
      if: {
        properties: { toolName: { const: "performanceProfile" } }
      },
      then: {
        properties: {
          parameters: toolParameterSchemas.performanceProfile,
          systemRequirements: {
            type: "object",
            properties: {
              minCpu: {
                type: "integer",
                minimum: 1
              },
              minMemory: {
                type: "integer",
                minimum: 512
              }
            }
          }
        }
      }
    }
  ]
};

// Schema with Dependencies and Property Dependencies
const schemaWithDependencies = {
  type: "object",
  required: ["toolName", "parameters"],
  properties: {
    toolName: {
      type: "string",
      enum: ["codeSearch", "syntaxAnalysis", "dependencyCheck", "securityScan", "performanceProfile"]
    },
    parameters: {
      type: "object"
    },
    executionOptions: {
      type: "object",
      properties: {
        isAsync: { type: "boolean" },
        priority: {
          type: "string",
          enum: ["low", "medium", "high"]
        },
        retryStrategy: {
          type: "string", 
          enum: ["none", "linear", "exponential"]
        },
        maxRetries: { type: "integer" },
        notifyOnCompletion: { type: "boolean" },
        notificationChannel: {
          type: "string",
          enum: ["email", "slack", "inApp"]
        },
        notificationRecipient: { type: "string" }
      },
      // Property dependencies - if certain properties are present, others must be too
      dependencies: {
        retryStrategy: {
          if: {
            properties: { retryStrategy: { enum: ["linear", "exponential"] } }
          },
          then: {
            required: ["maxRetries"]
          }
        },
        notifyOnCompletion: {
          if: {
            properties: { notifyOnCompletion: { const: true } }
          },
          then: {
            required: ["notificationChannel", "notificationRecipient"]
          }
        }
      }
    }
  }
};

// Compound Schema with Cross-Field Validation
const compoundSchemaWithCrossFieldValidation = {
  type: "object",
  required: ["toolName", "parameters", "executionOptions"],
  properties: {
    toolName: {
      type: "string",
      enum: ["codeSearch", "syntaxAnalysis", "dependencyCheck", "securityScan", "performanceProfile"]
    },
    parameters: {
      type: "object"
    },
    executionOptions: {
      type: "object",
      properties: {
        priority: {
          type: "string",
          enum: ["low", "medium", "high"]
        },
        timeout: {
          type: "integer",
          minimum: 1000,
          maximum: 60000
        },
        scheduledTime: {
          type: "string",
          format: "date-time"
        },
        executionWindow: {
          type: "object",
          properties: {
            start: {
              type: "string",
              format: "date-time"
            },
            end: {
              type: "string",
              format: "date-time"
            }
          },
          required: ["start", "end"]
        }
      }
    }
  },
  // Cross-field validation for scheduled execution windows
  allOf: [
    {
      if: {
        required: ["executionOptions"],
        properties: {
          executionOptions: {
            required: ["scheduledTime", "executionWindow"]
          }
        }
      },
      then: {
        // Custom validation to ensure scheduledTime is within executionWindow
        // This would be implemented in code, not just schema
        $comment: "scheduledTime must be within executionWindow boundaries"
      }
    },
    {
      if: {
        properties: {
          toolName: { const: "performanceProfile" },
          executionOptions: {
            properties: {
              priority: { const: "high" }
            }
          }
        }
      },
      then: {
        properties: {
          executionOptions: {
            properties: {
              timeout: {
                minimum: 5000
              }
            }
          }
        }
      }
    }
  ]
};

// Example of a schema for batch tool requests
const batchToolRequestSchema = {
  type: "object",
  required: ["batchId", "tools"],
  properties: {
    batchId: { type: "string" },
    description: { type: "string" },
    tools: {
      type: "array",
      minItems: 1,
      maxItems: 10,
      items: {
        type: "object",
        required: ["toolName", "parameters"],
        properties: {
          id: { type: "string" },
          toolName: {
            type: "string",
            enum: ["codeSearch", "syntaxAnalysis", "dependencyCheck", "securityScan", "performanceProfile"]
          },
          parameters: { type: "object" },
          dependsOn: {
            type: "array",
            items: { type: "string" }
          }
        }
      }
    },
    executionStrategy: {
      type: "string",
      enum: ["parallel", "sequential", "dependency-based"]
    },
    rollbackOnError: { type: "boolean" },
    timeout: {
      type: "integer",
      minimum: 5000,
      maximum: 300000
    }
  },
  // Add validation for dependency references
  // This would be implemented in code to ensure all dependsOn entries
  // refer to valid tool IDs within the same batch
  $comment: "Tool dependencies must reference valid tool IDs within the batch"
};

// Example of dynamically generating a schema based on available tools
function generateSchemaForAvailableTools(availableTools) {
  // Create a schema that only allows tools from the available set
  const toolNames = Object.keys(availableTools);
  
  // Build the conditional validation based on available tools
  const conditionalValidations = toolNames.map(toolName => {
    return {
      if: {
        properties: { toolName: { const: toolName } }
      },
      then: {
        properties: {
          parameters: availableTools[toolName].parameterSchema
        }
      }
    };
  });
  
  return {
    type: "object",
    required: ["toolName", "parameters"],
    properties: {
      toolName: {
        type: "string",
        enum: toolNames
      },
      parameters: {
        type: "object"
      }
    },
    allOf: conditionalValidations
  };
}

// Example of custom validation functions (to be used with a validator like Ajv)
const customValidations = {
  // Validate that the scheduled time is within the execution window
  validateScheduledTime: (schema, data) => {
    if (data.executionOptions?.scheduledTime && data.executionOptions?.executionWindow) {
      const scheduledTime = new Date(data.executionOptions.scheduledTime);
      const startTime = new Date(data.executionOptions.executionWindow.start);
      const endTime = new Date(data.executionOptions.executionWindow.end);
      
      if (scheduledTime < startTime || scheduledTime > endTime) {
        return false;
      }
    }
    return true;
  },
  
  // Validate that all dependencies in a batch request refer to valid tool IDs
  validateToolDependencies: (schema, data) => {
    if (!data.tools || !Array.isArray(data.tools)) {
      return true; // Nothing to validate
    }
    
    // Extract all tool IDs
    const toolIds = data.tools.map(tool => tool.id);
    
    // Check each tool's dependencies
    for (const tool of data.tools) {
      if (tool.dependsOn && Array.isArray(tool.dependsOn)) {
        for (const depId of tool.dependsOn) {
          if (!toolIds.includes(depId)) {
            return false; // Dependency refers to a non-existent tool
          }
        }
      }
    }
    
    return true;
  },
  
  // Validate file patterns to ensure they're valid glob patterns
  validateFilePatterns: (schema, data) => {
    if (data.parameters?.filePatterns && Array.isArray(data.parameters.filePatterns)) {
      // This would contain logic to validate glob patterns
      // For example, check for invalid characters, balanced brackets, etc.
      const globPatternRegex = /^[^<>:"|?*]*(?:\/[^<>:"|?*]*)*$/;
      
      for (const pattern of data.parameters.filePatterns) {
        if (!globPatternRegex.test(pattern)) {
          return false;
        }
      }
    }
    return true;
  }
};

// Example of schema evolution handling
const schemaVersions = {
  "1.0": basicToolRequestSchema,
  "2.0": conditionalToolRequestSchema,
  "3.0": compoundSchemaWithCrossFieldValidation
};

function getSchemaForVersion(version) {
  return schemaVersions[version] || schemaVersions["3.0"]; // Default to latest
}

// Example of schema for tool response validation
const toolResponseSchema = {
  type: "object",
  required: ["requestId", "toolName", "status", "timestamp"],
  properties: {
    requestId: { type: "string" },
    toolName: { type: "string" },
    status: { 
      type: "string",
      enum: ["success", "error", "partial", "cancelled", "timeout"]
    },
    timestamp: {
      type: "string",
      format: "date-time"
    },
    executionTime: {
      type: "integer",
      minimum: 0
    },
    result: {},
    error: {
      type: "object",
      properties: {
        code: { type: "string" },
        message: { type: "string" },
        details: {},
        recoverable: { type: "boolean" }
      }
    },
    warnings: {
      type: "array",
      items: {
        type: "object",
        properties: {
          code: { type: "string" },
          message: { type: "string" },
          severity: {
            type: "string",
            enum: ["low", "medium", "high"]
          }
        }
      }
    }
  },
  // Different properties are required based on status
  allOf: [
    {
      if: {
        properties: { status: { const: "success" } }
      },
      then: {
        required: ["result"]
      }
    },
    {
      if: {
        properties: { status: { const: "error" } }
      },
      then: {
        required: ["error"]
      }
    },
    {
      if: {
        properties: { status: { const: "partial" } }
      },
      then: {
        required: ["result", "warnings"]
      }
    }
  ]
};

// Example of using the schemas
const validateRequest = (request, schemaVersion = "3.0") => {
  // This would use a schema validator like Ajv
  const schema = getSchemaForVersion(schemaVersion);
  
  // Pseudo-code for validation
  // return ajv.validate(schema, request);
  
  // For demonstration, we'll just return a sample validation result
  return {
    valid: true,
    errors: null
  };
};

// Example requests
const validCodeSearchRequest = {
  toolName: "codeSearch",
  parameters: {
    query: "async function",
    filePatterns: ["src/**/*.js", "src/**/*.jsx"],
    caseSensitive: false,
    maxResults: 50
  },
  executionOptions: {
    priority: "medium",
    timeout: 10000
  }
};

const validSecurityScanWithCredentials = {
  toolName: "securityScan",
  parameters: {
    targetPath: "src/authentication/",
    scanDepth: "deep",
    vulnerabilityTypes: ["injection", "authentication", "encryption"],
    includeRemediation: true
  },
  securityCredentials: {
    accessLevel: "elevated",
    authToken: "sec_token_12345"
  },
  executionOptions: {
    priority: "high",
    timeout: 30000
  }
};

const batchRequestWithDependencies = {
  batchId: "security_and_performance_batch",
  description: "Combined security and performance analysis",
  tools: [
    {
      id: "security_scan_1",
      toolName: "securityScan",
      parameters: {
        targetPath: "src/api/",
        scanDepth: "standard",
        vulnerabilityTypes: ["injection", "authentication"]
      },
      securityCredentials: {
        accessLevel: "standard",
        authToken: "sec_token_67890"
      }
    },
    {
      id: "dependency_check_1",
      toolName: "dependencyCheck",
      parameters: {
        targets: "package.json",
        checkType: "recursive",
        packageManager: "npm"
      }
    },
    {
      id: "performance_profile_1",
      toolName: "performanceProfile",
      parameters: {
        targetComponent: "ApiClient",
        iterations: 10,
        cpuProfiling: true,
        memoryProfiling: true
      },
      dependsOn: ["security_scan_1", "dependency_check_1"]
    }
  ],
  executionStrategy: "dependency-based",
  rollbackOnError: false,
  timeout: 120000
};

// Export for usage
module.exports = {
  schemas: {
    basic: basicToolRequestSchema,
    conditional: conditionalToolRequestSchema,
    withDependencies: schemaWithDependencies,
    crossFieldValidation: compoundSchemaWithCrossFieldValidation,
    batch: batchToolRequestSchema,
    response: toolResponseSchema
  },
  toolParameterSchemas,
  utilities: {
    generateSchemaForAvailableTools,
    getSchemaForVersion,
    validateRequest
  },
  examples: {
    validCodeSearchRequest,
    validSecurityScanWithCredentials,
    batchRequestWithDependencies
  }
}; 