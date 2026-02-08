/**
 * Lotusify Autoplay Module
 * 
 * 2-Layer Autoplay System:
 * - Layer 1: YTMusicAPI RDAMVM (personalized, 200 tracks/batch)
 * - Layer 2: Riffy YouTube Mix (fallback)
 */

const storage = require('./storage');
const ytmusicRadio = require('./lib/radio');

// Guild-based cache: guildId -> { tracks: [], index: 0, seed: null }
const cache = new Map();

/**
 * Check if autoplay is enabled for a guild
 */
function isAutoplayEnabled(guildId) {
    return storage.getAutoplay(guildId);
}

/**
 * Toggle autoplay for a guild
 */
function toggleAutoplay(guildId) {
    const current = storage.getAutoplay(guildId);
    storage.setAutoplay(guildId, !current);
    return !current;
}

/**
 * Block a track from autoplay for a guild
 */
function blockTrack(guildId, trackUri, trackTitle) {
    storage.addBlockedTrack(guildId, trackUri);
    console.log(`[Autoplay] Guild ${guildId} blocked: ${trackTitle}`);
}

/**
 * Check if a track is blocked for a guild
 */
function isTrackBlocked(guildId, trackUri) {
    const blockedTracks = storage.getBlockedTracks(guildId);
    return blockedTracks.includes(trackUri);
}

/**
 * Get blocked tracks for a guild
 */
function getBlockedTracks(guildId) {
    return storage.getBlockedTracks(guildId);
}

/**
 * Clear all blocked tracks for a guild
 */
function clearBlockedTracks(guildId) {
    storage.clearBlockedTracks(guildId);
}

/**
 * Reset autoplay cache for a guild and clear autoplay tracks from queue
 * @param {string} guildId - Guild ID
 * @param {Object} client - Discord client (optional, for clearing queue)
 */
function resetCache(guildId, client = null) {
    if (cache.has(guildId)) {
        console.log(`[Autoplay] Resetting cache for guild ${guildId}`);
        cache.delete(guildId);
    }
    
    // Also clear autoplay tracks from queue if client is provided
    if (client && client.riffy) {
        const player = client.riffy.players.get(guildId);
        if (player && player.queue) {
            // Remove all autoplay tracks from queue (tracks with isAutoplay flag)
            // This works for both Layer 1 (YTMusic) and Layer 2 (Riffy) autoplay
            const originalLength = player.queue.length;
            player.queue = player.queue.filter(track => !track.isAutoplay);
            const removed = originalLength - player.queue.length;
            
            if (removed > 0) {
                console.log(`[Autoplay] Cleared ${removed} autoplay track(s) from queue`);
            }
        }
    }
}

/**
 * Extract video ID from track
 */
function getVideoId(track) {
    // Try identifier first (most reliable)
    if (track.info?.identifier) return track.info.identifier;
    if (track.identifier) return track.identifier;
    
    // Try URI parsing
    const uri = track.info?.uri || track.uri;
    if (uri) {
        const match = uri.match(/(?:v=|\/)([\w-]{11})/);
        if (match) return match[1];
    }
    
    return null;
}

/**
 * Layer 1: Try YTMusicAPI RDAMVM
 */
async function tryYTMusicAutoplay(client, player, currentTrack) {
    const guildId = player.guildId;
    
    // Get or create cache state
    let state = cache.get(guildId);
    if (!state) {
        state = { tracks: [], index: 0, seed: null };
        cache.set(guildId, state);
    }
    
    // Fetch new batch if needed
    if (state.tracks.length === 0 || state.index >= state.tracks.length) {
        const videoId = getVideoId(currentTrack);
        if (!videoId) throw new Error('No video ID available');
        
        console.log(`[Autoplay] Fetching YTMusic radio for ${videoId}...`);
        const result = await ytmusicRadio.getRadioTracks(videoId, 200);
        
        if (!result.success || !result.tracks || result.tracks.length === 0) {
            throw new Error('Empty recommendations from YTMusic');
        }
        
        // Filter blocked tracks
        const blockedTracks = getBlockedTracks(guildId);
        let filtered = result.tracks.filter(t => !blockedTracks.includes(t.videoId));
        
        // Skip seed if it's the first track
        if (filtered.length > 0 && filtered[0].videoId === videoId) {
            filtered = filtered.slice(1);
        }
        
        state.tracks = filtered.length > 0 ? filtered : result.tracks;
        state.index = 0;
        state.seed = videoId;
        
        console.log(`[Autoplay] Cached ${state.tracks.length} tracks from YTMusic`);
        
        // Log first 10 tracks for debugging
        const preview = state.tracks.slice(0, 10).map((t, i) => 
            `${i + 1}. ${t.artist} - ${t.title}`
        ).join('\n');
        console.log(`[Autoplay] Next 10 tracks:\n${preview}`);
    }
    
    // Get next track from cache
    if (state.tracks.length > 0 && state.index < state.tracks.length) {
        const nextTrack = state.tracks[state.index];
        state.index++;
        
        console.log(`[Autoplay] Layer 1 (YTMusic): ${nextTrack.artist} - ${nextTrack.title}`);
        
        const trackUrl = `https://www.youtube.com/watch?v=${nextTrack.videoId}`;
        
        // Search and add track
        const result = await client.riffy.resolve({
            query: trackUrl,
            source: 'ytmsearch',
            requester: client.user  // Use client.user for autoplay tracks
        });
        
        if (result && result.tracks && result.tracks.length > 0) {
            const track = result.tracks[0];
            
            // Override with YTMusic metadata for better accuracy
            // YouTube often returns channel names like "Artist - Topic" instead of actual artist
            if (track.info) {
                track.info.title = nextTrack.title;
                track.info.author = nextTrack.artist;
            }
            
            // Set isAutoplay flag to sync with Riffy's approach
            Object.defineProperty(track, 'isAutoplay', {
                writable: false,
                enumerable: true,
                value: true
            });
            
            player.queue.push(track);
            
            if (!player.playing) {
                await player.play();
            }
            
            return true;
        }
    }
    
    throw new Error('No tracks available from YTMusic');
}

/**
 * Layer 2: Fallback to Riffy YouTube Mix
 */
async function fallbackToRiffy(player) {
    console.log(`[Autoplay] Layer 2 (Riffy YouTube Mix)`);
    
    // CRITICAL: Riffy only recognizes 'youtube' source, not 'ytmusic'
    // Convert ytmusic → youtube for compatibility
    if (player.previous?.info?.sourceName === 'ytmusic') {
        player.previous.info.sourceName = 'youtube';
    }
    
    // CRITICAL: Riffy checks player.isAutoplay internally
    player.isAutoplay = true;
    
    try {
        await player.autoplay(player);
        console.log(`[Autoplay] Riffy fallback completed`);
        return true;
    } catch (error) {
        console.error(`[Autoplay] Riffy autoplay error:`, error);
        throw error;
    }
}

/**
 * Execute autoplay algorithm with 2-layer fallback
 */
async function executeAutoplay(client, player) {
    const currentTrack = player.previous || player.current;
    
    if (!currentTrack) {
        console.log(`[Autoplay] No previous track, using Riffy fallback`);
        return await fallbackToRiffy(player);
    }
    
    // Layer 1: Try YTMusicAPI
    try {
        return await tryYTMusicAutoplay(client, player, currentTrack);
    } catch (error) {
        console.log(`[Autoplay] YTMusic failed: ${error.message}, falling back to Riffy`);
        
        // Layer 2: Fallback to Riffy
        try {
            return await fallbackToRiffy(player);
        } catch (fallbackError) {
            console.error(`[Autoplay] All layers failed:`, fallbackError);
            throw fallbackError;
        }
    }
}

/**
 * Handle queue end with autoplay logic
 */
async function handleQueueEnd(client, player) {
    const guildId = player.guildId;
    
    // Delete current player message
    if (player.message) {
        await player.message.delete().catch(() => {});
    }
    
    // Sync player.isAutoplay with storage
    const isEnabled = isAutoplayEnabled(guildId);
    player.isAutoplay = isEnabled;
    
    if (isEnabled) {
        console.log(`[Autoplay] Queue ended, fetching next track...`);
        try {
            await executeAutoplay(client, player);
        } catch (error) {
            console.error(`[Autoplay] Failed to fetch next track:`, error);
            player.destroy();
        }
    } else {
        // Standard cleanup when queue ends
        player.destroy();
        const channel = client.channels.cache.get(player.textChannel);
        if (channel) {
            await channel.send("Queue has ended.");
        }
    }
}

module.exports = {
    // State management
    isAutoplayEnabled,
    toggleAutoplay,
    
    // Block management
    blockTrack,
    isTrackBlocked,
    getBlockedTracks,
    clearBlockedTracks,
    
    // Cache management
    resetCache,
    
    // Autoplay execution
    executeAutoplay,
    handleQueueEnd
};
