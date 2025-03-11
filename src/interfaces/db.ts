export interface Puppet {
    id: number;
    user_id: string;
    name: string;
    suffix: string; // New suffix field
    avatar?: string;
    description?: string;
}

export interface DBUtils {
    getUserPuppets(userId: string): Promise<Puppet[]>;
    createPuppet(puppet: Omit<Puppet, 'id'>): Promise<Puppet>;
    getPuppetByName(userId: string, name: string): Promise<Puppet | null>;
    getPuppetBySuffix(userId: string, suffix: string): Promise<Puppet | null>}