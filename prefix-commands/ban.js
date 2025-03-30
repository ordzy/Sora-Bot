const idclass = require('../idclass');

module.exports = {
    name: 'ban',
    description: 'Bans a user from the server.',
    requiredRoles: [idclass.RoleDev], // 

    async execute(message, args) {
        const hasRequiredRole = message.member.roles.cache.some(role => this.requiredRoles.includes(role.id));
        if (!hasRequiredRole) {
            return message.reply({ content: 'You do not have permission to use this command.', allowedMentions: { parse: [] } });
        }

        const userId = args[0]?.replace(/[<@!>]/g, '');
        if (!userId) {
            return message.reply({ content: 'Please provide a user ID or mention to ban.', allowedMentions: { parse: [] } });
        }

        const reason = args.slice(1).join(' ') || 'No reason provided';

        try {
            const bans = await message.guild.bans.fetch();
            const isBanned = bans.some(ban => ban.user.id === userId);

            if (isBanned) {
                return message.reply({ content: 'This lil bro is already banned.', allowedMentions: { parse: [] } });
            }

            const user = await message.client.users.fetch(userId);
            try {
                await user.send(`You have been __**BANNED**__ from **${message.guild.name}** for the following reason: ${reason}`);
            } catch (dmError) {
                const logChannel = message.guild.channels.cache.get(idclass.LogChannel);
                if (logChannel) {
                    logChannel.send({ content: `Could not send Ban DM to <@${userId}>.`, allowedMentions: { parse: [] } });
                }
            }

            // Ban the user by ID
            await message.guild.members.ban(userId, { reason });
            message.channel.send({ content: `https://tenor.com/view/persona-3-reload-episode-aigis-persona-persona-3-persona-3-reload-joker-persona-3-reload-joker-fight-gif-12722693221088524996`, allowedMentions: { parse: [] } });
            message.channel.send({ content: `<@${userId}> has been __**BANNED**__.`, allowedMentions: { parse: [] } });

            const logChannel = message.guild.channels.cache.get(idclass.LogChannel);
            if (logChannel) {
                logChannel.send({ content: `<@${userId}> has been __**BANNED**__ by <@${message.author.id}> for: ${reason}`, allowedMentions: { parse: [] } });
            }
        } catch (error) {
            console.error(error);
            message.reply({ content: 'I was unable to ban lil bro. Please check if the ID is correct or if lil bro is already banned.', allowedMentions: { parse: [] } });
        }
    },
};
