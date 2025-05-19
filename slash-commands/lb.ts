import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  AttachmentBuilder,
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

// Utility to average an array of hex colors into one hex
function averageHex(colors: string[]): string {
  let r = 0, g = 0, b = 0;
  colors.forEach((hex) => {
    const v = hex.replace("#", "");
    const cr = parseInt(v.slice(0, 2), 16);
    const cg = parseInt(v.slice(2, 4), 16);
    const cb = parseInt(v.slice(4, 6), 16);
    r += cr; g += cg; b += cb;
  });
  const n = colors.length;
  r = Math.round(r / n);
  g = Math.round(g / n);
  b = Math.round(b / n);
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b)
    .toString(16)
    .slice(1);
}

export default {
  data: new SlashCommandBuilder()
    .setName("leaderboard")
    .setDescription("View the top XP leaderboard."),

  async execute(interaction: ChatInputCommandInteraction) {
    const guildId = interaction.guildId;
    if (!guildId)
      return interaction.reply({
        content: "This command must be used in a server.",
        ephemeral: true,
      });

    const all = (await db.all()).filter((e) =>
      e.id.startsWith(`xp_${guildId}_`)
    );
    const sorted = all
      .filter((e) => typeof e.value.totalXp === "number")
      .sort((a, b) => (b.value.totalXp as number) - (a.value.totalXp as number));

    if (!sorted.length) {
      return interaction.reply({
        content: "No XP data found for this server.",
        ephemeral: true,
      });
    }

    const pageSize = 5;
    const totalPages = Math.ceil(sorted.length / pageSize);
    let page = 0;

    const W = 1000;
    const entryH = 120;
    const padTop = 100;
    const H = padTop + pageSize * entryH + 60;

    const generateImage = async (page: number) => {
      const canvas = Canvas.createCanvas(W, H);
      const ctx = canvas.getContext("2d");

      const startIdx = page * pageSize;
      const pageData = sorted.slice(startIdx, startIdx + pageSize);

      // 1) Fetch banner colors (or fallback)
      const bannerCols = await Promise.all(
        pageData.map(async (entry) => {
          const user = await interaction.client.users.fetch(
            entry.id.split("_")[2]
          );
          const c = (user as any).bannerColor as string | null;
          return c ?? "#222222";
        })
      );

      // 2) Compute average color
      const avg = averageHex(bannerCols);

      // Create a sleek, rich greyscale radial gradient
      const grad = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W);

      // Inner core – soft light grey
      grad.addColorStop(0, "#3a3a3a");         // Subtle soft grey center
      grad.addColorStop(0.3, "#2e2e2e");       // Deep midtone grey

      // Mid range – charcoal shades
      grad.addColorStop(0.6, "#1f1f1f");       // Charcoal grey

      // Outer edge – almost black
      grad.addColorStop(0.85, "#141414");      // Near-black with a hint of grey
      grad.addColorStop(1, "#0a0a0a");         // Deep black edge

      // Draw rounded rectangle background
      roundRect(ctx, 0, 0, W, H, 30);
      ctx.fillStyle = grad;
      ctx.fill();

      // Add soft overlay for extra richness and polish
      ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
      ctx.fillRect(0, 0, W, H);

      // 4) Draw bg + outline
      roundRect(ctx, 0, 0, W, H, 30);
      ctx.fillStyle = grad as unknown as string;
      ctx.fill();
      ctx.lineWidth = 6;
      ctx.strokeStyle = "#ffffff33";
      roundRect(ctx, 0, 0, W, H, 30);
      ctx.stroke();

      // 5) Title shadow + text
      ctx.save();
      ctx.shadowColor = "rgba(0,0,0,0.5)";
      ctx.shadowBlur = 8;
      ctx.fillStyle = "#fff";
      ctx.font = 'bold 42px "Segoe UI"';
      ctx.fillText("XP Leaderboard", 40, 60);
      ctx.restore();

      // 6) Draw entries (boxes, avatars, text, bars) — identical to before
      for (let i = 0; i < pageData.length; i++) {
        const entry = pageData[i];
        const totalXp = entry.value.totalXp as number;
        const member = await interaction.guild!.members
          .fetch(entry.id.split("_")[2])
          .catch(() => null);
        const user = member?.user ?? null;
        const displayName = member?.displayName ?? "Unknown";
        const { level, xpIntoLevel } = computeLevel(totalXp);
        const nextXP = 5 * level ** 2 + 50 * level + 100;
        const baseY = padTop + i * entryH;

        // box fill + shadow
        ctx.save();
        ctx.shadowColor = "#00000088";
        ctx.shadowBlur = 12;
        ctx.fillStyle = "rgba(0,0,0,0.4)";
        roundRect(ctx, 30, baseY, W - 60, 100, 20);
        ctx.fill();
        ctx.restore();

        // box outline by rank
        const rank = startIdx + i;
        let outlineColor = "#222222";
        if (rank === 0) outlineColor = "#FFD700";
        else if (rank === 1) outlineColor = "#C0C0C0";
        else if (rank === 2) outlineColor = "#CD7F32";

        ctx.lineWidth = 4;
        ctx.strokeStyle = outlineColor;
        roundRect(ctx, 30, baseY, W - 60, 100, 20);
        ctx.stroke();

        // separator
        if (i < pageData.length - 1) {
          ctx.strokeStyle = "#ffffff20";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(50, baseY + 100);
          ctx.lineTo(W - 50, baseY + 100);
          ctx.stroke();
        }

        // rank circle + outline + number
        const cx = 70, cy = baseY + 50;
        ctx.beginPath();
        ctx.arc(cx, cy, 30, 0, Math.PI * 2);
        ctx.fillStyle = outlineColor;
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = "rgba(0,0,0,0.5)";
        ctx.stroke();
        ctx.font = "bold 28px Segoe UI";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.lineWidth = 2;
        ctx.strokeStyle = "#00000088";
        ctx.strokeText(`${rank + 1}`, cx, cy);
        ctx.fillStyle = "#fff";
        ctx.fillText(`${rank + 1}`, cx, cy);
        ctx.textAlign = "left";

        // avatar
        if (user) {
          const avatar = await Canvas.loadImage(
            user.displayAvatarURL({ extension: "png", size: 256 })
          );
          ctx.save();
          ctx.beginPath();
          ctx.arc(120 + 40, baseY + 10 + 40, 40, 0, Math.PI * 2);
          ctx.clip();
          ctx.drawImage(avatar, 120, baseY + 10, 80, 80);
          ctx.restore();
        }

        // name
        ctx.fillStyle = "#fff";
        drawFittingText(ctx, displayName, 220, baseY + 25, 500, 32);

        // XP text (60% opacity)
        ctx.font = '24px "Segoe UI"';
        ctx.fillStyle = "rgba(204,204,204,0.6)";
        const xpTxt = `Level: ${level}   XP: ${xpIntoLevel.toLocaleString()} / ${nextXP.toLocaleString()}`;
        ctx.fillText(xpTxt, 220, baseY + 55);

        // progress bar
        const barX = 220, barY = baseY + 75, barW = 500, barH = 16;
        const fillW = (xpIntoLevel / nextXP) * barW;
        ctx.fillStyle = "#444";
        roundRect(ctx, barX, barY, barW, barH, barH / 2);
        ctx.fill();
        const glow = ctx.createLinearGradient(barX, 0, barX + fillW, 0);
        glow.addColorStop(0, "#43e97b");
        glow.addColorStop(1, "#38f9d7");
        ctx.fillStyle = glow;
        roundRect(ctx, barX, barY, fillW, barH, barH / 2);
        ctx.fill();
      }

      // 7) Footer outline + fill
      const footer = `Page ${page + 1} / ${totalPages}`;
      ctx.font = '20px "Segoe UI"';
      ctx.textAlign = "right";
      ctx.textBaseline = "bottom";
      ctx.lineWidth = 4;
      ctx.strokeStyle = "#000";
      ctx.strokeText(footer, W - 40, H - 20);
      ctx.fillStyle = "#fff";
      ctx.fillText(footer, W - 40, H - 20);

      return new AttachmentBuilder(await canvas.encode("png"), {
        name: "leaderboard.png",
      });
    };

    const getRow = (page: number) =>
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId("prev")
          .setLabel("Previous")
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(page === 0),
        new ButtonBuilder()
          .setCustomId("next")
          .setLabel("Next")
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(page === totalPages - 1)
      );

    let image = await generateImage(page);
    const message = await interaction.reply({
      files: [image],
      components: [getRow(page)],
      fetchReply: true,
    });

    const collector = message.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 60000,
    });

    collector.on("collect", async (i) => {
      if (i.user.id !== interaction.user.id) {
        await i.reply({ content: "This button is not for you!", ephemeral: true });
        return;
      }
      if (i.customId === "next" && page < totalPages - 1) page++;
      else if (i.customId === "prev" && page > 0) page--;
      image = await generateImage(page);
      await i.update({ files: [image], components: [getRow(page)] });
    });

    collector.on("end", async () => {
      await interaction.editReply({ components: [] });
    });
  },
};
