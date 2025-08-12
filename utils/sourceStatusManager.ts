import { TextChannel } from 'discord.js';
import idclass from './idclass';
import fetch from 'node-fetch';

export interface SourceModule {
  name: string;
  status: 'up' | 'down';
  message?: string;
  lastUpdated: number;
}

export interface SourceStatusData {
  [key: string]: SourceModule;
}

// API response interface based on your actual API structure
interface APIModule {
  id: string;
  sourceName: string;
  iconUrl: string;
  language: string;
  baseUrl: string;
  manifestUrl: string;
  addedAt: string;
  installCount: number;
  type: string;
  downloadSupport: boolean;
  combo: boolean;
  author: {
    name: string;
    icon: string;
    url: string;
  };
  recommendation?: number;
}

// Store source status data in memory (you can move this to database later)
export const sourceStatusData: SourceStatusData = {};
const API_URL = 'https://library.cufiy.net/api/modules.min.json'; // Update this to your actual API endpoint

// Function to fetch modules from API
export async function fetchModules(): Promise<string[]> {
  try {
    const response = await fetch(API_URL);
    const data = await response.json() as APIModule[];
    
    // Extract all module names (since they all have sourceName property)
    return data
      .filter((module) => module.sourceName && module.sourceName.length > 0)
      .map((module) => module.sourceName);
  } catch (error) {
    console.error('Error fetching modules:', error);
    return [];
  }
}

// Function to initialize new modules as "up"
export function initializeNewModules(moduleNames: string[]): void {
  moduleNames.forEach(name => {
    if (!sourceStatusData[name]) {
      sourceStatusData[name] = {
        name,
        status: 'up',
        lastUpdated: Date.now()
      };
    }
  });
}

// Function to create status text
export function createStatusText(modules: SourceModule[]): string {
  let text = '🔍 **Source Module Status**\n\n';
  
  modules.forEach((module, index) => {
    const statusEmoji = module.status === 'up' ? '🟢' : '🔴';
    const statusText = module.status === 'up' ? 'UP' : 'DOWN';
    const message = module.message ? ` (${module.message})` : '';
    
    text += `${index + 1}. **__${module.name}__** - ${statusEmoji} ${statusText}${message}\n`;
  });

  return text;
}

// Function to split messages if they exceed Discord's limit
export async function splitMessages(modules: SourceModule[], channel: TextChannel): Promise<void> {
  const MAX_MESSAGE_LENGTH = 1900; // Leave some buffer for safety
  
  // Send the first message with header
  let currentMessage = '**Source Module Status**\n\n';
  let currentLength = currentMessage.length;
  let messageNumber = 1;
  
  for (let i = 0; i < modules.length; i++) {
    const module = modules[i];
    const moduleText = `${i + 1}. **__${module.name}__** - ${module.status === 'up' ? '🟢' : '🔴'} ${module.status === 'up' ? 'UP' : 'DOWN'}${module.message ? ` (${module.message})` : ''}\n`;
    
    // Check if adding this module would exceed the limit
    if (currentLength + moduleText.length > MAX_MESSAGE_LENGTH) {
      // Send current message
      await channel.send(currentMessage);
      
      // Start new message (without header for subsequent messages)
      currentMessage = '';
      currentLength = 0;
      messageNumber++;
    }
    
    // Add module to current message
    currentMessage += moduleText;
    currentLength += moduleText.length;
  }
  
  // Send the last message if it has content
  if (currentMessage.trim().length > 0) {
    await channel.send(currentMessage);
  }
}

// Function to update source status
export async function updateSourceStatus(client: any): Promise<void> {
  try {
    const moduleNames = await fetchModules();
    initializeNewModules(moduleNames);
    
    const channel = await client.channels.fetch(idclass.channelSourceStatus());
    if (!channel || !(channel instanceof TextChannel)) {
      console.error('Source status channel not found');
      return;
    }
    
    // Clear previous messages (optional - you can remove this if you want to keep history)
    const messages = await channel.messages.fetch({ limit: 50 });
    const botMessages = messages.filter(msg => msg.author.id === client.user?.id);
    if (botMessages.size > 0) {
      await channel.bulkDelete(botMessages);
    }
    
    // Convert to array and sort by name
    const modulesArray = Object.values(sourceStatusData).sort((a, b) => a.name.localeCompare(b.name));
    
    // Split and send messages if needed
    await splitMessages(modulesArray, channel);
    
    console.log(`Updated source status for ${modulesArray.length} modules`);
  } catch (error) {
    console.error('Error updating source status:', error);
  }
}

// Function to get sorted modules array
export function getSortedModules(): SourceModule[] {
  return Object.values(sourceStatusData).sort((a, b) => a.name.localeCompare(b.name));
}

// Function to update a specific module status
export function updateModuleStatus(moduleName: string, status: 'up' | 'down', message?: string): boolean {
  if (sourceStatusData[moduleName]) {
    sourceStatusData[moduleName].status = status;
    sourceStatusData[moduleName].message = message;
    sourceStatusData[moduleName].lastUpdated = Date.now();
    return true;
  }
  return false;
} 