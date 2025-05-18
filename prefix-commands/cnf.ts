import {
  Message,
  ChannelType,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  TextChannel,
} from 'discord.js';
import db from '../utils/db';
import idclass from '../idclass';

export default {
  name: 'cnf',
  description: 'Confirm and post the role buttons',
  async execute(message: Message) {
    const allowedRoleIds = [
      ...(Array.isArray(idclass.roleMods()) ? idclass.roleMods() : [idclass.roleMods()])
    ];

    const memberRoles = message.member?.roles.cache;
    const hasPermission = memberRoles && Array.from(memberRoles.values()).some(role =>
      allowedRoleIds.includes(role.id)
    );

    if (!hasPermission) {
      return message.reply('You do not have permission to use this command.');
    }

    const sessionKey = `ssr-session-${message.author.id}`;
    const session = await db.get(sessionKey);

    if (!session || session.step !== 'waitConfirm') {
      return message.reply('No session found or not ready to confirm.');
    }

    if (!session.customMessage) {
      await db.set(sessionKey, { ...session, step: 'askCustomMessage' });
      return message.reply('Please enter a custom message title (or type `default` to use the default one):');
    }

    if (!session.channelId) {
      await db.set(sessionKey, { ...session, step: 'askChannel' });
      return message.reply('Now, please **mention the channel** where the role buttons should be posted:');
    }

    const channel = message.guild?.channels.cache.get(session.channelId) as TextChannel;
    if (!channel || channel.type !== ChannelType.GuildText || !('send' in channel)) {
      return message.reply('Stored channel is invalid. Please run the process again.');
    }

    const buttons = session.roles.map((r: any) => {
      const btn = new ButtonBuilder()
        .setLabel(r.label)
        .setCustomId(`toggle_${r.roleId}`)
        .setStyle(ButtonStyle.Primary);

      if (r.emoji) btn.setEmoji(r.emoji);
      return btn;
    });

    const rows = [];
    for (let i = 0; i < buttons.length; i += 5) {
      rows.push(new ActionRowBuilder<ButtonBuilder>().addComponents(buttons.slice(i, i + 5)));
    }

    await channel.send({
      content: session.customMessage || 'Click below to assign/remove the following roles:',
      components: rows,
    });

    await db.delete(sessionKey);
    return message.reply('Selectable role message posted successfully!');
  },
};
