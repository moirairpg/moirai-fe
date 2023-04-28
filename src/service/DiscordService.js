import webclient from '../resources/webclient';
import store from '../resources/store';

const clientId = import.meta.env.VITE_CHATRPG_DISCORD_CLIENT_ID;
const clientSecret = import.meta.env.VITE_CHATRPG_DISCORD_CLIENT_SECRET;
const redirectUrl = import.meta.env.VITE_CHATRPG_DISCORD_REDIRECT_URL;
const baseUrl = import.meta.env.VITE_CHATRPG_DISCORD_API_BASE_URL;
const backendBaseUrl = import.meta.env.VITE_CHATRPG_API_BASEURL;

export default class DiscordService {
    async retrieveToken(authCode) {
        try {
            const myHeaders = new Headers();
            myHeaders.append('Content-Type', 'application/x-www-form-urlencoded');

            const urlencoded = new URLSearchParams();
            urlencoded.append('client_id', clientId);
            urlencoded.append('client_secret', clientSecret);
            urlencoded.append('grant_type', 'authorization_code');
            urlencoded.append('redirect_uri', redirectUrl);
            urlencoded.append('scope', 'identify');
            urlencoded.append('code', authCode);

            const requestOptions = {
                method: 'POST',
                headers: myHeaders,
                body: urlencoded,
                redirect: 'follow'
            };

            const authData = await fetch(`${baseUrl}/oauth2/token`, requestOptions).then((response) => response.json());

            store.dispatch('setAuthData', authData);
            store.dispatch('setLoggedIn', true);
            return authData;
        } catch (error) {
            console.error(`Error logging in to Discord data -> ${error}`);
            throw error;
        }
    }

    async retrieveSelfUserData() {
        try {
            const authData = store.getters.authData;
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
