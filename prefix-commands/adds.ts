import { Message } from 'discord.js';
import db from '../utils/db';

export default {
  name: 'adds',
  description: 'Add another role to the setup session',
  async execute(message: Message) {
    const sessionKey = `ssr-session-${message.author.id}`;
    const session = await db.get(sessionKey);

    if (!session || session.step !== 'waitConfirm') {
      return message.reply('You don\'t have a setup ready to add another role.');
    }

    session.step = 'askRole';
    await db.set(sessionKey, session);
    return message.reply('Please provide the **role ID** of the next role to add:');
  },
};
