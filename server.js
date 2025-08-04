/**
 * Simple HTTP server for testing the Tetris game
 */

import { createServer } from 'http';
import { readFile } from 'fs/promises';
import { extname, join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PORT = 8080;

// MIME types for different file extensions
const mimeTypes = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.ico': 'image/x-icon'
};

const server = createServer(async (req, res) => {
    try {
        // Parse the URL and remove query parameters
        let filePath = req.url.split('?')[0];
        
        // Default to index.html for root requests
        if (filePath === '/') {
            filePath = '/index.html';
        }
        
        // Build the full file path
        const fullPath = join(__dirname, filePath);
        
        // Get the file extension
        const ext = extname(filePath).toLowerCase();
        const contentType = mimeTypes[ext] || 'application/octet-stream';
        
        // Read and serve the file
        const data = await readFile(fullPath);
        
        res.writeHead(200, {
            'Content-Type': contentType,
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
        });
        
        res.end(data);
        
        console.log(`✓ Served: ${filePath} (${contentType})`);
        
    } catch (error) {
        // File not found or other error
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('File not found');
        console.log(`✗ Not found: ${req.url}`);
    }
});

server.listen(PORT, () => {
    console.log(`🎮 Tetris game server running at http://localhost:${PORT}`);
    console.log(`📁 Serving files from: ${__dirname}`);
    console.log('Press Ctrl+C to stop the server');
});

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Server shutting down...');
    server.close(() => {
        console.log('✓ Server closed');
        process.exit(0);
    });
});