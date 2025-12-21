// FILE: ui.js - FIXED VERSION
const ui = {
    config: {
        maxAvatarSize: 500 * 1024, // Increased to 500KB
        maxAudioDuration: 5,
        maxAudioSize: 1000 * 1024, // Increased to 1MB
        gameIdLength: 8
    },
    
    currentGame: {
        playerName: '',
        avatarBase64: null,
        jumpSoundBase64: null,
        deathSoundBase64: null,
        visibility: 'private'
    },
    
    init: function() {
        console.log('UI initialized');
        this.bindEvents();
        this.loadDefaults();
    },
    
    bindEvents: function() {
        // Player name input
        const nameInput = document.getElementById('playerName');
        if (nameInput) {
            nameInput.addEventListener('input', (e) => {
                this.currentGame.playerName = e.target.value.trim();
            });
        }
        
        // Avatar upload - FIXED
        const avatarInput = document.getElementById('avatarUpload');
        if (avatarInput) {
            avatarInput.addEventListener('change', (e) => {
                this.handleImageUpload(e.target.files[0]);
            });
        }
        
        // Audio uploads - FIXED
        const jumpSoundInput = document.getElementById('jumpSound');
        if (jumpSoundInput) {
            jumpSoundInput.addEventListener('change', (e) => {
                this.handleAudioUpload(e.target.files[0], 'jump');
            });
        }
        
        const deathSoundInput = document.getElementById('deathSound');
        if (deathSoundInput) {
            deathSoundInput.addEventListener('change', (e) => {
                this.handleAudioUpload(e.target.files[0], 'death');
            });
        }
        
        // Audio previews - FIXED
        const previewJump = document.getElementById('previewJump');
        if (previewJump) {
            previewJump.addEventListener('click', (e) => {
                e.preventDefault();
                this.previewAudio('jump');
            });
        }
        
        const previewDeath = document.getElementById('previewDeath');
        if (previewDeath) {
            previewDeath.addEventListener('click', (e) => {
                e.preventDefault();
                this.previewAudio('death');
            });
        }
        
        // Create game button
        const createBtn = document.getElementById('btnCreateGame');
        if (createBtn) {
            createBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.createGame();
            });
        }
        
        // Navigation buttons
        const publicGamesBtn = document.getElementById('btnPublicGames');
        if (publicGamesBtn) {
            publicGamesBtn.addEventListener('click', () => {
                window.location.href = 'public.html';
            });
        }
        
        const homeBtn = document.getElementById('btnHome');
        if (homeBtn) {
            homeBtn.addEventListener('click', () => {
                window.location.href = 'home.html';
            });
        }
        
        const myGamesBtn = document.getElementById('btnMyGames');
        if (myGamesBtn) {
            myGamesBtn.addEventListener('click', () => {
                this.showMyGames();
            });
        }
        
        // Toggle visibility buttons - FIXED
        document.querySelectorAll('.toggle-option').forEach(option => {
            option.addEventListener('click', (e) => {
                document.querySelectorAll('.toggle-option').forEach(opt => {
                    opt.classList.remove('active');
                });
                option.classList.add('active');
                this.currentGame.visibility = option.dataset.value;
                
                // Update description
                if (option.dataset.value === 'private') {
                    document.getElementById('privateDesc').style.display = 'inline';
                    document.getElementById('publicDesc').style.display = 'none';
                } else {
                    document.getElementById('privateDesc').style.display = 'none';
                    document.getElementById('publicDesc').style.display = 'inline';
                }
            });
        });
    },
    
    loadDefaults: function() {
        const nameInput = document.getElementById('playerName');
        if (nameInput && !nameInput.value) {
            const defaultName = 'Player' + Math.floor(Math.random() * 1000);
            nameInput.value = defaultName;
            this.currentGame.playerName = defaultName;
        }
    },
    
    // FIXED: Image Upload Function
    handleImageUpload: function(file) {
        if (!file) {
            console.log('No file selected');
            return;
        }
        
        console.log('Image file selected:', file.name, file.type, file.size);
        
        const errorElement = document.getElementById('avatarError');
        if (errorElement) errorElement.style.display = 'none';
        
        // Check file size
        if (file.size > this.config.maxAvatarSize) {
            this.showError('Image too large (max 500KB)', 'avatarError');
            return;
        }
        
        // Check file type
        if (!file.type.match(/image\/(jpeg|jpg|png|gif|webp)/)) {
            this.showError('Invalid image format (use JPEG, PNG, GIF)', 'avatarError');
            return;
        }
        
        const reader = new FileReader();
        
        reader.onload = (e) => {
            console.log('Image loaded successfully');
            const img = new Image();
            img.onload = () => {
                console.log('Image dimensions:', img.width, 'x', img.height);
                const canvas = document.getElementById('avatarCanvas');
                if (!canvas) {
                    console.error('Canvas element not found');
                    return;
                }
                
                const ctx = canvas.getContext('2d');
                canvas.width = 120;
                canvas.height = 120;
                ctx.imageSmoothingEnabled = false;
                ctx.imageSmoothingQuality = 'low';
                
                // Clear canvas
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                
                // Draw image
                ctx.drawImage(img, 0, 0, 120, 120);
                
                // Show canvas, hide placeholder
                canvas.style.display = 'block';
                const placeholder = document.querySelector('.avatar-placeholder');
                if (placeholder) {
                    placeholder.style.display = 'none';
                }
                
                // Store base64 data
                this.currentGame.avatarBase64 = canvas.toDataURL('image/png', 0.8);
                console.log('Avatar saved as base64');
            };
            
            img.onerror = () => {
                console.error('Failed to load image');
                this.showError('Failed to load image', 'avatarError');
            };
            
            img.src = e.target.result;
        };
        
        reader.onerror = (error) => {
            console.error('FileReader error:', error);
            this.showError('Error reading file', 'avatarError');
        };
        
        reader.readAsDataURL(file);
    },
    
    // FIXED: Audio Upload Function
    handleAudioUpload: function(file, type) {
        if (!file) {
            console.log('No audio file selected');
            return;
        }
        
        console.log('Audio file selected:', type, file.name, file.type, file.size);
        
        const errorId = type + 'Error';
        const durationId = type + 'Duration';
        const errorElement = document.getElementById(errorId);
        const durationElement = document.getElementById(durationId);
        
        if (errorElement) errorElement.style.display = 'none';
        if (durationElement) durationElement.textContent = 'Processing...';
        
        // Check file size
        if (file.size > this.config.maxAudioSize) {
            this.showError('Audio too large (max 1MB)', errorId);
            if (durationElement) durationElement.textContent = 'ERROR';
            return;
        }
        
        // Check file type
        if (!file.type.match(/audio\/(mp3|mpeg|wav|ogg|webm)/)) {
            this.showError('Invalid audio format (use MP3, WAV, OGG)', errorId);
            if (durationElement) durationElement.textContent = 'ERROR';
            return;
        }
        
        const reader = new FileReader();
        
        reader.onload = (e) => {
            console.log('Audio loaded as base64');
            const audio = new Audio();
            audio.src = e.target.result;
            
            audio.addEventListener('loadedmetadata', () => {
                console.log('Audio duration:', audio.duration, 'seconds');
                
                // Check duration
                if (audio.duration > this.config.maxAudioDuration) {
                    this.showError(`Audio too long (${audio.duration.toFixed(1)}s, max 5s)`, errorId);
                    if (durationElement) durationElement.textContent = 'TOO LONG';
                    return;
                }
                
                // Store base64 data
                if (type === 'jump') {
                    this.currentGame.jumpSoundBase64 = e.target.result;
                } else {
                    this.currentGame.deathSoundBase64 = e.target.result;
                }
                
                // Update duration display
                if (durationElement) {
                    durationElement.textContent = `${audio.duration.toFixed(1)}s`;
                    durationElement.style.color = '#44ff44';
                }
                
                // Enable preview button
                const previewBtn = document.getElementById(`preview${type.charAt(0).toUpperCase() + type.slice(1)}`);
                if (previewBtn) {
                    previewBtn.disabled = false;
                }
                
                console.log(`${type} sound saved successfully`);
            });
            
            audio.addEventListener('error', (error) => {
                console.error('Audio loading error:', error);
                this.showError('Invalid audio file', errorId);
                if (durationElement) durationElement.textContent = 'ERROR';
            });
        };
        
        reader.onerror = (error) => {
            console.error('FileReader error:', error);
            this.showError('Error reading file', errorId);
            if (durationElement) durationElement.textContent = 'ERROR';
        };
        
        reader.readAsDataURL(file);
    },
    
    // FIXED: Audio Preview
    previewAudio: function(type) {
        console.log('Previewing audio:', type);
        
        const audioBase64 = type === 'jump' 
            ? this.currentGame.jumpSoundBase64 
            : this.currentGame.deathSoundBase64;
        
        if (!audioBase64) {
            console.log('No audio to preview');
            this.showMessage(`No ${type} sound uploaded`, 'error');
            return;
        }
        
        const audio = new Audio();
        audio.src = audioBase64;
        
        audio.onplay = () => {
            console.log('Audio playback started');
        };
        
        audio.onerror = (error) => {
            console.error('Audio playback error:', error);
            this.showMessage('Cannot play audio', 'error');
        };
        
        audio.onended = () => {
            console.log('Audio playback ended');
        };
        
        // Play audio
        const playPromise = audio.play();
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                console.error('Audio play() failed:', error);
                this.showMessage('Cannot preview audio', 'error');
            });
        }
    },
    
    // FIXED: Create Game
    createGame: function() {
        console.log('Creating game...');
        
        // Validate player name
        if (!this.currentGame.playerName || this.currentGame.playerName.trim().length === 0) {
            this.showMessage('Please enter a player name', 'error');
            return;
        }
        
        // Validate name length
        if (this.currentGame.playerName.length > 20) {
            this.showMessage('Player name too long (max 20 chars)', 'error');
            return;
        }
        
        console.log('Game data:', {
            playerName: this.currentGame.playerName,
            hasAvatar: !!this.currentGame.avatarBase64,
            hasJumpSound: !!this.currentGame.jumpSoundBase64,
            hasDeathSound: !!this.currentGame.deathSoundBase64,
            visibility: this.currentGame.visibility
        });
        
        // Generate game ID
        const gameId = this.generateGameId();
        
        // Create game config
        const gameConfig = {
            gameId: gameId,
            playerName: this.currentGame.playerName,
            avatarBase64: this.currentGame.avatarBase64,
            jumpSoundBase64: this.currentGame.jumpSoundBase64,
            deathSoundBase64: this.currentGame.deathSoundBase64,
            visibility: this.currentGame.visibility,
            createdAt: Date.now()
        };
        
        console.log('Saving game config:', gameConfig);
        
        // Show loading
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) {
            loadingOverlay.style.display = 'flex';
        }
        
        // Save game
        setTimeout(() => {
            const success = this.saveGame(gameConfig);
            if (success) {
                console.log('Game saved successfully, redirecting to play.html');
                window.location.href = `play.html?gameId=${gameId}`;
            } else {
                console.error('Failed to save game');
                if (loadingOverlay) {
                    loadingOverlay.style.display = 'none';
                }
                this.showMessage('Failed to save game', 'error');
            }
        }, 1000);
    },
    
    generateGameId: function() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < this.config.gameIdLength; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    },
    
    saveGame: function(gameConfig) {
        try {
            const allGames = JSON.parse(localStorage.getItem('dino_games_all')) || {};
            allGames[gameConfig.gameId] = gameConfig;
            localStorage.setItem('dino_games_all', JSON.stringify(allGames));
            localStorage.setItem(`dino_game_${gameConfig.gameId}`, JSON.stringify(gameConfig));
            console.log('Game saved to localStorage:', gameConfig.gameId);
            return true;
        } catch (error) {
            console.error('Error saving game to localStorage:', error);
            return false;
        }
    },
    
    showMyGames: function() {
        const games = this.loadGames();
        const myGames = Object.values(games);
        
        if (myGames.length === 0) {
            this.showMessage('No games found', 'warning');
            return;
        }
        
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.9);
            z-index: 1000;
            display: flex;
            justify-content: center;
            align-items: center;
            font-family: 'Press Start 2P', monospace;
        `;
        
        let content = `
            <div style="background: #2a2a2a; border: 4px solid #f0f0f0; padding: 30px; max-width: 600px; width: 90%; max-height: 80vh; overflow-y: auto;">
                <h2 style="color: #f0f0f0; margin-bottom: 20px; text-align: center;">MY GAMES</h2>
                <div style="margin-bottom: 20px;">
        `;
        
        myGames.forEach(game => {
            content += `
                <div style="background: #333; border: 2px solid #444; padding: 15px; margin-bottom: 10px; cursor: pointer;"
                     onclick="window.location.href='play.html?gameId=${game.gameId}'">
                    <div style="font-size: 12px; color: #f0f0f0;">${game.playerName}</div>
                    <div style="font-size: 9px; color: #888;">ID: ${game.gameId}</div>
                </div>
            `;
        });
        
        content += `
                </div>
                <button onclick="this.parentElement.parentElement.remove()" 
                        style="background: #444; border: 2px solid #666; color: #f0f0f0; padding: 10px 20px; font-family: inherit; cursor: pointer; width: 100%;">
                    CLOSE
                </button>
            </div>
        `;
        
        modal.innerHTML = content;
        document.body.appendChild(modal);
    },
    
    loadGames: function() {
        try {
            return JSON.parse(localStorage.getItem('dino_games_all')) || {};
        } catch (error) {
            console.error('Error loading games:', error);
            return {};
        }
    },
    
    showError: function(message, elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = message;
            element.style.display = 'block';
            element.style.color = '#ff4444';
        }
    },
    
    showMessage: function(message, type = 'info') {
        const messageElement = document.createElement('div');
        messageElement.textContent = message;
        messageElement.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #2a2a2a;
            border: 3px solid ${type === 'error' ? '#ff4444' : type === 'success' ? '#44ff44' : '#ffaa44'};
            color: #f0f0f0;
            padding: 15px;
            font-family: 'Press Start 2P', monospace;
            font-size: 10px;
            z-index: 1000;
            max-width: 300px;
            box-shadow: 4px 4px 0px #000;
        `;
        
        document.body.appendChild(messageElement);
        setTimeout(() => {
            if (messageElement.parentElement) {
                messageElement.parentElement.removeChild(messageElement);
            }
        }, 3000);
    }
};