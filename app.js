// app.js
const http = require('http');
const fs = require('fs');
const path = require('path');

// File path for the JSON file
const dataDir = path.join(__dirname, 'shoppingList');
const dataFilePath = path.join(dataDir, 'shoppingList.json');

// Helper function to ensure shoppingList directory and JSON file exist
function initializeFiles() {
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir);
    }
    if (!fs.existsSync(dataFilePath)) {
        fs.writeFileSync(dataFilePath, JSON.stringify([]));
    }
}

// Initialize files when the app starts
initializeFiles();

// Helper function to read JSON data
function readData() {
    const data = fs.readFileSync(dataFilePath, 'utf8');
    return JSON.parse(data);
}

// Helper function to write JSON data
function writeData(data) {
    fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2));
}

// Create HTTP server
const server = http.createServer((req, res) => {
    const { method, url } = req;
    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'OPTIONS, GET, POST, PUT, PATCH, DELETE',
        'Access-Control-Allow-Headers': 'Content-Type'
    };

    // Handle preflight request for CORS
    if (method === 'OPTIONS') {
        res.writeHead(204, headers);
        res.end();
        return;
    }

    // /shopping-list endpoint for managing shopping list
    if (url === '/shopping-list') {
        res.writeHead(200, headers);

        if (method === 'GET') {
            // GET - Retrieve shopping list
            const shoppingList = readData();
            res.end(JSON.stringify(shoppingList));

        } else if (method === 'POST') {
            // POST - Add new item to shopping list
            let body = '';
            req.on('data', chunk => body += chunk);
            req.on('end', () => {
                try {
                    const item = JSON.parse(body);
                    if (!item.name) {
                        res.writeHead(400, headers);
                        res.end(JSON.stringify({ error: 'Item name is required' }));
                        return;
                    }
                    const shoppingList = readData();
                    item.id = Date.now();
                    shoppingList.push(item);
                    writeData(shoppingList);
                    res.writeHead(201, headers);
                    res.end(JSON.stringify(item));
                } catch (err) {
                    res.writeHead(500, headers);
                    res.end(JSON.stringify({ error: 'Failed to add item' }));
                }
            });

        } else if (method === 'PUT' || method === 'PATCH') {
            // PUT/PATCH - Update item in shopping list
            let body = '';
            req.on('data', chunk => body += chunk);
            req.on('end', () => {
                try {
                    const updatedItem = JSON.parse(body);
                    const shoppingList = readData();
                    const index = shoppingList.findIndex(item => item.id === updatedItem.id);
                    if (index === -1) {
                        res.writeHead(404, headers);
                        res.end(JSON.stringify({ error: 'Item not found' }));
                        return;
                    }
                    shoppingList[index] = {...shoppingList[index], ...updatedItem };
                    writeData(shoppingList);
                    res.writeHead(200, headers);
                    res.end(JSON.stringify(shoppingList[index]));
                } catch (err) {
                    res.writeHead(500, headers);
                    res.end(JSON.stringify({ error: 'Failed to update item' }));
                }
            });

        } else if (method === 'DELETE') {
            // DELETE - Remove item from shopping list
            let body = '';
            req.on('data', chunk => body += chunk);
            req.on('end', () => {
                try {
                    const { id } = JSON.parse(body);
                    const shoppingList = readData();
                    const filteredList = shoppingList.filter(item => item.id !== id);
                    if (shoppingList.length === filteredList.length) {
                        res.writeHead(404, headers);
                        res.end(JSON.stringify({ error: 'Item not found' }));
                        return;
                    }
                    writeData(filteredList);
                    res.writeHead(200, headers);
                    res.end(JSON.stringify({ message: 'Item deleted' }));
                } catch (err) {
                    res.writeHead(500, headers);
                    res.end(JSON.stringify({ error: 'Failed to delete item' }));
                }
            });
        } else {
            res.writeHead(405, headers);
            res.end(JSON.stringify({ error: 'Method not allowed' }));
        }
    } else {
        res.writeHead(404, headers);
        res.end(JSON.stringify({ error: 'Not found' }));
    }
});

// Start server
const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});