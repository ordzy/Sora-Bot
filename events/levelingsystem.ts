import { Client, Message } from 'discord.js';
import db from '../utils/db';
import idclass from '../idclass';

const cooldown = new Set();

const levelRoles: { [level: number]: () => string } = {
  1: idclass.rolePluto,
  5: idclass.roleMercury,
  10: idclass.roleVenus,
  15: idclass.roleMars,
  25: idclass.roleEarth,
  35: idclass.roleNeptune,
  50: idclass.roleUranus,
  75: idclass.roleSaturn,
  100: idclass.roleJupiter,
  150: idclass.roleSun,
};

module.exports = {
  name: 'messageCreate',

  async execute(message: Message, client: Client) {
    if (message.author.bot || !message.guild) return;

    const userKey = `xp_${message.guild.id}_${message.author.id}`;
    const cooldownKey = `${message.guild.id}_${message.author.id}`;

    if (cooldown.has(cooldownKey)) return;
    cooldown.add(cooldownKey);
    setTimeout(() => cooldown.delete(cooldownKey), 60000); // 1 minute cooldown

    let userData = await db.get(userKey) || { level: 0, xp: 0, totalXp: 0 };

    const xpGain = Math.floor(Math.random() * 10) + 10;
    userData.xp += xpGain;
    userData.totalXp += xpGain;

    const getXpForLevel = (level: number) => 5 * (level ** 2) + 50 * level + 100;

    let leveledUp = false;
    let nextLevelXp = getXpForLevel(userData.level);

    while (userData.xp >= nextLevelXp) {
      userData.xp -= nextLevelXp;
      userData.level++;
      leveledUp = true;
      nextLevelXp = getXpForLevel(userData.level);
    }

    if (leveledUp) {
      await message.reply({
        content: `<@${message.author.id}> leveled up to **Level ${userData.level}**!`,
      });

      const roleFunction = levelRoles[userData.level];
      if (roleFunction) {
        const roleId = roleFunction();
        const guildMember = await message.guild.members.fetch(message.author.id);

        if (!guildMember.roles.cache.has(roleId)) {
          try {
            const allLevelRoleIds = Object.values(levelRoles).map(fn => fn());
            const rolesToRemove = guildMember.roles.cache.filter(
              r => allLevelRoleIds.includes(r.id) && r.id !== roleId
            );

            await guildMember.roles.remove(rolesToRemove);
            await guildMember.roles.add(roleId);

            await message.reply({
              content: `<@${message.author.id}> has been awarded the <@&${roleId}> role!`,
              allowedMentions: { parse: [] },
            });
          } catch (err) {
            console.error('Failed to assign role:', err);
          }
        }
      }
    }

    await db.set(userKey, userData);
  }
};
