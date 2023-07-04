import store from '@/resources/store';
import webclient from '@/resources/webclient';
import DiscordAuth from '@/types/discord/DiscordAuth';
import DiscordUser from '@/types/discord/DiscordUser';

const backendBaseUrl: string = import.meta.env.VITE_CHATRPG_API_BASEURL;

class DiscordService {
    async authenticate(authCode: string): Promise<DiscordAuth> {
        const response: any = await webclient(`${backendBaseUrl}/discord/auth/${authCode}`, {
            method: 'POST'
        }).catch((error) => {
            console.log(`Error authenticating user on Discord -> ${JSON.stringify(error.response, null, 2)}`);
        });

        store.dispatch('setLoggedUser', response);
        store.dispatch('setLoggedIn', true);
        return response;
    }

    async retrieveUserData(userId: string): Promise<DiscordUser> {
        try {
            const response: any = await webclient(`${backendBaseUrl}/discord/user/${userId}`, {
                method: 'GET'
            });

            return response;
        } catch (error) {
            console.error(`Error retrieving discord user data -> ${error}`);
            throw error;
        }
    }
}

export default new DiscordService();
