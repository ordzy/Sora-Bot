import {
  Message,
  Events,
  ChannelType,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from 'discord.js';
import db from '../utils/db';

export default {
  name: Events.MessageCreate,
  async execute(message: Message) {
    if (message.author.bot || !message.guild) return;

    const sessionKey = `ssr-session-${message.author.id}`;
    const session = await db.get(sessionKey);
    if (!session) return;

    const content = message.content.trim();

    switch (session.step) {
      case 'askRole': {
        const roleId = content.replace(/[<@&>]/g, '');
        const role = message.guild.roles.cache.get(roleId);
        if (!role) return message.reply('Invalid role ID. Please provide a valid one.');

        session.roles.push({ roleId, label: '', emoji: null });
        session.step = 'askLabel';
        await db.set(sessionKey, session);
        return message.reply('Role ID saved. Now provide a **name/label** for the button:');
      }

      case 'askLabel': {
        session.roles[session.roles.length - 1].label = content;
        session.step = 'askEmoji';
        await db.set(sessionKey, session);
        return message.reply('Label saved. Now provide an **emoji** (optional, send `none` to skip):');
      }

      case 'askEmoji': {
        const roleData = session.roles[session.roles.length - 1];
        roleData.emoji = content.toLowerCase() === 'none' ? null : content;
        session.step = 'waitConfirm';
        await db.set(sessionKey, session);
        return message.reply('Emoji saved.\nWhen ready, type `.cnf` to continue, or `.adds` to add another role.');
      }

      case 'askCustomMessage': {
  session.customMessage = content.toLowerCase() === 'default' ? null : content;
  session.step = 'askChannel';
  await db.set(sessionKey, session);
  return message.reply('Now, please **mention the channel** where the role buttons should be posted:');
}

case 'askChannel': {
  const channel = message.mentions.channels.first();
  if (!channel || channel.type !== ChannelType.GuildText || !('send' in channel)) {
    return message.reply('Please mention a valid text channel.');
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
}

      default:
        return;
    }
  },
};
