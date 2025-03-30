const idclass = require('../idclass');

module.exports = {
    name: 'giver',
    description: 'Gives specified roles to a mentioned user or by user ID.',
    requiredRoles: [idclass.RoleDev, idclass.RoleModerator], // Allow moderators as well

    async execute(message, args) {
        const hasRequiredRole = message.member.roles.cache.some(role => this.requiredRoles.includes(role.id));
        if (!hasRequiredRole) {
            return message.channel.send({ content: 'You do not have permission to use this command.', allowedMentions: { parse: [] } });
        }

        if (args.length < 2) {
            return message.channel.send({ content: 'Please provide a user mention or user ID and at least one role ID.', allowedMentions: { parse: [] } });
        }

        // Get the user (either mention or ID)
        let user;
        if (args[0].startsWith('<@') && args[0].endsWith('>')) {
            // User is mentioned
            user = message.mentions.members.first();
        } else {
            // User is provided by ID
            const userId = args[0].replace(/[<@!>]/g, '');
            user = await message.guild.members.fetch(userId).catch(() => null);
        }

        if (!user) {
            return message.channel.send({ content: 'Please mention a valid user or provide a valid user ID.', allowedMentions: { parse: [] } });
        }

        const roleIds = args.slice(1);
        const invalidRoleIds = [];
        const validRoles = [];
        const restrictedRoles = [idclass.RoleDev]; // Include staff roles

        roleIds.forEach(roleId => {
            const role = message.guild.roles.cache.get(roleId);
            if (role) {
                // Check if the role is restricted and the user doesn't have the Owner role
                if (restrictedRoles.includes(role.id) && !message.member.roles.cache.has(idclass.RoleDev)) {
                    invalidRoleIds.push(roleId);
                } else {
                    validRoles.push(role);
                }
            } else {
                invalidRoleIds.push(roleId);
            }
        });

        try {
            if (invalidRoleIds.length > 0) {
                await message.channel.send({ content: `Invalid or restricted role IDs: ${invalidRoleIds.join(', ')}`, allowedMentions: { parse: [] } });
            }

            if (validRoles.length > 0) {
                await user.roles.add(validRoles.map(role => role.id));
                await message.channel.send({ content: `Roles added to <@${user.id}>: ${validRoles.map(role => role.name).join(', ')}`, allowedMentions: { parse: [] } });

                // Log the action
                const logChannel = message.guild.channels.cache.get(idclass.LogChannel);
                if (logChannel) {
                    logChannel.send({ content: `<@${message.author.id}> added roles (${validRoles.map(role => role.name).join(', ')}) to <@${user.id}>.`, allowedMentions: { parse: [] } });
                }
            } else {
                await message.channel.send({ content: 'No valid roles to add.', allowedMentions: { parse: [] } });
            }
        } catch (error) {
            console.error(error);
            await message.channel.send({ content: 'An error occurred while adding roles.', allowedMentions: { parse: [] } });

            // Log the error
            const logChannel = message.guild.channels.cache.get(idclass.LogChannel);
            if (logChannel) {
                logChannel.send({ content: `Error occurred while adding roles to <@${user.id}> by ${message.author.id}: ${error.message}`, allowedMentions: { parse: [] } });
            }
        }
    }
};
