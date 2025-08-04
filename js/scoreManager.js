/**
 * ScoreManager class for handling scoring, level progression, and statistics
 * Implements the standard Tetris scoring system with level-based multipliers
 */

export class ScoreManager {
    /**
     * Create a new ScoreManager instance
     * @param {Object} config - Configuration object
     */
    constructor(config = {}) {
        this.config = {
            linesPerLevel: config.linesPerLevel || 10,
            initialLevel: config.initialLevel || 1,
            ...config
        };

        this.reset();
    }

    /**
     * Reset the score manager to initial state
     */
    reset() {
        this.score = 0;
        this.level = this.config.initialLevel;
        this.linesCleared = 0;
        this.totalPiecesPlaced = 0;
        this.linesClearedByType = {
            single: 0,    // 1 line cleared
            double: 0,    // 2 lines cleared
            triple: 0,    // 3 lines cleared
            tetris: 0     // 4 lines cleared (Tetris)
        };
    }

    /**
     * Add score for cleared lines
     * @param {number} linesCleared - Number of lines cleared (1-4)
     * @returns {number} Points awarded
     */
    addScore(linesCleared) {
        // Validate input - must be a positive integer between 1 and 4
        if (typeof linesCleared !== 'number' || 
            isNaN(linesCleared) || 
            linesCleared < 1 || 
            linesCleared > 4 || 
            !Number.isInteger(linesCleared)) {
            return 0;
        }

        const baseScore = this.getBaseScore(linesCleared);
        const pointsAwarded = baseScore * this.level;
        
        this.score += pointsAwarded;
        this.linesCleared += linesCleared;
        
        // Update line clearing statistics
        this.updateLineClearingStats(linesCleared);
        
        // Check for level progression
        this.updateLevel();
        
        return pointsAwarded;
    }

    /**
     * Get base score for number of lines cleared
     * @param {number} linesCleared - Number of lines cleared
     * @returns {number} Base score value
     */
    getBaseScore(linesCleared) {
        switch (linesCleared) {
            case 1: return 100;   // Single
            case 2: return 300;   // Double
            case 3: return 500;   // Triple
            case 4: return 800;   // Tetris
            default: return 0;
        }
    }

    /**
     * Update line clearing statistics
     * @param {number} linesCleared - Number of lines cleared
     */
    updateLineClearingStats(linesCleared) {
        switch (linesCleared) {
            case 1:
                this.linesClearedByType.single++;
                break;
            case 2:
                this.linesClearedByType.double++;
                break;
            case 3:
                this.linesClearedByType.triple++;
                break;
            case 4:
                this.linesClearedByType.tetris++;
                break;
        }
    }

    /**
     * Update level based on lines cleared
     */
    updateLevel() {
        const newLevel = Math.floor(this.linesCleared / this.config.linesPerLevel) + this.config.initialLevel;
        this.level = newLevel;
    }

    /**
     * Add a piece placement (for statistics)
     */
    addPiecePlacement() {
        this.totalPiecesPlaced++;
    }

    /**
     * Get current score
     * @returns {number} Current score
     */
    getScore() {
        return this.score;
    }

    /**
     * Get current level
     * @returns {number} Current level
     */
    getLevel() {
        return this.level;
    }

    /**
     * Get total lines cleared
     * @returns {number} Total lines cleared
     */
    getLinesCleared() {
        return this.linesCleared;
    }

    /**
     * Get lines needed for next level
     * @returns {number} Lines needed for next level
     */
    getLinesUntilNextLevel() {
        const linesInCurrentLevel = this.linesCleared % this.config.linesPerLevel;
        return this.config.linesPerLevel - linesInCurrentLevel;
    }

    /**
     * Get total pieces placed
     * @returns {number} Total pieces placed
     */
    getTotalPiecesPlaced() {
        return this.totalPiecesPlaced;
    }

    /**
     * Get line clearing statistics
     * @returns {Object} Line clearing statistics by type
     */
    getLineClearingStats() {
        return { ...this.linesClearedByType };
    }

    /**
     * Get comprehensive statistics
     * @returns {Object} Complete statistics object
     */
    getStats() {
        return {
            score: this.score,
            level: this.level,
            linesCleared: this.linesCleared,
            linesUntilNextLevel: this.getLinesUntilNextLevel(),
            totalPiecesPlaced: this.totalPiecesPlaced,
            lineClearingStats: this.getLineClearingStats(),
            averageScorePerPiece: this.totalPiecesPlaced > 0 ? 
                Math.round(this.score / this.totalPiecesPlaced) : 0,
            tetrisPercentage: this.linesCleared > 0 ? 
                Math.round((this.linesClearedByType.tetris * 4 / this.linesCleared) * 100) : 0
        };
    }

    /**
     * Calculate fall speed based on current level
     * @param {number} baseFallSpeed - Base fall speed in milliseconds
     * @returns {number} Adjusted fall speed for current level
     */
    calculateFallSpeed(baseFallSpeed = 1000) {
        // Fall speed decreases as level increases (gets faster)
        // Formula: base speed * (0.8 ^ (level - 1))
        const speedMultiplier = Math.pow(0.8, this.level - 1);
        return Math.max(
            Math.round(baseFallSpeed * speedMultiplier),
            50 // Minimum fall speed of 50ms
        );
    }

    /**
     * Export current state for saving/loading
     * @returns {Object} Serializable state object
     */
    exportState() {
        return {
            score: this.score,
            level: this.level,
            linesCleared: this.linesCleared,
            totalPiecesPlaced: this.totalPiecesPlaced,
            linesClearedByType: { ...this.linesClearedByType },
            config: { ...this.config }
        };
    }

    /**
     * Import state from saved data
     * @param {Object} state - State object to import
     */
    importState(state) {
        this.score = state.score || 0;
        this.level = state.level || this.config.initialLevel;
        this.linesCleared = state.linesCleared || 0;
        this.totalPiecesPlaced = state.totalPiecesPlaced || 0;
        this.linesClearedByType = state.linesClearedByType || {
            single: 0,
            double: 0,
            triple: 0,
            tetris: 0
        };
        
        if (state.config) {
            this.config = { ...this.config, ...state.config };
        }
    }
}