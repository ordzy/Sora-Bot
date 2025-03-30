const idclass = require('../idclass');

module.exports = {
    name: 'botdm',
    requiredRoles: [idclass.RoleDev], 
    execute(message, args, client) {

        const hasRequiredRole = message.member.roles.cache.some(role => this.requiredRoles.includes(role.id));
        if (!hasRequiredRole) {
            return message.reply('You do not have permission to use this command.');
        }
    
        const userMention = message.mentions.users.first();
        if (!userMention) {
            return message.reply('Please mention a valid user.');
        }
    
        const text = args.slice(1).join(' ');
        if (!text) {
            return message.reply('nice I wont dm anyone.');
        }
    
        
        userMention.send(text)
            .then(() => message.channel.send(`done`))
            .catch(() => message.channel.send('nice I wont dm anyone.'));
    },
    };
    
    