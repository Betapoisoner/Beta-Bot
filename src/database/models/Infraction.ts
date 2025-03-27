export interface Infraction {
    id: number;
    user_id: string;
    moderator_id: string;
    type: 'WARN' | 'KICK' | 'BAN';
    reason?: string;
    created_at: Date;
}

export interface SanctionSummary {
    total_warns: number;
    recent_warns_24h: number;
    active_mutes: number;
    total_kicks: number;
    total_bans: number;
}

export interface AutomaticPunishment {
    type: 'MUTE' | 'KICK' | 'BAN';
    duration?: string;
    reason: string;
    applied_at: Date;
}