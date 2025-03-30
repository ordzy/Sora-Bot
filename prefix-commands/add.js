const idclass = require('../idclass');

module.exports = {
    name: 'add',
    description: 'Gives a user access to the current channel.',
    requiredRoles: [idclass.RoleDev], // Define required role IDs here

    execute(message, args) {
        const hasRequiredRole = message.member.roles.cache.some(role => this.requiredRoles.includes(role.id));
        if (!hasRequiredRole) {
            return message.channel.send({ content: 'You do not have permission to use this command.', allowedMentions: { parse: [] } });
        }

        const user = message.mentions.members.first();
        if (!user) {
            return message.channel.send({ content: 'Please mention a valid user.', allowedMentions: { parse: [] } });
        }

        const channel = message.channel;
        
        // Example restricted category ID, you can add more as needed
        const restrictedCategories = [idclass.RestrictedCategory];

        // Check if the channel is within a restricted category
        const isRestricted = restrictedCategories.includes(channel.parentId);

        if (isRestricted) {
            return message.channel.send({ content: 'Sus.', allowedMentions: { parse: [] } });
        }

        channel.permissionOverwrites.edit(user, {
            ViewChannel: true,
            SendMessages: true
        })
        .then(() => {
            message.channel.send({ 
                content: `Added <@${user.id}> to the channel successfully.`, 
                allowedMentions: { parse: [] } 
            });

            // Log the action
            const logChannel = message.guild.channels.cache.get(idclass.LogChannel);
            if (logChannel) {
                logChannel.send({ 
                    content: `<@${user.id}> has been __**ADDED**__ to ${channel.name} by <@${message.author.id}>.`, 
                    allowedMentions: { parse: [] } 
                });
            }
        })
        .catch(error => {
            console.error(error);
            message.channel.send({ content: 'I cannot add this person to this channel.', allowedMentions: { parse: [] } });
        });
    }
};
