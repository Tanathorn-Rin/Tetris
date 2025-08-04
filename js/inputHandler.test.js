/**
 * Unit tests for InputHandler class
 * Tests key mapping, event handling, and continuous input logic
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { InputHandler } from './inputHandler.js';

// Mock GameEngine for testing
class MockGameEngine {
    constructor() {
        this.gameState = { status: 'playing' };
        this.tetrominoManager = new MockTetrominoManager();
        this.pauseCalled = false;
        this.resumeCalled = false;
        this.startCalled = false;
        this.startSoftDropCalled = false;
        this.stopSoftDropCalled = false;
    }
    
    getGameState() {
        return this.gameState;
    }
    
    getTetrominoManager() {
        return this.tetrominoManager;
    }
    
    pause() {
        this.pauseCalled = true;
        this.gameState.status = 'paused';
    }
    
    resume() {
        this.resumeCalled = true;
        this.gameState.status = 'playing';
    }
    
    start() {
        this.startCalled = true;
        this.gameState.status = 'playing';
    }
    
    startSoftDrop() {
        this.startSoftDropCalled = true;
    }
    
    stopSoftDrop() {
        this.stopSoftDropCalled = true;
    }
    
    togglePause() {
        if (this.gameState.status === 'playing') {
            this.pause();
        } else if (this.gameState.status === 'paused') {
            this.resume();
        }
    }
    
    restart() {
        this.startCalled = true;
        this.gameState.status = 'playing';
    }
    
    reset() {
        this.pauseCalled = false;
        this.resumeCalled = false;
        this.startCalled = false;
        this.startSoftDropCalled = false;
        this.stopSoftDropCalled = false;
        this.gameState.status = 'playing';
    }
}

// Mock TetrominoManager for testing
class MockTetrominoManager {
    constructor() {
        this.moveLeftCalled = false;
        this.moveRightCalled = false;
        this.rotatePieceCalled = false;
        this.moveLeftCount = 0;
        this.moveRightCount = 0;
        this.rotatePieceCount = 0;
    }
    
    moveLeft() {
        this.moveLeftCalled = true;
        this.moveLeftCount++;
        return true;
    }
    
    moveRight() {
        this.moveRightCalled = true;
        this.moveRightCount++;
        return true;
    }
    
    rotatePiece() {
        this.rotatePieceCalled = true;
        this.rotatePieceCount++;
        return true;
    }
    
    reset() {
        this.moveLeftCalled = false;
        this.moveRightCalled = false;
        this.rotatePieceCalled = false;
        this.moveLeftCount = 0;
        this.moveRightCount = 0;
        this.rotatePieceCount = 0;
    }
}

// Helper function to create keyboard events
function createKeyboardEvent(type, key, options = {}) {
    const event = new KeyboardEvent(type, {
        key: key,
        bubbles: true,
        cancelable: true,
        ...options
    });
    
    // Mock preventDefault
    event.preventDefault = vi.fn();
    
    return event;
}

// Helper function to wait for a specified time
function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

describe('InputHandler', () => {
    let inputHandler;
    let mockGameEngine;
    let mockTetrominoManager;
    
    beforeEach(() => {
        // Set up mocks
        mockGameEngine = new MockGameEngine();
        mockTetrominoManager = mockGameEngine.getTetrominoManager();
        
        // Create InputHandler instance
        inputHandler = new InputHandler(mockGameEngine);
        
        // Mock requestAnimationFrame and cancelAnimationFrame
        global.requestAnimationFrame = vi.fn((callback) => {
            return setTimeout(callback, 16); // ~60fps
        });
        global.cancelAnimationFrame = vi.fn((id) => {
            clearTimeout(id);
        });
        
        // Mock performance.now
        global.performance = {
            now: vi.fn(() => Date.now())
        };
    });
    
    afterEach(() => {
        // Clean up
        inputHandler.unbindEvents();
        vi.clearAllMocks();
        vi.clearAllTimers();
    });
    
    describe('Initialization', () => {
        it('should initialize with correct default configuration', () => {
            expect(inputHandler.config.initialDelay).toBe(200);
            expect(inputHandler.config.repeatInterval).toBe(50);
            expect(inputHandler.config.softDropInterval).toBe(30);
        });
        
        it('should have correct key mappings', () => {
            expect(inputHandler.keyMappings['ArrowLeft']).toBe('moveLeft');
            expect(inputHandler.keyMappings['ArrowRight']).toBe('moveRight');
            expect(inputHandler.keyMappings['ArrowDown']).toBe('softDrop');
            expect(inputHandler.keyMappings['ArrowUp']).toBe('rotate');
            expect(inputHandler.keyMappings[' ']).toBe('rotate');
            expect(inputHandler.keyMappings['p']).toBe('pause');
            expect(inputHandler.keyMappings['P']).toBe('pause');
            expect(inputHandler.keyMappings['Escape']).toBe('pause');
            expect(inputHandler.keyMappings['r']).toBe('restart');
            expect(inputHandler.keyMappings['R']).toBe('restart');
        });
        
        it('should identify continuous actions correctly', () => {
            expect(inputHandler.continuousActions.has('moveLeft')).toBe(true);
            expect(inputHandler.continuousActions.has('moveRight')).toBe(true);
            expect(inputHandler.continuousActions.has('softDrop')).toBe(true);
            expect(inputHandler.continuousActions.has('rotate')).toBe(false);
            expect(inputHandler.continuousActions.has('pause')).toBe(false);
        });
    });
    
    describe('Event Binding', () => {
        it('should bind events when bindEvents is called', () => {
            const addEventListenerSpy = vi.spyOn(document, 'addEventListener');
            
            inputHandler.bindEvents();
            
            expect(addEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
            expect(addEventListenerSpy).toHaveBeenCalledWith('keyup', expect.any(Function));
            expect(inputHandler.isActive).toBe(true);
        });
        
        it('should unbind events when unbindEvents is called', () => {
            const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');
            
            inputHandler.bindEvents();
            inputHandler.unbindEvents();
            
            expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
            expect(removeEventListenerSpy).toHaveBeenCalledWith('keyup', expect.any(Function));
            expect(inputHandler.isActive).toBe(false);
        });
        
        it('should not bind events multiple times', () => {
            const addEventListenerSpy = vi.spyOn(document, 'addEventListener');
            
            inputHandler.bindEvents();
            inputHandler.bindEvents(); // Second call should be ignored
            
            expect(addEventListenerSpy).toHaveBeenCalledTimes(2); // Only called once per event type
        });
    });
    
    describe('Key Mapping and Action Execution', () => {
        beforeEach(() => {
            inputHandler.bindEvents();
        });
        
        it('should execute moveLeft action on ArrowLeft keydown', () => {
            const event = createKeyboardEvent('keydown', 'ArrowLeft');
            
            inputHandler.handleKeyDown(event);
            
            expect(mockTetrominoManager.moveLeftCalled).toBe(true);
            expect(event.preventDefault).toHaveBeenCalled();
        });
        
        it('should execute moveRight action on ArrowRight keydown', () => {
            const event = createKeyboardEvent('keydown', 'ArrowRight');
            
            inputHandler.handleKeyDown(event);
            
            expect(mockTetrominoManager.moveRightCalled).toBe(true);
            expect(event.preventDefault).toHaveBeenCalled();
        });
        
        it('should execute rotate action on ArrowUp keydown', () => {
            const event = createKeyboardEvent('keydown', 'ArrowUp');
            
            inputHandler.handleKeyDown(event);
            
            expect(mockTetrominoManager.rotatePieceCalled).toBe(true);
            expect(event.preventDefault).toHaveBeenCalled();
        });
        
        it('should execute rotate action on Spacebar keydown', () => {
            const event = createKeyboardEvent('keydown', ' ');
            
            inputHandler.handleKeyDown(event);
            
            expect(mockTetrominoManager.rotatePieceCalled).toBe(true);
            expect(event.preventDefault).toHaveBeenCalled();
        });
        
        it('should execute softDrop action on ArrowDown keydown', () => {
            const event = createKeyboardEvent('keydown', 'ArrowDown');
            
            inputHandler.handleKeyDown(event);
            
            expect(mockGameEngine.startSoftDropCalled).toBe(true);
            expect(event.preventDefault).toHaveBeenCalled();
        });
        
        it('should stop soft drop on ArrowDown keyup', () => {
            const keydownEvent = createKeyboardEvent('keydown', 'ArrowDown');
            const keyupEvent = createKeyboardEvent('keyup', 'ArrowDown');
            
            inputHandler.handleKeyDown(keydownEvent);
            inputHandler.handleKeyUp(keyupEvent);
            
            expect(mockGameEngine.stopSoftDropCalled).toBe(true);
            expect(keyupEvent.preventDefault).toHaveBeenCalled();
        });
        
        it('should execute pause action on p keydown', () => {
            const event = createKeyboardEvent('keydown', 'p');
            
            inputHandler.handleKeyDown(event);
            
            expect(mockGameEngine.pauseCalled).toBe(true);
            expect(event.preventDefault).toHaveBeenCalled();
        });
        
        it('should execute resume action on p keydown when paused', () => {
            mockGameEngine.gameState.status = 'paused';
            const event = createKeyboardEvent('keydown', 'p');
            
            inputHandler.handleKeyDown(event);
            
            expect(mockGameEngine.resumeCalled).toBe(true);
            expect(event.preventDefault).toHaveBeenCalled();
        });
        
        it('should execute restart action on r keydown', () => {
            const event = createKeyboardEvent('keydown', 'r');
            
            inputHandler.handleKeyDown(event);
            
            expect(mockGameEngine.startCalled).toBe(true);
            expect(event.preventDefault).toHaveBeenCalled();
        });
        
        it('should ignore unmapped keys', () => {
            const event = createKeyboardEvent('keydown', 'x');
            
            inputHandler.handleKeyDown(event);
            
            expect(event.preventDefault).not.toHaveBeenCalled();
            expect(mockTetrominoManager.moveLeftCalled).toBe(false);
        });
        
        it('should not execute game actions when game is not playing', () => {
            mockGameEngine.gameState.status = 'gameOver';
            const event = createKeyboardEvent('keydown', 'ArrowLeft');
            
            inputHandler.handleKeyDown(event);
            
            expect(mockTetrominoManager.moveLeftCalled).toBe(false);
            expect(event.preventDefault).toHaveBeenCalled(); // Still prevent default
        });
        
        it('should allow pause/restart actions regardless of game state', () => {
            mockGameEngine.gameState.status = 'gameOver';
            mockGameEngine.reset();
            
            const pauseEvent = createKeyboardEvent('keydown', 'p');
            const restartEvent = createKeyboardEvent('keydown', 'r');
            
            inputHandler.handleKeyDown(pauseEvent);
            inputHandler.handleKeyDown(restartEvent);
            
            expect(mockGameEngine.pauseCalled).toBe(true);
            expect(mockGameEngine.startCalled).toBe(true);
        });
    });
    
    describe('Continuous Input and Key Repeat', () => {
        beforeEach(() => {
            inputHandler.bindEvents();
            vi.useFakeTimers();
        });
        
        afterEach(() => {
            vi.useRealTimers();
        });
        
        it('should track pressed keys for continuous actions', () => {
            const event = createKeyboardEvent('keydown', 'ArrowLeft');
            
            inputHandler.handleKeyDown(event);
            
            expect(inputHandler.isKeyPressed('ArrowLeft')).toBe(true);
            expect(inputHandler.keyTimers.has('ArrowLeft')).toBe(true);
        });
        
        it('should remove key from pressed set on keyup', () => {
            const keydownEvent = createKeyboardEvent('keydown', 'ArrowLeft');
            const keyupEvent = createKeyboardEvent('keyup', 'ArrowLeft');
            
            inputHandler.handleKeyDown(keydownEvent);
            expect(inputHandler.isKeyPressed('ArrowLeft')).toBe(true);
            
            inputHandler.handleKeyUp(keyupEvent);
            expect(inputHandler.isKeyPressed('ArrowLeft')).toBe(false);
            expect(inputHandler.keyTimers.has('ArrowLeft')).toBe(false);
        });
        
        it('should not track non-continuous actions', () => {
            const event = createKeyboardEvent('keydown', 'ArrowUp');
            
            inputHandler.handleKeyDown(event);
            
            expect(inputHandler.isKeyPressed('ArrowUp')).toBe(false);
            expect(inputHandler.keyTimers.has('ArrowUp')).toBe(false);
        });
        
        it('should execute action immediately on first keydown', () => {
            const event = createKeyboardEvent('keydown', 'ArrowLeft');
            
            inputHandler.handleKeyDown(event);
            
            expect(mockTetrominoManager.moveLeftCount).toBe(1);
        });
        
        it('should use different repeat intervals for different actions', () => {
            const leftEvent = createKeyboardEvent('keydown', 'ArrowLeft');
            const downEvent = createKeyboardEvent('keydown', 'ArrowDown');
            
            inputHandler.handleKeyDown(leftEvent);
            inputHandler.handleKeyDown(downEvent);
            
            const leftTimer = inputHandler.keyTimers.get('ArrowLeft');
            const downTimer = inputHandler.keyTimers.get('ArrowDown');
            
            expect(leftTimer.repeatInterval).toBe(50); // Regular repeat interval
            expect(downTimer.repeatInterval).toBe(30); // Soft drop interval
        });
    });
    
    describe('State Management', () => {
        it('should provide current input state', () => {
            inputHandler.bindEvents();
            const leftEvent = createKeyboardEvent('keydown', 'ArrowLeft');
            inputHandler.handleKeyDown(leftEvent);
            
            const state = inputHandler.getInputState();
            
            expect(state.keysPressed).toContain('ArrowLeft');
            expect(state.activeTimers).toContain('ArrowLeft');
            expect(state.isActive).toBe(true);
            expect(state.config).toEqual(inputHandler.config);
        });
        
        it('should check if action is active', () => {
            inputHandler.bindEvents();
            const event = createKeyboardEvent('keydown', 'ArrowLeft');
            inputHandler.handleKeyDown(event);
            
            expect(inputHandler.isActionActive('moveLeft')).toBe(true);
            expect(inputHandler.isActionActive('moveRight')).toBe(false);
        });
        
        it('should reset all input state', () => {
            inputHandler.bindEvents();
            const event = createKeyboardEvent('keydown', 'ArrowLeft');
            inputHandler.handleKeyDown(event);
            
            expect(inputHandler.keysPressed.size).toBeGreaterThan(0);
            expect(inputHandler.keyTimers.size).toBeGreaterThan(0);
            
            inputHandler.reset();
            
            expect(inputHandler.keysPressed.size).toBe(0);
            expect(inputHandler.keyTimers.size).toBe(0);
        });
    });
    
    describe('Configuration', () => {
        it('should update key mappings', () => {
            const newMappings = { 'w': 'rotate', 'a': 'moveLeft' };
            
            inputHandler.updateKeyMappings(newMappings);
            
            expect(inputHandler.keyMappings['w']).toBe('rotate');
            expect(inputHandler.keyMappings['a']).toBe('moveLeft');
            expect(inputHandler.keyMappings['ArrowRight']).toBe('moveRight'); // Original mapping preserved
        });
        
        it('should update timing configuration', () => {
            const newConfig = { initialDelay: 300, repeatInterval: 75 };
            
            inputHandler.updateConfig(newConfig);
            
            expect(inputHandler.config.initialDelay).toBe(300);
            expect(inputHandler.config.repeatInterval).toBe(75);
            expect(inputHandler.config.softDropInterval).toBe(30); // Original value preserved
        });
    });
    
    describe('Edge Cases', () => {
        beforeEach(() => {
            inputHandler.bindEvents();
        });
        
        it('should handle multiple keydown events for same key', () => {
            const event1 = createKeyboardEvent('keydown', 'ArrowLeft');
            const event2 = createKeyboardEvent('keydown', 'ArrowLeft');
            
            inputHandler.handleKeyDown(event1);
            inputHandler.handleKeyDown(event2);
            
            expect(mockTetrominoManager.moveLeftCount).toBe(1); // Should only execute once
            expect(inputHandler.keyTimers.size).toBe(1); // Should only have one timer
        });
        
        it('should handle keyup without corresponding keydown', () => {
            const event = createKeyboardEvent('keyup', 'ArrowLeft');
            
            // Should not throw error
            expect(() => inputHandler.handleKeyUp(event)).not.toThrow();
            expect(event.preventDefault).toHaveBeenCalled();
        });
        
        it('should handle events when not bound', () => {
            inputHandler.unbindEvents();
            const event = createKeyboardEvent('keydown', 'ArrowLeft');
            
            // Should not throw error when handling events while unbound
            expect(() => inputHandler.handleKeyDown(event)).not.toThrow();
        });
    });
});