import { data as hello } from './hello'; // Use .js even if the file is .ts
import { data as roll } from './roll';
import { data as createPuppet } from './createPuppet';
import { data as listPuppets } from './listPuppets';
import { data as usePuppet } from './usePuppet';
import { data as deletePuppet } from './deletePuppet';

export const commands = [
    { name: 'hello', data: hello, cooldown: 5, permissions: ['ADMINISTRATOR'] },
    { name: 'roll', data: roll, cooldown: 3 },
    { name: 'create', data: createPuppet, cooldown: 3 },
    { name: 'delete', data: deletePuppet, cooldown: 3 },
    { name: 'use', data: usePuppet, cooldown: 3 },
    { name: 'list', data: listPuppets, cooldown: 3 },

];