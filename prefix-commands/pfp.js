const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'pfp',
    description: 'Displays the profile picture and banner of a user.',
    async execute(message, args) {
        let member;

        if (args.length) {
            // Get the mentioned user or search by ID/username
            member = message.mentions.members.first() ||
                message.guild.members.cache.get(args[0]) ||
                message.guild.members.cache.find(m => m.user.username.toLowerCase().startsWith(args[0].toLowerCase()));

            if (!member) {
                return message.reply('User not found.');
            }
        } else {
            member = message.member; // Default to the message author
        }

        // Get the user's avatar URL (profile picture)
        const avatarURL = member.displayAvatarURL({ size: 4096 });

        // Fetch the user's banner (if available)
        const user = await message.client.users.fetch(member.id, { force: true });
        const bannerURL = user.bannerURL({ size: 4096 });

        // Create and send the embed with the avatar
        const avatarEmbed = new EmbedBuilder()
            .setTitle(`${member.displayName}'s Profile Picture`)
            .setImage(avatarURL)
            .setColor(member.displayHexColor || '#ffffff')
            .setAuthor({ name: member.user.tag, iconURL: avatarURL });

        message.channel.send({ embeds: [avatarEmbed] });

        // If a banner is available, create and send an embed with the banner
        if (bannerURL) {
            const bannerEmbed = new EmbedBuilder()
                .setTitle(`${member.displayName}'s Banner`)
                .setImage(bannerURL)
                .setColor(member.displayHexColor || '#ffffff')
                .setAuthor({ name: member.user.tag, iconURL: avatarURL });

            message.channel.send({ embeds: [bannerEmbed] });
        }
    },
};
