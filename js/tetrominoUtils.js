/**
 * Utility functions for tetromino manipulation
 * Handles rotation, position validation, and other tetromino operations
 */

import { 
    TETROMINO_SHAPES, 
    TETROMINO_TYPES, 
    TETROMINO_COLORS,
    ALL_TETROMINO_TYPES,
    ROTATION_STATES,
    MAX_ROTATION_STATE 
} from './tetrominoes.js';

/**
 * Create a new tetromino object
 * @param {string} type - The tetromino type (I, O, T, S, Z, J, L)
 * @param {number} x - Initial x position
 * @param {number} y - Initial y position
 * @param {number} rotation - Initial rotation state (0-3)
 * @returns {Object} Tetromino object
 */
export function createTetromino(type, x = 0, y = 0, rotation = 0) {
    if (!TETROMINO_TYPES[type]) {
        throw new Error(`Invalid tetromino type: ${type}`);
    }
    
    if (rotation < 0 || rotation > MAX_ROTATION_STATE) {
        throw new Error(`Invalid rotation state: ${rotation}. Must be 0-${MAX_ROTATION_STATE}`);
    }
    
    return {
        type,
        x,
        y,
        rotation,
        color: TETROMINO_COLORS[type],
        shape: TETROMINO_SHAPES[type][rotation]
    };
}

// 7-bag system for better piece distribution
let pieceBag = [];

/**
 * Generate a shuffled bag of all 7 tetromino types
 * @returns {Array} Shuffled array of all tetromino types
 */
function generatePieceBag() {
    const bag = [...ALL_TETROMINO_TYPES];
    
    // Fisher-Yates shuffle algorithm
    for (let i = bag.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [bag[i], bag[j]] = [bag[j], bag[i]];
    }
    
    return bag;
}

/**
 * Generate a random tetromino type using 7-bag system
 * Ensures each piece type appears exactly once before any type repeats
 * @returns {string} Random tetromino type
 */
export function getRandomTetrominoType() {
    if (pieceBag.length === 0) {
        pieceBag = generatePieceBag();
    }
    
    return pieceBag.pop();
}

/**
 * Reset the piece bag (useful for testing or game restart)
 */
export function resetPieceBag() {
    pieceBag = [];
}

/**
 * Get the current state of the piece bag (useful for testing)
 * @returns {Array} Current piece bag contents
 */
export function getPieceBagState() {
    return [...pieceBag];
}

/**
 * Create a random tetromino at the specified position
 * @param {number} x - Initial x position
 * @param {number} y - Initial y position
 * @returns {Object} Random tetromino object
 */
export function createRandomTetromino(x = 0, y = 0) {
    const type = getRandomTetrominoType();
    return createTetromino(type, x, y, 0);
}

/**
 * Rotate a tetromino clockwise
 * @param {Object} tetromino - The tetromino to rotate
 * @returns {Object} New tetromino object with updated rotation
 */
export function rotateTetromino(tetromino) {
    const newRotation = (tetromino.rotation + 1) % (MAX_ROTATION_STATE + 1);
    return {
        ...tetromino,
        rotation: newRotation,
        shape: TETROMINO_SHAPES[tetromino.type][newRotation]
    };
}

/**
 * Rotate a tetromino counter-clockwise
 * @param {Object} tetromino - The tetromino to rotate
 * @returns {Object} New tetromino object with updated rotation
 */
export function rotateTetrominoCounterClockwise(tetromino) {
    const newRotation = tetromino.rotation === 0 ? MAX_ROTATION_STATE : tetromino.rotation - 1;
    return {
        ...tetromino,
        rotation: newRotation,
        shape: TETROMINO_SHAPES[tetromino.type][newRotation]
    };
}

/**
 * Move a tetromino to a new position
 * @param {Object} tetromino - The tetromino to move
 * @param {number} deltaX - Change in x position
 * @param {number} deltaY - Change in y position
 * @returns {Object} New tetromino object with updated position
 */
export function moveTetromino(tetromino, deltaX, deltaY) {
    return {
        ...tetromino,
        x: tetromino.x + deltaX,
        y: tetromino.y + deltaY
    };
}

/**
 * Set a tetromino to a specific position
 * @param {Object} tetromino - The tetromino to position
 * @param {number} x - New x position
 * @param {number} y - New y position
 * @returns {Object} New tetromino object with updated position
 */
export function setTetrominoPosition(tetromino, x, y) {
    return {
        ...tetromino,
        x,
        y
    };
}

/**
 * Get all filled block positions for a tetromino
 * @param {Object} tetromino - The tetromino to analyze
 * @returns {Array} Array of {x, y} coordinates for filled blocks
 */
export function getTetrominoBlocks(tetromino) {
    const blocks = [];
    const shape = tetromino.shape;
    
    for (let row = 0; row < shape.length; row++) {
        for (let col = 0; col < shape[row].length; col++) {
            if (shape[row][col] === 1) {
                blocks.push({
                    x: tetromino.x + col,
                    y: tetromino.y + row
                });
            }
        }
    }
    
    return blocks;
}

/**
 * Check if a position is valid for a tetromino on a board
 * @param {Object} tetromino - The tetromino to check
 * @param {Array} board - 2D array representing the game board
 * @param {number} boardWidth - Width of the game board
 * @param {number} boardHeight - Height of the game board
 * @returns {boolean} True if position is valid, false otherwise
 */
export function isValidPosition(tetromino, board, boardWidth, boardHeight) {
    const blocks = getTetrominoBlocks(tetromino);
    
    for (const block of blocks) {
        // Check boundaries
        if (block.x < 0 || block.x >= boardWidth || 
            block.y < 0 || block.y >= boardHeight) {
            return false;
        }
        
        // Check collision with existing blocks
        if (board[block.y] && board[block.y][block.x] !== null) {
            return false;
        }
    }
    
    return true;
}

/**
 * Check if a tetromino can move in a specific direction
 * @param {Object} tetromino - The tetromino to check
 * @param {number} deltaX - Change in x position
 * @param {number} deltaY - Change in y position
 * @param {Array} board - 2D array representing the game board
 * @param {number} boardWidth - Width of the game board
 * @param {number} boardHeight - Height of the game board
 * @returns {boolean} True if movement is valid, false otherwise
 */
export function canMove(tetromino, deltaX, deltaY, board, boardWidth, boardHeight) {
    const movedTetromino = moveTetromino(tetromino, deltaX, deltaY);
    return isValidPosition(movedTetromino, board, boardWidth, boardHeight);
}

/**
 * Check if a tetromino can rotate
 * @param {Object} tetromino - The tetromino to check
 * @param {Array} board - 2D array representing the game board
 * @param {number} boardWidth - Width of the game board
 * @param {number} boardHeight - Height of the game board
 * @returns {boolean} True if rotation is valid, false otherwise
 */
export function canRotate(tetromino, board, boardWidth, boardHeight) {
    const rotatedTetromino = rotateTetromino(tetromino);
    return isValidPosition(rotatedTetromino, board, boardWidth, boardHeight);
}

/**
 * Get the bounding box of a tetromino shape
 * @param {Object} tetromino - The tetromino to analyze
 * @returns {Object} Bounding box with minX, maxX, minY, maxY
 */
export function getTetrominoBounds(tetromino) {
    const blocks = getTetrominoBlocks(tetromino);
    
    if (blocks.length === 0) {
        return { minX: 0, maxX: 0, minY: 0, maxY: 0 };
    }
    
    let minX = blocks[0].x;
    let maxX = blocks[0].x;
    let minY = blocks[0].y;
    let maxY = blocks[0].y;
    
    for (const block of blocks) {
        minX = Math.min(minX, block.x);
        maxX = Math.max(maxX, block.x);
        minY = Math.min(minY, block.y);
        maxY = Math.max(maxY, block.y);
    }
    
    return { minX, maxX, minY, maxY };
}

/**
 * Get the width of a tetromino shape
 * @param {Object} tetromino - The tetromino to analyze
 * @returns {number} Width in blocks
 */
export function getTetrominoWidth(tetromino) {
    const bounds = getTetrominoBounds(tetromino);
    return bounds.maxX - bounds.minX + 1;
}

/**
 * Get the height of a tetromino shape
 * @param {Object} tetromino - The tetromino to analyze
 * @returns {number} Height in blocks
 */
export function getTetrominoHeight(tetromino) {
    const bounds = getTetrominoBounds(tetromino);
    return bounds.maxY - bounds.minY + 1;
}

/**
 * Clone a tetromino object
 * @param {Object} tetromino - The tetromino to clone
 * @returns {Object} Deep copy of the tetromino
 */
export function cloneTetromino(tetromino) {
    return {
        ...tetromino,
        shape: tetromino.shape.map(row => [...row])
    };
}

/**
 * Check if two tetrominoes are equal
 * @param {Object} tetromino1 - First tetromino
 * @param {Object} tetromino2 - Second tetromino
 * @returns {boolean} True if tetrominoes are equal
 */
export function areTetrominoesEqual(tetromino1, tetromino2) {
    return tetromino1.type === tetromino2.type &&
           tetromino1.x === tetromino2.x &&
           tetromino1.y === tetromino2.y &&
           tetromino1.rotation === tetromino2.rotation;
}