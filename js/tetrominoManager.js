/**
 * TetrominoManager class for managing tetromino piece state and movement
 * Handles current piece state, movement validation, rotation with wall kicks
 */

import { 
    createRandomTetromino, 
    rotateTetromino, 
    moveTetromino,
    cloneTetromino,
    createTetromino
} from './tetrominoUtils.js';

export class TetrominoManager {
    /**
     * Create a new TetrominoManager instance
     * @param {BoardManager} boardManager - Reference to the board manager
     */
    constructor(boardManager) {
        this.boardManager = boardManager;
        this.currentPiece = null;
        this.nextPiece = null;
        this.spawnX = Math.floor(boardManager.width / 2) - 2; // Center spawn position
        this.spawnY = 0;
        
        // Wall kick offsets for rotation (SRS - Super Rotation System)
        this.wallKickOffsets = this.initializeWallKickOffsets();
    }

    /**
     * Initialize wall kick offset tables for different piece types
     * @returns {Object} Wall kick offset data
     */
    initializeWallKickOffsets() {
        // Standard wall kick offsets for most pieces (JLSTZ)
        const standardOffsets = {
            '0->1': [[-1, 0], [-1, -1], [0, 2], [-1, 2]],
            '1->2': [[1, 0], [1, 1], [0, -2], [1, -2]],
            '2->3': [[1, 0], [1, -1], [0, 2], [1, 2]],
            '3->0': [[-1, 0], [-1, 1], [0, -2], [-1, -2]]
        };

        // I-piece has different wall kick offsets
        const iPieceOffsets = {
            '0->1': [[-2, 0], [1, 0], [-2, 1], [1, -2]],
            '1->2': [[-1, 0], [2, 0], [-1, -2], [2, 1]],
            '2->3': [[2, 0], [-1, 0], [2, -1], [-1, 2]],
            '3->0': [[1, 0], [-2, 0], [1, 2], [-2, -1]]
        };

        return {
            standard: standardOffsets,
            I: iPieceOffsets
        };
    }

    /**
     * Spawn a new tetromino piece at the top center of the board
     * @returns {Object|null} The spawned piece, or null if spawn failed
     */
    spawnPiece() {
        // If we have a next piece, use it; otherwise create a random one
        if (this.nextPiece) {
            this.currentPiece = cloneTetromino(this.nextPiece);
        } else {
            this.currentPiece = createRandomTetromino();
        }

        // Position the piece at spawn location (top center)
        this.currentPiece.x = this.spawnX;
        this.currentPiece.y = this.spawnY;

        // Generate next piece for preview
        this.nextPiece = createRandomTetromino();

        // Check if spawn position is valid (game over condition)
        if (!this.boardManager.isValidPosition(this.currentPiece)) {
            console.log(`Cannot spawn ${this.currentPiece.type} piece at position (${this.currentPiece.x}, ${this.currentPiece.y})`);
            this.currentPiece = null; // Clear the failed piece
            return null; // Game over - cannot spawn piece
        }

        console.log(`Spawned ${this.currentPiece.type} piece at position (${this.currentPiece.x}, ${this.currentPiece.y})`);
        return this.currentPiece;
    }

    /**
     * Check if a piece can be spawned at the default spawn position
     * @param {Object} piece - The piece to check (optional, uses next piece if not provided)
     * @returns {boolean} True if piece can be spawned
     */
    canSpawnPiece(piece = null) {
        const testPiece = piece || this.nextPiece;
        if (!testPiece) {
            return false;
        }

        // Create a proper tetromino object for testing
        let spawnTestPiece;
        if (testPiece.shape) {
            // If piece already has shape, clone it
            spawnTestPiece = cloneTetromino(testPiece);
            spawnTestPiece.x = this.spawnX;
            spawnTestPiece.y = this.spawnY;
        } else {
            // If piece doesn't have shape, create it properly
            spawnTestPiece = createTetromino(
                testPiece.type,
                this.spawnX,
                this.spawnY,
                testPiece.rotation || 0
            );
        }

        return this.boardManager.isValidPosition(spawnTestPiece);
    }

    /**
     * Get the current active piece
     * @returns {Object|null} Current tetromino piece
     */
    getCurrentPiece() {
        return this.currentPiece;
    }

    /**
     * Get the next piece preview
     * @returns {Object|null} Next tetromino piece
     */
    getNextPiece() {
        return this.nextPiece;
    }

    /**
     * Move the current piece horizontally
     * @param {number} direction - Direction to move (-1 for left, 1 for right)
     * @returns {boolean} True if movement was successful
     */
    moveHorizontal(direction) {
        if (!this.currentPiece) {
            return false;
        }

        const deltaX = direction > 0 ? 1 : -1;
        
        if (this.boardManager.canMove(this.currentPiece, deltaX, 0)) {
            this.currentPiece = moveTetromino(this.currentPiece, deltaX, 0);
            return true;
        }

        return false;
    }

    /**
     * Move the current piece left
     * @returns {boolean} True if movement was successful
     */
    moveLeft() {
        return this.moveHorizontal(-1);
    }

    /**
     * Move the current piece right
     * @returns {boolean} True if movement was successful
     */
    moveRight() {
        return this.moveHorizontal(1);
    }

    /**
     * Move the current piece down
     * @returns {boolean} True if movement was successful
     */
    moveDown() {
        if (!this.currentPiece) {
            return false;
        }

        if (this.boardManager.canMove(this.currentPiece, 0, 1)) {
            this.currentPiece = moveTetromino(this.currentPiece, 0, 1);
            return true;
        }

        return false;
    }

    /**
     * Get wall kick offsets for a specific rotation transition
     * @param {string} pieceType - Type of tetromino piece
     * @param {number} fromRotation - Current rotation state
     * @param {number} toRotation - Target rotation state
     * @returns {Array} Array of [x, y] offset pairs to try
     */
    getWallKickOffsets(pieceType, fromRotation, toRotation) {
        const transitionKey = `${fromRotation}->${toRotation}`;
        const offsetTable = pieceType === 'I' ? this.wallKickOffsets.I : this.wallKickOffsets.standard;
        
        return offsetTable[transitionKey] || [];
    }

    /**
     * Attempt to rotate the current piece with wall kick logic
     * @returns {boolean} True if rotation was successful
     */
    rotatePiece() {
        if (!this.currentPiece) {
            return false;
        }

        const rotatedPiece = rotateTetromino(this.currentPiece);
        
        // First try rotation without any offset
        if (this.boardManager.canRotate(rotatedPiece)) {
            this.currentPiece = rotatedPiece;
            return true;
        }

        // Try wall kick offsets
        const wallKickOffsets = this.getWallKickOffsets(
            this.currentPiece.type,
            this.currentPiece.rotation,
            rotatedPiece.rotation
        );

        for (const [offsetX, offsetY] of wallKickOffsets) {
            const kickedPiece = moveTetromino(rotatedPiece, offsetX, offsetY);
            
            if (this.boardManager.canRotate(kickedPiece)) {
                this.currentPiece = kickedPiece;
                return true;
            }
        }

        return false; // Rotation failed
    }

    /**
     * Check if the current piece can move down
     * @returns {boolean} True if piece can move down
     */
    canMoveDown() {
        if (!this.currentPiece) {
            return false;
        }

        return this.boardManager.canMoveDown(this.currentPiece);
    }

    /**
     * Lock the current piece in place on the board
     * @returns {boolean} True if piece was successfully locked
     */
    lockPiece() {
        if (!this.currentPiece) {
            return false;
        }

        const success = this.boardManager.placePiece(this.currentPiece);
        if (success) {
            this.currentPiece = null;
        }

        return success;
    }

    /**
     * Perform a hard drop (drop piece to bottom)
     * @returns {number} Number of rows the piece dropped
     */
    hardDrop() {
        if (!this.currentPiece) {
            return 0;
        }

        let dropDistance = 0;
        
        while (this.canMoveDown()) {
            this.moveDown();
            dropDistance++;
        }

        return dropDistance;
    }

    /**
     * Get the ghost piece position (where piece would land if dropped)
     * @returns {Object|null} Ghost piece object or null
     */
    getGhostPiece() {
        if (!this.currentPiece) {
            return null;
        }

        const ghostPiece = cloneTetromino(this.currentPiece);
        
        // Move ghost piece down until it can't move anymore
        while (this.boardManager.canMove(ghostPiece, 0, 1)) {
            ghostPiece.y++;
        }

        return ghostPiece;
    }

    /**
     * Reset the tetromino manager state
     */
    reset() {
        this.currentPiece = null;
        this.nextPiece = null;
    }

    /**
     * Check if there is an active piece
     * @returns {boolean} True if there is a current piece
     */
    hasActivePiece() {
        return this.currentPiece !== null;
    }

    /**
     * Get current piece position and state info
     * @returns {Object|null} Piece state information
     */
    getPieceState() {
        if (!this.currentPiece) {
            return null;
        }

        return {
            type: this.currentPiece.type,
            x: this.currentPiece.x,
            y: this.currentPiece.y,
            rotation: this.currentPiece.rotation,
            color: this.currentPiece.color,
            canMoveLeft: this.boardManager.canMoveLeft(this.currentPiece),
            canMoveRight: this.boardManager.canMoveRight(this.currentPiece),
            canMoveDown: this.boardManager.canMoveDown(this.currentPiece),
            canRotate: this.boardManager.canRotate(rotateTetromino(this.currentPiece))
        };
    }
}