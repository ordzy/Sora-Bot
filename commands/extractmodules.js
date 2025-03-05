// Import necessary modules from Discord.js
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('extractmodules')
        .setDescription('Extract and display embed details in plain text')
        .addStringOption(option => 
            option.setName('message_id')
                .setDescription('Provide the message ID of the embed to extract')
                .setRequired(true))
        .addChannelOption(option => 
            option.setName('channel')
                .setDescription('Select the channel where the embed exists')
                .setRequired(true)),

    async execute(interaction) {
        const messageId = interaction.options.getString('message_id');
        const channel = interaction.options.getChannel('channel');

        try {
            const message = await channel.messages.fetch(messageId);
            if (!message || !message.embeds.length) {
                return interaction.reply({ content: 'No embed found in the specified message.', ephemeral: true });
            }

            const embed = message.embeds[0];
            const title = embed.title || 'No title';
            const description = embed.description || 'No description';
            const logo = embed.thumbnail?.url || 'No logo URL';
            const button = message.components[0]?.components[0];
            const buttonName = button?.label || 'No button name';
            const link = button?.url || 'No button link';
            const color = embed.color ? `#${embed.color.toString(16).padStart(6, '0')}` : 'No color';

            const extractedText = `**Title:** ${title}\n**Description:** ${description}\n**Logo URL:** ${logo}\n**Button Name:** ${buttonName}\n**Button Link:** ${link}\n**Color:** ${color}`;

            await interaction.reply({ content: extractedText });
        } catch (error) {
            console.error('Error extracting embed:', error);
            await interaction.reply({ content: 'There was an error extracting the embed. Please check the message ID and my permissions.', ephemeral: true });
        }
    },
};
