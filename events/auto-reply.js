const { EmbedBuilder } = require('discord.js');

module.exports = function (message) {
    const responses = [
        {
            trigger: ["subs don't work", "subs dont work", "subs are not working", "subtitles don't work", "subtitles aren't working", "subtitles not working", "no subtitles", "missing subtitles", "can't see subtitles", "subtitle issue", "subtitle problem", "subs missing", "subs not showing", "subtitles not showing", "subtitles broken", "subs broken", "where are the subtitles", "how to enable subtitles", "SDW Sora", "can't get subtitles to work", "subtitle error","subs don’t work"],
            reply: "You need to use the Sora player in Media Player for subtitles to work.<:KannaLove:1323338061517422662>"
        },
       // {
       //     trigger: ["subs don't work", "subs are not working", "SDW Sora"],
      //      reply: "You need to use the Sora player in Media Player for subtitles to work.<:KannaLove:1323338061517422662>"
       // },
       
        // Add more responses as needed
    ];

    for (const entry of responses) {
        if (entry.trigger.some(trigger => message.content.toLowerCase().includes(trigger))) {
            const embed = new EmbedBuilder()
                .setColor("#FFA500") // Orange color
                .setDescription(entry.reply);

            message.reply({ embeds: [embed] });
            break; // Stop after the first match
        }
    }
};
