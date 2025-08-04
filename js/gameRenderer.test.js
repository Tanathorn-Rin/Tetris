/**
 * Unit tests for GameRenderer class
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GameRenderer } from './gameRenderer.js';
import { TETROMINO_TYPES, TETROMINO_COLORS } from './tetrominoes.js';

// Mock DOM elements factory
const createMockElement = () => ({
    textContent: '',
    classList: {
        add: vi.fn(),
        remove: vi.fn()
    },
    style: {
        transform: '',
        color: '',
        textShadow: ''
    }
});

// Mock canvas context
const mockContext = {
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 0,
    globalAlpha: 1,
    imageSmoothingEnabled: true,
    textAlign: 'start',
    textBaseline: 'alphabetic',
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

// Mock configuration
const mockConfig = {
    BOARD_WIDTH: 10,
    BOARD_HEIGHT: 20,
    BLOCK_SIZE: 30,
    CANVAS_WIDTH: 300,
    CANVAS_HEIGHT: 600,
    NEXT_CANVAS_SIZE: 120
};

// Mock document.getElementById
global.document = {
    getElementById: vi.fn((id) => createMockElement())
};

describe('GameRenderer', () => {
    let renderer;
    let gameContext;
    let nextPieceContext;

    beforeEach(() => {
        // Reset mocks
        vi.clearAllMocks();
        
        // Create fresh mock contexts
        gameContext = { ...mockContext };
        nextPieceContext = { ...mockContext };
        
        // Create renderer instance
        renderer = new GameRenderer(gameContext, nextPieceContext, mockConfig);
    });

    describe('constructor', () => {
        it('should initialize with provided contexts and config', () => {
            expect(renderer.gameContext).toBe(gameContext);
            expect(renderer.nextPieceContext).toBe(nextPieceContext);
            expect(renderer.config).toBe(mockConfig);
        });

        it('should set up canvas properties', () => {
            expect(gameContext.imageSmoothingEnabled).toBe(false);
            expect(gameContext.textAlign).toBe('center');
            expect(gameContext.textBaseline).toBe('middle');
            expect(nextPieceContext.imageSmoothingEnabled).toBe(false);
        });

        it('should get DOM element references', () => {
            expect(document.getElementById).toHaveBeenCalledWith('score');
            expect(document.getElementById).toHaveBeenCalledWith('level');
            expect(document.getElementById).toHaveBeenCalledWith('lines');
            expect(document.getElementById).toHaveBeenCalledWith('pauseOverlay');
            expect(document.getElementById).toHaveBeenCalledWith('gameOverOverlay');
        });
    });

    describe('clearGameCanvas', () => {
        it('should clear the game canvas with background color', () => {
            renderer.clearGameCanvas();
            
            expect(gameContext.fillStyle).toBe('#000000');
            expect(gameContext.fillRect).toHaveBeenCalledWith(0, 0, 300, 600);
        });
    });

    describe('clearNextPieceCanvas', () => {
        it('should clear the next piece canvas with background color', () => {
            renderer.clearNextPieceCanvas();
            
            expect(nextPieceContext.fillStyle).toBe('#000000');
            expect(nextPieceContext.fillRect).toHaveBeenCalledWith(0, 0, 120, 120);
        });
    });

    describe('drawBoard', () => {
        it('should clear canvas and draw grid lines', () => {
            renderer.drawBoard();
            
            // Should clear canvas first
            expect(gameContext.fillRect).toHaveBeenCalledWith(0, 0, 300, 600);
            
            // Should draw grid lines and borders (multiple stroke styles are used for enhanced visuals)
            expect(gameContext.beginPath).toHaveBeenCalled();
            expect(gameContext.moveTo).toHaveBeenCalled();
            expect(gameContext.lineTo).toHaveBeenCalled();
            expect(gameContext.stroke).toHaveBeenCalled();
            expect(gameContext.strokeRect).toHaveBeenCalled();
        });
    });

    describe('drawBlock', () => {
        it('should draw a block at the specified position', () => {
            const color = '#FF0000';
            renderer.drawBlock(2, 3, color);
            
            // Should save and restore context
            expect(gameContext.save).toHaveBeenCalled();
            expect(gameContext.restore).toHaveBeenCalled();
            
            // Should create gradient for enhanced visuals
            expect(gameContext.createLinearGradient).toHaveBeenCalled();
            expect(gameContext.fillRect).toHaveBeenCalledWith(60, 90, 30, 30);
            
            // Should draw border
            expect(gameContext.strokeRect).toHaveBeenCalled();
        });

        it('should apply alpha transparency when specified', () => {
            renderer.drawBlock(0, 0, '#FF0000', null, 0.5);
            
            expect(gameContext.globalAlpha).toBe(0.5);
        });
    });

    describe('drawPiece', () => {
        it('should draw a tetromino piece', () => {
            const piece = {
                type: TETROMINO_TYPES.T,
                rotation: 0,
                x: 4,
                y: 2
            };
            
            renderer.drawBlock = vi.fn();
            renderer.drawPiece(piece);
            
            // Should call drawBlock for each filled block in the piece
            expect(renderer.drawBlock).toHaveBeenCalled();
        });

        it('should handle null or invalid pieces gracefully', () => {
            renderer.drawBlock = vi.fn();
            
            renderer.drawPiece(null);
            renderer.drawPiece({});
            renderer.drawPiece({ type: null });
            
            expect(renderer.drawBlock).not.toHaveBeenCalled();
        });
    });

    describe('drawNextPiece', () => {
        it('should draw the next piece in the preview canvas', () => {
            const nextPiece = {
                type: TETROMINO_TYPES.I,
                rotation: 0,
                x: 0,
                y: 0
            };
            
            renderer.drawNextPiece(nextPiece);
            
            // Should clear the canvas first
            expect(nextPieceContext.fillRect).toHaveBeenCalledWith(0, 0, 120, 120);
            
            // Should create gradient for enhanced visuals (fillStyle will be a gradient object)
            expect(nextPieceContext.createLinearGradient).toHaveBeenCalled();
        });

        it('should handle null next piece gracefully', () => {
            renderer.drawNextPiece(null);
            
            // Should only clear the canvas
            expect(nextPieceContext.fillRect).toHaveBeenCalledWith(0, 0, 120, 120);
        });
    });

    describe('drawUI', () => {
        it('should update UI elements with game state', () => {
            const gameState = {
                score: 12500,
                level: 3,
                linesCleared: 25
            };
            
            renderer.drawUI(gameState);
            
            expect(renderer.scoreElement.textContent).toBe('12,500');
            expect(renderer.levelElement.textContent).toBe('3');
            expect(renderer.linesElement.textContent).toBe('25 / 30'); // Updated for progress format
        });
    });

    describe('overlay management', () => {
        it('should show and hide pause overlay', () => {
            renderer.showPauseOverlay();
            expect(renderer.pauseOverlay.classList.remove).toHaveBeenCalledWith('hidden');
            
            renderer.hidePauseOverlay();
            expect(renderer.pauseOverlay.classList.add).toHaveBeenCalledWith('hidden');
        });

        it('should show and hide game over overlay', () => {
            renderer.showGameOverOverlay();
            expect(renderer.gameOverOverlay.classList.remove).toHaveBeenCalledWith('hidden');
            
            renderer.hideGameOverOverlay();
            expect(renderer.gameOverOverlay.classList.add).toHaveBeenCalledWith('hidden');
        });
    });

    describe('render', () => {
        it('should render complete game state', () => {
            const gameState = {
                status: 'playing',
                score: 1000,
                level: 1,
                linesCleared: 10,
                board: [],
                currentPiece: {
                    type: TETROMINO_TYPES.T,
                    rotation: 0,
                    x: 4,
                    y: 2
                },
                nextPiece: {
                    type: TETROMINO_TYPES.I,
                    rotation: 0,
                    x: 0,
                    y: 0
                }
            };
            
            // Mock the methods that will be called
            renderer.drawBoardWithPieces = vi.fn();
            renderer.drawGhostPiece = vi.fn();
            renderer.drawPiece = vi.fn();
            renderer.drawNextPiece = vi.fn();
            renderer.drawUI = vi.fn();
            renderer.hidePauseOverlay = vi.fn();
            renderer.hideGameOverOverlay = vi.fn();
            
            renderer.render(gameState);
            
            expect(renderer.drawBoardWithPieces).toHaveBeenCalledWith([]);
            expect(renderer.drawGhostPiece).toHaveBeenCalledWith(gameState.currentPiece, []);
            expect(renderer.drawPiece).toHaveBeenCalledWith(gameState.currentPiece);
            expect(renderer.drawNextPiece).toHaveBeenCalledWith(gameState.nextPiece);
            expect(renderer.drawUI).toHaveBeenCalledWith(gameState);
            expect(renderer.hidePauseOverlay).toHaveBeenCalled();
            expect(renderer.hideGameOverOverlay).toHaveBeenCalled();
        });

        it('should show pause overlay when game is paused', () => {
            const gameState = { status: 'paused', score: 0, level: 1, linesCleared: 0 };
            
            renderer.drawBoardWithPieces = vi.fn();
            renderer.drawUI = vi.fn();
            renderer.showPauseOverlay = vi.fn();
            renderer.hideGameOverOverlay = vi.fn();
            
            renderer.render(gameState);
            
            expect(renderer.showPauseOverlay).toHaveBeenCalled();
        });

        it('should show game over overlay when game is over', () => {
            const gameState = { status: 'gameOver', score: 0, level: 1, linesCleared: 0 };
            
            renderer.drawBoardWithPieces = vi.fn();
            renderer.drawUI = vi.fn();
            renderer.hidePauseOverlay = vi.fn();
            renderer.showGameOverOverlay = vi.fn();
            
            renderer.render(gameState);
            
            expect(renderer.showGameOverOverlay).toHaveBeenCalled();
        });
    });

    describe('lightenColor', () => {
        it('should lighten a hex color', () => {
            const result = renderer.lightenColor('#FF0000', 0.5);
            expect(result).toMatch(/^#[0-9A-F]{6}$/i);
            expect(result).not.toBe('#FF0000'); // Should be different from original
        });

        it('should handle edge cases', () => {
            // Should not exceed #FFFFFF
            const result = renderer.lightenColor('#FFFFFF', 0.5);
            expect(result).toBe('#ffffff');
        });
    });
});