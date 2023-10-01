import ModelSettings from '@/types/chconf/ModelSettings';
import ModerationSettings from '@/types/chconf/ModerationSettings';
import DiscordUser from '@/types/discord/DiscordUser';
import Persona from '@/types/persona/Persona';
import World from '@/types/world/World';

export default interface ChannelConfiguration {
    id?: string;
    name?: string;
    ownerDiscordId?: string;
    world?: World;
    persona?: Persona;
    modelSettings?: ModelSettings;
    moderationSettings?: ModerationSettings;
    ownerData?: DiscordUser;
    canEdit?: boolean;
    writePermissions?: string[];
    readPermissions?: string[];
}
