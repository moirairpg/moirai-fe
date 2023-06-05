import Nudge from './Nudge';
import Bump from './Bump';
import DiscordUser from '../DiscordUser';

export default interface Persona {
    id?: string;
    name: string;
    intent: string;
    personality: string;
    owner?: string;
    visibility: string;
    nudge?: Nudge;
    bump?: Bump;
    ownerData?: DiscordUser;
    canEdit?: boolean;
}
