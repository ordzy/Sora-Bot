const { Client, GatewayIntentBits, REST, Routes, Collection } = require('discord.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config(); // Load environment variables

// Initialize the bot
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds, // Required for slash commands
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.MessageContent,
    ],
    partials: ['CHANNEL'], // Required for handling DMs
});

// Load commands
client.commands = new Collection();
const commands = []; // Array for slash commands registration
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const command = require(path.join(commandsPath, file));
    client.commands.set(command.data.name, command);
    commands.push(command.data.toJSON()); // Prepare commands for global registration
}

const autoReply = require('./events/auto-reply'); // Adjust path if needed

client.on('messageCreate', async (message) => {
    if (!message.author.bot) {
        autoReply(message); // Calls the auto-reply system
    }
});

// Register slash commands globally
const rest = new REST({ version: '10' }).setToken(process.env.logintoken);

(async () => {
    try {
        console.log('Started refreshing global application (/) commands.');

        // Register all commands globally
        await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), {
            body: commands,
        });

        console.log('Successfully reloaded global application (/) commands.');
    } catch (error) {
        console.error(error);
    }
})();

// Event: Bot ready
client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}`);
});

// Event: Handle interaction (commands)
client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        await interaction.reply({
            content: 'There was an error executing this command.',
            ephemeral: true,
        });
    }
});

// Log in to Discord
client.login(process.env.logintoken);
