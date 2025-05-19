import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
} from "discord.js";
import db from "../utils/db";
import Canvas, { SKRSContext2D } from "@napi-rs/canvas";

function roundRect(
  ctx: SKRSContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
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

function drawFittingText(
  ctx: SKRSContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  maxFontSize: number
) {
  let fontSize = maxFontSize;
  do {
    ctx.font = `bold ${fontSize}px "Segoe UI"`;
    if (ctx.measureText(text).width <= maxWidth) break;
    fontSize--;
  } while (fontSize > 10);
  ctx.fillText(text, x, y);
}

// EXACT same level formula as .mrank
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
  data: new SlashCommandBuilder()
    .setName("rank")
    .setDescription("View a user's level, XP, and leaderboard rank.")
    .addUserOption(opt =>
      opt.setName("user").setDescription("User to check").setRequired(false)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const guildId = interaction.guildId;
    if (!guildId)
      return interaction.reply({ content: "Use this in a server.", ephemeral: true });

    // 1) identify user & key
    const user = interaction.options.getUser("user") || interaction.user!;
    const key = `xp_${guildId}_${user.id}`;

    // 2) fetch raw DB record
    const raw = await db.get(key) as { totalXp?: number; xp?: number } | null;
    if (!raw || (raw.totalXp == null && raw.xp == null)) {
      return interaction.reply({ content: `🚫 <@${user.id}> has no XP yet.`, ephemeral: true });
    }

    // 3) derive totalXp, then recompute level & xpIntoLevel
    const totalXp = raw.totalXp ?? raw.xp!;
    const { level, xpIntoLevel } = computeLevel(totalXp);
    const nextXP = 5 * level ** 2 + 50 * level + 100;

    // 4) recompute leaderboard rank same as mrank
    const all = (await db.all()).filter(e => e.id.startsWith(`xp_${guildId}_`));
    const sorted = all
      .filter(e => typeof e.value.totalXp === "number")
      .sort((a, b) => (b.value.totalXp as number) - (a.value.totalXp as number));
    const rankPos = sorted.findIndex(e => e.id === key) + 1;

    // 5) build canvas exactly like mrank.ts
    const W = 800, H = 200;
    const canvas = Canvas.createCanvas(W, H);
    const ctx = canvas.getContext("2d");

    // get accent from displayHexColor or fallback to accentColor
    const member = await interaction.guild!.members.fetch(user.id);
    let hex = member.displayHexColor.replace("#", "");
    if (hex === "000000" && user.accentColor != null) {
      hex = user.accentColor.toString(16).padStart(6, "0");
    }
    const start = `#${hex}`;
    const end = "#2f2f2f";

    // background gradient
    const grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, start);
    grad.addColorStop(1, end);
    roundRect(ctx, 0, 0, W, H, 20);
    ctx.fillStyle = grad as unknown as string;
    ctx.fill();

    // avatar
    const R = 70, ax = 20, ay = H / 2;
    const avatar = await Canvas.loadImage(user.displayAvatarURL({ extension: "png", size: 256 }));
    ctx.save();
    ctx.beginPath();
    ctx.arc(ax + R, ay, R, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(avatar, ax, ay - R, R * 2, R * 2);
    ctx.restore();

    // text
    ctx.fillStyle = "#fff";
    ctx.textBaseline = "middle";
    const tx = ax + R * 2 + 20;
    const info = `Level: ${level}   XP: ${xpIntoLevel.toLocaleString()} / ${nextXP.toLocaleString()}   Rank: #${rankPos}`;
    drawFittingText(ctx, info, tx, ay, W - tx - 20, 28);

    // progress bar
    const barW = W - tx - 20, barH = 16;
    const by = H - barH - 20;
    ctx.fillStyle = "#555";
    roundRect(ctx, tx, by, barW, barH, barH / 2);
    ctx.fill();
    ctx.fillStyle = start;
    roundRect(ctx, tx, by, (xpIntoLevel / nextXP) * barW, barH, barH / 2);
    ctx.fill();

    // 6) reply with image
    const buffer = await canvas.encode("png");
    await interaction.reply({ files: [{ attachment: buffer, name: "rank.png" }] });
  },
};
