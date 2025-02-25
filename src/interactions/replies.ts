import { Message } from 'discord.js';

// Define a type for the reply functions
type ReplyFunction = (message: Message, args: string[]) => void;

// Replies object containing all command logic
export const replies: Record<string, ReplyFunction> = {
    '!hello': (message, args) => {
        const user = args[0] ? `<@${args[0].replace(/[<@!>]/g, '')}>` : message.author.username;
        message.reply(`Hello, ${user}!`);
    },

    '!ping': (message) => {
        message.reply('Pong!');
    },

    '!roll': (message, args) => {
        const max = args[0] ? parseInt(args[0], 10) : 100; // Default to 100 if no argument is provided
        if (isNaN(max)) {
            message.reply('Please provide a valid number (e.g., `!roll 20`).');
            return;
        }
        const randomNumber = Math.floor(Math.random() * max) + 1;
        message.reply(`You rolled a ${randomNumber}!`);
    },

    '!greet': (message, args) => {
        const user = args[0] ? `<@${args[0].replace(/[<@!>]/g, '')}>` : 'everyone';
        message.reply(`Hello, ${user}! How are you today?`);
    },

    // New command with options
    '!add': (message, args) => {
        const num1 = parseFloat(args[0]);
        const num2 = parseFloat(args[1]);
        if (isNaN(num1) || isNaN(num2)) {
            message.reply('Please provide two valid numbers (e.g., `!add 5 10`).');
            return;
        }
        const sum = num1 + num2;
        message.reply(`The sum of ${num1} and ${num2} is ${sum}.`);
    },

    '!help': (message) => {
        message.reply(`
      Available commands:
      - \`!hello [user]\`: Say hello to a user.
      - \`!ping\`: Get a "Pong!" response.
      - \`!roll [max]\`: Roll a random number (default: 1-100).
      - \`!greet [user]\`: Greet a user or everyone.
      - \`!add [num1] [num2]\`: Add two numbers.
      - \`!help\`: Show this help message.

    `);
    },
};