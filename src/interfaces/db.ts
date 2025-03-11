export interface Puppet {
    id: number;
    user_id: string;
    name: string;
    avatar?: string;  // Make it explicitly optional
    description?: string;
}

export interface DBUtils {
    getUserPuppets(userId: string): Promise<Puppet[]>;
    createPuppet(puppet: Omit<Puppet, 'id'>): Promise<Puppet>;
    getPuppetByName(userId: string, name: string): Promise<Puppet | null>;
}