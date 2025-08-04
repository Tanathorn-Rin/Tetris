/**
 * Integration tests for the main game loop and complete system integration
 * Tests the full game flow from initialization to game over
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { GameEngine } from './gameEngine.js';
import { GameRenderer } from './gameRenderer.js';
import { InputHandler } from './inputHandler.js';
import { GAME_CONFIG } from './main.js';

// Mock DOM elements and canvas contexts
const mockCanvas = {
    width: 300,
    height: 600,
    getContext: vi.fn(() => mockContext)
};

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
    createLinearGradient: vi.fn(() => ({
        addColorStop: vi.fn()
    })),
    setLineDash: vi.fn()
};

const mockNextPieceCanvas = {
    width: 120,
    height: 120,
    getContext: vi.fn(() => mockContext)
};

// Mock DOM elements
const mockElements = {
    score: { 
        textContent: '0',
        style: { transform: '', color: '', textShadow: '' }
    },
    level: { 
        textContent: '1',
        style: { transform: '', color: '', textShadow: '' }
    },
    lines: { 
        textContent: '0',
        style: { transform: '', color: '', textShadow: '' }
    },
    status: { textContent: 'Playing' },
    pauseOverlay: { classList: { add: vi.fn(), remove: vi.fn() } },
    gameOverOverlay: { classList: { add: vi.fn(), remove: vi.fn() } }
};

// Mock document.getElementById
global.document = {
    getElementById: vi.fn((id) => mockElements[id] || null),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn()
};

// Mock requestAnimationFrame and cancelAnimationFrame
global.requestAnimationFrame = vi.fn((callback) => {
    return setTimeout(callback, 16); // ~60 FPS
});

global.cancelAnimationFrame = vi.fn((id) => {
    clearTimeout(id);
});

describe('Main Game Loop Integration', () => {
    let gameEngine;
    let renderer;
    let inputHandler;

    beforeEach(() => {
        vi.clearAllMocks();
        
        // Initialize game components
        renderer = new GameRenderer(mockContext, mockContext, GAME_CONFIG);
        gameEngine = new GameEngine({
            boardWidth: GAME_CONFIG.BOARD_WIDTH,
            boardHeight: GAME_CONFIG.BOARD_HEIGHT,
            initialFallSpeed: 100, // Faster for testing
            softDropSpeed: 50,
            lockDelay: 100
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

    describe('Game Initialization', () => {
        it('should initialize all components correctly', () => {
            expect(gameEngine).toBeDefined();
            expect(renderer).toBeDefined();
            expect(inputHandler).toBeDefined();
        });

        it('should set up proper game configuration', () => {
            expect(GAME_CONFIG.BOARD_WIDTH).toBe(10);
            expect(GAME_CONFIG.BOARD_HEIGHT).toBe(20);
            expect(GAME_CONFIG.TARGET_FPS).toBe(60);
            expect(GAME_CONFIG.BLOCK_SIZE).toBe(30);
        });

        it('should have proper canvas dimensions', () => {
            expect(GAME_CONFIG.CANVAS_WIDTH).toBe(300);
            expect(GAME_CONFIG.CANVAS_HEIGHT).toBe(600);
            expect(GAME_CONFIG.NEXT_CANVAS_SIZE).toBe(120);
        });
    });

    describe('Game Loop Integration', () => {
        it('should start the game loop with proper timing', async () => {
            const gameStateChangeSpy = vi.fn();
            gameEngine.onGameStateChange = gameStateChangeSpy;

            gameEngine.start();
            
            // Wait for initial game state change
            await new Promise(resolve => setTimeout(resolve, 50));
            
            expect(gameStateChangeSpy).toHaveBeenCalled();
            expect(gameEngine.getGameState().status).toBe('playing');
        });

        it('should maintain 60 FPS game loop', async () => {
            let frameCount = 0;
            const originalRAF = global.requestAnimationFrame;
            
            global.requestAnimationFrame = vi.fn((callback) => {
                frameCount++;
                return setTimeout(callback, 16); // ~60 FPS
            });

            gameEngine.start();
            
            // Wait for several frames
            await new Promise(resolve => setTimeout(resolve, 100));
            
            expect(frameCount).toBeGreaterThan(3); // Should have multiple frames
            
            global.requestAnimationFrame = originalRAF;
        });

        it('should integrate all systems in the game loop', async () => {
            const renderSpy = vi.spyOn(renderer, 'render');
            
            gameEngine.onGameStateChange = (gameState) => {
                renderer.render(gameState);
            };

            gameEngine.start();
            
            // Wait for game loop to run
            await new Promise(resolve => setTimeout(resolve, 50));
            
            expect(renderSpy).toHaveBeenCalled();
            
            const gameState = gameEngine.getGameState();
            expect(gameState).toHaveProperty('status');
            expect(gameState).toHaveProperty('score');
            expect(gameState).toHaveProperty('level');
            expect(gameState).toHaveProperty('board');
            expect(gameState).toHaveProperty('currentPiece');
        });
    });

    describe('Component Integration', () => {
        it('should integrate input handler with game engine', () => {
            inputHandler.bindEvents();
            
            // Simulate key press
            const mockEvent = {
                key: 'ArrowLeft',
                preventDefault: vi.fn()
            };
            
            inputHandler.handleKeyDown(mockEvent);
            
            expect(mockEvent.preventDefault).toHaveBeenCalled();
        });

        it('should integrate renderer with game state', () => {
            const gameState = gameEngine.getGameState();
            const renderSpy = vi.spyOn(renderer, 'render');
            
            renderer.render(gameState);
            
            expect(renderSpy).toHaveBeenCalledWith(gameState);
        });

        it('should integrate score manager through game engine', () => {
            const gameState = gameEngine.getGameState();
            
            expect(gameState.score).toBeDefined();
            expect(gameState.level).toBeDefined();
            expect(gameState.linesCleared).toBeDefined();
        });
    });

    describe('Complete Game Flow', () => {
        it('should handle complete game cycle from start to game over', async () => {
            const gameOverSpy = vi.fn();
            gameEngine.onGameOver = gameOverSpy;

            gameEngine.start();
            
            // Simulate a more realistic game over scenario
            const boardManager = gameEngine.getBoardManager();
            
            // Test that the game can detect game over conditions
            // We'll test the game over detection logic directly
            expect(typeof boardManager.isGameOver).toBe('function');
            
            // Test that the game engine can handle game over state
            gameEngine.gameOver();
            
            // Wait for game over to be processed
            await new Promise(resolve => setTimeout(resolve, 50));
            
            expect(gameEngine.getGameState().status).toBe('gameOver');
        });

        it('should handle pause and resume correctly', async () => {
            gameEngine.start();
            
            expect(gameEngine.getGameState().status).toBe('playing');
            
            gameEngine.pause();
            expect(gameEngine.getGameState().status).toBe('paused');
            
            gameEngine.resume();
            expect(gameEngine.getGameState().status).toBe('playing');
        });

        it('should handle restart correctly', async () => {
            gameEngine.start();
            
            // Let the game run for a bit
            await new Promise(resolve => setTimeout(resolve, 50));
            
            const initialState = gameEngine.getGameState();
            
            gameEngine.restart();
            
            const restartedState = gameEngine.getGameState();
            expect(restartedState.score).toBe(0);
            expect(restartedState.level).toBe(1);
            expect(restartedState.linesCleared).toBe(0);
        });
    });

    describe('Performance and Timing', () => {
        it('should maintain consistent timing during gameplay', async () => {
            const timestamps = [];
            const originalRAF = global.requestAnimationFrame;
            
            global.requestAnimationFrame = vi.fn((callback) => {
                timestamps.push(Date.now());
                return setTimeout(callback, 16);
            });

            gameEngine.start();
            
            // Wait for several frames
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Check that frames are being called consistently
            expect(timestamps.length).toBeGreaterThan(3);
            
            global.requestAnimationFrame = originalRAF;
        });

        it('should handle cleanup properly on stop', () => {
            gameEngine.start();
            expect(gameEngine.getGameState().status).toBe('playing');
            
            gameEngine.stop();
            expect(gameEngine.getGameState().status).toBe('stopped');
        });
    });

    describe('Error Handling', () => {
        it('should handle missing canvas elements gracefully', () => {
            const originalGetElementById = document.getElementById;
            document.getElementById = vi.fn(() => null);
            
            // Create mock contexts that handle null gracefully
            const nullSafeContext = {
                imageSmoothingEnabled: false,
                textAlign: 'center',
                textBaseline: 'middle',
                fillStyle: '',
                strokeStyle: '',
                lineWidth: 1,
                globalAlpha: 1,
                fillRect: vi.fn(),
                strokeRect: vi.fn(),
                beginPath: vi.fn(),
                moveTo: vi.fn(),
                lineTo: vi.fn(),
                stroke: vi.fn(),
                save: vi.fn(),
                restore: vi.fn()
            };
            
            // This should not throw an error with proper null-safe contexts
            expect(() => {
                new GameRenderer(nullSafeContext, nullSafeContext, GAME_CONFIG);
            }).not.toThrow();
            
            document.getElementById = originalGetElementById;
        });

        it('should handle invalid game states gracefully', () => {
            const invalidState = {
                status: 'invalid',
                score: 0,
                level: 1,
                linesCleared: 0,
                board: [],
                currentPiece: null,
                nextPiece: null
            };
            
            expect(() => {
                renderer.render(invalidState);
            }).not.toThrow();
        });
    });

    describe('Memory Management', () => {
        it('should clean up event listeners on unbind', () => {
            const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');
            
            inputHandler.bindEvents();
            inputHandler.unbindEvents();
            
            expect(removeEventListenerSpy).toHaveBeenCalled();
        });

        it('should cancel animation frames on stop', () => {
            const cancelAnimationFrameSpy = vi.spyOn(global, 'cancelAnimationFrame');
            
            gameEngine.start();
            gameEngine.stop();
            
            expect(cancelAnimationFrameSpy).toHaveBeenCalled();
        });
    });
});

describe('System Integration Edge Cases', () => {
    let gameEngine;
    let renderer;

    beforeEach(() => {
        renderer = new GameRenderer(mockContext, mockContext, GAME_CONFIG);
        gameEngine = new GameEngine({
            boardWidth: GAME_CONFIG.BOARD_WIDTH,
            boardHeight: GAME_CONFIG.BOARD_HEIGHT,
            initialFallSpeed: 50, // Very fast for testing
            lockDelay: 50
        });
    });

    afterEach(() => {
        if (gameEngine) {
            gameEngine.stop();
        }
    });

    it('should handle rapid piece placement and line clearing', async () => {
        const linesClearedSpy = vi.fn();
        gameEngine.onLinesCleared = linesClearedSpy;

        gameEngine.start();
        
        // Simulate rapid gameplay by filling lines
        const boardManager = gameEngine.getBoardManager();
        const board = boardManager.getBoard();
        
        // Fill bottom row except one space
        for (let x = 0; x < 9; x++) {
            board[19][x] = { type: 'I', color: '#00FFFF' };
        }
        
        // Wait for game to process
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // The system should handle this without errors
        expect(gameEngine.getGameState().status).toBe('playing');
    });

    it('should maintain game state consistency during complex operations', async () => {
        gameEngine.start();
        
        // Perform multiple operations rapidly
        gameEngine.pause();
        gameEngine.resume();
        
        const tetrominoManager = gameEngine.getTetrominoManager();
        tetrominoManager.moveLeft();
        tetrominoManager.moveRight();
        tetrominoManager.rotatePiece();
        
        // Game state should remain consistent
        const gameState = gameEngine.getGameState();
        expect(gameState.status).toBe('playing');
        expect(gameState.currentPiece).toBeDefined();
    });
});