/**
 * Unit tests for ScoreManager class
 * Tests scoring calculations, level progression, and statistics tracking
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ScoreManager } from './scoreManager.js';

describe('ScoreManager', () => {
    let scoreManager;

    beforeEach(() => {
        scoreManager = new ScoreManager();
    });

    describe('Initialization', () => {
        it('should initialize with default values', () => {
            expect(scoreManager.getScore()).toBe(0);
            expect(scoreManager.getLevel()).toBe(1);
            expect(scoreManager.getLinesCleared()).toBe(0);
            expect(scoreManager.getTotalPiecesPlaced()).toBe(0);
        });

        it('should initialize with custom configuration', () => {
            const customScoreManager = new ScoreManager({
                linesPerLevel: 5,
                initialLevel: 3
            });
            
            expect(customScoreManager.getLevel()).toBe(3);
            expect(customScoreManager.config.linesPerLevel).toBe(5);
        });

        it('should initialize line clearing statistics', () => {
            const stats = scoreManager.getLineClearingStats();
            expect(stats.single).toBe(0);
            expect(stats.double).toBe(0);
            expect(stats.triple).toBe(0);
            expect(stats.tetris).toBe(0);
        });
    });

    describe('Base Score Calculation', () => {
        it('should return correct base scores for different line clears', () => {
            expect(scoreManager.getBaseScore(1)).toBe(100);  // Single
            expect(scoreManager.getBaseScore(2)).toBe(300);  // Double
            expect(scoreManager.getBaseScore(3)).toBe(500);  // Triple
            expect(scoreManager.getBaseScore(4)).toBe(800);  // Tetris
        });

        it('should return 0 for invalid line counts', () => {
            expect(scoreManager.getBaseScore(0)).toBe(0);
            expect(scoreManager.getBaseScore(5)).toBe(0);
            expect(scoreManager.getBaseScore(-1)).toBe(0);
        });
    });

    describe('Score Addition', () => {
        it('should add correct score for single line clear at level 1', () => {
            const pointsAwarded = scoreManager.addScore(1);
            
            expect(pointsAwarded).toBe(100); // 100 * 1
            expect(scoreManager.getScore()).toBe(100);
            expect(scoreManager.getLinesCleared()).toBe(1);
        });

        it('should add correct score for double line clear at level 1', () => {
            const pointsAwarded = scoreManager.addScore(2);
            
            expect(pointsAwarded).toBe(300); // 300 * 1
            expect(scoreManager.getScore()).toBe(300);
            expect(scoreManager.getLinesCleared()).toBe(2);
        });

        it('should add correct score for triple line clear at level 1', () => {
            const pointsAwarded = scoreManager.addScore(3);
            
            expect(pointsAwarded).toBe(500); // 500 * 1
            expect(scoreManager.getScore()).toBe(500);
            expect(scoreManager.getLinesCleared()).toBe(3);
        });

        it('should add correct score for Tetris at level 1', () => {
            const pointsAwarded = scoreManager.addScore(4);
            
            expect(pointsAwarded).toBe(800); // 800 * 1
            expect(scoreManager.getScore()).toBe(800);
            expect(scoreManager.getLinesCleared()).toBe(4);
        });

        it('should multiply score by current level', () => {
            // Manually set level to 3
            scoreManager.level = 3;
            
            const pointsAwarded = scoreManager.addScore(1);
            
            expect(pointsAwarded).toBe(300); // 100 * 3
            expect(scoreManager.getScore()).toBe(300);
        });

        it('should accumulate scores from multiple line clears', () => {
            scoreManager.addScore(1); // 100 points
            scoreManager.addScore(2); // 300 points
            scoreManager.addScore(4); // 800 points
            
            expect(scoreManager.getScore()).toBe(1200);
            expect(scoreManager.getLinesCleared()).toBe(7);
        });

        it('should return 0 for invalid line counts', () => {
            const pointsAwarded = scoreManager.addScore(0);
            
            expect(pointsAwarded).toBe(0);
            expect(scoreManager.getScore()).toBe(0);
            expect(scoreManager.getLinesCleared()).toBe(0);
        });
    });

    describe('Level Progression', () => {
        it('should advance to level 2 after clearing 10 lines', () => {
            // Clear 10 lines (should advance to level 2)
            scoreManager.addScore(4); // 4 lines
            scoreManager.addScore(3); // 3 lines (total: 7)
            scoreManager.addScore(3); // 3 lines (total: 10)
            
            expect(scoreManager.getLevel()).toBe(2);
            expect(scoreManager.getLinesCleared()).toBe(10);
        });

        it('should advance to level 3 after clearing 20 lines', () => {
            // Clear 20 lines
            for (let i = 0; i < 5; i++) {
                scoreManager.addScore(4); // 4 lines each, 5 times = 20 lines
            }
            
            expect(scoreManager.getLevel()).toBe(3);
            expect(scoreManager.getLinesCleared()).toBe(20);
        });

        it('should calculate lines until next level correctly', () => {
            expect(scoreManager.getLinesUntilNextLevel()).toBe(10); // Start at 0 lines
            
            scoreManager.addScore(3); // 3 lines cleared
            expect(scoreManager.getLinesUntilNextLevel()).toBe(7); // 10 - 3 = 7
            
            scoreManager.addScore(4); // 4 more lines (total: 7)
            expect(scoreManager.getLinesUntilNextLevel()).toBe(3); // 10 - 7 = 3
        });

        it('should work with custom lines per level', () => {
            const customScoreManager = new ScoreManager({ linesPerLevel: 5 });
            
            customScoreManager.addScore(4); // 4 lines
            expect(customScoreManager.getLevel()).toBe(1);
            
            customScoreManager.addScore(2); // 2 more lines (total: 6)
            expect(customScoreManager.getLevel()).toBe(2);
        });

        it('should work with custom initial level', () => {
            const customScoreManager = new ScoreManager({ initialLevel: 5 });
            
            expect(customScoreManager.getLevel()).toBe(5);
            
            customScoreManager.addScore(4); // 4 lines
            customScoreManager.addScore(4); // 4 lines
            customScoreManager.addScore(2); // 2 lines (total: 10)
            
            expect(customScoreManager.getLevel()).toBe(6); // 5 + 1
        });
    });

    describe('Line Clearing Statistics', () => {
        it('should track single line clears', () => {
            scoreManager.addScore(1);
            scoreManager.addScore(1);
            
            const stats = scoreManager.getLineClearingStats();
            expect(stats.single).toBe(2);
            expect(stats.double).toBe(0);
            expect(stats.triple).toBe(0);
            expect(stats.tetris).toBe(0);
        });

        it('should track double line clears', () => {
            scoreManager.addScore(2);
            scoreManager.addScore(2);
            scoreManager.addScore(2);
            
            const stats = scoreManager.getLineClearingStats();
            expect(stats.single).toBe(0);
            expect(stats.double).toBe(3);
            expect(stats.triple).toBe(0);
            expect(stats.tetris).toBe(0);
        });

        it('should track triple line clears', () => {
            scoreManager.addScore(3);
            
            const stats = scoreManager.getLineClearingStats();
            expect(stats.single).toBe(0);
            expect(stats.double).toBe(0);
            expect(stats.triple).toBe(1);
            expect(stats.tetris).toBe(0);
        });

        it('should track Tetris line clears', () => {
            scoreManager.addScore(4);
            scoreManager.addScore(4);
            
            const stats = scoreManager.getLineClearingStats();
            expect(stats.single).toBe(0);
            expect(stats.double).toBe(0);
            expect(stats.triple).toBe(0);
            expect(stats.tetris).toBe(2);
        });

        it('should track mixed line clearing types', () => {
            scoreManager.addScore(1); // Single
            scoreManager.addScore(2); // Double
            scoreManager.addScore(3); // Triple
            scoreManager.addScore(4); // Tetris
            scoreManager.addScore(1); // Single
            
            const stats = scoreManager.getLineClearingStats();
            expect(stats.single).toBe(2);
            expect(stats.double).toBe(1);
            expect(stats.triple).toBe(1);
            expect(stats.tetris).toBe(1);
        });
    });

    describe('Piece Placement Tracking', () => {
        it('should track piece placements', () => {
            expect(scoreManager.getTotalPiecesPlaced()).toBe(0);
            
            scoreManager.addPiecePlacement();
            expect(scoreManager.getTotalPiecesPlaced()).toBe(1);
            
            scoreManager.addPiecePlacement();
            scoreManager.addPiecePlacement();
            expect(scoreManager.getTotalPiecesPlaced()).toBe(3);
        });
    });

    describe('Fall Speed Calculation', () => {
        it('should calculate fall speed for level 1', () => {
            const fallSpeed = scoreManager.calculateFallSpeed(1000);
            expect(fallSpeed).toBe(1000); // 1000 * (0.8 ^ 0) = 1000
        });

        it('should calculate fall speed for level 2', () => {
            scoreManager.level = 2;
            const fallSpeed = scoreManager.calculateFallSpeed(1000);
            expect(fallSpeed).toBe(800); // 1000 * (0.8 ^ 1) = 800
        });

        it('should calculate fall speed for level 3', () => {
            scoreManager.level = 3;
            const fallSpeed = scoreManager.calculateFallSpeed(1000);
            expect(fallSpeed).toBe(640); // 1000 * (0.8 ^ 2) = 640
        });

        it('should respect minimum fall speed', () => {
            scoreManager.level = 20; // Very high level
            const fallSpeed = scoreManager.calculateFallSpeed(1000);
            expect(fallSpeed).toBe(50); // Should not go below 50ms
        });

        it('should work with custom base fall speed', () => {
            scoreManager.level = 2;
            const fallSpeed = scoreManager.calculateFallSpeed(500);
            expect(fallSpeed).toBe(400); // 500 * 0.8 = 400
        });
    });

    describe('Comprehensive Statistics', () => {
        beforeEach(() => {
            // Set up some game state
            scoreManager.addScore(1); // 100 points, 1 line
            scoreManager.addScore(4); // 800 points, 4 lines
            scoreManager.addPiecePlacement();
            scoreManager.addPiecePlacement();
            scoreManager.addPiecePlacement();
        });

        it('should provide comprehensive statistics', () => {
            const stats = scoreManager.getStats();
            
            expect(stats.score).toBe(900);
            expect(stats.level).toBe(1);
            expect(stats.linesCleared).toBe(5);
            expect(stats.linesUntilNextLevel).toBe(5);
            expect(stats.totalPiecesPlaced).toBe(3);
            expect(stats.lineClearingStats.single).toBe(1);
            expect(stats.lineClearingStats.tetris).toBe(1);
            expect(stats.averageScorePerPiece).toBe(300); // 900 / 3
            expect(stats.tetrisPercentage).toBe(80); // 4 out of 5 lines from Tetris
        });

        it('should handle zero pieces placed for average calculation', () => {
            const freshScoreManager = new ScoreManager();
            const stats = freshScoreManager.getStats();
            
            expect(stats.averageScorePerPiece).toBe(0);
        });

        it('should handle zero lines cleared for Tetris percentage', () => {
            const freshScoreManager = new ScoreManager();
            const stats = freshScoreManager.getStats();
            
            expect(stats.tetrisPercentage).toBe(0);
        });
    });

    describe('Reset Functionality', () => {
        it('should reset all values to initial state', () => {
            // Set up some state
            scoreManager.addScore(4);
            scoreManager.addPiecePlacement();
            scoreManager.addPiecePlacement();
            
            // Reset
            scoreManager.reset();
            
            expect(scoreManager.getScore()).toBe(0);
            expect(scoreManager.getLevel()).toBe(1);
            expect(scoreManager.getLinesCleared()).toBe(0);
            expect(scoreManager.getTotalPiecesPlaced()).toBe(0);
            
            const stats = scoreManager.getLineClearingStats();
            expect(stats.single).toBe(0);
            expect(stats.double).toBe(0);
            expect(stats.triple).toBe(0);
            expect(stats.tetris).toBe(0);
        });

        it('should reset to custom initial level', () => {
            const customScoreManager = new ScoreManager({ initialLevel: 5 });
            customScoreManager.addScore(4);
            
            customScoreManager.reset();
            
            expect(customScoreManager.getLevel()).toBe(5);
        });
    });

    describe('State Import/Export', () => {
        it('should export current state', () => {
            scoreManager.addScore(2);
            scoreManager.addPiecePlacement();
            
            const state = scoreManager.exportState();
            
            expect(state.score).toBe(300);
            expect(state.level).toBe(1);
            expect(state.linesCleared).toBe(2);
            expect(state.totalPiecesPlaced).toBe(1);
            expect(state.linesClearedByType.double).toBe(1);
            expect(state.config).toBeDefined();
        });

        it('should import state correctly', () => {
            const state = {
                score: 1500,
                level: 3,
                linesCleared: 25,
                totalPiecesPlaced: 10,
                linesClearedByType: {
                    single: 1,
                    double: 2,
                    triple: 3,
                    tetris: 4
                },
                config: {
                    linesPerLevel: 8
                }
            };
            
            scoreManager.importState(state);
            
            expect(scoreManager.getScore()).toBe(1500);
            expect(scoreManager.getLevel()).toBe(3);
            expect(scoreManager.getLinesCleared()).toBe(25);
            expect(scoreManager.getTotalPiecesPlaced()).toBe(10);
            expect(scoreManager.config.linesPerLevel).toBe(8);
            
            const stats = scoreManager.getLineClearingStats();
            expect(stats.single).toBe(1);
            expect(stats.double).toBe(2);
            expect(stats.triple).toBe(3);
            expect(stats.tetris).toBe(4);
        });

        it('should handle partial state import', () => {
            const partialState = {
                score: 500,
                level: 2
            };
            
            scoreManager.importState(partialState);
            
            expect(scoreManager.getScore()).toBe(500);
            expect(scoreManager.getLevel()).toBe(2);
            expect(scoreManager.getLinesCleared()).toBe(0); // Should use default
            expect(scoreManager.getTotalPiecesPlaced()).toBe(0); // Should use default
        });
    });
});