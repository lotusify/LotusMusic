const { Client, CommandInteraction } = require('discord.js');
const { createEmbed } = require('../../lotusify');

module.exports = {
    name: 'nowplaying',
    description: 'Show details about the currently playing song',
    player: true,
    current: true,

    /**
     * @param {Client} client 
     * @param {CommandInteraction} interaction 
     */

    run: async (client, interaction) => {
        const player = client.riffy.players.get(interaction.guild.id);

        return interaction.reply({
            embeds: [createEmbed(client, player, player.current)]
        });
    },
};
