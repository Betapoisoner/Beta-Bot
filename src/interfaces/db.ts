export interface Puppet {
    id: number;
    user_id: string;
    name: string;
    avatar?: string;
    description?: string;
}

export interface DBUtils {
    createPuppet: (userId: string, name: string, avatar?: string, description?: string) => Promise<Puppet>;
    getPuppets: (userId: string) => Promise<Puppet[]>;
    getPuppet: (userId: string, name: string) => Promise<Puppet | undefined>;
    deletePuppet: (userId: string, name: string) => Promise<Puppet | undefined>;
}