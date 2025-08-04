/**
 * Test setup file for Vitest
 * Sets up DOM environment and global mocks
 */

import { vi } from 'vitest';

// Mock requestAnimationFrame and cancelAnimationFrame
global.requestAnimationFrame = vi.fn((callback) => {
    return setTimeout(callback, 16); // ~60fps
});

global.cancelAnimationFrame = vi.fn((id) => {
    clearTimeout(id);
});

// Mock performance.now
global.performance = {
    now: vi.fn(() => Date.now())
};

// Mock console methods to reduce noise in tests
global.console = {
    ...console,
    log: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
};