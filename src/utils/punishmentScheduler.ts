import { Client, GuildMember } from 'discord.js';
import { infractionService } from '@database/services/InfractionService';
import logger from '@utils/logger';

export class PunishmentManager {
    private client: Client;

    constructor(client: Client) {
        this.client = client;
    }

    async applyAutomaticPunishment(userId: string, guildId: string) {
        const guild = await this.client.guilds.fetch(guildId);
        const member = await guild.members.fetch(userId).catch(() => null);
        
        const [totalWarns, recentWarns] = await Promise.all([
            infractionService.getInfractionCount(userId, 'WARN'),
            infractionService.getRecentWarnCount(userId, 24)
        ]);

        const sanctions = await infractionService.getUserSanctions(userId);

        // Progressive punishment logic
        if (recentWarns >= 3) {
            await this.handle24HourViolation(member, sanctions);
        } else if (totalWarns >= 10 || sanctions.ban_count >= 1) {
            await this.applyBan(member, '10 warns threshold reached');
        } else if (totalWarns >= 7) {
            await this.applyTempBan(member, '7 days', '7 warns accumulated');
        } else if (totalWarns >= 5) {
            await this.applyMute(member, 1800, '5 warns threshold');
        } else if (totalWarns >= 3) {
            await this.applyMute(member, 600, '3 warns threshold');
        }
    }

    private async handle24HourViolation(member: GuildMember | null, sanctions: any) {
        if (!member) return;
        
        if (sanctions.kick_count > 0) {
            await this.applyBan(member, '4th warn after return from kick');
        } else {
            await this.applyTempBan(member, '7 days', '3 warns in 24 hours');
            await infractionService.incrementKickCount(member.id);
        }
    }

    private async applyMute(member: GuildMember, seconds: number, reason: string) {
        try {
            // Implement your mute logic (role or timeout)
            await member.timeout(seconds * 1000, reason);
            logger.info(`Muted ${member.user.tag} for ${seconds} seconds: ${reason}`);
        } catch (error) {
            logger.error('Failed to apply mute:', error);
        }
    }

    private async applyTempBan(member: GuildMember, duration: string, reason: string) {
        try {
            await member.ban({ reason });
            logger.info(`Banned ${member.user.tag} (${duration}): ${reason}`);
            
            // Schedule unban
            setTimeout(async () => {
                await member.guild.members.unban(member.id);
                logger.info(`Auto-unbanned ${member.user.tag}`);
            }, this.parseDuration(duration));
        } catch (error) {
            logger.error('Failed to apply temp ban:', error);
        }
    }

    private parseDuration(duration: string): number {
        const units = {
            'minutes': 60 * 1000,
            'hours': 60 * 60 * 1000,
            'days': 24 * 60 * 60 * 1000,
            'weeks': 7 * 24 * 60 * 60 * 1000
        };
        
        const [value, unit] = duration.split(' ');
        return parseInt(value) * units[unit as keyof typeof units];
    }
}