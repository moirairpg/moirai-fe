<script setup>
import { FilterMatchMode } from 'primevue/api';
import { ref, onMounted, onBeforeMount } from 'vue';
import tokenizer from '@/resources/Tokenizer';
import { useToast } from 'primevue/usetoast';
import { LocalDateTime, DateTimeFormatter } from '@js-joda/core';

import WorldService from '@/service/WorldService';
import LorebookService from '@/service/LorebookService';
import discordService from '@/service/DiscordService';
import store from '../resources/store';

const worldService = new WorldService();
const lorebookService = new LorebookService();
const loggedUser = store.getters.loggedUser;

const dt = ref(null);
const toast = useToast();

const world = ref({});
const worlds = ref(null);
const selectedWorlds = ref(null);
const worldDialog = ref(false);
const viewWorldDialog = ref(false);
const deleteWorldDialog = ref(false);
const deleteWorldsDialog = ref(false);
const worldSearchFilters = ref({});
const worldSubmitted = ref(false);
const worldPromptTokens = ref(null);
const worldImportDialog = ref(false);

const entry = ref({});
const selectedEntries = ref(null);
const entryDialog = ref(false);
const viewEntryDialog = ref(false);
const deleteEntryDialog = ref(false);
const deleteEntriesDialog = ref(false);
const entryFilters = ref({});
const entrySubmitted = ref(false);
const lorebookEntryNameTokens = ref(null);
const lorebookEntryDescriptionTokens = ref(null);

const visibilities = ref([
    { label: 'PRIVATE', value: 'private' },
    { label: 'PUBLIC', value: 'public' }
]);

const processLorebookEntryNameTokens = (event) => {
    lorebookEntryNameTokens.value = tokenizer.decodeTokens(event.target.value);
};

const processLorebookEntryDescriptionTokens = (event) => {
    lorebookEntryDescriptionTokens.value = tokenizer.decodeTokens(event.target.value);
};

const processWorldPromptTokens = (event) => {
    worldPromptTokens.value = tokenizer.decodeTokens(event.target.value);
};

onBeforeMount(() => {
    initWorldSearchFilters();
    initEntryFilters();
});

onMounted(async () => {
    await worldService.getAllWorlds(loggedUser.id).then(async (data) => {
        const ws = [];
        if (data?.[0] !== undefined) {
            for (let w of data) {
                let canEdit = false;
                if (w.owner === loggedUser.id || w.writePermissions?.contains(loggedUser.id)) {
                    canEdit = true;
                }

                if (w.lorebook === undefined || w.lorebook.length == 0) {
                    w.lorebook = [];
                }

                const ownerData = await discordService.retrieveUserData(w.owner);
                w.ownerData = ownerData;
                w.canEdit = canEdit;
                ws.push(w);
            }
        }

        worlds.value = ws;
    });
});

const importWorld = () => {
    worldSubmitted.value = false;
    worldImportDialog.value = true;
};

const createNewWorld = () => {
    world.value = { lorebook: [] };
    worldSubmitted.value = false;
    worldDialog.value = true;
};

const createNewEntry = () => {
    entry.value = {};
    entrySubmitted.value = false;
    entryDialog.value = true;
};

const hideWorldDialog = () => {
    worldSubmitted.value = false;
    worldDialog.value = false;
};

const hideViewWorldDialog = () => {
    viewWorldDialog.value = false;
};

const hideViewLorebookEntryDialog = () => {
    viewEntryDialog.value = false;
};

const hideEntryDialog = () => {
    entryDialog.value = false;
    entrySubmitted.value = false;
};

const saveWorld = async () => {
    worldSubmitted.value = true;
    if (world.value.name.trim() && world.value.description.trim() && world.value.visibility) {
        if (world.value.id) {
            try {
                world.value.visibility = world.value.visibility.value ? world.value.visibility.value : world.value.visibility;
                await worldService.updateWorld(world.value, loggedUser.id);

                worlds.value[findWorldIndexById(world.value.id)] = world.value;
                toast.add({ severity: 'success', summary: 'Success!', detail: 'World updated', life: 3000 });
            } catch (error) {
                console.error(`An error ocurred while updating the world -> ${error}`);
                toast.add({ severity: 'error', summary: 'Error', detail: 'Error updating world', life: 3000 });
            }
        } else {
            try {
                world.value.visibility = world.value.visibility.value ? world.value.visibility.value : world.value.visibility;
                world.value.owner = loggedUser.id;
                const createdWorld = await worldService.createWorld(world.value, loggedUser.id);

                createdWorld.canEdit = true;
                createdWorld.ownerData = loggedUser;
                worlds.value.push(createdWorld);
                toast.add({ severity: 'success', summary: 'Success!', detail: 'World created', life: 3000 });
            } catch (error) {
                console.error(`An error ocurred while saving the world -> ${error}`);
                toast.add({ severity: 'error', summary: 'Error', detail: 'Error saving world', life: 3000 });
            }
        }
        worldDialog.value = false;
        world.value = {};
    }
};

const saveEntry = async () => {
    entrySubmitted.value = true;
    if (entry.value.name.trim() && entry.value.description.trim()) {
        if (entry.value.id) {
            try {
                await lorebookService.updateLorebookEntry(entry.value, loggedUser.id);
                world.value.lorebook[findEntryIndexById(entry.value.id)] = entry.value;
                toast.add({ severity: 'success', summary: 'Success!', detail: 'Lorebook entry updated', life: 3000 });
            } catch (error) {
                console.error(`An error ocurred while updating the entry -> ${error}`);
                toast.add({ severity: 'error', summary: 'Error', detail: 'Error updating entry', life: 3000 });
            }
        } else {
            try {
                const createdLorebook = await lorebookService.createLorebookEntry(entry.value, world.value, loggedUser.id);
                world.value.lorebook.push(createdLorebook);
                toast.add({ severity: 'success', summary: 'Success!', detail: 'Lorebook entry created', life: 3000 });
            } catch (error) {
                console.error(`An error ocurred while saving the entry -> ${error}`);
                toast.add({ severity: 'error', summary: 'Error', detail: 'Error saving entry', life: 3000 });
            }
        }
        entryDialog.value = false;
        entry.value = {};
    }
};

const viewLorebookEntry = (editEntry) => {
    entry.value = { ...editEntry };

    lorebookEntryNameTokens.value = tokenizer.decodeTokens(entry.value.name);
    lorebookEntryDescriptionTokens.value = tokenizer.decodeTokens(entry.value.description);

    viewEntryDialog.value = true;
};

const viewWorld = (editWorld) => {
    world.value = { ...editWorld };
    worldPromptTokens.value = tokenizer.decodeTokens(world.value.initial_prompt ?? '');
    viewWorldDialog.value = true;
};

const editEntry = (editEntry) => {
    editEntry.entries = [];
    entry.value = { ...editEntry };

    lorebookEntryNameTokens.value = tokenizer.decodeTokens(entry.value.name);
    lorebookEntryDescriptionTokens.value = tokenizer.decodeTokens(entry.value.description);

    entryDialog.value = true;
};

const editWorld = (editWorld) => {
    world.value = { ...editWorld };
    worldPromptTokens.value = tokenizer.decodeTokens(world.value.initial_prompt ?? '');
    worldDialog.value = true;
};

const confirmDeleteWorld = (editWorld) => {
    world.value = editWorld;
    deleteWorldDialog.value = true;
};

const confirmDeleteEntry = (editEntry) => {
    entry.value = editEntry;
    deleteEntryDialog.value = true;
};

const deleteWorld = async () => {
    try {
        await worldService.deleteWorld(world.value, loggedUser.id);
        worlds.value = worlds.value.filter((val) => val.id !== world.value.id);
        deleteWorldDialog.value = false;
        world.value = {};
        toast.add({ severity: 'success', summary: 'Success!', detail: 'World deleted', life: 3000 });
    } catch (error) {
        console.error(`An error ocurred while deleting the world -> ${error}`);
        toast.add({ severity: 'error', summary: 'Error', detail: 'Error deleting world', life: 3000 });
    }
};

const deleteEntry = async () => {
    try {
        await lorebookService.deleteLorebookEntry(entry.value, loggedUser.id);
        world.value.lorebook = world.value.lorebook.filter((val) => val.id !== entry.value.id);
        deleteEntryDialog.value = false;
        entry.value = {};
        toast.add({ severity: 'success', summary: 'Success!', detail: 'Lorebook entry deleted', life: 3000 });
    } catch (error) {
        console.error(`An error ocurred while deleting the entry -> ${error}`);
        toast.add({ severity: 'error', summary: 'Error', detail: 'Error deleting lorebook entry', life: 3000 });
    }
};

const findWorldIndexById = (id) => {
    let index = -1;
    for (let i = 0; i < worlds.value.length; i++) {
        if (worlds.value[i].id === id) {
            index = i;
            break;
        }
    }
    return index;
};

const findEntryIndexById = (id) => {
    let index = -1;
    for (let i = 0; i < world.value.lorebook.length; i++) {
        if (world.value.lorebook[i].id === id) {
            index = i;
            break;
        }
    }
    return index;
};

const confirmDeleteSelectedWorlds = () => {
    deleteWorldsDialog.value = true;
};

const confirmDeleteSelectedEntries = () => {
    deleteEntriesDialog.value = true;
};

const deleteSelectedWorlds = () => {
    worlds.value = worlds.value
        .map((val) => {
            if (!selectedWorlds.value.includes(val)) {
                return val;
            }

            return worldService.deleteWorld(val, loggedUser.id);
        })
        .filter((val) => Object.keys(val).length !== 0);

    deleteWorldsDialog.value = false;
    selectedWorlds.value = null;
    toast.add({ severity: 'success', summary: 'Success!', detail: 'Worlds selected deleted', life: 3000 });
};

const deleteSelectedEntries = () => {
    world.value.lorebook = world.value.lorebook
        .map((val) => {
            if (!selectedEntries.value.includes(val)) {
                return val;
            }

            return lorebookService.deleteLorebookEntry(val, loggedUser.id);
        })
        .filter((val) => Object.keys(val).length !== 0);

    deleteEntriesDialog.value = false;
    selectedEntries.value = null;
    toast.add({ severity: 'success', summary: 'Success!', detail: 'Entries selected deleted', life: 3000 });
};

const initWorldSearchFilters = () => {
    worldSearchFilters.value = {
        global: { value: null, matchMode: FilterMatchMode.CONTAINS }
    };
};

const initEntryFilters = () => {
    entryFilters.value = {
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
        const worldToClone = Object.assign({}, world.value);
        delete worldToClone.id;
        delete worldToClone.owner;
        delete worldToClone.ownerData;
        delete worldToClone.canEdit;
        delete worldToClone.entries;

        if (worldToClone.lorebook === undefined) {
            worldToClone.lorebook = [];
        }

        worldToClone.owner = loggedUser.id;
        worldToClone.name = `${worldToClone.name} - Copy`;
        const createdWorld = await worldService.createWorld(worldToClone, loggedUser.id);

        createdWorld.canEdit = true;
        createdWorld.ownerData = loggedUser;

        viewWorldDialog.value = false;
        worldDialog.value = true;

        world.value = createdWorld;
        worlds.value.push(createdWorld);
        toast.add({ severity: 'success', summary: 'Success!', detail: 'World cloned', life: 3000 });
    } catch (error) {
        console.error(`An error ocurred while cloning the world -> ${error}`);
        toast.add({ severity: 'error', summary: 'Error', detail: 'Error cloning world', life: 3000 });
    }
};

const onImport = async (event) => {
    event.files.forEach(async (file) => {
        const reader = new FileReader();
        reader.onload = async (res) => {
            const worldToImport = JSON.parse(res.target.result);
            worldToImport.owner = loggedUser.id;

            const createdWorld = await worldService.createWorld(worldToImport, loggedUser.id);
            createdWorld.canEdit = true;
            createdWorld.ownerData = loggedUser;

            worlds.value.push(createdWorld);
            toast.add({ severity: 'success', summary: 'Success!', detail: `World imported (${file.name})`, life: 3000 });
        };

        reader.onerror = (err) => {
            console.log(err);
            toast.add({ severity: 'error', summary: 'Error', detail: `Error importing world (${file.name})`, life: 3000 });
        };
        reader.readAsText(file);
    });

    worldImportDialog.value = false;
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
                            ref="dt"
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
                            ref="dt"
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

                <Dialog v-model:visible="viewWorldDialog" header="World" :modal="true" class="p-fluid">
                    <div class="field">
                        <label for="name">Name</label>
                        <InputText disabled id="name" v-model="world.name" />
                    </div>

                    <div class="field">
                        <label for="description">Description</label>
                        <Textarea disabled id="description" v-model="world.description" rows="5" cols="20" />
                    </div>

                    <div class="field">
                        <label for="initial_prompt" v-tooltip="`Text used to begin the adventure instanced from this world. Upon using the /start command on Discord, this text will be shown and reacted upon by the AI.`">
                            Adventure start text <i class="pi pi-info-circle" />
                        </label>
                        <Textarea disabled id="initial_prompt" v-model="world.initial_prompt" rows="5" cols="20" />
                        <div>
                            <small>Tokens: {{ worldPromptTokens?.tokens && world.initial_prompt ? worldPromptTokens?.tokens : 0 }}</small>
                        </div>
                    </div>

                    <div class="field">
                        <label for="visibility" class="mb-3">Visibility</label>
                        <InputText disabled id="visibility" v-model="world.visibility" placeholder="World visibility" />
                    </div>
                    <div class="card" v-if="world.lorebook !== null && world.lorebook.length > 0">
                        <div class="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
                            <h5 class="m-0">Lorebook</h5>
                        </div>

                        <TabView>
                            <TabPanel header="Card view">
                                <DataView
                                    layout="grid"
                                    ref="dt"
                                    :value="world.lorebook"
                                    dataKey="id"
                                    :paginator="true"
                                    :rows="6"
                                    :filters="entryFilters"
                                    paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                                    :rowsPerPageOptions="[6, 12, 18]"
                                    currentPageReportTemplate="Showing {first} to {last} of {totalRecords} entries"
                                    responsiveLayout="scroll"
                                >
                                    <template #empty>No entries found.</template>

                                    <template #grid="slotProps">
                                        <div class="col-12 sm:col-6 lg:col-12 xl:col-4 p-2">
                                            <div class="p-4 border-1 surface-border surface-card border-round">
                                                <div class="flex flex-column align-items-center gap-3 py-5">
                                                    <div align="center" class="text-2xl font-bold card-overflow-subitem-title">{{ slotProps.data.name }}</div>
                                                </div>
                                                <p align="center" class="card-overflow-subitem">
                                                    {{ slotProps.data.description }}
                                                </p>
                                                <div class="flex align-items-center justify-content-between">
                                                    <Button v-if="!slotProps.data.canEdit" icon="pi pi-eye" class="p-button-rounded p-button-success mt-2" @click="viewLorebookEntry(slotProps.data)" />
                                                </div>
                                            </div>
                                        </div>
                                    </template>
                                </DataView>
                            </TabPanel>
                            <TabPanel header="Table view">
                                <DataTable
                                    ref="dt"
                                    :value="world.lorebook"
                                    v-model:selection="selectedEntries"
                                    dataKey="id"
                                    :paginator="true"
                                    :rows="10"
                                    :filters="entryFilters"
                                    paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                                    :rowsPerPageOptions="[5, 10, 25]"
                                    currentPageReportTemplate="Showing {first} to {last} of {totalRecords} entries"
                                    responsiveLayout="scroll"
                                >
                                    <template #empty>No entries found.</template>

                                    <Column selectionMode="multiple" headerStyle="width: 3rem"></Column>
                                    <Column field="name" header="Name" :sortable="true" headerStyle="width:14%; min-width:10rem;">
                                        <template #body="slotProps">
                                            <span class="p-column-title">Name</span>
                                            <div class="table-column-overflow table-column-overflow-subitem">{{ slotProps.data.name }}</div>
                                        </template>
                                    </Column>
                                    <Column field="regex" header="Regex" :sortable="true" headerStyle="width:14%; min-width:10rem;">
                                        <template #body="slotProps">
                                            <span class="p-column-title">Regex</span>
                                            <div class="table-column-overflow table-column-overflow-subitem">{{ slotProps.data.regex }}</div>
                                        </template>
                                    </Column>
                                    <Column field="description" header="Description" :sortable="true" headerStyle="width:14%; min-width:8rem;">
                                        <template #body="slotProps">
                                            <span class="p-column-title">Description</span>
                                            <div class="table-column-overflow table-column-overflow-subitem">{{ slotProps.data.description }}</div>
                                        </template>
                                    </Column>
                                    <Column headerStyle="min-width:10rem;">
                                        <template #body="slotProps">
                                            <Button v-if="!slotProps.data.canEdit" icon="pi pi-eye" class="p-button-rounded p-button-success mt-2" @click="viewLorebookEntry(slotProps.data)" />
                                        </template>
                                    </Column>
                                </DataTable>
                            </TabPanel>
                        </TabView>

                        <Dialog v-model:visible="viewEntryDialog" header="Lorebook entry" :modal="true" class="p-fluid">
                            <div class="field">
                                <label
                                    for="name"
                                    v-tooltip="
                                        `Required field. Name of the entry that will be sent to the AI.
                                If this is a character, this should be their name. The AI will use this as the idenfier to the entry.`
                                    "
                                >
                                    Name <i class="pi pi-info-circle" />
                                </label>
                                <InputText id="name" v-model="entry.name" disabled />
                                <div>
                                    <small>Tokens: {{ lorebookEntryNameTokens?.tokens && entry.name ? lorebookEntryNameTokens?.tokens : 0 }}</small>
                                </div>
                            </div>
                            <div class="field">
                                <label
                                    for="regex"
                                    v-tooltip="
                                        `Optional field. If left empty, will be filled with the entry's name.
                                Regular expresion that when matched will insert the entry into context. Case sensitive. Does not accept regex flags, only the expression itself. Do not wrap the expression in slashes.`
                                    "
                                >
                                    Regex <i class="pi pi-info-circle" />
                                </label>
                                <InputText disabled id="regex" v-model="entry.regex" />
                            </div>
                            <div class="field">
                                <label
                                    for="description"
                                    v-tooltip="
                                        `Required field. Description of the entry.
                                If this is a character, their description (physical and mental) should go here. The AI will base their interactions with the entry based on the values in this field.`
                                    "
                                >
                                    Description <i class="pi pi-info-circle" />
                                </label>
                                <Textarea id="description" v-model="entry.description" disabled rows="3" cols="20" />
                                <div>
                                    <small>Tokens: {{ lorebookEntryDescriptionTokens?.tokens && entry.description ? lorebookEntryDescriptionTokens?.tokens : 0 }}</small>
                                </div>
                            </div>
                            <div>
                                <small>
                                    Total tokens in entry (sum of all fields):
                                    {{ (lorebookEntryNameTokens?.tokens && entry.name ? lorebookEntryNameTokens?.tokens : 0) + (lorebookEntryDescriptionTokens?.tokens && entry.description ? lorebookEntryDescriptionTokens?.tokens : 0) ?? 0 }}
                                </small>
                            </div>
                            <template #footer>
                                <Button label="Cancel" icon="pi pi-times" class="p-button-danger" @click="hideViewLorebookEntryDialog" />
                            </template>
                        </Dialog>
                    </div>

                    <template #footer>
                        <Toolbar class="mb-4">
                            <template v-slot:start>
                                <div class="my-2">
                                    <Button label="Cancel" icon="pi pi-times" class="p-button-danger" @click="hideViewWorldDialog" />
                                </div>
                            </template>
                            <template v-slot:end>
                                <Button v-if="world.id" label="Clone" icon="pi pi-copy" class="p-button-text" @click="cloneWorld" />
                                <Button v-if="world.id" label="Download" icon="pi pi-download" class="p-button-text" @click="downloadWorld" />
                            </template>
                        </Toolbar>
                    </template>
                </Dialog>

                <Dialog v-model:visible="worldDialog" header="World" :modal="true" class="p-fluid">
                    <div class="field">
                        <label for="name">Name <strong :style="{ color: 'red' }">*</strong></label>
                        <InputText id="name" v-model="world.name" required="true" autofocus :class="{ 'p-invalid': worldSubmitted && !world.name }" />
                        <small class="p-invalid" v-if="worldSubmitted && !world.name">Name is required.</small>
                    </div>

                    <div class="field">
                        <label for="description">Description <strong :style="{ color: 'red' }">*</strong></label>
                        <Textarea id="description" v-model="world.description" required="true" rows="5" cols="20" :class="{ 'p-invalid': worldSubmitted && !world.description }" />
                        <small class="p-invalid" v-if="worldSubmitted && !world.description">Description is required.</small>
                    </div>

                    <div class="field">
                        <label for="initial_prompt" v-tooltip="`Text used to begin the adventure instanced from this world. Upon using the /start command on Discord, this text will be shown and reacted upon by the AI.`">
                            Adventure start text <strong :style="{ color: 'red' }">*</strong> <i class="pi pi-info-circle" />
                        </label>
                        <Textarea id="initial_prompt" v-model="world.initial_prompt" required="true" rows="5" cols="20" :class="{ 'p-invalid': worldSubmitted && !world.initial_prompt }" @input="processWorldPromptTokens" />
                        <small class="p-invalid" v-if="worldSubmitted && !world.initial_prompt">Prompt is required.</small>
                        <div>
                            <small>Tokens: {{ worldPromptTokens?.tokens && world.initial_prompt ? worldPromptTokens?.tokens : 0 }}</small>
                        </div>
                    </div>

                    <div class="field">
                        <label for="visibility" class="mb-3">Visibility <strong :style="{ color: 'red' }">*</strong></label>
                        <Dropdown id="visibility" v-model="world.visibility" :options="visibilities" optionLabel="label" placeholder="World visibility" :class="{ 'p-invalid': worldSubmitted && !world.visibility }">
                            <template #value="slotProps">
                                <div v-if="slotProps.value && slotProps.value.value">
                                    <span :class="'visibility-badge visibility-' + slotProps.value.value">{{ slotProps.value.label }}</span>
                                </div>
                                <div v-else-if="slotProps.value && !slotProps.value.value">
                                    <span :class="'visibility-badge visibility-' + slotProps.value.toLowerCase()">{{ slotProps.value }}</span>
                                </div>
                                <span v-else>
                                    {{ slotProps.placeholder }}
                                </span>
                            </template>
                        </Dropdown>
                        <small class="p-invalid" v-if="worldSubmitted && !world.visibility">Visibility is required.</small>
                    </div>

                    <div class="card" v-if="world.lorebook !== null">
                        <div class="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
                            <h5 class="m-0">Lorebook</h5>
                        </div>

                        <TabView>
                            <TabPanel header="Card view">
                                <DataView
                                    layout="grid"
                                    ref="dt"
                                    :value="world.lorebook"
                                    dataKey="id"
                                    :paginator="true"
                                    :rows="6"
                                    :filters="entryFilters"
                                    paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                                    :rowsPerPageOptions="[6, 12, 18]"
                                    currentPageReportTemplate="Showing {first} to {last} of {totalRecords} entries"
                                    responsiveLayout="scroll"
                                >
                                    <template #header>
                                        <Toolbar class="mb-4">
                                            <template v-slot:start>
                                                <div class="my-2">
                                                    <Button label="New" icon="pi pi-plus" class="p-button-success mr-2" @click="createNewEntry" />
                                                </div>
                                            </template>
                                        </Toolbar>
                                    </template>

                                    <template #empty>No entries found.</template>

                                    <template #grid="slotProps">
                                        <div class="col-12 sm:col-6 lg:col-12 xl:col-4 p-2">
                                            <div class="p-4 border-1 surface-border surface-card border-round">
                                                <div class="flex flex-column align-items-center gap-3 py-5">
                                                    <div align="center" class="text-2xl font-bold card-overflow-subitem-title">{{ slotProps.data.name }}</div>
                                                </div>
                                                <p align="center" class="card-overflow-subitem">
                                                    {{ slotProps.data.description }}
                                                </p>
                                                <div class="flex align-items-center justify-content-between">
                                                    <Button icon="pi pi-pencil" class="p-button-rounded p-button-success mr-2" @click="editEntry(slotProps.data)" />
                                                    <Button icon="pi pi-trash" class="p-button-rounded p-button-danger mt-2" @click="confirmDeleteEntry(slotProps.data)" />
                                                </div>
                                            </div>
                                        </div>
                                    </template>
                                </DataView>
                            </TabPanel>
                            <TabPanel header="Table view">
                                <DataTable
                                    ref="dt"
                                    :value="world.lorebook"
                                    v-model:selection="selectedEntries"
                                    dataKey="id"
                                    :paginator="true"
                                    :rows="10"
                                    :filters="entryFilters"
                                    paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                                    :rowsPerPageOptions="[5, 10, 25]"
                                    currentPageReportTemplate="Showing {first} to {last} of {totalRecords} entries"
                                    responsiveLayout="scroll"
                                >
                                    <template #header>
                                        <div class="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
                                            <span class="block mt-2 md:mt-0 p-input-icon-left">
                                                <i class="pi pi-search" />
                                                <InputText v-model="entryFilters['global'].value" placeholder="Search..." />
                                            </span>
                                        </div>
                                        <Toolbar class="mb-4">
                                            <template v-slot:start>
                                                <div class="my-2">
                                                    <Button label="New" icon="pi pi-plus" class="p-button-success mr-2" @click="createNewEntry" />
                                                    <Button label="Delete" icon="pi pi-trash" class="p-button-danger" @click="confirmDeleteSelectedEntries" :disabled="!selectedEntries || !selectedEntries.length" />
                                                </div>
                                            </template>
                                        </Toolbar>
                                    </template>

                                    <template #empty>No entries found.</template>

                                    <Column selectionMode="multiple" headerStyle="width: 3rem"></Column>
                                    <Column field="name" header="Name" :sortable="true" headerStyle="width:14%; min-width:10rem;">
                                        <template #body="slotProps">
                                            <span class="p-column-title">Name</span>
                                            <div class="table-column-overflow table-column-overflow-subitem">{{ slotProps.data.name }}</div>
                                        </template>
                                    </Column>
                                    <Column field="regex" header="Regex" :sortable="true" headerStyle="width:14%; min-width:10rem;">
                                        <template #body="slotProps">
                                            <span class="p-column-title">Regex</span>
                                            <div class="table-column-overflow table-column-overflow-subitem">{{ slotProps.data.regex }}</div>
                                        </template>
                                    </Column>
                                    <Column field="description" header="Description" :sortable="true" headerStyle="width:14%; min-width:8rem;">
                                        <template #body="slotProps">
                                            <span class="p-column-title">Description</span>
                                            <div class="table-column-overflow table-column-overflow-subitem">{{ slotProps.data.description }}</div>
                                        </template>
                                    </Column>
                                    <Column headerStyle="min-width:10rem;">
                                        <template #body="slotProps">
                                            <Button icon="pi pi-pencil" class="p-button-rounded p-button-success mr-2" @click="editEntry(slotProps.data)" />
                                            <Button icon="pi pi-trash" class="p-button-rounded p-button-danger mt-2" @click="confirmDeleteEntry(slotProps.data)" />
                                        </template>
                                    </Column>
                                </DataTable>
                            </TabPanel>
                        </TabView>

                        <Dialog v-model:visible="entryDialog" header="Lorebook entry" :modal="true" class="p-fluid">
                            <div class="field">
                                <label
                                    for="name"
                                    v-tooltip="
                                        `Required field. Name of the entry that will be sent to the AI.
                                If this is a character, this should be their name. The AI will use this as the idenfier to the entry.`
                                    "
                                >
                                    Name <i class="pi pi-info-circle" />
                                </label>
                                <InputText id="name" v-model="entry.name" required="true" autofocus :class="{ 'p-invalid': entrySubmitted && !entry.name }" @input="processLorebookEntryNameTokens" />
                                <small class="p-invalid" v-if="entrySubmitted && !entry.name">Name is required.</small>
                                <div>
                                    <small>Tokens: {{ lorebookEntryNameTokens?.tokens && entry.name ? lorebookEntryNameTokens?.tokens : 0 }}</small>
                                </div>
                            </div>
                            <div class="field">
                                <label
                                    for="regex"
                                    v-tooltip="
                                        `Optional field. If left empty, will be filled with the entry's name.
                                Regular expresion that when matched will insert the entry into context. Case sensitive. Does not accept regex flags, only the expression itself. Do not wrap the expression in slashes.`
                                    "
                                >
                                    Regex <i class="pi pi-info-circle" />
                                </label>
                                <InputText id="regex" v-model="entry.regex" />
                            </div>
                            <div class="field">
                                <label
                                    for="description"
                                    v-tooltip="
                                        `Required field. Description of the entry.
                                If this is a character, their description (physical and mental) should go here. The AI will base their interactions with the entry based on the values in this field.`
                                    "
                                >
                                    Description <i class="pi pi-info-circle" />
                                </label>
                                <Textarea id="description" v-model="entry.description" required="true" rows="3" cols="20" :class="{ 'p-invalid': entrySubmitted && !entry.description }" @input="processLorebookEntryDescriptionTokens" />
                                <small class="p-invalid" v-if="entrySubmitted && !entry.description">Description is required.</small>
                                <div>
                                    <small>Tokens: {{ lorebookEntryDescriptionTokens?.tokens && entry.description ? lorebookEntryDescriptionTokens?.tokens : 0 }}</small>
                                </div>
                            </div>
                            <div>
                                <small>
                                    Total tokens in entry (sum of all fields):
                                    {{ (lorebookEntryNameTokens?.tokens && entry.name ? lorebookEntryNameTokens?.tokens : 0) + (lorebookEntryDescriptionTokens?.tokens && entry.description ? lorebookEntryDescriptionTokens?.tokens : 0) ?? 0 }}
                                </small>
                            </div>
                            <template #footer>
                                <Button label="Cancel" icon="pi pi-times" class="p-button-danger" @click="hideEntryDialog" />
                                <Button label="Save" icon="pi pi-check" class="p-button-primary" @click="saveEntry" />
                            </template>
                        </Dialog>
                    </div>

                    <template #footer>
                        <Toolbar class="mb-4">
                            <template v-slot:start>
                                <div class="my-2">
                                    <Button label="Cancel" icon="pi pi-times" class="p-button-danger" @click="hideWorldDialog" />
                                </div>
                            </template>
                            <template v-slot:end>
                                <Button v-if="world.id" label="Clone" icon="pi pi-copy" class="p-button-text" @click="cloneWorld" />
                                <Button v-if="world.id" label="Download" icon="pi pi-download" class="p-button-text" @click="downloadWorld" />
                                <Button label="Save" icon="pi pi-check" class="p-button-primary" @click="saveWorld" />
                            </template>
                        </Toolbar>
                    </template>
                </Dialog>

                <Dialog v-model:visible="worldImportDialog" header="Import" :modal="true">
                    <FileUpload name="import[]" :customUpload="true" @uploader="onImport" :multiple="true" accept="application/json" :maxFileSize="1000000" label="Import" chooseLabel="Import" class="mr-2 inline-block" />
                    <template #footer>
                        <Button label="Cancel" icon="pi pi-times" class="p-button-danger" @click="worldImportDialog = false" />
                    </template>
                </Dialog>

                <Dialog v-model:visible="deleteWorldDialog" :style="{ width: '450px !important' }" header="Confirm" :modal="true">
                    <div class="flex align-items-center justify-content-center">
                        <i class="pi pi-exclamation-triangle mr-3" style="font-size: 2rem" />
                        <span v-if="world">
                            Are you sure you want to delete <b>{{ world.name }}</b
                            >?
                        </span>
                    </div>
                    <template #footer>
                        <Button label="No" icon="pi pi-times" class="p-button-danger" @click="deleteWorldDialog = false" />
                        <Button label="Yes" icon="pi pi-check" class="p-button-primary" @click="deleteWorld" />
                    </template>
                </Dialog>

                <Dialog v-model:visible="deleteWorldsDialog" :style="{ width: '450px !important' }" header="Confirm" :modal="true">
                    <div class="flex align-items-center justify-content-center">
                        <i class="pi pi-exclamation-triangle mr-3" style="font-size: 2rem" />
                        <span v-if="world">Are you sure you want to delete the selected worlds?</span>
                    </div>
                    <template #footer>
                        <Button label="No" icon="pi pi-times" class="p-button-danger" @click="deleteWorldsDialog = false" />
                        <Button label="Yes" icon="pi pi-check" class="p-button-primary" @click="deleteSelectedWorlds" />
                    </template>
                </Dialog>

                <Dialog v-model:visible="deleteEntryDialog" :style="{ width: '450px !important' }" header="Confirm" :modal="true">
                    <div class="flex align-items-center justify-content-center">
                        <i class="pi pi-exclamation-triangle mr-3" style="font-size: 2rem" />
                        <span v-if="entry">
                            Are you sure you want to delete <b>{{ entry.name }}</b
                            >?
                        </span>
                    </div>
                    <template #footer>
                        <Button label="No" icon="pi pi-times" class="p-button-danger" @click="deleteEntryDialog = false" />
                        <Button label="Yes" icon="pi pi-check" class="p-button-primary" @click="deleteEntry" />
                    </template>
                </Dialog>

                <Dialog v-model:visible="deleteEntriesDialog" :style="{ width: '450px !important' }" header="Confirm" :modal="true">
                    <div class="flex align-items-center justify-content-center">
                        <i class="pi pi-exclamation-triangle mr-3" style="font-size: 2rem" />
                        <span v-if="entry">Are you sure you want to delete the selected entries?</span>
                    </div>
                    <template #footer>
                        <Button label="No" icon="pi pi-times" class="p-button-danger" @click="deleteEntriesDialog = false" />
                        <Button label="Yes" icon="pi pi-check" class="p-button-primary" @click="deleteSelectedEntries" />
                    </template>
                </Dialog>
            </div>
        </div>
    </div>
</template>

<style scoped lang="scss">
@import '@/assets/demo/styles/badges.scss';
</style>
