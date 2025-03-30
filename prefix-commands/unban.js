const idclass = require('../idclass');

module.exports = {
    name: 'unban',
    description: 'Unbans a user from the server.',
    requiredRoles: [idclass.RoleDev], // Define required role IDs here

    async execute(message, args) {
        const hasRequiredRole = message.member.roles.cache.some(role => this.requiredRoles.includes(role.id));
        if (!hasRequiredRole) {
            return message.reply('You do not have permission to use this command.');
        }

        const userId = args[0]?.replace(/[<@!>]/g, '');
        if (!userId) {
            return message.reply('Please provide a user ID to unban.');
        }

        const reason = args.slice(1).join(' ') || 'No reason provided';

        try {
            const bannedUsers = await message.guild.bans.fetch();
            const bannedUser = bannedUsers.get(userId);

            if (!bannedUser) {
                return message.reply('lil bro is likely unbanned.');
            }

            await message.guild.members.unban(userId, reason);
            message.channel.send(`${bannedUser.user.tag} has been __**UNBANNED**__.`);

            const logChannel = message.guild.channels.cache.get(idclass.LogChannel);
            if (logChannel) {
                logChannel.send({ content: `${bannedUser.user.tag} has been __**UNBANNED**__ by <@${message.author.id}> for: ${reason}`, allowedMentions: { parse: [] } });
            }
        } catch (error) {
            console.error(error);
            message.reply('I was unable to unban the user.');
        }
    },
};

