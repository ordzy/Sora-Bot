import { SlashCommandBuilder, EmbedBuilder, ChatInputCommandInteraction } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('randomhex')
        .setDescription('Generates a random hex color and shows a preview.'),

    async execute(interaction: ChatInputCommandInteraction) {
        const randomColor = `#${Math.random().toString(16).slice(2, 8).padEnd(6, '0')}`;

        const embed = new EmbedBuilder()
            .setTitle('Random Hex Color')
            .setDescription(`Generated Color: **${randomColor}**`)
            .setColor(randomColor as `#${string}`)
            .setImage(`https://singlecolorimage.com/get/${randomColor.slice(1)}/200x100`);

        await interaction.reply({ embeds: [embed] });
    },
};
