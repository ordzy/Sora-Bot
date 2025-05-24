import {
  Client,
  Events,
  TextChannel,
  DMChannel,
  NewsChannel
} from 'discord.js';
import idclass from '../idclass';
import setupVoiceStats from '../utils/voiceStats';
import syncServers from '../utils/syncTemplate'; // Import sync function

const startTime = Date.now();

export default {
  name: Events.ClientReady,
  once: true,
  async execute(client: Client) {
    const endTime = Date.now();
    const startupTime = ((endTime - startTime) / 1000).toFixed(2);

    console.log(`Logged in as ${client.user!.tag}`);
    console.log(`Startup time: ${startupTime}s`);

    await setupVoiceStats(client);

    const logChannel = await client.channels.fetch(idclass.channelErrorLogs()).catch(() => null);
    if (
      logChannel &&
      (logChannel instanceof TextChannel ||
        logChannel instanceof DMChannel ||
        logChannel instanceof NewsChannel)
    ) {
      await logChannel.send(
        `${client.user!.tag} has been logged in successfully\nStartup Time: \`${startupTime}s\``
      );
    }

    await syncServers(client);

    setInterval(async () => {
      await syncServers(client);
    }, 60 * 60 * 1000); // every 1 hour
  }
};
