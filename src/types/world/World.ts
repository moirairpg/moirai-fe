import DiscordUser from '@/types/discord/DiscordUser';

export default interface World {
    id?: string;
    name?: string;
    description?: string;
    owner?: string;
    visibility?: string;
    initialPrompt?: string;
    ownerData?: DiscordUser;
    canEdit?: boolean;
    writePermissions?: string[];
    readPermissions?: string[];
}
