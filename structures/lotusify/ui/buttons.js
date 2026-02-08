const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

/**
 * Create button components for player controls
 * @param {Object} client - Discord client
 * @param {Object} player - Riffy player
 * @param {Object} track - Current track
 * @returns {Array<ActionRowBuilder>} Array of button rows
 */
function createButtons(client, player, track) {
    const isPaused = player.paused || false;
    const hasPrevious = player.queue?.previous?.length > 0;
    const hasQueue = player.queue?.length > 0;
    
    // Check autoplay status for Skip button
    const storage = require('../storage');
    const guildId = player.guildId;
    const isAutoplayEnabled = storage.getAutoplay(guildId);
    
    // Row 1: Prev, Pause, Skip, Replay, Leave
    const row1 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('prev')
            .setLabel('Prev')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(!hasPrevious),
        new ButtonBuilder()
            .setCustomId(isPaused ? 'play' : 'pause')
            .setLabel(isPaused ? 'Resume' : 'Pause')
            .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
            .setCustomId('skip')
            .setLabel('Skip')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(!hasQueue && !isAutoplayEnabled), // Enable if queue has songs OR autoplay is on
        new ButtonBuilder()
            .setCustomId('replay')
            .setLabel('Replay')
            .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
            .setCustomId('disconnect')
            .setLabel('Leave')
            .setStyle(ButtonStyle.Danger)
    );
    
    // Row 2: Loop, Autoplay, Queue, Filter, Lyrics
    let loopLabel = 'Loop';
    if (player.loop === 'track') loopLabel = 'Loop: Track';
    else if (player.loop === 'queue') loopLabel = 'Loop: Queue';
    
    const row2 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('loop')
            .setLabel(loopLabel)
            .setStyle(player.loop !== 'none' ? ButtonStyle.Success : ButtonStyle.Secondary),
        new ButtonBuilder()
            .setCustomId('toggle_autoplay')
            .setLabel('Autoplay')
            .setStyle(isAutoplayEnabled ? ButtonStyle.Success : ButtonStyle.Secondary),
        new ButtonBuilder()
            .setCustomId('queue')
            .setLabel('Queue')
            .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
            .setCustomId('filter')
            .setLabel('Filter')
            .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
            .setCustomId('lyrics')
            .setLabel('Lyrics')
            .setStyle(ButtonStyle.Secondary)
    );
    
    return [row1, row2];
}

module.exports = {
    createButtons
};
