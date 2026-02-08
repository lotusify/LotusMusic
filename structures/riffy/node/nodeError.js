const client = require("../../client")
const { logger } = require("../../functions/logger")

client.riffy.on("nodeError", async (node, error) => {
    // Suppress known NodeLink-specific unknown events
    const nodelinkEvents = [
        'PlayerCreatedEvent',
        'PlayerConnectedEvent',
        'VolumeChangedEvent',
        'FiltersChangedEvent',
        'PauseEvent'
    ];
    
    const isNodelinkEvent = nodelinkEvents.some(event => 
        error.message.includes(`unknown event: '${event}'`)
    );
    
    if (!isNodelinkEvent) {
        console.log("\n---------------------")
        logger(`Node ${node.name} encountered an error: ${error.message}`, "error")
        console.log("---------------------")
    }
})