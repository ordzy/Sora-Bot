const idclass = require('../idclass');
const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'warn',
    description: 'Issues a warning to a user.',
    requiredRoles: [idclass.RoleDev], // Define required role IDs here
    protectedRoles: [idclass.RoleDev, idclass.RoleHelper, idclass.RoleIBH, idclass.paul, idclass.RoleContributor, idclass.RoleDesigner, idclass.RoleImportant, idclass.cranci, idclass.SoraBotRole], // Trusted and Mods cannot be warned

    execute(message, args) {
        const requiredRoles = this.requiredRoles;
        const protectedRoles = this.protectedRoles;

        // Check if the author has the required role
        const hasRequiredRole = message.member.roles.cache.some(role => requiredRoles.includes(role.id));
        if (!hasRequiredRole) {
            return message.reply('You do not have permission to use this command.');
        }

        // Check if a user is mentioned
        const user = message.mentions.members.first();
        const reason = args.slice(1).join(' ') || 'No reason provided';
        
        if (!user) {
            return message.reply('Please mention a user to warn.');
        }

        // Check if the user has a protected role
        const hasProtectedRole = user.roles.cache.some(role => protectedRoles.includes(role.id));
        if (hasProtectedRole) {
            const embed = new EmbedBuilder()
                .setColor("#FFA500") // Orange color
                .setDescription('You cannot warn trusted/mods <:DogHush:1331679185072029798>');

            return message.reply({ embeds: [embed] });
        }

        // Notify the channel about the warning
        message.channel.send(`<@${user.id}> has been **__WARNED__**`, {
            allowedMentions: { parse: [] } // Prevent pinging users in the public message
        });

        // Log the action
        const logChannel = message.guild.channels.cache.get(idclass.LogChannel);
        if (logChannel) {
            logChannel.send(`<@${user.id}> has been **__WARNED__** by <@${message.author.id}> for: **${reason}**`, {
                allowedMentions: { parse: [] } // Prevent pinging users in the logs
            });
        }

        // Attempt to DM the user with the warning reason
        user.send(`You have been **__WARNED__** in **${message.guild.name}** for: **${reason}**`)
            .catch(() => {
                if (logChannel) {
                    logChannel.send(`Could not send DM to <@${user.id}> about the warning.`, {
                        allowedMentions: { parse: [] } // Prevent pinging users in the logs
                    });
                }
            });
    },
};
