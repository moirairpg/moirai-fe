<script setup>
import { FilterMatchMode } from 'primevue/api';
import { ref, onMounted, onBeforeMount } from 'vue';
import { useToast } from 'primevue/usetoast';
import WorldService from '@/service/WorldService';
import LorebookService from '@/service/LorebookService';
import DiscordService from '@/service/DiscordService';
import store from '../resources/store';

const worldService = new WorldService();
const lorebookService = new LorebookService();
const discordService = new DiscordService();
const loggedUser = store.getters.loggedUser;

const toast = useToast();
const world = ref({});
const worlds = ref(null);
const lorebook = ref({});
const lorebooks = ref(null);
const lorebookDialog = ref(false);
const selectedWorlds = ref(null);
const worldDialog = ref(false);
const viewWorldDialog = ref(false);
const deleteWorldDialog = ref(false);
const deleteWorldsDialog = ref(false);
const dt = ref(null);
const worldSearchFilters = ref({});
const lorebookSearchFilters = ref({});
const worldSubmitted = ref(false);
const visibilities = ref([
    { label: 'PRIVATE', value: 'private' },
    { label: 'PUBLIC', value: 'public' }
]);

onBeforeMount(() => {
    initWorldSearchFilters();
    initLorebookSearchFilters();
});

onMounted(async () => {
    await lorebookService.getAllLorebooks(loggedUser.id).then(async (data) => {
        const lbs = [];

        if (data?.[0] !== undefined) {
            for (let lb of data) {
                const ownerData = await discordService.retrieveUserData(lb.owner);
                if (lb.entries === undefined || lb.entries.length == 0) {
                    lb.entries = [];
                }

                lb.ownerData = ownerData;
                lbs.push(lb);
            }
        }

        lorebooks.value = lbs;
    });

    await worldService.getAllWorlds(loggedUser.id).then(async (data) => {
        const ws = [];
        if (data?.[0] !== undefined) {
            for (let w of data) {
                let canEdit = false;
                if (w.owner === loggedUser.id || w.writePermissions?.contains(loggedUser.id)) {
                    canEdit = true;
                }

                const ownerData = await discordService.retrieveUserData(w.owner);
                w.lorebook = lorebooks.value.find((l) => w.lorebook.id === l.id);
                w.ownerData = ownerData;
                w.canEdit = canEdit;
                ws.push(w);
            }
        }

        worlds.value = ws;
    });
});

const createNewWorld = () => {
    world.value = { lorebook: { id: '0' } };
    worldSubmitted.value = false;
    worldDialog.value = true;
};

const hideWorldDialog = () => {
    worldSubmitted.value = false;
    worldDialog.value = false;
};

const hideViewWorldDialog = () => {
    viewWorldDialog.value = false;
};

const hideLorebookDialog = () => {
    lorebookDialog.value = false;
    lorebookSubmitted.value = false;
};

const saveWorld = async () => {
    worldSubmitted.value = true;
    if (world.value.name.trim() && world.value.description.trim() && world.value.visibility) {
        if (world.value.id) {
            try {
                const canEdit = world.value.canEdit;
                const worldOwner = world.value.ownerData;
                world.value.visibility = world.value.visibility.value ? world.value.visibility.value : world.value.visibility;
                await worldService.updateWorld(world.value, loggedUser.id);

                world.value.canEdit = canEdit;
                world.value.ownerData = worldOwner;
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

const viewWorld = (editWorld) => {
    world.value = { ...editWorld };
    viewWorldDialog.value = true;
};

const editWorld = (editWorld) => {
    world.value = { ...editWorld };
    worldDialog.value = true;
};

const openLorebook = (selectedLorebook) => {
    lorebook.value = { ...selectedLorebook };
    lorebookDialog.value = true;
};

const selectLorebook = () => {
    world.value.lorebook = lorebook.value;
    lorebookDialog.value = false;
    lorebook.value = {};
};

const confirmDeleteWorld = (editWorld) => {
    world.value = editWorld;
    deleteWorldDialog.value = true;
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

const exportCSV = () => {
    dt.value.exportCSV();
};

const confirmDeleteSelectedWorlds = () => {
    deleteWorldsDialog.value = true;
};

const deleteSelectedWorlds = () => {
    worlds.value = worlds.value
        .map((val) => {
            if (!selectedWorlds.value.includes(val)) {
                return val;
            }

            return worldService.deleteWorld(val);
        })
        .filter((val) => Object.keys(val).length !== 0);

    deleteWorldsDialog.value = false;
    selectedWorlds.value = null;
    toast.add({ severity: 'success', summary: 'Success!', detail: 'Worlds selected deleted', life: 3000 });
};

const initWorldSearchFilters = () => {
    worldSearchFilters.value = {
        global: { value: null, matchMode: FilterMatchMode.CONTAINS }
    };
};

const initLorebookSearchFilters = () => {
    lorebookSearchFilters.value = {
        global: { value: null, matchMode: FilterMatchMode.CONTAINS }
    };
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
                                </div>
                            </template>
                            <template v-slot:end>
                                <FileUpload mode="basic" accept="image/*" :maxFileSize="1000000" label="Import" chooseLabel="Import" class="mr-2 inline-block" />
                                <Button label="Export" icon="pi pi-upload" class="p-button-help" @click="exportCSV($event)" />
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
                                            <Button v-if="slotProps.data.canEdit" icon="pi pi-trash" class="p-button-rounded p-button-warning mt-2" @click="confirmDeleteWorld(slotProps.data)" />
                                            <Button v-if="!slotProps.data.canEdit" icon="pi pi-eye" class="p-button-rounded p-button-warning mt-2" @click="viewWorld(slotProps.data)" />
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
                                    <Button label="Delete" icon="pi pi-trash" class="p-button-danger" @click="confirmDeleteSelectedWorlds" :disabled="!selectedWorlds || !selectedWorlds.length" />
                                </div>
                            </template>
                            <template v-slot:end>
                                <FileUpload mode="basic" accept="image/*" :maxFileSize="1000000" label="Import" chooseLabel="Import" class="mr-2 inline-block" />
                                <Button label="Export" icon="pi pi-upload" class="p-button-help" @click="exportCSV($event)" />
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
                            <Column field="lorebook" header="Lorebook" :sortable="true" headerStyle="width:14%; min-width:10rem;">
                                <template #body="slotProps">
                                    <span class="p-column-title">Lorebook</span>
                                    {{ slotProps.data.lorebook.name }}
                                </template>
                            </Column>
                            <Column headerStyle="min-width:10rem;">
                                <template #body="slotProps">
                                    <Button v-if="slotProps.data.canEdit" icon="pi pi-pencil" class="p-button-rounded p-button-success mr-2" @click="editWorld(slotProps.data)" />
                                    <Button v-if="slotProps.data.canEdit" icon="pi pi-trash" class="p-button-rounded p-button-warning mt-2" @click="confirmDeleteWorld(slotProps.data)" />
                                    <Button v-if="!slotProps.data.canEdit" icon="pi pi-eye" class="p-button-rounded p-button-warning mt-2" @click="viewWorld(slotProps.data)" />
                                </template>
                            </Column>
                        </DataTable>
                    </TabPanel>
                </TabView>

                <Dialog v-model:visible="viewWorldDialog" header="World" :modal="true" class="p-fluid">
                    <div class="field">
                        <label for="name">Name</label>
                        <InputText disabled id="name" v-model.trim="world.name" />
                    </div>

                    <div class="field">
                        <label for="description">Description</label>
                        <Textarea disabled id="description" v-model.trim="world.description" rows="5" cols="20" />
                    </div>

                    <div class="field">
                        <label for="visibility" class="mb-3">Visibility</label>
                        <InputText disabled id="visibility" v-model="world.visibility" placeholder="World visibility" />
                    </div>

                    <Card>
                        <template #title>Lorebook</template>
                        <template #content>
                            <div class="col-12">
                                <div class="flex flex-column xl:flex-row xl:align-items-start p-4 gap-4">
                                    <div class="flex flex-column sm:flex-row justify-content-between align-items-center xl:align-items-start flex-1 gap-4">
                                        <div class="flex flex-column align-items-center sm:align-items-start gap-3">
                                            <div class="text-2xl font-bold text-900">{{ world.lorebook.name }}</div>
                                            <div class="flex align-items-center gap-3">
                                                <span class="flex align-items-center gap-2">
                                                    <i class="pi pi-user"></i>
                                                    <span class="font-semibold">{{ world.lorebook.ownerData.username }}</span>
                                                </span>
                                            </div>
                                        </div>
                                        <div class="flex sm:flex-column align-items-center sm:align-items-end gap-3 sm:gap-2">
                                            <Button icon="pi pi-check" class="p-button-rounded p-button-success mr-2" @click="openLorebook(world.lorebook)" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </template>
                    </Card>

                    <template #footer>
                        <Button label="Cancel" icon="pi pi-times" class="p-button-text" @click="hideViewWorldDialog" />
                    </template>
                </Dialog>

                <Dialog v-model:visible="worldDialog" header="World" :modal="true" class="p-fluid">
                    <div class="field">
                        <label for="name">Name</label>
                        <InputText id="name" v-model.trim="world.name" required="true" autofocus :class="{ 'p-invalid': worldSubmitted && !world.name }" />
                        <small class="p-invalid" v-if="worldSubmitted && !world.name">Name is required.</small>
                    </div>

                    <div class="field">
                        <label for="description">Description</label>
                        <Textarea id="description" v-model.trim="world.description" required="true" rows="5" cols="20" :class="{ 'p-invalid': worldSubmitted && !world.description }" />
                        <small class="p-invalid" v-if="worldSubmitted && !world.description">Description is required.</small>
                    </div>

                    <div class="field">
                        <label for="visibility" class="mb-3">Visibility</label>
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
                        <small class="p-invalid" v-if="worldSubmitted && !world.description">Visibility is required.</small>
                    </div>

                    <div class="card" v-if="lorebooks">
                        <TabView>
                            <TabPanel header="Card view">
                                <DataView
                                    layout="grid"
                                    ref="dt"
                                    :value="lorebooks"
                                    dataKey="id"
                                    :paginator="true"
                                    :rows="6"
                                    :filters="lorebookSearchFilters"
                                    paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                                    :rowsPerPageOptions="[6, 12, 18]"
                                    currentPageReportTemplate="Showing {first} to {last} of {totalRecords} lorebooks"
                                    responsiveLayout="scroll"
                                    maxLength
                                    :gridStyle="({ id }) => (id === world.lorebook.id ? 'color: var(--surface-0);background-color: var(--surface-500)' : null)"
                                >
                                    <template #header>
                                        <div class="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
                                            <h5 class="m-0">Lorebooks</h5>
                                        </div>
                                    </template>

                                    <template #empty>No personas found.</template>

                                    <template #grid="slotProps">
                                        <div class="col-12 sm:col-6 lg:col-12 xl:col-4 p-2">
                                            <div class="p-4 border-1 surface-border surface-card border-round">
                                                <div class="flex flex-wrap align-items-center justify-content-between gap-2">
                                                    <div class="flex align-items-center gap-2">
                                                        <i class="pi pi-user"></i>
                                                        <span class="font-semibold">{{ slotProps.data.ownerData.username }}</span>
                                                    </div>
                                                    <Tag :value="`${world.lorebook.id === slotProps.data.id ? 'SELECTED' : 'AVAILABLE'}`" :class="'visibility-badge'" />
                                                </div>
                                                <div class="flex flex-column align-items-center gap-3 py-5">
                                                    <div class="text-2xl font-bold card-overflow-title">{{ slotProps.data.name }}</div>
                                                </div>
                                                <p align="center" class="card-overflow">
                                                    {{ slotProps.data.description }}
                                                </p>
                                                <div class="flex align-items-center justify-content-between">
                                                    <Button icon="pi pi-check" class="p-button-rounded p-button-success mr-2" @click="openLorebook(slotProps.data)" />
                                                </div>
                                            </div>
                                        </div>
                                    </template>
                                </DataView>
                            </TabPanel>
                            <TabPanel header="Table view">
                                <DataTable
                                    ref="dt"
                                    :value="lorebooks"
                                    dataKey="id"
                                    :paginator="true"
                                    :rows="10"
                                    :filters="lorebookSearchFilters"
                                    paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                                    :rowsPerPageOptions="[5, 10, 25]"
                                    currentPageReportTemplate="Showing {first} to {last} of {totalRecords} lorebooks"
                                    responsiveLayout="scroll"
                                    :rowStyle="({ id }) => (id === world.lorebook.id ? 'color: var(--surface-0);background-color: var(--surface-500)' : null)"
                                >
                                    <template #header>
                                        <div class="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
                                            <h5 class="m-0">Lorebooks</h5>
                                            <span class="block mt-2 md:mt-0 p-input-icon-left">
                                                <i class="pi pi-search" />
                                                <InputText v-model="lorebookSearchFilters['global'].value" placeholder="Search..." />
                                            </span>
                                        </div>
                                    </template>

                                    <Column field="name" header="Name" :sortable="true" headerStyle="width:14%; min-width:10rem;">
                                        <template #body="slotProps">
                                            <span class="p-column-title">Name</span>
                                            <div class="table-column-overflow table-column-overflow-subitem">{{ slotProps.data.name }}</div>
                                        </template>
                                    </Column>
                                    <Column field="description" header="Description" :sortable="true" headerStyle="width:14%; min-width:8rem;">
                                        <template #body="slotProps">
                                            <span class="p-column-title">Description</span>
                                            <div class="table-column-overflow table-column-overflow-subitem">{{ slotProps.data.description }}</div>
                                        </template>
                                    </Column>
                                    <Column field="owner" header="Owner" :sortable="true" headerStyle="width:14%; min-width:8rem;">
                                        <template #body="slotProps">
                                            <span class="p-column-title">Owner</span>
                                            <div class="table-column-overflow table-column-overflow-subitem">{{ slotProps.data.ownerData.username }}</div>
                                        </template>
                                    </Column>
                                    <Column headerStyle="min-width:10rem;">
                                        <template #body="slotProps">
                                            <Button icon="pi pi-check" class="p-button-rounded p-button-success mr-2" @click="openLorebook(slotProps.data)" />
                                        </template>
                                    </Column>
                                </DataTable>
                            </TabPanel>
                        </TabView>
                    </div>

                    <template #footer>
                        <Button label="Cancel" icon="pi pi-times" class="p-button-text" @click="hideWorldDialog" />
                        <Button label="Save" icon="pi pi-check" class="p-button-text" @click="saveWorld" />
                    </template>
                </Dialog>

                <Dialog v-model:visible="lorebookDialog" header="Lorebook" :modal="true" class="p-fluid">
                    <div class="field">
                        <label for="name">Name</label>
                        <InputText id="name" v-model.trim="lorebook.name" disabled />
                    </div>
                    <div class="field">
                        <label for="description">Description</label>
                        <Textarea id="description" v-model.trim="lorebook.description" rows="3" cols="20" disabled />
                    </div>
                    <template #footer>
                        <Button label="Close" icon="pi pi-times" class="p-button-text" @click="hideLorebookDialog" />
                        <Button v-if="worldDialog" label="Select" icon="pi pi-check" class="p-button-text" @click="selectLorebook" />
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
                        <Button label="No" icon="pi pi-times" class="p-button-text" @click="deleteWorldDialog = false" />
                        <Button label="Yes" icon="pi pi-check" class="p-button-text" @click="deleteWorld" />
                    </template>
                </Dialog>

                <Dialog v-model:visible="deleteWorldsDialog" :style="{ width: '450px !important' }" header="Confirm" :modal="true">
                    <div class="flex align-items-center justify-content-center">
                        <i class="pi pi-exclamation-triangle mr-3" style="font-size: 2rem" />
                        <span v-if="world">Are you sure you want to delete the selected worlds?</span>
                    </div>
                    <template #footer>
                        <Button label="No" icon="pi pi-times" class="p-button-text" @click="deleteWorldsDialog = false" />
                        <Button label="Yes" icon="pi pi-check" class="p-button-text" @click="deleteSelectedWorlds" />
                    </template>
                </Dialog>
            </div>
        </div>
    </div>
</template>

<style scoped lang="scss">
@import '@/assets/demo/styles/badges.scss';
</style>
