const { PermissionsBitField } = require('discord.js');
const idclass = require('../idclass');
const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'mute',
    description: 'Times out a user for a specified duration or removes the timeout if no duration is provided.',
    async execute(message, args) {
        // Check if the author has the required permissions
        const requiredRoles = [idclass.RoleDev]
        const hasRequiredRole = message.member.roles.cache.some(role => requiredRoles.includes(role.id));
        if (!hasRequiredRole) {
            return message.reply('You do not have permission to use this command.');
        }
        // Check if a user is mentioned
        const member = message.mentions.members.first();
        if (!member) {
            return message.reply('Please mention a user to timeout or untimeout.');
        }

        const embed = new EmbedBuilder()
        .setColor("#FFA500") // Orange color
        .setDescription('You cannot mute peak devs <:DogHush:1331679185072029798>');

        // Prevent specific roles from being muted
        const cannotBeMuted = [idclass.RoleDev, idclass.Rolecranci, idclass.Rolepaul];
        if (member.roles.cache.some(role => cannotBeMuted.includes(role.id))) {
            return message.reply({ embeds: [embed] });
        }

        // Check if a duration is provided
        const duration = args[1];
        const reason = args.slice(2).join(' ') || 'No reason provided';

        try {
            if (duration) {
                // Parse the duration
                const durationMs = parseDuration(duration);
                if (durationMs === null) {
                    return message.reply('Invalid duration format. Please use formats like 10m, 1h, 1d.');
                }

                // Timeout the user
                await member.timeout(durationMs, reason);
                message.channel.send(`<@${member.id}> has been __**MUTED**__`, {
                    allowedMentions: { parse: [] } // Prevent pinging the member
                });

                // Attempt to send a DM to the user
                try {
                    await member.send(`You have been muted in **${message.guild.name}** for **${duration}** due to: **${reason}**`);
                } catch (error) {
                    const logChannel = message.guild.channels.cache.get(idclass.LogChannel);
                    if (logChannel) {
                        logChannel.send(`Could not send DM to <@${member.id}> about the mute.`, {
                            allowedMentions: { parse: [] } // Prevent pinging the member
                        });
                    }
                }

                // Log the action
                const logChannel = message.guild.channels.cache.get(idclass.LogChannel);
                if (logChannel) {
                    logChannel.send(`<@${member.id}> has been __**MUTED**__ for ${duration} by <@${message.author.id}>. Reason: ${reason}`, {
                        allowedMentions: { parse: [] } // Prevent pinging the member
                    });
                }

                // Schedule a message when the mute ends
                setTimeout(async () => {
                    try {
                        await member.send(`Your mute in **${message.guild.name}** has ended.`);
                    } catch (error) {
                        const logChannel = message.guild.channels.cache.get(idclass.LogChannel);
                        if (logChannel) {
                            logChannel.send(`Could not send DM to <@${member.id}> after the mute ended.`, {
                                allowedMentions: { parse: [] } // Prevent pinging the member
                            });
                        }
                    }
                }, durationMs);
            } else {
                // Remove the timeout
                await member.timeout(null, reason);
                message.reply(`<@${member.user.id}> has been __**UNMUTED**__`, {
                    allowedMentions: { parse: [] } // Prevent pinging the member
                });

                // Log the action
                const logChannel = message.guild.channels.cache.get(idclass.LogChannel);
                if (logChannel) {
                    logChannel.send(`<@${member.id}> has been __**UNMUTED**__ by <@${message.author.id}>. Reason: ${reason}`, {
                        allowedMentions: { parse: [] } // Prevent pinging the member
                    });
                }
            }
        } catch (error) {
            console.error(error);
            message.reply('An error occurred while trying to mute or unmute the user.');
        }
    },
};

// Helper function to parse duration
function parseDuration(duration) {
    const regex = /^(\d+)([smhd])$/;
    const match = duration.match(regex);

    if (!match) return null;

    const value = parseInt(match[1]);
    const unit = match[2];

    switch (unit) {
        case 's': return value * 1000;
        case 'm': return value * 60 * 1000;
        case 'h': return value * 60 * 60 * 1000;
        case 'd': return value * 24 * 60 * 60 * 1000;
        default: return null;
    }
}
