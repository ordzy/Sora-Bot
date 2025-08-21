import {
  Client,
  Events,
  Guild,
  Role,
  ColorResolvable
} from 'discord.js';
import idclass from '../utils/idclass';
import { config } from 'dotenv';
config();

const isTest = process.env.isTest === 'true';

// Function to generate random colors
function generateRandomColor(): ColorResolvable {
  return Math.floor(Math.random() * 0xFFFFFF);
}

// Function to update role with actual gradient
async function updateRoleGradient(guild: Guild, roleId: string): Promise<void> {
  try {
    const role = await guild.roles.fetch(roleId);
    if (!role) {
      console.error(`Role with ID ${roleId} not found`);
      return;
    }

    const primaryColor = generateRandomColor();
    const secondaryColor = generateRandomColor();
    
    // Try to use Discord.js gradient role methods
    try {
      // Method 1: Try setGradient if it exists
      if ('setGradient' in role && typeof (role as any).setGradient === 'function') {
        await (role as any).setGradient(primaryColor, secondaryColor);
        console.log(`Updated commander role with gradient - Primary: #${primaryColor.toString(16).padStart(6, '0')}, Secondary: #${secondaryColor.toString(16).padStart(6, '0')}`);
        return;
      }
      
      // Method 2: Try edit with gradient property
      if ('edit' in role && typeof role.edit === 'function') {
        await role.edit({
          color: primaryColor,
          reason: 'Gradient role update'
        });
        console.log(`Updated commander role color to: #${primaryColor.toString(16).padStart(6, '0')}`);
        return;
      }
      
      // Method 3: Fallback to setColor
      if ('setColor' in role && typeof role.setColor === 'function') {
        await role.setColor(primaryColor);
        console.log(`Updated commander role color to: #${primaryColor.toString(16).padStart(6, '0')}`);
        return;
      }
      
      // If none of the methods exist, log error
      console.error('No valid role color methods found');
      
    } catch (gradientError) {
      console.log('Gradient method not available, using fallback color method');
      // Fallback to regular color setting
      try {
        await role.setColor(primaryColor);
        console.log(`Updated commander role color to: #${primaryColor.toString(16).padStart(6, '0')}`);
      } catch (fallbackError) {
        console.error('Fallback color method also failed:', fallbackError);
      }
    }
    
  } catch (error) {
    console.error('Error updating role:', error);
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
    // Skip execution if in test mode
    if (isTest) {
      console.log('[GradientRole] Skipping gradient role setup in test environment');
      return;
    }

    // Start the gradient role color update interval
    startGradientInterval(client);
  }
}; 