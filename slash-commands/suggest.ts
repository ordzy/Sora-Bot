import {
    SlashCommandBuilder,
    ChatInputCommandInteraction,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    Colors,
    ButtonInteraction,
    CacheType,
    ModalSubmitInteraction
  } from 'discord.js';
  
  import idclass from '../utils/idclass';
  import { QuickDB } from 'quick.db';
  const db = new QuickDB();
  
  export const data = new SlashCommandBuilder()
    .setName('suggest')
    .setDescription('Submit a suggestion')
    .addStringOption(option =>
      option.setName('name').setDescription('Module name').setRequired(true))
    .addStringOption(option =>
      option.setName('link')
      .setDescription('Module link (must start with https://)')
      .setRequired(true))
    .addStringOption(option =>
      option.setName('language').setDescription('Language').setRequired(true))
    .addStringOption(option =>
      option.setName('type').setDescription('Type')
        .setRequired(true)
        .addChoices(
          { name: 'Anime', value: 'Anime' },
          { name: 'Movie/Show', value: 'Movie/Show' }
        )
    );
  
  function isValidUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'https:';
    } catch {
      return false;
    }
  }
  
  export async function execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply({ flags: 64 }); // 64 = ephemeral flag
  
    const name = interaction.options.getString('name', true);
    const link = interaction.options.getString('link', true);
    const language = interaction.options.getString('language', true);
    const type = interaction.options.getString('type', true);
  
    // URL validation
    if (!isValidUrl(link)) {
      return interaction.editReply({ 
        content: 'Please provide a valid URL that starts with `https://`\n' +
                'Example: `https://example.com`\n\n' +
                'Invalid URL format provided: `' + link + '`'
      });
    }

    const allKeys = await db.all();
    const alreadyExists = allKeys.some(entry => entry.value?.link === link);

    if (alreadyExists) {
      return interaction.editReply({
        content: `❌ This link has already been suggested:\n\`${link}\``
      });
    }
  
    const suggestionChannel = interaction.guild?.channels.cache.get(idclass.channelMRC());
    const publicChannel = interaction.guild?.channels.cache.get(idclass.channelMRC2());
  
    if (!suggestionChannel || !publicChannel) {
      return interaction.editReply({ content: 'One or more suggestion channels were not found.' });
    }
  
    if (interaction.channelId !== idclass.channelMR()) {
      return interaction.editReply({
        content: `This command can only be used in <#${idclass.channelMR()}>.`
      });
    }
  
    const faviconUrl = `https://www.google.com/s2/favicons?sz=64&domain_url=${encodeURIComponent(link)}`;
    let previewImage: string | null = null;
  
    try {
      const msg = await (suggestionChannel as any).send({ content: link });
      if (msg.embeds[0]?.image?.url) previewImage = msg.embeds[0].image.url;
    } catch {}
  
    const suggestionEmbed = new EmbedBuilder()
      .setTitle(name)
      .setURL(link)
      .setDescription(`**Type:** ${type}\n**Language:** ${language}\n${link}`)
      .setColor("#ff9500")
      .setThumbnail(faviconUrl)
      .addFields({ name: 'Status', value: 'Pending' });
  
    if (previewImage) suggestionEmbed.setImage(previewImage);
  
    const buttonsRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId('suggestionAccept').setLabel('Accept').setStyle(3),
      new ButtonBuilder().setCustomId('suggestionDecline').setLabel('Decline').setStyle(4)
    );
  
    const suggestionMessage = await (suggestionChannel as any).send({
      embeds: [suggestionEmbed],
      components: [buttonsRow]
    });
  
    const publicEmbed = new EmbedBuilder()
      .setTitle('New Module Submission')
      .setColor("#ff9500")
      .addFields(
        { name: 'Module Name', value: name },
        { name: 'Module Type', value: type },
        { name: 'Module Link', value: `**${link}**` },
        { name: 'Submitted By', value: interaction.user.tag },
        { name: 'Status', value: 'Pending' }
      )
      .setThumbnail(faviconUrl)
      .setFooter({ text: interaction.user.tag, iconURL: interaction.user.displayAvatarURL() });
  
    const publicMessage = await (publicChannel as any).send({ embeds: [publicEmbed] });
  
    const suggestionData = {
      suggestionMessageId: suggestionMessage.id,
      publicMessageId: publicMessage.id,
      guildId: interaction.guildId,
      suggestionChannelId: suggestionChannel.id,
      publicChannelId: publicChannel.id,
      name,
      link,
      language,
      type,
      status: 'Pending',
      createdAt: Date.now(),
      userId: interaction.user.id
    };
  
    await db.set(`suggestion_${suggestionMessage.id}`, suggestionData);
  
    const reply = await interaction.editReply({ content: 'Suggestion submitted!' });
    setTimeout(() => reply.delete().catch(() => {}), 3000);
  }
  
  export async function buttonHandler(interaction: ButtonInteraction<CacheType>) {
    const data = await db.get(`suggestion_${interaction.message.id}`);
    if (!data) return;
  
    if (interaction.customId === 'suggestionAccept') {
        try {
          if (!interaction.deferred && !interaction.replied) {
            await interaction.deferUpdate();
          }
          await updateSuggestionEmbeds(interaction, data, 'Approved', Colors.Green, null);
          await db.delete(`suggestion_${interaction.message.id}`);
        } catch (err: any) {
            if (err.code !== 10062 && err.code !== 40060) {
              console.error('Error handling Accept button:', err);
            }
      }
    }
  }
  
  export async function updateSuggestionEmbeds(
    interaction: ButtonInteraction | ModalSubmitInteraction,
    data: any,
    status: string,
    color: any,
    reason: string | null
  ) {
    try {
      const reviewChannel = interaction.guild?.channels.cache.get(data.suggestionChannelId);
      const publicChannel = interaction.guild?.channels.cache.get(data.publicChannelId);
  
      if (!reviewChannel || !publicChannel) return;
  
      const reviewMsg = await (reviewChannel as any)?.messages.fetch(data.suggestionMessageId).catch(() => null);
      const publicMsg = await (publicChannel as any)?.messages.fetch(data.publicMessageId).catch(() => null);
  
      if (!reviewMsg || !publicMsg) return;
  
      const updatedReview = EmbedBuilder.from(reviewMsg.embeds[0])
        .setColor(color)
        .spliceFields(0, 1, { name: 'Status', value: status });
  
      if (reason) updatedReview.addFields({ name: '**Reason**', value: reason });
  
      const updatedPublic = EmbedBuilder.from(publicMsg.embeds[0])
        .setColor(color)
        .spliceFields(4, 1, { name: 'Status', value: status });
  
      if (reason) updatedPublic.addFields({ name: '**Reason**', value: reason });
  
      const disabledButtons = new ActionRowBuilder<ButtonBuilder>().addComponents(
        ...(reviewMsg.components[0].components as any[]).map((b: any) =>
          ButtonBuilder.from(b).setDisabled(true)
        )
      );
  
      await reviewMsg.edit({ embeds: [updatedReview], components: [disabledButtons] });
      await publicMsg.edit({ embeds: [updatedPublic] });
    } catch (err) {
      console.error("Error updating suggestion embeds:", err);
    }
  }
  
  export default {
    data,
    execute,
    buttonHandler
  };
  