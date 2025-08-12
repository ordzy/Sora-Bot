import {
  Client,
  Events
} from 'discord.js';
import { updateSourceStatus } from '../utils/sourceStatusManager';

// Function to start the interval
function startSourceStatusInterval(client: Client): void {
  const ONE_HOUR = 60 * 60 * 1000; // 1 hour in milliseconds
  
  // Update immediately when the bot starts
  updateSourceStatus(client);
  
  // Set up interval to update every 1 hour
  setInterval(() => {
    updateSourceStatus(client);
  }, ONE_HOUR);
}

export default {
  name: Events.ClientReady,
  once: true,
  async execute(client: Client) {
    // Start the source status update interval
    startSourceStatusInterval(client);
  }
}; 