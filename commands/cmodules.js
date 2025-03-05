// Import necessary modules from Discord.js
const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const idclass = require('../idclass');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('cmodules')
        .setDescription('Create an embed with a logo and a button')
        .addStringOption(option =>
            option.setName('title')
                .setDescription('Provide the title for the embed')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('description')
                .setDescription('Provide the description for the embed')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('logo')
                .setDescription('Provide the URL for the logo image')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('link')
                .setDescription('Provide the URL for the button link')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('button_name')
                .setDescription('Provide the name for the button')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('color')
                .setDescription('Provide the hex color code for the embed (e.g., #00FFFF)')
                .setRequired(true))
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('Select the channel to send the embed to')
                .setRequired(true)),

    async execute(interaction) {
        // List of role IDs allowed to execute the command
        const allowedRoleIDs = [idclass.RoleDev, idclass.RoleModuleCreator]; // Ensure correct references

        // Check if the user has any of the allowed roles (prevents crashes in DMs)
        if (!interaction.member || !interaction.member.roles.cache.some(role => allowedRoleIDs.includes(role.id))) {
            return interaction.reply({ content: 'You do not have the required role to execute this command.', ephemeral: true });
        }

        const title = interaction.options.getString('title');
        const description = interaction.options.getString('description');
        const logo = interaction.options.getString('logo');
        const link = interaction.options.getString('link');
        const buttonName = interaction.options.getString('button_name');
        const color = interaction.options.getString('color');
        const channel = interaction.options.getChannel('channel');

        // Create the embed
        const embed = new EmbedBuilder()
            .setTitle(title)
            .setDescription(description)
            .setThumbnail(logo)
            .setColor(color);

        // Create the button
        const button = new ButtonBuilder()
            .setLabel(buttonName)
            .setStyle(ButtonStyle.Link)
            .setURL(link);

        const row = new ActionRowBuilder().addComponents(button);

        // Send the embed to the specified channel
        try {
            await channel.send({ embeds: [embed], components: [row] });
            await interaction.reply({ content: `Embed successfully sent to ${channel}!` });
        } catch (error) {
            console.error('Error sending the embed:', error);
            await interaction.reply({ content: 'There was an error sending the embed. Please check my permissions and try again.', ephemeral: true });
        }
    },
};
