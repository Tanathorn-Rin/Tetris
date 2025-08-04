/**
 * Integration test to verify pause functionality works end-to-end
 * This test simulates the complete pause workflow including UI updates
 */

import { describe, it, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { GameEngine } from './gameEngine.js';
import { InputHandler } from './inputHandler.js';
import { GameRenderer } from './gameRenderer.js';

// Mock DOM elements for testing
const mockCanvas = {
    getContext: vi.fn(() => ({
        clearRect: vi.fn(),
        fillRect: vi.fn(),
        strokeRect: vi.fn(),
        fillText: vi.fn(),
        save: vi.fn(),
        restore: vi.fn(),
        translate: vi.fn(),
        scale: vi.fn(),
        beginPath: vi.fn(),
        moveTo: vi.fn(),
        lineTo: vi.fn(),
        stroke: vi.fn(),
        fill: vi.fn(),
        arc: vi.fn(),
        rect: vi.fn(),
        closePath: vi.fn(),
        setLineDash: vi.fn(),
        measureText: vi.fn(() => ({ width: 50 }))
    })),
    width: 300,
    height: 600
};

const mockNextCanvas = {
    getContext: vi.fn(() => ({
        clearRect: vi.fn(),
        fillRect: vi.fn(),
        strokeRect: vi.fn(),
        fillText: vi.fn(),
        save: vi.fn(),
        restore: vi.fn(),
        translate: vi.fn(),
        scale: vi.fn(),
        beginPath: vi.fn(),
        moveTo: vi.fn(),
        lineTo: vi.fn(),
        stroke: vi.fn(),
        fill: vi.fn(),
        arc: vi.fn(),
        rect: vi.fn(),
        closePath: vi.fn(),
        setLineDash: vi.fn(),
        measureText: vi.fn(() => ({ width: 50 }))
    })),
    width: 120,
    height: 120
};

// Mock DOM elements
const mockPauseOverlay = {
    classList: {
        add: vi.fn(),
        remove: vi.fn()
    }
};

const mockGameOverOverlay = {
    classList: {
        add: vi.fn(),
        remove: vi.fn()
    }
};

// Mock document
global.document = {
    getElementById: vi.fn((id) => {
        switch (id) {
            case 'pauseOverlay':
                return mockPauseOverlay;
            case 'gameOverOverlay':
                return mockGameOverOverlay;
            case 'score':
                return { textContent: '0' };
            case 'level':
                return { textContent: '1' };
            case 'lines':
                return { textContent: '0' };
            case 'status':
                return { textContent: 'Playing' };
            default:
                return null;
        }
    }),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn()
};

// Mock browser APIs
global.requestAnimationFrame = vi.fn((callback) => {
    return setTimeout(callback, 16);
});

global.cancelAnimationFrame = vi.fn((id) => {
    clearTimeout(id);
});

global.performance = {
    now: vi.fn(() => Date.now())
};

describe('Pause Functionality Integration Test', () => {
    let gameEngine;
    let inputHandler;
    let gameRenderer;
    let gameConfig;

    beforeEach(() => {
        gameConfig = {
            boardWidth: 10,
            boardHeight: 20,
            initialFallSpeed: 1000,
            softDropSpeed: 50,
            lockDelay: 500,
            BLOCK_SIZE: 30,
            CANVAS_WIDTH: 300,
            CANVAS_HEIGHT: 600,
            NEXT_CANVAS_SIZE: 120
        };

        gameEngine = new GameEngine(gameConfig);
        inputHandler = new InputHandler(gameEngine);
        gameRenderer = new GameRenderer(
            mockCanvas.getContext('2d'),
            mockNextCanvas.getContext('2d'),
            gameConfig
        );

        // Set up game state change callback to simulate UI updates
        gameEngine.onGameStateChange = (gameState) => {
            updateUI(gameState);
        };

        // Clear all mocks
        vi.clearAllMocks();
    });

    afterEach(() => {
        if (gameEngine.isRunning) {
            gameEngine.stop();
        }
        if (inputHandler.isActive) {
            inputHandler.unbindEvents();
        }
    });

    // Simulate the updateUI function from main.js
    function updateUI(gameState) {
        const pauseOverlay = document.getElementById('pauseOverlay');
        if (pauseOverlay) {
            if (gameState.status === 'paused') {
                pauseOverlay.classList.remove('hidden');
            } else {
                pauseOverlay.classList.add('hidden');
            }
        }

        const gameOverOverlay = document.getElementById('gameOverOverlay');
        if (gameOverOverlay) {
            if (gameState.status === 'gameOver') {
                gameOverOverlay.classList.remove('hidden');
            } else {
                gameOverOverlay.classList.add('hidden');
            }
        }
    }

    test('should complete full pause workflow with UI updates', () => {
        // Start the game
        gameEngine.start();
        expect(gameEngine.gameState.status).toBe('playing');
        
        // Verify pause overlay is hidden initially
        expect(mockPauseOverlay.classList.add).toHaveBeenCalledWith('hidden');
        
        // Pause the game using input handler
        const pauseEvent = {
            key: 'p',
            preventDefault: vi.fn()
        };
        
        inputHandler.handleKeyDown(pauseEvent);
        
        // Verify game is paused
        expect(gameEngine.gameState.status).toBe('paused');
        
        // Verify pause overlay is shown
        expect(mockPauseOverlay.classList.remove).toHaveBeenCalledWith('hidden');
        
        // Verify event was prevented
        expect(pauseEvent.preventDefault).toHaveBeenCalled();
        
        // Resume the game
        const resumeEvent = {
            key: 'p',
            preventDefault: vi.fn()
        };
        
        inputHandler.handleKeyDown(resumeEvent);
        
        // Verify game is playing again
        expect(gameEngine.gameState.status).toBe('playing');
        
        // Verify pause overlay is hidden again
        expect(mockPauseOverlay.classList.add).toHaveBeenCalledWith('hidden');
    });

    test('should block game inputs during pause', () => {
        gameEngine.start();
        const tetrominoManager = gameEngine.getTetrominoManager();
        const initialPiece = { ...tetrominoManager.getCurrentPiece() };
        
        // Pause the game
        gameEngine.pause();
        
        // Try to move piece while paused
        const moveEvent = {
            key: 'ArrowLeft',
            preventDefault: vi.fn()
        };
        
        inputHandler.handleKeyDown(moveEvent);
        
        // Piece should not have moved
        const currentPiece = tetrominoManager.getCurrentPiece();
        expect(currentPiece.x).toBe(initialPiece.x);
        expect(currentPiece.y).toBe(initialPiece.y);
        expect(currentPiece.rotation).toBe(initialPiece.rotation);
        
        // Event should still be prevented
        expect(moveEvent.preventDefault).toHaveBeenCalled();
    });

    test('should preserve game state during pause cycle', () => {
        gameEngine.start();
        
        // Add some score and progress
        gameEngine.scoreManager.addScore(2); // Add 2 lines
        const stateBefore = gameEngine.getGameState();
        
        // Pause and resume
        gameEngine.pause();
        gameEngine.resume();
        
        const stateAfter = gameEngine.getGameState();
        
        // All game state should be preserved
        expect(stateAfter.score).toBe(stateBefore.score);
        expect(stateAfter.level).toBe(stateBefore.level);
        expect(stateAfter.linesCleared).toBe(stateBefore.linesCleared);
        expect(stateAfter.currentPiece).toEqual(stateBefore.currentPiece);
        expect(stateAfter.nextPiece).toEqual(stateBefore.nextPiece);
        expect(stateAfter.status).toBe('playing');
    });

    test('should handle escape key for pause', () => {
        gameEngine.start();
        
        const escapeEvent = {
            key: 'Escape',
            preventDefault: vi.fn()
        };
        
        inputHandler.handleKeyDown(escapeEvent);
        
        expect(gameEngine.gameState.status).toBe('paused');
        expect(mockPauseOverlay.classList.remove).toHaveBeenCalledWith('hidden');
        expect(escapeEvent.preventDefault).toHaveBeenCalled();
    });

    test('should handle restart during pause', () => {
        gameEngine.start();
        gameEngine.pause();
        
        const restartEvent = {
            key: 'r',
            preventDefault: vi.fn()
        };
        
        // Mock the start method to verify it's called
        const startSpy = vi.spyOn(gameEngine, 'start');
        
        inputHandler.handleKeyDown(restartEvent);
        
        expect(startSpy).toHaveBeenCalled();
        expect(restartEvent.preventDefault).toHaveBeenCalled();
    });

    test('should not show game over overlay when paused', () => {
        gameEngine.start();
        gameEngine.pause();
        
        // Game over overlay should remain hidden
        expect(mockGameOverOverlay.classList.add).toHaveBeenCalledWith('hidden');
        expect(mockGameOverOverlay.classList.remove).not.toHaveBeenCalledWith('hidden');
    });

    test('should handle multiple pause toggles correctly', () => {
        gameEngine.start();
        
        // First pause
        gameEngine.togglePause();
        expect(gameEngine.gameState.status).toBe('paused');
        expect(mockPauseOverlay.classList.remove).toHaveBeenCalledWith('hidden');
        
        // Resume
        gameEngine.togglePause();
        expect(gameEngine.gameState.status).toBe('playing');
        expect(mockPauseOverlay.classList.add).toHaveBeenCalledWith('hidden');
        
        // Pause again
        gameEngine.togglePause();
        expect(gameEngine.gameState.status).toBe('paused');
        expect(mockPauseOverlay.classList.remove).toHaveBeenCalledWith('hidden');
    });

    test('should maintain proper timing after pause/resume cycle', () => {
        const originalNow = performance.now;
        let mockTime = 1000;
        performance.now = vi.fn(() => mockTime);
        
        gameEngine.start();
        gameEngine.lastFallTime = 500;
        
        // Pause for 2 seconds
        mockTime = 2000;
        gameEngine.pause();
        
        // Resume after pause
        mockTime = 4000;
        gameEngine.resume();
        
        // Fall timer should be adjusted for pause duration
        expect(gameEngine.lastFallTime).toBe(2500); // 500 + 2000 (pause duration)
        expect(gameEngine.lastUpdateTime).toBe(4000);
        
        performance.now = originalNow;
    });
});