import {
    Events,
    Interaction,
    Client,
    ButtonInteraction,
    Message,
    TextChannel,
    Colors
  } from 'discord.js';
  import { ExtendedClient } from '../utils/ExtendedClient';

  import db from '../utils/db';
  import { buttonHandler as suggestButtonHandler, updateSuggestionEmbeds } from '../slash-commands/suggest';
  
  export default {
    name: Events.InteractionCreate,
    async execute(interaction: Interaction, client: ExtendedClient) {
        try {
        // Handle Slash Commands
        if (interaction.isChatInputCommand()) {
          const command = client.slashCommands.get(interaction.commandName);
          if (!command) return;
          try {
            await command.execute(interaction, client);
          } catch (err) {
            console.error(`Error in slash command ${interaction.commandName}:`, err);
            if (interaction.isRepliable() && !interaction.replied && !interaction.deferred) {
              await interaction.reply({
                content: 'Something went wrong while executing this command.',
                ephemeral: true
              }).catch(() => {}); // prevent Unknown Interaction error
            }
          }
        }
  
        // Handle Buttons
        if (interaction.isButton()) {
          const button = interaction as ButtonInteraction;
  
          if (button.customId === 'suggestionAccept') {
            await suggestButtonHandler(button);
            return;
          }
  
          if (button.customId === 'suggestionDecline') {
            const data = await db.get(`suggestion_${button.message.id}`);
            if (!data) return;
  
            const user = button.user;
            const channel = button.channel;
  
            if (!channel || !channel.isTextBased()) return;
            if (!(channel instanceof TextChannel)) return;
  
            await button.reply({
              content: 'Please type your reason for declining below. You have 5 minutes.',
              flags: 64
            });
  
            const filter = (m: Message) => m.author.id === user.id;
            const collector = channel.createMessageCollector({
              filter,
              time: 5 * 60 * 1000,
              max: 1
            });
  
            collector.on('collect', async (msg: Message) => {
              const reason = msg.content.trim();
  
              const reply = await msg.reply({
                content: `Suggestion declined with reason: \`${reason}\`.`,
              });
              setTimeout(() => reply.delete().catch(() => {}), 3000);
  
              await updateSuggestionEmbeds(button, data, 'Declined', Colors.Red, reason);
              await db.delete(`suggestion_${button.message.id}`);
              msg.delete().catch(() => {});
            });
  
            collector.on('end', (collected, reason) => {
              if (reason === 'time' && collected.size === 0) {
                button.followUp({
                  content: 'No reason received in 5 minutes. Decline cancelled.',
                  flags: 64
                }).catch(console.error);
              }
            });
  
            return;
          }
        }
      } catch (error) {
        console.error(error, 'InteractionCreate');
      }
    }
  };
  