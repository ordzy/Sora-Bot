import {
    SlashCommandBuilder,
    ChatInputCommandInteraction,
    PermissionFlagsBits,
    AttachmentBuilder,
    ColorResolvable,
  } from 'discord.js';
  import idclass from '../idclass';
  import { GuildMember } from 'discord.js';
  import fetch from 'node-fetch';
  
  const MAX_ICON_SIZE = 2 * 1024 * 1024; // 2MB
  
  const data = new SlashCommandBuilder()
    .setName('ibhr')
    .setDescription('Modifies the IBHR role’s color and icon.')
    .addStringOption(option =>
      option.setName('hex')
        .setDescription('Hex color (e.g. #ff5733)')
        .setRequired(true)
    )
    .addAttachmentOption(option =>
      option.setName('image')
        .setDescription('Upload an image under 2MB (PNG/JPG)')
        .setRequired(true)
    );
  
  async function execute(interaction: ChatInputCommandInteraction) {
    const roleId = idclass.roleIBH();
    const member = interaction.member as GuildMember;
    const guild = interaction.guild;
  
    if (!guild || !member || !('roles' in member)) {
      return interaction.reply({ content: 'This command must be used in a server.', ephemeral: true });
    }
  
    const userRoleIds = member.roles.cache.map(role => role.id);
    if (!userRoleIds.includes(roleId)) {
      return interaction.reply({ content: 'Only members with the IBHR role can use this command.', ephemeral: true });
    }
  
    const hexColor = interaction.options.getString('hex', true);
    const formattedHex = hexColor.startsWith('#') ? hexColor : `#${hexColor}`;
    const imageAttachment = interaction.options.getAttachment('image', true);
  
    if (imageAttachment.size > MAX_ICON_SIZE) {
      return interaction.reply({
        content: 'The image is too large lil bro, upload an image under 2MB. Supported formats: PNG, JPG.',
        ephemeral: true,
      });
    }
  
    const allowedTypes = ['image/png', 'image/jpeg'];
    if (!allowedTypes.includes(imageAttachment.contentType || '')) {
      return interaction.reply({
        content: 'Invalid file type. Please upload a PNG, or JPG Image.',
        ephemeral: true,
      });
    }
  
    try {
      const role = guild.roles.cache.get(roleId);
      if (!role) return interaction.reply({ content: `Role with ID ${roleId} not found.`, ephemeral: true });
  
      const response = await fetch(imageAttachment.url);
      const iconBuffer = Buffer.from(await response.arrayBuffer());
  
      await role.edit({
        color: formattedHex as ColorResolvable,
        icon: iconBuffer,
        reason: `IBHR role updated by ${member.user.tag}`,
      });
  
      await interaction.reply({
        content: `Updated <@&${roleId}> role\nHex Color: \`${formattedHex}\``,
        ephemeral: false,
      });
  
    } catch (error) {
      console.error('Error updating IBHR role:', error);
      await interaction.reply({
        content: 'Something went wrong while updating the IBHR role. Please try again or check the image format/size.',
        ephemeral: true,
      });
    }
  }
  
  export default { data, execute };
  