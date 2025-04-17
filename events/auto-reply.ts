import { Message, EmbedBuilder } from 'discord.js';

export default function autoReply(message: Message) {
  const responses = [
    {
      trigger: [
        "subs don't work", "subs dont work", "subs are not working", "subtitles don't work",
        "subtitles aren't working", "subtitles not working", "no subtitles", "missing subtitles",
        "can't see subtitles", "subtitle issue", "subtitle problem", "subs missing",
        "subs not showing", "subtitles not showing", "subtitles broken", "subs broken",
        "where are the subtitles", "how to enable subtitles", "SDW Sora",
        "can't get subtitles to work", "subtitle error", "subs don’t work" // note: includes curly apostrophe
      ],
      reply: "You need to use the Sora player in Media Player for subtitles to work.<:KannaLove:1323338061517422662>"
    },

    // Add more auto-replies here if needed
  ];

  for (const entry of responses) {
    if (entry.trigger.some(trigger =>
      message.content.toLowerCase().includes(trigger.toLowerCase())
    )) {
      const embed = new EmbedBuilder()
        .setColor('#FFA500') // Orange
        .setDescription(entry.reply);

      message.reply({ embeds: [embed] });
      break;
    }
  }
}
