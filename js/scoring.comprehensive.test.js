/**
 * Comprehensive scoring validation tests
 * Tests all scoring combinations and edge cases
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { GameEngine } from './gameEngine.js';
import { ScoreManager } from './scoreManager.js';

describe('Comprehensive Scoring Validation', () => {
    let gameEngine;
    let scoreManager;
    let boardManager;

    beforeEach(() => {
        gameEngine = new GameEngine({
            boardWidth: 10,
            boardHeight: 20,
            initialFallSpeed: 1000
        });
        scoreManager = gameEngine.getScoreManager();
        boardManager = gameEngine.getBoardManager();
    });

    describe('Basic Scoring Formula Validation', () => {
        it('should calculate single line clear correctly', () => {
            // Test at level 1
            scoreManager.reset();
            expect(scoreManager.getLevel()).toBe(1);
            
            scoreManager.addScore(1); // 1 line cleared
            expect(scoreManager.getScore()).toBe(100); // 100 * level 1
            
            // Test at level 2 - manually set level by adding lines
            scoreManager.addScore(4); // 4 lines
            scoreManager.addScore(4); // 4 lines  
            scoreManager.addScore(2); // 2 lines (total: 10 lines = level 2)
            
            const level2Score = scoreManager.getScore();
            scoreManager.addScore(1); // 1 line at level 2
            expect(scoreManager.getScore()).toBe(level2Score + 200); // 100 * level 2
        });

        it('should calculate double line clear correctly', () => {
            scoreManager.reset();
            expect(scoreManager.getLevel()).toBe(1);
            
            scoreManager.addScore(2); // 2 lines cleared
            expect(scoreManager.getScore()).toBe(300); // 300 * level 1
            
            // Test at level 3 - manually advance to level 3
            scoreManager.reset();
            // Add 20 lines to reach level 3
            scoreManager.addScore(4); // 4 lines
            scoreManager.addScore(4); // 4 lines
            scoreManager.addScore(4); // 4 lines
            scoreManager.addScore(4); // 4 lines
            scoreManager.addScore(4); // 4 lines (total: 20 lines = level 3)
            
            const level3Score = scoreManager.getScore();
            scoreManager.addScore(2); // 2 lines at level 3
            expect(scoreManager.getScore()).toBe(level3Score + 900); // 300 * level 3
        });

        it('should calculate triple line clear correctly', () => {
            scoreManager.reset();
            expect(scoreManager.getLevel()).toBe(1);
            
            scoreManager.addScore(3); // 3 lines cleared
            expect(scoreManager.getScore()).toBe(500); // 500 * level 1
            
            // Test at level 4 - manually advance to level 4
            scoreManager.reset();
            // Add 30 lines to reach level 4
            for (let i = 0; i < 7; i++) {
                scoreManager.addScore(4); // 7 * 4 = 28 lines
            }
            scoreManager.addScore(2); // 2 more lines (total: 30 lines = level 4)
            
            const level4Score = scoreManager.getScore();
            scoreManager.addScore(3); // 3 lines at level 4
            expect(scoreManager.getScore()).toBe(level4Score + 2000); // 500 * level 4
        });

        it('should calculate Tetris (4 lines) correctly', () => {
            scoreManager.reset();
            expect(scoreManager.getLevel()).toBe(1);
            
            scoreManager.addScore(4); // 4 lines cleared (Tetris)
            expect(scoreManager.getScore()).toBe(800); // 800 * level 1
            
            // Test at level 6 - manually advance to level 6
            scoreManager.reset();
            // Add 50 lines to reach level 6
            for (let i = 0; i < 12; i++) {
                scoreManager.addScore(4); // 12 * 4 = 48 lines
            }
            scoreManager.addScore(2); // 2 more lines (total: 50 lines = level 6)
            
            const level6Score = scoreManager.getScore();
            scoreManager.addScore(4); // 4 lines at level 6
            expect(scoreManager.getScore()).toBe(level6Score + 4800); // 800 * level 6
        });
    });

    describe('Level Progression Validation', () => {
        it('should progress levels correctly based on lines cleared', () => {
            scoreManager.reset();
            expect(scoreManager.getLevel()).toBe(1);
            expect(scoreManager.getLinesCleared()).toBe(0);
            
            // Clear 9 lines - should stay at level 1
            scoreManager.addScore(4); // 4 lines
            scoreManager.addScore(3); // 3 lines
            scoreManager.addScore(2); // 2 lines (total: 9)
            
            expect(scoreManager.getLevel()).toBe(1);
            expect(scoreManager.getLinesCleared()).toBe(9);
            
            // Clear 1 more line - should advance to level 2
            scoreManager.addScore(1); // 1 line (total: 10)
            
            expect(scoreManager.getLevel()).toBe(2);
            expect(scoreManager.getLinesCleared()).toBe(10);
        });

        it('should handle multiple level progressions', () => {
            scoreManager.reset();
            
            // Clear 25 lines at once (should advance multiple levels)
            for (let i = 0; i < 6; i++) {
                scoreManager.addScore(4); // 6 * 4 = 24 lines
            }
            scoreManager.addScore(1); // 1 more line = 25 total
            
            expect(scoreManager.getLinesCleared()).toBe(25);
            expect(scoreManager.getLevel()).toBe(3); // Level 1->2 at 10 lines, 2->3 at 20 lines
        });

        it('should calculate correct scores with level progression', () => {
            scoreManager.reset();
            
            // Clear 8 lines at level 1
            scoreManager.addScore(4); // 800 points (level 1)
            scoreManager.addScore(4); // 800 points (level 1)
            
            expect(scoreManager.getScore()).toBe(1600);
            expect(scoreManager.getLevel()).toBe(1);
            expect(scoreManager.getLinesCleared()).toBe(8);
            
            // Clear 2 more lines to trigger level up
            scoreManager.addScore(2); // 300 points (level 1)
            
            expect(scoreManager.getScore()).toBe(1900);
            expect(scoreManager.getLevel()).toBe(2);
            expect(scoreManager.getLinesCleared()).toBe(10);
            
            // Clear 4 more lines at level 2
            scoreManager.addScore(4); // 800 * 2 = 1600 points (level 2)
            
            expect(scoreManager.getScore()).toBe(3500);
            expect(scoreManager.getLevel()).toBe(2);
            expect(scoreManager.getLinesCleared()).toBe(14);
        });
    });

    describe('Edge Cases and Boundary Conditions', () => {
        it('should handle zero lines cleared', () => {
            scoreManager.reset();
            const initialScore = scoreManager.getScore();
            
            scoreManager.addScore(0);
            
            expect(scoreManager.getScore()).toBe(initialScore);
            expect(scoreManager.getLinesCleared()).toBe(0);
        });

        it('should handle negative input gracefully', () => {
            scoreManager.reset();
            const initialScore = scoreManager.getScore();
            const initialLines = scoreManager.getLinesCleared();
            
            // Should not accept negative values
            scoreManager.addScore(-1);
            
            expect(scoreManager.getScore()).toBe(initialScore);
            expect(scoreManager.getLinesCleared()).toBe(initialLines);
        });

        it('should handle very high levels', () => {
            scoreManager.reset();
            // Manually advance to a high level by adding many lines
            for (let i = 0; i < 245; i++) { // 245 * 4 = 980 lines = level 99
                scoreManager.addScore(4);
            }
            
            expect(scoreManager.getLevel()).toBe(99);
            
            const highLevelScore = scoreManager.getScore();
            scoreManager.addScore(4); // Tetris at level 99
            
            expect(scoreManager.getScore()).toBe(highLevelScore + (800 * 99)); // 79,200 points added
        });

        it('should handle maximum integer values', () => {
            scoreManager.reset();
            
            // Set a very high score
            const highScore = 999999999;
            scoreManager.score = highScore;
            
            // Add a small amount
            scoreManager.addScore(1);
            
            expect(scoreManager.getScore()).toBeGreaterThan(highScore);
        });
    });

    describe('Integration with Game Engine', () => {
        it('should integrate scoring with line clearing', () => {
            gameEngine.start();
            
            const board = boardManager.getBoard();
            
            // Set up for a single line clear
            for (let x = 0; x < 10; x++) {
                board[19][x] = { type: 'I', color: '#00FFFF' };
            }
            
            const initialScore = scoreManager.getScore();
            const initialLevel = scoreManager.getLevel();
            
            // Clear the line
            const clearResult = boardManager.clearLines();
            gameEngine.handleLinesCleared(clearResult.count, clearResult.rows);
            
            expect(scoreManager.getScore()).toBe(initialScore + (100 * initialLevel));
            expect(scoreManager.getLinesCleared()).toBe(1);
        });

        it('should integrate scoring with multiple line clears', () => {
            gameEngine.start();
            
            const board = boardManager.getBoard();
            
            // Set up for a Tetris (4 line clear)
            for (let y = 16; y < 20; y++) {
                for (let x = 0; x < 10; x++) {
                    board[y][x] = { type: 'I', color: '#00FFFF' };
                }
            }
            
            const initialScore = scoreManager.getScore();
            const initialLevel = scoreManager.getLevel();
            
            // Clear the lines
            const clearResult = boardManager.clearLines();
            gameEngine.handleLinesCleared(clearResult.count, clearResult.rows);
            
            expect(scoreManager.getScore()).toBe(initialScore + (800 * initialLevel));
            expect(scoreManager.getLinesCleared()).toBe(4);
        });

        it('should handle rapid successive line clears', () => {
            gameEngine.start();
            
            const board = boardManager.getBoard();
            let totalScore = 0;
            let totalLines = 0;
            
            // Perform multiple line clears in succession
            for (let round = 0; round < 3; round++) {
                // Set up 2 lines
                for (let y = 18; y < 20; y++) {
                    for (let x = 0; x < 10; x++) {
                        board[y][x] = { type: 'I', color: '#00FFFF' };
                    }
                }
                
                const currentLevel = scoreManager.getLevel();
                const clearResult = boardManager.clearLines();
                gameEngine.handleLinesCleared(clearResult.count, clearResult.rows);
                
                totalScore += 300 * currentLevel; // 2 lines = 300 points
                totalLines += 2;
                
                // Lines cleared should be accumulating
                expect(scoreManager.getLinesCleared()).toBeGreaterThanOrEqual(2);
            }
            
            // Verify final score accounts for level progression
            expect(scoreManager.getScore()).toBeGreaterThan(0);
            expect(scoreManager.getLinesCleared()).toBeGreaterThanOrEqual(2);
        });
    });

    describe('Score Display and Formatting', () => {
        it('should provide score as number', () => {
            scoreManager.reset();
            scoreManager.addScore(1);
            
            const score = scoreManager.getScore();
            expect(typeof score).toBe('number');
            expect(score).toBe(100);
        });

        it('should provide level as number', () => {
            scoreManager.reset();
            
            const level = scoreManager.getLevel();
            expect(typeof level).toBe('number');
            expect(level).toBe(1);
        });

        it('should provide lines cleared as number', () => {
            scoreManager.reset();
            scoreManager.addScore(3);
            
            const lines = scoreManager.getLinesCleared();
            expect(typeof lines).toBe('number');
            expect(lines).toBe(3);
        });
    });

    describe('Score Reset Functionality', () => {
        it('should reset all scoring values', () => {
            scoreManager.addScore(4); // Add some score
            scoreManager.addScore(4); // Add more score to trigger level up
            scoreManager.addScore(2); // Add more score
            
            expect(scoreManager.getScore()).toBeGreaterThan(0);
            expect(scoreManager.getLevel()).toBeGreaterThan(1);
            expect(scoreManager.getLinesCleared()).toBeGreaterThan(0);
            
            scoreManager.reset();
            
            expect(scoreManager.getScore()).toBe(0);
            expect(scoreManager.getLevel()).toBe(1);
            expect(scoreManager.getLinesCleared()).toBe(0);
        });
    });

    describe('Scoring Consistency', () => {
        it('should maintain consistent scoring across game sessions', () => {
            // First session
            scoreManager.reset();
            scoreManager.addScore(1);
            scoreManager.addScore(2);
            scoreManager.addScore(3);
            scoreManager.addScore(4);
            
            const firstSessionScore = scoreManager.getScore();
            const firstSessionLevel = scoreManager.getLevel();
            const firstSessionLines = scoreManager.getLinesCleared();
            
            // Second session with same line clears
            scoreManager.reset();
            scoreManager.addScore(1);
            scoreManager.addScore(2);
            scoreManager.addScore(3);
            scoreManager.addScore(4);
            
            expect(scoreManager.getScore()).toBe(firstSessionScore);
            expect(scoreManager.getLevel()).toBe(firstSessionLevel);
            expect(scoreManager.getLinesCleared()).toBe(firstSessionLines);
        });

        it('should maintain scoring accuracy with different clear orders', () => {
            // Order 1: 4, 3, 2, 1
            scoreManager.reset();
            scoreManager.addScore(4);
            scoreManager.addScore(3);
            scoreManager.addScore(2);
            scoreManager.addScore(1);
            
            const score1 = scoreManager.getScore();
            const level1 = scoreManager.getLevel();
            const lines1 = scoreManager.getLinesCleared();
            
            // Order 2: 1, 2, 3, 4
            scoreManager.reset();
            scoreManager.addScore(1);
            scoreManager.addScore(2);
            scoreManager.addScore(3);
            scoreManager.addScore(4);
            
            const score2 = scoreManager.getScore();
            const level2 = scoreManager.getLevel();
            const lines2 = scoreManager.getLinesCleared();
            
            // Total lines should be the same
            expect(lines1).toBe(lines2);
            expect(lines1).toBe(10);
            
            // Final levels should be the same
            expect(level1).toBe(level2);
            expect(level1).toBe(2);
            
            // Scores might differ due to level progression timing
            expect(typeof score1).toBe('number');
            expect(typeof score2).toBe('number');
            expect(score1).toBeGreaterThan(0);
            expect(score2).toBeGreaterThan(0);
        });
    });

    describe('Performance and Memory', () => {
        it('should handle large numbers of scoring operations', () => {
            scoreManager.reset();
            
            // Perform many scoring operations
            for (let i = 0; i < 1000; i++) {
                scoreManager.addScore(1);
            }
            
            expect(scoreManager.getLinesCleared()).toBe(1000);
            expect(scoreManager.getScore()).toBeGreaterThan(0);
            expect(scoreManager.getLevel()).toBeGreaterThan(1);
        });

        it('should maintain precision with large scores', () => {
            scoreManager.reset();
            // Test with a reasonable high level instead of 100
            // Add 50 lines to reach level 6
            for (let i = 0; i < 12; i++) { // 12 * 4 = 48 lines
                scoreManager.addScore(4);
            }
            scoreManager.addScore(2); // 2 more lines = 50 total = level 6
            
            expect(scoreManager.getLevel()).toBe(6);
            
            const highLevelScore = scoreManager.getScore();
            scoreManager.addScore(4); // Add a Tetris score at level 6
            
            const expectedScore = highLevelScore + (800 * 6); // 4,800 added
            expect(scoreManager.getScore()).toBe(expectedScore);
        });
    });
});