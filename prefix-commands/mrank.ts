import { Message, EmbedBuilder, AttachmentBuilder } from "discord.js";
import db from "../utils/db";
import Canvas, { SKRSContext2D } from "@napi-rs/canvas";
import idclass from "../utils/idclass";

// Reuse helper functions from rank.ts
function roundRect(ctx: SKRSContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawFittingText(ctx: SKRSContext2D, text: string, x: number, y: number, maxWidth: number, maxFontSize: number) {
  let fontSize = maxFontSize;
  do {
    ctx.font = `bold ${fontSize}px "Segoe UI"`;
    if (ctx.measureText(text).width <= maxWidth) break;
    fontSize--;
  } while (fontSize > 10);
  ctx.fillText(text, x, y);
}

function computeLevel(totalXp: number) {
  let level = 0;
  let xpLeft = totalXp;
  while (true) {
    const needed = 5 * level ** 2 + 50 * level + 100;
    if (xpLeft >= needed) {
      xpLeft -= needed;
      level++;
    } else break;
  }
  return { level, xpIntoLevel: xpLeft };
}

export default {
  name: "mrank",
  description: "Modify a user's XP amount",
  async execute(message: Message, args: string[]) {
    const commanderRoleID = idclass.roleCommander();
    const authorMember = message.member;

    if (!authorMember?.roles.cache.has(commanderRoleID)) {
      return message.reply({
        content: "❌ You need the **Commander** role to use this command.",
        allowedMentions: { repliedUser: false },
      });
    }

    const mentionedUser = message.mentions.users.first();
    const xpArg = args[1];
    const guildId = message.guild?.id;

    if (!mentionedUser || !xpArg || !guildId) {
      return message.reply({
        content: "Usage: `.mrank @user <xpAmount>`",
        allowedMentions: { repliedUser: false },
      });
    }

    const newXP = parseInt(xpArg);
    if (isNaN(newXP) || newXP < 0) {
      return message.reply({
        content: "Please provide a valid non-negative number for XP.",
        allowedMentions: { repliedUser: false },
      });
    }

    // Get old XP
    const key = `xp_${guildId}_${mentionedUser.id}`;
    const raw = await db.get(key) as { totalXp?: number; xp?: number } | null;
    const oldXP = raw?.totalXp ?? raw?.xp ?? 0;

    // Update database
    await db.set(key, { totalXp: newXP });

    // Generate new rank card
    const { level, xpIntoLevel } = computeLevel(newXP);
    const nextXP = 5 * level ** 2 + 50 * level + 100;

    // Calculate new rank
    const all = (await db.all()).filter(e => e.id.startsWith(`xp_${guildId}_`));
    const sorted = all
      .filter(e => typeof e.value.totalXp === "number")
      .sort((a, b) => (b.value.totalXp as number) - (a.value.totalXp as number));
    const rankPos = sorted.findIndex(e => e.id === key) + 1;

    // Create canvas
    const W = 800, H = 200;
    const canvas = Canvas.createCanvas(W, H);
    const ctx = canvas.getContext("2d");

    // Get user color
    const member = await message.guild!.members.fetch(mentionedUser.id);
    let hex = member.displayHexColor.replace("#", "");
    if (hex === "000000" && mentionedUser.accentColor) {
      hex = mentionedUser.accentColor.toString(16).padStart(6, "0");
    }
    const start = `#${hex}`;
    const end = "#2f2f2f";

    // Draw background
    const grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, start);
    grad.addColorStop(1, end);
    roundRect(ctx, 0, 0, W, H, 20);
    ctx.fillStyle = grad as unknown as string;
    ctx.fill();

    // Draw avatar
    const R = 70, ax = 20, ay = H / 2;
    const avatar = await Canvas.loadImage(mentionedUser.displayAvatarURL({ extension: "png", size: 256 }));
    ctx.save();
    ctx.beginPath();
    ctx.arc(ax + R, ay, R, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(avatar, ax, ay - R, R * 2, R * 2);
    ctx.restore();

    // Draw text
    ctx.fillStyle = "#fff";
    ctx.textBaseline = "middle";
    const tx = ax + R * 2 + 20;
    const info = `Level: ${level}   XP: ${xpIntoLevel.toLocaleString()} / ${nextXP.toLocaleString()}   Rank: #${rankPos}`;
    drawFittingText(ctx, info, tx, ay, W - tx - 20, 28);

    // Draw progress bar
    const barW = W - tx - 20, barH = 16;
    const by = H - barH - 20;
    ctx.fillStyle = "#555";
    roundRect(ctx, tx, by, barW, barH, barH / 2);
    ctx.fill();
    ctx.fillStyle = start;
    roundRect(ctx, tx, by, (xpIntoLevel / nextXP) * barW, barH, barH / 2);
    ctx.fill();

    // Create attachment and embed
    const buffer = await canvas.encode("png");
    const attachment = new AttachmentBuilder(buffer, { name: "rank.png" });

    const embed = new EmbedBuilder()
      .setColor(member.displayHexColor)
      .addFields(
        { name: "Previous XP", value: `${oldXP.toLocaleString()}`, inline: true },
        { name: "New XP", value: `${newXP.toLocaleString()}`, inline: true }
      )
      .setImage("attachment://rank.png")
      .setFooter({ text: `XP modified by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() });

    message.reply({ 
      content: `Successfully updated <@${mentionedUser.id}>'s XP ✅`,
      embeds: [embed],
      files: [attachment],
      allowedMentions: { repliedUser: false }
    });
  },
};
