import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  ColorResolvable,
  GuildMember
} from 'discord.js';
import fetch from 'node-fetch';
import idclass from '../utils/idclass';

const MAX_ICON_SIZE = 2 * 1024 * 1024; // 2MB

const data = new SlashCommandBuilder()
  .setName('roler')
  .setDescription('(IBHR, Storm, Ordzy)')
  .addStringOption(o =>
    o
      .setName('type')
      .setDescription('Which role to edit')
      .addChoices(
        { name: 'IBHR', value: 'ibhr' },
        { name: 'Storm', value: 'stormr' },
        { name: 'Ordzy', value: 'ordzyr' }
      )
      .setRequired(true)
  )
  .addStringOption(o => o.setName('hex').setDescription('Hex color, e.g. #ff5733').setRequired(false))
  .addAttachmentOption(o => o.setName('image').setDescription('PNG/JPG under 2MB').setRequired(false))
  .addStringOption(o => o.setName('name').setDescription('New role name').setRequired(false));

async function handleRoleEdit(
  interaction: ChatInputCommandInteraction,
  roleId: string,
  reasonPrefix: string
): Promise<void> {
  const member = interaction.member as GuildMember;
  const guild = interaction.guild;
  if (!guild || !member || !('roles' in member)) {
    await interaction.reply({ content: 'This command must be used in a server.', ephemeral: true });
    return;
  }

  const userRoleIds = member.roles.cache.map(role => role.id);
  if (!userRoleIds.includes(roleId)) {
    await interaction.reply({ content: 'You do not have the required role to use this.', ephemeral: true });
    return;
  }

  const hexColor = interaction.options.getString('hex');
  const imageAttachment = interaction.options.getAttachment('image');
  const newName = interaction.options.getString('name');

  if (!hexColor && !imageAttachment && !newName) {
    await interaction.reply({ content: 'Provide at least one of: hex, image, name.', ephemeral: true });
    return;
  }

  const roleEditData: any = { reason: `${reasonPrefix} updated by ${member.user.tag}` };

  if (hexColor) {
    const formattedHex = hexColor.startsWith('#') ? hexColor : `#${hexColor}`;
    roleEditData.color = formattedHex as ColorResolvable;
  }

  if (imageAttachment) {
    if (imageAttachment.size > MAX_ICON_SIZE) {
      await interaction.reply({ content: 'Image too large. Max 2MB (PNG/JPG).', ephemeral: true });
      return;
    }
    const allowed = ['image/png', 'image/jpeg'];
    if (!allowed.includes(imageAttachment.contentType || '')) {
      await interaction.reply({ content: 'Invalid image type. Use PNG or JPG.', ephemeral: true });
      return;
    }
    const response = await fetch(imageAttachment.url);
    const iconBuffer = Buffer.from(await response.arrayBuffer());
    roleEditData.icon = iconBuffer;
  }

  if (newName) roleEditData.name = newName;

  const role = guild.roles.cache.get(roleId);
  if (!role) {
    await interaction.reply({ content: `Role with ID ${roleId} not found.`, ephemeral: true });
    return;
  }

  try {
    await role.edit(roleEditData);
    let replyMsg = `Updated <@&${roleId}> role`;
    if (hexColor) replyMsg += `\nHex Color: \`${roleEditData.color}\``;
    if (newName) replyMsg += `\nNew Name: **${newName}**`;
    await interaction.reply({ content: replyMsg, ephemeral: false });
  } catch (err) {
    console.error('Error updating role:', err);
    await interaction.reply({ content: 'Failed to update role. Check image/size/type.', ephemeral: true });
  }
}

async function execute(interaction: ChatInputCommandInteraction) {
  const type = interaction.options.getString('type', true);
  if (type === 'ibhr') return handleRoleEdit(interaction, idclass.roleIBH(), 'IBHR role');
  if (type === 'stormr') return handleRoleEdit(interaction, idclass.roleStorm(), 'storm role');
  if (type === 'ordzyr') return handleRoleEdit(interaction, idclass.roleOrdzy(), 'ordzy role');
  await interaction.reply({ content: 'Unknown role type.', ephemeral: true });
}

export default { data, execute };


