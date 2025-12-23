const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = 3000;

// Increase limit to 50mb for large image/audio files
app.use(bodyParser.json({ limit: '50mb' }));
app.use(express.static('public'));

const DB_PATH = path.join(__dirname, 'database.json');

// Get All Public Games
app.get('/api/games', (req, res) => {
    fs.readFile(DB_PATH, 'utf8', (err, data) => {
        if (err) return res.status(500).json([]);
        res.json(JSON.parse(data || '[]'));
    });
});

// Save New Game
app.post('/api/games', (req, res) => {
    const newGame = req.body;
    
    // Validation
    if (!newGame.name || !newGame.image || !newGame.jumpSound || !newGame.deathSound) {
        return res.status(400).json({ error: "Missing game data" });
    }

    fs.readFile(DB_PATH, 'utf8', (err, data) => {
        const games = data ? JSON.parse(data) : [];
        newGame.id = Date.now().toString(); // Generate ID
        games.unshift(newGame); // Add to top
        
        fs.writeFile(DB_PATH, JSON.stringify(games, null, 2), (writeErr) => {
            if (writeErr) return res.status(500).json({ error: "Save failed" });
            res.json({ success: true, id: newGame.id });
        });
    });
});

app.listen(PORT, () => {
    console.log(`🕹️ Rex Remix Server running on port ${PORT}`);
});
