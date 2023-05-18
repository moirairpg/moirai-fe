import { createStore } from 'vuex';
import SecureLS from "secure-ls";

const encryptionKey = import.meta.env.VITE_CHATRPG_COOKIE_ENCRYPTION_KEY;
const ls = new SecureLS({
    encodingType: "aes",
    isCompression: true,
    encryptionSecret: encryptionKey
})

const store = createStore({
    state: {
        loggedIn: false,
        authData: null,
        loggedUserData: null
    },
    mutations: {
        UPDATE_AUTH_DATA(state, payload) {
            ls.set('authData', payload)
            state.authData = payload;
        },
        UPDATE_LOGGED_IN(state, payload) {
            ls.set('loggedIn', payload)
            state.loggedIn = payload;
        },
        UPDATE_LOGGED_USER_DATA(state, payload) {
            ls.set('loggedUserData', payload)
            state.loggedUserData = payload;
        }
    },
    actions: {
        setAuthData(context, payload) {
            let authData = context.state.authData;
            authData = payload;
            context.commit('UPDATE_AUTH_DATA', authData);
        },
        setLoggedIn(context, payload) {
            let loggedIn = context.state.loggedIn;
            loggedIn = payload;
            context.commit('UPDATE_LOGGED_IN', loggedIn);
        },
        setLoggedUser(context, payload) {
            let loggedUserData = context.state.loggedUserData;
            loggedUserData = payload;
            context.commit('UPDATE_LOGGED_USER_DATA', loggedUserData);
        },
    },
    getters: {
        isLoggedIn: (state) => {
            const loggedIn = ls.get('loggedIn')
            return loggedIn !== undefined ? loggedIn : state.loggedIn;
        },
        loggedUser: (state) => {
            const loggedUserData = ls.get('loggedUserData')
            return loggedUserData !== undefined ? loggedUserData : state.loggedUserData;
        },
        authData: (state) => {
            const authData = ls.get('authData')
            return authData !== undefined ? authData : state.authData;
        }
    }
});

export default store;