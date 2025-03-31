const idclass = require('../idclass');
const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'softban',
    description: 'Softbans a user (bans, deletes messages, DMs an invite, then unbans).',
    requiredRoles: [idclass.RoleDev],

    async execute(message, args) {
        const hasRequiredRole = message.member.roles.cache.some(role => this.requiredRoles.includes(role.id));
        if (!hasRequiredRole) {
            return message.reply({ content: 'You do not have permission to use this command.', allowedMentions: { parse: [] } });
        }

        const userId = args[0]?.replace(/[<@!>]/g, '');
        if (!userId) {
            return message.reply({ content: 'Please provide a user ID or mention to softban.', allowedMentions: { parse: [] } });
        }

        const reason = args.slice(1).join(' ') || 'No reason provided';
        const inviteLink = 'https://discord.gg/sulfur'; // Replace with your server invite link

        try {
            const user = await message.guild.members.fetch(userId).catch(() => null);
            if (!user) {
                return message.reply({ content: 'Could not find this user in the server.', allowedMentions: { parse: [] } });
            }

            const embed = new EmbedBuilder()
            .setColor("#FFA500") // Orange color
            .setDescription('You cannot softban peak devs <:DogHush:1331679185072029798>');
    
            if (user.roles.cache.has(idclass.RoleDev)) {
                return message.reply({ embeds: [embed] });
            }

            try {
                await user.send(`You have been __**SOFTBANNED**__ from **${message.guild.name}** for the following reason: ${reason}.\nYou may rejoin using this invite: ${inviteLink}`);
            } catch (dmError) {
                const logChannel = message.guild.channels.cache.get(idclass.LogChannel);
                if (logChannel) {
                    logChannel.send({ content: `Could not send Softban DM to <@${userId}>.`, allowedMentions: { parse: [] } });
                }
            }

            await user.ban({ days: 7, reason: `Softban: ${reason}` });
            message.channel.send({ content: `<@${userId}> has been __**SOFTBANNED**__.`, allowedMentions: { parse: [] } });

            const logChannel = message.guild.channels.cache.get(idclass.LogChannel);
            if (logChannel) {
                logChannel.send({ content: `<@${userId}> has been __**SOFTBANNED**__ by <@${message.author.id}> for: ${reason}`, allowedMentions: { parse: [] } });
            }

            setTimeout(async () => {
                await message.guild.bans.remove(userId, 'Softban completed');
                message.channel.send({ content: `<@${userId}> has been __**UNBANNED**__ (softban completed).`, allowedMentions: { parse: [] } });
            }, 3000); // Short delay before unbanning
        } catch (error) {
            console.error(error);
            message.reply({ content: 'I was unable to softban lil bro. Please check if the ID is correct.', allowedMentions: { parse: [] } });
        }
    },
};
