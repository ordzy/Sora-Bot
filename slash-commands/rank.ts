import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  User
} from 'discord.js';
import db from '../utils/db';

export default {
  data: new SlashCommandBuilder()
    .setName('rank')
    .setDescription("Shows a user's current level and XP.")
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('The user to check rank for')
        .setRequired(false)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const guild = interaction.guild;
    if (!guild) {
      return interaction.reply({
        content: 'This command can only be used in a server.',
        ephemeral: true,
      });
    }

    const targetUser = interaction.options.getUser('user') || interaction.user;
    const key = `xp_${guild.id}_${targetUser.id}`;
    const data = await db.get(key);

    if (!data) {
      return interaction.reply({
        content: `<@${targetUser.id}> hasn't earned any XP yet.`,
        ephemeral: true,
      });
    }

    const nextLevelXp = 5 * (data.level ** 2) + 50 * data.level + 100;

    const embed = new EmbedBuilder()
      .setTitle(`${targetUser.username}'s Rank`)
      .setColor('#FF9500')
      .setThumbnail(targetUser.displayAvatarURL({ size: 512 }))
      .addFields(
        { name: 'Level', value: `${data.level}`, inline: true },
        { name: 'XP', value: `${data.xp} / ${nextLevelXp}`, inline: true },
        { name: 'Total XP', value: `${data.totalXp}`, inline: true }
      )
      .setFooter({ text: `Keep chatting to level up!` });

    await interaction.reply({ embeds: [embed] });
  }
};
