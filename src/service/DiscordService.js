import queryString from 'query-string';
import webclient from '../resources/webclient';
import store from '../resources/store';

const clientId = import.meta.env.VITE_CHATRPG_DISCORD_CLIENT_ID;
const clientSecret = import.meta.env.VITE_CHATRPG_DISCORD_CLIENT_SECRET;
const redirectUrl = import.meta.env.VITE_CHATRPG_DISCORD_REDIRECT_URL;
const baseUrl = import.meta.env.VITE_CHATRPG_DISCORD_API_BASE_URL;
const backendBaseUrl = import.meta.env.VITE_CHATRPG_API_BASEURL;

export default class DiscordService {
    async retrieveToken(authCode) {
        const response = await webclient({
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

    async retrieveSelfUserData() {
        try {
            const { authData } = store.getters;
            const response = await webclient({
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

    async retrieveUserData(userId) {
        try {
            const response = await webclient(`${backendBaseUrl}/discord/user/${userId}`, {
                method: 'GET'
            });

            return response;
        } catch (error) {
            console.error(`Error retrieving discord user data -> ${error}`);
            throw error;
        }
    }
}
