import { NavigationGuardNext, RouteLocationNormalized, createRouter, createWebHistory } from 'vue-router';
import AppLayout from '@/layout/AppLayout.vue';
import store from '@/resources/store';

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
                },
                {
                    path: '/channel-configs',
                    name: 'channel-configs',
                    component: () => import('@/views/ChannelConfigurations.vue'),
                    meta: {
                        title: 'ChatRPG | Channel Configuration',
                        requiresLogin: true
                    }
                },
                {
                    path: '/tokenizer',
                    name: 'tokenizer',
                    component: () => import('@/views/Tokenizer.vue'),
                    meta: {
                        title: 'ChatRPG | Tokenizer',
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
            component: () => import('@/views/auth/DiscordLogin.vue'),
            meta: {
                title: 'ChatRPG | Logging in...',
                requiresLogin: false
            }
        },
        {
            path: '/error',
            name: 'error',
            component: () => import('@/views/errors/AuthError.vue'),
            meta: {
                title: 'ChatRPG | Error',
                requiresLogin: false
            }
        },
        {
            path: '/error/not-found',
            name: 'notfound',
            component: () => import('@/views/errors/NotFound.vue'),
            meta: {
                title: 'ChatRPG | Not Found',
                requiresLogin: false
            }
        },
        {
            path: '/error/access-denied',
            name: 'accessDenied',
            component: () => import('@/views/auth/Access.vue'),
            meta: {
                title: 'ChatRPG | Access Denied',
                requiresLogin: false
            }
        }
    ]
});

router.beforeEach((toRoute: RouteLocationNormalized, fromRoute: RouteLocationNormalized, next: NavigationGuardNext) => {
    window.document.title = toRoute.meta && toRoute.meta.title ? (toRoute.meta.title as string) : 'Home';
    if (toRoute.matched.some((record) => record.meta.requiresLogin)) {
        if (!store.getters.isLoggedIn) {
            next({ name: 'login' });
        } else {
            next();
        }
    } else {
        next();
    }
});

export default router;
