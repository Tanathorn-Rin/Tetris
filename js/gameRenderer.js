/**
 * GameRenderer class handles all rendering operations for the Tetris game
 * Responsible for drawing the game board, tetrominoes, and UI elements
 */

import { TETROMINO_COLORS, TETROMINO_DARK_COLORS, TETROMINO_LIGHT_COLORS, TETROMINO_SHAPES } from './tetrominoes.js';

export class GameRenderer {
    /**
     * Initialize the GameRenderer with canvas contexts and configuration
     * @param {CanvasRenderingContext2D} gameContext - Main game canvas context
     * @param {CanvasRenderingContext2D} nextPieceContext - Next piece canvas context
     * @param {Object} config - Game configuration object
     */
    constructor(gameContext, nextPieceContext, config) {
        this.gameContext = gameContext;
        this.nextPieceContext = nextPieceContext;
        this.config = config;
        
        // UI element references
        this.scoreElement = document.getElementById('score');
        this.levelElement = document.getElementById('level');
        this.linesElement = document.getElementById('lines');
        this.pauseOverlay = document.getElementById('pauseOverlay');
        this.gameOverOverlay = document.getElementById('gameOverOverlay');
        
        // Enhanced rendering constants
        this.GRID_COLOR = '#444444';
        this.GRID_HIGHLIGHT_COLOR = '#555555';
        this.BACKGROUND_COLOR = '#000000';
        this.BORDER_COLOR = '#888888';
        this.BLOCK_BORDER_COLOR = '#AAAAAA';
        this.GHOST_PIECE_ALPHA = 0.25;
        
        // Animation and effects
        this.lineClearAnimation = {
            active: false,
            rows: [],
            progress: 0,
            duration: 500 // milliseconds
        };
        
        this.levelUpAnimation = {
            active: false,
            progress: 0,
            duration: 1000 // milliseconds
        };
        
        // Initialize canvas settings
        this.initializeCanvas();
    }
    
    /**
     * Initialize canvas settings and properties
     */
    initializeCanvas() {
        // Set up main game canvas
        this.gameContext.imageSmoothingEnabled = false;
        this.gameContext.textAlign = 'center';
        this.gameContext.textBaseline = 'middle';
        
        // Set up next piece canvas
        this.nextPieceContext.imageSmoothingEnabled = false;
        this.nextPieceContext.textAlign = 'center';
        this.nextPieceContext.textBaseline = 'middle';
    }
    
    /**
     * Clear the main game canvas
     */
    clearGameCanvas() {
        this.gameContext.fillStyle = this.BACKGROUND_COLOR;
        this.gameContext.fillRect(0, 0, this.config.CANVAS_WIDTH, this.config.CANVAS_HEIGHT);
    }
    
    /**
     * Clear the next piece canvas
     */
    clearNextPieceCanvas() {
        this.nextPieceContext.fillStyle = this.BACKGROUND_COLOR;
        this.nextPieceContext.fillRect(0, 0, this.config.NEXT_CANVAS_SIZE, this.config.NEXT_CANVAS_SIZE);
    }
    
    /**
     * Draw the enhanced game board grid with visual improvements
     */
    drawBoard() {
        this.clearGameCanvas();
        
        // Draw subtle background pattern
        this.drawBackgroundPattern();
        
        // Draw main grid lines
        this.gameContext.strokeStyle = this.GRID_COLOR;
        this.gameContext.lineWidth = 1;
        
        // Draw vertical grid lines with alternating emphasis
        for (let x = 0; x <= this.config.BOARD_WIDTH; x++) {
            const xPos = x * this.config.BLOCK_SIZE;
            
            // Emphasize center line and quarter lines
            if (x === 5 || x === 0 || x === this.config.BOARD_WIDTH) {
                this.gameContext.strokeStyle = this.GRID_HIGHLIGHT_COLOR;
                this.gameContext.lineWidth = 2;
            } else {
                this.gameContext.strokeStyle = this.GRID_COLOR;
                this.gameContext.lineWidth = 1;
            }
            
            this.gameContext.beginPath();
            this.gameContext.moveTo(xPos, 0);
            this.gameContext.lineTo(xPos, this.config.CANVAS_HEIGHT);
            this.gameContext.stroke();
        }
        
        // Draw horizontal grid lines with emphasis on danger zone
        for (let y = 0; y <= this.config.BOARD_HEIGHT; y++) {
            const yPos = y * this.config.BLOCK_SIZE;
            
            // Emphasize danger zone (top 4 rows) and bottom
            if (y <= 4 || y === this.config.BOARD_HEIGHT) {
                this.gameContext.strokeStyle = this.GRID_HIGHLIGHT_COLOR;
                this.gameContext.lineWidth = y <= 2 ? 2 : 1;
            } else {
                this.gameContext.strokeStyle = this.GRID_COLOR;
                this.gameContext.lineWidth = 1;
            }
            
            this.gameContext.beginPath();
            this.gameContext.moveTo(0, yPos);
            this.gameContext.lineTo(this.config.CANVAS_WIDTH, yPos);
            this.gameContext.stroke();
        }
        
        // Draw outer border with enhanced visual effect
        this.gameContext.strokeStyle = this.BORDER_COLOR;
        this.gameContext.lineWidth = 3;
        this.gameContext.strokeRect(0, 0, this.config.CANVAS_WIDTH, this.config.CANVAS_HEIGHT);
        
        // Add inner highlight border
        this.gameContext.strokeStyle = this.lightenColor(this.BORDER_COLOR, 0.2);
        this.gameContext.lineWidth = 1;
        this.gameContext.strokeRect(2, 2, this.config.CANVAS_WIDTH - 4, this.config.CANVAS_HEIGHT - 4);
    }
    
    /**
     * Draw subtle background pattern for visual depth
     */
    drawBackgroundPattern() {
        // Create a subtle checkerboard pattern with gradient
        for (let y = 0; y < this.config.BOARD_HEIGHT; y++) {
            for (let x = 0; x < this.config.BOARD_WIDTH; x++) {
                if ((x + y) % 2 === 0) {
                    const pixelX = x * this.config.BLOCK_SIZE;
                    const pixelY = y * this.config.BLOCK_SIZE;
                    
                    // Create subtle gradient for depth
                    const gradient = this.gameContext.createLinearGradient(
                        pixelX, pixelY, pixelX + this.config.BLOCK_SIZE, pixelY + this.config.BLOCK_SIZE
                    );
                    gradient.addColorStop(0, '#0F0F0F');
                    gradient.addColorStop(1, '#050505');
                    
                    this.gameContext.fillStyle = gradient;
                    this.gameContext.fillRect(pixelX, pixelY, this.config.BLOCK_SIZE, this.config.BLOCK_SIZE);
                }
            }
        }
        
        // Add danger zone indicator (top 4 rows)
        this.gameContext.fillStyle = 'rgba(255, 0, 0, 0.05)';
        this.gameContext.fillRect(0, 0, this.config.CANVAS_WIDTH, 4 * this.config.BLOCK_SIZE);
    }
    
    /**
     * Draw the board with placed pieces and line clear animations
     * @param {Array} board - 2D array representing the game board state
     */
    drawBoardWithPieces(board) {
        this.drawBoard();
        
        // Draw placed pieces on the board
        for (let y = 0; y < this.config.BOARD_HEIGHT; y++) {
            for (let x = 0; x < this.config.BOARD_WIDTH; x++) {
                if (board[y] && board[y][x]) {
                    const boardCell = board[y][x];
                    
                    // Handle both old format (just color string) and new format (object with type and color)
                    let color, pieceType;
                    if (typeof boardCell === 'string') {
                        // Old format: just color string
                        color = boardCell;
                        // Determine piece type from color
                        for (const [type, typeColor] of Object.entries(TETROMINO_COLORS)) {
                            if (typeColor === color) {
                                pieceType = type;
                                break;
                            }
                        }
                    } else {
                        // New format: object with type and color
                        color = boardCell.color;
                        pieceType = boardCell.type;
                    }
                    
                    // Apply line clear animation effect if active
                    let alpha = 1.0;
                    if (this.lineClearAnimation.active && this.lineClearAnimation.rows.includes(y)) {
                        alpha = 1.0 - (this.lineClearAnimation.progress * 0.8);
                    }
                    
                    this.drawBlock(x, y, color, pieceType, alpha);
                }
            }
        }
        
        // Draw line clear animation effects
        if (this.lineClearAnimation.active) {
            this.drawLineClearEffect();
        }
    }
    
    /**
     * Draw enhanced line clear animation effects
     */
    drawLineClearEffect() {
        if (!this.lineClearAnimation.active) return;
        
        const progress = this.lineClearAnimation.progress;
        
        // Multi-stage animation effect
        this.gameContext.save();
        
        for (const row of this.lineClearAnimation.rows) {
            const y = row * this.config.BLOCK_SIZE;
            
            if (progress < 0.3) {
                // Stage 1: Bright flash
                this.gameContext.globalAlpha = 0.8 * (1 - progress / 0.3);
                this.gameContext.fillStyle = '#FFFFFF';
                this.gameContext.fillRect(0, y, this.config.CANVAS_WIDTH, this.config.BLOCK_SIZE);
            } else if (progress < 0.6) {
                // Stage 2: Color flash
                const stageProgress = (progress - 0.3) / 0.3;
                this.gameContext.globalAlpha = 0.6 * (1 - stageProgress);
                this.gameContext.fillStyle = '#FFD700';
                this.gameContext.fillRect(0, y, this.config.CANVAS_WIDTH, this.config.BLOCK_SIZE);
            } else {
                // Stage 3: Fade out with particles effect
                const stageProgress = (progress - 0.6) / 0.4;
                this.gameContext.globalAlpha = 0.3 * (1 - stageProgress);
                
                // Create particle-like effect
                for (let x = 0; x < this.config.CANVAS_WIDTH; x += 10) {
                    const particleAlpha = Math.random() * 0.5;
                    this.gameContext.globalAlpha = particleAlpha * (1 - stageProgress);
                    this.gameContext.fillStyle = '#00FFFF';
                    this.gameContext.fillRect(x, y + Math.random() * this.config.BLOCK_SIZE, 
                                            5, 5);
                }
            }
        }
        
        this.gameContext.restore();
    }
    
    /**
     * Draw an enhanced tetromino block with 3D effects and better visual appeal
     * @param {number} x - X coordinate in grid units
     * @param {number} y - Y coordinate in grid units
     * @param {string} color - Color of the block
     * @param {string} pieceType - Type of tetromino piece for color variants
     * @param {number} alpha - Alpha transparency (optional, default 1.0)
     * @param {boolean} isGhost - Whether this is a ghost piece
     */
    drawBlock(x, y, color, pieceType = null, alpha = 1.0, isGhost = false) {
        const pixelX = x * this.config.BLOCK_SIZE;
        const pixelY = y * this.config.BLOCK_SIZE;
        const blockSize = this.config.BLOCK_SIZE;
        
        // Save current context state
        this.gameContext.save();
        
        // Set alpha if specified
        if (alpha < 1.0) {
            this.gameContext.globalAlpha = alpha;
        }
        
        if (isGhost) {
            // Draw ghost piece with outline only
            this.gameContext.strokeStyle = color;
            this.gameContext.lineWidth = 2;
            this.gameContext.setLineDash([4, 4]);
            this.gameContext.strokeRect(pixelX + 2, pixelY + 2, blockSize - 4, blockSize - 4);
            this.gameContext.setLineDash([]);
        } else {
            // Draw main block with gradient effect
            const gradient = this.gameContext.createLinearGradient(
                pixelX, pixelY, pixelX + blockSize, pixelY + blockSize
            );
            
            // Use color variants if piece type is provided
            const lightColor = pieceType && TETROMINO_LIGHT_COLORS[pieceType] 
                ? TETROMINO_LIGHT_COLORS[pieceType] 
                : this.lightenColor(color, 0.4);
            const darkColor = pieceType && TETROMINO_DARK_COLORS[pieceType] 
                ? TETROMINO_DARK_COLORS[pieceType] 
                : this.darkenColor(color, 0.3);
            
            gradient.addColorStop(0, lightColor);
            gradient.addColorStop(0.3, color);
            gradient.addColorStop(1, darkColor);
            
            // Fill the main block
            this.gameContext.fillStyle = gradient;
            this.gameContext.fillRect(pixelX, pixelY, blockSize, blockSize);
            
            // Add 3D bevel effect
            this.draw3DBevel(pixelX, pixelY, blockSize, lightColor, darkColor);
            
            // Draw outer border
            this.gameContext.strokeStyle = this.BLOCK_BORDER_COLOR;
            this.gameContext.lineWidth = 1;
            this.gameContext.strokeRect(pixelX, pixelY, blockSize, blockSize);
        }
        
        // Restore context state
        this.gameContext.restore();
    }
    
    /**
     * Draw 3D bevel effect for blocks
     * @param {number} x - X position in pixels
     * @param {number} y - Y position in pixels
     * @param {number} size - Block size
     * @param {string} lightColor - Light color for highlights
     * @param {string} darkColor - Dark color for shadows
     */
    draw3DBevel(x, y, size, lightColor, darkColor) {
        const bevelSize = 3;
        
        // Top and left highlights
        this.gameContext.fillStyle = lightColor;
        this.gameContext.fillRect(x, y, size, bevelSize); // Top
        this.gameContext.fillRect(x, y, bevelSize, size); // Left
        
        // Bottom and right shadows
        this.gameContext.fillStyle = darkColor;
        this.gameContext.fillRect(x, y + size - bevelSize, size, bevelSize); // Bottom
        this.gameContext.fillRect(x + size - bevelSize, y, bevelSize, size); // Right
    }
    
    /**
     * Draw a tetromino piece at the specified position with enhanced visuals
     * @param {Object} piece - Tetromino piece object with type, rotation, x, y
     * @param {number} alpha - Alpha transparency (optional, default 1.0)
     * @param {boolean} isGhost - Whether this is a ghost piece
     */
    drawPiece(piece, alpha = 1.0, isGhost = false) {
        if (!piece || !piece.type) return;
        
        const shape = TETROMINO_SHAPES[piece.type][piece.rotation];
        const color = TETROMINO_COLORS[piece.type];
        
        // Draw each block of the piece
        for (let row = 0; row < 4; row++) {
            for (let col = 0; col < 4; col++) {
                if (shape[row][col]) {
                    const x = piece.x + col;
                    const y = piece.y + row;
                    
                    // Only draw blocks that are within the visible game area
                    if (x >= 0 && x < this.config.BOARD_WIDTH && y >= 0 && y < this.config.BOARD_HEIGHT) {
                        this.drawBlock(x, y, color, piece.type, alpha, isGhost);
                    }
                }
            }
        }
    }
    
    /**
     * Draw a ghost piece (preview of where the current piece will land)
     * @param {Object} piece - Current tetromino piece
     * @param {Array} board - Game board state for collision detection
     */
    drawGhostPiece(piece, board) {
        if (!piece) return;
        
        // Create a copy of the piece and drop it to the bottom
        const ghostPiece = { ...piece };
        
        // Find the lowest valid position
        while (this.isValidPosition(ghostPiece, board)) {
            ghostPiece.y++;
        }
        ghostPiece.y--; // Move back to last valid position
        
        // Only draw ghost piece if it's different from current position
        if (ghostPiece.y !== piece.y) {
            this.drawPiece(ghostPiece, this.GHOST_PIECE_ALPHA, true);
        }
    }
    
    /**
     * Draw the next piece in the preview canvas with enhanced visuals
     * @param {Object} nextPiece - Next tetromino piece to display
     */
    drawNextPiece(nextPiece) {
        this.clearNextPieceCanvas();
        
        if (!nextPiece || !nextPiece.type) return;
        
        const shape = TETROMINO_SHAPES[nextPiece.type][0]; // Always show rotation 0
        const color = TETROMINO_COLORS[nextPiece.type];
        const blockSize = 20; // Smaller blocks for preview
        
        // Calculate centering offset
        const pieceWidth = 4 * blockSize;
        const pieceHeight = 4 * blockSize;
        const offsetX = (this.config.NEXT_CANVAS_SIZE - pieceWidth) / 2;
        const offsetY = (this.config.NEXT_CANVAS_SIZE - pieceHeight) / 2;
        
        // Draw each block of the next piece with enhanced visuals
        for (let row = 0; row < 4; row++) {
            for (let col = 0; col < 4; col++) {
                if (shape[row][col]) {
                    const x = offsetX + col * blockSize;
                    const y = offsetY + row * blockSize;
                    
                    // Create gradient for the block
                    const gradient = this.nextPieceContext.createLinearGradient(
                        x, y, x + blockSize, y + blockSize
                    );
                    
                    const lightColor = TETROMINO_LIGHT_COLORS[nextPiece.type] || this.lightenColor(color, 0.4);
                    const darkColor = TETROMINO_DARK_COLORS[nextPiece.type] || this.darkenColor(color, 0.3);
                    
                    gradient.addColorStop(0, lightColor);
                    gradient.addColorStop(0.3, color);
                    gradient.addColorStop(1, darkColor);
                    
                    // Draw the block with gradient
                    this.nextPieceContext.fillStyle = gradient;
                    this.nextPieceContext.fillRect(x, y, blockSize, blockSize);
                    
                    // Add 3D bevel effect (smaller for preview)
                    const bevelSize = 2;
                    
                    // Top and left highlights
                    this.nextPieceContext.fillStyle = lightColor;
                    this.nextPieceContext.fillRect(x, y, blockSize, bevelSize); // Top
                    this.nextPieceContext.fillRect(x, y, bevelSize, blockSize); // Left
                    
                    // Bottom and right shadows
                    this.nextPieceContext.fillStyle = darkColor;
                    this.nextPieceContext.fillRect(x, y + blockSize - bevelSize, blockSize, bevelSize); // Bottom
                    this.nextPieceContext.fillRect(x + blockSize - bevelSize, y, bevelSize, blockSize); // Right
                    
                    // Draw outer border
                    this.nextPieceContext.strokeStyle = this.BLOCK_BORDER_COLOR;
                    this.nextPieceContext.lineWidth = 1;
                    this.nextPieceContext.strokeRect(x, y, blockSize, blockSize);
                }
            }
        }
        
        // Trigger next piece change animation
        this.animateNextPieceChange();
    }
    
    /**
     * Animate next piece change with subtle visual feedback
     */
    animateNextPieceChange() {
        const canvas = document.getElementById('nextPieceCanvas');
        if (canvas) {
            canvas.style.transform = 'scale(1.05)';
            canvas.style.boxShadow = 'inset 0 0 10px rgba(0, 0, 0, 0.5), 0 2px 8px rgba(0, 255, 255, 0.3)';
            
            setTimeout(() => {
                canvas.style.transform = 'scale(1.0)';
                canvas.style.boxShadow = 'inset 0 0 10px rgba(0, 0, 0, 0.5), 0 2px 4px rgba(0, 0, 0, 0.3)';
            }, 200);
        }
    }
    
    /**
     * Update the UI display elements with enhanced formatting and animations
     * @param {Object} gameState - Current game state with score, level, lines
     */
    drawUI(gameState) {
        if (this.scoreElement) {
            // Format score with commas and add animation for score increases
            const formattedScore = gameState.score.toLocaleString();
            if (this.scoreElement.textContent !== formattedScore) {
                this.scoreElement.textContent = formattedScore;
                this.animateScoreIncrease();
                
                // Add glow effect for high scores
                if (gameState.score >= 50000) {
                    this.scoreElement.style.animation = 'scoreGlow 2s infinite';
                } else {
                    this.scoreElement.style.animation = 'none';
                }
            }
        }
        
        if (this.levelElement) {
            const levelText = gameState.level.toString();
            if (this.levelElement.textContent !== levelText) {
                this.levelElement.textContent = levelText;
                this.animateLevelUp();
            }
        }
        
        if (this.linesElement) {
            // Show progress towards next level
            const linesText = gameState.linesCleared.toString();
            const nextLevelLines = gameState.level * 10;
            const progressText = `${linesText} / ${nextLevelLines}`;
            
            if (this.linesElement.textContent !== progressText) {
                this.linesElement.textContent = progressText;
                this.animateLinesUpdate();
            }
        }
        
        // Update level up animation
        if (this.levelUpAnimation.active) {
            this.updateLevelUpAnimation();
        }
    }
    
    /**
     * Animate score increase with visual feedback
     */
    animateScoreIncrease() {
        if (this.scoreElement) {
            this.scoreElement.style.transform = 'scale(1.1)';
            this.scoreElement.style.color = '#FFD700';
            this.scoreElement.style.textShadow = '0 0 8px #FFD700';
            
            setTimeout(() => {
                this.scoreElement.style.transform = 'scale(1.0)';
                this.scoreElement.style.color = '#fff';
                this.scoreElement.style.textShadow = '0 2px 4px rgba(0, 0, 0, 0.5)';
            }, 300);
        }
    }
    
    /**
     * Animate level up with visual feedback
     */
    animateLevelUp() {
        if (this.levelElement) {
            this.levelElement.style.transform = 'scale(1.2)';
            this.levelElement.style.color = '#00FF00';
            this.levelElement.style.textShadow = '0 0 15px #00FF00';
            
            // Start level up animation
            this.levelUpAnimation.active = true;
            this.levelUpAnimation.progress = 0;
            
            setTimeout(() => {
                this.levelElement.style.transform = 'scale(1.0)';
                this.levelElement.style.color = '#00BFFF';
                this.levelElement.style.textShadow = '0 2px 4px rgba(0, 0, 0, 0.5)';
            }, 500);
        }
    }
    
    /**
     * Animate lines update with visual feedback
     */
    animateLinesUpdate() {
        if (this.linesElement) {
            this.linesElement.style.color = '#90EE90';
            this.linesElement.style.textShadow = '0 0 5px #32CD32';
            
            setTimeout(() => {
                this.linesElement.style.color = '#32CD32';
                this.linesElement.style.textShadow = '0 2px 4px rgba(0, 0, 0, 0.5)';
            }, 200);
        }
    }
    
    /**
     * Update level up animation progress
     */
    updateLevelUpAnimation() {
        this.levelUpAnimation.progress += 16 / this.levelUpAnimation.duration; // Assuming 60 FPS
        
        if (this.levelUpAnimation.progress >= 1.0) {
            this.levelUpAnimation.active = false;
            this.levelUpAnimation.progress = 0;
        }
    }
    
    /**
     * Show the pause overlay
     */
    showPauseOverlay() {
        if (this.pauseOverlay) {
            this.pauseOverlay.classList.remove('hidden');
        }
    }
    
    /**
     * Hide the pause overlay
     */
    hidePauseOverlay() {
        if (this.pauseOverlay) {
            this.pauseOverlay.classList.add('hidden');
        }
    }
    
    /**
     * Show the game over overlay
     */
    showGameOverOverlay() {
        if (this.gameOverOverlay) {
            this.gameOverOverlay.classList.remove('hidden');
        }
    }
    
    /**
     * Hide the game over overlay
     */
    hideGameOverOverlay() {
        if (this.gameOverOverlay) {
            this.gameOverOverlay.classList.add('hidden');
        }
    }
    
    /**
     * Render the complete game state with enhanced visuals and animations
     * @param {Object} gameState - Complete game state object
     */
    render(gameState) {
        // Update animations
        this.updateLineClearAnimation();
        
        // Draw the board with placed pieces
        this.drawBoardWithPieces(gameState.board || []);
        
        // Draw ghost piece if current piece exists
        if (gameState.currentPiece && gameState.showGhost !== false) {
            this.drawGhostPiece(gameState.currentPiece, gameState.board || []);
        }
        
        // Draw current piece
        if (gameState.currentPiece) {
            this.drawPiece(gameState.currentPiece);
        }
        
        // Draw next piece
        if (gameState.nextPiece) {
            this.drawNextPiece(gameState.nextPiece);
        }
        
        // Update UI elements
        this.drawUI(gameState);
        
        // Handle overlays based on game status
        if (gameState.status === 'paused') {
            this.showPauseOverlay();
        } else {
            this.hidePauseOverlay();
        }
        
        if (gameState.status === 'gameOver') {
            this.showGameOverOverlay();
        } else {
            this.hideGameOverOverlay();
        }
    }
    
    /**
     * Helper method to check if a piece position is valid (used for ghost piece)
     * This is a simplified version - full collision detection will be in BoardManager
     * @param {Object} piece - Tetromino piece to check
     * @param {Array} board - Game board state
     * @returns {boolean} True if position is valid
     */
    isValidPosition(piece, board) {
        if (!piece || !piece.type) return false;
        
        const shape = TETROMINO_SHAPES[piece.type][piece.rotation];
        
        for (let row = 0; row < 4; row++) {
            for (let col = 0; col < 4; col++) {
                if (shape[row][col]) {
                    const x = piece.x + col;
                    const y = piece.y + row;
                    
                    // Check boundaries
                    if (x < 0 || x >= this.config.BOARD_WIDTH || y >= this.config.BOARD_HEIGHT) {
                        return false;
                    }
                    
                    // Check collision with placed pieces (only if y >= 0)
                    if (y >= 0 && board[y] && board[y][x]) {
                        return false;
                    }
                }
            }
        }
        
        return true;
    }
    
    /**
     * Start line clear animation
     * @param {Array} clearedRows - Array of row indices that were cleared
     */
    startLineClearAnimation(clearedRows) {
        this.lineClearAnimation.active = true;
        this.lineClearAnimation.rows = [...clearedRows];
        this.lineClearAnimation.progress = 0;
    }
    
    /**
     * Update line clear animation progress
     */
    updateLineClearAnimation() {
        if (!this.lineClearAnimation.active) return;
        
        this.lineClearAnimation.progress += 16 / this.lineClearAnimation.duration; // Assuming 60 FPS
        
        if (this.lineClearAnimation.progress >= 1.0) {
            this.lineClearAnimation.active = false;
            this.lineClearAnimation.progress = 0;
            this.lineClearAnimation.rows = [];
        }
    }
    
    /**
     * Utility method to lighten a color for highlight effects
     * @param {string} color - Hex color string
     * @param {number} factor - Lightening factor (0-1)
     * @returns {string} Lightened color
     */
    lightenColor(color, factor) {
        // Handle null/undefined colors
        if (!color || typeof color !== 'string') {
            return '#FFFFFF'; // Default to white
        }
        
        // Convert hex to RGB
        const hex = color.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        
        // Lighten each component
        const newR = Math.min(255, Math.floor(r + (255 - r) * factor));
        const newG = Math.min(255, Math.floor(g + (255 - g) * factor));
        const newB = Math.min(255, Math.floor(b + (255 - b) * factor));
        
        // Convert back to hex
        return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
    }
    
    /**
     * Utility method to darken a color for shadow effects
     * @param {string} color - Hex color string
     * @param {number} factor - Darkening factor (0-1)
     * @returns {string} Darkened color
     */
    darkenColor(color, factor) {
        // Handle null/undefined colors
        if (!color || typeof color !== 'string') {
            return '#000000'; // Default to black
        }
        
        // Convert hex to RGB
        const hex = color.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        
        // Darken each component
        const newR = Math.max(0, Math.floor(r * (1 - factor)));
        const newG = Math.max(0, Math.floor(g * (1 - factor)));
        const newB = Math.max(0, Math.floor(b * (1 - factor)));
        
        // Convert back to hex
        return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
    }
}