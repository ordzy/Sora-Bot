// Import necessary modules from Discord.js
const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('app')
        .setDescription('Get early access to Sora Beta'),

    async execute(interaction) {
        // Define app details
        const appDetails = {
            title: 'Sora Beta', // Change to your app name
            description: 'Download and extract the file, then sideload it onto your device.', // Updated description
            icon: 'https://cdn.discordapp.com/attachments/1318240587886891029/1324041711995060274/afbeelding.png?ex=679e426f&is=679cf0ef&hm=c67bde9bbf7f1619965aa7706f7a60e400f234af58c23c07711da1d4c18f11e3&', // Replace with your app icon URL
            githubLink: 'https://nightly.link/cranci1/Sora/workflows/build/dev/Sulfur-IPA.zip', // Replace with your GitHub repository link
            color: '#ff9500' // Hex color for embed
        };

        // Create embed
        const embed = new EmbedBuilder()
            .setTitle(appDetails.title)
            .setDescription(`${appDetails.description}\n\n**⚠️ Warning:** It's highly recommended to install through sideloading instead of LiveContainer because LiveContainer doesn't run Sora nicely.`)
            .setThumbnail(appDetails.icon)
            .setColor(appDetails.color);

        // Create button
        const button = new ButtonBuilder()
            .setLabel('Download Sora Beta')
            .setStyle(ButtonStyle.Link)
            .setURL(appDetails.githubLink);

        const row = new ActionRowBuilder().addComponents(button);

        await interaction.reply({ embeds: [embed], components: [row] });
    },
};
