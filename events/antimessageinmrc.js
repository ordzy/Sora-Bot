const { Events, PermissionsBitField } = require("discord.js");
const idclass = require("../idclass"); // Assuming idclass contains required role/channel IDs

module.exports = {
  name: Events.MessageCreate,
  async execute(message) {
    // Define the ID of the restricted channel
    const restrictedChannelId = idclass.ChannelMR; // Replace this with the channel ID or method from idclass
    const allowedRoles = [
      idclass.RoleDev];

    // Ignore bot messages or if the channel isn't the restricted one
    if (message.author.bot || message.channel.id !== restrictedChannelId) return;

    // Check if the user has a role that allows chatting
    const hasPermission = message.member.roles.cache.some((role) =>
      allowedRoles.includes(role.id)
    );

    if (hasPermission) return; // Allow mods to send messages

    // Check if the message contains only a link
    const isLink = /^(?:\/\/[^\s]+)/.test(message.content);

    if (!isLink) {
      // Delete the message if it's not a link
      try {
        await message.delete();
      } catch (error) {
        console.error("Error deleting message:", error);
      }
    }
  },
};
