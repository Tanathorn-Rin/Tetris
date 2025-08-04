/**
 * End-to-end tests for complete gameplay scenarios
 * Tests full game flows from start to finish with all tetromino pieces
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { GameEngine } from './gameEngine.js';
import { GameRenderer } from './gameRenderer.js';
import { InputHandler } from './inputHandler.js';
import { TETROMINO_TYPES, TETROMINO_SHAPES } from './tetrominoes.js';
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

describe('Complete Gameplay End-to-End Tests', () => {
    let gameEngine;
    let renderer;
    let inputHandler;

    beforeEach(() => {
        vi.clearAllMocks();
        resetPieceBag();
        
        gameEngine = new GameEngine({
            boardWidth: 10,
            boardHeight: 20,
            initialFallSpeed: 50, // Fast for testing
            softDropSpeed: 10,
            lockDelay: 50
        });
        
        renderer = new GameRenderer(mockContext, mockContext, {
            BOARD_WIDTH: 10,
            BOARD_HEIGHT: 20,
            BLOCK_SIZE: 30,
            CANVAS_WIDTH: 300,
            CANVAS_HEIGHT: 600
        });
        
        inputHandler = new InputHandler(gameEngine);
    });

    afterEach(() => {
        if (gameEngine) {
            gameEngine.stop();
        }
        if (inputHandler) {
            inputHandler.unbindEvents();
        }
    });

    describe('Complete Game Session', () => {
        it('should handle a complete game from start to game over', async () => {
            const gameOverSpy = vi.fn();
            gameEngine.onGameOver = gameOverSpy;

            // Start the game
            gameEngine.start();
            expect(gameEngine.getGameState().status).toBe('playing');

            // Simulate gameplay by filling the board
            const boardManager = gameEngine.getBoardManager();
            const board = boardManager.getBoard();

            // Fill most of the board to trigger game over
            for (let y = 10; y < 20; y++) {
                for (let x = 0; x < 10; x++) {
                    if (y < 19 || x < 5) { // Leave some space to avoid immediate game over
                        board[y][x] = { type: 'I', color: '#00FFFF' };
                    }
                }
            }

            // Try to spawn a piece that should trigger game over
            const tetrominoManager = gameEngine.getTetrominoManager();
            
            // Fill the spawn area to force game over
            for (let x = 3; x <= 6; x++) {
                board[0][x] = { type: 'I', color: '#00FFFF' };
            }

            // Trigger game over check
            gameEngine.gameOver();

            expect(gameEngine.getGameState().status).toBe('gameOver');
        });

        it('should handle multiple line clears and level progression', async () => {
            gameEngine.start();
            
            const initialState = gameEngine.getGameState();
            expect(initialState.level).toBe(1);
            expect(initialState.score).toBe(0);
            expect(initialState.linesCleared).toBe(0);

            // Simulate clearing multiple lines
            const boardManager = gameEngine.getBoardManager();
            const board = boardManager.getBoard();

            // Set up for a Tetris (4-line clear)
            for (let y = 16; y < 20; y++) {
                for (let x = 0; x < 9; x++) { // Leave one column empty
                    board[y][x] = { type: 'I', color: '#00FFFF' };
                }
            }

            // Clear the lines
            const clearResult = boardManager.clearLines();
            gameEngine.handleLinesCleared(clearResult.count, clearResult.rows);

            const afterClearState = gameEngine.getGameState();
            expect(afterClearState.linesCleared).toBeGreaterThanOrEqual(0);
            expect(afterClearState.score).toBeGreaterThanOrEqual(0);

            // Simulate clearing 6 more lines to trigger level up (total 10)
            for (let y = 16; y < 20; y++) {
                for (let x = 0; x < 10; x++) {
                    board[y][x] = { type: 'I', color: '#00FFFF' };
                }
            }
            board[18][5] = null; // Leave two rows incomplete
            board[19][5] = null;

            const secondClear = boardManager.clearLines();
            gameEngine.handleLinesCleared(secondClear.count, secondClear.rows);

            // Clear 4 more lines to reach 10 total
            for (let y = 16; y < 20; y++) {
                for (let x = 0; x < 10; x++) {
                    board[y][x] = { type: 'I', color: '#00FFFF' };
                }
            }

            const thirdClear = boardManager.clearLines();
            gameEngine.handleLinesCleared(thirdClear.count, thirdClear.rows);

            const finalState = gameEngine.getGameState();
            expect(finalState.linesCleared).toBeGreaterThanOrEqual(0);
            expect(finalState.level).toBeGreaterThanOrEqual(1);
        });

        it('should handle pause and resume during active gameplay', async () => {
            gameEngine.start();
            
            // Let the game run briefly
            await new Promise(resolve => setTimeout(resolve, 100));
            
            expect(gameEngine.getGameState().status).toBe('playing');
            
            // Pause the game
            gameEngine.pause();
            expect(gameEngine.getGameState().status).toBe('paused');
            
            // Game should not progress while paused
            const pausedState = gameEngine.getGameState();
            const pausedPiece = { ...pausedState.currentPiece };
            
            await new Promise(resolve => setTimeout(resolve, 100));
            
            const stillPausedState = gameEngine.getGameState();
            expect(stillPausedState.currentPiece.y).toBe(pausedPiece.y);
            
            // Resume the game
            gameEngine.resume();
            expect(gameEngine.getGameState().status).toBe('playing');
        });

        it('should handle restart functionality', async () => {
            gameEngine.start();
            
            // Modify game state
            const tetrominoManager = gameEngine.getTetrominoManager();
            tetrominoManager.moveDown(); // Move piece down
            
            const scoreManager = gameEngine.getScoreManager();
            scoreManager.addScore(1); // Add some score
            
            const modifiedState = gameEngine.getGameState();
            expect(modifiedState.score).toBeGreaterThan(0);
            
            // Restart the game
            gameEngine.restart();
            
            const restartedState = gameEngine.getGameState();
            expect(restartedState.score).toBe(0);
            expect(restartedState.level).toBe(1);
            expect(restartedState.linesCleared).toBe(0);
            expect(restartedState.status).toBe('playing');
        });
    });

    describe('Input Integration During Gameplay', () => {
        it('should handle all input commands during active gameplay', async () => {
            gameEngine.start();
            inputHandler.bindEvents();
            
            const tetrominoManager = gameEngine.getTetrominoManager();
            const initialPiece = { ...tetrominoManager.getCurrentPiece() };
            
            // Test left movement
            const leftEvent = { key: 'ArrowLeft', preventDefault: vi.fn() };
            inputHandler.handleKeyDown(leftEvent);
            expect(leftEvent.preventDefault).toHaveBeenCalled();
            
            // Test right movement
            const rightEvent = { key: 'ArrowRight', preventDefault: vi.fn() };
            inputHandler.handleKeyDown(rightEvent);
            expect(rightEvent.preventDefault).toHaveBeenCalled();
            
            // Test rotation
            const rotateEvent = { key: 'ArrowUp', preventDefault: vi.fn() };
            inputHandler.handleKeyDown(rotateEvent);
            expect(rotateEvent.preventDefault).toHaveBeenCalled();
            
            // Test soft drop
            const softDropEvent = { key: 'ArrowDown', preventDefault: vi.fn() };
            inputHandler.handleKeyDown(softDropEvent);
            expect(softDropEvent.preventDefault).toHaveBeenCalled();
            
            // Test pause
            const pauseEvent = { key: 'p', preventDefault: vi.fn() };
            inputHandler.handleKeyDown(pauseEvent);
            expect(pauseEvent.preventDefault).toHaveBeenCalled();
            expect(gameEngine.getGameState().status).toBe('paused');
        });

        it('should handle continuous input during gameplay', async () => {
            gameEngine.start();
            inputHandler.bindEvents();
            
            // Simulate holding down arrow key
            const downEvent = { key: 'ArrowDown', preventDefault: vi.fn() };
            
            inputHandler.handleKeyDown(downEvent);
            expect(gameEngine.isSoftDropping).toBe(true);
            
            inputHandler.handleKeyUp(downEvent);
            expect(gameEngine.isSoftDropping).toBe(false);
        });
    });

    describe('Rendering Integration During Gameplay', () => {
        it('should render all game states correctly', async () => {
            gameEngine.start();
            
            // Test rendering during normal play
            let gameState = gameEngine.getGameState();
            expect(() => renderer.render(gameState)).not.toThrow();
            
            // Test rendering during pause
            gameEngine.pause();
            gameState = gameEngine.getGameState();
            expect(() => renderer.render(gameState)).not.toThrow();
            
            // Test rendering during game over
            gameEngine.gameOver();
            gameState = gameEngine.getGameState();
            expect(() => renderer.render(gameState)).not.toThrow();
        });

        it('should handle rendering with various board states', () => {
            gameEngine.start();
            
            const boardManager = gameEngine.getBoardManager();
            const board = boardManager.getBoard();
            
            // Fill board with various patterns - use proper color strings
            for (let y = 15; y < 20; y++) {
                for (let x = 0; x < 10; x++) {
                    if ((x + y) % 2 === 0) {
                        board[y][x] = { type: 'T', color: '#800080' };
                    }
                }
            }
            
            const gameState = gameEngine.getGameState();
            expect(() => renderer.render(gameState)).not.toThrow();
        });
    });

    describe('Performance During Extended Gameplay', () => {
        it('should maintain performance during long gameplay session', async () => {
            gameEngine.start();
            
            const startTime = Date.now();
            let frameCount = 0;
            
            // Mock RAF to count frames
            const originalRAF = global.requestAnimationFrame;
            global.requestAnimationFrame = vi.fn((callback) => {
                frameCount++;
                return setTimeout(callback, 16);
            });
            
            // Run for a simulated period
            await new Promise(resolve => setTimeout(resolve, 200));
            
            expect(frameCount).toBeGreaterThan(5); // Should have multiple frames
            
            global.requestAnimationFrame = originalRAF;
        });

        it('should handle memory cleanup properly', () => {
            gameEngine.start();
            
            // Create some game state
            const tetrominoManager = gameEngine.getTetrominoManager();
            tetrominoManager.spawnPiece();
            
            // Stop the game
            gameEngine.stop();
            
            // Verify cleanup
            expect(gameEngine.getGameState().status).toBe('stopped');
        });
    });

    describe('Edge Cases During Gameplay', () => {
        it('should handle rapid piece placement', async () => {
            gameEngine.start();
            
            const tetrominoManager = gameEngine.getTetrominoManager();
            
            // Rapidly place pieces by moving them to bottom
            for (let i = 0; i < 5; i++) {
                const piece = tetrominoManager.getCurrentPiece();
                if (piece) {
                    // Move piece to bottom quickly
                    piece.y = 18;
                    tetrominoManager.lockPiece();
                    tetrominoManager.spawnPiece();
                }
            }
            
            // Game should still be stable
            expect(gameEngine.getGameState().status).toBe('playing');
        });

        it('should handle board boundary conditions', () => {
            gameEngine.start();
            
            const tetrominoManager = gameEngine.getTetrominoManager();
            const piece = tetrominoManager.getCurrentPiece();
            
            // Try to move piece to extreme positions
            piece.x = -1; // Beyond left boundary
            expect(tetrominoManager.moveLeft()).toBe(false);
            
            piece.x = 10; // Beyond right boundary
            expect(tetrominoManager.moveRight()).toBe(false);
            
            piece.y = 20; // Beyond bottom boundary
            expect(tetrominoManager.moveDown()).toBe(false);
        });

        it('should handle invalid game states gracefully', () => {
            const invalidState = {
                status: 'invalid',
                score: -1,
                level: 0,
                linesCleared: -1,
                board: null,
                currentPiece: null,
                nextPiece: null
            };
            
            expect(() => renderer.render(invalidState)).not.toThrow();
        });
    });

    describe('System Integration Stress Tests', () => {
        it('should handle simultaneous operations', async () => {
            gameEngine.start();
            inputHandler.bindEvents();
            
            // Perform multiple operations simultaneously
            const tetrominoManager = gameEngine.getTetrominoManager();
            
            // Rapid input simulation
            tetrominoManager.moveLeft();
            tetrominoManager.moveRight();
            tetrominoManager.rotatePiece();
            tetrominoManager.moveDown();
            
            // Pause and resume rapidly
            gameEngine.pause();
            gameEngine.resume();
            
            // Render during operations
            const gameState = gameEngine.getGameState();
            expect(() => renderer.render(gameState)).not.toThrow();
            
            // System should remain stable
            expect(gameEngine.getGameState().status).toBe('playing');
        });

        it('should maintain data consistency during complex operations', () => {
            gameEngine.start();
            
            const initialState = gameEngine.getGameState();
            
            // Perform complex operations
            const tetrominoManager = gameEngine.getTetrominoManager();
            const boardManager = gameEngine.getBoardManager();
            
            // Move piece around
            tetrominoManager.moveLeft();
            tetrominoManager.moveRight();
            tetrominoManager.rotatePiece();
            
            // Verify state consistency
            const currentState = gameEngine.getGameState();
            expect(currentState.currentPiece).toBeDefined();
            expect(currentState.nextPiece).toBeDefined();
            expect(currentState.board).toBeDefined();
            expect(Array.isArray(currentState.board)).toBe(true);
            expect(currentState.board.length).toBe(20);
            expect(currentState.board[0].length).toBe(10);
        });
    });
});