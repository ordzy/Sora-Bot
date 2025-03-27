const { SlashCommandBuilder, EmbedBuilder, Colors } = require('discord.js');
const idclass = require('../idclass'); // Ensure this file contains the correct SuggestChannel ID

module.exports = {
    data: new SlashCommandBuilder()
        .setName('suggest')
        .setDescription('Submit a suggestion with a name, link, language, and type')
        .addStringOption(option =>
            option.setName('name')
                .setDescription('Enter the name of the suggestion')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('link')
                .setDescription('Enter the link of the suggestion')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('language')
                .setDescription('Enter the language of the suggestion')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('type')
                .setDescription('Select if it is an anime or a show')
                .setRequired(true)
                .addChoices(
                    { name: 'Anime', value: 'Anime' },
                    { name: 'Movie/Show', value: 'Movie/Show' }
                )),

    async execute(interaction) {
        const name = interaction.options.getString('name');
        const link = interaction.options.getString('link');
        const language = interaction.options.getString('language');
        const type = interaction.options.getString('type');
        const suggestionChannel = interaction.guild.channels.cache.get(idclass.ChannelMRC);
        const fallbackColor = '#ff9500'; // Default color if no link embed color is available

        if (!suggestionChannel) {
            return interaction.reply({ content: 'Suggestion channel not found.', ephemeral: true });
        }

        if (interaction.channelId !== idclass.ChannelMR) {
            return interaction.reply({ content: `This command can only be used in <#${idclass.ChannelMR}>.`, ephemeral: true });
        }

        const faviconUrl = `https://www.google.com/s2/favicons?sz=64&domain_url=${encodeURIComponent(link)}`;

        // Send the link separately first to generate the preview embed
        let linkEmbedColor = fallbackColor;
        let messageWithLink;
        try {
            messageWithLink = await suggestionChannel.send({ content: link });
            if (messageWithLink.embeds.length > 0 && messageWithLink.embeds[0].color) {
                linkEmbedColor = messageWithLink.embeds[0].color; // Use the link's embed color if available
            }
        } catch (error) {
            console.error("Failed to fetch embed metadata:", error);
        }

        const embed = new EmbedBuilder()
            .setTitle(name)
            .setURL(link)
            .setDescription(`**Type:** ${type}\n**Language:** ${language}\n${link}`)
            .setColor(linkEmbedColor)
            .setThumbnail(faviconUrl)
            .setFooter({ text: `Suggested by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() });

        await suggestionChannel.send({ embeds: [embed] });

        await interaction.reply({ content: 'Your suggestion has been submitted!', ephemeral: true });
    }
};
