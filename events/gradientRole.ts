import {
  Client,
  Events,
  Guild,
  Role,
  ColorResolvable
} from 'discord.js';
import idclass from '../utils/idclass';

// Function to generate random colors
function generateRandomColor(): ColorResolvable {
  return Math.floor(Math.random() * 0xFFFFFF);
}

// Function to update role gradient colors
async function updateRoleGradient(guild: Guild, roleId: string): Promise<void> {
  try {
    const role = await guild.roles.fetch(roleId);
    if (!role) {
      console.error(`Role with ID ${roleId} not found`);
      return;
    }

    const primaryColor = generateRandomColor();
    const secondaryColor = generateRandomColor();
    
    // Set the role with gradient colors
    await role.setColor(primaryColor);
    await role.setColor(secondaryColor);
    
    console.log(`Updated commander role gradient - Primary: #${primaryColor.toString(16).padStart(6, '0')}, Secondary: #${secondaryColor.toString(16).padStart(6, '0')}`);
  } catch (error) {
    console.error('Error updating role gradient:', error);
  }
}

// Function to start the interval
function startGradientInterval(client: Client): void {
  const SIX_HOURS = 6 * 60 * 60 * 1000; // 6 hours in milliseconds
  
  // Update immediately when the bot starts
  client.guilds.cache.forEach(async (guild) => {
    const commanderRoleIds = idclass.roleCommander();
    if (Array.isArray(commanderRoleIds)) {
      // If it's an array, update each role
      for (const roleId of commanderRoleIds) {
        await updateRoleGradient(guild, roleId);
      }
    } else {
      // If it's a single ID, update just that role
      await updateRoleGradient(guild, commanderRoleIds);
    }
  });

  // Set up interval to update every 6 hours
  setInterval(async () => {
    client.guilds.cache.forEach(async (guild) => {
      const commanderRoleIds = idclass.roleCommander();
      if (Array.isArray(commanderRoleIds)) {
        // If it's an array, update each role
        for (const roleId of commanderRoleIds) {
          await updateRoleGradient(guild, roleId);
        }
      } else {
        // If it's a single ID, update just that role
        await updateRoleGradient(guild, commanderRoleIds);
      }
    });
  }, SIX_HOURS);
}

export default {
  name: Events.ClientReady,
  once: true,
  async execute(client: Client) {
    // Start the gradient role color update interval
    startGradientInterval(client);
  }
}; 