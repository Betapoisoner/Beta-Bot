# BetaPoisoner Discord Bot 🤖

A feature-rich Discord bot with puppet system integration, allowing users to create and manage alternate personas through chat commands. Built with TypeScript, Discord.js, and PostgreSQL.

![Node.js](https://img.shields.io/badge/Node.js-18.x-green)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15.x-blue)

## Key Features ✨

- 🧙 **Puppet System**: Create/manage alternate personas with custom suffixes
- 💬 **Suffix-based Messaging**: `puppet: Hello!` or `puppet:: waves`
- 📊 **Database Integration**: PostgreSQL storage for persistent data
- 📜 **Command System**: Modular command architecture
- 📈 **Advanced Logging**: Rotating file logs + console output
- 🔒 **Environment Validation**: Strict env variable checking
- 🛡️ **Error Handling**: Comprehensive error tracking and recovery

## Installation 🚀

### Prerequisites

- Node.js 18.x+
- PostgreSQL 15+
- PNPM 8.x+
- Discord Developer Application

```bash
# Clone repository
git clone https://github.com/yourusername/betapoisoner-beta-bot.git
cd betapoisoner-beta-bot

# Install dependencies
pnpm install

# Setup environment
cp .env.example .env
# Edit .env with your credentials
```

## Configuration ⚙️

### Create .env file:

```bash
#DISCORD INFO
DISCORD_TOKEN=your_bot_token
APPLICATION_ID=your_app_id

#DATABASE INFO
DB_USER=postgres
DB_HOST=localhost
DB_NAME=puppetdb
DB_PASSWORD=postgres
DB_PORT=5432

#LOG LEVEL FOR WINSTON
LOG_LEVEL=debug
```

## Database Setup 🗄️

### Create PostgreSQL database:

```sql
CREATE TABLE puppets (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    name VARCHAR(50) NOT NULL,
    suffix VARCHAR(20) UNIQUE NOT NULL,
    avatar TEXT,
    description TEXT
);
```

## Usage 📖

```bash
# Development mode (watch + reload)
pnpm dev

# Production build
pnpm build
pnpm start

# Register commands (if needed)
pnpm register
```

### Key Commands 🔑

| Command                             | Description       | Example                                |
| ----------------------------------- | ----------------- | -------------------------------------- |
| `!addpuppet <name> <suffix> [desc]` | Create new puppet | `!addpuppet Merlin mrln A wise wizard` |
| `!mypuppets`                        | List your puppets | `!mypuppets`                           |
| `[suffix]: Message`                 | Speak as puppet   | `mrln: Greetings travelers!`           |
| `[suffix]:: Action`                 | Emote as puppet   | `mrln:: waves his staff`               |
| `!help`                             | Show help menu    | `!help`                                |
| `!roll [max]`                       | Random number     | `!roll 20`                             |

## Logging 📝

### Configured with Winston:

- Console output with colors and metadata
- Daily rotating files (30 day retention)
- JSON format for log analysis

```file
logs/
├── bot-01-05-2024.log
├── bot-02-05-2024.log
└── bot-03-05-2024.log.gz
```

## Contributing 🤝

1. Fork repository

2. Create feature branch: feat/amazing-feature

3. Commit changes: pnpm commit

4. Push to branch

5. Open Pull Request

**Please follow existing code style and add tests for new features.**

### Made with ❤️ by 𝕭𝖊𝖙𝖆 | [Report Issue](https://github.com/betapoisoner/beta-bot/issues)