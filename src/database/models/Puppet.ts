/**
 * Type definitions for Puppet system and database interactions
 */

/**
 * Puppet entity representing a user's alternate persona
 * @interface Puppet
 */
export interface Puppet {
    /** Auto-generated unique ID */
    id: number;
    /** Discord user ID of puppet owner */
    user_id: string;
    /** Display name for the puppet */
    name: string;
    /** Unique command suffix (e.g., "pup" in "pup: message") */
    suffix: string;
    /** Optional avatar URL */
    avatar?: string;
    /** Optional description shown in listings */
    description?: string;
}

/**
 * Database operations contract for Puppet management
 * @interface DBUtils
 */
export interface DBUtils {
    getUserPuppets(userId: string): Promise<Puppet[]>;
    createPuppet(puppet: Omit<Puppet, 'id'>): Promise<Puppet>;
    getPuppetByName(userId: string, name: string): Promise<Puppet | null>;
    getPuppetBySuffix(userId: string, suffix: string): Promise<Puppet | null>;
}
