const idclass = require('../idclass');

module.exports = {
    name: 'removec',
    description: 'Removes a user\'s access to the current channel.',
    requiredRoles: [idclass.RoleDev], // Define required role IDs here

    execute(message, args) {
        const hasRequiredRole = message.member.roles.cache.some(role => this.requiredRoles.includes(role.id));
        if (!hasRequiredRole) {
            return message.channel.send('You do not have permission to use this command.');
        }

        const user = message.mentions.members.first();
        if (!user) {
            return message.channel.send('Please mention a valid user.');
        }

        const channel = message.channel;

        // Example restricted category ID, you can add more as needed
        const restrictedCategories = [idclass.RestrictedCategory];

        // Check if the channel is within a restricted category
        const isRestricted = restrictedCategories.includes(channel.parentId);

        if (isRestricted) {
            return message.channel.send('Sus.');
        }

        channel.permissionOverwrites.edit(user, {
            ViewChannel: false,
            SendMessages: false
        })
        .then(() => {
            message.channel.send(`Removed <@${user.user.id}> from the channel successfully.`);

            // Log the action
            const logChannel = message.guild.channels.cache.get(idclass.LogChannel);
            if (logChannel) {
                logChannel.send(`<@${user.user.id}> has been __**REMOVED**__ from ${channel.name} by <@${message.author.id}>.`, {
                    allowedMentions: { parse: [] } // Prevent pinging users in logs
                });
            }
        })
        .catch(error => {
            console.error(error);
            message.channel.send('I cannot remove this person from this channel.');
        });
    }
};
