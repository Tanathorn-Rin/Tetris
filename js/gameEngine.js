/**
 * GameEngine class for managing the main game loop and timing mechanics
 * Handles automatic piece falling, game state, and coordination between components
 */

import { BoardManager } from './boardManager.js';
import { TetrominoManager } from './tetrominoManager.js';
import { ScoreManager } from './scoreManager.js';

export class GameEngine {
    /**
     * Create a new GameEngine instance
     * @param {Object} config - Game configuration object
     */
    constructor(config = {}) {
        this.config = {
            boardWidth: config.boardWidth || 10,
            boardHeight: config.boardHeight || 20,
            initialFallSpeed: config.initialFallSpeed || 1000, // milliseconds
            softDropSpeed: config.softDropSpeed || 50, // milliseconds
            lockDelay: config.lockDelay || 500, // milliseconds before piece locks
            ...config
        };

        // Initialize game components
        this.boardManager = new BoardManager(this.config.boardWidth, this.config.boardHeight);
        this.tetrominoManager = new TetrominoManager(this.boardManager);
        this.scoreManager = new ScoreManager();

        // Game state
        this.gameState = {
            status: 'stopped', // 'stopped', 'playing', 'paused', 'gameOver'
            fallSpeed: this.config.initialFallSpeed
        };

        // Timing variables
        this.lastFallTime = 0;
        this.lastUpdateTime = 0;
        this.lockTimer = 0;
        this.isLockDelayActive = false;
        this.isSoftDropping = false;
        this.pauseTime = 0;

        // Game loop
        this.animationFrameId = null;
        this.isRunning = false;

        // Event callbacks
        this.onGameStateChange = null;
        this.onScoreChange = null;
        this.onLinesCleared = null;
        this.onGameOver = null;
    }

    /**
     * Start the game
     */
    start() {
        if (this.isRunning) {
            return;
        }

        this.reset();
        this.gameState.status = 'playing';
        this.isRunning = true;
        
        // Spawn the first piece
        if (!this.tetrominoManager.spawnPiece()) {
            this.gameOver();
            return;
        }

        // Start the game loop
        this.lastUpdateTime = performance.now();
        this.lastFallTime = this.lastUpdateTime;
        this.gameLoop();

        this.notifyGameStateChange();
    }

    /**
     * Pause the game
     */
    pause() {
        if (this.gameState.status === 'playing') {
            this.gameState.status = 'paused';
            // Store the time when paused to properly resume timers
            this.pauseTime = performance.now();
            this.notifyGameStateChange();
        }
    }

    /**
     * Resume the game
     */
    resume() {
        if (this.gameState.status === 'paused') {
            this.gameState.status = 'playing';
            
            // Adjust timers to account for pause duration
            const currentTime = performance.now();
            const pauseDuration = currentTime - this.pauseTime;
            
            this.lastUpdateTime = currentTime;
            this.lastFallTime += pauseDuration;
            
            this.notifyGameStateChange();
        }
    }

    /**
     * Toggle pause state
     */
    togglePause() {
        if (this.gameState.status === 'playing') {
            this.pause();
        } else if (this.gameState.status === 'paused') {
            this.resume();
        }
    }

    /**
     * Stop the game
     */
    stop() {
        this.isRunning = false;
        this.gameState.status = 'stopped';
        
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }

        this.notifyGameStateChange();
    }

    /**
     * Reset the game to initial state
     */
    reset() {
        this.boardManager.clearBoard();
        this.tetrominoManager.reset();
        this.scoreManager.reset();
        
        this.gameState = {
            status: 'stopped',
            fallSpeed: this.config.initialFallSpeed
        };

        this.lastFallTime = 0;
        this.lastUpdateTime = 0;
        this.lockTimer = 0;
        this.isLockDelayActive = false;
        this.isSoftDropping = false;
        this.pauseTime = 0;
    }

    /**
     * Main game loop
     */
    gameLoop() {
        if (!this.isRunning) {
            return;
        }

        const currentTime = performance.now();
        const deltaTime = currentTime - this.lastUpdateTime;
        this.lastUpdateTime = currentTime;

        // Only update if game is playing
        if (this.gameState.status === 'playing') {
            this.update(deltaTime);
            // Ensure UI updates every frame while playing
            this.notifyGameStateChange();
        }

        // Continue the game loop
        this.animationFrameId = requestAnimationFrame(() => this.gameLoop());
    }

    /**
     * Update game state
     * @param {number} deltaTime - Time elapsed since last update in milliseconds
     */
    update(deltaTime) {
        // Don't update if game is not playing
        if (this.gameState.status !== 'playing') {
            return;
        }

        if (!this.tetrominoManager.hasActivePiece()) {
            // Spawn new piece if none exists
            const spawnResult = this.tetrominoManager.spawnPiece();
            if (!spawnResult) {
                // Failed to spawn piece - game over
                console.log('Game over: Cannot spawn new piece');
                this.gameOver();
                return;
            }
            
            // Double-check game over conditions after spawning
            if (this.checkGameOverConditions()) {
                console.log('Game over: Game over conditions met after spawn');
                this.gameOver();
                return;
            }
            
            this.isLockDelayActive = false;
            this.lockTimer = 0;
            // Notify that a new piece has spawned
            this.notifyGameStateChange();
        }

        this.updateFalling(deltaTime);
        this.updateLockDelay(deltaTime);
    }

    /**
     * Update automatic falling mechanics
     * @param {number} deltaTime - Time elapsed since last update
     */
    updateFalling(deltaTime) {
        const currentFallSpeed = this.isSoftDropping ? 
            this.config.softDropSpeed : 
            this.gameState.fallSpeed;

        const timeSinceLastFall = performance.now() - this.lastFallTime;

        if (timeSinceLastFall >= currentFallSpeed) {
            this.tryMovePieceDown();
            this.lastFallTime = performance.now();
        }
    }

    /**
     * Update lock delay mechanics
     * @param {number} deltaTime - Time elapsed since last update
     */
    updateLockDelay(deltaTime) {
        if (this.isLockDelayActive && this.gameState.status === 'playing') {
            this.lockTimer += deltaTime;
            
            if (this.lockTimer >= this.config.lockDelay) {
                this.lockCurrentPiece();
            }
        }
    }

    /**
     * Try to move the current piece down
     */
    tryMovePieceDown() {
        if (!this.tetrominoManager.hasActivePiece()) {
            return;
        }

        if (this.tetrominoManager.moveDown()) {
            // Piece moved successfully, reset lock delay
            this.isLockDelayActive = false;
            this.lockTimer = 0;
            // Notify that the game state has changed (piece moved)
            this.notifyGameStateChange();
        } else {
            // Piece can't move down, start lock delay
            if (!this.isLockDelayActive) {
                this.isLockDelayActive = true;
                this.lockTimer = 0;
            }
        }
    }

    /**
     * Lock the current piece in place
     */
    lockCurrentPiece() {
        if (!this.tetrominoManager.hasActivePiece()) {
            return;
        }

        // Lock the piece on the board
        this.tetrominoManager.lockPiece();
        
        // Track piece placement for statistics
        this.scoreManager.addPiecePlacement();
        
        // Clear any completed lines
        const lineClearResult = this.boardManager.clearLines();
        if (lineClearResult.count > 0) {
            this.handleLinesCleared(lineClearResult.count, lineClearResult.rows);
        }

        // Reset lock delay
        this.isLockDelayActive = false;
        this.lockTimer = 0;

        // Check for game over conditions
        if (this.checkGameOverConditions()) {
            console.log('Game over: Game over conditions met after piece lock');
            this.gameOver();
        }
    }

    /**
     * Handle lines being cleared
     * @param {number} linesCleared - Number of lines cleared
     * @param {Array} clearedRows - Array of row indices that were cleared
     */
    handleLinesCleared(linesCleared, clearedRows) {
        // Use ScoreManager to handle scoring and level progression
        const pointsAwarded = this.scoreManager.addScore(linesCleared);
        
        // Update fall speed based on new level
        this.updateFallSpeed();

        // Store cleared rows for animation
        this.lastClearedRows = clearedRows;

        // Only notify callbacks if game is playing
        if (this.gameState.status === 'playing') {
            this.notifyScoreChange();
            this.notifyLinesCleared(linesCleared, clearedRows);
        }
    }



    /**
     * Update fall speed based on current level
     */
    updateFallSpeed() {
        this.gameState.fallSpeed = this.scoreManager.calculateFallSpeed(this.config.initialFallSpeed);
    }

    /**
     * Handle game over
     */
    gameOver() {
        // Only trigger game over if not already in game over state
        if (this.gameState.status === 'gameOver') {
            return;
        }

        console.log('Game Over triggered');
        
        this.gameState.status = 'gameOver';
        this.isRunning = false;
        
        // Stop the game loop
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }

        // Clear any active timers
        this.isLockDelayActive = false;
        this.lockTimer = 0;
        this.isSoftDropping = false;

        // Notify listeners
        this.notifyGameStateChange();
        this.notifyGameOver();
    }

    /**
     * Restart the game (reset and start)
     */
    restart() {
        console.log('Restarting game...');
        
        // Stop current game if running
        this.stop();
        
        // Reset all state
        this.reset();
        
        // Start fresh game
        this.start();
    }

    /**
     * Check if game over conditions are met
     * @returns {boolean} True if game should end
     */
    checkGameOverConditions() {
        // Check if board has blocks in spawn area (top rows)
        if (this.boardManager.isGameOver()) {
            return true;
        }

        // Check if current piece cannot be placed at spawn position
        if (this.tetrominoManager.hasActivePiece()) {
            const currentPiece = this.tetrominoManager.getCurrentPiece();
            if (currentPiece && !this.boardManager.isValidPosition(currentPiece)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Enable soft drop (faster falling)
     */
    startSoftDrop() {
        this.isSoftDropping = true;
    }

    /**
     * Disable soft drop (normal falling speed)
     */
    stopSoftDrop() {
        this.isSoftDropping = false;
    }

    /**
     * Get current game state
     * @returns {Object} Current game state
     */
    getGameState() {
        const scoreStats = this.scoreManager.getStats();
        return {
            ...this.gameState,
            score: scoreStats.score,
            level: scoreStats.level,
            linesCleared: scoreStats.linesCleared,
            board: this.boardManager.getBoardCopy(),
            currentPiece: this.tetrominoManager.getCurrentPiece(),
            nextPiece: this.tetrominoManager.getNextPiece(),
            isLockDelayActive: this.isLockDelayActive,
            lockTimer: this.lockTimer,
            isSoftDropping: this.isSoftDropping,
            scoreStats: scoreStats
        };
    }

    /**
     * Get tetromino manager instance
     * @returns {TetrominoManager} Tetromino manager
     */
    getTetrominoManager() {
        return this.tetrominoManager;
    }

    /**
     * Get board manager instance
     * @returns {BoardManager} Board manager
     */
    getBoardManager() {
        return this.boardManager;
    }

    /**
     * Get score manager instance
     * @returns {ScoreManager} Score manager
     */
    getScoreManager() {
        return this.scoreManager;
    }

    // Event notification methods
    notifyGameStateChange() {
        if (this.onGameStateChange) {
            this.onGameStateChange(this.getGameState());
        }
    }

    notifyScoreChange() {
        if (this.onScoreChange) {
            const stats = this.scoreManager.getStats();
            this.onScoreChange(stats.score, stats.level, stats.linesCleared);
        }
    }

    notifyLinesCleared(count, rows) {
        if (this.onLinesCleared) {
            this.onLinesCleared(count, rows);
        }
    }

    notifyGameOver() {
        if (this.onGameOver) {
            this.onGameOver(this.gameState);
        }
    }
}