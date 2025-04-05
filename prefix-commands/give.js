const idclass = require('../idclass');

module.exports = {
    name: 'giver',
    description: 'Gives specified roles to a mentioned user or by user ID.',
    requiredRoles: [idclass.RoleDev, idclass.RoleModerator],

    async execute(message, args) {
        const isAuthorized = message.member.roles.cache.some(role =>
            this.requiredRoles.includes(role.id)
        );

        if (!isAuthorized) {
            return message.channel.send({
                content: 'You do not have permission to use this command.',
                allowedMentions: { parse: [] }
            });
        }

        if (args.length < 2) {
            return message.channel.send({
                content: 'Usage: `giver <@user|userID> <roleID1> [roleID2 ...]`',
                allowedMentions: { parse: [] }
            });
        }

        // Get user from mention or ID
        let targetMember;
        if (args[0].startsWith('<@') && args[0].endsWith('>')) {
            targetMember = message.mentions.members.first();
        } else {
            const userId = args[0].replace(/[<@!>]/g, '');
            targetMember = await message.guild.members.fetch(userId).catch(() => null);
        }

        if (!targetMember) {
            return message.channel.send({
                content: 'Could not find the specified user.',
                allowedMentions: { parse: [] }
            });
        }

        const roleIds = args.slice(1);
        const validRoles = [];
        const rejectedRoles = [];

        for (const roleId of roleIds) {
            const role = message.guild.roles.cache.get(roleId);

            if (!role) {
                rejectedRoles.push(roleId);
                continue;
            }

            // No one can give the developer role
            if (role.id === idclass.RoleDev) {
                rejectedRoles.push(roleId);
                continue;
            }

            validRoles.push(role);
        }

        try {
            if (validRoles.length > 0) {
                await targetMember.roles.add(validRoles.map(r => r.id));
                await message.channel.send({
                    content: `✅ Added roles to <@${targetMember.id}>: ${validRoles.map(r => r.name).join(', ')}`,
                    allowedMentions: { parse: [] }
                });

                const logChannel = message.guild.channels.cache.get(idclass.LogChannel);
                if (logChannel) {
                    logChannel.send({
                        content: `📝 <@${message.author.id}> added roles (${validRoles.map(r => r.name).join(', ')}) to <@${targetMember.id}>.`,
                        allowedMentions: { parse: [] }
                    });
                }
            } else {
                await message.channel.send({
                    content: 'No valid roles to add.',
                    allowedMentions: { parse: [] }
                });
            }

            if (rejectedRoles.length > 0) {
                await message.channel.send({
                    content: `❌ Invalid or restricted role IDs: ${rejectedRoles.join(', ')}`,
                    allowedMentions: { parse: [] }
                });
            }

        } catch (err) {
            console.error(err);
            await message.channel.send({
                content: 'An error occurred while assigning roles.',
                allowedMentions: { parse: [] }
            });

            const logChannel = message.guild.channels.cache.get(idclass.LogChannel);
            if (logChannel) {
                logChannel.send({
                    content: `❗ Error assigning roles to <@${targetMember.id}> by <@${message.author.id}>: ${err.message}`,
                    allowedMentions: { parse: [] }
                });
            }
        }
    }
};
