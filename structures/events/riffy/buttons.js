const client = require("../../client");
const {
    createEmbed,
    createButtons,
    handlePause,
    handleSkip,
    handlePrev,
    handleStop,
    handleShuffle,
    handleLoop,
    handleReplay,
    handleQueue,
    handleClear,
    handleVolumeChange,
    handleToggleAutoplay,
    handleToggle247,
    handleFilter,
    handleLyrics
} = require('../../lotusify');

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton()) return;

    const player = client.riffy.players.get(interaction.guild.id);
    if (!player) {
        return interaction.reply({ content: `❌ No active player.`, ephemeral: true });
    }

    const track = player.current;
    const requesterId = interaction.user.id;

    try {
        switch (interaction.customId) {
            case 'pause':
            case 'play':
                await handlePause(client, interaction, player, track, requesterId);
                // Update message with new button state
                await interaction.message.edit({
                    embeds: [createEmbed(client, player, track)],
                    components: createButtons(client, player, track)
                });
                break;

            case 'skip':
                await handleSkip(client, interaction, player, track);
                break;

            case 'prev':
                await handlePrev(interaction, player);
                break;

            case 'disconnect':
                await handleStop(client, interaction, player);
                break;

            case 'shuffle':
                await handleShuffle(client, interaction, player, track);
                await interaction.message.edit({
                    embeds: [createEmbed(client, player, track)],
                    components: createButtons(client, player, track)
                });
                break;

            case 'loop':
                await handleLoop(client, interaction, player, track, requesterId);
                await interaction.message.edit({
                    embeds: [createEmbed(client, player, track)],
                    components: createButtons(client, player, track)
                });
                break;

            case 'replay':
                await handleReplay(client, player, track, requesterId, interaction);
                break;

            case 'queue':
                await handleQueue(client, interaction, player);
                break;

            case 'clear':
                await handleClear(client, interaction, player);
                break;

            case 'toggle_autoplay':
                await handleToggleAutoplay(client, interaction, player, track, requesterId);
                await interaction.message.edit({
                    embeds: [createEmbed(client, player, track)],
                    components: createButtons(client, player, track)
                });
                break;

            case 'toggle_247':
                await handleToggle247(client, interaction, player, track, requesterId);
                break;

            case 'filter':
                await handleFilter(client, interaction, player);
                break;

            case 'lyrics':
                await handleLyrics(client, interaction, player, track);
                break;

            default:
                // Ignore unknown button IDs
                break;
        }
    } catch (error) {
        console.error(`[Button Handler] Error handling ${interaction.customId}:`, error);
        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({ content: '❌ An error occurred.', ephemeral: true });
        }
    }
});