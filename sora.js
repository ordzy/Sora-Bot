const { Client, GatewayIntentBits, REST, Routes, Collection, ActivityType } = require('discord.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Initialize the bot
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.MessageContent,
    ],
    partials: ['CHANNEL'],
});

client.commands = new Collection();
const commands = [];
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const command = require(path.join(commandsPath, file));
    client.commands.set(command.data.name, command);
    commands.push(command.data.toJSON());
}

// Global interaction handler for both slash commands and button interactions.
client.on('interactionCreate', async (interaction) => {
    try {
        if (interaction.isChatInputCommand()) {
            const command = client.commands.get(interaction.commandName);
            if (!command) return;
            await command.execute(interaction);
        } else if (interaction.isButton()) {
            // Only process buttons for the suggestion command.
            if (['suggestionAccept', 'suggestionDecline'].includes(interaction.customId)) {
                const command = client.commands.get('suggest');
                if (command && command.buttonHandler) {
                    await command.buttonHandler(interaction);
                }
            }
        }
    } catch (error) {
        console.error(error);
    }
});

// Auto-reply event (if needed)
const autoReply = require('./events/auto-reply');
client.on('messageCreate', async (message) => {
    if (!message.author.bot) {
        autoReply(message);
    }
});

// Register slash commands globally
const rest = new REST({ version: '10' }).setToken(process.env.logintoken);
(async () => {
    try {
        console.log('Started refreshing global application (/) commands.');
        await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: commands });
        console.log('Successfully reloaded global application (/) commands.');
    } catch (error) {
        console.error(error);
    }
})();

// Bot ready event
client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}`);
    client.user.setPresence({
        status: 'online',
        activities: [{
            name: 'Anime on Sora',
            type: ActivityType.Watching,
        }],
    });
});

client.login(process.env.logintoken);
