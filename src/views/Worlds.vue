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

import lorebookService from '@/service/LorebookService';
import worldService from '@/service/WorldService';
import discordService from '@/service/DiscordService';
import store from '@/resources/store';
import World from '@/types/world/World';
import LorebookEntry from '@/types/world/LorebookEntry';

const loggedUser = store.getters.loggedUser;

const dataViewRef: Ref<any> = ref(null);
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

onBeforeMount(() => {
    initWorldSearchFilters();
});

onMounted(async () => {
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

const editWorld = (editWorld: World) => {
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

const confirmDeleteSelectedWorlds = () => {
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
                        <Toolbar class="mb-4">
                            <template v-slot:start>
                                <div class="my-2">
                                    <Button label="New" icon="pi pi-plus" class="p-button-success mr-2" @click="createNewWorld" />
                                    <Button label="Import" icon="pi pi-upload" class="p-button-help mr-2" @click="importWorld" />
                                </div>
                            </template>
                        </Toolbar>

                        <DataView
                            layout="grid"
                            ref="dataViewRef"
                            :value="worlds"
                            dataKey="id"
                            :paginator="true"
                            :rows="6"
                            :filters="worldSearchFilters"
                            paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                            :rowsPerPageOptions="[6, 12, 18]"
                            currentPageReportTemplate="Showing {first} to {last} of {totalRecords} worlds"
                            responsiveLayout="scroll"
                        >
                            <template #header>
                                <div class="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
                                    <h5 class="m-0">Worlds</h5>
                                </div>
                            </template>

                            <template #empty>No worlds found.</template>

                            <template #grid="slotProps">
                                <div class="col-12 sm:col-6 lg:col-12 xl:col-4 p-2">
                                    <div class="p-4 border-1 surface-border surface-card border-round">
                                        <div class="flex flex-wrap align-items-center justify-content-between gap-2">
                                            <div class="flex align-items-center gap-2">
                                                <i class="pi pi-user"></i>
                                                <span class="font-semibold">{{ slotProps.data.ownerData.username }}</span>
                                            </div>
                                            <Tag :value="slotProps.data.visibility" :class="'visibility-badge visibility-' + (slotProps.data.visibility ? slotProps.data.visibility.toLowerCase() : '')"></Tag>
                                        </div>
                                        <div class="flex flex-column align-items-center gap-3 py-5">
                                            <div class="text-2xl font-bold card-overflow-title">{{ slotProps.data.name }}</div>
                                        </div>
                                        <p align="center" class="card-overflow">
                                            {{ slotProps.data.description }}
                                        </p>
                                        <div class="flex align-items-center justify-content-between">
                                            <Button v-if="slotProps.data.canEdit" icon="pi pi-pencil" class="p-button-rounded p-button-success mr-2" @click="editWorld(slotProps.data)" />
                                            <Button v-if="slotProps.data.canEdit" icon="pi pi-trash" class="p-button-rounded p-button-danger mt-2" @click="confirmDeleteWorld(slotProps.data)" />
                                            <Button v-if="!slotProps.data.canEdit" icon="pi pi-eye" class="p-button-rounded p-button-success mt-2" @click="viewWorld(slotProps.data)" />
                                        </div>
                                    </div>
                                </div>
                            </template>
                        </DataView>
                    </TabPanel>
                    <TabPanel header="Table view">
                        <Toolbar class="mb-4">
                            <template v-slot:start>
                                <div class="my-2">
                                    <Button label="New" icon="pi pi-plus" class="p-button-success mr-2" @click="createNewWorld" />
                                    <Button label="Import" icon="pi pi-upload" class="p-button-help mr-2" @click="importWorld" />
                                    <Button label="Delete" icon="pi pi-trash" class="p-button-danger" @click="confirmDeleteSelectedWorlds" :disabled="!selectedWorlds || !selectedWorlds.length" />
                                </div>
                            </template>
                        </Toolbar>

                        <DataTable
                            ref="dataViewRef"
                            :value="worlds"
                            v-model:selection="selectedWorlds"
                            dataKey="id"
                            :paginator="true"
                            :rows="10"
                            :filters="worldSearchFilters"
                            paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                            :rowsPerPageOptions="[5, 10, 25]"
                            currentPageReportTemplate="Showing {first} to {last} of {totalRecords} worlds"
                            responsiveLayout="scroll"
                            maxLength
                        >
                            <template #header>
                                <div class="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
                                    <h5 class="m-0">Worlds</h5>
                                    <span class="block mt-2 md:mt-0 p-input-icon-left">
                                        <i class="pi pi-search" />
                                        <InputText v-model="worldSearchFilters['global'].value" placeholder="Search..." />
                                    </span>
                                </div>
                            </template>

                            <template #empty>No worlds found.</template>

                            <Column selectionMode="multiple" headerStyle="width: 3rem"></Column>
                            <Column field="name" header="Name" :sortable="true" headerStyle="width:14%; min-width:10rem;">
                                <template #body="slotProps">
                                    <span class="p-column-title">Name</span>
                                    <div class="table-column-overflow">{{ slotProps.data.name }}</div>
                                </template>
                            </Column>
                            <Column field="description" header="Description" :sortable="true" headerStyle="width:14%; min-width:8rem;">
                                <template #body="slotProps">
                                    <span class="p-column-title">Description</span>
                                    <div class="table-column-overflow">{{ slotProps.data.description }}</div>
                                </template>
                            </Column>
                            <Column field="owner" header="Owner" :sortable="true" headerStyle="width:14%; min-width:10rem;">
                                <template #body="slotProps">
                                    <span class="p-column-title">Owner</span>
                                    {{ slotProps.data.ownerData.username }}
                                </template>
                            </Column>
                            <Column headerStyle="min-width:10rem;">
                                <template #body="slotProps">
                                    <Button v-if="slotProps.data.canEdit" icon="pi pi-pencil" class="p-button-rounded p-button-success mr-2" @click="editWorld(slotProps.data)" />
                                    <Button v-if="slotProps.data.canEdit" icon="pi pi-trash" class="p-button-rounded p-button-danger mt-2" @click="confirmDeleteWorld(slotProps.data)" />
                                    <Button v-if="!slotProps.data.canEdit" icon="pi pi-eye" class="p-button-rounded p-button-success mt-2" @click="viewWorld(slotProps.data)" />
                                </template>
                            </Column>
                        </DataTable>
                    </TabPanel>
                </TabView>

                <WorldDialog v-model:visible="isWorldDialogVisible" :world="world" :isOwner="world.owner === loggedUser.id" @onClose="hideWorldDialog" @onSave="saveWorld" @onDownload="downloadWorld" @onClone="cloneWorld" />
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
