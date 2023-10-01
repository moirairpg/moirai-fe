import DiscordUser from '@/types/discord/DiscordUser';
import Bump from '@/types/persona/Bump';
import Nudge from '@/types/persona/Nudge';

export default interface Persona {
    id?: string;
    name?: string;
    intent?: string;
    personality?: string;
    ownerDiscordId?: string;
    visibility?: string;
    nudge?: Nudge;
    bump?: Bump;
    ownerData?: DiscordUser;
    canEdit?: boolean;
    isMultiplayer?: boolean;
    writePermissions?: string[];
    readPermissions?: string[];
}
