import { Events, Message } from 'discord.js';
import idclass from '../idclass';

export default {
  name: Events.MessageCreate,
  async execute(message: Message) {
    const restrictedChannelId = idclass.channelMR();
    const allowedRoles = [idclass.roleDev()];

    // Ignore bot messages or unrelated channels
    if (message.author.bot || message.channel.id !== restrictedChannelId) return;

    // Check if the user has an allowed role
    const hasPermission = message.member?.roles.cache.some(role =>
      allowedRoles.includes(role.id)
    );

    if (hasPermission) return;

    // Allow only link-only messages
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
