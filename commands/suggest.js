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

// Create an in-memory cache for suggestions
let suggestionsCache = loadSuggestions();

const command = {
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
            // Defer reply using flags (64) for ephemeral response.
            await interaction.deferReply({ flags: 64 });
            
            const name = interaction.options.getString('name');
            const link = interaction.options.getString('link');
            const language = interaction.options.getString('language');
            const type = interaction.options.getString('type');

            // Validate channels using idclass values.
            const suggestionChannel = interaction.guild.channels.cache.get(idclass.ChannelMRC);
            if (!suggestionChannel) {
                return interaction.editReply({ content: 'Suggestion channel not found.' });
            }
            if (interaction.channelId !== idclass.ChannelMR) {
                return interaction.editReply({ content: `This command can only be used in <#${idclass.ChannelMR}>.` });
            }

            // Prepare a favicon URL for the thumbnail.
            const faviconUrl = `https://www.google.com/s2/favicons?sz=64&domain_url=${encodeURIComponent(link)}`;

            // Optionally try to fetch a preview image by sending the link (best effort).
            let previewImage = null;
            try {
                const messageWithLink = await suggestionChannel.send({ content: link });
                if (messageWithLink.embeds.length > 0) {
                    const previewEmbed = messageWithLink.embeds[0];
                    if (previewEmbed.image && previewEmbed.image.url) {
                        previewImage = previewEmbed.image.url;
                    }
                }
            } catch (error) {
                console.error("Failed to fetch preview image:", error);
            }

            // Define pending color (orange).
            const pendingColor = "#ff9500";

            // Create the suggestion embed for the suggestion channel.
            const suggestionEmbed = new EmbedBuilder()
                .setTitle(name)
                .setURL(link)
                .setDescription(`**Type:** ${type}\n**Language:** ${language}\n${link}`)
                .setColor(pendingColor)
                .setThumbnail(faviconUrl)
                .addFields({ name: 'Status', value: 'Pending' });
            if (previewImage) suggestionEmbed.setImage(previewImage);

            // Create an action row with Accept and Decline buttons.
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

            // Send the suggestion embed (with buttons) to the suggestion channel.
            const suggestionMessage = await suggestionChannel.send({ embeds: [suggestionEmbed], components: [buttonsRow] });

            // Create the public embed for the channel where the command was used.
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

            // Update the in-memory cache using the suggestion message ID as the key.
            suggestionsCache[suggestionMessage.id] = {
                suggestionMessageId: suggestionMessage.id,
                publicMessageId: publicMessage.id,
                guildId: interaction.guild.id,
                suggestionChannelId: suggestionChannel.id,
                publicChannelId: interaction.channel.id,
                name,
                link,
                language,
                type,
                status: 'Pending',
                createdAt: Date.now()
            };
            saveSuggestions(suggestionsCache);

            // Edit the deferred reply to confirm submission.
            await interaction.editReply({ content: 'Suggestion submitted!' });
        } catch (err) {
            console.error("Error executing /suggest command:", err);
            if (!interaction.deferred && !interaction.replied) {
                await interaction.reply({ content: 'There was an error processing your suggestion.', flags: 64 });
            } else {
                await interaction.editReply({ content: 'There was an error processing your suggestion.' });
            }
        }
    },
    // Button handler for the suggestion command.
    async buttonHandler(interaction) {
        if (!interaction.isButton()) return;
        if (!['suggestionAccept', 'suggestionDecline'].includes(interaction.customId)) return;

        const suggestionMessageId = interaction.message.id;
        if (!suggestionsCache[suggestionMessageId]) {
            console.error("Suggestion not found in storage. Current cache:", suggestionsCache, "Requested ID:", suggestionMessageId);
            return;
        }
        const suggestionData = suggestionsCache[suggestionMessageId];

        let newStatus, newColor;
        let reason = null; // Initialize reason as null

        // Handle Accept button
        if (interaction.customId === 'suggestionAccept') {
            try {
                // Defer update for accept interactions.
                await interaction.deferUpdate();
            } catch (error) {
                console.error("Error deferring accept interaction:", error);
                return;
            }
            newStatus = 'Approved';
            newColor = Colors.Green;
        }
        // Handle Decline button (do not defer to allow modal to be shown)
        else if (interaction.customId === 'suggestionDecline') {
            // Create a modal to ask for a reason for decline.
            const modal = new ModalBuilder()
                .setCustomId(`declineModal_${suggestionMessageId}`)
                .setTitle('Decline Reason');
            const reasonInput = new TextInputBuilder()
                .setCustomId('declineReason')
                // Updated label to be under 45 characters.
                .setLabel('Reason for decline (optional)')
                .setStyle(TextInputStyle.Paragraph)
                .setRequired(false);
            const modalRow = new ActionRowBuilder().addComponents(reasonInput);
            modal.addComponents(modalRow);
            try {
                await interaction.showModal(modal);
            } catch (error) {
                console.error("Error showing modal:", error);
                return;
            }
            try {
                // Wait for the modal submission.
                const submitted = await interaction.awaitModalSubmit({
                    filter: i => i.customId === `declineModal_${suggestionMessageId}` && i.user.id === interaction.user.id,
                    time: 30000
                });
                reason = submitted.fields.getTextInputValue('declineReason').trim();
                if (reason === "") {
                    reason = null;
                }
                await submitted.reply({ content: 'Suggestion declined.', ephemeral: true});
            } catch (err) {
                console.error("Modal submission timed out or error:", err);
                // If timeout/error, proceed without a reason.
            }
            newStatus = 'Declined';
            newColor = Colors.Red;
        }

        // Update the suggestion embed in the suggestion channel.
        try {
            const suggestionChannel = interaction.guild.channels.cache.get(suggestionData.suggestionChannelId);
            if (!suggestionChannel) throw new Error("Suggestion channel not found.");
            const suggestionMessage = await suggestionChannel.messages.fetch(suggestionMessageId);
            if (!suggestionMessage) throw new Error("Suggestion message not found.");
            const oldEmbed = suggestionMessage.embeds[0];
            const updatedEmbed = EmbedBuilder.from(oldEmbed)
                .setColor(newColor)
                .spliceFields(0, 1, { name: 'Status', value: newStatus });
            // If a reason was provided, add a bolded field called "Reason".
            if (reason) {
                updatedEmbed.addFields({ name: '**Reason**', value: reason });
            }
            // Disable the buttons so they cannot be clicked again.
            const oldRow = suggestionMessage.components[0];
            const disabledRow = ActionRowBuilder.from(oldRow);
            disabledRow.components = disabledRow.components.map(button => ButtonBuilder.from(button).setDisabled(true));
            await suggestionMessage.edit({ embeds: [updatedEmbed], components: [disabledRow] });
        } catch (error) {
            console.error("Error updating suggestion message:", error);
        }

        // Update the public embed in the public channel.
        try {
            const publicChannel = interaction.guild.channels.cache.get(idclass.ChannelMRC2);
            if (publicChannel) {
                const publicMessage = await publicChannel.messages.fetch(suggestionData.publicMessageId);
                if (publicMessage) {
                    const oldPublicEmbed = publicMessage.embeds[0];
                    const updatedPublicEmbed = EmbedBuilder.from(oldPublicEmbed)
                        .setColor(newColor)
                        .spliceFields(4, 1, { name: 'Status', value: newStatus });
                    if (reason) {
                        updatedPublicEmbed.addFields({ name: '**Reason**', value: reason });
                    }
                    await publicMessage.edit({ embeds: [updatedPublicEmbed] });
                } else {
                    console.error("Public message not found.");
                }
            } else {
                console.error("Public channel not found.");
            }
        } catch (error) {
            console.error("Error updating public embed:", error);
        }

        // Update the in-memory cache and save to file.
        suggestionsCache[suggestionMessageId].status = newStatus;
        if (reason) suggestionsCache[suggestionMessageId].reason = reason;
        saveSuggestions(suggestionsCache);
    }
};

module.exports = command;
