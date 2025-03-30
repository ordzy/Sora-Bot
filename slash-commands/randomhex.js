const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('randomhex')
        .setDescription('Generates a random hex color and shows a preview.'),

    async execute(interaction) {
        const randomColor = `#${Math.random().toString(16).slice(2, 8).padEnd(6, '0')}`; // Ensures 6-character hex

        const embed = new EmbedBuilder()
            .setTitle('Random Hex Color')
            .setDescription(`Generated Color: **${randomColor}**`)
            .setColor(randomColor)
            .setImage(`https://singlecolorimage.com/get/${randomColor.slice(1)}/200x100`);

        await interaction.reply({ embeds: [embed] });
    },
};
