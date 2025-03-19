/**
 * File Operations Validator for Unified Agentic System
 * 
 * This module provides functionality to validate file operation requests against
 * the JSON schema defined for the system's file operations protocol.
 */

// Import required dependencies
const Ajv = require('ajv');
const addFormats = require('ajv-formats');
const schema = require('./file_operations_schema.json');

/**
 * Creates and configures the validator for file operations
 */
class FileOperationsValidator {
  constructor(options = {}) {
    this.options = {
      strictMode: true,
      logErrors: true,
      addCustomKeywords: true,
      ...options
    };
    
    // Initialize the validator
    this.ajv = new Ajv({
      allErrors: true,
      verbose: true,
      strictSchema: this.options.strictMode,
      strictTypes: this.options.strictMode
    });
    
    // Add support for date-time and other formats
    addFormats(this.ajv);
    
    // Add custom keywords if enabled
    if (this.options.addCustomKeywords) {
      this._addCustomKeywords();
    }
    
    // Compile the schema
    this.validate = this.ajv.compile(schema);
    
    // Additional operation-specific validators
    this.operationValidators = {
      write_file: this._createWriteFileValidator(),
      bulk_operation: this._createBulkOperationValidator(),
      apply_edits: this._createApplyEditsValidator()
    };
  }
  
  /**
   * Validates a file operation request against the schema
   * 
   * @param {Object} request - The file operation request to validate
   * @returns {Object} Validation result with isValid flag and any errors
   */
  validateRequest(request) {
    // Basic schema validation
    const isValid = this.validate(request);
    let errors = this.validate.errors ? [...this.validate.errors] : [];
    
    // If the basic validation passed and we have an operation-specific validator, run it
    if (isValid && request.operation && this.operationValidators[request.operation]) {
      const opValidationResult = this.operationValidators[request.operation](request);
      if (!opValidationResult.isValid) {
        errors = [...errors, ...opValidationResult.errors];
      }
    }
    
    // Log errors if enabled
    if (!isValid && this.options.logErrors) {
      console.error('File operation validation failed:', errors);
    }
    
    return {
      isValid: isValid && errors.length === 0,
      errors,
      request
    };
  }
  
  /**
   * Adds custom keywords to the validator
   * @private
   */
  _addCustomKeywords() {
    // Example custom keyword: pathExists
    this.ajv.addKeyword({
      keyword: 'pathExists',
      validate: function (schema, data) {
        // Simplified example - in a real implementation, this would check if the path exists
        if (schema === true && typeof data === 'string') {
          // Would actually perform filesystem check here
          return true;
        }
        return false;
      },
      errors: true
    });
    
    // Example custom keyword: isValidEncoding
    this.ajv.addKeyword({
      keyword: 'isValidEncoding',
      validate: function (schema, data) {
        if (schema === true && typeof data === 'string') {
          const validEncodings = ['utf8', 'ascii', 'binary', 'base64', 'hex', 'utf16le'];
          return validEncodings.includes(data);
        }
        return true;
      }
    });
  }
  
  /**
   * Creates a specialized validator for write_file operations
   * @private
   */
  _createWriteFileValidator() {
    return (request) => {
      const errors = [];
      const { parameters } = request;
      
      // Content size validation
      if (parameters.content && Buffer.byteLength(parameters.content, parameters.encoding || 'utf8') > 10 * 1024 * 1024) {
        errors.push({
          keyword: 'maxContentSize',
          message: 'Content exceeds maximum allowed size of 10MB',
          params: { limit: 10 * 1024 * 1024 }
        });
      }
      
      return { isValid: errors.length === 0, errors };
    };
  }
  
  /**
   * Creates a specialized validator for bulk_operation requests
   * @private
   */
  _createBulkOperationValidator() {
    return (request) => {
      const errors = [];
      const { parameters } = request;
      
      // Validate that operations don't have circular dependencies
      if (parameters.operations && parameters.operations.length > 1) {
        const sourcePaths = new Set();
        const destinationPaths = new Set();
        
        parameters.operations.forEach(op => {
          if (op.operation === 'copy_file' || op.operation === 'rename_file') {
            if (op.parameters.source_path) {
              sourcePaths.add(op.parameters.source_path);
            }
            if (op.parameters.destination_path) {
              destinationPaths.add(op.parameters.destination_path);
            }
          }
        });
        
        // Check for overlapping paths
        sourcePaths.forEach(path => {
          if (destinationPaths.has(path)) {
            errors.push({
              keyword: 'circularDependency',
              message: `Circular dependency detected for path: ${path}`,
              params: { path }
            });
          }
        });
      }
      
      return { isValid: errors.length === 0, errors };
    };
  }
  
  /**
   * Creates a specialized validator for apply_edits requests
   * @private
   */
  _createApplyEditsValidator() {
    return (request) => {
      const errors = [];
      const { parameters } = request;
      
      // Validate that edit ranges are properly ordered
      if (parameters.edits && parameters.edits.length > 0) {
        for (const edit of parameters.edits) {
          if (edit.type === 'replace' || edit.type === 'delete') {
            const { start, end } = edit.range;
            
            if (start && end) {
              // Check that start is before end
              if (start.line > end.line || (start.line === end.line && start.character > end.character)) {
                errors.push({
                  keyword: 'invalidRange',
                  message: 'Edit range start position must come before end position',
                  params: { range: edit.range }
                });
              }
            }
          }
        }
        
        // Check for overlapping ranges if not in reverse order
        if (!parameters.apply_in_reverse) {
          const sortedEdits = [...parameters.edits].sort((a, b) => {
            const startA = a.range.start;
            const startB = b.range.start;
            
            if (startA.line !== startB.line) {
              return startA.line - startB.line;
            }
            return startA.character - startB.character;
          });
          
          for (let i = 0; i < sortedEdits.length - 1; i++) {
            const current = sortedEdits[i];
            const next = sortedEdits[i + 1];
            
            if (current.range.end && next.range.start) {
              const currentEnd = current.range.end;
              const nextStart = next.range.start;
              
              if (currentEnd.line > nextStart.line || 
                  (currentEnd.line === nextStart.line && currentEnd.character > nextStart.character)) {
                errors.push({
                  keyword: 'overlappingEdits',
                  message: 'Detected overlapping edit ranges which can lead to unpredictable results',
                  params: { edits: [current, next] }
                });
                break; // Only report the first overlap
              }
            }
          }
        }
      }
      
      return { isValid: errors.length === 0, errors };
    };
  }
}

/**
 * Example usage of the FileOperationsValidator
 */
function demonstrateValidator() {
  const validator = new FileOperationsValidator({
    strictMode: true,
    logErrors: true
  });
  
  // Example 1: Valid read_file operation
  const readOp = {
    operation: "read_file",
    id: "read-op-1",
    timestamp: new Date().toISOString(),
    parameters: {
      file_path: "src/components/App.js",
      encoding: "utf8",
      start_line: 10,
      end_line: 20
    }
  };
  
  const readResult = validator.validateRequest(readOp);
  console.log('Read operation validation:', readResult.isValid ? 'VALID' : 'INVALID');
  
  // Example 2: Invalid write_file operation (missing required content)
  const writeOp = {
    operation: "write_file",
    id: "write-op-1",
    timestamp: new Date().toISOString(),
    parameters: {
      file_path: "src/utils/helpers.js",
      // Missing content property
      encoding: "utf8"
    }
  };
  
  const writeResult = validator.validateRequest(writeOp);
  console.log('Write operation validation:', writeResult.isValid ? 'VALID' : 'INVALID');
  
  // Example 3: Valid bulk_operation
  const bulkOp = {
    operation: "bulk_operation",
    id: "bulk-op-1",
    timestamp: new Date().toISOString(),
    parameters: {
      operations: [
        {
          operation: "create_directory",
          parameters: {
            directory_path: "src/components/forms"
          },
          id: "create-dir-1"
        },
        {
          operation: "copy_file",
          parameters: {
            source_path: "src/components/Form.jsx",
            destination_path: "src/components/forms/BasicForm.jsx"
          },
          id: "copy-1"
        }
      ],
      abort_on_error: true
    }
  };
  
  const bulkResult = validator.validateRequest(bulkOp);
  console.log('Bulk operation validation:', bulkResult.isValid ? 'VALID' : 'INVALID');
  
  // Example 4: Invalid apply_edits operation (overlapping edits)
  const editsOp = {
    operation: "apply_edits",
    id: "edit-op-1",
    timestamp: new Date().toISOString(),
    parameters: {
      file_path: "src/components/Button.jsx",
      edits: [
        {
          type: "replace",
          range: {
            start: { line: 10, character: 0 },
            end: { line: 15, character: 10 }
          },
          text: "// New implementation"
        },
        {
          type: "insert",
          range: {
            start: { line: 12, character: 5 } // This overlaps with the previous edit
          },
          text: "// This will cause a conflict"
        }
      ],
      apply_in_reverse: false
    }
  };
  
  const editsResult = validator.validateRequest(editsOp);
  console.log('Apply edits validation:', editsResult.isValid ? 'VALID' : 'INVALID');
  console.log('Errors:', editsResult.errors);
  
  return {
    readResult,
    writeResult,
    bulkResult,
    editsResult
  };
}

// Export the validator class and demonstration function
module.exports = {
  FileOperationsValidator,
  demonstrateValidator
}; 