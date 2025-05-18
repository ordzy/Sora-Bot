import { Message } from 'discord.js';
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

    await db.set(sessionKey, { ...session, step: 'askCustomMessage' });
    return message.reply('Please enter a custom message title (or type `default` to use the default one):');
  },
};
