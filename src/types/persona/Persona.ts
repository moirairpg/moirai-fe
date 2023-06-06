import Nudge from '@/types/persona/Nudge';
import Bump from '@/types/persona/Bump';
import DiscordUser from '@/types/discord/DiscordUser';

export default interface Persona {
    id?: string;
    name?: string;
    intent?: string;
    personality?: string;
    owner?: string;
    visibility?: string;
    nudge?: Nudge;
    bump?: Bump;
    ownerData?: DiscordUser;
    canEdit?: boolean;
    writePermissions?: string[];
    readPermissions?: string[];
}
