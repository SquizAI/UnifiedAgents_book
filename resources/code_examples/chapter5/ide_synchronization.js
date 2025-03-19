/**
 * IDE State Synchronization Protocol Implementation
 * 
 * This module demonstrates the bidirectional synchronization mechanisms
 * between the unified agent and the integrated development environment.
 */

class IDEStateSynchronizer {
  constructor(options = {}) {
    this.options = {
      // How frequently to send batched updates (ms)
      batchInterval: 150,
      // Maximum events to queue before forcing a sync
      maxQueueSize: 50,
      // Whether to use differential updates
      useDifferentialUpdates: true,
      // Events that trigger immediate sync
      highPriorityEvents: ['selection', 'command', 'terminal_output', 'diagnostics'],
      // Whether to synchronize viewport position
      trackViewport: true,
      // Synchronize extended state beyond basic cursor/selection
      extendedStateSync: true,
      // Track document history states
      trackHistory: true,
      ...options
    };

    // Internal state
    this.eventQueue = [];
    this.lastSyncState = null;
    this.pendingSync = false;
    this.batchTimer = null;
    this.connectionState = 'disconnected';
    this.syncListeners = new Map();
    this.stateChangeListeners = [];
    this.documentChangeListeners = [];
    
    // Bind methods
    this.handleEditorEvent = this.handleEditorEvent.bind(this);
    this.processBatch = this.processBatch.bind(this);
    this.applyRemoteChanges = this.applyRemoteChanges.bind(this);
    this.connect = this.connect.bind(this);
    this.disconnect = this.disconnect.bind(this);
  }

  /**
   * Establish connection with the IDE and initialize event listeners
   */
  async connect() {
    if (this.connectionState !== 'disconnected') {
      return;
    }
    
    this.connectionState = 'connecting';
    
    try {
      // Initialize connection to IDE
      await this.initializeIDEConnection();
      
      // Register event listeners for various IDE events
      this.registerEventListeners();
      
      // Perform initial state synchronization
      await this.performInitialSync();
      
      this.connectionState = 'connected';
      this.triggerStateChange('connected');
      
      console.log('IDE synchronization established');
    } catch (error) {
      this.connectionState = 'error';
      this.triggerStateChange('error', error);
      console.error('Failed to establish IDE synchronization:', error);
      
      // Retry connection after delay
      setTimeout(() => {
        if (this.connectionState === 'error') {
          this.connect();
        }
      }, 5000);
    }
  }

  /**
   * Disconnect from the IDE and clean up resources
   */
  async disconnect() {
    if (this.connectionState === 'disconnected') {
      return;
    }
    
    // Process any pending events before disconnecting
    if (this.eventQueue.length > 0) {
      await this.processBatch();
    }
    
    // Remove event listeners
    this.unregisterEventListeners();
    
    // Close connection
    await this.closeIDEConnection();
    
    // Clear timers and state
    clearTimeout(this.batchTimer);
    this.batchTimer = null;
    this.eventQueue = [];
    this.lastSyncState = null;
    this.pendingSync = false;
    
    this.connectionState = 'disconnected';
    this.triggerStateChange('disconnected');
    
    console.log('IDE synchronization terminated');
  }

  /**
   * Handle various editor events and queue them for synchronization
   * @param {Object} event - The editor event to process
   */
  handleEditorEvent(event) {
    // Add timestamp to event
    const timestampedEvent = {
      ...event,
      timestamp: Date.now()
    };
    
    // Add to queue
    this.eventQueue.push(timestampedEvent);
    
    // Determine if this event needs immediate sync
    const needsImmediateSync = this.isHighPriorityEvent(event);
    
    // Process immediately if high priority or queue is full
    if (needsImmediateSync || this.eventQueue.length >= this.options.maxQueueSize) {
      this.processBatchImmediate();
    } else if (!this.batchTimer) {
      // Schedule a batch update
      this.batchTimer = setTimeout(this.processBatch, this.options.batchInterval);
    }
  }

  /**
   * Process the current batch of events immediately
   */
  processBatchImmediate() {
    clearTimeout(this.batchTimer);
    this.batchTimer = null;
    this.processBatch();
  }

  /**
   * Process the current batch of queued events
   */
  async processBatch() {
    if (this.pendingSync || this.eventQueue.length === 0) {
      return;
    }
    
    this.pendingSync = true;
    clearTimeout(this.batchTimer);
    this.batchTimer = null;
    
    try {
      // Take snapshot of current queue and clear for new events
      const eventsToProcess = [...this.eventQueue];
      this.eventQueue = [];
      
      // Optimize the batch by coalescing events
      const optimizedBatch = this.optimizeEventBatch(eventsToProcess);
      
      // Generate current state based on events
      const currentState = this.generateCurrentState(optimizedBatch);
      
      // Create differential update if enabled
      let updatePayload;
      if (this.options.useDifferentialUpdates && this.lastSyncState) {
        updatePayload = this.createDifferentialUpdate(this.lastSyncState, currentState);
      } else {
        updatePayload = {
          type: 'full_state',
          state: currentState
        };
      }
      
      // Send update to agent
      await this.sendStateUpdate(updatePayload);
      
      // Update last synced state
      this.lastSyncState = currentState;
      
      // Notify listeners
      this.notifySyncCompleted(currentState);
    } catch (error) {
      console.error('Error during IDE state synchronization:', error);
      
      // Return failed events to the queue for retry
      this.eventQueue = [...this.eventQueue, ...eventsToProcess];
      
      // Trigger error state change
      this.triggerStateChange('sync_error', error);
    } finally {
      this.pendingSync = false;
      
      // If new events accumulated during processing, schedule another batch
      if (this.eventQueue.length > 0) {
        this.batchTimer = setTimeout(this.processBatch, this.options.batchInterval);
      }
    }
  }

  /**
   * Apply state changes received from the agent
   * @param {Object} changes - The changes to apply
   */
  async applyRemoteChanges(changes) {
    try {
      switch (changes.type) {
        case 'cursor_update':
          await this.applyRemoteCursorUpdate(changes);
          break;
        
        case 'selection_update':
          await this.applyRemoteSelectionUpdate(changes);
          break;
        
        case 'scroll_update':
          await this.applyRemoteScrollUpdate(changes);
          break;
        
        case 'focus_update':
          await this.applyRemoteFocusUpdate(changes);
          break;
        
        case 'command':
          await this.executeRemoteCommand(changes.command);
          break;
        
        case 'document_edit':
          await this.applyRemoteDocumentEdit(changes);
          break;
        
        case 'multi_operation':
          // Apply multiple operations in sequence
          for (const operation of changes.operations) {
            await this.applyRemoteChanges(operation);
          }
          break;
          
        default:
          console.warn('Unknown remote change type:', changes.type);
      }
      
      // Update last sync state to include these changes
      if (this.lastSyncState) {
        this.lastSyncState = this.applyChangesToState(this.lastSyncState, changes);
      }
      
      // Notify state change listeners
      this.triggerStateChange('remote_change_applied', changes);
    } catch (error) {
      console.error('Error applying remote changes:', error);
      this.triggerStateChange('remote_change_error', { changes, error });
      throw error;
    }
  }

  /**
   * Register for state change notifications
   * @param {Function} listener - Callback function for state changes
   * @returns {Function} Unsubscribe function
   */
  onStateChange(listener) {
    this.stateChangeListeners.push(listener);
    return () => {
      this.stateChangeListeners = this.stateChangeListeners.filter(l => l !== listener);
    };
  }

  /**
   * Register for document change notifications
   * @param {Function} listener - Callback function for document changes
   * @returns {Function} Unsubscribe function
   */
  onDocumentChange(listener) {
    this.documentChangeListeners.push(listener);
    return () => {
      this.documentChangeListeners = this.documentChangeListeners.filter(l => l !== listener);
    };
  }

  /**
   * Subscribe to synchronized state notifications
   * @param {string} stateType - Type of state to subscribe to
   * @param {Function} listener - Callback function
   * @returns {Function} Unsubscribe function
   */
  subscribeSyncState(stateType, listener) {
    if (!this.syncListeners.has(stateType)) {
      this.syncListeners.set(stateType, new Set());
    }
    
    this.syncListeners.get(stateType).add(listener);
    
    return () => {
      const listeners = this.syncListeners.get(stateType);
      if (listeners) {
        listeners.delete(listener);
        if (listeners.size === 0) {
          this.syncListeners.delete(stateType);
        }
      }
    };
  }

  // Implementation-specific private methods (would be connected to actual IDE APIs)
  
  /**
   * Initialize connection to IDE API
   * @private
   */
  async initializeIDEConnection() {
    // Implementation would connect to IDE's API
    // Example implementation:
    return new Promise((resolve) => {
      // Simulate connection establishment
      setTimeout(() => {
        console.log('Connected to IDE API');
        resolve();
      }, 100);
    });
  }
  
  /**
   * Register event listeners with the IDE
   * @private
   */
  registerEventListeners() {
    // Implementation would register with IDE's event system
    // Example implementation:
    console.log('Registered IDE event listeners');
    
    // Simulated event listeners that would be wired to actual IDE events
    const eventTypes = [
      'cursor_move', 'selection_change', 'document_change', 
      'scroll', 'focus_change', 'command_execution',
      'terminal_input', 'terminal_output', 'diagnostics_updated'
    ];
    
    // In a real implementation, these would be attached to actual IDE events
    this.registeredListeners = eventTypes.map(eventType => ({ eventType }));
  }
  
  /**
   * Unregister event listeners from the IDE
   * @private
   */
  unregisterEventListeners() {
    // Implementation would remove listeners from IDE's event system
    // Example implementation:
    console.log('Unregistered IDE event listeners');
    this.registeredListeners = [];
  }
  
  /**
   * Close connection to IDE API
   * @private
   */
  async closeIDEConnection() {
    // Implementation would disconnect from IDE's API
    // Example implementation:
    return new Promise((resolve) => {
      // Simulate disconnection
      setTimeout(() => {
        console.log('Disconnected from IDE API');
        resolve();
      }, 50);
    });
  }
  
  /**
   * Generate current IDE state from events
   * @private
   * @param {Array} events - Batch of events to process
   * @returns {Object} Current IDE state
   */
  generateCurrentState(events) {
    // In a real implementation, this would build state from actual IDE state
    // Example implementation:
    
    // Start with last known state or default state
    const baseState = this.lastSyncState || this.getDefaultState();
    
    // Apply each event to build current state
    return events.reduce((state, event) => {
      switch (event.type) {
        case 'cursor_move':
          return {
            ...state,
            cursor: {
              line: event.line,
              column: event.column,
              file: event.file || state.activeDocument
            }
          };
          
        case 'selection_change':
          return {
            ...state,
            selections: event.selections || [],
            hasSelection: (event.selections || []).length > 0
          };
          
        case 'scroll':
          return {
            ...state,
            viewport: {
              topLine: event.topLine,
              bottomLine: event.bottomLine,
              leftColumn: event.leftColumn,
              rightColumn: event.rightColumn
            }
          };
          
        case 'focus_change':
          return {
            ...state,
            activeDocument: event.document,
            activeEditor: event.editor,
            activatedAt: event.timestamp
          };
          
        case 'document_change':
          return {
            ...state,
            documentVersion: (state.documentVersion || 0) + 1,
            lastEditType: event.changeType,
            lastEditPosition: {
              line: event.line,
              column: event.column
            },
            lastEditTimestamp: event.timestamp
          };
          
        case 'terminal_output':
          // Append to terminal buffer
          const terminalId = event.terminalId || 'default';
          const existingBuffer = state.terminals?.[terminalId]?.buffer || [];
          
          return {
            ...state,
            terminals: {
              ...(state.terminals || {}),
              [terminalId]: {
                ...(state.terminals?.[terminalId] || {}),
                buffer: [...existingBuffer, event.content],
                lastOutput: event.timestamp
              }
            }
          };
          
        case 'diagnostics_updated':
          return {
            ...state,
            diagnostics: {
              errors: event.errors || 0,
              warnings: event.warnings || 0,
              information: event.information || 0,
              files: event.files || []
            },
            lastDiagnosticsUpdate: event.timestamp
          };
          
        default:
          return state;
      }
    }, baseState);
  }
  
  /**
   * Create a differential update between two states
   * @private
   * @param {Object} oldState - Previous state
   * @param {Object} newState - Current state
   * @returns {Object} Differential update
   */
  createDifferentialUpdate(oldState, newState) {
    // In a real implementation, this would compute minimal differences
    // Example implementation:
    
    const changedFields = new Set();
    const updates = {};
    
    // Compare fields and identify changes
    for (const [key, value] of Object.entries(newState)) {
      // If the key doesn't exist in old state or values differ
      if (!(key in oldState) || !this.isEqual(oldState[key], value)) {
        changedFields.add(key);
        updates[key] = value;
      }
    }
    
    // For nested objects that have changed, optimize to only include changed properties
    for (const field of changedFields) {
      if (typeof oldState[field] === 'object' && oldState[field] !== null && 
          typeof newState[field] === 'object' && newState[field] !== null) {
        
        // Create differential update for this nested object
        const nestedChanges = {};
        let hasNestedChanges = false;
        
        for (const [nestedKey, nestedValue] of Object.entries(newState[field])) {
          if (!(nestedKey in oldState[field]) || !this.isEqual(oldState[field][nestedKey], nestedValue)) {
            nestedChanges[nestedKey] = nestedValue;
            hasNestedChanges = true;
          }
        }
        
        // If there are nested changes, replace with just the changes
        if (hasNestedChanges) {
          updates[field] = {
            ...oldState[field],
            ...nestedChanges
          };
        }
      }
    }
    
    return {
      type: 'differential',
      updates,
      changedFields: Array.from(changedFields)
    };
  }
  
  /**
   * Send state update to agent
   * @private
   * @param {Object} update - The update to send
   */
  async sendStateUpdate(update) {
    // In a real implementation, this would send to the agent's API
    // Example implementation:
    return new Promise((resolve) => {
      // Simulate sending update
      setTimeout(() => {
        console.log('Sent state update:', 
          `type=${update.type}, ` + 
          `fields=${update.type === 'differential' ? update.changedFields.join(',') : 'full'}`);
        resolve();
      }, 20);
    });
  }
  
  /**
   * Get default IDE state
   * @private
   * @returns {Object} Default state
   */
  getDefaultState() {
    return {
      activeDocument: null,
      activeEditor: null,
      cursor: { line: 0, column: 0 },
      selections: [],
      hasSelection: false,
      viewport: {
        topLine: 0,
        bottomLine: 0,
        leftColumn: 0,
        rightColumn: 0
      },
      documentVersion: 0,
      lastEditType: null,
      lastEditPosition: null,
      lastEditTimestamp: null,
      terminals: {},
      diagnostics: {
        errors: 0,
        warnings: 0,
        information: 0,
        files: []
      }
    };
  }
  
  /**
   * Apply initial synchronization
   * @private
   */
  async performInitialSync() {
    // In a real implementation, this would get the full IDE state
    // Example implementation:
    const initialState = this.getDefaultState();
    
    // Additional initialization with actual IDE state
    initialState.activeDocument = 'src/main.js';
    initialState.activeEditor = 'editor-1';
    
    // Send initial state
    this.lastSyncState = initialState;
    await this.sendStateUpdate({
      type: 'full_state',
      state: initialState
    });
    
    // Notify listeners
    this.notifySyncCompleted(initialState);
  }
  
  /**
   * Check if an event needs immediate synchronization
   * @private
   * @param {Object} event - The event to check
   * @returns {boolean} True if high priority
   */
  isHighPriorityEvent(event) {
    return this.options.highPriorityEvents.includes(event.type);
  }
  
  /**
   * Optimize a batch of events by coalescing redundant ones
   * @private
   * @param {Array} events - The events to optimize
   * @returns {Array} Optimized events
   */
  optimizeEventBatch(events) {
    if (events.length <= 1) {
      return events;
    }
    
    const optimized = [];
    const lastEventByType = new Map();
    
    // Group consecutive events of the same type
    for (const event of events) {
      // For cursor/selection/scroll events, we only care about the final position
      if (['cursor_move', 'selection_change', 'scroll'].includes(event.type)) {
        lastEventByType.set(event.type, event);
      }
      // For document changes, we might need to coalesce them based on location
      else if (event.type === 'document_change') {
        const lastDocChange = lastEventByType.get('document_change');
        
        // If changes are close together and of the same type, merge them
        if (lastDocChange && 
            lastDocChange.changeType === event.changeType &&
            lastDocChange.document === event.document &&
            Math.abs(lastDocChange.line - event.line) <= 2) {
          // Update the existing event
          lastDocChange.timestamp = event.timestamp;
        } else {
          lastEventByType.set('document_change', event);
        }
      }
      // For diagnostics, we only care about the latest update
      else if (event.type === 'diagnostics_updated') {
        lastEventByType.set('diagnostics_updated', event);
      }
      // Terminal output might be coalesced if from same terminal and close in time
      else if (event.type === 'terminal_output') {
        const key = `terminal_output:${event.terminalId || 'default'}`;
        const lastOutput = lastEventByType.get(key);
        
        if (lastOutput && event.timestamp - lastOutput.timestamp < 500) {
          // Merge with previous output
          lastOutput.content += event.content;
          lastOutput.timestamp = event.timestamp;
        } else {
          lastEventByType.set(key, event);
        }
      }
      // Other event types are preserved as-is
      else {
        optimized.push(event);
      }
    }
    
    // Add all the latest events by type
    for (const [_, event] of lastEventByType) {
      optimized.push(event);
    }
    
    // Sort by timestamp for consistency
    return optimized.sort((a, b) => a.timestamp - b.timestamp);
  }
  
  /**
   * Apply changes from agent to local state
   * @private
   * @param {Object} state - Current state
   * @param {Object} changes - Changes to apply
   * @returns {Object} Updated state
   */
  applyChangesToState(state, changes) {
    // In a real implementation, this would apply changes to the state model
    // Example implementation:
    switch (changes.type) {
      case 'cursor_update':
        return {
          ...state,
          cursor: {
            line: changes.line,
            column: changes.column,
            file: changes.file || state.activeDocument
          }
        };
        
      case 'selection_update':
        return {
          ...state,
          selections: changes.selections || [],
          hasSelection: (changes.selections || []).length > 0
        };
        
      case 'scroll_update':
        return {
          ...state,
          viewport: {
            ...state.viewport,
            topLine: changes.topLine !== undefined ? changes.topLine : state.viewport.topLine,
            bottomLine: changes.bottomLine !== undefined ? changes.bottomLine : state.viewport.bottomLine
          }
        };
        
      case 'focus_update':
        return {
          ...state,
          activeDocument: changes.document || state.activeDocument,
          activeEditor: changes.editor || state.activeEditor
        };
        
      case 'document_edit':
        return {
          ...state,
          documentVersion: state.documentVersion + 1,
          lastEditType: 'remote_edit',
          lastEditPosition: {
            line: changes.position?.line || 0,
            column: changes.position?.column || 0
          },
          lastEditTimestamp: Date.now()
        };
        
      default:
        return state;
    }
  }
  
  /**
   * Apply remote cursor update to IDE
   * @private
   * @param {Object} update - Cursor update
   */
  async applyRemoteCursorUpdate(update) {
    // In a real implementation, this would call IDE API to move cursor
    // Example implementation:
    console.log('Applied remote cursor update:', 
      `file=${update.file}, line=${update.line}, column=${update.column}`);
  }
  
  /**
   * Apply remote selection update to IDE
   * @private
   * @param {Object} update - Selection update
   */
  async applyRemoteSelectionUpdate(update) {
    // In a real implementation, this would call IDE API to change selection
    // Example implementation:
    console.log('Applied remote selection update:', 
      `selections=${JSON.stringify(update.selections)}`);
  }
  
  /**
   * Apply remote scroll update to IDE
   * @private
   * @param {Object} update - Scroll update
   */
  async applyRemoteScrollUpdate(update) {
    // In a real implementation, this would call IDE API to scroll viewport
    // Example implementation:
    console.log('Applied remote scroll update:', 
      `topLine=${update.topLine}, bottomLine=${update.bottomLine}`);
  }
  
  /**
   * Apply remote focus update to IDE
   * @private
   * @param {Object} update - Focus update
   */
  async applyRemoteFocusUpdate(update) {
    // In a real implementation, this would call IDE API to change focus
    // Example implementation:
    console.log('Applied remote focus update:', 
      `document=${update.document}, editor=${update.editor}`);
  }
  
  /**
   * Execute a command in the IDE
   * @private
   * @param {Object} command - Command to execute
   */
  async executeRemoteCommand(command) {
    // In a real implementation, this would call IDE API to execute command
    // Example implementation:
    console.log('Executed remote command:', 
      `id=${command.id}, params=${JSON.stringify(command.params)}`);
  }
  
  /**
   * Apply a document edit from the agent
   * @private
   * @param {Object} edit - Document edit
   */
  async applyRemoteDocumentEdit(edit) {
    // In a real implementation, this would call IDE API to edit document
    // Example implementation:
    console.log('Applied remote document edit:', 
      `file=${edit.file}, operation=${edit.operation}, position=${JSON.stringify(edit.position)}`);
    
    // Notify document change listeners
    this.documentChangeListeners.forEach(listener => {
      try {
        listener({
          type: 'document_change',
          source: 'remote',
          file: edit.file,
          operation: edit.operation,
          position: edit.position,
          timestamp: Date.now()
        });
      } catch (error) {
        console.error('Error in document change listener:', error);
      }
    });
  }
  
  /**
   * Notify state change listeners
   * @private
   * @param {string} event - Event type
   * @param {*} data - Event data
   */
  triggerStateChange(event, data) {
    this.stateChangeListeners.forEach(listener => {
      try {
        listener({ type: event, data, timestamp: Date.now() });
      } catch (error) {
        console.error('Error in state change listener:', error);
      }
    });
  }
  
  /**
   * Notify when sync is completed
   * @private
   * @param {Object} state - New state
   */
  notifySyncCompleted(state) {
    // Notify general sync listeners
    this.triggerStateChange('sync_completed', { state });
    
    // Notify specific state type listeners
    for (const [stateType, listeners] of this.syncListeners.entries()) {
      if (stateType in state) {
        listeners.forEach(listener => {
          try {
            listener(state[stateType]);
          } catch (error) {
            console.error(`Error in ${stateType} sync listener:`, error);
          }
        });
      }
    }
  }
  
  /**
   * Compare two values for equality
   * @private
   * @param {*} a - First value
   * @param {*} b - Second value
   * @returns {boolean} True if equal
   */
  isEqual(a, b) {
    // Simple equality check - in a real implementation, this would be more robust
    if (a === b) return true;
    
    if (typeof a !== 'object' || a === null || typeof b !== 'object' || b === null) {
      return false;
    }
    
    // Simple object/array equality
    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) return false;
      for (let i = 0; i < a.length; i++) {
        if (!this.isEqual(a[i], b[i])) return false;
      }
      return true;
    }
    
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    
    if (keysA.length !== keysB.length) return false;
    
    for (const key of keysA) {
      if (!keysB.includes(key) || !this.isEqual(a[key], b[key])) {
        return false;
      }
    }
    
    return true;
  }
}

/**
 * Example usage of the IDE State Synchronizer
 */
function demonstrateSynchronization() {
  // Create an instance of the synchronizer
  const synchronizer = new IDEStateSynchronizer({
    batchInterval: 100,
    useDifferentialUpdates: true
  });
  
  // Subscribe to state changes
  synchronizer.onStateChange(event => {
    console.log(`State change: ${event.type}`);
  });
  
  // Subscribe to cursor position updates
  synchronizer.subscribeSyncState('cursor', cursor => {
    console.log(`Cursor updated: line=${cursor.line}, column=${cursor.column}`);
  });
  
  // Connect to IDE
  synchronizer.connect().then(() => {
    console.log('Synchronizer connected, simulating events...');
    
    // Simulate a series of IDE events
    setTimeout(() => {
      synchronizer.handleEditorEvent({
        type: 'focus_change',
        document: 'src/components/App.jsx',
        editor: 'editor-1'
      });
    }, 200);
    
    setTimeout(() => {
      synchronizer.handleEditorEvent({
        type: 'cursor_move',
        line: 42,
        column: 15
      });
    }, 300);
    
    setTimeout(() => {
      synchronizer.handleEditorEvent({
        type: 'selection_change',
        selections: [{
          start: { line: 42, column: 15 },
          end: { line: 42, column: 28 }
        }]
      });
    }, 400);
    
    setTimeout(() => {
      synchronizer.handleEditorEvent({
        type: 'document_change',
        document: 'src/components/App.jsx',
        changeType: 'edit',
        line: 42,
        column: 15
      });
    }, 500);
    
    // Simulate receiving a change from the agent
    setTimeout(() => {
      synchronizer.applyRemoteChanges({
        type: 'cursor_update',
        file: 'src/components/App.jsx',
        line: 50,
        column: 10
      });
    }, 800);
    
    // Clean up
    setTimeout(() => {
      synchronizer.disconnect().then(() => {
        console.log('Synchronization demonstration completed');
      });
    }, 1500);
  });
}

// Export the main class and demo function
module.exports = {
  IDEStateSynchronizer,
  demonstrateSynchronization
}; 