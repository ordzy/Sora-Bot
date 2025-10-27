# Luna Bot

A powerful and modular Discord bot built with **TypeScript** for the Luna Modular App Server. Designed with scalability, performance, and user experience in mind.

## Features

- **Modern Architecture**
  - Built with TypeScript for enhanced type safety and developer experience
  - Clean and modular folder structure for easy maintenance
  - Efficient command handling system (both slash and prefix commands)

- **Command System**
  - Slash Commands: Modern Discord interaction support
  - Prefix Commands: Traditional text-based commands
  - Event System: Robust event handling architecture

- **Utility Features**
  - Voice Stats Tracking
  - Reminder System
  - Leaderboard System
  - Custom Embed Creator
  - Random Hex Color Generator
  - And more!

- **Management & Security**
  - Centralized role permission management via `idclass.ts`
  - Error logging and handling system
  - Database integration with better-sqlite3

## Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- npm (comes with Node.js)
- A Discord Bot Token ([Create a bot here](https://discord.com/developers/applications))

## Installation

1. Fork and clone the repository:
```bash
git clone https://github.com/your-username/Luna-Bot.git
cd Luna-Bot
```

2. Install dependencies:
```bash
npm install
```

3. Configure the bot:
   - Rename `example.env` to `.env`
   - Fill in your bot token and other required values

## Running the Bot

### For Windows Users:
- Double-click `run.bat`
OR
- Run in terminal: `npx ts-node luna.ts`

### For Linux/Mac Users:
```bash
npx ts-node luna.ts
```

## Contributing

Contributions are welcome! Feel free to:
1. Fork the repository
2. Create a feature branch
3. Submit a Pull Request

## License

This project is licensed under the MIT License.

## Support

If you like this project, please star us on GitHub
