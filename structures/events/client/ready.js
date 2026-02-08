const { ActivityType } = require("discord.js");
const client = require("../../client");
const { logger } = require("../../functions/logger");

client.on("clientReady", async () => {
    client.riffy.init(client.user.id);

    console.log("\n---------------------")
    logger(`${client.user.tag} is ready`, "success")
    console.log("---------------------")

    client.user.setPresence({
        activities: [
            {
                name: "🎵 LotusMusic | /play",
                type: ActivityType.Watching
            }
        ],
        status: "online"
    })
})