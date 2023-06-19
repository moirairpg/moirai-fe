import DiscordUser from '@/types/discord/DiscordUser';
import LorebookEntry from '@/types/world/LorebookEntry';

export default interface World {
    id?: string;
    name?: string;
    description?: string;
    owner?: string;
    visibility?: string;
    initialPrompt?: string;
    lorebook?: LorebookEntry[];
    ownerData?: DiscordUser;
    canEdit?: boolean;
    writePermissions?: string[];
    readPermissions?: string[];
}
