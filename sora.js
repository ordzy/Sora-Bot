require('dotenv').config();
const { Client, GatewayIntentBits, Collection, REST, Routes, ActivityType } = require('discord.js');
const fs = require('fs');
const path = require('path');
const idclass = require('./idclass');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ],
    partials: ['CHANNEL'],
});

// Command Collections
client.prefixCommands = new Collection();
client.slashCommands = new Collection();

// Load Prefix Commands
const prefixCommandFiles = fs.readdirSync('./prefix-commands').filter(file => file.endsWith('.js'));
for (const file of prefixCommandFiles) {
    const command = require(`./prefix-commands/${file}`);
    client.prefixCommands.set(command.name, command);
}

// Load Slash Commands
const slashCommands = [];
const slashCommandFiles = fs.readdirSync('./slash-commands').filter(file => file.endsWith('.js'));
for (const file of slashCommandFiles) {
    const command = require(`./slash-commands/${file}`);
    client.slashCommands.set(command.data.name, command);
    slashCommands.push(command.data.toJSON());
}

// Load events
const eventFiles = fs.readdirSync(path.join(__dirname, 'events')).filter(file => file.endsWith('.js'));
for (const file of eventFiles) {
    const event = require(path.join(__dirname, 'events', file));
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args, client));
    } else {
        client.on(event.name, (...args) => event.execute(...args, client));
    }
}

// Slash Command Registration
const rest = new REST({ version: '10' }).setToken(process.env.LoginID);
(async () => {
    try {
        console.log('Started refreshing global application (/) commands.');
        await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: slashCommands });
        console.log('Successfully reloaded global application (/) commands.');
    } catch (error) {
        console.error(error);
    }
})();

client.on('interactionCreate', async (interaction) => {
    try {
        if (interaction.isChatInputCommand()) {
            const command = client.slashCommands.get(interaction.commandName);
            if (!command) return;
            await command.execute(interaction);
        } else if (interaction.isButton()) {
            // Only process buttons for the suggestion command.
            if (['suggestionAccept', 'suggestionDecline'].includes(interaction.customId)) {
                const command = client.slashCommands.get('suggest');
                if (command && command.buttonHandler) {
                    await command.buttonHandler(interaction);
                }
            }
        }
    } catch (error) {
        console.error(error);
    }
});

// Prefix Support
const prefixes = ['?', '.'];
client.on('messageCreate', async (message) => {
    const prefix = prefixes.find(p => message.content.startsWith(p));
    if (!prefix) return;
    
    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();
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

// Function to log errors in a Discord channel
async function logErrorToChannel(error, source = 'Unknown') {
    try {
        const logChannel = await client.channels.fetch(idclass.ChannelErrorLogs).catch(() => null);
        if (logChannel) {
            const errorMessage = `**Error in:** \`${source}\`\n\`\`\`${error.stack || error.message || error}\`\`\``;
            if (errorMessage.length > 2000) {
                logChannel.send(`**Error in:** \`${source}\` (Too long, check logs)`);
            } else {
                logChannel.send(errorMessage);
            }
        } else {
            console.error(`Failed to fetch error log channel (${idclass.ChannelErrorLogs}).`);
        }
    } catch (err) {
        console.error(`Error while logging error:`, err);
    }
}

// Redirect console errors to the error log channel
const originalConsoleError = console.error;
console.error = (...args) => {
    originalConsoleError(...args); // Still print to the console
    const errorString = args.map(arg => (arg instanceof Error ? arg.stack : arg)).join(' ');
    logErrorToChannel(errorString, 'Console Error');
};

// Bot startup logging
const startTime = Date.now();

client.once('ready', async () => {
    const endTime = Date.now();
    const startupTime = ((endTime - startTime) / 1000).toFixed(2);

    console.log(`Logged in as ${client.user.tag}`);
    console.log(`Startup time: ${startupTime}s`);

    const logChannel = await client.channels.fetch(idclass.ChannelErrorLogs).catch(() => null);
    if (logChannel) {
        logChannel.send(`${client.user.tag} has been logged in successfully\nStartup Time: \`${startupTime}s\``);
    }
});

client.login(process.env.logintoken);
