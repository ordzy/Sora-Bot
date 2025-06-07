import { SlashCommandBuilder, EmbedBuilder, ChatInputCommandInteraction } from 'discord.js';

interface CommandCategory {
    name: string;
    commands: {
        name: string;
        description: string;
    }[];
}

const slashCommands: CommandCategory[] = [
    {
        name: 'General',
        commands: [
            { name: 'help', description: 'Shows this help message' },
            { name: 'info', description: 'Displays detailed bot information and stats' },
            { name: 'randomhex', description: 'Generates a random hex color' }
        ]
    },
    {
        name: 'Utility',
        commands: [
            { name: 'remind', description: 'Set a reminder for yourself' },
            { name: 'suggest', description: 'Make a suggestion for the server which can only be used in request-a-module channel.' },
            { name: 'app', description: 'Application related commands' }
        ]
    },
    {
        name: 'Leveling',
        commands: [
            { name: 'rank', description: 'Check your or another user\'s rank' },
            { name: 'lb', description: 'View the server\'s leaderboard' }
        ]
    }
];

const prefixCommands: CommandCategory[] = [
    
    {
        name: 'User Management',
        commands: [
            { name: 'userinfo', description: 'Get information about a user that are not in the server.' },
            { name: 'pfp', description: 'View user\'s profile picture' }
        ]
    },
    
    
];

export default {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Shows all available commands')
        .addStringOption(option =>
            option
                .setName('category')
                .setDescription('Specific category of commands to show')
                .addChoices(
                    { name: 'Slash Commands', value: 'slash' },
                    { name: 'Prefix Commands', value: 'prefix' }
                )
                .setRequired(false)
        ),

    async execute(interaction: ChatInputCommandInteraction) {
        const category = interaction.options.getString('category');
        const prefix = '!'; // You might want to make this configurable

        if (category === 'slash') {
            // Show only slash commands
            const embed = new EmbedBuilder()
                .setTitle('Slash Commands')
                .setDescription('List of all available slash commands\nUse these commands by typing `/command`')
                .setColor('#ff9500');

            slashCommands.forEach(cat => {
                embed.addFields({
                    name: cat.name,
                    value: cat.commands.map(cmd => `**/${cmd.name}** - ${cmd.description}`).join('\n'),
                    inline: false
                });
            });

            await interaction.reply({ embeds: [embed] });
            return;
        }

        if (category === 'prefix') {
            // Show only prefix commands
            const embed = new EmbedBuilder()
                .setTitle('Prefix Commands')
                .setDescription(`List of all available prefix commands\nUse these commands by typing \`${prefix}command\``)
                .setColor('#ff9500');

            prefixCommands.forEach(cat => {
                embed.addFields({
                    name: cat.name,
                    value: cat.commands.map(cmd => `**${prefix}${cmd.name}** - ${cmd.description}`).join('\n'),
                    inline: false
                });
            });

            await interaction.reply({ embeds: [embed] });
            return;
        }

        // Show overview of all commands
        const mainEmbed = new EmbedBuilder()
            .setTitle('Sora Bot Commands')
            .setDescription('Here are all available commands. Use the buttons below to navigate through different categories.')
            .setColor('#ff9500')
            .addFields(
                {
                    name: 'Slash Commands Overview',
                    value: `Total: ${slashCommands.reduce((acc, cat) => acc + cat.commands.length, 0)} commands\nUse \`/help category:Slash Commands\` for details`,
                    inline: true
                },
                {
                    name: 'Prefix Commands Overview',
                    value: `Total: ${prefixCommands.reduce((acc, cat) => acc + cat.commands.length, 0)} commands\nUse \`/help category:Prefix Commands\` for details`,
                    inline: true
                }
            )
            .addFields(
                {
                    name: 'Quick Start',
                    value: [
                        '1. Use slash commands with `/` prefix',
                        `2. Use prefix commands with \`${prefix}\` prefix`,
                        '3. For detailed help on a specific command, use it with no arguments'
                    ].join('\n')
                }
            )
            .setFooter({ text: 'For more detailed information about a specific command, use it without any arguments' });

        await interaction.reply({ embeds: [mainEmbed] });
    },
}; 