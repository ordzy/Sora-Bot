const { SlashCommandBuilder } = require('discord.js');
const idclass = require('../idclass'); // Import role IDs

module.exports = {
    data: new SlashCommandBuilder()
        .setName('mute')
        .setDescription('Temporarily mute (timeout) a user.')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to mute.')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('duration')
                .setDescription('Duration (e.g., 1s = 1 sec, 1m = 1 min, 1h = 1 hour, 1d = 1 day, max: 14d).')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for the mute.')
                .setRequired(false)),

    async execute(interaction) {
        const allowedRoles = [idclass.RoleDev, idclass.RoleHelper];

        if (!interaction.member.roles.cache.some(role => allowedRoles.includes(role.id))) {
            return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
        }

        const user = interaction.options.getUser('user');
        const member = await interaction.guild.members.fetch(user.id);
        const durationInput = interaction.options.getString('duration');
        const reason = interaction.options.getString('reason') || 'No reason provided';

        // Convert duration string to milliseconds
        const timeUnits = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
        const match = durationInput.match(/^(\d+)(s|m|h|d)$/);

        if (!match) {
            return interaction.reply({ content: 'Invalid duration format. Use `Xs` (seconds), `Xm` (minutes), `Xh` (hours), `Xd` (days). Example: `10m = 10 minutes`, `2h = 2 hours`, `1d = 1 day`.', ephemeral: true });
        }

        const value = parseInt(match[1]);
        const unit = match[2];
        const durationMs = value * timeUnits[unit];

        if (isNaN(durationMs) || durationMs < 1000 || durationMs > 1209600000) { // Max 14 days
            return interaction.reply({ content: 'Invalid duration. Must be between `1s` and `14d`.', ephemeral: true });
        }

        // Apply timeout
        try {
            await member.timeout(durationMs, reason);
            return interaction.reply({ content: `**${user.tag}** has been muted for **${durationInput}**.\nReason: ${reason}` });
        } catch (error) {
            console.error(error);
            return interaction.reply({ content: 'Failed to mute the user. Check bot permissions.', ephemeral: true });
        }
    }
};
