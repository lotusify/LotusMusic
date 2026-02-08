const client = require("../../client");
const { clearUpdateScheduler } = require('../../lotusify/updater');

client.riffy.on('trackEnd', async (player, track) => {
    // Clear update scheduler when track ends
    clearUpdateScheduler(player);
});