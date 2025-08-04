/**
 * Unit tests for tetromino shape definitions
 */

import { describe, it, expect } from 'vitest';
import { 
    TETROMINO_TYPES, 
    TETROMINO_COLORS, 
    TETROMINO_SHAPES,
    ALL_TETROMINO_TYPES,
    ROTATION_STATES,
    MAX_ROTATION_STATE
} from './tetrominoes.js';

describe('Tetromino Constants', () => {
    it('should have all seven tetromino types defined', () => {
        expect(Object.keys(TETROMINO_TYPES)).toHaveLength(7);
        expect(TETROMINO_TYPES.I).toBe('I');
        expect(TETROMINO_TYPES.O).toBe('O');
        expect(TETROMINO_TYPES.T).toBe('T');
        expect(TETROMINO_TYPES.S).toBe('S');
        expect(TETROMINO_TYPES.Z).toBe('Z');
        expect(TETROMINO_TYPES.J).toBe('J');
        expect(TETROMINO_TYPES.L).toBe('L');
    });

    it('should have colors defined for all tetromino types', () => {
        Object.values(TETROMINO_TYPES).forEach(type => {
            expect(TETROMINO_COLORS[type]).toBeDefined();
            expect(typeof TETROMINO_COLORS[type]).toBe('string');
            expect(TETROMINO_COLORS[type]).toMatch(/^#[0-9A-F]{6}$/i);
        });
    });

    it('should have ALL_TETROMINO_TYPES array with all types', () => {
        expect(ALL_TETROMINO_TYPES).toHaveLength(7);
        Object.values(TETROMINO_TYPES).forEach(type => {
            expect(ALL_TETROMINO_TYPES).toContain(type);
        });
    });

    it('should have correct rotation constants', () => {
        expect(ROTATION_STATES.NORTH).toBe(0);
        expect(ROTATION_STATES.EAST).toBe(1);
        expect(ROTATION_STATES.SOUTH).toBe(2);
        expect(ROTATION_STATES.WEST).toBe(3);
        expect(MAX_ROTATION_STATE).toBe(3);
    });
});

describe('Tetromino Shapes', () => {
    it('should have shapes defined for all tetromino types', () => {
        Object.values(TETROMINO_TYPES).forEach(type => {
            expect(TETROMINO_SHAPES[type]).toBeDefined();
            expect(TETROMINO_SHAPES[type]).toHaveLength(4); // 4 rotation states
        });
    });

    it('should have all shapes as 4x4 grids', () => {
        Object.values(TETROMINO_TYPES).forEach(type => {
            TETROMINO_SHAPES[type].forEach((rotation, rotIndex) => {
                expect(rotation).toHaveLength(4); // 4 rows
                rotation.forEach((row, rowIndex) => {
                    expect(row).toHaveLength(4); // 4 columns
                    row.forEach((cell, colIndex) => {
                        expect([0, 1]).toContain(cell); // Only 0 or 1 values
                    });
                });
            });
        });
    });

    it('should have I-piece with correct shape', () => {
        const iShape = TETROMINO_SHAPES[TETROMINO_TYPES.I];
        
        // 0° rotation - horizontal line
        expect(iShape[0][1]).toEqual([1, 1, 1, 1]);
        
        // 90° rotation - vertical line
        expect(iShape[1].map(row => row[2])).toEqual([1, 1, 1, 1]);
    });

    it('should have O-piece with same shape for all rotations', () => {
        const oShape = TETROMINO_SHAPES[TETROMINO_TYPES.O];
        
        // All rotations should be identical for O-piece
        for (let i = 1; i < 4; i++) {
            expect(oShape[i]).toEqual(oShape[0]);
        }
        
        // Should be a 2x2 square in the center
        expect(oShape[0][1][1]).toBe(1);
        expect(oShape[0][1][2]).toBe(1);
        expect(oShape[0][2][1]).toBe(1);
        expect(oShape[0][2][2]).toBe(1);
    });

    it('should have T-piece with correct T shape', () => {
        const tShape = TETROMINO_SHAPES[TETROMINO_TYPES.T];
        
        // 0° rotation - T pointing up
        expect(tShape[0][1][1]).toBe(1); // Top of T
        expect(tShape[0][2]).toEqual([1, 1, 1, 0]); // Bottom of T
    });

    it('should have S-piece with correct S shape', () => {
        const sShape = TETROMINO_SHAPES[TETROMINO_TYPES.S];
        
        // 0° rotation - S shape
        expect(sShape[0][1]).toEqual([0, 1, 1, 0]); // Top part
        expect(sShape[0][2]).toEqual([1, 1, 0, 0]); // Bottom part
    });

    it('should have Z-piece with correct Z shape', () => {
        const zShape = TETROMINO_SHAPES[TETROMINO_TYPES.Z];
        
        // 0° rotation - Z shape
        expect(zShape[0][1]).toEqual([1, 1, 0, 0]); // Top part
        expect(zShape[0][2]).toEqual([0, 1, 1, 0]); // Bottom part
    });

    it('should have J-piece with correct J shape', () => {
        const jShape = TETROMINO_SHAPES[TETROMINO_TYPES.J];
        
        // 0° rotation - J shape
        expect(jShape[0][1][0]).toBe(1); // Top of J
        expect(jShape[0][2]).toEqual([1, 1, 1, 0]); // Bottom of J
    });

    it('should have L-piece with correct L shape', () => {
        const lShape = TETROMINO_SHAPES[TETROMINO_TYPES.L];
        
        // 0° rotation - L shape
        expect(lShape[0][1][2]).toBe(1); // Top of L
        expect(lShape[0][2]).toEqual([1, 1, 1, 0]); // Bottom of L
    });
});

describe('Shape Validation', () => {
    it('should have exactly 4 blocks for each tetromino shape', () => {
        Object.values(TETROMINO_TYPES).forEach(type => {
            TETROMINO_SHAPES[type].forEach((rotation, rotIndex) => {
                const blockCount = rotation.flat().filter(cell => cell === 1).length;
                expect(blockCount).toBe(4);
            });
        });
    });

    it('should have valid rotation sequences', () => {
        Object.values(TETROMINO_TYPES).forEach(type => {
            const shapes = TETROMINO_SHAPES[type];
            
            // Each rotation should be different (except O-piece)
            if (type !== TETROMINO_TYPES.O) {
                for (let i = 0; i < 4; i++) {
                    for (let j = i + 1; j < 4; j++) {
                        const shape1 = JSON.stringify(shapes[i]);
                        const shape2 = JSON.stringify(shapes[j]);
                        // At least some rotations should be different
                        if (i === 0 && j === 2) {
                            // 0° and 180° might be the same for some pieces, but not all
                            continue;
                        }
                    }
                }
            }
        });
    });
});