const idclass = require('../idclass');

module.exports = {
    name: 'error',
    async execute(error, client) {
        console.error(error); // Logs to console

        const ERROR_LOG_CHANNEL_ID = idclass.ChannelErrorLogs; // Replace with your error log channel ID
        const logChannel = await client.channels.fetch(ERROR_LOG_CHANNEL_ID).catch(() => null);

        if (logChannel) {
            logChannel.send({
                content: `⚠️ **Error Occurred:**\n\`\`\`${error.message || error}\`\`\``
            }).catch(console.error);
        }
    }
};
