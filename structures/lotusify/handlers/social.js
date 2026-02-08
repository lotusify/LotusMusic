/**
 * Social interaction handlers (block, queue, clear)
 */

async function handleBlock(client, interaction, player, track, requesterId) {
    await interaction.deferUpdate();
    
    const { blockTrack } = require('../autoplay');
    const trackTitle = track.info?.title || track.title || 'Unknown';
    const trackUri = track.info?.uri || track.uri;
    
    blockTrack(requesterId, trackUri, trackTitle);
    
    return interaction.followUp({ 
        content: `🚫 Blocked "${trackTitle}" from autoplay.`, 
        flags: ['Ephemeral'] 
    });
}

async function handleQueue(client, interaction, player) {
    await interaction.deferUpdate();
    
    if (player.queue.length === 0) {
        return interaction.followUp({ 
            content: '❌ Queue is empty.', 
            flags: ['Ephemeral'] 
        });
    }
    
    const queue = player.queue.slice(0, 10).map((track, i) => {
        const title = track.info?.title || track.title || 'Unknown';
        return `${i + 1}. ${title}`;
    }).join('\n');
    
    const totalTracks = player.queue.length;
    const showing = Math.min(10, totalTracks);
    
    return interaction.followUp({ 
        content: `**Queue (${showing}/${totalTracks}):**\n${queue}`, 
        flags: ['Ephemeral'] 
    });
}

async function handleClear(client, interaction, player) {
    await interaction.deferUpdate();
    
    if (player.queue.length === 0) {
        return interaction.followUp({ 
            content: '❌ Queue is already empty.', 
            flags: ['Ephemeral'] 
        });
    }
    
    player.queue.clear();
    
    return interaction.followUp({ 
        content: '🗑️ Queue cleared.', 
        flags: ['Ephemeral'] 
    });
}

module.exports = {
    handleBlock,
    handleQueue,
    handleClear
};
