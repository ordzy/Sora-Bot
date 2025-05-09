import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
} from 'discord.js';
import db from '../utils/db';

export default {
  data: new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('View the top XP leaderboard.'),

  async execute(interaction: ChatInputCommandInteraction) {
    const guildId = interaction.guildId;
    if (!guildId) return;

    const all = (await db.all()).filter(entry => entry.id.startsWith(`xp_${guildId}_`));
    const sorted = all.sort((a, b) => b.value.xp + b.value.level * 1000 - (a.value.xp + a.value.level * 1000));

    if (sorted.length === 0) {
      return interaction.reply({ content: 'No XP data found for this server.', ephemeral: true });
    }

    let page = 0;
    const pageSize = 10;
    const totalPages = Math.ceil(sorted.length / pageSize);

    const generateEmbed = (page: number) => {
      const start = page * pageSize;
      const pageData = sorted.slice(start, start + pageSize);

      const embed = new EmbedBuilder()
        .setTitle('XP Leaderboard')
        .setColor('#ff9500')
        .setFooter({ text: `Page ${page + 1} of ${totalPages}` });

      for (let i = 0; i < pageData.length; i++) {
        const entry = pageData[i];
        const userId = entry.id.split('_')[2];
        const { xp, level } = entry.value;

        embed.addFields({
          name: `#${start + i + 1} - <@${userId}>`,
          value: `Level: **${level}** | XP: **${xp}**`,
          inline: false,
        });
      }

      return embed;
    };

    const getRow = (page: number) => {
      return new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId('prev')
          .setLabel('Previous')
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(page === 0),

        new ButtonBuilder()
          .setCustomId('next')
          .setLabel('Next')
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(page === totalPages - 1)
      );
    };

    const message = await interaction.reply({
      embeds: [generateEmbed(page)],
      components: [getRow(page)],
      fetchReply: true,
    });

    const collector = message.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 60_000,
    });

    collector.on('collect', async i => {
      if (i.user.id !== interaction.user.id) {
        return i.reply({ content: 'This is not your interaction.', ephemeral: true });
      }

      i.deferUpdate();

      if (i.customId === 'next' && page < totalPages - 1) page++;
      else if (i.customId === 'prev' && page > 0) page--;

      await interaction.editReply({
        embeds: [generateEmbed(page)],
        components: [getRow(page)],
      });
    });

    collector.on('end', async () => {
      await interaction.editReply({ components: [] });
    });
  },
};
