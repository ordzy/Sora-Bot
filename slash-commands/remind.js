const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const fs = require('fs');
const path = require('path');

const remindersFilePath = path.join(__dirname, '../reminders.json');

let reminders = [];
if (fs.existsSync(remindersFilePath)) {
    try {
        reminders = JSON.parse(fs.readFileSync(remindersFilePath, 'utf8'));
    } catch (error) {
        console.error("Error reading reminders file:", error);
        reminders = [];
    }
} else {
    reminders = [];
}

function saveReminders() {
    try {
        fs.writeFileSync(remindersFilePath, JSON.stringify(reminders, null, 4));
    } catch (error) {
        console.error("Error saving reminders:", error);
    }
}

function parseDuration(durationStr) {
    const regex = /^(\d+)(s|m|h|d)$/i;
    const match = durationStr.match(regex);
    if (!match) return null;
    const num = parseInt(match[1], 10);
    const unit = match[2].toLowerCase();
    let ms = 0;
    switch (unit) {
        case 's': ms = num * 1000; break;
        case 'm': ms = num * 60000; break;
        case 'h': ms = num * 3600000; break;
        case 'd': ms = num * 86400000; break;
        default: ms = null;
    }
    return ms;
}

function scheduleReminder(client, reminder) {
    const now = Date.now();
    let delay = reminder.time - now;
    const MAX_DELAY = 2147483647; // Node's max setTimeout

    if (delay <= 0) {
        sendReminder(client, reminder);
        return;
    }

    if (delay > MAX_DELAY) {
        setTimeout(() => {
            scheduleReminder(client, reminder);
        }, MAX_DELAY);
    } else {
        setTimeout(() => {
            sendReminder(client, reminder);
        }, delay);
    }
}

async function sendReminder(client, reminder) {
    try {
        const user = await client.users.fetch(reminder.userId);
        const embed = new EmbedBuilder()
            .setTitle("⏰ Reminder")
            .setDescription(reminder.message)
            .setColor(0x00AE86)
            .setFooter({ text: "Your reminder is here!" });

        await user.send({ embeds: [embed] });

        reminders = reminders.filter(r => r.id !== reminder.id);
        saveReminders();
    } catch (error) {
        console.error("Failed to send reminder:", error);
    }
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('remind')
        .setDescription('Set a reminder using a duration (e.g. 3s, 3m, 3h, 3d) and a message.')
        .addStringOption(option =>
            option.setName('duration')
                .setDescription('Duration before reminder (e.g. 3s, 3m, 3h, 3d)')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('message')
                .setDescription('What to remind you about')
                .setRequired(true)),
    
    async execute(interaction, client) {
        const durationStr = interaction.options.getString('duration');
        const message = interaction.options.getString('message');
        const ms = parseDuration(durationStr);

        if (ms === null) {
            return interaction.reply({ 
                content: "Invalid duration format. Please use `3s`, `3m`, `3h`, or `3d`.", 
                flags: MessageFlags.Ephemeral 
            });
        }

        const remindTime = Date.now() + ms;
        const timestamp = Math.floor(remindTime / 1000); // Discord timestamps use seconds
        const id = `${Date.now()}_${Math.floor(Math.random() * 10000)}`;

        const reminder = {
            id,
            userId: interaction.user.id,
            message,
            time: remindTime,
            createdAt: Date.now(),
            sent: false
        };

        reminders.push(reminder);
        saveReminders();
        scheduleReminder(client, reminder);

        return interaction.reply({ 
            content: `I will remind you <t:${timestamp}:F> (in **${durationStr}**).`, 
            flags: MessageFlags.Ephemeral 
        });
    },

    scheduleAllReminders: (client) => {
        for (const reminder of reminders) {
            scheduleReminder(client, reminder);
        }
    }
};
