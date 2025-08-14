import { TextChannel, Message } from 'discord.js';
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

// Store message references for editing
let statusMessages: Message[] = [];

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
export function initializeNewModules(moduleNames: string[]): string[] {
  const newModules: string[] = [];
  
  moduleNames.forEach(name => {
    if (!sourceStatusData[name]) {
      sourceStatusData[name] = {
        name,
        status: 'up',
        lastUpdated: Date.now()
      };
      newModules.push(name);
    }
  });
  
  return newModules;
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
export async function splitMessages(modules: SourceModule[], channel: TextChannel): Promise<Message[]> {
  const MAX_MESSAGE_LENGTH = 1900; // Leave some buffer for safety
  const messages: Message[] = [];
  
  // Send the first message with header
  let currentMessage = '**Modules Status**\n\n';
  let currentLength = currentMessage.length;
  
  for (let i = 0; i < modules.length; i++) {
    const module = modules[i];
    const moduleText = `${i + 1}. **__${module.name}__** - ${module.status === 'up' ? '🟢' : '🔴'} ${module.status === 'up' ? 'UP' : 'DOWN'}${module.message ? ` (${module.message})` : ''}\n`;
    
    // Check if adding this module would exceed the limit
    if (currentLength + moduleText.length > MAX_MESSAGE_LENGTH) {
      // Send current message
      const sentMessage = await channel.send(currentMessage);
      messages.push(sentMessage);
      
      // Start new message (without header for subsequent messages)
      currentMessage = '';
      currentLength = 0;
    }
    
    // Add module to current message
    currentMessage += moduleText;
    currentLength += moduleText.length;
  }
  
  // Send the last message if it has content
  if (currentMessage.trim().length > 0) {
    const sentMessage = await channel.send(currentMessage);
    messages.push(sentMessage);
  }
  
  return messages;
}

// Function to add new modules to existing messages
export async function addNewModulesToMessages(client: any, newModules: string[]): Promise<void> {
  try {
    const channel = await client.channels.fetch(idclass.channelSourceStatus());
    if (!channel || !(channel instanceof TextChannel)) {
      console.error('Source status channel not found');
      return;
    }
    
    // Convert to array and sort by name
    const modulesArray = Object.values(sourceStatusData).sort((a, b) => a.name.localeCompare(b.name));
    
    // If we have existing messages, try to edit the last one
    if (statusMessages.length > 0) {
      const lastMessage = statusMessages[statusMessages.length - 1];
      const newText = createStatusText(modulesArray);
      
      // Check if the new text fits in one message
      if (newText.length <= 1900) {
        // Edit the last message with the complete updated list
        await lastMessage.edit(newText);
        console.log('Updated existing message with new modules');
      } else {
        // If it's too long, delete old messages and create new ones
        try {
          await Promise.all(statusMessages.map(msg => msg.delete().catch(() => {})));
        } catch (error) {
          console.warn('Failed to delete old status messages:', error);
        }
        
        // Create new messages
        statusMessages = await splitMessages(modulesArray, channel);
        console.log('Created new messages due to length limit');
      }
    } else {
      // No existing messages, create new ones
      statusMessages = await splitMessages(modulesArray, channel);
      console.log('Created initial status messages');
    }
    
    console.log(`Added ${newModules.length} new modules to status list`);
  } catch (error) {
    console.error('Error adding new modules to messages:', error);
  }
}

// Function to update source status
export async function updateSourceStatus(client: any): Promise<void> {
  try {
    const moduleNames = await fetchModules();
    const newModules = initializeNewModules(moduleNames);
    
    // Only update if there are new modules
    if (newModules.length > 0) {
      console.log(`Found ${newModules.length} new modules: ${newModules.join(', ')}`);
      await addNewModulesToMessages(client, newModules);
    } else {
      console.log('No new modules found, skipping status update');
    }
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

// Function to edit status messages when status changes (no resending)
export async function editStatusInPlace(client: any, changedModule: string): Promise<void> {
  try {
    const channel = await client.channels.fetch(idclass.channelSourceStatus());
    if (!channel || !(channel instanceof TextChannel)) {
      console.error('Source status channel not found');
      return;
    }
    
    // Convert to array and sort by name
    const modulesArray = Object.values(sourceStatusData).sort((a, b) => a.name.localeCompare(b.name));
    
    // If we have existing messages, try to edit them in place
    if (statusMessages.length > 0) {
      const newText = createStatusText(modulesArray);
      
      // Check if the new text fits in one message
      if (newText.length <= 1900) {
        // Edit the first message with the complete updated list
        await statusMessages[0].edit(newText);
        
        // Delete additional messages if they exist
        if (statusMessages.length > 1) {
          for (let i = 1; i < statusMessages.length; i++) {
            try {
              await statusMessages[i].delete();
            } catch (error) {
              console.warn('Failed to delete additional message:', error);
            }
          }
          statusMessages = [statusMessages[0]];
        }
        
        console.log(`Updated status for ${changedModule} in existing message`);
      } else {
        // If it's too long, we need to split into multiple messages
        // Delete old messages and create new ones
        try {
          await Promise.all(statusMessages.map(msg => msg.delete().catch(() => {})));
        } catch (error) {
          console.warn('Failed to delete old status messages:', error);
        }
        
        // Create new messages
        statusMessages = await splitMessages(modulesArray, channel);
        console.log(`Updated status for ${changedModule} with new split messages`);
      }
    }
  } catch (error) {
    console.error('Error editing status in place:', error);
  }
} 