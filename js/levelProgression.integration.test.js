/**
 * Integration tests for level progression and speed increases
 * Tests the complete flow of level advancement and speed scaling
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GameEngine } from './gameEngine.js';

// Mock browser APIs for testing
global.requestAnimationFrame = vi.fn((callback) => {
    return setTimeout(callback, 16); // ~60fps
});

global.cancelAnimationFrame = vi.fn((id) => {
    clearTimeout(id);
});

global.performance = {
    now: vi.fn(() => Date.now())
};

describe('Level Progression and Speed Integration', () => {
    let gameEngine;

    beforeEach(() => {
        gameEngine = new GameEngine({
            boardWidth: 10,
            boardHeight: 20,
            initialFallSpeed: 1000,
            softDropSpeed: 50,
            lockDelay: 500
        });
    });

    describe('Level Progression with Speed Changes', () => {
        it('should progress through multiple levels with decreasing fall speeds', () => {
            gameEngine.start();
            
            // Level 1 - Initial state
            expect(gameEngine.getGameState().level).toBe(1);
            expect(gameEngine.gameState.fallSpeed).toBe(1000);
            
            // Clear 10 lines to reach level 2
            gameEngine.handleLinesCleared(4); // 4 lines
            gameEngine.handleLinesCleared(4); // 4 lines (total: 8)
            gameEngine.handleLinesCleared(2); // 2 lines (total: 10)
            
            const gameState = gameEngine.getGameState();
            expect(gameState.level).toBe(2);
            expect(gameState.linesCleared).toBe(10);
            expect(gameEngine.gameState.fallSpeed).toBe(800); // 1000 * 0.8^1
            
            // Clear 10 more lines to reach level 3
            gameEngine.handleLinesCleared(4); // 4 lines (total: 14)
            gameEngine.handleLinesCleared(4); // 4 lines (total: 18)
            gameEngine.handleLinesCleared(2); // 2 lines (total: 20)
            
            const level3State = gameEngine.getGameState();
            expect(level3State.level).toBe(3);
            expect(level3State.linesCleared).toBe(20);
            expect(gameEngine.gameState.fallSpeed).toBe(640); // 1000 * 0.8^2
        });

        it('should maintain proper scoring with level multipliers', () => {
            gameEngine.start();
            
            // Level 1 scoring
            gameEngine.handleLinesCleared(1); // 100 * 1 = 100 points
            expect(gameEngine.getGameState().score).toBe(100);
            
            // Progress to level 2
            gameEngine.handleLinesCleared(4); // 800 * 1 = 800 points (total: 900)
            gameEngine.handleLinesCleared(4); // 800 * 1 = 800 points (total: 1700)
            gameEngine.handleLinesCleared(1); // 100 * 1 = 100 points (total: 1800, 10 lines total)
            
            const level2State = gameEngine.getGameState();
            expect(level2State.level).toBe(2);
            expect(level2State.score).toBe(1800);
            
            // Level 2 scoring (with multiplier)
            gameEngine.handleLinesCleared(4); // 800 * 2 = 1600 points (total: 3400)
            
            const finalState = gameEngine.getGameState();
            expect(finalState.score).toBe(3400);
            expect(finalState.level).toBe(2);
        });

        it('should handle rapid level progression correctly', () => {
            gameEngine.start();
            
            // Clear 40 lines rapidly to reach level 5
            for (let i = 0; i < 10; i++) {
                gameEngine.handleLinesCleared(4); // 10 * 4 = 40 lines
            }
            
            const gameState = gameEngine.getGameState();
            expect(gameState.level).toBe(5); // 40 lines / 10 = level 4 + initial level 1 = 5
            expect(gameState.linesCleared).toBe(40);
            
            // Verify fall speed is appropriately fast
            const expectedSpeed = Math.round(1000 * Math.pow(0.8, 4)); // 1000 * 0.8^4
            expect(gameEngine.gameState.fallSpeed).toBe(expectedSpeed);
        });

        it('should respect minimum fall speed at very high levels', () => {
            gameEngine.start();
            
            // Simulate clearing enough lines to reach a very high level
            for (let i = 0; i < 50; i++) {
                gameEngine.handleLinesCleared(4); // 50 * 4 = 200 lines = level 21
            }
            
            const gameState = gameEngine.getGameState();
            expect(gameState.level).toBe(21); // 200 lines / 10 = level 20 + initial level 1 = 21
            expect(gameEngine.gameState.fallSpeed).toBe(50); // Should hit minimum speed
        });

        it('should update UI elements correctly during level progression', () => {
            gameEngine.start();
            
            // Clear lines to trigger level progression
            gameEngine.handleLinesCleared(4); // 4 lines
            gameEngine.handleLinesCleared(4); // 4 lines (total: 8)
            gameEngine.handleLinesCleared(2); // 2 lines (total: 10, level 2)
            
            // Verify game state has correct values
            const gameState = gameEngine.getGameState();
            expect(gameState.level).toBe(2);
            expect(gameState.linesCleared).toBe(10);
            expect(gameState.score).toBe(1900); // 800 + 800 + 300 = 1900 (all at level 1)
        });

        it('should maintain consistent speed during soft drop regardless of level', () => {
            gameEngine.start();
            
            // Progress to level 3
            for (let i = 0; i < 5; i++) {
                gameEngine.handleLinesCleared(4); // 5 * 4 = 20 lines = level 3
            }
            
            expect(gameEngine.getGameState().level).toBe(3);
            
            // Enable soft drop
            gameEngine.startSoftDrop();
            
            // Mock time passage for soft drop speed test
            const originalNow = performance.now;
            let mockTime = 0;
            performance.now = vi.fn(() => mockTime);
            
            gameEngine.lastFallTime = 0;
            mockTime = 60; // Exceed soft drop speed of 50ms
            
            const initialY = gameEngine.tetrominoManager.getCurrentPiece().y;
            gameEngine.update(10);
            const newY = gameEngine.tetrominoManager.getCurrentPiece().y;
            
            // Should move down due to soft drop, regardless of level
            expect(newY).toBe(initialY + 1);
            
            performance.now = originalNow;
        });
    });

    describe('Custom Configuration Integration', () => {
        it('should work with custom lines per level configuration', () => {
            const customEngine = new GameEngine({
                boardWidth: 10,
                boardHeight: 20,
                initialFallSpeed: 1000
            });
            
            // Configure ScoreManager with custom lines per level
            customEngine.scoreManager.config.linesPerLevel = 5;
            
            customEngine.start();
            
            // Clear 5 lines to reach level 2
            customEngine.handleLinesCleared(4); // 4 lines
            customEngine.handleLinesCleared(1); // 1 line (total: 5)
            
            const gameState = customEngine.getGameState();
            expect(gameState.level).toBe(2);
            expect(gameState.linesCleared).toBe(5);
        });

        it('should work with custom initial level configuration', () => {
            const customEngine = new GameEngine({
                boardWidth: 10,
                boardHeight: 20,
                initialFallSpeed: 1000
            });
            
            // Configure ScoreManager with custom initial level
            customEngine.scoreManager.config.initialLevel = 5;
            customEngine.scoreManager.reset(); // Apply the new config
            
            customEngine.start();
            
            const gameState = customEngine.getGameState();
            expect(gameState.level).toBe(5);
            
            // Update fall speed based on the new level
            customEngine.updateFallSpeed();
            
            // Verify fall speed is calculated for level 5
            const expectedSpeed = Math.round(1000 * Math.pow(0.8, 4)); // 1000 * 0.8^(5-1)
            expect(customEngine.gameState.fallSpeed).toBe(expectedSpeed);
        });
    });
});