/**
 * Tetromino shape definitions and constants
 * Each tetromino is defined as a 4x4 grid with 4 rotation states
 * 0 = empty space, 1 = filled block
 */

// Tetromino types
export const TETROMINO_TYPES = {
    I: 'I',
    O: 'O', 
    T: 'T',
    S: 'S',
    Z: 'Z',
    J: 'J',
    L: 'L'
};

// Enhanced colors for each tetromino type with better contrast and visual appeal
export const TETROMINO_COLORS = {
    [TETROMINO_TYPES.I]: '#00F5FF', // Bright Cyan
    [TETROMINO_TYPES.O]: '#FFD700', // Gold
    [TETROMINO_TYPES.T]: '#9932CC', // Dark Orchid
    [TETROMINO_TYPES.S]: '#32CD32', // Lime Green
    [TETROMINO_TYPES.Z]: '#FF4500', // Orange Red
    [TETROMINO_TYPES.J]: '#1E90FF', // Dodger Blue
    [TETROMINO_TYPES.L]: '#FF8C00'  // Dark Orange
};

// Darker variants for shadows and depth effects
export const TETROMINO_DARK_COLORS = {
    [TETROMINO_TYPES.I]: '#008B8B', // Dark Cyan
    [TETROMINO_TYPES.O]: '#B8860B', // Dark Goldenrod
    [TETROMINO_TYPES.T]: '#663399', // Rebecca Purple
    [TETROMINO_TYPES.S]: '#228B22', // Forest Green
    [TETROMINO_TYPES.Z]: '#CC3300', // Dark Red
    [TETROMINO_TYPES.J]: '#0066CC', // Dark Blue
    [TETROMINO_TYPES.L]: '#CC6600'  // Dark Orange
};

// Light variants for highlights
export const TETROMINO_LIGHT_COLORS = {
    [TETROMINO_TYPES.I]: '#87CEEB', // Sky Blue
    [TETROMINO_TYPES.O]: '#FFFFE0', // Light Yellow
    [TETROMINO_TYPES.T]: '#DDA0DD', // Plum
    [TETROMINO_TYPES.S]: '#90EE90', // Light Green
    [TETROMINO_TYPES.Z]: '#FFA07A', // Light Salmon
    [TETROMINO_TYPES.J]: '#87CEFA', // Light Sky Blue
    [TETROMINO_TYPES.L]: '#FFDAB9'  // Peach Puff
};

// Tetromino shape definitions with rotation states
// Each shape is a 4x4 grid, with 4 rotation states (0°, 90°, 180°, 270°)
export const TETROMINO_SHAPES = {
    [TETROMINO_TYPES.I]: [
        // 0° rotation
        [
            [0, 0, 0, 0],
            [1, 1, 1, 1],
            [0, 0, 0, 0],
            [0, 0, 0, 0]
        ],
        // 90° rotation
        [
            [0, 0, 1, 0],
            [0, 0, 1, 0],
            [0, 0, 1, 0],
            [0, 0, 1, 0]
        ],
        // 180° rotation
        [
            [0, 0, 0, 0],
            [0, 0, 0, 0],
            [1, 1, 1, 1],
            [0, 0, 0, 0]
        ],
        // 270° rotation
        [
            [0, 1, 0, 0],
            [0, 1, 0, 0],
            [0, 1, 0, 0],
            [0, 1, 0, 0]
        ]
    ],
    
    [TETROMINO_TYPES.O]: [
        // 0° rotation (O piece doesn't rotate)
        [
            [0, 0, 0, 0],
            [0, 1, 1, 0],
            [0, 1, 1, 0],
            [0, 0, 0, 0]
        ],
        // 90° rotation (same as 0°)
        [
            [0, 0, 0, 0],
            [0, 1, 1, 0],
            [0, 1, 1, 0],
            [0, 0, 0, 0]
        ],
        // 180° rotation (same as 0°)
        [
            [0, 0, 0, 0],
            [0, 1, 1, 0],
            [0, 1, 1, 0],
            [0, 0, 0, 0]
        ],
        // 270° rotation (same as 0°)
        [
            [0, 0, 0, 0],
            [0, 1, 1, 0],
            [0, 1, 1, 0],
            [0, 0, 0, 0]
        ]
    ],
    
    [TETROMINO_TYPES.T]: [
        // 0° rotation
        [
            [0, 0, 0, 0],
            [0, 1, 0, 0],
            [1, 1, 1, 0],
            [0, 0, 0, 0]
        ],
        // 90° rotation
        [
            [0, 0, 0, 0],
            [0, 1, 0, 0],
            [0, 1, 1, 0],
            [0, 1, 0, 0]
        ],
        // 180° rotation
        [
            [0, 0, 0, 0],
            [0, 0, 0, 0],
            [1, 1, 1, 0],
            [0, 1, 0, 0]
        ],
        // 270° rotation
        [
            [0, 0, 0, 0],
            [0, 1, 0, 0],
            [1, 1, 0, 0],
            [0, 1, 0, 0]
        ]
    ],
    
    [TETROMINO_TYPES.S]: [
        // 0° rotation
        [
            [0, 0, 0, 0],
            [0, 1, 1, 0],
            [1, 1, 0, 0],
            [0, 0, 0, 0]
        ],
        // 90° rotation
        [
            [0, 0, 0, 0],
            [0, 1, 0, 0],
            [0, 1, 1, 0],
            [0, 0, 1, 0]
        ],
        // 180° rotation
        [
            [0, 0, 0, 0],
            [0, 0, 0, 0],
            [0, 1, 1, 0],
            [1, 1, 0, 0]
        ],
        // 270° rotation
        [
            [0, 0, 0, 0],
            [1, 0, 0, 0],
            [1, 1, 0, 0],
            [0, 1, 0, 0]
        ]
    ],
    
    [TETROMINO_TYPES.Z]: [
        // 0° rotation
        [
            [0, 0, 0, 0],
            [1, 1, 0, 0],
            [0, 1, 1, 0],
            [0, 0, 0, 0]
        ],
        // 90° rotation
        [
            [0, 0, 0, 0],
            [0, 0, 1, 0],
            [0, 1, 1, 0],
            [0, 1, 0, 0]
        ],
        // 180° rotation
        [
            [0, 0, 0, 0],
            [0, 0, 0, 0],
            [1, 1, 0, 0],
            [0, 1, 1, 0]
        ],
        // 270° rotation
        [
            [0, 0, 0, 0],
            [0, 1, 0, 0],
            [1, 1, 0, 0],
            [1, 0, 0, 0]
        ]
    ],
    
    [TETROMINO_TYPES.J]: [
        // 0° rotation
        [
            [0, 0, 0, 0],
            [1, 0, 0, 0],
            [1, 1, 1, 0],
            [0, 0, 0, 0]
        ],
        // 90° rotation
        [
            [0, 0, 0, 0],
            [0, 1, 1, 0],
            [0, 1, 0, 0],
            [0, 1, 0, 0]
        ],
        // 180° rotation
        [
            [0, 0, 0, 0],
            [0, 0, 0, 0],
            [1, 1, 1, 0],
            [0, 0, 1, 0]
        ],
        // 270° rotation
        [
            [0, 0, 0, 0],
            [0, 1, 0, 0],
            [0, 1, 0, 0],
            [1, 1, 0, 0]
        ]
    ],
    
    [TETROMINO_TYPES.L]: [
        // 0° rotation
        [
            [0, 0, 0, 0],
            [0, 0, 1, 0],
            [1, 1, 1, 0],
            [0, 0, 0, 0]
        ],
        // 90° rotation
        [
            [0, 0, 0, 0],
            [0, 1, 0, 0],
            [0, 1, 0, 0],
            [0, 1, 1, 0]
        ],
        // 180° rotation
        [
            [0, 0, 0, 0],
            [0, 0, 0, 0],
            [1, 1, 1, 0],
            [1, 0, 0, 0]
        ],
        // 270° rotation
        [
            [0, 0, 0, 0],
            [1, 1, 0, 0],
            [0, 1, 0, 0],
            [0, 1, 0, 0]
        ]
    ]
};

// Array of all tetromino types for random selection
export const ALL_TETROMINO_TYPES = Object.values(TETROMINO_TYPES);

// Rotation constants
export const ROTATION_STATES = {
    NORTH: 0,  // 0°
    EAST: 1,   // 90°
    SOUTH: 2,  // 180°
    WEST: 3    // 270°
};

export const MAX_ROTATION_STATE = 3;