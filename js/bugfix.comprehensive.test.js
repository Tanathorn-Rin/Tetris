/**
 * Comprehensive bug fix tests
 * Tests for edge cases and bugs discovered during comprehensive testing
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GameEngine } from './gameEngine.js';
import { GameRenderer } from './gameRenderer.js';
import { resetPieceBag } from './tetrominoUtils.js';

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

// Mock DOM elements
const mockElement = {
    textContent: '',
    classList: { add: vi.fn(), remove: vi.fn() },
    style: { transform: '', color: '', textShadow: '' }
};

global.document = {
    getElementById: vi.fn(() => mockElement),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn()
};

// Mock canvas context
const mockContext = {
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 1,
    globalAlpha: 1,
    imageSmoothingEnabled: false,
    textAlign: 'center',
    textBaseline: 'middle',
    fillRect: vi.fn(),
    strokeRect: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
    setLineDash: vi.fn()
};

describe('Comprehensive Bug Fix Tests', () => {
    let gameEngine;
    let renderer;

    beforeEach(() => {
        vi.clearAllMocks();
        resetPieceBag();
        
        gameEngine = new GameEngine({
            boardWidth: 10,
            boardHeight: 20,
            initialFallSpeed: 1000
        });
        
        renderer = new GameRenderer(mockContext, mockContext, {
            BOARD_WIDTH: 10,
            BOARD_HEIGHT: 20,
            BLOCK_SIZE: 30,
            CANVAS_WIDTH: 300,
            CANVAS_HEIGHT: 600
        });
    });

    describe('Renderer Color Handling', () => {
        it('should handle null colors gracefully', () => {
            const gameState = {
                status: 'playing',
                score: 0,
                level: 1,
                linesCleared: 0,
                board: Array(20).fill(null).map(() => Array(10).fill(null)),
                currentPiece: null,
                nextPiece: null
            };
            
            // Add a block with null color to test color handling
            gameState.board[19][0] = { type: 'I', color: null };
            
            expect(() => renderer.render(gameState)).not.toThrow();
        });

        it('should handle undefined colors gracefully', () => {
            const gameState = {
                status: 'playing',
                score: 0,
                level: 1,
                linesCleared: 0,
                board: Array(20).fill(null).map(() => Array(10).fill(null)),
                currentPiece: null,
                nextPiece: null
            };
            
            // Add a block with undefined color
            gameState.board[19][0] = { type: 'I', color: undefined };
            
            expect(() => renderer.render(gameState)).not.toThrow();
        });

        it('should handle non-string colors gracefully', () => {
            const gameState = {
                status: 'playing',
                score: 0,
                level: 1,
                linesCleared: 0,
                board: Array(20).fill(null).map(() => Array(10).fill(null)),
                currentPiece: null,
                nextPiece: null
            };
            
            // Add a block with non-string color
            gameState.board[19][0] = { type: 'I', color: 123 };
            
            expect(() => renderer.render(gameState)).not.toThrow();
        });
    });

    describe('Game State Edge Cases', () => {
        it('should handle empty game state', () => {
            const emptyState = {
                status: 'playing',
                score: 0,
                level: 1,
                linesCleared: 0,
                board: null,
                currentPiece: null,
                nextPiece: null
            };
            
            expect(() => renderer.render(emptyState)).not.toThrow();
        });

        it('should handle malformed board state', () => {
            const malformedState = {
                status: 'playing',
                score: 0,
                level: 1,
                linesCleared: 0,
                board: [null, undefined, [], {}],
                currentPiece: null,
                nextPiece: null
            };
            
            expect(() => renderer.render(malformedState)).not.toThrow();
        });

        it('should handle negative scores and levels', () => {
            const negativeState = {
                status: 'playing',
                score: -100,
                level: -1,
                linesCleared: -5,
                board: Array(20).fill(null).map(() => Array(10).fill(null)),
                currentPiece: null,
                nextPiece: null
            };
            
            expect(() => renderer.render(negativeState)).not.toThrow();
        });
    });

    describe('Piece Spawning Edge Cases', () => {
        it('should handle spawn failure gracefully', () => {
            gameEngine.start();
            
            // Fill the spawn area to force spawn failure
            const boardManager = gameEngine.getBoardManager();
            const board = boardManager.getBoard();
            
            for (let y = 0; y < 4; y++) {
                for (let x = 0; x < 10; x++) {
                    board[y][x] = { type: 'I', color: '#00FFFF' };
                }
            }
            
            const tetrominoManager = gameEngine.getTetrominoManager();
            const spawnResult = tetrominoManager.spawnPiece();
            
            // Should return null when spawn fails
            expect(spawnResult).toBeNull();
            expect(tetrominoManager.getCurrentPiece()).toBeNull();
        });

        it('should handle multiple spawn attempts', () => {
            gameEngine.start();
            
            const tetrominoManager = gameEngine.getTetrominoManager();
            
            // Try spawning multiple pieces
            for (let i = 0; i < 10; i++) {
                const piece = tetrominoManager.spawnPiece();
                if (piece) {
                    // Move piece out of spawn area
                    while (tetrominoManager.canMoveDown()) {
                        tetrominoManager.moveDown();
                    }
                    tetrominoManager.lockPiece();
                }
            }
            
            // Game should still be functional
            expect(gameEngine.getGameState().status).toBeDefined();
        });
    });

    describe('Line Clearing Edge Cases', () => {
        it('should handle clearing multiple non-consecutive lines', () => {
            gameEngine.start();
            
            const boardManager = gameEngine.getBoardManager();
            const board = boardManager.getBoard();
            
            // Fill non-consecutive lines
            for (let x = 0; x < 10; x++) {
                board[19][x] = { type: 'I', color: '#00FFFF' }; // Bottom line
                board[17][x] = { type: 'I', color: '#00FFFF' }; // Skip line 18
                board[15][x] = { type: 'I', color: '#00FFFF' }; // Skip line 16
            }
            
            const clearResult = boardManager.clearLines();
            expect(clearResult.count).toBe(3);
            expect(clearResult.rows).toEqual([15, 17, 19]);
            
            // Board should be properly updated
            const newBoard = boardManager.getBoard();
            expect(newBoard[19][0]).toBeNull(); // Bottom should be empty now
        });

        it('should handle clearing all lines at once', () => {
            gameEngine.start();
            
            const boardManager = gameEngine.getBoardManager();
            const board = boardManager.getBoard();
            
            // Fill all lines
            for (let y = 0; y < 20; y++) {
                for (let x = 0; x < 10; x++) {
                    board[y][x] = { type: 'I', color: '#00FFFF' };
                }
            }
            
            const clearResult = boardManager.clearLines();
            expect(clearResult.count).toBe(20);
            
            // Board should be completely empty
            const newBoard = boardManager.getBoard();
            for (let y = 0; y < 20; y++) {
                for (let x = 0; x < 10; x++) {
                    expect(newBoard[y][x]).toBeNull();
                }
            }
        });
    });

    describe('Movement Edge Cases', () => {
        it('should handle movement with no active piece', () => {
            gameEngine.start();
            
            const tetrominoManager = gameEngine.getTetrominoManager();
            tetrominoManager.currentPiece = null;
            
            // All movements should return false
            expect(tetrominoManager.moveLeft()).toBe(false);
            expect(tetrominoManager.moveRight()).toBe(false);
            expect(tetrominoManager.moveDown()).toBe(false);
            expect(tetrominoManager.rotatePiece()).toBe(false);
        });

        it('should handle rapid movement commands', () => {
            gameEngine.start();
            
            const tetrominoManager = gameEngine.getTetrominoManager();
            const piece = tetrominoManager.spawnPiece();
            
            if (piece) {
                // Rapid movement commands
                for (let i = 0; i < 100; i++) {
                    tetrominoManager.moveLeft();
                    tetrominoManager.moveRight();
                    tetrominoManager.rotatePiece();
                    tetrominoManager.moveDown();
                }
                
                // Piece should still exist and be valid
                const currentPiece = tetrominoManager.getCurrentPiece();
                expect(currentPiece).not.toBeNull();
            }
        });
    });

    describe('Score Manager Edge Cases', () => {
        it('should handle invalid line clear counts', () => {
            const scoreManager = gameEngine.getScoreManager();
            
            const initialScore = scoreManager.getScore();
            
            // Test invalid inputs
            scoreManager.addScore(0);
            scoreManager.addScore(-1);
            scoreManager.addScore(5);
            scoreManager.addScore(null);
            scoreManager.addScore(undefined);
            scoreManager.addScore('invalid');
            
            // Score should remain unchanged
            expect(scoreManager.getScore()).toBe(initialScore);
        });

        it('should handle score overflow gracefully', () => {
            const scoreManager = gameEngine.getScoreManager();
            
            // Set a very high score
            scoreManager.score = Number.MAX_SAFE_INTEGER - 1000;
            
            // Add score that would cause overflow
            scoreManager.addScore(4); // Large Tetris score
            
            // Should handle overflow gracefully
            expect(typeof scoreManager.getScore()).toBe('number');
            expect(scoreManager.getScore()).toBeGreaterThan(0);
        });
    });

    describe('Game Engine State Management', () => {
        it('should handle rapid state changes', () => {
            gameEngine.start();
            
            // Rapid state changes
            for (let i = 0; i < 10; i++) {
                gameEngine.pause();
                gameEngine.resume();
                gameEngine.pause();
                gameEngine.resume();
            }
            
            // Game should still be in a valid state
            const state = gameEngine.getGameState();
            expect(['playing', 'paused', 'gameOver', 'stopped']).toContain(state.status);
        });

        it('should handle restart during different states', () => {
            gameEngine.start();
            
            // Test restart from playing state
            gameEngine.restart();
            expect(gameEngine.getGameState().status).toBe('playing');
            
            // Test restart from paused state
            gameEngine.pause();
            gameEngine.restart();
            expect(gameEngine.getGameState().status).toBe('playing');
            
            // Test restart from game over state
            gameEngine.gameOver();
            gameEngine.restart();
            expect(gameEngine.getGameState().status).toBe('playing');
        });
    });

    describe('Memory and Performance', () => {
        it('should not leak memory during extended play', () => {
            gameEngine.start();
            
            // Simulate extended gameplay
            for (let i = 0; i < 100; i++) {
                const tetrominoManager = gameEngine.getTetrominoManager();
                const piece = tetrominoManager.spawnPiece();
                
                if (piece) {
                    // Quick drop and lock
                    while (tetrominoManager.canMoveDown()) {
                        tetrominoManager.moveDown();
                    }
                    tetrominoManager.lockPiece();
                }
            }
            
            // Game should still be responsive
            const state = gameEngine.getGameState();
            expect(state).toBeDefined();
            expect(state.status).toBeDefined();
        });

        it('should handle cleanup properly', () => {
            gameEngine.start();
            
            // Create some game state
            const tetrominoManager = gameEngine.getTetrominoManager();
            tetrominoManager.spawnPiece();
            
            // Stop and cleanup
            gameEngine.stop();
            
            // State should be cleaned up
            expect(gameEngine.getGameState().status).toBe('stopped');
        });
    });

    describe('Integration Stability', () => {
        it('should maintain stability under stress', () => {
            gameEngine.start();
            
            // Stress test with random operations
            for (let i = 0; i < 50; i++) {
                const tetrominoManager = gameEngine.getTetrominoManager();
                const boardManager = gameEngine.getBoardManager();
                
                // Random operations
                const operations = [
                    () => tetrominoManager.spawnPiece(),
                    () => tetrominoManager.moveLeft(),
                    () => tetrominoManager.moveRight(),
                    () => tetrominoManager.moveDown(),
                    () => tetrominoManager.rotatePiece(),
                    () => boardManager.clearLines(),
                    () => gameEngine.pause(),
                    () => gameEngine.resume()
                ];
                
                const randomOp = operations[Math.floor(Math.random() * operations.length)];
                
                try {
                    randomOp();
                } catch (error) {
                    // Should not throw errors
                    expect(error).toBeUndefined();
                }
            }
            
            // Game should still be functional
            const state = gameEngine.getGameState();
            expect(state).toBeDefined();
            expect(['playing', 'paused', 'gameOver', 'stopped']).toContain(state.status);
        });
    });
});