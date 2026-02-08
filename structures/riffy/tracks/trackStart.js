const { createEmbed, createButtons } = require('../../lotusify');
const { scheduleNextUpdate } = require('../../lotusify/updater');
const client = require("../../client")

client.riffy.on('trackStart', async (player, track) => {
    const channel = client.channels.cache.get(player.textChannel);

    const msg = await channel
        .send({
            embeds: [createEmbed(client, player, track)],
            components: createButtons(client, player, track)
        })
        .then((x) => (player.message = x));

    // Start auto-update scheduler for progress bar
    scheduleNextUpdate(client, player, track);
});