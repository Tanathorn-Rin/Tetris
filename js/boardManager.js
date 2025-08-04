/**
 * BoardManager class for managing the Tetris game board
 * Handles board state, collision detection, line clearing, and piece placement
 */

import { getTetrominoBlocks } from './tetrominoUtils.js';

export class BoardManager {
    /**
     * Create a new BoardManager instance
     * @param {number} width - Board width in blocks (default: 10)
     * @param {number} height - Board height in blocks (default: 20)
     */
    constructor(width = 10, height = 20) {
        this.width = width;
        this.height = height;
        this.board = this.initializeBoard();
    }

    /**
     * Initialize an empty game board
     * @returns {Array} 2D array representing the empty board
     */
    initializeBoard() {
        const board = [];
        for (let row = 0; row < this.height; row++) {
            board[row] = new Array(this.width).fill(null);
        }
        return board;
    }

    /**
     * Clear the board (reset to empty state)
     */
    clearBoard() {
        this.board = this.initializeBoard();
    }

    /**
     * Get the current board state
     * @returns {Array} 2D array representing the current board
     */
    getBoard() {
        return this.board;
    }

    /**
     * Get a copy of the current board state
     * @returns {Array} Deep copy of the 2D board array
     */
    getBoardCopy() {
        return this.board.map(row => [...row]);
    }

    /**
     * Check if a position is within board boundaries
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @returns {boolean} True if position is within bounds
     */
    isWithinBounds(x, y) {
        return x >= 0 && x < this.width && y >= 0 && y < this.height;
    }

    /**
     * Check if a board position is empty
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @returns {boolean} True if position is empty (null)
     */
    isEmpty(x, y) {
        if (!this.isWithinBounds(x, y)) {
            return false;
        }
        return this.board[y][x] === null;
    }

    /**
     * Check if a board position is occupied
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @returns {boolean} True if position is occupied (not null)
     */
    isOccupied(x, y) {
        if (!this.isWithinBounds(x, y)) {
            return true; // Out of bounds is considered occupied
        }
        return this.board[y][x] !== null;
    }

    /**
     * Check if a tetromino position is valid (no collisions, within bounds)
     * @param {Object} tetromino - The tetromino to check
     * @returns {boolean} True if position is valid
     */
    isValidPosition(tetromino) {
        const blocks = getTetrominoBlocks(tetromino);
        
        for (const block of blocks) {
            // Check if block is within board boundaries
            if (!this.isWithinBounds(block.x, block.y)) {
                return false;
            }
            
            // Check if block position is occupied
            if (this.isOccupied(block.x, block.y)) {
                return false;
            }
        }
        
        return true;
    }

    /**
     * Check if a tetromino can move in a specific direction
     * @param {Object} tetromino - The tetromino to check
     * @param {number} deltaX - Change in X position
     * @param {number} deltaY - Change in Y position
     * @returns {boolean} True if movement is valid
     */
    canMove(tetromino, deltaX, deltaY) {
        const movedTetromino = {
            ...tetromino,
            x: tetromino.x + deltaX,
            y: tetromino.y + deltaY
        };
        
        return this.isValidPosition(movedTetromino);
    }

    /**
     * Check if a tetromino can move left
     * @param {Object} tetromino - The tetromino to check
     * @returns {boolean} True if left movement is valid
     */
    canMoveLeft(tetromino) {
        return this.canMove(tetromino, -1, 0);
    }

    /**
     * Check if a tetromino can move right
     * @param {Object} tetromino - The tetromino to check
     * @returns {boolean} True if right movement is valid
     */
    canMoveRight(tetromino) {
        return this.canMove(tetromino, 1, 0);
    }

    /**
     * Check if a tetromino can move down
     * @param {Object} tetromino - The tetromino to check
     * @returns {boolean} True if downward movement is valid
     */
    canMoveDown(tetromino) {
        return this.canMove(tetromino, 0, 1);
    }

    /**
     * Check if a tetromino rotation is valid
     * @param {Object} rotatedTetromino - The tetromino after rotation
     * @returns {boolean} True if rotation is valid
     */
    canRotate(rotatedTetromino) {
        return this.isValidPosition(rotatedTetromino);
    }

    /**
     * Place a tetromino on the board (lock it in place)
     * @param {Object} tetromino - The tetromino to place
     * @returns {boolean} True if piece was successfully placed
     */
    placePiece(tetromino) {
        if (!this.isValidPosition(tetromino)) {
            return false;
        }
        
        const blocks = getTetrominoBlocks(tetromino);
        
        for (const block of blocks) {
            this.board[block.y][block.x] = {
                type: tetromino.type,
                color: tetromino.color
            };
        }
        
        return true;
    }

    /**
     * Check if a row is completely filled
     * @param {number} row - Row index to check
     * @returns {boolean} True if row is completely filled
     */
    isRowComplete(row) {
        if (row < 0 || row >= this.height) {
            return false;
        }
        
        for (let col = 0; col < this.width; col++) {
            if (this.board[row][col] === null) {
                return false;
            }
        }
        
        return true;
    }

    /**
     * Find all complete rows
     * @returns {Array} Array of row indices that are complete
     */
    findCompleteRows() {
        const completeRows = [];
        
        for (let row = 0; row < this.height; row++) {
            if (this.isRowComplete(row)) {
                completeRows.push(row);
            }
        }
        
        return completeRows;
    }

    /**
     * Clear a specific row and move all rows above down
     * @param {number} rowIndex - Index of row to clear
     */
    clearRow(rowIndex) {
        if (rowIndex < 0 || rowIndex >= this.height) {
            return;
        }
        
        // Remove the row
        this.board.splice(rowIndex, 1);
        
        // Add a new empty row at the top
        this.board.unshift(new Array(this.width).fill(null));
    }

    /**
     * Clear all complete lines and return information about cleared lines
     * @returns {Object} Object containing count and row indices of cleared lines
     */
    clearLines() {
        const completeRows = this.findCompleteRows();
        
        if (completeRows.length === 0) {
            return { count: 0, rows: [] };
        }
        
        // Store the original row indices for animation
        const clearedRowIndices = [...completeRows];
        
        // Create a new board without the complete rows
        const newBoard = [];
        
        // Add empty rows at the top for each cleared line
        for (let i = 0; i < completeRows.length; i++) {
            newBoard.push(new Array(this.width).fill(null));
        }
        
        // Copy non-complete rows to the new board
        for (let row = 0; row < this.height; row++) {
            if (!completeRows.includes(row)) {
                newBoard.push([...this.board[row]]);
            }
        }
        
        this.board = newBoard;
        return { count: completeRows.length, rows: clearedRowIndices };
    }

    /**
     * Check if the game is over (blocks in spawn area)
     * @returns {boolean} True if game is over
     */
    isGameOver() {
        // Check if any blocks exist in the top two rows (spawn area)
        // This is more comprehensive than just checking the top row
        for (let row = 0; row < Math.min(2, this.height); row++) {
            for (let col = 0; col < this.width; col++) {
                if (this.board[row][col] !== null) {
                    return true;
                }
            }
        }
        return false;
    }

    /**
     * Check if a newly spawned piece would collide immediately
     * @param {Object} tetromino - The tetromino to check for spawn collision
     * @returns {boolean} True if spawn would cause immediate collision
     */
    wouldCauseSpawnCollision(tetromino) {
        return !this.isValidPosition(tetromino);
    }

    /**
     * Get the height of the highest block in each column
     * @returns {Array} Array of heights for each column
     */
    getColumnHeights() {
        const heights = new Array(this.width).fill(0);
        
        for (let col = 0; col < this.width; col++) {
            for (let row = 0; row < this.height; row++) {
                if (this.board[row][col] !== null) {
                    heights[col] = this.height - row;
                    break;
                }
            }
        }
        
        return heights;
    }

    /**
     * Get the total number of filled blocks on the board
     * @returns {number} Number of filled blocks
     */
    getFilledBlockCount() {
        let count = 0;
        
        for (let row = 0; row < this.height; row++) {
            for (let col = 0; col < this.width; col++) {
                if (this.board[row][col] !== null) {
                    count++;
                }
            }
        }
        
        return count;
    }

    /**
     * Get board statistics
     * @returns {Object} Object containing board statistics
     */
    getStats() {
        return {
            width: this.width,
            height: this.height,
            filledBlocks: this.getFilledBlockCount(),
            completeRows: this.findCompleteRows().length,
            columnHeights: this.getColumnHeights(),
            isGameOver: this.isGameOver()
        };
    }
}