import { Message } from 'discord.js';
import db from '../utils/db';
import idclass from '../idclass';

export default {
  name: 'ssr',
  description: 'Start the selectable role setup flow',
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
    const existing = await db.get(sessionKey);
    if (existing) {
      return message.reply('You already have a session in progress. Please notify Bot Admin.');
    }

    await db.set(sessionKey, {
      step: 'askRole',
      roles: []
    });

    return message.reply('Starting Selectable Role setup.\nPlease send the **role ID** of the role you want to make selectable:');
  },
};
