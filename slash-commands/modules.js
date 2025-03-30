// Import necessary modules from Discord.js
const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('modules')
        .setDescription('Manage and add modules for Sora.'),

    async execute(interaction) {
        // Define app details
        const appDetails = {
            title: 'Sora Modules',
            description: 'Easily add and manage modules for Sora, both automatically and manually. Special thanks to cufiy for their support!',
            icon: 'https://cdn.discordapp.com/attachments/1318240587886891029/1324041711995060274/afbeelding.png?ex=679e426f&is=679cf0ef&hm=c67bde9bbf7f1619965aa7706f7a60e400f234af58c23c07711da1d4c18f11e3&', // Replace with your app icon URL
            githubLink: 'https://sora.jm26.net/library/',
            color: '#ff9500'
        };

        // Create embed
        const embed = new EmbedBuilder()
            .setTitle(appDetails.title)
            .setDescription(
                `${appDetails.description}\n\n` +
                `**⚠️ Important for Livecontainer Users:**\n` +
                `You must add modules manually. Copy the module link and paste it into the Sora module settings.\n\n` +
                `🔗 **[Click here to access Sora Modules](${appDetails.githubLink})**`
            )
            .setThumbnail(appDetails.icon)
            .setColor(appDetails.color);

        await interaction.reply({ embeds: [embed] });
    },
};
