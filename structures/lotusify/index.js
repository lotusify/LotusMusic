/**
 * Lotusify Module - Central Export
 * All UI components and handlers for customization
 */

// UI Components
const { createEmbed, formatTime, createProgressBar } = require('./ui/embed');
const { createButtons } = require('./ui/buttons');

// Handlers
const playback = require('./handlers/playback');
const social = require('./handlers/social');
const advanced = require('./handlers/advanced');

module.exports = {
    // UI
    createEmbed,
    createButtons,
    formatTime,
    createProgressBar,
    
    // Playback Handlers
    ...playback,
    
    // Social Handlers
    ...social,
    
    // Advanced Handlers
    ...advanced
};
