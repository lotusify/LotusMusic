const client = require("../../client");
const { handleQueueEnd } = require('../../lotusify/autoplay');

client.riffy.on("queueEnd", async (player) => {
    // Use Lotusify's autoplay handler (YTMusic + Riffy fallback)
    await handleQueueEnd(client, player);
});
