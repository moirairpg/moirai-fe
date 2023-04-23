import { createStore } from 'vuex';
import VuexPersist from 'vuex-persist';

const badMutations = [];

const vuexLocalStorage = new VuexPersist({
    key: 'vuex',
    storage: window.localStorage,
    filter: mutation => (badMutations.indexOf(mutation.type) === -1)
});

const store = createStore({
    state: {
        loggedIn: false,
        authData: null,
        loggedUserData: null
    },
    mutations: {
        UPDATE_AUTH_DATA(state, payload) {
            state.authData = payload;
        },
        UPDATE_LOGGED_IN(state, payload) {
            state.loggedIn = payload;
        },
        UPDATE_LOGGED_USER_DATA(state, payload) {
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
            return state => state.loggedIn;
        },
        loggedUser: (state) => {
            return state.loggedUserData;
        },
        authData: (state) => {
            return state.authData;
        }
    },
    plugins: [vuexLocalStorage.plugin]
})

export default store;