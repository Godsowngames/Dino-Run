// ADD THESE PATCHES TO YOUR EXISTING script.js FILE:

// === ADD AT THE BEGINNING OF script.js ===
// Custom Game Config - Add after showTime function
window.CustomDinoConfig = window.CustomDinoConfig || {
    jumpSound: null,
    deathSound: null,
    playerName: 'Player',
    avatar: null,
    isLoaded: false
};

// Helper function to decode audio
Runner.prototype.decodeAudioDataFromBase64 = function(base64Data, soundType) {
    return new Promise((resolve, reject) => {
        try {
            var soundSrc = base64Data;
            if (soundSrc.indexOf('base64,') !== -1) {
                soundSrc = soundSrc.substr(soundSrc.indexOf(',') + 1);
            }
            
            var buffer = decodeBase64ToArrayBuffer(soundSrc);
            this.audioContext.decodeAudioData(buffer, 
                function(audioData) {
                    this.soundFx[soundType] = audioData;
                    resolve();
                }.bind(this, soundType),
                function(error) {
                    console.warn('Failed to decode custom sound:', soundType, error);
                    resolve();
                }
            );
        } catch (error) {
            console.warn('Error processing custom sound:', soundType, error);
            resolve();
        }
    });
};

// === REPLACE Runner.prototype.loadSounds ===
/**
 * Load and decode base 64 encoded sounds.
 */
Runner.prototype.loadSounds = function() {
    if (!IS_IOS) {
        this.audioContext = new AudioContext();
        var resourceTemplate =
            document.getElementById(this.config.RESOURCE_TEMPLATE_ID).content;
        
        // Check for custom sounds
        if (window.CustomDinoConfig && window.CustomDinoConfig.isLoaded) {
            var soundPromises = [];
            
            if (window.CustomDinoConfig.jumpSound) {
                soundPromises.push(this.decodeAudioDataFromBase64(
                    window.CustomDinoConfig.jumpSound, 
                    'BUTTON_PRESS'
                ));
            }
            
            if (window.CustomDinoConfig.deathSound) {
                soundPromises.push(this.decodeAudioDataFromBase64(
                    window.CustomDinoConfig.deathSound, 
                    'HIT'
                ));
            }
            
            // Wait for custom sounds, then load defaults
            Promise.allSettled(soundPromises).then(() => {
                this.loadDefaultSounds(resourceTemplate);
            });
        } else {
            this.loadDefaultSounds(resourceTemplate);
        }
    }
};

// Add helper method for default sounds
Runner.prototype.loadDefaultSounds = function(resourceTemplate) {
    for (var sound in Runner.sounds) {
        if (this.soundFx[sound]) continue;
        
        var soundSrc =
            resourceTemplate.getElementById(Runner.sounds[sound]).src;
        soundSrc = soundSrc.substr(soundSrc.indexOf(',') + 1);
        var buffer = decodeBase64ToArrayBuffer(soundSrc);
        this.audioContext.decodeAudioData(buffer, function(index, audioData) {
            this.soundFx[index] = audioData;
        }.bind(this, sound));
    }
};

// === OPTIONAL: Add player info display ===
Runner.prototype.updatePlayerInfo = function() {
    if (window.CustomDinoConfig && window.CustomDinoConfig.isLoaded) {
        var playerInfo = document.getElementById('custom-player-info');
        if (!playerInfo) {
            playerInfo = document.createElement('div');
            playerInfo.id = 'custom-player-info';
            playerInfo.style.cssText = `
                position: absolute;
                top: 10px;
                left: 10px;
                font-family: 'Press Start 2P', monospace;
                font-size: 10px;
                color: #f0f0f0;
                text-shadow: 2px 2px 0 #000;
                z-index: 100;
                background: rgba(0,0,0,0.5);
                padding: 5px 10px;
                border: 2px solid #f0f0f0;
                border-radius: 0;
                display: flex;
                align-items: center;
                gap: 10px;
            `;
            
            if (window.CustomDinoConfig.avatar) {
                var avatarImg = document.createElement('img');
                avatarImg.src = window.CustomDinoConfig.avatar;
                avatarImg.style.cssText = `
                    width: 24px;
                    height: 24px;
                    image-rendering: pixelated;
                    border: 1px solid #f0f0f0;
                `;
                playerInfo.appendChild(avatarImg);
            }
            
            var nameSpan = document.createElement('span');
            nameSpan.textContent = window.CustomDinoConfig.playerName;
            playerInfo.appendChild(nameSpan);
            
            if (this.containerEl) {
                this.containerEl.insertBefore(playerInfo, this.containerEl.firstChild);
            }
        }
    }
};

// === ADD TO Runner.prototype.init ===
// Find this line in init function:
// this.outerContainerEl.appendChild(this.containerEl);
// Add after it:
setTimeout(function() {
    this.updatePlayerInfo();
}.bind(this), 100);
function showTime() {
	document.getElementById('currentTime').innerHTML = new Date().toUTCString();
}
showTime();
setInterval(function () {
	showTime();
}, 1000);