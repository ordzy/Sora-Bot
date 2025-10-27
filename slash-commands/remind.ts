import {
    SlashCommandBuilder,
    ChatInputCommandInteraction,
    EmbedBuilder,
    Client,
    MessageFlags
  } from 'discord.js';
  import { QuickDB } from 'quick.db';
  
  const db = new QuickDB();
  
  interface Reminder {
    id: string;
    userId: string;
    message: string;
    time: number;
    createdAt: number;
    sent: boolean;
  }
  
  function parseDuration(durationStr: string): number | null {
    const regex = /^(\d+)(s|m|h|d)$/i;
    const match = durationStr.match(regex);
    if (!match) return null;
  
    const num = parseInt(match[1], 10);
    const unit = match[2].toLowerCase();
  
    switch (unit) {
      case 's': return num * 1000;
      case 'm': return num * 60 * 1000;
      case 'h': return num * 60 * 60 * 1000;
      case 'd': return num * 24 * 60 * 60 * 1000;
      default: return null;
    }
  }
  
  function scheduleReminder(client: Client, reminder: Reminder) {
    const now = Date.now();
    let delay = reminder.time - now;
    const MAX_DELAY = 2147483647;
  
    if (delay <= 0) {
      sendReminder(client, reminder);
      return;
    }
  
    if (delay > MAX_DELAY) {
      setTimeout(() => scheduleReminder(client, reminder), MAX_DELAY);
    } else {
      setTimeout(() => sendReminder(client, reminder), delay);
    }
  }
  
  async function sendReminder(client: Client, reminder: Reminder) {
    try {
      const user = await client.users.fetch(reminder.userId);
      const embed = new EmbedBuilder()
        .setTitle("Reminder")
        .setDescription(reminder.message)
        .setColor('#7E7E7E')
        .setFooter({ text: "Your reminder is here!" });
  
      await user.send({ embeds: [embed] });
      await db.delete(`reminder_${reminder.id}`);
    } catch (error) {
      console.error("Failed to send reminder:", error);
    }
  }
  
  export default {
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
  
    async execute(interaction: ChatInputCommandInteraction, client: Client) {
      const durationStr = interaction.options.getString('duration', true);
      const message = interaction.options.getString('message', true);
      const ms = parseDuration(durationStr);
  
      if (ms === null) {
        return interaction.reply({
          content: "Invalid duration format. Please use `3s`, `3m`, `3h`, or `3d`.",
          flags: MessageFlags.Ephemeral
        });
      }
  
      const remindTime = Date.now() + ms;
      const timestamp = Math.floor(remindTime / 1000);
      const id = `${Date.now()}_${Math.floor(Math.random() * 10000)}`;
  
      const reminder: Reminder = {
        id,
        userId: interaction.user.id,
        message,
        time: remindTime,
        createdAt: Date.now(),
        sent: false
      };
  
      await db.set(`reminder_${id}`, reminder);
      scheduleReminder(client, reminder);
  
      return interaction.reply({
        content: `I will remind you <t:${timestamp}:F> (in **${durationStr}**).`,
        flags: MessageFlags.Ephemeral
      });
    },
  
    async scheduleAllReminders(client: Client) {
      const all = await db.all();
      const reminders = all.filter(item => item.id?.startsWith('reminder_'));
      for (const entry of reminders) {
        scheduleReminder(client, entry.value as Reminder);
      }
    }
  };
  