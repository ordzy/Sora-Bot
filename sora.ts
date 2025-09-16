import 'dotenv/config';
import {
    Client,
    GatewayIntentBits,
    Collection,
    REST,
    Routes,
    Partials,
    ClientOptions
} from 'discord.js';
import fs from 'fs';
import path from 'path';
import { Command, Event } from './types';
import './utils/errorLogger';

// Client configuration
const clientConfig: ClientOptions = {
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ],
    partials: [Partials.Channel]
};

// Extend Discord Client with custom properties
interface ExtendedClient extends Client {
    prefixCommands: Collection<string, Command>;
    slashCommands: Collection<string, Command>;
}

// Create the bot client
export const client = new Client(clientConfig) as ExtendedClient;

// Initialize collections
client.prefixCommands = new Collection();
client.slashCommands = new Collection();

async function loadPrefixCommands(): Promise<void> {
    const commandsPath = './prefix-commands';
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.ts'));
    
    console.log('Loading prefix commands...');
    for (const file of commandFiles) {
        try {
            const command = await import(`${commandsPath}/${file}`);
            client.prefixCommands.set(command.default.name, command.default);
        } catch (error) {
            console.error(`Error loading prefix command ${file}:`, error);
        }
    }
    console.log(`Loaded ${client.prefixCommands.size} prefix commands!`);
}

async function loadSlashCommands(): Promise<Command[]> {
    const commands: Command[] = [];
    const commandsPath = './slash-commands';
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.ts'));
    
    console.log('Loading slash commands...');
    for (const file of commandFiles) {
        try {
            const command = await import(`${commandsPath}/${file}`);
            client.slashCommands.set(command.default.data.name, command.default);
            commands.push(command.default.data.toJSON());
        } catch (error) {
            console.error(`Error loading slash command ${file}:`, error);
        }
    }
    console.log(`Loaded ${commands.length} slash commands!`);
    return commands;
}

async function loadEvents(): Promise<void> {
    const eventsPath = path.join(__dirname, 'events');
    const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.ts'));
    
    console.log('Loading events...');
    for (const file of eventFiles) {
        try {
            const event = await import(path.join(eventsPath, file)) as { default: Event };
            const listener = (...args: any[]) => event.default.execute(...args, client);
            
            if (event.default.once) {
                client.once(event.default.name, listener);
            } else {
                client.on(event.default.name, listener);
            }
        } catch (error) {
            console.error(`Error loading event ${file}:`, error);
        }
    }
    console.log(`Loaded ${eventFiles.length} events!`);
}

async function registerSlashCommands(commands: Command[]): Promise<void> {
    if (!process.env.LoginID) {
        throw new Error('Missing LoginID in .env!');
    }

    const rest = new REST({ version: '10' }).setToken(process.env.LoginID);

    try {
        console.log('Registering slash commands...');
        await rest.put(
            Routes.applicationCommands(client.user!.id), // use detected bot ID
            { body: commands }
        );
        console.log('Successfully registered slash commands!');
    } catch (error) {
        console.error('Error registering slash commands:', error);
        throw error;
    }
}

async function init() {
    try {
        console.log('\nInitializing Sora Bot...\n');
        
        // Load all commands and events
        await loadPrefixCommands();
        const slashCommands = await loadSlashCommands();
        await loadEvents();
        
        // Login first, so client.user is available
        await client.login(process.env.LoginID);

        // Register slash commands using detected client ID
        await registerSlashCommands(slashCommands);
        
        console.log('\nSora Bot is ready to serve!\n');
    } catch (error) {
        console.error('Fatal error during initialization:', error);
        process.exit(1);
    }
}

// Handle process errors
process.on('unhandledRejection', (error) => {
    console.error('Unhandled promise rejection:', error);
});

process.on('uncaughtException', (error) => {
    console.error('Uncaught exception:', error);
    process.exit(1);
});

init();
