import 'dotenv/config';
import {
    Client,
    GatewayIntentBits,
    Collection,
    REST,
    Routes,
    ActivityType,
    Partials,
    TextChannel,
    DMChannel,
    NewsChannel
} from 'discord.js';
import fs from 'fs';
import path from 'path';
import idclass from './idclass';

// Extend Discord Client with custom properties
interface ExtendedClient extends Client {
    prefixCommands: Collection<string, any>;
    slashCommands: Collection<string, any>;
}

// Create the bot client
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ],
    partials: [Partials.Channel],
}) as ExtendedClient;

// Add command collections
client.prefixCommands = new Collection();
client.slashCommands = new Collection();

async function init() {
    try {
        // Load Prefix Commands
        const prefixCommandFiles = fs.readdirSync('./prefix-commands').filter(file => file.endsWith('.ts'));
        for (const file of prefixCommandFiles) {
            const command = await import(`./prefix-commands/${file}`);
            client.prefixCommands.set(command.default.name, command.default);
        }

        // Load Slash Commands
        const slashCommands = [];
        const slashCommandFiles = fs.readdirSync('./slash-commands').filter(file => file.endsWith('.ts'));
        for (const file of slashCommandFiles) {
            const command = await import(`./slash-commands/${file}`);
            client.slashCommands.set(command.default.data.name, command.default);
            slashCommands.push(command.default.data.toJSON());
        }

        // Load Events
        const eventFiles = fs.readdirSync(path.join(__dirname, 'events')).filter(file => file.endsWith('.ts'));
        for (const file of eventFiles) {
            const event = await import(path.join(__dirname, 'events', file));
            if (event.default.once) {
                client.once(event.default.name, (...args) => event.default.execute(...args, client));
            } else {
                client.on(event.default.name, (...args) => event.default.execute(...args, client));
            }
        }

        // Check if tokens exist
        if (!process.env.LoginID || !process.env.CLIENT_ID) {
            throw new Error('Missing CLIENT_ID or LoginID in .env!');
        }

        // Register Slash Commands
        const rest = new REST({ version: '10' }).setToken(process.env.LoginID);
        console.log('Refreshing global application (/) commands...');
        await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: slashCommands });
        console.log('Successfully reloaded application (/) commands.');

        // Now login
        await client.login(process.env.LoginID);
    } catch (error) {
        console.error('Fatal error during init():', error);
    }
}


init();

// Slash command and button handler
client.on('interactionCreate', async (interaction) => {
    try {
        if (interaction.isChatInputCommand()) {
            const command = client.slashCommands.get(interaction.commandName);
            if (!command) return;
            await command.execute(interaction, client);
        } else if (interaction.isButton()) {
            if (['suggestionAccept', 'suggestionDecline'].includes(interaction.customId)) {
                const command = client.slashCommands.get('suggest');
                if (command?.buttonHandler) {
                    await command.buttonHandler(interaction);
                }
            }
        }
    } catch (error) {
        console.error(error);
    }
});

// Prefix command handler
const prefixes = ['?', '.'];
client.on('messageCreate', async (message) => {
    const prefix = prefixes.find(p => message.content.startsWith(p));
    if (!prefix) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const commandName = args.shift()!.toLowerCase();
    const command = client.prefixCommands.get(commandName);

    if (command) {
        try {
            await command.execute(message, args, client);
        } catch (error) {
            console.error(`Error in command ${commandName}:`, error);
            message.reply({ content: process.env.ERR, allowedMentions: { parse: [] } });
        }
    }
});

// Error logging to channel
async function logErrorToChannel(error: any, source = 'Unknown') {
    try {
        const logChannel = await client.channels.fetch(idclass.channelErrorLogs()).catch(() => null);
        if (
            logChannel &&
            (logChannel instanceof TextChannel || logChannel instanceof DMChannel || logChannel instanceof NewsChannel)
        ) {
            const errorMessage = `**Error in:** \`${source}\`\n\`\`\`${error.stack || error.message || error}\`\`\``;
            if (errorMessage.length > 2000) {
                logChannel.send(`**Error in:** \`${source}\` (Too long, check logs)`);
            } else {
                await logChannel.send(errorMessage);
            }
        }
    } catch (err) {
        console.error(`Error while logging error:`, err);
    }
}

// Hook into console.error
const originalConsoleError = console.error;
console.error = (...args) => {
    originalConsoleError(...args);
    const errorString = args.map(arg => (arg instanceof Error ? arg.stack : arg)).join(' ');
    logErrorToChannel(errorString, 'Console Error');
};

// Bot Ready
const startTime = Date.now();
client.once('ready', async () => {
    const endTime = Date.now();
    const startupTime = ((endTime - startTime) / 1000).toFixed(2);

    console.log(`Logged in as ${client.user!.tag}`);
    console.log(`Startup time: ${startupTime}s`);

    const logChannel = await client.channels.fetch(idclass.channelErrorLogs()).catch(() => null);
    if (
        logChannel &&
        (logChannel instanceof TextChannel || logChannel instanceof DMChannel || logChannel instanceof NewsChannel)
    ) {
        await logChannel.send(`${client.user!.tag} has been logged in successfully\nStartup Time: \`${startupTime}s\``);
    }

});
