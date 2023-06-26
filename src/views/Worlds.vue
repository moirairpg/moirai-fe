<script setup lang="ts">
import { FilterMatchMode } from 'primevue/api';
import { ref, onMounted, onBeforeMount, Ref } from 'vue';
import { useToast } from 'primevue/usetoast';
import { LocalDateTime, DateTimeFormatter } from '@js-joda/core';
import { ToastServiceMethods } from 'primevue/toastservice';

import WorldDialog from '@/components/world/WorldDialog.vue';
import WorldImportDialog from '@/components/world/WorldImportDialog.vue';
import WorldDeleteDialog from '@/components/world/WorldDeleteDialog.vue';
import WorldDeleteBulkDialog from '@/components/world/WorldDeleteBulkDialog.vue';
import WorldDataTable from '@/components/world/WorldDataTable.vue';
import WorldDataView from '@/components/world/WorldDataView.vue';

import lorebookService from '@/service/LorebookService';
import worldService from '@/service/WorldService';
import discordService from '@/service/DiscordService';
import store from '@/resources/store';
import World from '@/types/world/World';
import LorebookEntry from '@/types/world/LorebookEntry';

const loggedUser = store.getters.loggedUser;

const toast: ToastServiceMethods = useToast();

const isDeleteDialogVisible = ref(false);
const isDeleteBulkDialogVisible = ref(false);
const worldSearchFilters: Ref<any> = ref({});
const isWorldSubmitted: Ref<boolean> = ref(false);
const isImportDialogVisible: Ref<boolean> = ref(false);

const world: Ref<World> = ref({});
const worlds: Ref<World[]> = ref([]);
const selectedWorlds: Ref<World[]> = ref([]);
const isWorldDialogVisible: Ref<boolean> = ref(false);

onBeforeMount(async () => {
    initWorldSearchFilters();
    await worldService.getAllWorlds(loggedUser.id).then(async (data) => {
        const ws = [];
        if (data?.[0] !== undefined) {
            for (let w of data) {
                let canEdit = false;
                if (w.owner === loggedUser.id || w.writePermissions?.includes(loggedUser.id)) {
                    canEdit = true;
                }

                if (w.lorebook === undefined || w.lorebook.length == 0) {
                    w.lorebook = [];
                }

                const ownerData = await discordService.retrieveUserData(w.owner as string);
                w.ownerData = ownerData;
                w.canEdit = canEdit;
                ws.push(w);
            }
        }

        worlds.value = ws;
    });
});

const importWorld = () => {
    isWorldSubmitted.value = false;
    isImportDialogVisible.value = true;
};

const createNewWorld = () => {
    world.value = { owner: loggedUser.id, ownerData: loggedUser, lorebook: [] };
    isWorldSubmitted.value = false;
    isWorldDialogVisible.value = true;
};

const hideWorldDialog = () => {
    isWorldSubmitted.value = false;
    isWorldDialogVisible.value = false;
};

const saveWorld = async (savedWorld: World) => {
    isWorldSubmitted.value = true;
    if (savedWorld.name?.trim() && savedWorld.description?.trim() && savedWorld.visibility) {
        if (savedWorld.id) {
            try {
                world.value.lorebook
                    ?.filter((o1: LorebookEntry) => {
                        return !savedWorld.lorebook?.some((o2: LorebookEntry) => o1.id === o2.id);
                    })
                    ?.forEach(async (entryToDelete) => {
                        await lorebookService.deleteLorebookEntry(entryToDelete, loggedUser.id);
                    });

                await worldService.updateWorld(savedWorld, loggedUser.id);
                worlds.value[findWorldIndexById(savedWorld.id)] = savedWorld;
                toast.add({ severity: 'success', summary: 'Success!', detail: 'World updated', life: 3000 });
            } catch (error) {
                console.error(`An error ocurred while updating the world -> ${error}`);
                toast.add({ severity: 'error', summary: 'Error', detail: 'Error updating world', life: 3000 });
            }
        } else {
            try {
                const createdWorld = await worldService.createWorld(savedWorld, loggedUser.id);
                createdWorld.canEdit = true;
                createdWorld.ownerData = loggedUser;
                worlds.value.push(createdWorld);
                toast.add({ severity: 'success', summary: 'Success!', detail: 'World created', life: 3000 });
            } catch (error) {
                console.error(`An error ocurred while saving the world -> ${error}`);
                toast.add({ severity: 'error', summary: 'Error', detail: 'Error saving world', life: 3000 });
            }
        }
        isWorldDialogVisible.value = false;
        world.value = { owner: loggedUser.id, ownerData: loggedUser, lorebook: [] };
    }
};

const viewWorld = (editWorld: World) => {
    world.value = { ...editWorld };
    isWorldDialogVisible.value = true;
};

const confirmDeleteWorld = (editWorld: World) => {
    world.value = editWorld;
    isDeleteDialogVisible.value = true;
};

const deleteWorld = async () => {
    try {
        await worldService.deleteWorld(world.value, loggedUser.id);
        worlds.value = worlds.value.filter((val) => val.id !== world.value.id);
        isDeleteDialogVisible.value = false;
        world.value = { owner: loggedUser.id, ownerData: loggedUser, lorebook: [] };
        toast.add({ severity: 'success', summary: 'Success!', detail: 'World deleted', life: 3000 });
    } catch (error) {
        console.error(`An error ocurred while deleting the world -> ${error}`);
        toast.add({ severity: 'error', summary: 'Error', detail: 'Error deleting world', life: 3000 });
    }
};

const findWorldIndexById = (id: string) => {
    let index = -1;
    for (let i = 0; i < worlds.value.length; i++) {
        if (worlds.value[i].id === id) {
            index = i;
            break;
        }
    }
    return index;
};

const confirmDeleteSelectedWorlds = (deletedWorlds: World[]) => {
    selectedWorlds.value = deletedWorlds;
    isDeleteBulkDialogVisible.value = true;
};

const deleteSelectedWorlds = () => {
    worlds.value = worlds.value
        .map((val): any => {
            if (!selectedWorlds.value.includes(val)) {
                return val;
            }

            return worldService.deleteWorld(val, loggedUser.id);
        })
        .filter((val) => Object.keys(val).length !== 0);

    isDeleteBulkDialogVisible.value = false;
    selectedWorlds.value = [];
    toast.add({ severity: 'success', summary: 'Success!', detail: 'Worlds selected deleted', life: 3000 });
};

const initWorldSearchFilters = () => {
    worldSearchFilters.value = {
        global: { value: null, matchMode: FilterMatchMode.CONTAINS }
    };
};

const downloadWorld = () => {
    const worldToDownload = Object.assign({}, world.value);
    delete worldToDownload.ownerData;
    delete worldToDownload.canEdit;

    const fileName = `world-${worldToDownload.id}-${LocalDateTime.now().format(DateTimeFormatter.ofPattern('yyyMMddHHmmss'))}-${worldToDownload.name}`;
    const url = window.URL.createObjectURL(new Blob([JSON.stringify(worldToDownload, null, 2)]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${fileName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`);
    document.body.appendChild(link);
    link.click();

    toast.add({ severity: 'success', summary: 'Success!', detail: 'World downloaded', life: 3000 });
};

const cloneWorld = async () => {
    try {
        const worldToClone = JSON.parse(JSON.stringify(world.value));
        delete worldToClone.id;
        delete worldToClone.owner;
        delete worldToClone.ownerData;
        delete worldToClone.canEdit;

        if (worldToClone.lorebook === undefined) {
            worldToClone.lorebook = [];
        }

        worldToClone.owner = loggedUser.id;
        worldToClone.name = `${worldToClone.name} - Copy`;
        worldToClone.lorebook.forEach((entry: LorebookEntry) => delete entry.id);
        const createdWorld = await worldService.createWorld(worldToClone, loggedUser.id);

        createdWorld.canEdit = true;
        createdWorld.ownerData = loggedUser;

        isWorldDialogVisible.value = true;

        world.value = createdWorld;
        worlds.value.push(createdWorld);
        toast.add({ severity: 'success', summary: 'Success!', detail: 'World cloned', life: 3000 });
    } catch (error) {
        console.error(`An error ocurred while cloning the world -> ${error}`);
        toast.add({ severity: 'error', summary: 'Error', detail: 'Error cloning world', life: 3000 });
    }
};

const uploadWorld = async (event: any) => {
    const worldToImport: World = event.world;
    worldToImport.owner = loggedUser.id;

    const createdWorld: World = await worldService.createWorld(worldToImport, loggedUser.id);
    createdWorld.canEdit = true;
    createdWorld.ownerData = loggedUser;
    worlds.value.push(createdWorld);
    toast.add({ severity: 'success', summary: 'Success!', detail: `World imported (${event.file.name})`, life: 3000 });

    isImportDialogVisible.value = false;
};
</script>

<template>
    <div class="grid">
        <div class="col-12">
            <div class="card">
                <Toast />
                <TabView>
                    <TabPanel header="Card view">
                        <WorldDataView :worlds="worlds" @onOpen="viewWorld" @onDelete="confirmDeleteWorld" @onCreate="createNewWorld" @onImport="importWorld" />
                    </TabPanel>
                    <TabPanel header="Table view">
                        <WorldDataTable :worlds="worlds" @onOpen="viewWorld" @onDelete="confirmDeleteWorld" @onCreate="createNewWorld" @onImport="importWorld" @onDeleteBulk="confirmDeleteSelectedWorlds" />
                    </TabPanel>
                </TabView>

                <WorldDialog v-model:visible="isWorldDialogVisible" :world="world" :canEdit="world.owner === loggedUser.id" @onClose="hideWorldDialog" @onSave="saveWorld" @onDownload="downloadWorld" @onClone="cloneWorld" />
                <WorldImportDialog v-model:visible="isImportDialogVisible" @onImport="uploadWorld" />
                <WorldDeleteDialog v-model:visible="isDeleteDialogVisible" :world="world" @onConfirm="deleteWorld" @onCancel="isDeleteDialogVisible = false" />
                <WorldDeleteBulkDialog v-model:visible="isDeleteBulkDialogVisible" @onConfirm="deleteSelectedWorlds" @onCancel="isDeleteBulkDialogVisible = false" />
            </div>
        </div>
    </div>
</template>

<style scoped lang="scss">
@import '@/assets/demo/styles/badges.scss';
</style>
