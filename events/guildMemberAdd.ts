import { GuildMember, Events } from 'discord.js';
import { Event } from '../types';
import db from '../utils/db';
import idclass from '../utils/idclass';

const event: Event = {
  name: Events.GuildMemberAdd,
  async execute(member: GuildMember) {
    const roleIds: string[] | null = await db.get(`roles_${member.id}_${member.guild.id}`);
    let restoredRoles: string[] = [];

    if (!member.guild.members.me) return;

const botHighestRolePosition = member.guild.members.me.roles.highest.position;

    if (roleIds && roleIds.length > 0) {
      for (const roleId of roleIds) {
        const role = member.guild.roles.cache.get(roleId);
        if (role && member.guild.members.me?.roles.highest.position > role.position) {
          try {
            await member.roles.add(roleId);
            restoredRoles.push(roleId);
          } catch (err) {
            console.warn(`Could not restore role ${roleId}:`, err);
          }
        }
      }
      await db.delete(`roles_${member.id}_${member.guild.id}`);
    }

    const channel = member.guild.channels.cache.get(idclass.channelJLG());
    if (channel?.isTextBased()) {
      channel.send({
        content: `**${member.displayName}** joined the server.<a:KaedeSpin:1359178579598114846>\nRestored roles: ${restoredRoles.length ? restoredRoles.map(id => `<@&${id}>`).join(', ') : 'None'}`,
        allowedMentions: { parse: [] }
      });
    }
  },
};

export default event;
