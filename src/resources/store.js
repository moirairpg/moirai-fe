import SecureLS from 'secure-ls';
import { createStore } from 'vuex';

const encryptionKey = import.meta.env.VITE_CHATRPG_COOKIE_ENCRYPTION_KEY;
const ls = new SecureLS({
    encodingType: 'aes',
    isCompression: true,
    encryptionSecret: encryptionKey
});

const store = createStore({
    state: {
        loggedIn: false,
        loggedUserData: null
    },
    mutations: {
        UPDATE_LOGGED_IN(state, payload) {
            ls.set('loggedIn', payload);
            state.loggedIn = payload;
        },
        UPDATE_LOGGED_USER_DATA(state, payload) {
            ls.set('loggedUserData', payload);
            state.loggedUserData = payload;
        }
    },
    actions: {
        setLoggedIn(context, payload) {
            let { loggedIn } = context.state;
            loggedIn = payload;
            context.commit('UPDATE_LOGGED_IN', loggedIn);
        },
        setLoggedUser(context, payload) {
            let { loggedUserData } = context.state;
            loggedUserData = payload;
            context.commit('UPDATE_LOGGED_USER_DATA', loggedUserData);
        }
    },
    getters: {
        isLoggedIn: (state) => {
            const loggedIn = ls.get('loggedIn');
            return loggedIn !== undefined ? loggedIn : state.loggedIn;
        },
        loggedUser: (state) => {
            const loggedUserData = ls.get('loggedUserData');
            return loggedUserData !== undefined ? loggedUserData : state.loggedUserData;
        }
    }
});

export default store;
