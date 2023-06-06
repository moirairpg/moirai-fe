import Persona from '@/types/persona/Persona';
import World from '@/types/world/World';
import ModerationSettings from '@/types/chconf/ModerationSettings';
import ModelSettings from '@/types/chconf/ModelSettings';

export default interface ChannelConfiguration {
    id?: string;
    name?: string;
    owner?: string;
    world?: World;
    persona?: Persona;
    modelSettings?: ModelSettings;
    moderationSettings?: ModerationSettings;
}
