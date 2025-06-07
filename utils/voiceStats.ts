import { Client, ChannelType, TextChannel, Message } from 'discord.js';
import fetch from 'node-fetch';
import idclass from './idclass';
import { config } from 'dotenv';
config();

const API_URL = 'https://sora.jm26.net/api/stats.json';
const isTest = process.env.isTest === 'true';

export default async function setupVoiceStats(client: Client) {
  // Skip execution if in test mode
  if (isTest) {
    console.log('[VoiceStats] Skipping voice stats setup in test environment');
    return;
  }

  let lastLogMessage: Message | null = null; // In-memory tracker

  async function updateChannel() {
    try {
      const response = await fetch(API_URL);
      const data = await response.json() as {
        modules?: {
          total?: number;
        };
      };

      const count = data.modules?.total || 0;
      const vcChannel = await client.channels.fetch(idclass.VCTotal());
      const logChannel = await client.channels.fetch(idclass.channelErrorLogs());

      if (!vcChannel || vcChannel.type !== ChannelType.GuildVoice) return;
      if (!logChannel || !logChannel.isTextBased()) return;

      const newName = `Total-Modules: ${count}`;

      if (vcChannel.name !== newName) {
        await vcChannel.setName(newName);

        // Delete previous message if it exists
        if (lastLogMessage && lastLogMessage.deletable) {
          try {
            await lastLogMessage.delete();
          } catch (err) {
            console.warn('[VoiceStats] Failed to delete previous log message:', err);
          }
        }

        // Send new log message and store it
        const message = await (logChannel as TextChannel).send(`Voice channel renamed to **${newName}** using API data.`);
        lastLogMessage = message;
      }
    } catch (err) {
      console.error('[VoiceStats] Error updating channel:', err);

      try {
        const errorChannel = await client.channels.fetch(idclass.channelErrorLogs());
        if (errorChannel?.isTextBased()) {
          (errorChannel as TextChannel).send(`Error updating voice stats channel:\n\`\`\`${(err as Error).message}\`\`\``);
        }
      } catch (e) {
        console.error('[VoiceStats] Failed to send error to Discord:', e);
      }
    }
  }

  // Initial run
  await updateChannel();

  // Repeat every hour
  setInterval(updateChannel, 60 * 60 * 1000);
}
