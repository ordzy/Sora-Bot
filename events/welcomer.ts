import { EmbedBuilder, Events, GuildMember, AttachmentBuilder, TextChannel } from 'discord.js';
import Canvas from '@napi-rs/canvas';
import idclass from '../idclass';

let toggle = 0;

const welcomeImages = [
  "https://i.postimg.cc/5yBHWkDZ/Welcome-Mai.webp",
  "https://i.postimg.cc/T3YKB004/Welcome-Nagisa.webp",
];

export default {
  name: Events.GuildMemberAdd,
  async execute(member: GuildMember) {
    const welcomeChannelId = idclass.welcomeChannelId();
    const channel = member.guild.channels.cache.get(welcomeChannelId) as TextChannel;
    if (!channel) return;

    try {
      const welcomeImageURL = welcomeImages[toggle];
      toggle = (toggle + 1) % 2;

      const canvas = Canvas.createCanvas(800, 300);
      const ctx = canvas.getContext("2d");

      const bg = await Canvas.loadImage(welcomeImageURL);
      ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);

      const avatar = await Canvas.loadImage(
        member.user.displayAvatarURL({ extension: "png", size: 256 })
      );

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const radius = 75;

      ctx.save();
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(avatar, centerX - radius, centerY - radius, radius * 2, radius * 2);
      ctx.restore();

      ctx.beginPath();
      ctx.arc(centerX, centerY, radius + 3, 0, Math.PI * 2);
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 4;
      ctx.stroke();

      const attachment = new AttachmentBuilder(await canvas.encode("png"), {
        name: "welcome.png",
      });

      const embed = new EmbedBuilder()
        .setColor("#ff9500")
        .setTitle(`Welcome, ${member.user.username}`)
        .setDescription(
          `We're excited to have you here! Make sure to check out the following channels to get started and settle in.`
        )
        .setImage("attachment://welcome.png")
        .addFields(
          {
            name: "📌 Getting Started",
            value: [
              `- Read the server rules: <#1293433099665018921>`,
              `- Stay informed with announcements: <#1293432943393505362>`,
            ].join("\n"),
          },
          {
            name: "💬 Community",
            value: [
              `- Join the conversation: <#1293430819049967683>`,
              `- Ask for help if you need it: <#1293432770198110250>`,
            ].join("\n"),
          },
          {
            name: "❓ Frequently Asked Questions",
            value: `- Find quick answers in our FAQ: <#1304138599880593489>`,
          },
          {
            name: "🎯 Pro Tip",
            value: `Stay active, participate in events, and make the most of your time here. We're glad you're with us!`,
          }
        )
        .setFooter({ text: `Welcome to the community!` });

      await channel.send({
        content: `Welcome <@${member.id}>!`,
        embeds: [embed],
        files: [attachment],
      });

    } catch (error) {
      const errorChannelId = idclass.channelErrorLogs();
      const errorChannel = member.guild.channels.cache.get(errorChannelId) as TextChannel;
      if (errorChannel) {
        errorChannel.send(`Error in welcome message:\n\`\`\`${error}\`\`\``);
      }
      console.error("Welcome error:", error);
    }
  },
};
