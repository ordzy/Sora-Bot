import { Message, Client, TextChannel, EmbedBuilder, GuildMember } from 'discord.js';
import idclass from '../idclass';
export default {
  name: 'ban',
  description: 'Bans a user from the server.',
  requiredRoles: [idclass.roleDev(), idclass.roleCommander(), idclass.rolePaul(), idclass.roleCranci()],

  async execute(message: Message, args: string[], _client: Client) {
    const requiredRoles = this.requiredRoles;

    const hasRequiredRole = message.member?.roles.cache.some(role =>
      requiredRoles.includes(role.id)
    );

    if (!hasRequiredRole) {
      return message.reply({
        content: 'You do not have permission to use this command.',
        allowedMentions: { parse: [] }
      });
    }

    const userId = args[0]?.replace(/[<@!>]/g, '');
    if (!userId) {
      return message.reply({
        content: 'Please provide a user ID or mention to ban.',
        allowedMentions: { parse: [] }
      });
    }

    const reason = args.slice(1).join(' ') || 'No reason provided';

    try {
      const user = await message.guild?.members.fetch(userId).catch(() => null);
      if (!user) {
        return message.reply({
          content: 'Could not find this user in the server.',
          allowedMentions: { parse: [] }
        });
      }

      const embed = new EmbedBuilder()
        .setColor('#FFA500')
        .setDescription('You cannot ban peak devs <:DogHush:1331679185072029798>');

      if (user.roles.cache.some(role => idclass.roleMods().includes(role.id))) {
        return message.reply({ embeds: [embed] });
      }

      const bans = await message.guild?.bans.fetch();
      if (bans?.has(userId)) {
        return message.reply({
          content: 'This lil bro is already banned.',
          allowedMentions: { parse: [] }
        });
      }

      try {
        await user.send(`You have been __**BANNED**__ from **${message.guild?.name}** for the following reason: ${reason}`);
      } catch (dmError) {
        const logChannel = message.guild?.channels.cache.get(idclass.logChannel()) as TextChannel | undefined;
        if (logChannel) {
          logChannel.send({
            content: `Could not send Ban DM to <@${userId}>.`,
            allowedMentions: { parse: [] }
          });
        }
      }

      await user.ban({ reason });

      await message.reply({
        content: `https://tenor.com/view/persona-3-reload-episode-aigis-persona-persona-3-persona-3-reload-joker-persona-3-reload-joker-fight-gif-12722693221088524996`,
        allowedMentions: { parse: [] }
      });

      await message.reply({
        content: `<@${userId}> has been __**BANNED**__.`,
        allowedMentions: { parse: [] }
      });

      const logChannel = message.guild?.channels.cache.get(idclass.logChannel()) as TextChannel | undefined;
      if (logChannel) {
        logChannel.send({
          content: `<@${userId}> has been __**BANNED**__ by <@${message.author.id}> for: ${reason}`,
          allowedMentions: { parse: [] }
        });
      }

    } catch (error) {
      console.error(error);
      message.reply({
        content: 'I was unable to ban lil bro. Please check if the ID is correct or if lil bro is already banned.',
        allowedMentions: { parse: [] }
      });
    }
  }
};
