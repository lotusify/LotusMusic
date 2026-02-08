const fs = require('fs');
const path = require('path');

const STORAGE_PATH = path.join(__dirname, '../../lotusmusic.json');

/**
 * Simple JSON storage for guild settings
 * Structure:
 * {
 *   "guilds": {
 *     "guildId": {
 *       "autoplay": true/false,
 *       "247": true/false,
 *       "blockedTracks": ["trackUri1", "trackUri2"]
 *     }
 *   }
 * }
 */

// Initialize storage file if it doesn't exist
function initStorage() {
    if (!fs.existsSync(STORAGE_PATH)) {
        const defaultData = {
            guilds: {}
        };
        fs.writeFileSync(STORAGE_PATH, JSON.stringify(defaultData, null, 2));
    }
}

// Read storage
function readStorage() {
    try {
        initStorage();
        const data = fs.readFileSync(STORAGE_PATH, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('[Storage] Error reading storage:', error);
        return { guilds: {} };
    }
}

// Write storage
function writeStorage(data) {
    try {
        fs.writeFileSync(STORAGE_PATH, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('[Storage] Error writing storage:', error);
    }
}

// Get guild settings
function getGuildSettings(guildId) {
    const storage = readStorage();
    return storage.guilds[guildId] || {
        autoplay: false,
        247: false,
        blockedTracks: []
    };
}

// Set guild setting
function setGuildSetting(guildId, key, value) {
    const storage = readStorage();
    
    if (!storage.guilds[guildId]) {
        storage.guilds[guildId] = {
            autoplay: false,
            247: false,
            blockedTracks: []
        };
    }
    
    storage.guilds[guildId][key] = value;
    writeStorage(storage);
}

// Get autoplay status
function getAutoplay(guildId) {
    const settings = getGuildSettings(guildId);
    return settings.autoplay || false;
}

// Set autoplay status
function setAutoplay(guildId, enabled) {
    setGuildSetting(guildId, 'autoplay', enabled);
}

// Get 24/7 status
function get247(guildId) {
    const settings = getGuildSettings(guildId);
    return settings['247'] || false;
}

// Set 24/7 status
function set247(guildId, enabled) {
    setGuildSetting(guildId, '247', enabled);
}

// Get blocked tracks
function getBlockedTracks(guildId) {
    const settings = getGuildSettings(guildId);
    return settings.blockedTracks || [];
}

// Add blocked track
function addBlockedTrack(guildId, trackUri) {
    const settings = getGuildSettings(guildId);
    if (!settings.blockedTracks) {
        settings.blockedTracks = [];
    }
    
    if (!settings.blockedTracks.includes(trackUri)) {
        settings.blockedTracks.push(trackUri);
        setGuildSetting(guildId, 'blockedTracks', settings.blockedTracks);
    }
}

// Remove blocked track
function removeBlockedTrack(guildId, trackUri) {
    const settings = getGuildSettings(guildId);
    if (settings.blockedTracks) {
        settings.blockedTracks = settings.blockedTracks.filter(uri => uri !== trackUri);
        setGuildSetting(guildId, 'blockedTracks', settings.blockedTracks);
    }
}

// Clear all blocked tracks
function clearBlockedTracks(guildId) {
    setGuildSetting(guildId, 'blockedTracks', []);
}

module.exports = {
    getGuildSettings,
    setGuildSetting,
    getAutoplay,
    setAutoplay,
    get247,
    set247,
    getBlockedTracks,
    addBlockedTrack,
    removeBlockedTrack,
    clearBlockedTracks
};
