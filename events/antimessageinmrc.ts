import { Events, Message } from 'discord.js';
import idclass from '../utils/idclass';

export default {
  name: Events.MessageCreate,
  async execute(message: Message) {
    const restrictedChannelId = idclass.channelMR();
    const allowedRoles = idclass.roleMods();

    if (message.author.bot || message.channel.id !== restrictedChannelId) return;

    const hasPermission = message.member?.roles.cache.some(role =>
      allowedRoles.includes(role.id)
    );

    if (hasPermission) return;

    const isLink =  /^(?:\/\/[^\s]+)/.test(message.content);

    if (!isLink) {
      try {
        await message.delete();
      } catch (error) {
        console.error('Error deleting message:', error);
      }
    }
  }
};
