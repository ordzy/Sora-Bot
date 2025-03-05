const { SlashCommandBuilder } = require('discord.js');
const idclass = require('../idclass');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('purge')
        .setDescription('Delete messages in bulk (up to 2 weeks)')
        .addIntegerOption(option =>
            option.setName('amount')
                .setDescription('Number of messages to delete (max: 100)')
                .setRequired(true)),

    async execute(interaction) {
        // List of allowed roles
        const allowedRoles = [idclass.RoleDev, idclass.RoleHelper];

        // Check if user has the required roles
        if (!interaction.member.roles.cache.some(role => allowedRoles.includes(role.id))) {
            return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
        }

        const amount = interaction.options.getInteger('amount');

        if (amount < 1 || amount > 100) {
            return interaction.reply({ content: 'Please provide a number between 1 and 100.', ephemeral: true });
        }

        const channel = interaction.channel;

        try {
            // Fetch messages and filter only deletable ones (younger than 14 days)
            const messages = await channel.messages.fetch({ limit: amount });
            const deletableMessages = messages.filter(msg => Date.now() - msg.createdTimestamp < 1209600000); // 14 days in ms

            if (deletableMessages.size === 0) {
                return interaction.reply({ content: 'No messages found that can be deleted (must be under 14 days old).', ephemeral: true });
            }

            await channel.bulkDelete(deletableMessages, true);
            await interaction.reply({ content: `Successfully deleted ${deletableMessages.size} messages.`, ephemeral: true });
        } catch (error) {
            console.error('Error deleting messages:', error);
            await interaction.reply({ content: 'Failed to delete messages. Check my permissions.', ephemeral: true });
        }
    },
};
