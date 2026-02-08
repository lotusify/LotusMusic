/**
 * Lotusify UI Updater
 * Handles periodic embed updates to show live progress
 */

const { createEmbed, createButtons } = require('./index');

/**
 * Schedule next UI update for progress bar
 * Updates every 5 seconds to show live playback progress
 */
function scheduleNextUpdate(client, player, track) {
    // Clear any existing timeout
    if (player._updateTimeout) {
        clearTimeout(player._updateTimeout);
        player._updateTimeout = null;
    }

    // Don't schedule updates for streams or stopped players
    if (!player || !player.playing || track.isStream) return;

    const currentPos = player.position || 0;
    const trackDuration = track.duration;
    const timeRemaining = trackDuration - currentPos;

    if (timeRemaining <= 0) return;

    // Update every 5 seconds (display time is rounded in embed.js)
    const intervalStep = 5000;
    let delay = intervalStep;

    // Don't schedule beyond track end
    let finalDelay = delay;
    let isFinalUpdate = false;

    if (currentPos + delay >= trackDuration) {
        finalDelay = Math.max(timeRemaining - 500, 100);
        isFinalUpdate = true;
    }

    const newTimeout = setTimeout(async () => {
        if (!player || !player.playing) return;
        if (player.queue.current?.uri !== track.uri) return;

        // Update message with new progress
        await updateMessage(client, player, track);

        // Schedule next update if not final
        if (!isFinalUpdate) {
            scheduleNextUpdate(client, player, track);
        }
    }, finalDelay);

    // Store timeout on player object
    player._updateTimeout = newTimeout;
}

/**
 * Update the now playing message with current progress
 */
async function updateMessage(client, player, track) {
    try {
        if (!player.message) return;

        await player.message.edit({
            embeds: [createEmbed(client, player, track)],
            components: createButtons(client, player, track)
        });
    } catch (error) {
        // Message might be deleted, ignore
        if (error.code !== 10008) {
            console.error('[Updater] Error updating message:', error);
        }
    }
}

/**
 * Clear update scheduler for a player
 */
function clearUpdateScheduler(player) {
    if (player._updateTimeout) {
        clearTimeout(player._updateTimeout);
        player._updateTimeout = null;
    }
}

module.exports = {
    scheduleNextUpdate,
    updateMessage,
    clearUpdateScheduler
};
