<script setup>
import { FilterMatchMode } from 'primevue/api';
import { ref, onMounted, onBeforeMount } from 'vue';
import { useToast } from 'primevue/usetoast';
import LorebookService from '@/service/LorebookService';

const lorebookService = new LorebookService();

const toast = useToast();
const lorebooks = ref(null);
const lorebookDialog = ref(false);
const deleteLorebookDialog = ref(false);
const deleteLorebooksDialog = ref(false);
const lorebook = ref({});
const selectedLorebooks = ref(null);
const dt = ref(null);
const filters = ref({});
const submitted = ref(false);
const statuses = ref([
    { label: 'PRIVATE', value: 'private' },
    { label: 'PUBLIC', value: 'public' }
]);

onBeforeMount(() => {
    initFilters();
});

onMounted(() => {
    lorebookService.getAllLorebooks().then((data) => (lorebooks.value = data));
});

const openNew = () => {
    lorebook.value = {};
    submitted.value = false;
    lorebookDialog.value = true;
};

const hideDialog = () => {
    lorebookDialog.value = false;
    submitted.value = false;
};

const saveLorebook = async () => {
    submitted.value = true;
    if (lorebook.value.id) {
        try {
            lorebook.value.visibility = lorebook.value.visibility.value ? lorebook.value.visibility.value : lorebook.value.visibility;
            await lorebookService.updateLorebook(lorebook.value);
            lorebooks.value[findIndexById(lorebook.value.id)] = lorebook.value;
            toast.add({ severity: 'success', summary: 'Success!', detail: 'Lorebook updated', life: 3000 });
        } catch {
            toast.add({ severity: 'error', summary: 'Error', detail: 'Error updating lorebook', life: 3000 });
        }
    } else {
        try {
            lorebook.value.visibility = lorebook.value.visibility ? lorebook.value.visibility.value : 'PRIVATE';
            const createdLorebook = await lorebookService.createLorebook(lorebook.value);
            lorebooks.value.push(createdLorebook);
            toast.add({ severity: 'success', summary: 'Success!', detail: 'Lorebook created', life: 3000 });
        } catch {
            toast.add({ severity: 'error', summary: 'Error', detail: 'Error saving lorebook', life: 3000 });
        }
    }
    lorebookDialog.value = false;
    lorebook.value = {};
};

const editLorebook = (editLorebook) => {
    lorebook.value = { ...editLorebook };
    console.log(lorebook);
    lorebookDialog.value = true;
};

const confirmDeleteLorebook = (editLorebook) => {
    lorebook.value = editLorebook;
    deleteLorebookDialog.value = true;
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

const findIndexById = (id) => {
    let index = -1;
    for (let i = 0; i < lorebooks.value.length; i++) {
        if (lorebooks.value[i].id === id) {
            index = i;
            break;
        }
    }
    return index;
};

const exportCSV = () => {
    dt.value.exportCSV();
};

const confirmDeleteSelected = () => {
    deleteLorebooksDialog.value = true;
};
const deleteSelectedLorebooks = () => {
    lorebooks.value = lorebooks.value.filter((val) => !selectedLorebooks.value.includes(val));
    deleteLorebooksDialog.value = false;
    selectedLorebooks.value = null;
    toast.add({ severity: 'success', summary: 'Successful', detail: 'Lorebooks Deleted', life: 3000 });
};

const initFilters = () => {
    filters.value = {
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
                            <Button label="New" icon="pi pi-plus" class="p-button-success mr-2" @click="openNew" />
                            <Button label="Delete" icon="pi pi-trash" class="p-button-danger" @click="confirmDeleteSelected" :disabled="!selectedLorebooks || !selectedLorebooks.length" />
                        </div>
                    </template>

                    <template v-slot:end>
                        <FileUpload mode="basic" accept="image/*" :maxFileSize="1000000" label="Import" chooseLabel="Import" class="mr-2 inline-block" />
                        <Button label="Export" icon="pi pi-upload" class="p-button-help" @click="exportCSV($event)" />
                    </template>
                </Toolbar>

                <DataTable
                    ref="dt"
                    :value="lorebooks"
                    v-model:selection="selectedLorebooks"
                    dataKey="id"
                    :paginator="true"
                    :rows="10"
                    :filters="filters"
                    paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                    :rowsPerPageOptions="[5, 10, 25]"
                    currentPageReportTemplate="Showing {first} to {last} of {totalRecords} lorebooks"
                    responsiveLayout="scroll"
                >
                    <template #header>
                        <div class="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
                            <h5 class="m-0">Lorebooks</h5>
                            <span class="block mt-2 md:mt-0 p-input-icon-left">
                                <i class="pi pi-search" />
                                <InputText v-model="filters['global'].value" placeholder="Search..." />
                            </span>
                        </div>
                    </template>

                    <Column selectionMode="multiple" headerStyle="width: 3rem"></Column>
                    <Column field="id" header="ID" :sortable="true" headerStyle="width:14%; min-width:10rem;">
                        <template #body="slotProps">
                            <span class="p-column-title">ID</span>
                            {{ slotProps.data.id }}
                        </template>
                    </Column>
                    <Column field="name" header="Name" :sortable="true" headerStyle="width:14%; min-width:10rem;">
                        <template #body="slotProps">
                            <span class="p-column-title">Name</span>
                            {{ slotProps.data.name }}
                        </template>
                    </Column>
                    <Column field="description" header="Description" :sortable="true" headerStyle="width:14%; min-width:8rem;">
                        <template #body="slotProps">
                            <span class="p-column-title">Description</span>
                            {{ slotProps.data.description }}
                        </template>
                    </Column>
                    <Column field="owner" header="Owner" :sortable="true" headerStyle="width:14%; min-width:10rem;">
                        <template #body="slotProps">
                            <span class="p-column-title">Owner</span>
                            {{ slotProps.data.owner }}
                        </template>
                    </Column>
                    <Column field="visibility" header="Visibility" :sortable="true" headerStyle="width:14%; min-width:10rem;">
                        <template #body="slotProps">
                            <span class="p-column-title">Visibility</span>
                            <span :class="'visibility-badge visibility-' + (slotProps.data.visibility ? slotProps.data.visibility.toLowerCase() : '')">{{ slotProps.data.visibility }}</span>
                        </template>
                    </Column>
                    <Column headerStyle="min-width:10rem;">
                        <template #body="slotProps">
                            <Button icon="pi pi-pencil" class="p-button-rounded p-button-success mr-2" @click="editLorebook(slotProps.data)" />
                            <Button icon="pi pi-trash" class="p-button-rounded p-button-warning mt-2" @click="confirmDeleteLorebook(slotProps.data)" />
                        </template>
                    </Column>
                </DataTable>

                <Dialog v-model:visible="lorebookDialog" :style="{ width: '450px' }" header="Editing lorebook" :modal="true" class="p-fluid">
                    <div class="field">
                        <label for="name">Name</label>
                        <InputText id="name" v-model.trim="lorebook.name" required="true" autofocus :class="{ 'p-invalid': submitted && !lorebook.name }" />
                        <small class="p-invalid" v-if="submitted && !lorebook.name">Name is required.</small>
                    </div>
                    <div class="field">
                        <label for="description">Description</label>
                        <Textarea id="description" v-model.trim="lorebook.description" required="true" rows="3" cols="20" :class="{ 'p-invalid': submitted && !lorebook.description }" />
                        <small class="p-invalid" v-if="submitted && !lorebook.description">Description is required.</small>
                    </div>
                    <div class="field">
                        <label for="visibility" class="mb-3">Visibility</label>
                        <Dropdown id="visibility" v-model="lorebook.visibility" :options="statuses" optionLabel="label" placeholder="Lorebook visibility" :class="{ 'p-invalid': submitted && !lorebook.visibility }">
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
                        <small class="p-invalid" v-if="submitted && !lorebook.description">Visibility is required.</small>
                    </div>
                    <template #footer>
                        <Button label="Cancel" icon="pi pi-times" class="p-button-text" @click="hideDialog" />
                        <Button label="Save" icon="pi pi-check" class="p-button-text" @click="saveLorebook" />
                    </template>
                </Dialog>

                <Dialog v-model:visible="deleteLorebookDialog" :style="{ width: '450px' }" header="Confirm" :modal="true">
                    <div class="flex align-items-center justify-content-center">
                        <i class="pi pi-exclamation-triangle mr-3" style="font-size: 2rem" />
                        <span v-if="lorebook">
                            Are you sure you want to delete <b>{{ lorebook.name }}</b>?
                        </span>
                    </div>
                    <template #footer>
                        <Button label="No" icon="pi pi-times" class="p-button-text" @click="deleteLorebookDialog = false" />
                        <Button label="Yes" icon="pi pi-check" class="p-button-text" @click="deleteLorebook" />
                    </template>
                </Dialog>

                <Dialog v-model:visible="deleteLorebooksDialog" :style="{ width: '450px' }" header="Confirm" :modal="true">
                    <div class="flex align-items-center justify-content-center">
                        <i class="pi pi-exclamation-triangle mr-3" style="font-size: 2rem" />
                        <span v-if="lorebook">Are you sure you want to delete the selected lorebooks?</span>
                    </div>
                    <template #footer>
                        <Button label="No" icon="pi pi-times" class="p-button-text" @click="deleteLorebooksDialog = false" />
                        <Button label="Yes" icon="pi pi-check" class="p-button-text" @click="deleteSelectedLorebooks" />
                    </template>
                </Dialog>
            </div>
        </div>
    </div>
</template>

<style scoped lang="scss">
@import '@/assets/demo/styles/badges.scss';
</style>
