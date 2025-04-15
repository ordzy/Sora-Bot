import {
    SlashCommandBuilder,
    ChatInputCommandInteraction,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} from 'discord.js';


export default {
    data: new SlashCommandBuilder()
        .setName('app')
        .setDescription('Get early access to Sora Beta'),

    async execute(interaction: ChatInputCommandInteraction) {
        const appDetails = {
            title: 'Sora Beta',
            description: 'Download and extract the file, then sideload it onto your device.',
            icon: 'https://cdn.discordapp.com/attachments/1318240587886891029/1324041711995060274/afbeelding.png?ex=679e426f&is=679cf0ef&hm=c67bde9bbf7f1619965aa7706f7a60e400f234af58c23c07711da1d4c18f11e3&',
            githubLink: 'https://nightly.link/cranci1/Sora/workflows/build/dev/Sulfur-IPA.zip',
            color: '#ff9500',
        };

        const embed = new EmbedBuilder()
            .setTitle(appDetails.title)
            .setDescription(`${appDetails.description}\n\n**⚠️ Warning:** It's highly recommended to install through sideloading instead of LiveContainer because LiveContainer doesn't run Sora nicely.`)
            .setThumbnail(appDetails.icon)
            .setColor(appDetails.color as `#${string}`);

        const button = new ButtonBuilder()
            .setLabel('Download Sora Beta')
            .setStyle(ButtonStyle.Link)
            .setURL(appDetails.githubLink);

        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(button);

        await interaction.reply({ embeds: [embed], components: [row] });
    }
};
