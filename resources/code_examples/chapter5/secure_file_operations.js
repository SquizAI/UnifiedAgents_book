/**
 * Secure File Operation Protocols for Unified Agentic Systems
 * 
 * This example demonstrates secure, robust file operations with permission models,
 * sandboxing, transactional capabilities, and detailed auditing.
 */

// Utility for secure path manipulation and validation
const SecurePath = {
  /**
   * Normalize and validate a path to prevent path traversal attacks
   */
  normalize(path, workspacePath) {
    const normalized = path.replace(/\\/g, '/').replace(/\/\.\//g, '/').replace(/\/+/g, '/');
    
    // Prevent path traversal attacks
    if (normalized.includes('..')) {
      throw new Error('Path traversal attempt detected');
    }
    
    // Ensure the path stays within the workspace
    const absolute = normalized.startsWith('/') 
      ? normalized 
      : `${workspacePath}/${normalized}`;
      
    if (!absolute.startsWith(workspacePath)) {
      throw new Error('Access attempt outside workspace boundary');
    }
    
    return absolute;
  },
  
  /**
   * Validates file extension against an allowed list
   */
  validateExtension(path, allowedExtensions) {
    if (!allowedExtensions || allowedExtensions.length === 0) {
      return true;
    }
    
    const extension = path.split('.').pop().toLowerCase();
    return allowedExtensions.includes(extension);
  }
};

// Permission manager to enforce access controls
class PermissionManager {
  constructor(config) {
    this.config = config || {
      readOnly: false,
      allowedDirectories: [],
      forbiddenDirectories: ['node_modules', '.git'],
      allowedExtensions: [],
      forbiddenExtensions: ['exe', 'dll', 'sh', 'bat'],
      maxFileSize: 10 * 1024 * 1024, // 10MB
    };
    
    this.workspacePath = config.workspacePath || '/workspace';
  }
  
  /**
   * Check if the operation is permitted
   */
  checkPermission(operation, path, options = {}) {
    const normalizedPath = SecurePath.normalize(path, this.workspacePath);
    
    // Check for read-only mode
    if (this.config.readOnly && (operation === 'write' || operation === 'delete')) {
      throw new Error('System is in read-only mode');
    }
    
    // Check forbidden directories
    for (const dir of this.config.forbiddenDirectories) {
      if (normalizedPath.includes(`/${dir}/`) || normalizedPath.endsWith(`/${dir}`)) {
        throw new Error(`Access to ${dir} directory is forbidden`);
      }
    }
    
    // Check allowed directories if specified
    if (this.config.allowedDirectories.length > 0) {
      const allowed = this.config.allowedDirectories.some(dir => 
        normalizedPath.includes(`/${dir}/`) || normalizedPath.endsWith(`/${dir}`)
      );
      
      if (!allowed) {
        throw new Error('Path is outside allowed directories');
      }
    }
    
    // Check file extensions for write operations
    if (operation === 'write') {
      // Check forbidden extensions
      if (!SecurePath.validateExtension(normalizedPath, null, this.config.forbiddenExtensions)) {
        throw new Error('Writing to this file type is forbidden');
      }
      
      // Check allowed extensions if specified
      if (this.config.allowedExtensions.length > 0) {
        if (!SecurePath.validateExtension(normalizedPath, this.config.allowedExtensions)) {
          throw new Error('Writing to this file type is not allowed');
        }
      }
      
      // Check file size for write operations
      if (options.content && options.content.length > this.config.maxFileSize) {
        throw new Error(`File size exceeds maximum allowed (${this.config.maxFileSize} bytes)`);
      }
    }
    
    return {
      allowed: true,
      normalizedPath,
      riskLevel: this.assessRiskLevel(operation, normalizedPath)
    };
  }
  
  /**
   * Assess the risk level of an operation
   */
  assessRiskLevel(operation, path) {
    // Higher risk for operations in sensitive directories
    if (path.includes('/config/') || path.includes('/security/')) {
      return 'high';
    }
    
    // Higher risk for delete operations
    if (operation === 'delete') {
      return 'high';
    }
    
    // Higher risk for writing to system files
    if (operation === 'write' && 
        (path.endsWith('package.json') || 
         path.endsWith('tsconfig.json') || 
         path.includes('/webpack.config'))) {
      return 'high';
    }
    
    // Default risk level
    return 'normal';
  }
}

// Audit logger for file operations
class AuditLogger {
  constructor(options = {}) {
    this.options = {
      logToFile: true,
      logFilePath: '/var/log/agent-file-operations.log',
      consoleLog: false,
      detailedLogs: true,
      ...options
    };
    
    this.logs = [];
  }
  
  /**
   * Log a file operation
   */
  logOperation(operation) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      operation: operation.type,
      path: operation.path,
      user: operation.user || 'agent',
      result: operation.result,
      duration: operation.duration,
      metadata: this.options.detailedLogs ? operation.metadata : undefined
    };
    
    this.logs.push(logEntry);
    
    if (this.options.consoleLog) {
      console.log(`[FileOperation] ${JSON.stringify(logEntry)}`);
    }
    
    if (this.options.logToFile) {
      this.writeToLogFile(logEntry);
    }
    
    return logEntry;
  }
  
  /**
   * Write log entry to file (mock implementation)
   */
  writeToLogFile(logEntry) {
    // In a real implementation, this would write to the log file
    console.log(`[MockFileLog] Writing to ${this.options.logFilePath}`);
  }
  
  /**
   * Get recent logs for a specific path
   */
  getLogsForPath(path, limit = 10) {
    return this.logs
      .filter(log => log.path === path)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit);
  }
}

// Sandbox for risky file operations
class OperationSandbox {
  constructor() {
    this.tempDirectory = '/tmp/agent-sandbox';
  }
  
  /**
   * Execute operation in sandbox environment
   */
  async executeInSandbox(operation, content = null) {
    console.log(`[Sandbox] Executing ${operation.type} on ${operation.path} in sandbox`);
    
    // In a real implementation, this would:
    // 1. Create a temporary copy of the file in a sandbox directory
    // 2. Perform the operation on the copy
    // 3. Validate the results before applying to the real file
    
    // Mock implementation for demonstration
    return {
      success: true,
      sandboxPath: `${this.tempDirectory}/${operation.path.split('/').pop()}`,
      validationResult: {
        safe: true,
        warnings: []
      }
    };
  }
}

// Transaction manager for atomic operations
class TransactionManager {
  constructor() {
    this.activeTransactions = new Map();
    this.transactionId = 0;
  }
  
  /**
   * Begin a new transaction
   */
  beginTransaction() {
    const txId = `tx-${Date.now()}-${this.transactionId++}`;
    
    this.activeTransactions.set(txId, {
      id: txId,
      operations: [],
      status: 'active',
      startTime: Date.now(),
      backups: new Map()
    });
    
    console.log(`[Transaction] Started transaction ${txId}`);
    return txId;
  }
  
  /**
   * Add operation to a transaction
   */
  addOperation(txId, operation) {
    const transaction = this.activeTransactions.get(txId);
    
    if (!transaction) {
      throw new Error(`Transaction ${txId} does not exist`);
    }
    
    if (transaction.status !== 'active') {
      throw new Error(`Transaction ${txId} is not active (status: ${transaction.status})`);
    }
    
    transaction.operations.push(operation);
    
    // For write/delete operations, create backup if file exists
    if ((operation.type === 'write' || operation.type === 'delete') && this.fileExists(operation.path)) {
      const backupPath = `${operation.path}.${txId}.bak`;
      this.createBackup(operation.path, backupPath);
      transaction.backups.set(operation.path, backupPath);
    }
    
    return true;
  }
  
  /**
   * Mock file existence check
   */
  fileExists(path) {
    // In a real implementation, this would check if the file exists
    return true;
  }
  
  /**
   * Create backup of a file (mock implementation)
   */
  createBackup(sourcePath, backupPath) {
    console.log(`[Transaction] Creating backup of ${sourcePath} at ${backupPath}`);
    // In a real implementation, this would copy the file
  }
  
  /**
   * Commit a transaction
   */
  async commitTransaction(txId) {
    const transaction = this.activeTransactions.get(txId);
    
    if (!transaction) {
      throw new Error(`Transaction ${txId} does not exist`);
    }
    
    if (transaction.status !== 'active') {
      throw new Error(`Transaction ${txId} is not active (status: ${transaction.status})`);
    }
    
    console.log(`[Transaction] Committing transaction ${txId} with ${transaction.operations.length} operations`);
    
    // In a real implementation, this would:
    // 1. Verify all operations are still valid
    // 2. Perform any final consistency checks
    // 3. Clean up backup files if successful
    
    transaction.status = 'committed';
    transaction.commitTime = Date.now();
    
    // Clean up backups
    for (const backupPath of transaction.backups.values()) {
      this.removeBackup(backupPath);
    }
    
    return {
      id: txId,
      status: 'committed',
      operationCount: transaction.operations.length,
      duration: transaction.commitTime - transaction.startTime
    };
  }
  
  /**
   * Rollback a transaction
   */
  async rollbackTransaction(txId) {
    const transaction = this.activeTransactions.get(txId);
    
    if (!transaction) {
      throw new Error(`Transaction ${txId} does not exist`);
    }
    
    console.log(`[Transaction] Rolling back transaction ${txId}`);
    
    // Restore from backups
    for (const [originalPath, backupPath] of transaction.backups.entries()) {
      this.restoreFromBackup(backupPath, originalPath);
    }
    
    transaction.status = 'rolled_back';
    transaction.rollbackTime = Date.now();
    
    return {
      id: txId,
      status: 'rolled_back',
      operationCount: transaction.operations.length,
      duration: transaction.rollbackTime - transaction.startTime
    };
  }
  
  /**
   * Restore file from backup (mock implementation)
   */
  restoreFromBackup(backupPath, originalPath) {
    console.log(`[Transaction] Restoring ${originalPath} from backup ${backupPath}`);
    // In a real implementation, this would restore the file
  }
  
  /**
   * Remove backup file (mock implementation)
   */
  removeBackup(backupPath) {
    console.log(`[Transaction] Removing backup ${backupPath}`);
    // In a real implementation, this would delete the backup file
  }
}

// Main file operation manager
class SecureFileOperationManager {
  constructor(options = {}) {
    this.permissionManager = new PermissionManager(options.permissions);
    this.auditLogger = new AuditLogger(options.audit);
    this.sandbox = new OperationSandbox();
    this.transactionManager = new TransactionManager();
  }
  
  /**
   * Read a file securely
   */
  async readFile(path) {
    const startTime = Date.now();
    const operationId = `read-${Date.now()}`;
    
    try {
      // Check permissions
      const permissionCheck = this.permissionManager.checkPermission('read', path);
      
      // Mock file read
      const content = `Mock content for ${permissionCheck.normalizedPath}`;
      
      // Log the operation
      this.auditLogger.logOperation({
        id: operationId,
        type: 'read',
        path: permissionCheck.normalizedPath,
        result: 'success',
        duration: Date.now() - startTime,
        metadata: {
          size: content.length,
          permissionLevel: permissionCheck.riskLevel
        }
      });
      
      return {
        success: true,
        path: permissionCheck.normalizedPath,
        content,
        operation: operationId
      };
    } catch (error) {
      // Log the failed operation
      this.auditLogger.logOperation({
        id: operationId,
        type: 'read',
        path,
        result: 'error',
        duration: Date.now() - startTime,
        metadata: {
          error: error.message
        }
      });
      
      throw error;
    }
  }
  
  /**
   * Write to a file securely
   */
  async writeFile(path, content, options = {}) {
    const startTime = Date.now();
    const operationId = `write-${Date.now()}`;
    
    try {
      // Check permissions with content size check
      const permissionCheck = this.permissionManager.checkPermission('write', path, { content });
      
      let result;
      
      // For high-risk operations, use sandbox
      if (permissionCheck.riskLevel === 'high') {
        const sandboxResult = await this.sandbox.executeInSandbox({
          type: 'write',
          path: permissionCheck.normalizedPath,
          content
        });
        
        if (!sandboxResult.safe) {
          throw new Error('Operation failed sandbox validation');
        }
        
        // Mock actual write after sandbox validation
        result = { success: true, sandboxValidated: true };
      } else {
        // Mock normal write
        result = { success: true };
      }
      
      // Log the operation
      this.auditLogger.logOperation({
        id: operationId,
        type: 'write',
        path: permissionCheck.normalizedPath,
        result: 'success',
        duration: Date.now() - startTime,
        metadata: {
          size: content.length,
          permissionLevel: permissionCheck.riskLevel,
          sandboxed: permissionCheck.riskLevel === 'high'
        }
      });
      
      return {
        success: true,
        path: permissionCheck.normalizedPath,
        operation: operationId,
        ...result
      };
    } catch (error) {
      // Log the failed operation
      this.auditLogger.logOperation({
        id: operationId,
        type: 'write',
        path,
        result: 'error',
        duration: Date.now() - startTime,
        metadata: {
          error: error.message,
          contentSize: content ? content.length : 0
        }
      });
      
      throw error;
    }
  }
  
  /**
   * Delete a file securely
   */
  async deleteFile(path) {
    const startTime = Date.now();
    const operationId = `delete-${Date.now()}`;
    
    try {
      // Check permissions
      const permissionCheck = this.permissionManager.checkPermission('delete', path);
      
      // Mock file deletion
      console.log(`Deleting file: ${permissionCheck.normalizedPath}`);
      
      // Log the operation
      this.auditLogger.logOperation({
        id: operationId,
        type: 'delete',
        path: permissionCheck.normalizedPath,
        result: 'success',
        duration: Date.now() - startTime,
        metadata: {
          permissionLevel: permissionCheck.riskLevel
        }
      });
      
      return {
        success: true,
        path: permissionCheck.normalizedPath,
        operation: operationId
      };
    } catch (error) {
      // Log the failed operation
      this.auditLogger.logOperation({
        id: operationId,
        type: 'delete',
        path,
        result: 'error',
        duration: Date.now() - startTime,
        metadata: {
          error: error.message
        }
      });
      
      throw error;
    }
  }
  
  /**
   * Begin a transaction for atomic multi-file operations
   */
  beginTransaction() {
    return this.transactionManager.beginTransaction();
  }
  
  /**
   * Add a write operation to a transaction
   */
  async addWriteToTransaction(txId, path, content) {
    // Check permissions
    const permissionCheck = this.permissionManager.checkPermission('write', path, { content });
    
    // Add to transaction
    return this.transactionManager.addOperation(txId, {
      type: 'write',
      path: permissionCheck.normalizedPath,
      content,
      timestamp: Date.now()
    });
  }
  
  /**
   * Add a delete operation to a transaction
   */
  async addDeleteToTransaction(txId, path) {
    // Check permissions
    const permissionCheck = this.permissionManager.checkPermission('delete', path);
    
    // Add to transaction
    return this.transactionManager.addOperation(txId, {
      type: 'delete',
      path: permissionCheck.normalizedPath,
      timestamp: Date.now()
    });
  }
  
  /**
   * Commit a transaction
   */
  async commitTransaction(txId) {
    return this.transactionManager.commitTransaction(txId);
  }
  
  /**
   * Rollback a transaction
   */
  async rollbackTransaction(txId) {
    return this.transactionManager.rollbackTransaction(txId);
  }
}

// Example usage
async function demonstrateSecureFileOperations() {
  const fileManager = new SecureFileOperationManager({
    permissions: {
      workspacePath: '/workspace',
      allowedDirectories: ['src', 'public', 'tests'],
      readOnly: false
    }
  });
  
  try {
    // Read file example
    const readResult = await fileManager.readFile('src/components/App.js');
    console.log('Read result:', readResult.success);
    
    // Write file example
    const writeContent = `import React from 'react';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Hello World</h1>
      </header>
    </div>
  );
}

export default App;`;

    const writeResult = await fileManager.writeFile('src/components/App.js', writeContent);
    console.log('Write result:', writeResult.success);
    
    // Transaction example
    console.log('\nPerforming transaction example:');
    const txId = fileManager.beginTransaction();
    
    // Add multiple operations to the transaction
    await fileManager.addWriteToTransaction(txId, 'src/components/Header.js', 'export default () => <header>Header</header>');
    await fileManager.addWriteToTransaction(txId, 'src/components/Footer.js', 'export default () => <footer>Footer</footer>');
    
    // Commit the transaction
    const commitResult = await fileManager.commitTransaction(txId);
    console.log('Transaction committed:', commitResult);
    
    // Example of a forbidden operation
    try {
      await fileManager.writeFile('node_modules/package.json', '{"malicious": true}');
    } catch (error) {
      console.log('\nExpected error for forbidden operation:', error.message);
    }
    
    // Example of transaction rollback
    const rollbackTx = fileManager.beginTransaction();
    await fileManager.addWriteToTransaction(rollbackTx, 'src/config/app.config.js', 'export default {broken: true}');
    await fileManager.addDeleteToTransaction(rollbackTx, 'src/components/ImportantFile.js');
    
    // Rollback instead of committing
    const rollbackResult = await fileManager.rollbackTransaction(rollbackTx);
    console.log('\nTransaction rolled back:', rollbackResult);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the demonstration
demonstrateSecureFileOperations().catch(console.error); 