const { 
    SlashCommandBuilder, 
    EmbedBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    Colors,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle
} = require('discord.js');
const fs = require('fs');
const path = require('path');
const idclass = require('../idclass'); // Loads ChannelMRC and ChannelMR from idclass.js

// Define the path for the JSON file to store suggestions
const suggestionsFilePath = path.join(__dirname, '../suggestions.json');

// Utility: load suggestions from JSON file
function loadSuggestions() {
    if (fs.existsSync(suggestionsFilePath)) {
        try {
            const data = fs.readFileSync(suggestionsFilePath, 'utf8');
            const parsed = JSON.parse(data);
            // If stored data is an array, convert it to an object keyed by suggestionMessageId.
            if (Array.isArray(parsed)) {
                const obj = {};
                for (const suggestion of parsed) {
                    obj[suggestion.suggestionMessageId] = suggestion;
                }
                return obj;
            }
            return parsed;
        } catch (err) {
            console.error("Error reading suggestions file:", err);
            return {};
        }
    }
    return {};
}

// Utility: save suggestions to JSON file (always as an object)
function saveSuggestions(suggestions) {
    try {
        fs.writeFileSync(suggestionsFilePath, JSON.stringify(suggestions, null, 4));
    } catch (err) {
        console.error("Error writing suggestions file:", err);
    }
}

// In‑memory cache
let suggestionsCache = loadSuggestions();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('suggest')
        .setDescription('Submit a suggestion with a name, link, language, and type')
        .addStringOption(option =>
            option.setName('name')
                .setDescription('Enter the name of the suggestion')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('link')
                .setDescription('Enter the link of the suggestion')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('language')
                .setDescription('Enter the language of the suggestion')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('type')
                .setDescription('Select if it is an anime or a show')
                .setRequired(true)
                .addChoices(
                    { name: 'Anime', value: 'Anime' },
                    { name: 'Movie/Show', value: 'Movie/Show' }
                )),
    async execute(interaction) {
        try {
            await interaction.deferReply({ flags: 64 });
            
            const name = interaction.options.getString('name');
            const link = interaction.options.getString('link');
            const language = interaction.options.getString('language');
            const type = interaction.options.getString('type');

            // Validate correct channel
            const suggestionChannel = interaction.guild.channels.cache.get(idclass.ChannelMRC);
            if (!suggestionChannel) {
                return interaction.editReply({ content: 'Suggestion channel not found.' });
            }
            if (interaction.channelId !== idclass.ChannelMR) {
                return interaction.editReply({ content: `This command can only be used in <#${idclass.ChannelMR}>.` });
            }

            // Thumbnail & preview
            const faviconUrl = `https://www.google.com/s2/favicons?sz=64&domain_url=${encodeURIComponent(link)}`;
            let previewImage = null;
            try {
                const msg = await suggestionChannel.send({ content: link });
                if (msg.embeds[0]?.image?.url) {
                    previewImage = msg.embeds[0].image.url;
                }
            } catch (err) {
                console.error("Failed to fetch preview image:", err);
            }

            // Build suggestion embed + buttons
            const pendingColor = "#ff9500";
            const suggestionEmbed = new EmbedBuilder()
                .setTitle(name)
                .setURL(link)
                .setDescription(`**Type:** ${type}\n**Language:** ${language}\n${link}`)
                .setColor(pendingColor)
                .setThumbnail(faviconUrl)
                .addFields({ name: 'Status', value: 'Pending' });
            if (previewImage) suggestionEmbed.setImage(previewImage);

            const buttonsRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('suggestionAccept')
                    .setLabel('Accept')
                    .setStyle('Success'),
                new ButtonBuilder()
                    .setCustomId('suggestionDecline')
                    .setLabel('Decline')
                    .setStyle('Danger')
            );

            // Send into review channel
            const suggestionMessage = await suggestionChannel.send({
                embeds: [suggestionEmbed],
                components: [buttonsRow]
            });

            // Public announcement
            const publicEmbed = new EmbedBuilder()
                .setTitle('New Module Submission')
                .setColor(pendingColor)
                .addFields(
                    { name: 'Module Name', value: name },
                    { name: 'Module Type', value: type },
                    { name: 'Module Link', value: `**${link}**` },
                    { name: 'Submitted By', value: interaction.user.tag },
                    { name: 'Status', value: 'Pending' }
                )
                .setThumbnail(faviconUrl)
                .setFooter({ text: interaction.user.tag, iconURL: interaction.user.displayAvatarURL() });

            const publicChannel = interaction.guild.channels.cache.get(idclass.ChannelMRC2);
            const publicMessage = await publicChannel.send({ embeds: [publicEmbed] });

            // Cache & save
            suggestionsCache[suggestionMessage.id] = {
                suggestionMessageId: suggestionMessage.id,
                publicMessageId: publicMessage.id,
                guildId: interaction.guild.id,
                suggestionChannelId: suggestionChannel.id,
                publicChannelId: publicChannel.id,
                name,
                link,
                language,
                type,
                status: 'Pending',
                createdAt: Date.now()
            };
            saveSuggestions(suggestionsCache);

            // Confirm to user & auto‑delete (safely)
            const replyMessage = await interaction.editReply({
                content: 'Suggestion submitted!',
                flags: 64
            });
            setTimeout(async () => {
                try {
                    await replyMessage.delete();
                } catch (err) {
                    // Ignore “Unknown Message”
                    if (err.code !== 10008) console.error("Failed to delete reply:", err);
                }
            }, 3000);

        } catch (err) {
            console.error("Error executing /suggest command:", err);
            if (!interaction.deferred && !interaction.replied) {
                await interaction.reply({ content: 'There was an error processing your suggestion.', flags: 64 });
            } else {
                await interaction.editReply({ content: 'There was an error processing your suggestion.' });
            }
        }
    },

    async buttonHandler(interaction) {
        if (!interaction.isButton()) return;
        if (!['suggestionAccept', 'suggestionDecline'].includes(interaction.customId)) return;

        const suggestionMessageId = interaction.message.id;
        const data = suggestionsCache[suggestionMessageId];
        if (!data) {
            console.error("Suggestion not in cache:", suggestionMessageId);
            return;
        }

        let newStatus, newColor, reason = null;
        if (interaction.customId === 'suggestionAccept') {
            await interaction.deferUpdate();
            newStatus = 'Approved';
            newColor = Colors.Green;
        } else {
            // Decline flow with modal
            const modal = new ModalBuilder()
                .setCustomId(`declineModal_${suggestionMessageId}`)
                .setTitle('Decline Reason');
            const reasonInput = new TextInputBuilder()
                .setCustomId('declineReason')
                .setLabel('Reason for decline (optional)')
                .setStyle(TextInputStyle.Paragraph)
                .setRequired(false);
            modal.addComponents(new ActionRowBuilder().addComponents(reasonInput));
            await interaction.showModal(modal);

            try {
                const submitted = await interaction.awaitModalSubmit({
                    filter: i => i.customId === `declineModal_${suggestionMessageId}` && i.user.id === interaction.user.id,
                    time: 30000
                });
                reason = submitted.fields.getTextInputValue('declineReason').trim() || null;
                await submitted.reply({ content: 'Suggestion declined.', flags: 64 });
            } catch {
                // timed out or error, continue without reason
            }

            newStatus = 'Declined';
            newColor = Colors.Red;
        }

        // Update review embed
        try {
            const chan = interaction.guild.channels.cache.get(data.suggestionChannelId);
            let msg;
            try {
                msg = await chan.messages.fetch(suggestionMessageId);
            } catch (err) {
                if (err.code === 10008) return console.warn("Review message gone, skipping update");
                throw err;
            }
            const updated = EmbedBuilder.from(msg.embeds[0])
                .setColor(newColor)
                .spliceFields(0, 1, { name: 'Status', value: newStatus });
            if (reason) updated.addFields({ name: '**Reason**', value: reason });

            const disabledRow = ActionRowBuilder.from(msg.components[0]);
            disabledRow.components = disabledRow.components.map(b => ButtonBuilder.from(b).setDisabled(true));
            await msg.edit({ embeds: [updated], components: [disabledRow] });
        } catch (err) {
            console.error("Error updating suggestion embed:", err);
        }

        // Update public embed
        try {
            const chan = interaction.guild.channels.cache.get(data.publicChannelId);
            let msg;
            try {
                msg = await chan.messages.fetch(data.publicMessageId);
            } catch (err) {
                if (err.code === 10008) return console.warn("Public message gone, skipping update");
                throw err;
            }
            const updatedPub = EmbedBuilder.from(msg.embeds[0])
                .setColor(newColor)
                .spliceFields(4, 1, { name: 'Status', value: newStatus });
            if (reason) updatedPub.addFields({ name: '**Reason**', value: reason });
            await msg.edit({ embeds: [updatedPub] });
        } catch (err) {
            console.error("Error updating public embed:", err);
        }

        // Persist status
        data.status = newStatus;
        if (reason) data.reason = reason;
        saveSuggestions(suggestionsCache);
    }
};
