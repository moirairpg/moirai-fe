<script setup>
import { useLayout } from '@/layout/composables/layout';
import { computed } from 'vue';

const { layoutConfig } = useLayout();
const discordApiBaseUrl = import.meta.env.VITE_CHATRPG_DISCORD_API_BASE_URL;
const discordLoginUrl = import.meta.env.VITE_CHATRPG_DISCORD_LOGIN_URL;

const logoUrl = computed(() => {
    return `layout/images/${layoutConfig.darkTheme.value ? 'logo-white' : 'logo-dark'}.svg`;
});
</script>

<template>
    <div class="surface-ground flex align-items-center justify-content-center min-h-screen min-w-screen overflow-hidden">
        <div class="flex flex-column align-items-center justify-content-center">
            <img :src="logoUrl" alt="Sakai logo" class="mb-5 w-6rem flex-shrink-0" />
            <div style="border-radius: 56px; padding: 0.3rem; background: linear-gradient(180deg, var(--primary-color) 10%, rgba(33, 150, 243, 0) 30%)">
                <div class="w-full surface-card py-8 px-5 sm:px-8" style="border-radius: 53px">
                    <div class="text-center mb-5">
                        <i class="pi pi-discord" height="50" style="font-size: 4rem; padding-bottom: 1rem;"></i>
                        <div class="text-900 text-3xl font-medium mb-3">
                            <a :href="`${discordApiBaseUrl}${discordLoginUrl}`" class="w-full p-3 text-xl">Login with Discord</a>
                        </div>
                        <span class="text-600 font-medium">Sign in to continue</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.pi-eye {
    transform: scale(1.6);
    margin-right: 1rem;
}

.pi-eye-slash {
    transform: scale(1.6);
    margin-right: 1rem;
}
</style>
