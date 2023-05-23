<script setup>
import { ref } from 'vue';

import AppMenuItem from './AppMenuItem.vue';

const model = ref([
    {
        label: 'Home',
        items: [{ label: 'Dashboard', icon: 'pi pi-fw pi-home', to: '/' }]
    },
    {
        label: 'Navigation',
        items: [
            { label: 'Worlds', icon: 'pi pi-fw pi-globe', to: '/worlds' },
            { label: 'Persona', icon: 'pi pi-fw pi-user', to: '/personas' },
            { label: 'Channel configurations', icon: 'pi pi-fw pi-wrench', to: '/channel-configs' },
        ]
    },
    {
        label: 'Tools',
        items: [
            { label: 'Tokenizer', icon: 'pi pi-fw pi-mobile', to: '/tokenizer' },
        ]
    }
]);
</script>

<template>
    <ul class="layout-menu">
        <template v-for="(item, i) in model" :key="item">
            <app-menu-item v-if="!item.separator" :item="item" :index="i"></app-menu-item>
            <li v-if="item.separator" class="menu-separator"></li>
        </template>
    </ul>
</template>

<style lang="scss" scoped></style>
