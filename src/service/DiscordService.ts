import store from '@/resources/store';
import webclient from '@/resources/webclient';
import DiscordAuth from '@/types/discord/DiscordAuth';
import DiscordUser from '@/types/discord/DiscordUser';
import queryString from 'query-string';

const clientId: string = import.meta.env.VITE_CHATRPG_DISCORD_CLIENT_ID;
const clientSecret: string = import.meta.env.VITE_CHATRPG_DISCORD_CLIENT_SECRET;
const redirectUrl: string = import.meta.env.VITE_CHATRPG_DISCORD_REDIRECT_URL;
const baseUrl: string = import.meta.env.VITE_CHATRPG_DISCORD_API_BASE_URL;
const backendBaseUrl: string = import.meta.env.VITE_CHATRPG_API_BASEURL;

class DiscordService {
    async retrieveToken(authCode: string): Promise<DiscordAuth> {
        const response: any = await webclient({
            method: 'POST',
            data: queryString.stringify({
                client_id: clientId,
                client_secret: clientSecret,
                grant_type: 'authorization_code',
                redirect_uri: redirectUrl,
                scope: 'identify',
                code: authCode
            }),
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
            },
            url: `${baseUrl}/oauth2/token`
        }).catch((error) => {
            console.log(`Error calling Discord API -> ${JSON.stringify(error.response, null, 2)}`);
        });

        store.dispatch('setAuthData', response);
        store.dispatch('setLoggedIn', true);
        return response;
    }

    async retrieveSelfUserData(): Promise<DiscordUser> {
        try {
            const { authData } = store.getters;
            const response: any = await webclient({
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${authData.access_token}`
                },
                url: `${baseUrl}/users/@me`
            });

            store.dispatch('setLoggedUser', response);
            return response;
        } catch (error) {
            console.error(`Error retrieving discord self user data -> ${error}`);
            throw error;
        }
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
