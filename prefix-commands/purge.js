const { ChannelType } = require("discord.js");
const idclass = require("../idclass");

module.exports = {
  name: "purge",
  description: "Deletes up to 100 messages from the channel. Supports user-specific purging.",
  usage: ".purge <number> or .purge @User <number>",
  execute: async (message, args) => {
    // Check if the user has any of the required roles
    if (!message.member.roles.cache.some((role) => idclass.RoleMods.includes(role.id))) {
      return message.reply("You do not have permission to use this command.");
    }

    // Validate arguments
    if (!args.length || (isNaN(args[0]) && !message.mentions.users.first())) {
      return message.reply("Invalid usage. Use `.purge <number>` or `.purge @User <number>`.");
    }

    const targetUser = message.mentions.users.first();
    const messageLimit = targetUser ? parseInt(args[1]) : parseInt(args[0]);

    if (!messageLimit || messageLimit > 100 || messageLimit < 1) {
      return message.reply("Please specify a number between 1 and 100.");
    }

    try {
      // Fetch the last 100 messages
      const messages = await message.channel.messages.fetch({ limit: 100 });
      const currentTime = Date.now();

      // Filter messages based on user and time constraints
      const filteredMessages = targetUser
        ? Array.from(
            messages
              .filter(
                (msg) =>
                  msg.author.id === targetUser.id &&
                  currentTime - msg.createdTimestamp < 14 * 24 * 60 * 60 * 1000
              )
              .values()
          ).slice(0, messageLimit + 1) // Add one extra message
        : Array.from(
            messages
              .filter(
                (msg) =>
                  currentTime - msg.createdTimestamp < 14 * 24 * 60 * 60 * 1000
              )
              .values()
          ).slice(0, messageLimit + 1); // Add one extra message

      // Delete the messages (including the extra message)
      await message.channel.bulkDelete(filteredMessages, true);

      // Log the action to the modlog channel
      const modlogChannel = message.guild.channels.cache.get(idclass.LogChannel);
      if (!modlogChannel || modlogChannel.type !== ChannelType.GuildText) {
        console.error("Modlog channel is invalid or not found.");
        return message.reply("Modlog channel not configured or invalid.");
      }

      // Send success message to the modlog channel with no pings
      await modlogChannel.send(
        `<@${message.member.user.id}> has __**PURGED**__ ${filteredMessages.length} Messages in ${message.channel.name}`, { allowedMentions: { parse: [] } } // Prevent pinging users in logs
      );
    } catch (error) {
      console.error("Error while purging messages:", error);
      return message.reply("Failed to delete messages. Ensure messages are less than 14 days old.");
    }
  },
};
