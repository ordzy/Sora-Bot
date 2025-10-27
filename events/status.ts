import { Client, Events, ActivityType } from 'discord.js';

export default {
    name: Events.ClientReady,
    once: true,
    async execute(client: Client<true>) {
        client.user.setActivity('Anime on Luna', {
            type: ActivityType.Watching
        });
    }
};
