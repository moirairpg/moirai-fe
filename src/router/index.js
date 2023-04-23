import { createRouter, createWebHistory } from 'vue-router';
import AppLayout from '@/layout/AppLayout.vue';
import store from '../store';

const router = createRouter({
    history: createWebHistory(),
    routes: [
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
        },
        {
            path: '/auth',
            name: 'login',
            component: () => import('@/views/Login.vue'),
            meta: {
                title: 'ChatRPG | Authentication',
                requiresLogin: false
            }
        },
        {
            path: '/auth/discord',
            name: 'discord',
            component: () => import('@/views/DiscordLogin.vue'),
            meta: {
                title: 'ChatRPG | Logging in...',
                requiresLogin: false
            }
        },
        {
            path: '/error',
            name: 'error',
            component: () => import('@/views/template/pages/auth/Error.vue'),
            meta: {
                title: 'ChatRPG | Error',
                requiresLogin: false
            }
        },
        {
            path: '/error/not-found',
            name: 'notfound',
            component: () => import('@/views/template/pages/NotFound.vue'),
            meta: {
                title: 'ChatRPG | Not Found',
                requiresLogin: false
            }
        },
        {
            path: '/error/access-denied',
            name: 'accessDenied',
            component: () => import('@/views/template/pages/auth/Access.vue'),
            meta: {
                title: 'ChatRPG | Access Denied',
                requiresLogin: false
            }
        }
    ]
});

router.beforeEach((toRoute, fromRoute, next) => {

    window.document.title = toRoute.meta && toRoute.meta.title ? toRoute.meta.title : 'Home';
    if (toRoute.matched.some(record => record.meta.requiresLogin)) {
        if (!store.getters.isLoggedIn) {
            next({ name: 'login' })
        } else {
            next();
        }
    } else {
        next();
    }
})

export default router;
