// types.ts

import {
    SlashCommandBuilder,
    ChatInputCommandInteraction,
    ButtonInteraction
} from 'discord.js';

export interface Command {
    data: SlashCommandBuilder;
    execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
    buttonHandler?: (interaction: ButtonInteraction) => Promise<void>;
}
