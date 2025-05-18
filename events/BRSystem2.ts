import {
  Events,
  Interaction,
  ButtonInteraction,
  GuildMember,
} from 'discord.js';

export default {
  name: Events.InteractionCreate,
  async execute(interaction: Interaction) {
    if (!interaction.isButton() || !interaction.guild) return;

    const member = interaction.member as GuildMember;
    const [action, roleId] = interaction.customId.split('_');

    if (action !== 'toggle') return;

    const role = interaction.guild.roles.cache.get(roleId);
    if (!role) {
      return interaction.reply({ content: 'Role not found.', ephemeral: true });
    }

    const hasRole = member.roles.cache.has(role.id);

    try {
      if (hasRole) {
        await member.roles.remove(role);
        return interaction.reply({ content: `Removed role **${role.name}**.`, ephemeral: true });
      } else {
        await member.roles.add(role);
        return interaction.reply({ content: `Assigned role **${role.name}**.`, ephemeral: true });
      }
    } catch (err) {
      console.error(err);
      return interaction.reply({ content: 'Failed to modify your role. Check my permissions.', ephemeral: true });
    }
  },
};
