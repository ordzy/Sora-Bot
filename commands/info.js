const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const os = require('os');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('info')
        .setDescription('Displays bot information, uptime, and other details.'),

    async execute(interaction) {
        const bot = interaction.client;

        // Calculate uptime
        const totalSeconds = Math.floor(bot.uptime / 1000);
        const days = Math.floor(totalSeconds / 86400);
        const hours = Math.floor((totalSeconds % 86400) / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        const uptime = `${days}d ${hours}h ${minutes}m ${seconds}s`;

        // Bot details
        const serverCount = bot.guilds.cache.size;
        const botVersion = '2.1.0'; // Update this if needed
        const discordJsVersion = require('discord.js').version;
        const developer = 'Sora Team'; // Change this to your name or Discord tag

        // Create embed
        const embed = new EmbedBuilder()
            .setTitle('Sora Bot Info')
            .setDescription('Here is some useful information about me.')
            .addFields(
                { name: 'Uptime', value: uptime, inline: true },
                { name: 'Servers', value: `${serverCount} servers`, inline: true },
                { name: 'Bot Version', value: botVersion, inline: true },
                { name: 'Discord.js Version', value: `v${discordJsVersion}`, inline: true },
                { name: 'Hosted On', value: os.platform(), inline: true },
                { name: 'Developer', value: developer, inline: true },
                { 
                    name: 'Sora Bot is Open Source!', 
                    value: 'You will be able to submit pull requests to add new features. Github Link: https://github.com/bshar1865/Sora-Bot' 
                }
            )
            .setColor('#ff9500')
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },
};
