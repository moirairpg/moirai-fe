<script setup>
import { FilterMatchMode } from 'primevue/api';
import { ref, onMounted, onBeforeMount } from 'vue';
import { useToast } from 'primevue/usetoast';
import LorebookService from '@/service/LorebookService';
import DiscordService from '@/service/DiscordService';

const lorebookService = new LorebookService();
const discordService = new DiscordService();
const authData = JSON.parse(localStorage.getItem('user_data'));

const toast = useToast();
const lorebook = ref({});
const lorebooks = ref(null);
const selectedLorebooks = ref(null);
const lorebookDialog = ref(false);
const deleteLorebookDialog = ref(false);
const deleteLorebooksDialog = ref(false);
const entry = ref({});
const selectedEntries = ref(null);
const entryDialog = ref(false);
const deleteEntryDialog = ref(false);
const deleteEntriesDialog = ref(false);
const dt = ref(null);
const lorebookFilters = ref({});
const entryFilters = ref({});
const lorebookSubmitted = ref(false);
const entrySubmitted = ref(false);
const statuses = ref([
    { label: 'PRIVATE', value: 'private' },
    { label: 'PUBLIC', value: 'public' }
]);

onBeforeMount(() => {
    initLorebookFilters();
    initEntryFilters();
});

onMounted(async () => {
    await lorebookService.getAllLorebooks().then(async (data) => {
        if (data.entries === undefined || data.entries.length == 0) {
            data.entries = [];
        }

        const lbs = [];
        for (let lb of data) {
            const ownerData = await discordService.retrieveUserData(lb.owner);
            lb.ownerData = ownerData;
            lbs.push(lb);
        }

        lorebooks.value = lbs;
    });
});

const createNewLorebook = () => {
    lorebook.value = {};
    lorebook.value.entries = null;
    lorebookSubmitted.value = false;
    lorebookDialog.value = true;
};

const createNewEntry = () => {
    entry.value = {};
    entrySubmitted.value = false;
    entryDialog.value = true;
};

const hideLorebookDialog = () => {
    lorebookDialog.value = false;
    lorebookSubmitted.value = false;
};

const hideEntryDialog = () => {
    entryDialog.value = false;
    entrySubmitted.value = false;
};

const saveLorebook = async () => {
    lorebookSubmitted.value = true;
    if (lorebook.value.name.trim() && lorebook.value.description.trim() && lorebook.value.visibility) {
        if (lorebook.value.id) {
            try {
                lorebook.value.visibility = lorebook.value.visibility.value ? lorebook.value.visibility.value : lorebook.value.visibility;
                await lorebookService.updateLorebook(lorebook.value);
                lorebooks.value[findLorebookIndexById(lorebook.value.id)] = lorebook.value;
                toast.add({ severity: 'success', summary: 'Success!', detail: 'Lorebook updated', life: 3000 });
            } catch {
                toast.add({ severity: 'error', summary: 'Error', detail: 'Error updating lorebook', life: 3000 });
            }
        } else {
            try {
                lorebook.value.visibility = lorebook.value.visibility ? lorebook.value.visibility.value : 'PRIVATE';
                lorebook.value.owner = authData.id;
                const createdLorebook = await lorebookService.createLorebook(lorebook.value);
                createdLorebook.ownerData = authData;
                lorebooks.value.push(createdLorebook);
                toast.add({ severity: 'success', summary: 'Success!', detail: 'Lorebook created', life: 3000 });
            } catch {
                toast.add({ severity: 'error', summary: 'Error', detail: 'Error saving lorebook', life: 3000 });
            }
        }
        lorebookDialog.value = false;
        lorebook.value = {};
    }
};

const saveEntry = async () => {
    entrySubmitted.value = true;
    if (entry.value.name.trim() && entry.value.description.trim()) {
        if (entry.value.id) {
            try {
                await lorebookService.updateLorebookEntry(entry.value);
                lorebook.value.entries[findEntryIndexById(entry.value.id)] = entry.value;
                toast.add({ severity: 'success', summary: 'Success!', detail: 'Lorebook entry updated', life: 3000 });
            } catch {
                toast.add({ severity: 'error', summary: 'Error', detail: 'Error updating entry', life: 3000 });
            }
        } else {
            try {
                const createdLorebook = await lorebookService.createLorebookEntry(entry.value, lorebook.value);
                lorebook.value.entries.push(createdLorebook);
                toast.add({ severity: 'success', summary: 'Success!', detail: 'Lorebook entry created', life: 3000 });
            } catch {
                toast.add({ severity: 'error', summary: 'Error', detail: 'Error saving entry', life: 3000 });
            }
        }
        entryDialog.value = false;
        entry.value = {};
    }
};

const editLorebook = (editLorebook) => {
    lorebook.value = { ...editLorebook };
    lorebookDialog.value = true;
};

const editEntry = (editEntry) => {
    editEntry.entries = [];
    entry.value = { ...editEntry };
    entryDialog.value = true;
};

const confirmDeleteLorebook = (editLorebook) => {
    lorebook.value = editLorebook;
    deleteLorebookDialog.value = true;
};

const confirmDeleteEntry = (editEntry) => {
    entry.value = editEntry;
    deleteEntryDialog.value = true;
};

const deleteLorebook = async () => {
    try {
        await lorebookService.deleteLorebook(lorebook.value);
        lorebooks.value = lorebooks.value.filter((val) => val.id !== lorebook.value.id);
        deleteLorebookDialog.value = false;
        lorebook.value = {};
        toast.add({ severity: 'success', summary: 'Success!', detail: 'Lorebook deleted', life: 3000 });
    } catch {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Error deleting lorebook', life: 3000 });
    }
};

const deleteEntry = async () => {
    try {
        await lorebookService.deleteLorebookEntry(entry.value);
        lorebook.value.entries = lorebook.value.entries.filter((val) => val.id !== entry.value.id);
        deleteEntryDialog.value = false;
        entry.value = {};
        toast.add({ severity: 'success', summary: 'Success!', detail: 'Lorebook deleted', life: 3000 });
    } catch {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Error deleting lorebook', life: 3000 });
    }
};

const findLorebookIndexById = (id) => {
    let index = -1;
    for (let i = 0; i < lorebooks.value.length; i++) {
        if (lorebooks.value[i].id === id) {
            index = i;
            break;
        }
    }
    return index;
};

const findEntryIndexById = (id) => {
    let index = -1;
    for (let i = 0; i < lorebook.value.entries.length; i++) {
        if (lorebook.value.entries[i].id === id) {
            index = i;
            break;
        }
    }
    return index;
};

const exportCSV = () => {
    dt.value.exportCSV();
};

const deleteSelectedLorebooks = () => {
    lorebooks.value = lorebooks.value
        .map((val) => {
            if (!selectedLorebooks.value.includes(val)) {
                return val;
            }

            return lorebookService.deleteLorebook(val);
        })
        .filter((val) => Object.keys(val).length !== 0);

    deleteLorebooksDialog.value = false;
    selectedLorebooks.value = null;
    toast.add({ severity: 'success', summary: 'Success!', detail: 'Lorebooks selected deleted', life: 3000 });
};

const deleteSelectedEntries = () => {
    lorebook.value.entries = lorebook.value.entries
        .map((val) => {
            if (!selectedEntries.value.includes(val)) {
                return val;
            }

            return lorebookService.deleteLorebookEntry(val);
        })
        .filter((val) => Object.keys(val).length !== 0);

    deleteEntriesDialog.value = false;
    selectedEntries.value = null;
    toast.add({ severity: 'success', summary: 'Success!', detail: 'Entries selected deleted', life: 3000 });
};

const initLorebookFilters = () => {
    lorebookFilters.value = {
        global: { value: null, matchMode: FilterMatchMode.CONTAINS }
    };
};

const initEntryFilters = () => {
    entryFilters.value = {
        global: { value: null, matchMode: FilterMatchMode.CONTAINS }
    };
};
</script>

<template>
    <div class="grid">
        <div class="col-12">
            <div class="card">
                <Toast />
                <Toolbar class="mb-4">
                    <template v-slot:start>
                        <div class="my-2">
                            <Button label="New" icon="pi pi-plus" class="p-button-success mr-2" @click="createNewLorebook" />
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
                    :value="lorebooks"
                    dataKey="id"
                    :paginator="true"
                    :rows="6"
                    :filters="lorebookFilters"
                    paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                    :rowsPerPageOptions="[6, 12, 18]"
                    currentPageReportTemplate="Showing {first} to {last} of {totalRecords} lorebooks"
                    responsiveLayout="scroll"
                >
                    <template #header>
                        <div class="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
                            <h5 class="m-0">Lorebooks</h5>
                        </div>
                    </template>

                    <template #empty>No lorebooks found.</template>

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
                                    <Button icon="pi pi-pencil" class="p-button-rounded p-button-success mr-2" @click="editLorebook(slotProps.data)" />
                                    <Button icon="pi pi-trash" class="p-button-rounded p-button-warning mt-2" @click="confirmDeleteLorebook(slotProps.data)" />
                                </div>
                            </div>
                        </div>
                    </template>
                </DataView>

                <Dialog v-model:visible="lorebookDialog" header="Lorebook" :modal="true" class="p-fluid">
                    <div class="field">
                        <label for="name">Name</label>
                        <InputText id="name" v-model.trim="lorebook.name" required="true" autofocus :class="{ 'p-invalid': lorebookSubmitted && !lorebook.name }" />
                        <small class="p-invalid" v-if="lorebookSubmitted && !lorebook.name">Name is required.</small>
                    </div>
                    <div class="field">
                        <label for="description">Description</label>
                        <Textarea id="description" v-model.trim="lorebook.description" required="true" rows="3" cols="20" :class="{ 'p-invalid': lorebookSubmitted && !lorebook.description }" />
                        <small class="p-invalid" v-if="lorebookSubmitted && !lorebook.description">Description is required.</small>
                    </div>
                    <div class="field">
                        <label for="visibility" class="mb-3">Visibility</label>
                        <Dropdown id="visibility" v-model="lorebook.visibility" :options="statuses" optionLabel="label" placeholder="Lorebook visibility" :class="{ 'p-invalid': lorebookSubmitted && !lorebook.visibility }">
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
                        <small class="p-invalid" v-if="lorebookSubmitted && !lorebook.description">Visibility is required.</small>
                    </div>
                    <template #footer>
                        <Button label="Cancel" icon="pi pi-times" class="p-button-text" @click="hideLorebookDialog" />
                        <Button label="Save" icon="pi pi-check" class="p-button-text" @click="saveLorebook" />
                    </template>

                    <div class="card" v-if="lorebook.entries !== null">
                        <DataView
                            layout="grid"
                            ref="dt"
                            :value="lorebook.entries"
                            dataKey="id"
                            :paginator="true"
                            :rows="6"
                            :filters="entryFilters"
                            paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                            :rowsPerPageOptions="[6, 12, 18]"
                            currentPageReportTemplate="Showing {first} to {last} of {totalRecords} lorebooks"
                            responsiveLayout="scroll"
                        >
                            <template #header>
                                <div class="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
                                    <h5 class="m-0">Entries</h5>
                                </div>
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
                                            <Button icon="pi pi-trash" class="p-button-rounded p-button-warning mt-2" @click="confirmDeleteEntry(slotProps.data)" />
                                        </div>
                                    </div>
                                </div>
                            </template>
                        </DataView>

                        <Dialog v-model:visible="entryDialog" header="Lorebook entry" :modal="true" class="p-fluid">
                            <div class="field">
                                <label for="name">Name</label>
                                <InputText id="name" v-model.trim="entry.name" required="true" autofocus :class="{ 'p-invalid': entrySubmitted && !entry.name }" />
                                <small class="p-invalid" v-if="entrySubmitted && !entry.name">Name is required.</small>
                            </div>
                            <div class="field">
                                <label for="regex">Regex</label>
                                <InputText id="regex" v-model.trim="entry.regex" />
                            </div>
                            <div class="field">
                                <label for="description">Description</label>
                                <Textarea id="description" v-model.trim="entry.description" required="true" rows="3" cols="20" :class="{ 'p-invalid': entrySubmitted && !entry.description }" />
                                <small class="p-invalid" v-if="entrySubmitted && !entry.description">Description is required.</small>
                            </div>
                            <template #footer>
                                <Button label="Cancel" icon="pi pi-times" class="p-button-text" @click="hideEntryDialog" />
                                <Button label="Save" icon="pi pi-check" class="p-button-text" @click="saveEntry" />
                            </template>
                        </Dialog>
                    </div>
                </Dialog>

                <Dialog v-model:visible="deleteLorebookDialog" :style="{ width: '450px !important' }" header="Confirm" :modal="true">
                    <div class="flex align-items-center justify-content-center">
                        <i class="pi pi-exclamation-triangle mr-3" style="font-size: 2rem" />
                        <span v-if="lorebook">
                            Are you sure you want to delete <b>{{ lorebook.name }}</b
                            >?
                        </span>
                    </div>
                    <template #footer>
                        <Button label="No" icon="pi pi-times" class="p-button-text" @click="deleteLorebookDialog = false" />
                        <Button label="Yes" icon="pi pi-check" class="p-button-text" @click="deleteLorebook" />
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
                        <Button label="No" icon="pi pi-times" class="p-button-text" @click="deleteEntryDialog = false" />
                        <Button label="Yes" icon="pi pi-check" class="p-button-text" @click="deleteEntry" />
                    </template>
                </Dialog>

                <Dialog v-model:visible="deleteLorebooksDialog" :style="{ width: '450px !important' }" header="Confirm" :modal="true">
                    <div class="flex align-items-center justify-content-center">
                        <i class="pi pi-exclamation-triangle mr-3" style="font-size: 2rem" />
                        <span v-if="lorebook">Are you sure you want to delete the selected lorebooks?</span>
                    </div>
                    <template #footer>
                        <Button label="No" icon="pi pi-times" class="p-button-text" @click="deleteLorebooksDialog = false" />
                        <Button label="Yes" icon="pi pi-check" class="p-button-text" @click="deleteSelectedLorebooks" />
                    </template>
                </Dialog>

                <Dialog v-model:visible="deleteEntriesDialog" :style="{ width: '450px !important' }" header="Confirm" :modal="true">
                    <div class="flex align-items-center justify-content-center">
                        <i class="pi pi-exclamation-triangle mr-3" style="font-size: 2rem" />
                        <span v-if="entry">Are you sure you want to delete the selected entries?</span>
                    </div>
                    <template #footer>
                        <Button label="No" icon="pi pi-times" class="p-button-text" @click="deleteEntriesDialog = false" />
                        <Button label="Yes" icon="pi pi-check" class="p-button-text" @click="deleteSelectedEntries" />
                    </template>
                </Dialog>
            </div>
        </div>
    </div>
</template>

<style scoped lang="scss">
@import '@/assets/demo/styles/badges.scss';
</style>
