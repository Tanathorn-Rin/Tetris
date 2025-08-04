/**
 * Integration tests for GameEngine with all components
 * Tests the complete automatic falling mechanics workflow
 */

import { describe, it, test, expect, beforeEach, afterEach, vi } from "vitest";
import { GameEngine } from "./gameEngine.js";

// Mock browser APIs for testing
global.requestAnimationFrame = vi.fn((callback) => {
  return setTimeout(callback, 16);
});

global.cancelAnimationFrame = vi.fn((id) => {
  clearTimeout(id);
});

global.performance = {
  now: vi.fn(() => Date.now()),
};

describe("GameEngine Integration Tests", () => {
  let gameEngine;

  beforeEach(() => {
    gameEngine = new GameEngine({
      boardWidth: 10,
      boardHeight: 20,
      initialFallSpeed: 100, // Faster for testing
      softDropSpeed: 10,
      lockDelay: 50,
    });
  });

  afterEach(() => {
    if (gameEngine.isRunning) {
      gameEngine.stop();
    }
  });

  test("should complete full game cycle with automatic falling", () => {
    // Start the game
    gameEngine.start();

    expect(gameEngine.gameState.status).toBe("playing");
    expect(gameEngine.tetrominoManager.hasActivePiece()).toBe(true);

    // Simulate automatic falling by calling update multiple times
    const initialY = gameEngine.tetrominoManager.getCurrentPiece().y;

    // Mock time to trigger falling
    let mockTime = 0;
    performance.now = vi.fn(() => mockTime);
    gameEngine.lastFallTime = 0;

    // Simulate time passage to trigger automatic fall
    mockTime = 150; // Exceed fall speed of 100ms
    gameEngine.update(50);

    const newY = gameEngine.tetrominoManager.getCurrentPiece().y;
    expect(newY).toBe(initialY + 1);
  });

  test("should handle piece locking and line clearing", () => {
    gameEngine.start();

    // Fill bottom row completely to test line clearing
    const board = gameEngine.boardManager.getBoard();
    for (let col = 0; col < 10; col++) {
      board[19][col] = { type: "I", color: "#00FFFF" };
    }

    // Manually trigger line clearing
    const lineClearResult = gameEngine.boardManager.clearLines();
    gameEngine.handleLinesCleared(lineClearResult.count, lineClearResult.rows);

    // Check that line was cleared and score updated
    const state = gameEngine.getGameState();
    expect(state.linesCleared).toBeGreaterThan(0);
    expect(state.score).toBeGreaterThan(0);
  });

  test("should handle soft drop functionality", () => {
    gameEngine.start();

    // Enable soft drop
    gameEngine.startSoftDrop();
    expect(gameEngine.isSoftDropping).toBe(true);

    // Mock time to test faster falling
    let mockTime = 0;
    performance.now = vi.fn(() => mockTime);
    gameEngine.lastFallTime = 0;

    const initialY = gameEngine.tetrominoManager.getCurrentPiece().y;

    // Time passage that would trigger soft drop but not normal drop
    mockTime = 15; // Exceed soft drop speed of 10ms but not normal speed
    gameEngine.update(5);

    const newY = gameEngine.tetrominoManager.getCurrentPiece().y;
    expect(newY).toBe(initialY + 1);

    // Disable soft drop
    gameEngine.stopSoftDrop();
    expect(gameEngine.isSoftDropping).toBe(false);
  });

  test("should handle game over conditions", () => {
    gameEngine.start();

    // Fill the top row to trigger game over condition
    const board = gameEngine.boardManager.getBoard();
    for (let col = 0; col < 10; col++) {
      board[0][col] = { type: "I", color: "#00FFFF" };
    }

    // Manually trigger game over check
    gameEngine.gameOver();

    expect(gameEngine.gameState.status).toBe("gameOver");
    expect(gameEngine.isRunning).toBe(false);
  });

  test("should handle level progression and speed increase", () => {
    gameEngine.start();

    // Simulate clearing 8 lines first
    gameEngine.scoreManager.addScore(4); // 4 lines
    gameEngine.scoreManager.addScore(4); // 4 lines (total: 8)

    const initialState = gameEngine.getGameState();
    const initialLevel = initialState.level;
    const initialSpeed = gameEngine.gameState.fallSpeed;

    // Clear 3 more lines to trigger level up (total: 11 lines)
    gameEngine.handleLinesCleared(3);

    const finalState = gameEngine.getGameState();
    expect(finalState.level).toBe(initialLevel + 1);
    expect(gameEngine.gameState.fallSpeed).toBeLessThan(initialSpeed);
  });

  test("should integrate all components correctly", () => {
    gameEngine.start();

    // Verify all components are properly initialized and connected
    expect(gameEngine.boardManager).toBeDefined();
    expect(gameEngine.tetrominoManager).toBeDefined();
    expect(gameEngine.tetrominoManager.boardManager).toBe(
      gameEngine.boardManager
    );

    // Test that tetromino manager can interact with board manager
    const piece = gameEngine.tetrominoManager.getCurrentPiece();
    expect(piece).toBeDefined();

    // Test movement through tetromino manager
    const canMoveLeft = gameEngine.tetrominoManager.moveLeft();
    const canMoveRight = gameEngine.tetrominoManager.moveRight();
    const canRotate = gameEngine.tetrominoManager.rotatePiece();

    // These should work with a fresh piece on an empty board
    expect(typeof canMoveLeft).toBe("boolean");
    expect(typeof canMoveRight).toBe("boolean");
    expect(typeof canRotate).toBe("boolean");

    // Test that board manager validates positions correctly
    expect(gameEngine.boardManager.isValidPosition(piece)).toBe(true);
  });
});
