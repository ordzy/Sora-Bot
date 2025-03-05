const { SlashCommandBuilder } = require('discord.js');
require('dotenv').config(); // Load environment variables
const idclass = require('../idclass'); 

module.exports = {
    data: new SlashCommandBuilder()
        .setName('cmd')
        .setDescription('Repeats a message in a specified channel.') 
        .addStringOption(option =>
            option.setName('text')
                .setDescription('The message to send.')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('channel')
                .setDescription('The ID of the channel where the message should be sent.')
                .setRequired(false)),

    async execute(interaction) {
        const allowedUsers = [idclass.RoleDev, idclass.OwnershipID];

        if (!allowedUsers.includes(interaction.user.id)) {
            return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
        }

        const text = interaction.options.getString('text');
        const channelId = interaction.options.getString('channel');

        try {
            const channel = channelId
                ? await interaction.client.channels.fetch(channelId)
                : interaction.channel;

            if (!channel || !channel.isTextBased()) {
                return interaction.reply({ content: 'Please provide a valid text channel ID.', ephemeral: true });
            }

            await channel.send(text);
            await interaction.reply({ content: 'Message sent successfully!', ephemeral: true });
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: 'Failed to send the message. Make sure the bot is in the server and has permission.', ephemeral: true });
        }
    }
};
