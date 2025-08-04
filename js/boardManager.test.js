/**
 * Unit tests for BoardManager class
 * Tests board initialization, collision detection, boundary checking, and line clearing
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { BoardManager } from './boardManager.js';
import { createTetromino } from './tetrominoUtils.js';
import { TETROMINO_TYPES } from './tetrominoes.js';

describe('BoardManager', () => {
    let boardManager;

    beforeEach(() => {
        boardManager = new BoardManager();
    });

    describe('Initialization', () => {
        it('should create a board with default dimensions (10x20)', () => {
            expect(boardManager.width).toBe(10);
            expect(boardManager.height).toBe(20);
            expect(boardManager.board).toHaveLength(20);
            expect(boardManager.board[0]).toHaveLength(10);
        });

        it('should create a board with custom dimensions', () => {
            const customBoard = new BoardManager(8, 16);
            expect(customBoard.width).toBe(8);
            expect(customBoard.height).toBe(16);
            expect(customBoard.board).toHaveLength(16);
            expect(customBoard.board[0]).toHaveLength(8);
        });

        it('should initialize board with all null values', () => {
            for (let row = 0; row < boardManager.height; row++) {
                for (let col = 0; col < boardManager.width; col++) {
                    expect(boardManager.board[row][col]).toBeNull();
                }
            }
        });
    });

    describe('Board State Management', () => {
        it('should clear the board', () => {
            // Fill some positions
            boardManager.board[19][0] = { type: 'I', color: '#00FFFF' };
            boardManager.board[19][1] = { type: 'O', color: '#FFFF00' };
            
            boardManager.clearBoard();
            
            for (let row = 0; row < boardManager.height; row++) {
                for (let col = 0; col < boardManager.width; col++) {
                    expect(boardManager.board[row][col]).toBeNull();
                }
            }
        });

        it('should return board copy without affecting original', () => {
            boardManager.board[19][0] = { type: 'I', color: '#00FFFF' };
            
            const boardCopy = boardManager.getBoardCopy();
            boardCopy[19][1] = { type: 'O', color: '#FFFF00' };
            
            expect(boardManager.board[19][1]).toBeNull();
            expect(boardCopy[19][1]).not.toBeNull();
        });
    });

    describe('Boundary Checking', () => {
        it('should correctly identify positions within bounds', () => {
            expect(boardManager.isWithinBounds(0, 0)).toBe(true);
            expect(boardManager.isWithinBounds(9, 19)).toBe(true);
            expect(boardManager.isWithinBounds(5, 10)).toBe(true);
        });

        it('should correctly identify positions outside bounds', () => {
            expect(boardManager.isWithinBounds(-1, 0)).toBe(false);
            expect(boardManager.isWithinBounds(0, -1)).toBe(false);
            expect(boardManager.isWithinBounds(10, 0)).toBe(false);
            expect(boardManager.isWithinBounds(0, 20)).toBe(false);
            expect(boardManager.isWithinBounds(10, 20)).toBe(false);
        });

        it('should identify empty positions correctly', () => {
            expect(boardManager.isEmpty(0, 0)).toBe(true);
            expect(boardManager.isEmpty(9, 19)).toBe(true);
            
            boardManager.board[5][5] = { type: 'T', color: '#800080' };
            expect(boardManager.isEmpty(5, 5)).toBe(false);
        });

        it('should identify occupied positions correctly', () => {
            expect(boardManager.isOccupied(0, 0)).toBe(false);
            
            boardManager.board[5][5] = { type: 'T', color: '#800080' };
            expect(boardManager.isOccupied(5, 5)).toBe(true);
            
            // Out of bounds should be considered occupied
            expect(boardManager.isOccupied(-1, 0)).toBe(true);
            expect(boardManager.isOccupied(10, 0)).toBe(true);
        });
    });

    describe('Tetromino Position Validation', () => {
        it('should validate valid tetromino positions', () => {
            const tetromino = createTetromino(TETROMINO_TYPES.I, 3, 0, 0);
            expect(boardManager.isValidPosition(tetromino)).toBe(true);
        });

        it('should reject tetromino positions outside left boundary', () => {
            const tetromino = createTetromino(TETROMINO_TYPES.I, -1, 0, 0);
            expect(boardManager.isValidPosition(tetromino)).toBe(false);
        });

        it('should reject tetromino positions outside right boundary', () => {
            const tetromino = createTetromino(TETROMINO_TYPES.I, 7, 0, 0); // I-piece is 4 blocks wide
            expect(boardManager.isValidPosition(tetromino)).toBe(false);
        });

        it('should reject tetromino positions outside bottom boundary', () => {
            const tetromino = createTetromino(TETROMINO_TYPES.I, 3, 19, 0);
            expect(boardManager.isValidPosition(tetromino)).toBe(false);
        });

        it('should reject tetromino positions that collide with existing blocks', () => {
            // Place a block on the board
            boardManager.board[1][4] = { type: 'O', color: '#FFFF00' };
            
            // Try to place I-piece that would overlap
            const tetromino = createTetromino(TETROMINO_TYPES.I, 3, 0, 0);
            expect(boardManager.isValidPosition(tetromino)).toBe(false);
        });
    });

    describe('Movement Validation', () => {
        let tetromino;

        beforeEach(() => {
            tetromino = createTetromino(TETROMINO_TYPES.T, 4, 10, 0);
        });

        it('should allow valid left movement', () => {
            expect(boardManager.canMoveLeft(tetromino)).toBe(true);
        });

        it('should allow valid right movement', () => {
            expect(boardManager.canMoveRight(tetromino)).toBe(true);
        });

        it('should allow valid downward movement', () => {
            expect(boardManager.canMoveDown(tetromino)).toBe(true);
        });

        it('should prevent left movement at left boundary', () => {
            const leftBoundaryTetromino = createTetromino(TETROMINO_TYPES.T, 0, 10, 0);
            expect(boardManager.canMoveLeft(leftBoundaryTetromino)).toBe(false);
        });

        it('should prevent right movement at right boundary', () => {
            const rightBoundaryTetromino = createTetromino(TETROMINO_TYPES.T, 7, 10, 0);
            expect(boardManager.canMoveRight(rightBoundaryTetromino)).toBe(false);
        });

        it('should prevent downward movement at bottom boundary', () => {
            const bottomTetromino = createTetromino(TETROMINO_TYPES.T, 4, 18, 0);
            expect(boardManager.canMoveDown(bottomTetromino)).toBe(false);
        });

        it('should prevent movement into occupied spaces', () => {
            // T-piece at (4,10) with rotation 0 has blocks at:
            // (5,11), (4,12), (5,12), (6,12)
            
            // Place blocks to block movement
            boardManager.board[12][3] = { type: 'I', color: '#00FFFF' }; // Block left movement (would hit (4,12) -> (3,12))
            boardManager.board[12][7] = { type: 'I', color: '#00FFFF' }; // Block right movement (would hit (6,12) -> (7,12))
            boardManager.board[13][4] = { type: 'I', color: '#00FFFF' }; // Block downward movement (would hit (4,12) -> (4,13))
            
            expect(boardManager.canMoveLeft(tetromino)).toBe(false);
            expect(boardManager.canMoveRight(tetromino)).toBe(false);
            expect(boardManager.canMoveDown(tetromino)).toBe(false);
        });

        it('should validate general movement with deltaX and deltaY', () => {
            expect(boardManager.canMove(tetromino, -1, 0)).toBe(true); // Left
            expect(boardManager.canMove(tetromino, 1, 0)).toBe(true);  // Right
            expect(boardManager.canMove(tetromino, 0, 1)).toBe(true);  // Down
            expect(boardManager.canMove(tetromino, -5, 0)).toBe(false); // Too far left
            expect(boardManager.canMove(tetromino, 5, 0)).toBe(false);  // Too far right
            expect(boardManager.canMove(tetromino, 0, 10)).toBe(false); // Too far down
        });
    });

    describe('Piece Placement', () => {
        it('should successfully place a valid tetromino', () => {
            const tetromino = createTetromino(TETROMINO_TYPES.O, 4, 17, 0);
            const result = boardManager.placePiece(tetromino);
            
            expect(result).toBe(true);
            // O-piece at (4,17) has blocks at (5,18), (6,18), (5,19), (6,19)
            expect(boardManager.board[18][5]).toEqual({ type: 'O', color: '#FFD700' });
            expect(boardManager.board[18][6]).toEqual({ type: 'O', color: '#FFD700' });
            expect(boardManager.board[19][5]).toEqual({ type: 'O', color: '#FFD700' });
            expect(boardManager.board[19][6]).toEqual({ type: 'O', color: '#FFD700' });
        });

        it('should fail to place an invalid tetromino', () => {
            const tetromino = createTetromino(TETROMINO_TYPES.O, -1, 18, 0);
            const result = boardManager.placePiece(tetromino);
            
            expect(result).toBe(false);
            // Board should remain unchanged
            expect(boardManager.getFilledBlockCount()).toBe(0);
        });
    });

    describe('Line Clearing', () => {
        beforeEach(() => {
            // Fill bottom row completely
            for (let col = 0; col < boardManager.width; col++) {
                boardManager.board[19][col] = { type: 'I', color: '#00FFFF' };
            }
        });

        it('should identify complete rows', () => {
            expect(boardManager.isRowComplete(19)).toBe(true);
            expect(boardManager.isRowComplete(18)).toBe(false);
        });

        it('should find all complete rows', () => {
            // Fill another row
            for (let col = 0; col < boardManager.width; col++) {
                boardManager.board[17][col] = { type: 'T', color: '#800080' };
            }
            
            const completeRows = boardManager.findCompleteRows();
            expect(completeRows).toEqual([17, 19]);
        });

        it('should clear a single row and cascade blocks down', () => {
            // Add a block above the complete row
            boardManager.board[18][5] = { type: 'T', color: '#800080' };
            
            boardManager.clearRow(19);
            
            // Bottom row should be empty
            expect(boardManager.board[19][5]).toEqual({ type: 'T', color: '#800080' });
            expect(boardManager.board[18][5]).toBeNull();
            
            // Top row should be empty
            for (let col = 0; col < boardManager.width; col++) {
                expect(boardManager.board[0][col]).toBeNull();
            }
        });

        it('should clear multiple lines and return count', () => {
            // Start with a fresh board for this test
            boardManager.clearBoard();
            
            // Fill only rows 19, 18, 17 completely (no blocks above)
            for (let col = 0; col < boardManager.width; col++) {
                boardManager.board[19][col] = { type: 'I', color: '#00FFFF' };
                boardManager.board[18][col] = { type: 'T', color: '#800080' };
                boardManager.board[17][col] = { type: 'S', color: '#00FF00' };
            }
            
            const linesCleared = boardManager.clearLines();
            expect(linesCleared.count).toBe(3); // Rows 17, 18, 19
            expect(linesCleared.rows).toEqual([17, 18, 19]);
            
            // After clearing all 3 complete lines with no blocks above,
            // the entire board should be empty
            for (let row = 0; row < boardManager.height; row++) {
                for (let col = 0; col < boardManager.width; col++) {
                    expect(boardManager.board[row][col]).toBeNull();
                }
            }
            
            // Check that no complete rows remain
            expect(boardManager.findCompleteRows()).toHaveLength(0);
        });
    });

    describe('Game Over Detection', () => {
        it('should detect game over when top row has blocks', () => {
            expect(boardManager.isGameOver()).toBe(false);
            
            boardManager.board[0][5] = { type: 'I', color: '#00FFFF' };
            expect(boardManager.isGameOver()).toBe(true);
        });

        it('should detect game over when second row has blocks', () => {
            expect(boardManager.isGameOver()).toBe(false);
            
            boardManager.board[1][5] = { type: 'I', color: '#00FFFF' };
            expect(boardManager.isGameOver()).toBe(true);
        });

        it('should not detect game over when only lower rows have blocks', () => {
            boardManager.board[2][5] = { type: 'I', color: '#00FFFF' };
            boardManager.board[10][3] = { type: 'T', color: '#800080' };
            
            expect(boardManager.isGameOver()).toBe(false);
        });

        it('should detect spawn collision for tetromino pieces', () => {
            // Create a proper test tetromino using the utility function
            const tetromino = createTetromino(TETROMINO_TYPES.I, 4, 0, 0);

            // Place a block where the I-piece would actually be (row 1, col 4)
            // I-piece at (4,0) with rotation 0 has blocks at (4,1), (5,1), (6,1), (7,1)
            boardManager.board[1][4] = { type: 'T', color: '#800080' };

            expect(boardManager.wouldCauseSpawnCollision(tetromino)).toBe(true);
        });

        it('should not detect spawn collision when spawn area is clear', () => {
            // Create a proper test tetromino using the utility function
            const tetromino = createTetromino(TETROMINO_TYPES.I, 4, 0, 0);

            // Spawn area should be clear
            expect(boardManager.wouldCauseSpawnCollision(tetromino)).toBe(false);
        });
    });

    describe('Board Statistics', () => {
        beforeEach(() => {
            // Add some blocks to the board
            boardManager.board[19][0] = { type: 'I', color: '#00FFFF' };
            boardManager.board[19][1] = { type: 'I', color: '#00FFFF' };
            boardManager.board[18][1] = { type: 'T', color: '#800080' };
        });

        it('should count filled blocks correctly', () => {
            expect(boardManager.getFilledBlockCount()).toBe(3);
        });

        it('should calculate column heights correctly', () => {
            const heights = boardManager.getColumnHeights();
            expect(heights[0]).toBe(1); // One block from bottom
            expect(heights[1]).toBe(2); // Two blocks from bottom
            expect(heights[2]).toBe(0); // No blocks
        });

        it('should provide comprehensive board statistics', () => {
            const stats = boardManager.getStats();
            
            expect(stats.width).toBe(10);
            expect(stats.height).toBe(20);
            expect(stats.filledBlocks).toBe(3);
            expect(stats.completeRows).toBe(0);
            expect(stats.columnHeights).toHaveLength(10);
            expect(stats.isGameOver).toBe(false);
        });
    });

    describe('Rotation Validation', () => {
        it('should validate valid rotation positions', () => {
            const tetromino = createTetromino(TETROMINO_TYPES.T, 4, 10, 0);
            const rotatedTetromino = createTetromino(TETROMINO_TYPES.T, 4, 10, 1);
            
            expect(boardManager.canRotate(rotatedTetromino)).toBe(true);
        });

        it('should reject rotation that would go out of bounds', () => {
            // I-piece at (-3,0) with rotation 1 would have blocks at (-1,0), (-1,1), (-1,2), (-1,3)
            // which goes out of bounds on the left side
            const rotatedTetromino = createTetromino(TETROMINO_TYPES.I, -3, 0, 1);
            
            expect(boardManager.canRotate(rotatedTetromino)).toBe(false);
        });

        it('should reject rotation that would collide with existing blocks', () => {
            // T-piece at (4,10) with rotation 1 would have blocks at:
            // (5,11), (5,12), (6,12), (5,13)
            // Place a block that would interfere with this rotation
            boardManager.board[13][5] = { type: 'O', color: '#FFFF00' };
            
            const rotatedTetromino = createTetromino(TETROMINO_TYPES.T, 4, 10, 1);
            
            expect(boardManager.canRotate(rotatedTetromino)).toBe(false);
        });
    });
});