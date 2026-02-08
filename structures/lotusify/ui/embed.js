const { EmbedBuilder } = require('discord.js');

/**
 * Format time in MM:SS format
 * @param {number} ms - Time in milliseconds
 * @param {boolean} roundToNearest5 - Whether to round to nearest 5 seconds (for progress updates)
 */
function formatTime(ms, roundToNearest5 = false) {
    let seconds;
    
    if (roundToNearest5) {
        // Round to nearest 5 seconds for smoother progress updates
        const roundedMs = Math.round(ms / 5000) * 5000;
        seconds = Math.floor(roundedMs / 1000);
    } else {
        // Use exact time (for total duration)
        seconds = Math.floor(ms / 1000);
    }
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

/**
 * Create progress bar
 */
function createProgressBar(current, total, length = 15) {
    if (total === 0) return '▬'.repeat(length);
    
    const progress = Math.min(current / total, 1);
    const filled = Math.floor(progress * length);
    const empty = length - filled;
    
    return '▬'.repeat(filled) + '🔘' + '▬'.repeat(empty);
}

/**
 * Create Now Playing embed (simple, no musicard)
 * @param {Object} client - Discord client
 * @param {Object} player - Riffy player
 * @param {Object} track - Current track
 * @returns {EmbedBuilder} Discord embed
 */
function createEmbed(client, player, track) {
    const currentTrack = player.queue?.current || track;
    const title = currentTrack.info?.title || currentTrack.title || 'Unknown';
    const author = currentTrack.info?.author || currentTrack.author || 'Unknown';
    const thumbnail = currentTrack.info?.thumbnail || currentTrack.thumbnail || currentTrack.artworkUrl;
    const uri = currentTrack.info?.uri || currentTrack.uri;
    const duration = currentTrack.info?.length || currentTrack.duration || 0;
    const isStream = currentTrack.info?.isStream || currentTrack.isStream || false;
    
    const position = player.position || 0;
    const progressBar = isStream ? '🔴 LIVE' : createProgressBar(position, duration);
    const currentTime = formatTime(position, true);  // Round progress for smooth updates
    const totalTime = isStream ? 'LIVE' : formatTime(duration, false);  // Keep exact duration

    
    
    // Get requester from track.info.requester (where it's actually stored)
    const requester = currentTrack.info?.requester || track.info?.requester;
    let requesterText = 'Autoplay';
    
    // Check if track is autoplay (Riffy sets track.isAutoplay flag)
    // This works for both custom YTMusic autoplay and Riffy's native autoplay
    const isAutoplay = currentTrack.isAutoplay || track.isAutoplay;
    
    if (!isAutoplay && requester && typeof requester === 'object') {
        // Not autoplay and has valid requester, show user
        if (requester.id) {
            requesterText = `<@${requester.id}>`;
        } else if (requester.username) {
            requesterText = requester.username;
        } else if (requester.tag) {
            requesterText = requester.tag;
        }
    }
    
    
    const embed = new EmbedBuilder()
        .setAuthor({ name: player.paused ? '⏸️ Paused' : '🎵 Now Playing' })
        .setColor('#FF6B9D') // Orange-pink to match bot avatar
        .setThumbnail(thumbnail)
        .setDescription(`**[${title}](${uri})**\n\n${currentTime} ${progressBar} ${totalTime}`)
        .addFields(
            { name: 'Artist', value: author, inline: true },
            { name: 'Duration', value: `\`${totalTime}\``, inline: true },
            { name: 'Added by', value: requesterText, inline: true }
        );
    
    return embed;
}

module.exports = {
    createEmbed,
    formatTime,
    createProgressBar
};
