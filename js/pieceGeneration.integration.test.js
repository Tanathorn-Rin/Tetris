/**
 * Integration tests for piece generation and preview system
 * Tests the complete flow from random generation to preview display
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { GameEngine } from './gameEngine.js';
import { GameRenderer } from './gameRenderer.js';
import { resetPieceBag } from './tetrominoUtils.js';
import { TETROMINO_TYPES } from './tetrominoes.js';

// Mock canvas contexts for testing
const createMockContext = () => ({
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 1,
    globalAlpha: 1,
    imageSmoothingEnabled: false,
    textAlign: 'center',
    textBaseline: 'middle',
    fillRect: () => {},
    strokeRect: () => {},
    beginPath: () => {},
    moveTo: () => {},
    lineTo: () => {},
    stroke: () => {},
    save: () => {},
    restore: () => {},
    createLinearGradient: () => ({
        addColorStop: () => {}
    }),
    setLineDash: () => {}
});

// Mock DOM elements
const mockElement = {
    textContent: '',
    classList: {
        add: () => {},
        remove: () => {}
    },
    style: {
        transform: '',
        color: '',
        textShadow: ''
    }
};

// Mock browser APIs
global.requestAnimationFrame = (callback) => {
    return setTimeout(callback, 16); // ~60fps
};

global.cancelAnimationFrame = (id) => {
    clearTimeout(id);
};

// Mock document.getElementById
global.document = {
    getElementById: () => mockElement
};

describe('Piece Generation and Preview Integration', () => {
    let gameEngine;
    let gameRenderer;
    let mockGameContext;
    let mockNextPieceContext;

    const gameConfig = {
        BOARD_WIDTH: 10,
        BOARD_HEIGHT: 20,
        BLOCK_SIZE: 30,
        CANVAS_WIDTH: 300,
        CANVAS_HEIGHT: 600,
        NEXT_CANVAS_SIZE: 120
    };

    beforeEach(() => {
        resetPieceBag();
        
        // Create mock canvas contexts
        mockGameContext = createMockContext();
        mockNextPieceContext = createMockContext();
        
        // Initialize game components
        gameEngine = new GameEngine({
            boardWidth: 10,
            boardHeight: 20,
            initialFallSpeed: 1000
        });
        
        gameRenderer = new GameRenderer(mockGameContext, mockNextPieceContext, gameConfig);
    });

    describe('Game Engine Piece Generation', () => {
        it('should generate current and next pieces when initialized', () => {
            // Test piece generation without starting the full game loop
            const tetrominoManager = gameEngine.getTetrominoManager();
            
            // Manually spawn first piece
            const firstPiece = tetrominoManager.spawnPiece();
            
            expect(firstPiece).not.toBeNull();
            expect(tetrominoManager.getCurrentPiece()).not.toBeNull();
            expect(tetrominoManager.getNextPiece()).not.toBeNull();
            expect(Object.values(TETROMINO_TYPES)).toContain(firstPiece.type);
            expect(Object.values(TETROMINO_TYPES)).toContain(tetrominoManager.getNextPiece().type);
        });

        it('should spawn pieces at correct position', () => {
            const tetrominoManager = gameEngine.getTetrominoManager();
            const piece = tetrominoManager.spawnPiece();
            
            expect(piece.x).toBe(3); // Center of 10-wide board
            expect(piece.y).toBe(0); // Top of board
            expect(piece.rotation).toBe(0); // Initial rotation
        });

        it('should maintain next piece preview throughout spawning', () => {
            const tetrominoManager = gameEngine.getTetrominoManager();
            
            // First spawn
            const firstPiece = tetrominoManager.spawnPiece();
            const firstNext = tetrominoManager.getNextPiece();
            
            // Verify first spawn worked
            expect(firstPiece).not.toBeNull();
            expect(firstNext).not.toBeNull();
            
            // Move the piece down to avoid spawn collision when locking
            const currentPiece = tetrominoManager.getCurrentPiece();
            currentPiece.y = 18; // Move near bottom to avoid collision with spawn area
            
            // Lock current piece and spawn next
            tetrominoManager.lockPiece();
            const secondPiece = tetrominoManager.spawnPiece();
            
            // Verify second spawn worked
            expect(secondPiece).not.toBeNull();
            
            const secondCurrent = tetrominoManager.getCurrentPiece();
            const secondNext = tetrominoManager.getNextPiece();
            
            // Previous next piece should now be current
            expect(secondCurrent).not.toBeNull();
            expect(secondCurrent.type).toBe(firstNext.type);
            
            // Should have a new next piece
            expect(secondNext).not.toBeNull();
            expect(secondNext.type).toBeDefined();
        });

        it('should use 7-bag system for proper distribution', () => {
            // Test the 7-bag system by directly using the utility function
            // This is already tested in tetrominoUtils.test.js, but we verify integration here
            const tetrominoManager = gameEngine.getTetrominoManager();
            
            // Spawn first piece to initialize the system
            const firstPiece = tetrominoManager.spawnPiece();
            expect(firstPiece).not.toBeNull();
            expect(Object.values(TETROMINO_TYPES)).toContain(firstPiece.type);
            
            // Verify next piece is also valid
            const nextPiece = tetrominoManager.getNextPiece();
            expect(nextPiece).not.toBeNull();
            expect(Object.values(TETROMINO_TYPES)).toContain(nextPiece.type);
            
            // The 7-bag system is tested more thoroughly in tetrominoUtils.test.js
            // Here we just verify that the integration works and produces valid pieces
        });
    });

    describe('Renderer Integration', () => {
        it('should render game state with current and next pieces', () => {
            const tetrominoManager = gameEngine.getTetrominoManager();
            tetrominoManager.spawnPiece();
            
            const gameState = gameEngine.getGameState();
            
            // Should not throw when rendering complete game state
            expect(() => {
                gameRenderer.render(gameState);
            }).not.toThrow();
            
            // Verify game state has required properties for rendering
            expect(gameState.currentPiece).toBeDefined();
            expect(gameState.nextPiece).toBeDefined();
            expect(gameState.board).toBeDefined();
            expect(gameState.score).toBeDefined();
            expect(gameState.level).toBeDefined();
            expect(gameState.linesCleared).toBeDefined();
        });

        it('should handle next piece preview rendering', () => {
            const tetrominoManager = gameEngine.getTetrominoManager();
            tetrominoManager.spawnPiece();
            
            const nextPiece = tetrominoManager.getNextPiece();
            
            // Should not throw when drawing next piece
            expect(() => {
                gameRenderer.drawNextPiece(nextPiece);
            }).not.toThrow();
        });

        it('should handle null next piece gracefully', () => {
            // Should not throw when next piece is null
            expect(() => {
                gameRenderer.drawNextPiece(null);
            }).not.toThrow();
        });
    });

    describe('Complete Game Flow', () => {
        it('should maintain piece generation state correctly', () => {
            const tetrominoManager = gameEngine.getTetrominoManager();
            
            // Initially no pieces
            expect(tetrominoManager.getCurrentPiece()).toBeNull();
            expect(tetrominoManager.getNextPiece()).toBeNull();
            
            // After spawning, should have both current and next
            tetrominoManager.spawnPiece();
            expect(tetrominoManager.getCurrentPiece()).not.toBeNull();
            expect(tetrominoManager.getNextPiece()).not.toBeNull();
            
            // After reset, should clear both
            tetrominoManager.reset();
            expect(tetrominoManager.getCurrentPiece()).toBeNull();
            expect(tetrominoManager.getNextPiece()).toBeNull();
        });

        it('should reset piece generation correctly', () => {
            const tetrominoManager = gameEngine.getTetrominoManager();
            
            // Generate some pieces
            tetrominoManager.spawnPiece();
            const initialCurrent = tetrominoManager.getCurrentPiece();
            const initialNext = tetrominoManager.getNextPiece();
            
            expect(initialCurrent).not.toBeNull();
            expect(initialNext).not.toBeNull();
            
            // Reset and spawn again
            tetrominoManager.reset();
            tetrominoManager.spawnPiece();
            
            const newCurrent = tetrominoManager.getCurrentPiece();
            const newNext = tetrominoManager.getNextPiece();
            
            // Should have new pieces
            expect(newCurrent).not.toBeNull();
            expect(newNext).not.toBeNull();
            expect(Object.values(TETROMINO_TYPES)).toContain(newCurrent.type);
            expect(Object.values(TETROMINO_TYPES)).toContain(newNext.type);
        });

        it('should handle blocked spawn correctly', () => {
            const tetrominoManager = gameEngine.getTetrominoManager();
            const boardManager = gameEngine.getBoardManager();
            const board = boardManager.getBoard();
            
            // Fill top rows to block spawning
            for (let y = 0; y < 4; y++) {
                for (let x = 0; x < 10; x++) {
                    board[y][x] = { type: 'I', color: '#00FFFF' };
                }
            }
            
            // Try to spawn a piece (should fail)
            const piece = tetrominoManager.spawnPiece();
            expect(piece).toBeNull();
        });
    });

    describe('TetrominoManager Integration', () => {
        it('should provide access to tetromino manager', () => {
            const tetrominoManager = gameEngine.getTetrominoManager();
            
            expect(tetrominoManager).toBeDefined();
            expect(typeof tetrominoManager.spawnPiece).toBe('function');
            expect(typeof tetrominoManager.getCurrentPiece).toBe('function');
            expect(typeof tetrominoManager.getNextPiece).toBe('function');
        });

        it('should coordinate piece spawning correctly', () => {
            const tetrominoManager = gameEngine.getTetrominoManager();
            
            // Initially no active piece
            expect(tetrominoManager.hasActivePiece()).toBe(false);
            
            // After spawning, should have active piece
            tetrominoManager.spawnPiece();
            expect(tetrominoManager.hasActivePiece()).toBe(true);
            expect(tetrominoManager.getCurrentPiece()).not.toBeNull();
            expect(tetrominoManager.getNextPiece()).not.toBeNull();
        });
    });
});