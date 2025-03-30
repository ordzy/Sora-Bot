const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'userinfo',
    description: 'Fetches and displays user information.',
    async execute(message, args) {
        const userId = args[0];

        if (!userId) {
            return message.channel.send('Please provide a user ID.');
        }

        try {
            // Fetch the user
            const user = await message.client.users.fetch(userId);

            if (!user) {
                return message.channel.send('User not found.');
            }

            // Fetch the user profile to get the banner
            const userProfile = await user.fetch();

            // Create an embed with the user information
            const embed = new EmbedBuilder()
                .setTitle(`User Information: ${user.username}`)
                .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 512 }))
                .addFields(
                    { name: 'Username', value: user.username, inline: true },
                    { name: 'ID', value: user.id, inline: true },
                    { name: 'Created At', value: user.createdAt.toDateString(), inline: true }
                );

                if (userProfile.banner) {
                    const bannerUrl = userProfile.banner.startsWith('a_')
                        ? `https://cdn.discordapp.com/banners/${user.id}/${userProfile.banner}.gif?size=512`
                        : `https://cdn.discordapp.com/banners/${user.id}/${userProfile.banner}.png?size=512`;
                    embed.setImage(bannerUrl);
                }
    
            // Send the embed
            message.channel.send({ embeds: [embed] });

        } catch (error) {
            message.channel.send('Provide valid ID correctly.');
        }
    },
};
