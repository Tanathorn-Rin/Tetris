/**
 * Tests for GameEngine pause functionality and input blocking
 * Tests state transitions, timer management, and input blocking during pause
 */

import { describe, it, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { GameEngine } from './gameEngine.js';
import { InputHandler } from './inputHandler.js';

// Mock browser APIs for testing
global.requestAnimationFrame = vi.fn((callback) => {
    return setTimeout(callback, 16); // ~60fps
});

global.cancelAnimationFrame = vi.fn((id) => {
    clearTimeout(id);
});

global.performance = {
    now: vi.fn(() => Date.now())
};

// Mock DOM for input handler tests
global.document = {
    addEventListener: vi.fn(),
    removeEventListener: vi.fn()
};

describe('GameEngine Pause Functionality', () => {
    let gameEngine;
    let inputHandler;
    let mockConfig;

    beforeEach(() => {
        mockConfig = {
            boardWidth: 10,
            boardHeight: 20,
            initialFallSpeed: 1000,
            softDropSpeed: 50,
            lockDelay: 500
        };
        gameEngine = new GameEngine(mockConfig);
        inputHandler = new InputHandler(gameEngine);
    });

    afterEach(() => {
        if (gameEngine.isRunning) {
            gameEngine.stop();
        }
        if (inputHandler.isActive) {
            inputHandler.unbindEvents();
        }
    });

    describe('Pause State Transitions', () => {
        test('should transition from playing to paused', () => {
            gameEngine.start();
            expect(gameEngine.gameState.status).toBe('playing');
            
            gameEngine.pause();
            expect(gameEngine.gameState.status).toBe('paused');
        });

        test('should transition from paused to playing', () => {
            gameEngine.start();
            gameEngine.pause();
            expect(gameEngine.gameState.status).toBe('paused');
            
            gameEngine.resume();
            expect(gameEngine.gameState.status).toBe('playing');
        });

        test('should not pause when not playing', () => {
            // Test from stopped state
            expect(gameEngine.gameState.status).toBe('stopped');
            gameEngine.pause();
            expect(gameEngine.gameState.status).toBe('stopped');
            
            // Test from game over state
            gameEngine.gameState.status = 'gameOver';
            gameEngine.pause();
            expect(gameEngine.gameState.status).toBe('gameOver');
        });

        test('should not resume when not paused', () => {
            // Test from stopped state
            expect(gameEngine.gameState.status).toBe('stopped');
            gameEngine.resume();
            expect(gameEngine.gameState.status).toBe('stopped');
            
            // Test from playing state
            gameEngine.start();
            expect(gameEngine.gameState.status).toBe('playing');
            gameEngine.resume();
            expect(gameEngine.gameState.status).toBe('playing');
        });
    });

    describe('Timer Management During Pause', () => {
        test('should stop all timers when paused', () => {
            const originalNow = performance.now;
            let mockTime = 1000;
            performance.now = vi.fn(() => mockTime);
            
            gameEngine.start();
            const initialY = gameEngine.tetrominoManager.getCurrentPiece().y;
            
            // Pause the game
            gameEngine.pause();
            
            // Simulate significant time passage
            mockTime = 5000;
            gameEngine.update(100);
            
            // Piece should not have moved
            const newY = gameEngine.tetrominoManager.getCurrentPiece().y;
            expect(newY).toBe(initialY);
            
            performance.now = originalNow;
        });

        test('should properly adjust fall timer when resuming', () => {
            const originalNow = performance.now;
            let mockTime = 1000;
            performance.now = vi.fn(() => mockTime);
            
            gameEngine.start();
            gameEngine.lastFallTime = 500;
            
            // Pause for 2 seconds
            mockTime = 2000;
            gameEngine.pause();
            
            mockTime = 4000;
            gameEngine.resume();
            
            // Fall timer should be adjusted by pause duration
            expect(gameEngine.lastFallTime).toBe(2500); // 500 + 2000
            
            performance.now = originalNow;
        });

        test('should preserve lock delay state during pause', () => {
            gameEngine.start();
            
            // Set up lock delay state
            gameEngine.isLockDelayActive = true;
            gameEngine.lockTimer = 200;
            
            gameEngine.pause();
            
            // Lock delay state should be preserved
            expect(gameEngine.isLockDelayActive).toBe(true);
            expect(gameEngine.lockTimer).toBe(200);
            
            gameEngine.resume();
            
            // State should still be preserved after resume
            expect(gameEngine.isLockDelayActive).toBe(true);
            expect(gameEngine.lockTimer).toBe(200);
        });

        test('should not update lock delay timer when paused', () => {
            gameEngine.start();
            gameEngine.isLockDelayActive = true;
            gameEngine.lockTimer = 200;
            
            gameEngine.pause();
            
            // Try to update lock delay
            gameEngine.updateLockDelay(300);
            
            // Timer should not have changed
            expect(gameEngine.lockTimer).toBe(200);
        });
    });

    describe('Input Blocking During Pause', () => {
        test('should block movement inputs when paused', () => {
            gameEngine.start();
            const initialX = gameEngine.tetrominoManager.getCurrentPiece().x;
            
            gameEngine.pause();
            
            // Try to execute movement actions
            inputHandler.executeAction('moveLeft', { key: 'ArrowLeft' });
            inputHandler.executeAction('moveRight', { key: 'ArrowRight' });
            inputHandler.executeAction('softDrop', { key: 'ArrowDown' });
            
            // Piece should not have moved
            const piece = gameEngine.tetrominoManager.getCurrentPiece();
            expect(piece.x).toBe(initialX);
        });

        test('should block rotation inputs when paused', () => {
            gameEngine.start();
            const initialRotation = gameEngine.tetrominoManager.getCurrentPiece().rotation;
            
            gameEngine.pause();
            
            // Try to execute rotation action
            inputHandler.executeAction('rotate', { key: 'ArrowUp' });
            
            // Piece should not have rotated
            const piece = gameEngine.tetrominoManager.getCurrentPiece();
            expect(piece.rotation).toBe(initialRotation);
        });

        test('should allow pause/resume inputs when paused', () => {
            gameEngine.start();
            gameEngine.pause();
            expect(gameEngine.gameState.status).toBe('paused');
            
            // Pause action should work (resume)
            inputHandler.executeAction('pause', { key: 'p' });
            expect(gameEngine.gameState.status).toBe('playing');
        });

        test('should allow restart input when paused', () => {
            gameEngine.start();
            gameEngine.pause();
            
            // Mock the start method to verify it's called
            const startSpy = vi.spyOn(gameEngine, 'start');
            
            inputHandler.executeAction('restart', { key: 'r' });
            
            expect(startSpy).toHaveBeenCalled();
        });

        test('should handle toggle pause correctly', () => {
            gameEngine.start();
            expect(gameEngine.gameState.status).toBe('playing');
            
            // First toggle should pause
            gameEngine.togglePause();
            expect(gameEngine.gameState.status).toBe('paused');
            
            // Second toggle should resume
            gameEngine.togglePause();
            expect(gameEngine.gameState.status).toBe('playing');
        });
    });

    describe('Game State Preservation', () => {
        test('should preserve all game state during pause cycle', () => {
            gameEngine.start();
            
            // Set up some game state
            gameEngine.scoreManager.addScore(3); // Add some lines and score
            const tetrominoManager = gameEngine.getTetrominoManager();
            const originalPiece = { ...tetrominoManager.getCurrentPiece() };
            const originalNext = { ...tetrominoManager.getNextPiece() };
            
            const stateBefore = gameEngine.getGameState();
            
            // Pause and resume
            gameEngine.pause();
            gameEngine.resume();
            
            const stateAfter = gameEngine.getGameState();
            
            // All state should be preserved
            expect(stateAfter.score).toBe(stateBefore.score);
            expect(stateAfter.level).toBe(stateBefore.level);
            expect(stateAfter.linesCleared).toBe(stateBefore.linesCleared);
            expect(stateAfter.currentPiece).toEqual(originalPiece);
            expect(stateAfter.nextPiece).toEqual(originalNext);
            expect(stateAfter.status).toBe('playing');
        });

        test('should preserve board state during pause', () => {
            gameEngine.start();
            
            // Modify board state
            const board = gameEngine.boardManager.getBoard();
            board[19][0] = { type: 'I', color: '#00FFFF' };
            board[19][1] = { type: 'O', color: '#FFFF00' };
            
            const boardBefore = gameEngine.boardManager.getBoardCopy();
            
            gameEngine.pause();
            gameEngine.resume();
            
            const boardAfter = gameEngine.boardManager.getBoardCopy();
            
            expect(boardAfter).toEqual(boardBefore);
        });
    });

    describe('Event Callbacks During Pause', () => {
        test('should trigger game state change callback on pause', () => {
            const callback = vi.fn();
            gameEngine.onGameStateChange = callback;
            
            gameEngine.start();
            callback.mockClear();
            
            gameEngine.pause();
            
            expect(callback).toHaveBeenCalledWith(
                expect.objectContaining({ status: 'paused' })
            );
        });

        test('should trigger game state change callback on resume', () => {
            const callback = vi.fn();
            gameEngine.onGameStateChange = callback;
            
            gameEngine.start();
            gameEngine.pause();
            callback.mockClear();
            
            gameEngine.resume();
            
            expect(callback).toHaveBeenCalledWith(
                expect.objectContaining({ status: 'playing' })
            );
        });

        test('should not trigger other callbacks during pause', () => {
            const scoreCallback = vi.fn();
            const linesCallback = vi.fn();
            
            gameEngine.onScoreChange = scoreCallback;
            gameEngine.onLinesCleared = linesCallback;
            
            gameEngine.start();
            gameEngine.pause();
            
            // Clear any callbacks from start
            scoreCallback.mockClear();
            linesCallback.mockClear();
            
            // Try to trigger events that would normally cause callbacks
            gameEngine.handleLinesCleared(2);
            
            // Callbacks should not be triggered while paused
            expect(scoreCallback).not.toHaveBeenCalled();
            expect(linesCallback).not.toHaveBeenCalled();
        });
    });

    describe('Edge Cases', () => {
        test('should handle multiple pause calls gracefully', () => {
            gameEngine.start();
            
            gameEngine.pause();
            expect(gameEngine.gameState.status).toBe('paused');
            
            // Multiple pause calls should not change state
            gameEngine.pause();
            gameEngine.pause();
            expect(gameEngine.gameState.status).toBe('paused');
        });

        test('should handle multiple resume calls gracefully', () => {
            gameEngine.start();
            gameEngine.pause();
            
            gameEngine.resume();
            expect(gameEngine.gameState.status).toBe('playing');
            
            // Multiple resume calls should not change state
            gameEngine.resume();
            gameEngine.resume();
            expect(gameEngine.gameState.status).toBe('playing');
        });

        test('should handle pause during game over transition', () => {
            gameEngine.start();
            
            // Force game over
            gameEngine.gameState.status = 'gameOver';
            
            // Pause should not work in game over state
            gameEngine.pause();
            expect(gameEngine.gameState.status).toBe('gameOver');
        });

        test('should reset pause state when game is reset', () => {
            gameEngine.start();
            gameEngine.pause();
            
            expect(gameEngine.gameState.status).toBe('paused');
            expect(gameEngine.pauseTime).toBeGreaterThan(0);
            
            gameEngine.reset();
            
            expect(gameEngine.gameState.status).toBe('stopped');
            expect(gameEngine.pauseTime).toBe(0);
        });
    });
});