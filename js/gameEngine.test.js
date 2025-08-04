/**
 * Tests for GameEngine class
 * Tests timing mechanics, piece locking behavior, and automatic falling
 */

import { describe, it, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { GameEngine } from './gameEngine.js';

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

describe('GameEngine', () => {
    let gameEngine;
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
    });

    afterEach(() => {
        if (gameEngine.isRunning) {
            gameEngine.stop();
        }
    });

    describe('Initialization', () => {
        test('should initialize with correct default configuration', () => {
            const engine = new GameEngine();
            expect(engine.config.boardWidth).toBe(10);
            expect(engine.config.boardHeight).toBe(20);
            expect(engine.config.initialFallSpeed).toBe(1000);
            expect(engine.config.softDropSpeed).toBe(50);
            expect(engine.config.lockDelay).toBe(500);
        });

        test('should initialize with custom configuration', () => {
            const customConfig = {
                boardWidth: 8,
                boardHeight: 16,
                initialFallSpeed: 800,
                softDropSpeed: 40,
                lockDelay: 400
            };
            const engine = new GameEngine(customConfig);
            expect(engine.config.boardWidth).toBe(8);
            expect(engine.config.boardHeight).toBe(16);
            expect(engine.config.initialFallSpeed).toBe(800);
            expect(engine.config.softDropSpeed).toBe(40);
            expect(engine.config.lockDelay).toBe(400);
        });

        test('should initialize game state correctly', () => {
            const state = gameEngine.getGameState();
            expect(gameEngine.gameState.status).toBe('stopped');
            expect(state.level).toBe(1);
            expect(state.score).toBe(0);
            expect(state.linesCleared).toBe(0);
            expect(gameEngine.gameState.fallSpeed).toBe(1000);
        });

        test('should initialize timing variables', () => {
            expect(gameEngine.lastFallTime).toBe(0);
            expect(gameEngine.lastUpdateTime).toBe(0);
            expect(gameEngine.lockTimer).toBe(0);
            expect(gameEngine.isLockDelayActive).toBe(false);
            expect(gameEngine.isSoftDropping).toBe(false);
        });
    });

    describe('Game State Management', () => {
        test('should start game correctly', () => {
            gameEngine.start();
            expect(gameEngine.gameState.status).toBe('playing');
            expect(gameEngine.isRunning).toBe(true);
            expect(gameEngine.tetrominoManager.hasActivePiece()).toBe(true);
        });

        test('should pause and resume game', () => {
            gameEngine.start();
            gameEngine.pause();
            expect(gameEngine.gameState.status).toBe('paused');
            
            gameEngine.resume();
            expect(gameEngine.gameState.status).toBe('playing');
        });

        test('should stop game correctly', () => {
            gameEngine.start();
            gameEngine.stop();
            expect(gameEngine.gameState.status).toBe('stopped');
            expect(gameEngine.isRunning).toBe(false);
        });

        test('should reset game state', () => {
            gameEngine.gameState.score = 1000;
            gameEngine.gameState.level = 5;
            gameEngine.gameState.linesCleared = 20;
            
            gameEngine.reset();
            
            const state = gameEngine.getGameState();
            expect(state.score).toBe(0);
            expect(state.level).toBe(1);
            expect(state.linesCleared).toBe(0);
            expect(gameEngine.gameState.status).toBe('stopped');
        });
    });

    describe('Pause Functionality', () => {
        test('should only pause when game is playing', () => {
            // Test pausing from stopped state
            expect(gameEngine.gameState.status).toBe('stopped');
            gameEngine.pause();
            expect(gameEngine.gameState.status).toBe('stopped');
            
            // Test pausing from playing state
            gameEngine.start();
            expect(gameEngine.gameState.status).toBe('playing');
            gameEngine.pause();
            expect(gameEngine.gameState.status).toBe('paused');
        });

        test('should only resume when game is paused', () => {
            // Test resuming from stopped state
            expect(gameEngine.gameState.status).toBe('stopped');
            gameEngine.resume();
            expect(gameEngine.gameState.status).toBe('stopped');
            
            // Test resuming from playing state
            gameEngine.start();
            expect(gameEngine.gameState.status).toBe('playing');
            gameEngine.resume();
            expect(gameEngine.gameState.status).toBe('playing');
            
            // Test resuming from paused state
            gameEngine.pause();
            expect(gameEngine.gameState.status).toBe('paused');
            gameEngine.resume();
            expect(gameEngine.gameState.status).toBe('playing');
        });

        test('should toggle pause state correctly', () => {
            gameEngine.start();
            expect(gameEngine.gameState.status).toBe('playing');
            
            gameEngine.togglePause();
            expect(gameEngine.gameState.status).toBe('paused');
            
            gameEngine.togglePause();
            expect(gameEngine.gameState.status).toBe('playing');
        });

        test('should not toggle pause when game is stopped or game over', () => {
            // Test from stopped state
            expect(gameEngine.gameState.status).toBe('stopped');
            gameEngine.togglePause();
            expect(gameEngine.gameState.status).toBe('stopped');
            
            // Test from game over state
            gameEngine.gameState.status = 'gameOver';
            gameEngine.togglePause();
            expect(gameEngine.gameState.status).toBe('gameOver');
        });

        test('should store pause time when pausing', () => {
            const mockTime = 1000;
            const originalNow = performance.now;
            performance.now = vi.fn(() => mockTime);
            
            gameEngine.start();
            gameEngine.pause();
            
            expect(gameEngine.pauseTime).toBe(mockTime);
            
            performance.now = originalNow;
        });

        test('should adjust timers when resuming from pause', () => {
            const originalNow = performance.now;
            let mockTime = 1000;
            performance.now = vi.fn(() => mockTime);
            
            gameEngine.start();
            gameEngine.lastFallTime = 500;
            
            // Pause the game
            mockTime = 2000;
            gameEngine.pause();
            
            // Resume after 1 second pause
            mockTime = 3000;
            gameEngine.resume();
            
            // lastFallTime should be adjusted by pause duration (1000ms)
            expect(gameEngine.lastFallTime).toBe(1500); // 500 + 1000
            expect(gameEngine.lastUpdateTime).toBe(3000);
            
            performance.now = originalNow;
        });

        test('should call game state change callback when pausing', () => {
            const callback = vi.fn();
            gameEngine.onGameStateChange = callback;
            
            gameEngine.start();
            callback.mockClear(); // Clear the start call
            
            gameEngine.pause();
            
            expect(callback).toHaveBeenCalledWith(
                expect.objectContaining({ status: 'paused' })
            );
        });

        test('should call game state change callback when resuming', () => {
            const callback = vi.fn();
            gameEngine.onGameStateChange = callback;
            
            gameEngine.start();
            gameEngine.pause();
            callback.mockClear(); // Clear previous calls
            
            gameEngine.resume();
            
            expect(callback).toHaveBeenCalledWith(
                expect.objectContaining({ status: 'playing' })
            );
        });

        test('should not update game logic when paused', () => {
            gameEngine.start();
            const initialY = gameEngine.tetrominoManager.getCurrentPiece().y;
            
            gameEngine.pause();
            
            // Mock time passage that would normally cause piece to fall
            const originalNow = performance.now;
            let mockTime = 0;
            performance.now = vi.fn(() => mockTime);
            
            gameEngine.lastFallTime = 0;
            mockTime = 2000; // Way past fall speed
            
            gameEngine.update(100);
            
            // Piece should not have moved
            const newY = gameEngine.tetrominoManager.getCurrentPiece().y;
            expect(newY).toBe(initialY);
            
            performance.now = originalNow;
        });

        test('should preserve game state during pause', () => {
            gameEngine.start();
            
            // Set up some game state
            gameEngine.scoreManager.addScore(2); // Add some score
            const stateBefore = gameEngine.getGameState();
            
            gameEngine.pause();
            const stateDuringPause = gameEngine.getGameState();
            
            gameEngine.resume();
            const stateAfterResume = gameEngine.getGameState();
            
            // All state except status should be preserved
            expect(stateDuringPause.score).toBe(stateBefore.score);
            expect(stateDuringPause.level).toBe(stateBefore.level);
            expect(stateDuringPause.linesCleared).toBe(stateBefore.linesCleared);
            expect(stateDuringPause.currentPiece).toEqual(stateBefore.currentPiece);
            expect(stateDuringPause.nextPiece).toEqual(stateBefore.nextPiece);
            
            expect(stateAfterResume.score).toBe(stateBefore.score);
            expect(stateAfterResume.level).toBe(stateBefore.level);
            expect(stateAfterResume.linesCleared).toBe(stateBefore.linesCleared);
            expect(stateAfterResume.currentPiece).toEqual(stateBefore.currentPiece);
            expect(stateAfterResume.nextPiece).toEqual(stateBefore.nextPiece);
        });

        test('should reset pause time when resetting game', () => {
            gameEngine.start();
            gameEngine.pause();
            
            expect(gameEngine.pauseTime).toBeGreaterThan(0);
            
            gameEngine.reset();
            
            expect(gameEngine.pauseTime).toBe(0);
        });
    });

    describe('Automatic Falling Mechanics', () => {
        test('should move piece down automatically after fall timer expires', () => {
            gameEngine.start();
            const initialY = gameEngine.tetrominoManager.getCurrentPiece().y;
            
            // Mock performance.now to simulate time passage
            const originalNow = performance.now;
            let mockTime = 0;
            performance.now = vi.fn(() => mockTime);
            
            // Set initial time
            gameEngine.lastFallTime = 0;
            mockTime = 1100; // Exceed fall speed of 1000ms
            
            gameEngine.update(100);
            
            const newY = gameEngine.tetrominoManager.getCurrentPiece().y;
            expect(newY).toBe(initialY + 1);
            
            performance.now = originalNow;
        });

        test('should not move piece down before fall timer expires', () => {
            gameEngine.start();
            const initialY = gameEngine.tetrominoManager.getCurrentPiece().y;
            
            // Mock performance.now to simulate time passage
            const originalNow = performance.now;
            let mockTime = 0;
            performance.now = () => mockTime;
            
            gameEngine.lastFallTime = 0;
            mockTime = 500; // Less than fall speed of 1000ms
            
            gameEngine.update(100);
            
            const newY = gameEngine.tetrominoManager.getCurrentPiece().y;
            expect(newY).toBe(initialY);
            
            performance.now = originalNow;
        });

        test('should update fall speed based on level', () => {
            // Level 1 (initial)
            gameEngine.updateFallSpeed();
            const level1Speed = gameEngine.gameState.fallSpeed;
            
            // Simulate advancing to level 2 by adding lines
            gameEngine.scoreManager.addScore(4); // 4 lines
            gameEngine.scoreManager.addScore(4); // 4 lines
            gameEngine.scoreManager.addScore(2); // 2 lines (total: 10 lines = level 2)
            gameEngine.updateFallSpeed();
            const level2Speed = gameEngine.gameState.fallSpeed;
            
            expect(level2Speed).toBeLessThan(level1Speed);
        });

        test('should have minimum fall speed limit', () => {
            gameEngine.gameState.level = 100; // Very high level
            gameEngine.updateFallSpeed();
            
            expect(gameEngine.gameState.fallSpeed).toBeGreaterThanOrEqual(50);
        });
    });

    describe('Soft Drop Functionality', () => {
        test('should enable soft drop', () => {
            gameEngine.startSoftDrop();
            expect(gameEngine.isSoftDropping).toBe(true);
        });

        test('should disable soft drop', () => {
            gameEngine.startSoftDrop();
            gameEngine.stopSoftDrop();
            expect(gameEngine.isSoftDropping).toBe(false);
        });

        test('should use faster fall speed during soft drop', () => {
            gameEngine.start();
            gameEngine.startSoftDrop();
            
            const initialY = gameEngine.tetrominoManager.getCurrentPiece().y;
            
            // Mock performance.now to simulate time passage
            const originalNow = performance.now;
            let mockTime = 0;
            performance.now = vi.fn(() => mockTime);
            
            gameEngine.lastFallTime = 0;
            mockTime = 60; // Exceed soft drop speed of 50ms
            
            gameEngine.update(10);
            
            const newY = gameEngine.tetrominoManager.getCurrentPiece().y;
            expect(newY).toBe(initialY + 1);
            
            performance.now = originalNow;
        });
    });

    describe('Piece Locking Mechanics', () => {
        test('should activate lock delay when piece cannot move down', () => {
            gameEngine.start();
            
            // Fill bottom row to prevent downward movement
            const board = gameEngine.boardManager.getBoard();
            for (let col = 0; col < 10; col++) {
                board[19][col] = { type: 'I', color: '#00FFFF' };
            }
            
            // Move piece to bottom
            const piece = gameEngine.tetrominoManager.getCurrentPiece();
            piece.y = 18;
            
            gameEngine.tryMovePieceDown();
            
            expect(gameEngine.isLockDelayActive).toBe(true);
            expect(gameEngine.lockTimer).toBe(0);
        });

        test('should reset lock delay when piece moves down successfully', () => {
            gameEngine.start();
            gameEngine.isLockDelayActive = true;
            gameEngine.lockTimer = 200;
            
            gameEngine.tryMovePieceDown();
            
            expect(gameEngine.isLockDelayActive).toBe(false);
            expect(gameEngine.lockTimer).toBe(0);
        });

        test('should lock piece after lock delay expires', () => {
            gameEngine.start();
            
            // Set up conditions for locking
            gameEngine.isLockDelayActive = true;
            gameEngine.lockTimer = 0;
            
            // Simulate lock delay expiration
            gameEngine.updateLockDelay(600); // Exceed lock delay of 500ms
            
            expect(gameEngine.tetrominoManager.hasActivePiece()).toBe(false);
        });

        test('should not lock piece before lock delay expires', () => {
            gameEngine.start();
            
            gameEngine.isLockDelayActive = true;
            gameEngine.lockTimer = 0;
            
            // Simulate time passage less than lock delay
            gameEngine.updateLockDelay(300); // Less than lock delay of 500ms
            
            expect(gameEngine.tetrominoManager.hasActivePiece()).toBe(true);
        });
    });

    describe('Line Clearing and Scoring', () => {
        test('should handle single line clear correctly', () => {
            gameEngine.start();
            // Set level to 2 by clearing 10 lines first
            gameEngine.scoreManager.addScore(4); // 4 lines
            gameEngine.scoreManager.addScore(4); // 4 lines
            gameEngine.scoreManager.addScore(2); // 2 lines (total: 10 lines = level 2)
            
            gameEngine.handleLinesCleared(1);
            
            const state = gameEngine.getGameState();
            expect(state.score).toBe(2100); // 800 + 800 + 300 + 200 = 2100
            expect(state.linesCleared).toBe(11); // 10 + 1
        });

        test('should handle multiple line clears correctly', () => {
            gameEngine.start();
            // Set level to 3 by clearing 20 lines first
            for (let i = 0; i < 5; i++) {
                gameEngine.scoreManager.addScore(4); // 4 lines each, 5 times = 20 lines = level 3
            }
            
            gameEngine.handleLinesCleared(4); // Tetris
            
            const state = gameEngine.getGameState();
            expect(state.score).toBe(8000); // 800+800+800+1600+1600+2400 = 8000
            expect(state.linesCleared).toBe(24); // 20 + 4
        });

        test('should increase level after clearing 10 lines', () => {
            gameEngine.start();
            // Clear 8 lines first
            gameEngine.scoreManager.addScore(4); // 4 lines
            gameEngine.scoreManager.addScore(4); // 4 lines (total: 8)
            
            gameEngine.handleLinesCleared(3); // Total becomes 11
            
            const state = gameEngine.getGameState();
            expect(state.level).toBe(2);
        });

        test('should get correct base score for different line counts', () => {
            // Test base scores through ScoreManager
            expect(gameEngine.scoreManager.getBaseScore(1)).toBe(100);
            expect(gameEngine.scoreManager.getBaseScore(2)).toBe(300);
            expect(gameEngine.scoreManager.getBaseScore(3)).toBe(500);
            expect(gameEngine.scoreManager.getBaseScore(4)).toBe(800);
            expect(gameEngine.scoreManager.getBaseScore(0)).toBe(0);
            expect(gameEngine.scoreManager.getBaseScore(5)).toBe(0);
        });
    });

    describe('Game Over Conditions', () => {
        test('should trigger game over when board is full', () => {
            gameEngine.start();
            
            // Mock board manager to return game over
            gameEngine.boardManager.isGameOver = vi.fn(() => true);
            
            gameEngine.lockCurrentPiece();
            
            expect(gameEngine.gameState.status).toBe('gameOver');
            expect(gameEngine.isRunning).toBe(false);
        });

        test('should trigger game over when new piece cannot spawn', () => {
            // Mock tetromino manager to fail spawning
            gameEngine.tetrominoManager.spawnPiece = vi.fn(() => null);
            
            gameEngine.start();
            
            expect(gameEngine.gameState.status).toBe('gameOver');
        });
    });

    describe('Event Callbacks', () => {
        test('should call game state change callback', () => {
            const callback = vi.fn();
            gameEngine.onGameStateChange = callback;
            
            gameEngine.start();
            
            expect(callback).toHaveBeenCalledWith(gameEngine.getGameState());
        });

        test('should call score change callback', () => {
            const callback = vi.fn();
            gameEngine.onScoreChange = callback;
            
            gameEngine.start();
            gameEngine.handleLinesCleared(1);
            
            const state = gameEngine.getGameState();
            expect(callback).toHaveBeenCalledWith(
                state.score,
                state.level,
                state.linesCleared
            );
        });

        test('should call lines cleared callback', () => {
            const callback = vi.fn();
            gameEngine.onLinesCleared = callback;
            
            gameEngine.start();
            gameEngine.handleLinesCleared(2, [18, 19]);
            
            expect(callback).toHaveBeenCalledWith(2, [18, 19]);
        });

        test('should call game over callback', () => {
            const callback = vi.fn();
            gameEngine.onGameOver = callback;
            
            gameEngine.start();
            gameEngine.gameOver();
            
            expect(callback).toHaveBeenCalledWith(gameEngine.gameState);
        });
    });

    describe('Game State Retrieval', () => {
        test('should return complete game state', () => {
            gameEngine.start();
            const state = gameEngine.getGameState();
            
            expect(state).toHaveProperty('status');
            expect(state).toHaveProperty('level');
            expect(state).toHaveProperty('score');
            expect(state).toHaveProperty('linesCleared');
            expect(state).toHaveProperty('board');
            expect(state).toHaveProperty('currentPiece');
            expect(state).toHaveProperty('nextPiece');
            expect(state).toHaveProperty('isLockDelayActive');
            expect(state).toHaveProperty('lockTimer');
            expect(state).toHaveProperty('isSoftDropping');
        });

        test('should return manager instances', () => {
            expect(gameEngine.getTetrominoManager()).toBe(gameEngine.tetrominoManager);
            expect(gameEngine.getBoardManager()).toBe(gameEngine.boardManager);
        });
    });
});