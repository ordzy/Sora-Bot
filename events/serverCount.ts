import { GuildMember, VoiceChannel } from 'discord.js';
import { ExtendedClient } from '../utils/ExtendedClient'; 

export default {
    name: 'ready',
    async execute(client: ExtendedClient) {

        const guildId = '1293430817841741899'; 
        const channelId = '1366451279412465785'; 

        const guild = client.guilds.cache.get(guildId);
        if (!guild) return console.error('Guild not found.');

        const updateCount = async () => {
            const channel = guild.channels.cache.get(channelId);
            if (!channel || channel.type !== 2) return; 
            const voiceChannel = channel as VoiceChannel;

            const totalMembers = guild.memberCount;

            try {
                await voiceChannel.setName(`Total Members: ${totalMembers}`);
            } catch (error) {
                console.error('Failed to update server count:', error);
            }
        };

        await updateCount();

        setInterval(updateCount, 5 * 60 * 1000);

        client.on('guildMemberAdd', async () => await updateCount());
        client.on('guildMemberRemove', async () => await updateCount());
    }
};
