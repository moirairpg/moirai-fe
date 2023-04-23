import { createRouter, createWebHistory } from 'vue-router';
import AppLayout from '@/layout/AppLayout.vue';
import store from '../store'

const router = createRouter({
    history: createWebHistory(),
    routes: [
        {
            path: '/login',
            name: 'login',
            component: () => import('@/views/Login.vue')
        },
        {
            path: '/discord',
            name: 'discord',
            component: () => import('@/views/DiscordLogin.vue'),
            meta: {
                title: 'ChatRPG | Logging in...'
            }
        },
        {
            path: '/error/not-found',
            name: 'notfound',
            component: () => import('@/views/template/pages/NotFound.vue')
        },
        {
            path: '/error/access-denied',
            name: 'accessDenied',
            component: () => import('@/views/template/pages/auth/Access.vue')
        },
        {
            path: '/error',
            name: 'error',
            component: () => import('@/views/template/pages/auth/Error.vue')
        },
        {
            path: '/',
            component: AppLayout,
            children: [
                {
                    path: '/',
                    name: 'dashboard',
                    component: () => import('@/views/Dashboard.vue'),
                    meta: {
                        title: 'ChatRPG | Dashboard',
                        requiresLogin: true
                    }
                },
                {
                    path: '/lorebooks',
                    name: 'lorebooks',
                    component: () => import('@/views/Lorebooks.vue'),
                    meta: {
                        title: 'ChatRPG | Lorebooks',
                        requiresLogin: true
                    }
                },
                {
                    path: '/personas',
                    name: 'personas',
                    component: () => import('@/views/Personas.vue'),
                    meta: {
                        title: 'ChatRPG | Personas',
                        requiresLogin: true
                    }
                },
                {
                    path: '/worlds',
                    name: 'worlds',
                    component: () => import('@/views/Worlds.vue'),
                    meta: {
                        title: 'ChatRPG | Worlds',
                        requiresLogin: true
                    }
                }
            ]
        }
    ]
});

router.beforeEach((toRoute, fromRoute, next) => {

    console.log(`Loggedin -> ${store.getters.isLoggedIn}`)
    if (toRoute.matched.some(record => record.meta.requiresLogin)) {
        if (!store.getters.isLoggedIn) {
            next({ name: 'login' })
        } else {
            window.document.title = toRoute.meta && toRoute.meta.title ? toRoute.meta.title : 'Home';
            next();
        }
    } else {
        window.document.title = toRoute.meta && toRoute.meta.title ? toRoute.meta.title : 'Home';
        next();
    }
})

export default router;
