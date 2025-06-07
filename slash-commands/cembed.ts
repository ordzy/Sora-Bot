import {
    SlashCommandBuilder,
    ChatInputCommandInteraction,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ChannelType,
    TextChannel,
    GuildMember
} from 'discord.js';
import idclass from '../utils/idclass';

export default {
    data: new SlashCommandBuilder()
        .setName('cembed')
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
                .addChannelTypes(ChannelType.GuildText)
                .setRequired(true)),

    async execute(interaction: ChatInputCommandInteraction) {
        const allowedRoleIDs = [idclass.roleDev(), idclass.roleCommander(), idclass.rolePaul(), idclass.roleCranci()];
        
        const member = interaction.member as GuildMember;
        if (!member.roles.cache.some(role => allowedRoleIDs.includes(role.id))) {
            return interaction.reply({
                content: 'You do not have the required role to execute this command.',
                ephemeral: true
            });
        }

        const title = interaction.options.getString('title', true);
        const description = interaction.options.getString('description', true);
        const logo = interaction.options.getString('logo', true);
        const link = interaction.options.getString('link', true);
        const buttonName = interaction.options.getString('button_name', true);
        const color = interaction.options.getString('color', true);
        const channel = interaction.options.getChannel('channel', true) as TextChannel;

        const embed = new EmbedBuilder()
            .setTitle(title)
            .setDescription(description)
            .setThumbnail(logo)
            .setColor(color as `#${string}`);

        const button = new ButtonBuilder()
            .setLabel(buttonName)
            .setStyle(ButtonStyle.Link)
            .setURL(link);

        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(button);

        try {
            await channel.send({ embeds: [embed], components: [row] });
            await interaction.reply({ content: `Embed successfully sent to ${channel}!`, ephemeral: true });
        } catch (error) {
            console.error('Error sending the embed:', error);
            await interaction.reply({
                content: 'There was an error sending the embed. Please check my permissions and try again.',
                ephemeral: true
            });
        }
    }
};
