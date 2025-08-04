/**
 * Tests for GameEngine game over detection and handling
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GameEngine } from './gameEngine.js';

describe('GameEngine - Game Over Detection and Handling', () => {
    let gameEngine;
    let mockCallbacks;

    beforeEach(() => {
        // Create game engine with test configuration
        gameEngine = new GameEngine({
            boardWidth: 10,
            boardHeight: 20,
            initialFallSpeed: 1000,
            lockDelay: 500
        });

        // Set up mock callbacks
        mockCallbacks = {
            onGameStateChange: vi.fn(),
            onGameOver: vi.fn(),
            onScoreChange: vi.fn(),
            onLinesCleared: vi.fn()
        };

        gameEngine.onGameStateChange = mockCallbacks.onGameStateChange;
        gameEngine.onGameOver = mockCallbacks.onGameOver;
        gameEngine.onScoreChange = mockCallbacks.onScoreChange;
        gameEngine.onLinesCleared = mockCallbacks.onLinesCleared;
    });

    describe('Game Over Detection', () => {
        it('should detect game over when spawn area is blocked', () => {
            // Fill the top rows to block spawn area
            const board = gameEngine.getBoardManager().getBoard();
            for (let col = 0; col < 10; col++) {
                board[0][col] = { type: 'I', color: '#00FFFF' };
            }

            // Check game over condition
            expect(gameEngine.checkGameOverConditions()).toBe(true);
        });

        it('should detect game over when piece cannot spawn', () => {
            // Start the game first
            gameEngine.start();
            
            // Now fill the board to simulate a game over condition
            const board = gameEngine.getBoardManager().getBoard();
            for (let row = 0; row < 2; row++) {
                for (let col = 0; col < 10; col++) {
                    board[row][col] = { type: 'I', color: '#00FFFF' };
                }
            }

            // Clear the current piece to force a new spawn attempt
            gameEngine.getTetrominoManager().currentPiece = null;

            // Update the game - should detect game over when trying to spawn
            gameEngine.update(16);

            // Should be in game over state
            const gameState = gameEngine.getGameState();
            expect(gameState.status).toBe('gameOver');
            expect(mockCallbacks.onGameOver).toHaveBeenCalled();
        });

        it('should not detect game over with empty spawn area', () => {
            // Board should be empty by default
            expect(gameEngine.checkGameOverConditions()).toBe(false);
        });

        it('should detect game over when blocks reach second row', () => {
            // Fill second row to test comprehensive game over detection
            const board = gameEngine.getBoardManager().getBoard();
            for (let col = 0; col < 10; col++) {
                board[1][col] = { type: 'I', color: '#00FFFF' };
            }

            expect(gameEngine.checkGameOverConditions()).toBe(true);
        });
    });

    describe('Game Over State Management', () => {
        it('should properly transition to game over state', () => {
            gameEngine.start();
            
            // Manually trigger game over
            gameEngine.gameOver();

            const gameState = gameEngine.getGameState();
            expect(gameState.status).toBe('gameOver');
            expect(gameEngine.isRunning).toBe(false);
        });

        it('should stop game loop when game over occurs', () => {
            gameEngine.start();
            expect(gameEngine.isRunning).toBe(true);

            gameEngine.gameOver();
            expect(gameEngine.isRunning).toBe(false);
        });

        it('should clear timers when game over occurs', () => {
            gameEngine.start();
            
            // Set some timer states
            gameEngine.isLockDelayActive = true;
            gameEngine.lockTimer = 100;
            gameEngine.isSoftDropping = true;

            gameEngine.gameOver();

            expect(gameEngine.isLockDelayActive).toBe(false);
            expect(gameEngine.lockTimer).toBe(0);
            expect(gameEngine.isSoftDropping).toBe(false);
        });

        it('should not trigger game over multiple times', () => {
            gameEngine.start();
            
            // Call game over multiple times
            gameEngine.gameOver();
            gameEngine.gameOver();
            gameEngine.gameOver();

            // Should only be called once
            expect(mockCallbacks.onGameOver).toHaveBeenCalledTimes(1);
        });

        it('should notify callbacks when game over occurs', () => {
            gameEngine.start();
            gameEngine.gameOver();

            expect(mockCallbacks.onGameStateChange).toHaveBeenCalled();
            expect(mockCallbacks.onGameOver).toHaveBeenCalled();
        });
    });

    describe('Game Restart Functionality', () => {
        it('should restart game from game over state', () => {
            // Start and trigger game over
            gameEngine.start();
            gameEngine.gameOver();
            expect(gameEngine.getGameState().status).toBe('gameOver');

            // Restart the game
            gameEngine.restart();

            const gameState = gameEngine.getGameState();
            expect(gameState.status).toBe('playing');
            expect(gameState.score).toBe(0);
            expect(gameState.level).toBe(1);
            expect(gameState.linesCleared).toBe(0);
        });

        it('should reset board when restarting', () => {
            gameEngine.start();
            
            // Add some blocks to the board
            const board = gameEngine.getBoardManager().getBoard();
            board[19][0] = { type: 'I', color: '#00FFFF' };
            board[19][1] = { type: 'I', color: '#00FFFF' };

            gameEngine.restart();

            // Board should be empty
            const newBoard = gameEngine.getBoardManager().getBoard();
            for (let row = 0; row < 20; row++) {
                for (let col = 0; col < 10; col++) {
                    expect(newBoard[row][col]).toBe(null);
                }
            }
        });

        it('should reset score and statistics when restarting', () => {
            gameEngine.start();
            
            // Simulate some score
            const scoreManager = gameEngine.getScoreManager();
            scoreManager.addScore(4); // Add score for 4 lines (Tetris)

            expect(gameEngine.getGameState().score).toBeGreaterThan(0);

            gameEngine.restart();

            const gameState = gameEngine.getGameState();
            expect(gameState.score).toBe(0);
            expect(gameState.level).toBe(1);
            expect(gameState.linesCleared).toBe(0);
        });

        it('should spawn new pieces after restart', () => {
            gameEngine.start();
            gameEngine.gameOver();
            gameEngine.restart();

            const gameState = gameEngine.getGameState();
            expect(gameState.currentPiece).not.toBe(null);
            expect(gameState.nextPiece).not.toBe(null);
        });
    });

    describe('Spawn Collision Detection', () => {
        it('should detect when newly spawned piece collides immediately', () => {
            // Fill the spawn area
            const board = gameEngine.getBoardManager().getBoard();
            // Fill center area where pieces spawn (around x=4, y=0)
            for (let row = 0; row < 2; row++) {
                for (let col = 3; col < 7; col++) {
                    board[row][col] = { type: 'I', color: '#00FFFF' };
                }
            }

            // Try to spawn a piece
            const tetrominoManager = gameEngine.getTetrominoManager();
            const spawnResult = tetrominoManager.spawnPiece();

            expect(spawnResult).toBe(null);
        });

        it('should successfully spawn piece when spawn area is clear', () => {
            // Board should be empty by default
            const tetrominoManager = gameEngine.getTetrominoManager();
            const spawnResult = tetrominoManager.spawnPiece();

            expect(spawnResult).not.toBe(null);
            expect(spawnResult.type).toBeDefined();
            expect(spawnResult.x).toBeDefined();
            expect(spawnResult.y).toBeDefined();
        });

        it('should check spawn collision before placing piece', () => {
            const tetrominoManager = gameEngine.getTetrominoManager();
            
            // First spawn a piece to set up next piece
            tetrominoManager.spawnPiece();
            
            // Should be able to spawn next piece on empty board
            expect(tetrominoManager.canSpawnPiece()).toBe(true);

            // Fill spawn area completely
            const board = gameEngine.getBoardManager().getBoard();
            for (let y = 0; y < 4; y++) {
                for (let x = 0; x < 10; x++) {
                    board[y][x] = { type: 'I', color: '#00FFFF' };
                }
            }

            // Should not be able to spawn now
            expect(tetrominoManager.canSpawnPiece()).toBe(false);
        });
    });

    describe('Game Over During Gameplay', () => {
        it('should trigger game over when piece locks and fills spawn area', () => {
            gameEngine.start();

            // Fill most of the board, leaving only top rows
            const board = gameEngine.getBoardManager().getBoard();
            for (let row = 2; row < 20; row++) {
                for (let col = 0; col < 10; col++) {
                    if (row < 19 || col !== 4) { // Leave some space for current piece
                        board[row][col] = { type: 'I', color: '#00FFFF' };
                    }
                }
            }

            // Fill the top row except for one spot
            for (let col = 0; col < 9; col++) {
                board[1][col] = { type: 'I', color: '#00FFFF' };
            }

            // Manually trigger piece lock that would fill the spawn area
            board[1][9] = { type: 'I', color: '#00FFFF' };

            // Check if game over is detected
            expect(gameEngine.checkGameOverConditions()).toBe(true);
        });

        it('should handle game over during piece falling', () => {
            gameEngine.start();
            
            // Fill the board including the spawn area (top 2 rows)
            const board = gameEngine.getBoardManager().getBoard();
            for (let row = 0; row < 2; row++) {
                for (let col = 0; col < 10; col++) {
                    board[row][col] = { type: 'I', color: '#00FFFF' };
                }
            }

            // Verify game over condition is met
            expect(gameEngine.checkGameOverConditions()).toBe(true);

            // Manually trigger game over check
            if (gameEngine.checkGameOverConditions()) {
                gameEngine.gameOver();
            }

            expect(gameEngine.getGameState().status).toBe('gameOver');
        });
    });

    describe('Edge Cases', () => {
        it('should handle game over when no current piece exists', () => {
            gameEngine.start();
            
            // Clear current piece
            gameEngine.getTetrominoManager().currentPiece = null;
            
            // Fill spawn area
            const board = gameEngine.getBoardManager().getBoard();
            board[0][4] = { type: 'I', color: '#00FFFF' };

            // Should still detect game over
            expect(gameEngine.checkGameOverConditions()).toBe(true);
        });

        it('should handle restart when game is not started', () => {
            // Game is in stopped state
            expect(gameEngine.getGameState().status).toBe('stopped');

            // Should be able to restart
            gameEngine.restart();
            expect(gameEngine.getGameState().status).toBe('playing');
        });

        it('should handle multiple restart calls', () => {
            gameEngine.start();
            gameEngine.gameOver();

            // Multiple restarts should work
            gameEngine.restart();
            expect(gameEngine.getGameState().status).toBe('playing');
            
            gameEngine.restart();
            expect(gameEngine.getGameState().status).toBe('playing');
        });
    });
});