/**
 * Basic playback control handlers
 */

async function handlePause(client, interaction, player, track, requesterId) {
    await interaction.deferUpdate();
    
    if (player.paused) {
        player.pause(false);
    } else {
        player.pause(true);
    }
    
    // Update message will be handled by the button event handler
}

async function handleSkip(client, interaction, player, track) {
    await interaction.deferUpdate();
    
    // Check if autoplay is enabled
    const { isAutoplayEnabled } = require('../autoplay');
    const isAutoplay = isAutoplayEnabled(player.guildId);
    
    // If queue is empty and autoplay is off, show error
    if (player.queue.length === 0 && !isAutoplay) {
        return interaction.followUp({ 
            content: '❌ No more songs in queue.', 
            flags: ['Ephemeral'] 
        });
    }
    
    // If queue is empty but autoplay is on, stop current track to trigger queueEnd
    if (player.queue.length === 0 && isAutoplay) {
        player.stop(); // This will trigger queueEnd event which handles autoplay
        return;
    }
    
    // Normal skip if queue has songs
    player.stop();
}

async function handlePrev(interaction, player) {
    await interaction.deferUpdate();
    
    if (!player.queue.previous || player.queue.previous.length === 0) {
        return interaction.followUp({ 
            content: '❌ No previous song.', 
            flags: ['Ephemeral'] 
        });
    }
    
    player.previous();
}

async function handleStop(client, interaction, player) {
    await interaction.deferUpdate();
    
    player.destroy();
    
    return interaction.followUp({ 
        content: '⏹️ Stopped and disconnected.', 
        flags: ['Ephemeral'] 
    });
}

async function handleShuffle(client, interaction, player, track) {
    await interaction.deferUpdate();
    
    if (player.queue.length === 0) {
        return interaction.followUp({ 
            content: '❌ Queue is empty.', 
            flags: ['Ephemeral'] 
        });
    }
    
    player.setShuffle(!player.shuffle);
    
    return interaction.followUp({ 
        content: player.shuffle ? '🔀 Shuffle enabled.' : '🔀 Shuffle disabled.', 
        flags: ['Ephemeral'] 
    });
}

async function handleLoop(client, interaction, player, track, requesterId) {
    await interaction.deferUpdate();
    
    const modes = ['none', 'song', 'queue'];
    const currentIndex = modes.indexOf(player.loop);
    const nextMode = modes[(currentIndex + 1) % modes.length];
    
    player.setLoop(nextMode);
    
    let message = '🔁 Loop disabled.';
    if (nextMode === 'song') message = '🔂 Looping current track.';
    else if (nextMode === 'queue') message = '🔁 Looping queue.';
    
    return interaction.followUp({ 
        content: message, 
        flags: ['Ephemeral'] 
    });
}

async function handleReplay(client, player, track, requesterId, interaction) {
    await interaction.deferUpdate();
    
    player.seek(0);
    
    return interaction.followUp({ 
        content: '⏮️ Replaying from start.', 
        flags: ['Ephemeral'] 
    });
}

module.exports = {
    handlePause,
    handleSkip,
    handlePrev,
    handleStop,
    handleShuffle,
    handleLoop,
    handleReplay
};
