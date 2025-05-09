import { Message, EmbedBuilder } from 'discord.js';
import db from '../utils/db';
import idclass from '../idclass';

export default {
  name: 'mrank',
  description: 'Manually sets a user\'s XP (Commander role or higher only)',
  aliases: ['setxp', 'modrank'],
  usage: '<@user> <newXP>',

  async execute(message: Message, args: string[]) {
    const commanderRoleID = idclass.roleCommander();
    const authorMember = message.member;

    if (!authorMember?.roles.cache.has(commanderRoleID)) {
      return message.reply('You do not have permission to use this command.');
    }

    const target = message.mentions.members?.first();
    const newXP = parseInt(args[1]);

    if (!target || isNaN(newXP) || newXP < 0) {
      return message.reply('Usage: `.mrank @user <newXP>`');
    }

    const key = `xp_${message.guild!.id}_${target.id}`;
    let xpData = await db.get(key) || { xp: 0, level: 0, totalXp: 0 };

    const oldXP = xpData.xp;
    const oldTotal = xpData.totalXp || 0;
    const xpDifference = newXP - oldXP;

    xpData.xp = newXP;
    xpData.totalXp = oldTotal + xpDifference;

    await db.set(key, xpData);

    const embed = new EmbedBuilder()
      .setTitle('XP Updated')
      .setColor('#ff9500')
      .setDescription(`Successfully updated XP for <@${target.id}>`)
      .addFields(
        { name: 'Previous XP', value: `${oldXP}`, inline: true },
        { name: 'New XP', value: `${newXP}`, inline: true },
        { name: 'Total XP', value: `${xpData.totalXp}`, inline: true },
        { name: 'Level', value: `${xpData.level}`, inline: true }
      )
      .setFooter({ text: `Action by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() });

    await message.reply({ embeds: [embed], allowedMentions: { parse: [] } });
  }
};
