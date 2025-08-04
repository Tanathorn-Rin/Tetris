/**
 * InputHandler class for managing keyboard input and game controls
 * Handles key mapping, repeat logic, and smooth continuous movement
 */

export class InputHandler {
    /**
     * Create a new InputHandler instance
     * @param {GameEngine} gameEngine - Reference to the game engine
     */
    constructor(gameEngine) {
        this.gameEngine = gameEngine;
        
        // Key state tracking for continuous movement
        this.keysPressed = new Set();
        this.keyTimers = new Map();
        
        // Configuration for key repeat behavior
        this.config = {
            // Initial delay before key repeat starts (ms)
            initialDelay: 200,
            // Repeat interval for continuous movement (ms)
            repeatInterval: 50,
            // Soft drop repeat interval (ms)
            softDropInterval: 30
        };
        
        // Key mappings
        this.keyMappings = {
            // Movement keys
            'ArrowLeft': 'moveLeft',
            'ArrowRight': 'moveRight',
            'ArrowDown': 'softDrop',
            
            // Rotation keys
            'ArrowUp': 'rotate',
            ' ': 'rotate', // Spacebar alternative
            
            // Game control keys
            'p': 'pause',
            'P': 'pause',
            'Escape': 'pause',
            'r': 'restart',
            'R': 'restart'
        };
        
        // Actions that support continuous input (key repeat)
        this.continuousActions = new Set(['moveLeft', 'moveRight', 'softDrop']);
        
        // Bind event listeners
        this.boundKeyDown = this.handleKeyDown.bind(this);
        this.boundKeyUp = this.handleKeyUp.bind(this);
        this.boundUpdate = this.update.bind(this);
        
        // Animation frame for continuous input processing
        this.updateFrameId = null;
        this.isActive = false;
    }
    
    /**
     * Initialize and bind event listeners
     */
    bindEvents() {
        if (this.isActive) {
            return; // Already bound
        }
        
        document.addEventListener('keydown', this.boundKeyDown);
        document.addEventListener('keyup', this.boundKeyUp);
        
        // Start the continuous input update loop
        this.isActive = true;
        this.startUpdateLoop();
        
        console.log('InputHandler: Event listeners bound');
    }
    
    /**
     * Remove event listeners and cleanup
     */
    unbindEvents() {
        if (!this.isActive) {
            return; // Already unbound
        }
        
        document.removeEventListener('keydown', this.boundKeyDown);
        document.removeEventListener('keyup', this.boundKeyUp);
        
        // Stop the update loop
        this.stopUpdateLoop();
        this.isActive = false;
        
        // Clear all key states
        this.keysPressed.clear();
        this.keyTimers.clear();
        
        console.log('InputHandler: Event listeners unbound');
    }
    
    /**
     * Handle keydown events
     * @param {KeyboardEvent} event - The keyboard event
     */
    handleKeyDown(event) {
        const action = this.keyMappings[event.key];
        
        if (!action) {
            return; // Key not mapped to any action
        }
        
        // Prevent default browser behavior for mapped keys
        event.preventDefault();
        
        // Handle immediate actions (non-continuous)
        if (!this.continuousActions.has(action)) {
            this.executeAction(action, event);
            return;
        }
        
        // Handle continuous actions (with key repeat)
        if (!this.keysPressed.has(event.key)) {
            // First press - execute immediately
            this.keysPressed.add(event.key);
            this.executeAction(action, event);
            
            // Set up timer for continuous execution
            this.keyTimers.set(event.key, {
                action: action,
                lastExecuted: performance.now(),
                initialDelay: this.config.initialDelay,
                repeatInterval: action === 'softDrop' ? 
                    this.config.softDropInterval : 
                    this.config.repeatInterval,
                hasRepeated: false
            });
        }
    }
    
    /**
     * Handle keyup events
     * @param {KeyboardEvent} event - The keyboard event
     */
    handleKeyUp(event) {
        const action = this.keyMappings[event.key];
        
        if (!action) {
            return; // Key not mapped to any action
        }
        
        // Prevent default browser behavior for mapped keys
        event.preventDefault();
        
        // Handle key release for continuous actions
        if (this.continuousActions.has(action)) {
            this.keysPressed.delete(event.key);
            this.keyTimers.delete(event.key);
            
            // Special handling for soft drop release
            if (action === 'softDrop') {
                this.gameEngine.stopSoftDrop();
            }
        }
    }
    
    /**
     * Execute a game action
     * @param {string} action - The action to execute
     * @param {KeyboardEvent} event - The original keyboard event
     */
    executeAction(action, event) {
        const gameState = this.gameEngine.getGameState();
        
        // Handle pause/restart actions regardless of game state
        if (action === 'pause') {
            this.gameEngine.togglePause();
            return;
        }
        
        if (action === 'restart') {
            this.gameEngine.restart(); // Restart the game
            return;
        }
        
        // Only allow game actions when playing
        if (gameState.status !== 'playing') {
            return;
        }
        
        const tetrominoManager = this.gameEngine.getTetrominoManager();
        
        switch (action) {
            case 'moveLeft':
                tetrominoManager.moveLeft();
                break;
                
            case 'moveRight':
                tetrominoManager.moveRight();
                break;
                
            case 'softDrop':
                this.gameEngine.startSoftDrop();
                break;
                
            case 'rotate':
                tetrominoManager.rotatePiece();
                break;
                
            default:
                console.warn(`InputHandler: Unknown action '${action}'`);
        }
    }
    
    /**
     * Start the continuous input update loop
     */
    startUpdateLoop() {
        if (this.updateFrameId) {
            return; // Already running
        }
        
        this.updateFrameId = requestAnimationFrame(this.boundUpdate);
    }
    
    /**
     * Stop the continuous input update loop
     */
    stopUpdateLoop() {
        if (this.updateFrameId) {
            cancelAnimationFrame(this.updateFrameId);
            this.updateFrameId = null;
        }
    }
    
    /**
     * Update continuous input processing
     */
    update() {
        if (!this.isActive) {
            return;
        }
        
        const currentTime = performance.now();
        
        // Process continuous key presses
        for (const [key, timer] of this.keyTimers.entries()) {
            const timeSinceLastExecution = currentTime - timer.lastExecuted;
            
            let shouldExecute = false;
            
            if (!timer.hasRepeated) {
                // Check if initial delay has passed
                if (timeSinceLastExecution >= timer.initialDelay) {
                    shouldExecute = true;
                    timer.hasRepeated = true;
                }
            } else {
                // Check if repeat interval has passed
                if (timeSinceLastExecution >= timer.repeatInterval) {
                    shouldExecute = true;
                }
            }
            
            if (shouldExecute) {
                this.executeAction(timer.action, { key: key });
                timer.lastExecuted = currentTime;
            }
        }
        
        // Continue the update loop
        this.updateFrameId = requestAnimationFrame(this.boundUpdate);
    }
    
    /**
     * Check if a key is currently pressed
     * @param {string} key - The key to check
     * @returns {boolean} True if the key is pressed
     */
    isKeyPressed(key) {
        return this.keysPressed.has(key);
    }
    
    /**
     * Check if an action is currently active
     * @param {string} action - The action to check
     * @returns {boolean} True if the action is active
     */
    isActionActive(action) {
        for (const [key, mapping] of Object.entries(this.keyMappings)) {
            if (mapping === action && this.keysPressed.has(key)) {
                return true;
            }
        }
        return false;
    }
    
    /**
     * Get current input state for debugging
     * @returns {Object} Current input state
     */
    getInputState() {
        return {
            keysPressed: Array.from(this.keysPressed),
            activeTimers: Array.from(this.keyTimers.keys()),
            isActive: this.isActive,
            config: this.config
        };
    }
    
    /**
     * Update key mapping configuration
     * @param {Object} newMappings - New key mappings to merge
     */
    updateKeyMappings(newMappings) {
        this.keyMappings = { ...this.keyMappings, ...newMappings };
        console.log('InputHandler: Key mappings updated', this.keyMappings);
    }
    
    /**
     * Update timing configuration
     * @param {Object} newConfig - New timing configuration to merge
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        console.log('InputHandler: Configuration updated', this.config);
    }
    
    /**
     * Reset all input state
     */
    reset() {
        this.keysPressed.clear();
        this.keyTimers.clear();
        console.log('InputHandler: State reset');
    }
}