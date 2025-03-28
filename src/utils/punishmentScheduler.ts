import { infractionService } from "@database/services/InfractionService";
import { Client, GuildMember } from "discord.js";
import logger from "./logger";

export class PunishmentManager {
    private client: Client;

    constructor(client: Client) {
        this.client = client;
    }

    async applyAutomaticPunishment(userId: string, guildId: string) {
        const guild = await this.client.guilds.fetch(guildId);
        const member = await guild.members.fetch(userId).catch(() => null);

        const [totalWarns, recentWarns, sanctions] = await Promise.all([
            infractionService.getInfractionCount(userId, 'WARN'),
            infractionService.getRecentWarnCount(userId, 24),
            infractionService.getUserSanctions(userId)
        ]);

        // Get last return time if available
        const lastReturn = sanctions.return_date ? new Date(sanctions.return_date) : null;
        const daysSinceReturn = lastReturn ?
            (Date.now() - lastReturn.getTime()) / (1000 * 60 * 60 * 24) : 0;

        // Progressive punishment logic
        if (totalWarns >= 11 && daysSinceReturn < 7) {
            await this.applyPermaBan(member, '11 warns after return');
        } else if (totalWarns >= 10) {
            await this.applyBan(member, '10 warns threshold reached');
        } else if (totalWarns >= 7) {
            await this.applyTimedKick(member, '7 days', '7 warns accumulated');
        } else if (recentWarns >= 3) {
            if (sanctions.kick_count > 0 && daysSinceReturn < 7) {
                await this.applyBan(member, '4th warn after return');
            } else {
                await this.applyTimedKick(member, '7 days', '3 warns in 24 hours');
                if (member) {
                    await infractionService.incrementKickCount(member.id);
                    logger.debug('Incremented kick count for member', { "Member ID: ":member.id });
                } else {
                    // Member likely left the server
                    await infractionService.incrementKickCount(userId);
                    logger.debug('Incremented kick count for departed member', { userId });
                }          }
        } else if (totalWarns >= 5) {
            await this.applyMute(member, 1800, '5 warns threshold');
        } else if (totalWarns >= 3) {
            await this.applyMute(member, 600, '3 warns threshold');
        }

        // Update return date tracking if needed
        if (member && !lastReturn) {
            await infractionService.updateReturnDate(member.id);
        }
    }

    private async applyMute(member: GuildMember | null, seconds: number, reason: string) {
        if (!member) return;

        try {
            await member.timeout(seconds * 1000, reason);
            logger.info(`Muted ${member.user.tag} for ${seconds} seconds: ${reason}`);
        } catch (error) {
            logger.error('Failed to apply mute:', error);
        }
    }

    private async applyTimedKick(member: GuildMember | null, duration: string, reason: string) {
        if (!member) return;

        try {
            await member.kick(reason);
            logger.info(`Kicked ${member.user.tag} (${duration}): ${reason}`);

            // Store kick expiration
            await infractionService.recordKick(member.id, duration);
        } catch (error) {
            logger.error('Failed to kick user:', error);
        }
    }

    private async applyBan(member: GuildMember | null, reason: string) {
        if (!member) return;

        try {
            await member.ban({ reason });
            logger.info(`Banned ${member.user.tag}: ${reason}`);
            await infractionService.recordBan(member.id);
        } catch (error) {
            logger.error('Failed to ban user:', error);
        }
    }

    private async applyPermaBan(member: GuildMember | null, reason: string) {
        if (!member) return;

        try {
            await member.ban({ reason: `PERMA BAN - ${reason}` });
            logger.info(`Permanently banned ${member.user.tag}: ${reason}`);
            await infractionService.recordPermaBan(member.id);
        } catch (error) {
            logger.error('Failed to apply permanent ban:', error);
        }
    }
}