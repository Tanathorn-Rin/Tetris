/**
 * Main entry point for the Tetris game
 * Sets up the game engine and initializes all components
 */

// Import game modules
import { GameRenderer } from './gameRenderer.js';
import { GameEngine } from './gameEngine.js';
import { InputHandler } from './inputHandler.js';
import { TETROMINO_TYPES, TETROMINO_COLORS } from './tetrominoes.js';
// Additional modules will be imported in subsequent tasks
// import { ScoreManager } from './scoreManager.js';

// Game configuration constants
const GAME_CONFIG = {
    BOARD_WIDTH: 10,
    BOARD_HEIGHT: 20,
    BLOCK_SIZE: 30,
    CANVAS_WIDTH: 300,  // 10 blocks * 30px
    CANVAS_HEIGHT: 600, // 20 blocks * 30px
    NEXT_CANVAS_SIZE: 120,
    TARGET_FPS: 60,
    FRAME_TIME: 1000 / 60 // Target frame time in milliseconds
};

// Global game state and instances
let gameInstance = null;
let gameEngine = null;
let gameRenderer = null;
let inputHandler = null;

// Performance monitoring
let frameCount = 0;
let lastFPSUpdate = 0;
let currentFPS = 0;

/**
 * Initialize the game when the page loads
 */
document.addEventListener('DOMContentLoaded', () => {
    console.log('Tetris game initializing...');
    console.log(`Configuration: ${GAME_CONFIG.BOARD_WIDTH}x${GAME_CONFIG.BOARD_HEIGHT} board, ${GAME_CONFIG.TARGET_FPS} FPS target`);
    
    // Validate browser support
    if (!validateBrowserSupport()) {
        console.error('Browser does not support required features');
        return;
    }
    
    // Get canvas elements
    const gameCanvas = document.getElementById('gameCanvas');
    const nextPieceCanvas = document.getElementById('nextPieceCanvas');
    
    if (!gameCanvas || !nextPieceCanvas) {
        console.error('Canvas elements not found!');
        showError('Canvas elements not found. Please check the HTML structure.');
        return;
    }
    
    // Verify canvas dimensions match configuration
    gameCanvas.width = GAME_CONFIG.CANVAS_WIDTH;
    gameCanvas.height = GAME_CONFIG.CANVAS_HEIGHT;
    nextPieceCanvas.width = GAME_CONFIG.NEXT_CANVAS_SIZE;
    nextPieceCanvas.height = GAME_CONFIG.NEXT_CANVAS_SIZE;
    
    // Get canvas contexts
    const gameContext = gameCanvas.getContext('2d');
    const nextPieceContext = nextPieceCanvas.getContext('2d');
    
    if (!gameContext || !nextPieceContext) {
        console.error('Could not get canvas contexts!');
        showError('Could not get canvas contexts. Canvas may not be supported.');
        return;
    }
    
    // Initialize performance monitoring
    lastFPSUpdate = performance.now();
    
    // Initialize game components
    const success = initializeGame(gameContext, nextPieceContext);
    
    if (success) {
        console.log('Tetris game initialized successfully!');
        console.log('Game loop running at 60 FPS with integrated systems');
    } else {
        showError('Failed to initialize game. Please refresh and try again.');
    }
});

/**
 * Validate browser support for required features
 * @returns {boolean} True if browser supports all required features
 */
function validateBrowserSupport() {
    const requiredFeatures = [
        'requestAnimationFrame',
        'performance',
        'addEventListener'
    ];
    
    for (const feature of requiredFeatures) {
        if (!(feature in window)) {
            console.error(`Missing required feature: ${feature}`);
            return false;
        }
    }
    
    // Check querySelector separately since it's on document, not window
    if (!document.querySelector) {
        console.error('Missing required feature: querySelector');
        return false;
    }
    
    // Check for Canvas support
    const testCanvas = document.createElement('canvas');
    if (!testCanvas.getContext || !testCanvas.getContext('2d')) {
        console.error('Canvas 2D context not supported');
        return false;
    }
    
    return true;
}

/**
 * Show error message to user
 * @param {string} message - Error message to display
 */
function showError(message) {
    console.error(message);
    
    // Try to show error in UI if possible
    const errorElement = document.getElementById('error-message');
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    } else {
        // Fallback to alert if no error element exists
        alert(`Tetris Game Error: ${message}`);
    }
}

/**
 * Initialize game components and start the game
 * @param {CanvasRenderingContext2D} gameContext - Main game canvas context
 * @param {CanvasRenderingContext2D} nextPieceContext - Next piece canvas context
 */
function initializeGame(gameContext, nextPieceContext) {
    try {
        // Initialize the GameRenderer
        gameRenderer = new GameRenderer(gameContext, nextPieceContext, GAME_CONFIG);
        
        // Initialize the GameEngine with configuration
        gameEngine = new GameEngine({
            boardWidth: GAME_CONFIG.BOARD_WIDTH,
            boardHeight: GAME_CONFIG.BOARD_HEIGHT,
            initialFallSpeed: 1000, // 1 second initial fall speed
            softDropSpeed: 50,      // 50ms for soft drop
            lockDelay: 500          // 500ms lock delay
        });
        
        // Set up game engine callbacks with proper error handling
        gameEngine.onGameStateChange = (gameState) => {
            try {
                gameRenderer.render(gameState);
                updateUI(gameState);
                updatePerformanceMetrics();
            } catch (error) {
                console.error('Error in game state change callback:', error);
            }
        };
        
        gameEngine.onScoreChange = (score, level, linesCleared) => {
            console.log(`Score: ${score}, Level: ${level}, Lines: ${linesCleared}`);
        };
        
        gameEngine.onLinesCleared = (count, rows) => {
            console.log(`${count} line(s) cleared!`);
            // Trigger line clear animation
            if (gameRenderer && rows && rows.length > 0) {
                gameRenderer.startLineClearAnimation(rows);
            }
        };
        
        gameEngine.onGameOver = (finalState) => {
            console.log('Game Over! Final score:', finalState.score);
            showGameOverStats(finalState);
        };
        
        // Set up input handling
        inputHandler = new InputHandler(gameEngine);
        inputHandler.bindEvents();
        
        // Store instances globally for debugging and access
        window.gameEngine = gameEngine;
        window.gameRenderer = gameRenderer;
        window.inputHandler = inputHandler;
        window.gameConfig = GAME_CONFIG;
        
        // Set up cleanup on page unload
        window.addEventListener('beforeunload', cleanupGame);
        
        // Start the game
        gameEngine.start();
        
        console.log('Tetris game initialized successfully!');
        console.log('Controls: Arrow keys to move/rotate, P to pause, R to restart');
        console.log(`Target FPS: ${GAME_CONFIG.TARGET_FPS}, Frame time: ${GAME_CONFIG.FRAME_TIME}ms`);
        
        return true;
    } catch (error) {
        console.error('Failed to initialize game:', error);
        return false;
    }
}

/**
 * Create a test game state to demonstrate rendering capabilities
 * @returns {Object} Test game state object
 */
function createTestGameState() {
    // Create a sample board with some placed pieces
    const board = Array(GAME_CONFIG.BOARD_HEIGHT).fill(null).map(() => Array(GAME_CONFIG.BOARD_WIDTH).fill(null));
    
    // Add some test pieces to the board
    // Bottom row with some gaps
    board[19][0] = TETROMINO_COLORS.I;
    board[19][1] = TETROMINO_COLORS.I;
    board[19][2] = TETROMINO_COLORS.O;
    board[19][3] = TETROMINO_COLORS.O;
    board[19][5] = TETROMINO_COLORS.T;
    board[19][6] = TETROMINO_COLORS.T;
    board[19][7] = TETROMINO_COLORS.S;
    board[19][8] = TETROMINO_COLORS.Z;
    board[19][9] = TETROMINO_COLORS.L;
    
    // Second row
    board[18][0] = TETROMINO_COLORS.J;
    board[18][1] = TETROMINO_COLORS.J;
    board[18][2] = TETROMINO_COLORS.O;
    board[18][3] = TETROMINO_COLORS.O;
    board[18][7] = TETROMINO_COLORS.S;
    board[18][8] = TETROMINO_COLORS.Z;
    board[18][9] = TETROMINO_COLORS.L;
    
    // Create a current piece (T-piece)
    const currentPiece = {
        type: TETROMINO_TYPES.T,
        rotation: 0,
        x: 4,
        y: 2
    };
    
    // Create a next piece (I-piece)
    const nextPiece = {
        type: TETROMINO_TYPES.I,
        rotation: 0,
        x: 0,
        y: 0
    };
    
    return {
        status: 'playing',
        score: 12500,
        level: 3,
        linesCleared: 25,
        board: board,
        currentPiece: currentPiece,
        nextPiece: nextPiece,
        showGhost: true
    };
}

/**
 * Update UI elements with current game state
 * @param {Object} gameState - Current game state
 */
function updateUI(gameState) {
    try {
        // Update score display
        const scoreElement = document.getElementById('score');
        if (scoreElement) {
            scoreElement.textContent = gameState.score.toLocaleString();
        }
        
        // Update level display
        const levelElement = document.getElementById('level');
        if (levelElement) {
            levelElement.textContent = gameState.level;
        }
        
        // Update lines cleared display with progress indicator
        const linesElement = document.getElementById('lines');
        if (linesElement) {
            const currentLines = gameState.linesCleared;
            const nextLevelLines = gameState.level * 10;
            const progressText = `${currentLines} / ${nextLevelLines}`;
            linesElement.textContent = progressText;
        }
        
        // Update game status
        const statusElement = document.getElementById('status');
        if (statusElement) {
            statusElement.textContent = gameState.status.charAt(0).toUpperCase() + gameState.status.slice(1);
        }
        
        // Handle pause overlay display
        const pauseOverlay = document.getElementById('pauseOverlay');
        if (pauseOverlay) {
            if (gameState.status === 'paused') {
                pauseOverlay.classList.remove('hidden');
            } else {
                pauseOverlay.classList.add('hidden');
            }
        }
        
        // Handle game over overlay display
        const gameOverOverlay = document.getElementById('gameOverOverlay');
        if (gameOverOverlay) {
            if (gameState.status === 'gameOver') {
                gameOverOverlay.classList.remove('hidden');
            } else {
                gameOverOverlay.classList.add('hidden');
            }
        }
    } catch (error) {
        console.error('Error updating UI:', error);
    }
}

/**
 * Update performance metrics and FPS monitoring
 */
function updatePerformanceMetrics() {
    frameCount++;
    const currentTime = performance.now();
    
    if (currentTime - lastFPSUpdate >= 1000) {
        currentFPS = Math.round((frameCount * 1000) / (currentTime - lastFPSUpdate));
        frameCount = 0;
        lastFPSUpdate = currentTime;
        
        // Log performance warnings if FPS is too low
        if (currentFPS < GAME_CONFIG.TARGET_FPS * 0.8) {
            console.warn(`Low FPS detected: ${currentFPS} (target: ${GAME_CONFIG.TARGET_FPS})`);
        }
    }
}

/**
 * Get current performance metrics
 * @returns {Object} Performance metrics
 */
function getPerformanceMetrics() {
    return {
        currentFPS: currentFPS,
        targetFPS: GAME_CONFIG.TARGET_FPS,
        frameTime: GAME_CONFIG.FRAME_TIME,
        isPerformanceGood: currentFPS >= GAME_CONFIG.TARGET_FPS * 0.8
    };
}

/**
 * Show game over statistics
 * @param {Object} finalState - Final game state
 */
function showGameOverStats(finalState) {
    const stats = finalState.scoreStats || {};
    console.log('=== GAME OVER STATISTICS ===');
    console.log(`Final Score: ${finalState.score.toLocaleString()}`);
    console.log(`Level Reached: ${finalState.level}`);
    console.log(`Lines Cleared: ${finalState.linesCleared}`);
    console.log(`Pieces Placed: ${stats.totalPiecesPlaced || 0}`);
    
    if (stats.lineClearingStats) {
        console.log('Line Clearing Breakdown:');
        console.log(`  Singles: ${stats.lineClearingStats.single}`);
        console.log(`  Doubles: ${stats.lineClearingStats.double}`);
        console.log(`  Triples: ${stats.lineClearingStats.triple}`);
        console.log(`  Tetrises: ${stats.lineClearingStats.tetris}`);
    }
    
    const performance = getPerformanceMetrics();
    console.log(`Average FPS: ${performance.currentFPS}`);
    console.log('============================');
}

/**
 * Clean up game resources and event listeners
 */
function cleanupGame() {
    try {
        console.log('Cleaning up game resources...');
        
        if (gameEngine) {
            gameEngine.stop();
        }
        
        if (inputHandler) {
            inputHandler.unbindEvents();
        }
        
        // Clear global references
        window.gameEngine = null;
        window.gameRenderer = null;
        window.inputHandler = null;
        
        console.log('Game cleanup completed');
    } catch (error) {
        console.error('Error during game cleanup:', error);
    }
}



/**
 * Set up demo controls to test rendering features (legacy function for reference)
 * @param {GameRenderer} renderer - The game renderer instance
 */
function setupRenderingDemo(renderer) {
    let demoState = createTestGameState();
    let currentPieceType = 0;
    const pieceTypes = Object.values(TETROMINO_TYPES);
    
    document.addEventListener('keydown', (event) => {
        switch (event.key) {
            case 'ArrowLeft':
                // Move current piece left
                if (demoState.currentPiece && demoState.currentPiece.x > 0) {
                    demoState.currentPiece.x--;
                    renderer.render(demoState);
                }
                event.preventDefault();
                break;
                
            case 'ArrowRight':
                // Move current piece right
                if (demoState.currentPiece && demoState.currentPiece.x < GAME_CONFIG.BOARD_WIDTH - 4) {
                    demoState.currentPiece.x++;
                    renderer.render(demoState);
                }
                event.preventDefault();
                break;
                
            case 'ArrowDown':
                // Move current piece down
                if (demoState.currentPiece && demoState.currentPiece.y < GAME_CONFIG.BOARD_HEIGHT - 4) {
                    demoState.currentPiece.y++;
                    renderer.render(demoState);
                }
                event.preventDefault();
                break;
                
            case 'ArrowUp':
            case ' ':
                // Rotate current piece
                if (demoState.currentPiece) {
                    demoState.currentPiece.rotation = (demoState.currentPiece.rotation + 1) % 4;
                    renderer.render(demoState);
                }
                event.preventDefault();
                break;
                
            case 'n':
            case 'N':
                // Cycle through next piece types
                currentPieceType = (currentPieceType + 1) % pieceTypes.length;
                demoState.nextPiece.type = pieceTypes[currentPieceType];
                renderer.render(demoState);
                event.preventDefault();
                break;
                
            case 'c':
            case 'C':
                // Change current piece type
                currentPieceType = (currentPieceType + 1) % pieceTypes.length;
                demoState.currentPiece.type = pieceTypes[currentPieceType];
                demoState.currentPiece.rotation = 0;
                renderer.render(demoState);
                event.preventDefault();
                break;
                
            case 'g':
            case 'G':
                // Toggle ghost piece
                demoState.showGhost = !demoState.showGhost;
                renderer.render(demoState);
                event.preventDefault();
                break;
                
            case 'p':
            case 'P':
            case 'Escape':
                // Toggle pause state
                demoState.status = demoState.status === 'paused' ? 'playing' : 'paused';
                renderer.render(demoState);
                event.preventDefault();
                break;
                
            case 'o':
            case 'O':
                // Toggle game over state
                demoState.status = demoState.status === 'gameOver' ? 'playing' : 'gameOver';
                renderer.render(demoState);
                event.preventDefault();
                break;
                
            case 'r':
            case 'R':
                // Reset demo state
                demoState = createTestGameState();
                renderer.render(demoState);
                event.preventDefault();
                break;
        }
    });
    
    // Display demo controls
    console.log('Demo Controls:');
    console.log('Arrow Keys: Move/Rotate current piece');
    console.log('N: Cycle next piece type');
    console.log('C: Change current piece type');
    console.log('G: Toggle ghost piece');
    console.log('P/Escape: Toggle pause');
    console.log('O: Toggle game over');
    console.log('R: Reset demo');
}

/**
 * Get current game instance and state
 * @returns {Object} Current game instance information
 */
function getGameInstance() {
    return {
        engine: gameEngine,
        renderer: gameRenderer,
        inputHandler: inputHandler,
        config: GAME_CONFIG,
        performance: getPerformanceMetrics(),
        isRunning: gameEngine ? gameEngine.getGameState().status === 'playing' : false
    };
}

/**
 * Restart the current game
 */
function restartGame() {
    if (gameEngine) {
        gameEngine.restart();
        console.log('Game restarted');
    }
}

/**
 * Pause or resume the current game
 */
function togglePause() {
    if (gameEngine) {
        gameEngine.togglePause();
        const status = gameEngine.getGameState().status;
        console.log(`Game ${status}`);
    }
}

/**
 * Get detailed game statistics
 * @returns {Object} Comprehensive game statistics
 */
function getGameStatistics() {
    if (!gameEngine) {
        return null;
    }
    
    const gameState = gameEngine.getGameState();
    const performance = getPerformanceMetrics();
    
    return {
        gameState: gameState,
        performance: performance,
        uptime: performance.now ? performance.now() - lastFPSUpdate : 0,
        memoryUsage: performance.memory ? {
            used: performance.memory.usedJSHeapSize,
            total: performance.memory.totalJSHeapSize,
            limit: performance.memory.jsHeapSizeLimit
        } : null
    };
}

// Export configuration and utility functions for use by other modules
export { 
    GAME_CONFIG,
    getGameInstance,
    restartGame,
    togglePause,
    getGameStatistics,
    getPerformanceMetrics
};