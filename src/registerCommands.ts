import { REST, Routes } from 'discord.js';
import { commands } from './commands/routes';

dotenv.config();

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN!);

(async () => {
    try {
        console.log('Registering slash commands...');

        await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID!),
            { body: commands.map((cmd) => cmd.toJSON()) },
        );

        console.log('Slash commands registered!');
    } catch (error) {
        console.error('Error:', error);
    }
})();