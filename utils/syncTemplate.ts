import {
  Client,
  GuildChannel,
  OverwriteResolvable,
  PermissionsBitField,
  ChannelType,
  TextChannel,
} from 'discord.js';

export default async function syncServers(client: Client) {
  const isTest = process.env.isTest === 'true';

  if (!isTest) {
    console.log('Syncing is disabled in production mode.');
    return;
  }

  const mainServerId = process.env.MAIN_SERVER_ID!;
  const testServerId = process.env.TEST_SERVER_ID!;

  const mainServer = client.guilds.cache.get(mainServerId);
  const testServer = client.guilds.cache.get(testServerId);

  if (!mainServer || !testServer) {
    console.log('Main or test server not found.');
    return;
  }

  // Sync Roles
  console.log('Starting role sync...');
  const rolesToSync = mainServer.roles.cache.filter(role => !role.managed && role.name !== '@everyone');

  for (const role of rolesToSync.values()) {
    console.log(`Syncing role: ${role.name}, ID: ${role.id}`);
    const existingRole = testServer.roles.cache.find(r => r.name === role.name);
    if (existingRole) {
      console.log(`Role ${role.name} already exists in test server. Skipping...`);
      continue;
    }

    try {
      console.log(`Creating role: ${role.name}`);
      await testServer.roles.create({
        name: role.name,
        color: role.color,
        hoist: role.hoist,
        mentionable: role.mentionable,
        permissions: role.permissions,
      });
    } catch (error) {
      console.error(`Failed to create role ${role.name}:`, error);
      continue; // Skip problematic role and continue
    }
  }

  // Sync Channels
  console.log('Starting channel sync...');
  for (const mainChannelId of mainServer.channels.cache.keys()) {
    const mainChannel = mainServer.channels.cache.get(mainChannelId);
    if (!mainChannel) continue;

    // Narrow the type of mainChannel
    if (
      mainChannel.type !== ChannelType.GuildText &&
      mainChannel.type !== ChannelType.GuildVoice &&
      mainChannel.type !== ChannelType.GuildCategory
    ) {
      continue;
    }

    console.log(`Syncing channel: ${mainChannel.name}`);
    const existingChannel = testServer.channels.cache.find(c => c.name === mainChannel.name && c.type === mainChannel.type);
    if (existingChannel) {
      console.log(`Channel ${mainChannel.name} already exists in test server. Skipping...`);
      continue;
    }

    try {
      const parentCategory = mainChannel.parentId ? testServer.channels.cache.find(c => c.name === mainChannel.parent?.name && c.type === ChannelType.GuildCategory) : undefined;

      const channelData: any = {
        name: mainChannel.name,
        type: mainChannel.type,
        position: 'position' in mainChannel ? mainChannel.position : undefined,
        parent: parentCategory ? parentCategory.id : undefined,
        permissionOverwrites: 'permissionOverwrites' in mainChannel ? mainChannel.permissionOverwrites.cache.map(overwrite => ({
          id: overwrite.id,
          allow: overwrite.allow.bitfield,
          deny: overwrite.deny.bitfield,
          type: overwrite.type,
        })) : [],
      };

      if (mainChannel.type === ChannelType.GuildText) {
        channelData.topic = 'topic' in mainChannel ? mainChannel.topic : undefined;
        channelData.nsfw = 'nsfw' in mainChannel ? mainChannel.nsfw : false;
      }

      if (mainChannel.type === ChannelType.GuildVoice) {
        channelData.bitrate = 'bitrate' in mainChannel ? mainChannel.bitrate : undefined;
        channelData.userLimit = 'userLimit' in mainChannel ? mainChannel.userLimit : undefined;
      }

      await testServer.channels.create(channelData);
    } catch (error) {
      console.error(`Failed to sync channel ${mainChannel.name}:`, error);
    }
  }

  console.log('Sync complete.');
}
