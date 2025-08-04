/**
 * Unit tests for TetrominoManager class
 * Tests movement validation, rotation mechanics, and piece state management
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { TetrominoManager } from './tetrominoManager.js';
import { BoardManager } from './boardManager.js';
import { createTetromino, resetPieceBag } from './tetrominoUtils.js';
import { TETROMINO_TYPES } from './tetrominoes.js';

describe('TetrominoManager', () => {
    let boardManager;
    let tetrominoManager;

    beforeEach(() => {
        boardManager = new BoardManager(10, 20);
        tetrominoManager = new TetrominoManager(boardManager);
        resetPieceBag(); // Reset piece bag for consistent test results
    });

    describe('Constructor and Initialization', () => {
        it('should initialize with correct spawn position', () => {
            expect(tetrominoManager.spawnX).toBe(3); // (10/2) - 2 = 3
            expect(tetrominoManager.spawnY).toBe(0);
        });

        it('should initialize with no current or next piece', () => {
            expect(tetrominoManager.getCurrentPiece()).toBeNull();
            expect(tetrominoManager.getNextPiece()).toBeNull();
        });

        it('should have wall kick offsets initialized', () => {
            expect(tetrominoManager.wallKickOffsets).toBeDefined();
            expect(tetrominoManager.wallKickOffsets.standard).toBeDefined();
            expect(tetrominoManager.wallKickOffsets.I).toBeDefined();
        });
    });

    describe('Piece Spawning', () => {
        it('should spawn a piece at the correct position', () => {
            const piece = tetrominoManager.spawnPiece();
            
            expect(piece).not.toBeNull();
            expect(piece.x).toBe(3);
            expect(piece.y).toBe(0);
            expect(piece.rotation).toBe(0);
        });

        it('should generate a next piece when spawning', () => {
            tetrominoManager.spawnPiece();
            
            expect(tetrominoManager.getNextPiece()).not.toBeNull();
        });

        it('should use next piece as current piece on subsequent spawns', () => {
            tetrominoManager.spawnPiece();
            const nextPiece = tetrominoManager.getNextPiece();
            
            tetrominoManager.spawnPiece();
            const currentPiece = tetrominoManager.getCurrentPiece();
            
            expect(currentPiece.type).toBe(nextPiece.type);
        });

        it('should return null if spawn position is blocked', () => {
            // Fill the spawn area more comprehensively to block any piece
            for (let y = 0; y < 4; y++) {
                for (let x = 0; x < 10; x++) {
                    boardManager.getBoard()[y][x] = { type: 'I', color: '#00FFFF' };
                }
            }
            
            const piece = tetrominoManager.spawnPiece();
            expect(piece).toBeNull();
            expect(tetrominoManager.getCurrentPiece()).toBeNull();
        });

        it('should check spawn collision before placing piece', () => {
            // First spawn a piece to set up next piece
            tetrominoManager.spawnPiece();
            
            // Should be able to spawn next piece on empty board
            expect(tetrominoManager.canSpawnPiece()).toBe(true);

            // Fill spawn area
            const board = boardManager.getBoard();
            for (let y = 0; y < 4; y++) {
                for (let x = 3; x < 7; x++) {
                    board[y][x] = { type: 'I', color: '#00FFFF' };
                }
            }

            // Should not be able to spawn now
            expect(tetrominoManager.canSpawnPiece()).toBe(false);
        });

        it('should log spawn success and failure', () => {
            const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

            // Successful spawn
            const piece = tetrominoManager.spawnPiece();
            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining(`Spawned ${piece.type} piece at position`)
            );

            // Fill spawn area to cause failure
            const board = boardManager.getBoard();
            for (let y = 0; y < 4; y++) {
                for (let x = 0; x < 10; x++) {
                    board[y][x] = { type: 'I', color: '#00FFFF' };
                }
            }

            // Failed spawn
            tetrominoManager.spawnPiece();
            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('Cannot spawn')
            );

            consoleSpy.mockRestore();
        });
    });

    describe('Piece Generation and Preview System', () => {
        it('should spawn pieces at top center of board', () => {
            const piece = tetrominoManager.spawnPiece();
            
            expect(piece.x).toBe(3); // Center of 10-wide board minus 2 for piece offset
            expect(piece.y).toBe(0); // Top of board
        });

        it('should maintain next piece preview throughout game', () => {
            // First spawn should create both current and next piece
            tetrominoManager.spawnPiece();
            const firstNext = tetrominoManager.getNextPiece();
            expect(firstNext).not.toBeNull();
            
            // Second spawn should use previous next as current, generate new next
            tetrominoManager.spawnPiece();
            const secondCurrent = tetrominoManager.getCurrentPiece();
            const secondNext = tetrominoManager.getNextPiece();
            
            expect(secondCurrent.type).toBe(firstNext.type);
            expect(secondNext).not.toBeNull();
            expect(secondNext.type).not.toBe(secondCurrent.type); // Very likely different
        });

        it('should generate pieces using 7-bag system for proper distribution', () => {
            const generatedTypes = [];
            
            // Generate 7 pieces and track their types
            for (let i = 0; i < 7; i++) {
                const piece = tetrominoManager.spawnPiece();
                generatedTypes.push(piece.type);
            }
            
            // Should have all 7 different types
            const uniqueTypes = new Set(generatedTypes);
            expect(uniqueTypes.size).toBe(7);
            
            // Should contain all tetromino types
            Object.values(TETROMINO_TYPES).forEach(type => {
                expect(generatedTypes).toContain(type);
            });
        });

        it('should update next piece preview correctly after each spawn', () => {
            const nextPieces = [];
            
            // Track next pieces through multiple spawns
            for (let i = 0; i < 5; i++) {
                tetrominoManager.spawnPiece();
                const nextPiece = tetrominoManager.getNextPiece();
                nextPieces.push(nextPiece.type);
            }
            
            // Each next piece should be valid
            nextPieces.forEach(type => {
                expect(Object.values(TETROMINO_TYPES)).toContain(type);
            });
            
            // Should have generated different pieces (very likely)
            expect(nextPieces.length).toBe(5);
        });

        it('should handle piece spawning when next piece exists', () => {
            // First spawn creates both current and next
            const firstPiece = tetrominoManager.spawnPiece();
            const nextPiece = tetrominoManager.getNextPiece();
            
            expect(firstPiece).not.toBeNull();
            expect(nextPiece).not.toBeNull();
            
            // Second spawn should use the next piece
            const secondPiece = tetrominoManager.spawnPiece();
            expect(secondPiece.type).toBe(nextPiece.type);
            
            // Should have a new next piece
            const newNextPiece = tetrominoManager.getNextPiece();
            expect(newNextPiece).not.toBeNull();
            expect(newNextPiece.type).toBeDefined();
        });

        it('should handle piece spawning when no next piece exists', () => {
            // Manually clear next piece to test this scenario
            tetrominoManager.nextPiece = null;
            
            const piece = tetrominoManager.spawnPiece();
            
            expect(piece).not.toBeNull();
            expect(piece.type).toBeDefined();
            expect(tetrominoManager.getNextPiece()).not.toBeNull();
        });

        it('should reset preview system correctly', () => {
            // Generate some pieces
            tetrominoManager.spawnPiece();
            expect(tetrominoManager.getCurrentPiece()).not.toBeNull();
            expect(tetrominoManager.getNextPiece()).not.toBeNull();
            
            // Reset should clear both current and next pieces
            tetrominoManager.reset();
            expect(tetrominoManager.getCurrentPiece()).toBeNull();
            expect(tetrominoManager.getNextPiece()).toBeNull();
        });

        it('should spawn pieces with correct initial properties', () => {
            const piece = tetrominoManager.spawnPiece();
            
            expect(piece.rotation).toBe(0); // Always spawn with 0 rotation
            expect(piece.color).toBeDefined();
            expect(piece.shape).toBeDefined();
            expect(piece.shape).toHaveLength(4); // 4x4 grid
            expect(Object.values(TETROMINO_TYPES)).toContain(piece.type);
        });
    });

    describe('Horizontal Movement', () => {
        beforeEach(() => {
            tetrominoManager.spawnPiece();
        });

        it('should move piece left when possible', () => {
            const initialX = tetrominoManager.getCurrentPiece().x;
            const moved = tetrominoManager.moveLeft();
            
            expect(moved).toBe(true);
            expect(tetrominoManager.getCurrentPiece().x).toBe(initialX - 1);
        });

        it('should move piece right when possible', () => {
            const initialX = tetrominoManager.getCurrentPiece().x;
            const moved = tetrominoManager.moveRight();
            
            expect(moved).toBe(true);
            expect(tetrominoManager.getCurrentPiece().x).toBe(initialX + 1);
        });

        it('should not move left when at boundary', () => {
            const piece = tetrominoManager.getCurrentPiece();
            
            // Move piece to the leftmost valid position
            while (tetrominoManager.moveLeft()) {
                // Keep moving left until we can't
            }
            
            // Now try to move left one more time - should fail
            const moved = tetrominoManager.moveLeft();
            expect(moved).toBe(false);
        });

        it('should not move right when at boundary', () => {
            const piece = tetrominoManager.getCurrentPiece();
            piece.x = 7; // Assuming piece width allows this to be at right boundary
            
            const moved = tetrominoManager.moveRight();
            expect(moved).toBe(false);
            expect(piece.x).toBe(7);
        });

        it('should not move when blocked by existing pieces', () => {
            const piece = tetrominoManager.getCurrentPiece();
            
            // Place blocks to the right to block all possible positions
            for (let x = piece.x + 1; x < 10; x++) {
                for (let y = 0; y < 4; y++) {
                    boardManager.getBoard()[y][x] = { type: 'I', color: '#00FFFF' };
                }
            }
            
            const moved = tetrominoManager.moveRight();
            expect(moved).toBe(false);
        });

        it('should return false when no current piece exists', () => {
            tetrominoManager.currentPiece = null;
            
            expect(tetrominoManager.moveLeft()).toBe(false);
            expect(tetrominoManager.moveRight()).toBe(false);
        });
    });

    describe('Vertical Movement', () => {
        beforeEach(() => {
            tetrominoManager.spawnPiece();
        });

        it('should move piece down when possible', () => {
            const initialY = tetrominoManager.getCurrentPiece().y;
            const moved = tetrominoManager.moveDown();
            
            expect(moved).toBe(true);
            expect(tetrominoManager.getCurrentPiece().y).toBe(initialY + 1);
        });

        it('should not move down when at bottom', () => {
            const piece = tetrominoManager.getCurrentPiece();
            piece.y = 19; // Bottom of 20-high board
            
            const moved = tetrominoManager.moveDown();
            expect(moved).toBe(false);
            expect(piece.y).toBe(19);
        });

        it('should not move down when blocked by existing pieces', () => {
            const piece = tetrominoManager.getCurrentPiece();
            
            // Place blocks below to block all possible positions
            for (let x = 0; x < 10; x++) {
                for (let y = piece.y + 1; y < piece.y + 5; y++) {
                    if (y < 20) {
                        boardManager.getBoard()[y][x] = { type: 'I', color: '#00FFFF' };
                    }
                }
            }
            
            const moved = tetrominoManager.moveDown();
            expect(moved).toBe(false);
        });

        it('should return false when no current piece exists', () => {
            tetrominoManager.currentPiece = null;
            
            expect(tetrominoManager.moveDown()).toBe(false);
        });
    });

    describe('Piece Rotation', () => {
        beforeEach(() => {
            tetrominoManager.spawnPiece();
        });

        it('should rotate piece when space is available', () => {
            const initialRotation = tetrominoManager.getCurrentPiece().rotation;
            const rotated = tetrominoManager.rotatePiece();
            
            expect(rotated).toBe(true);
            expect(tetrominoManager.getCurrentPiece().rotation).toBe((initialRotation + 1) % 4);
        });

        it('should not rotate when blocked', () => {
            const piece = tetrominoManager.getCurrentPiece();
            const initialRotation = piece.rotation;
            
            // Fill surrounding area to block rotation
            for (let x = 0; x < 10; x++) {
                for (let y = 1; y < 5; y++) {
                    if (x !== piece.x || y !== piece.y) {
                        boardManager.getBoard()[y][x] = { type: 'I', color: '#00FFFF' };
                    }
                }
            }
            
            const rotated = tetrominoManager.rotatePiece();
            expect(rotated).toBe(false);
            expect(piece.rotation).toBe(initialRotation);
        });

        it('should return false when no current piece exists', () => {
            tetrominoManager.currentPiece = null;
            
            expect(tetrominoManager.rotatePiece()).toBe(false);
        });
    });

    describe('Wall Kick System', () => {
        it('should attempt wall kicks when basic rotation fails', () => {
            // Create a T-piece near the left wall
            tetrominoManager.currentPiece = createTetromino(TETROMINO_TYPES.T, 0, 5, 0);
            
            // This should succeed with wall kick
            const rotated = tetrominoManager.rotatePiece();
            expect(rotated).toBe(true);
        });

        it('should use I-piece specific wall kicks for I-pieces', () => {
            tetrominoManager.currentPiece = createTetromino(TETROMINO_TYPES.I, 0, 5, 0);
            
            const offsets = tetrominoManager.getWallKickOffsets('I', 0, 1);
            expect(offsets).toEqual([[-2, 0], [1, 0], [-2, 1], [1, -2]]);
        });

        it('should use standard wall kicks for non-I pieces', () => {
            const offsets = tetrominoManager.getWallKickOffsets('T', 0, 1);
            expect(offsets).toEqual([[-1, 0], [-1, -1], [0, 2], [-1, 2]]);
        });

        it('should return empty array for invalid transitions', () => {
            const offsets = tetrominoManager.getWallKickOffsets('T', 0, 5);
            expect(offsets).toEqual([]);
        });
    });

    describe('Hard Drop', () => {
        beforeEach(() => {
            tetrominoManager.spawnPiece();
        });

        it('should drop piece to bottom and return distance', () => {
            const piece = tetrominoManager.getCurrentPiece();
            const initialY = piece.y;
            
            // Ensure the piece has room to drop by checking if it can move down
            if (!tetrominoManager.canMoveDown()) {
                // If it can't move down, create a new piece higher up
                tetrominoManager.currentPiece = createTetromino(TETROMINO_TYPES.I, 3, 0, 0);
            }
            
            const dropDistance = tetrominoManager.hardDrop();
            
            expect(dropDistance).toBeGreaterThan(0);
            expect(tetrominoManager.getCurrentPiece().y).toBeGreaterThan(initialY);
            expect(tetrominoManager.canMoveDown()).toBe(false);
        });

        it('should return 0 when piece cannot move down', () => {
            const piece = tetrominoManager.getCurrentPiece();
            
            // Place blocks below to prevent any movement
            for (let x = 0; x < 10; x++) {
                for (let y = piece.y + 1; y < 20; y++) {
                    boardManager.getBoard()[y][x] = { type: 'I', color: '#00FFFF' };
                }
            }
            
            const dropDistance = tetrominoManager.hardDrop();
            expect(dropDistance).toBe(0);
        });

        it('should return 0 when no current piece exists', () => {
            tetrominoManager.currentPiece = null;
            
            expect(tetrominoManager.hardDrop()).toBe(0);
        });
    });

    describe('Ghost Piece', () => {
        beforeEach(() => {
            tetrominoManager.spawnPiece();
        });

        it('should return ghost piece at drop position', () => {
            const currentPiece = tetrominoManager.getCurrentPiece();
            const ghostPiece = tetrominoManager.getGhostPiece();
            
            expect(ghostPiece).not.toBeNull();
            expect(ghostPiece.type).toBe(currentPiece.type);
            expect(ghostPiece.x).toBe(currentPiece.x);
            expect(ghostPiece.y).toBeGreaterThanOrEqual(currentPiece.y);
        });

        it('should return null when no current piece exists', () => {
            tetrominoManager.currentPiece = null;
            
            expect(tetrominoManager.getGhostPiece()).toBeNull();
        });
    });

    describe('Piece Locking', () => {
        beforeEach(() => {
            tetrominoManager.spawnPiece();
        });

        it('should lock piece and clear current piece', () => {
            const piece = tetrominoManager.getCurrentPiece();
            const locked = tetrominoManager.lockPiece();
            
            expect(locked).toBe(true);
            expect(tetrominoManager.getCurrentPiece()).toBeNull();
        });

        it('should return false when no current piece exists', () => {
            tetrominoManager.currentPiece = null;
            
            expect(tetrominoManager.lockPiece()).toBe(false);
        });
    });

    describe('State Management', () => {
        it('should report no active piece initially', () => {
            expect(tetrominoManager.hasActivePiece()).toBe(false);
        });

        it('should report active piece after spawning', () => {
            tetrominoManager.spawnPiece();
            expect(tetrominoManager.hasActivePiece()).toBe(true);
        });

        it('should reset state correctly', () => {
            tetrominoManager.spawnPiece();
            tetrominoManager.reset();
            
            expect(tetrominoManager.getCurrentPiece()).toBeNull();
            expect(tetrominoManager.getNextPiece()).toBeNull();
            expect(tetrominoManager.hasActivePiece()).toBe(false);
        });

        it('should return piece state information', () => {
            tetrominoManager.spawnPiece();
            const state = tetrominoManager.getPieceState();
            
            expect(state).not.toBeNull();
            expect(state).toHaveProperty('type');
            expect(state).toHaveProperty('x');
            expect(state).toHaveProperty('y');
            expect(state).toHaveProperty('rotation');
            expect(state).toHaveProperty('color');
            expect(state).toHaveProperty('canMoveLeft');
            expect(state).toHaveProperty('canMoveRight');
            expect(state).toHaveProperty('canMoveDown');
            expect(state).toHaveProperty('canRotate');
        });

        it('should return null state when no current piece', () => {
            expect(tetrominoManager.getPieceState()).toBeNull();
        });
    });

    describe('Movement Validation', () => {
        beforeEach(() => {
            tetrominoManager.spawnPiece();
        });

        it('should correctly report if piece can move down', () => {
            expect(tetrominoManager.canMoveDown()).toBe(true);
            
            // Move to bottom
            tetrominoManager.hardDrop();
            expect(tetrominoManager.canMoveDown()).toBe(false);
        });

        it('should return false for canMoveDown when no current piece', () => {
            tetrominoManager.currentPiece = null;
            expect(tetrominoManager.canMoveDown()).toBe(false);
        });
    });
});