const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");

class YTMusicRadioWrapper {
    constructor() {
        this.scriptPath = path.join(__dirname, "radio.py");
        this.authPath = path.join(__dirname, "auth.json");
    }

    /**
     * Get YouTube Music radio tracks
     * @param {string} videoId - YouTube video ID
     * @param {number} limit - Max tracks to fetch (default 200)
     * @returns {Promise<Object>} Result object {success, total, tracks, source}
     */
    async getRadioTracks(videoId, limit = 200) {
        // Check for auth file (non-blocking info)
        if (!fs.existsSync(this.authPath)) {
            console.log('[YTMusicRadio] ℹ️ auth.json not found, will use unauthenticated mode (may have limited results)');
        }

        return new Promise((resolve, reject) => {
            const pythonCommand = process.platform === "win32" ? "python" : "python3";
            // Arguments: [script, videoId, limit]
            const args = [this.scriptPath, videoId, limit.toString()];

            const proc = spawn(pythonCommand, args, {
                env: process.env,
            });

            let dataString = "";
            let errorString = "";

            proc.stdout.on("data", (data) => {
                dataString += data.toString();
            });

            proc.stderr.on("data", (data) => {
                errorString += data.toString();
            });

            proc.on("close", (code) => {
                if (code !== 0) {
                    console.error(`[YTMusicRadio] Python error: ${errorString}`);
                    reject(new Error(`Python script failed with code ${code}`));
                    return;
                }

                try {
                    const result = JSON.parse(dataString);

                    if (!result.success) {
                        reject(new Error(result.error || "Unknown error"));
                        return;
                    }
                    
                    // Normalize result to match old wrapper expectation
                    // Old wrapper expected: { success, total, tracks, source, anchor(optional) }
                    resolve(result);
                } catch (error) {
                    console.error(`[YTMusicRadio] Parse error: ${error.message}`);
                    console.error(`[YTMusicRadio] Raw output: ${dataString.substring(0, 100)}...`);
                    reject(error);
                }
            });
        });
    }

    /**
     * Filter tracks by dedup, dislike, and blacklist
     * (Preserved from old wrapper)
     * @param {Array} tracks - Array of tracks
     * @param {Array} dedupHistory - Recently played tracks
     * @param {Array} dislikedTracks - User disliked tracks
     * @param {Array} blacklist - Blacklisted artists/tracks
     * @returns {Array} Filtered tracks
     */
    filterTracks(tracks, dedupHistory = [], dislikedTracks = [], blacklist = []) {
        // Helper to normalize artist (strip "- Topic")
        const normalizeArtist = (artist) => (artist ? artist.replace(/\s*-\s*Topic\s*$/i, "").trim() : "");

        return tracks.filter((track) => {
            const normalizedArtist = normalizeArtist(track.artist).toLowerCase();
            const normalizedTitle = track.title.toLowerCase();

            // 0. Duration & Basic Integrity Check
            if (track.duration && (track.duration < 30 || track.duration > 1200)) return false;

            // 1. Keyword Blocklist
            const blockedKeywords = [
                "tutorial", "lesson", "course", "learn", "learning", "podcast", "interview", "talk",
                "speech", "lecture", "review", "unboxing", "reaction", "gameplay", "full movie",
                "full album", "full episode", "documentary", "how to", "guide", "tips", "tricks",
                "vlog", "practice", "exercise", "workout", "meditation", "asmr", "story",
                "audiobook", "mix |", "compilation"
            ];

            if (blockedKeywords.some((keyword) => normalizedTitle.includes(keyword))) {
                return false;
            }

            // 2. Heuristic Quality Check (Spam/Low Quality)
            const emojiCount = (track.title.match(/[\u{1F300}-\u{1F9FF}]/gu) || []).length;
            const bracketCount = (track.title.match(/[\[\]【】]/g) || []).length;
            if (emojiCount > 3 || bracketCount > 4) return false;

            // 3. Check dedup (videoId-based with text fallback)
            const isDuplicate = dedupHistory.some((h) => {
                if (track.videoId && h.videoId) return h.videoId === track.videoId;
                return normalizeArtist(h.artist).toLowerCase() === normalizedArtist && h.title.toLowerCase() === normalizedTitle;
            });
            if (isDuplicate) return false;

            // 4. Check dislike
            const isDisliked = dislikedTracks.some(
                (d) =>
                    d.videoId === track.videoId ||
                    (normalizeArtist(d.artist).toLowerCase() === normalizedArtist && d.title.toLowerCase() === normalizedTitle),
            );
            if (isDisliked) return false;

            // 5. Check blacklist
            const isBlacklisted = blacklist.some((b) => {
                const blacklistArtist = normalizeArtist(b.artist).toLowerCase();
                return blacklistArtist === normalizedArtist || normalizedArtist.includes(blacklistArtist);
            });
            if (isBlacklisted) return false;

            return true;
        });
    }
}

module.exports = new YTMusicRadioWrapper();
