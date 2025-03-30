const idclass = require('../idclass');

module.exports = {
    name: 'cmd',
    description: 'Repeats a message.',
    requiredRoles: [idclass.RoleDev], // Define required role IDs here
    execute(message, args, client) {
        // Check if the author has any of the required roles
        const hasRequiredRole = message.member.roles.cache.some(role => this.requiredRoles.includes(role.id));
        if (!hasRequiredRole) {
            return message.reply('You do not have permission to use this command.');
        }

        let channel = message.mentions.channels.first(); // Get the mentioned channel
        let text;

        if (channel) {
            text = args.slice(1).join(' '); // Join the remaining arguments to form the message text
        } else {
            channel = message.channel; // Default to the current channel
            text = args.join(' '); // Join all arguments to form the message text
        }

        if (!text) {
            return message.reply('Please provide text to repeat.');
        }

        // Check if the bot has permission to send messages in the channel
        if (channel.permissionsFor(client.user).has('SEND_MESSAGES')) {
            channel.send({ content: text }) // Now repeats the command text instead of executing it
                .catch(() => message.reply('Failed to repeat message. Please make sure the bot has permission to send messages in that channel.'));
        } else {
            message.reply('I do not have permission to send messages in that channel.');
        }
    },
};
