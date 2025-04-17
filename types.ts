import { ClientEvents } from 'discord.js';

export interface Command {
    data: any;
    execute: (interaction: any) => Promise<void>;
    buttonHandler?: (interaction: any) => Promise<void>;
}

export interface Event {
    name: keyof ClientEvents;
    execute: (...args: any[]) => Promise<void>;
}
