<script setup lang="ts">
import { FilterMatchMode } from 'primevue/api';
import { Ref, ref, onMounted, onBeforeMount } from 'vue';
import { useToast } from 'primevue/usetoast';
import { LocalDateTime, DateTimeFormatter } from '@js-joda/core';
import { ToastServiceMethods } from 'primevue/toastservice';

import PersonaDialog from '@/components/persona/PersonaDialog.vue';
import PersonaImportDialog from '@/components/persona/PersonaImportDialog.vue';
import PersonaDeleteDialog from '@/components/persona/PersonaDeleteDialog.vue';
import PersonaDeleteBulkDialog from '@/components/persona/PersonaDeleteBulkDialog.vue';

import Persona from '@/types/persona/Persona';

import store from '@/resources/store';
import personaService from '@/service/PersonaService';
import discordService from '@/service/DiscordService';

const loggedUser: any = store.getters.loggedUser;

const dataViewRef: Ref<any> = ref(null);
const toast: ToastServiceMethods = useToast();

const persona: Ref<Persona> = ref({ owner: loggedUser.id, ownerData: loggedUser, nudge: { role: '' }, bump: { role: '' } });
const personas: Ref<Persona[]> = ref([]);
const selectedPersonas: Ref<Persona[]> = ref([]);
const isPersonaDialogVisible: Ref<Boolean> = ref(false);
const isDeleteDialogVisible: Ref<Boolean> = ref(false);
const isBulkDeleteDialogVisible: Ref<Boolean> = ref(false);
const isImportDialogVisible: Ref<Boolean> = ref(false);
const isPersonaSubmitted: Ref<Boolean> = ref(false);
const searchFilters: Ref<any> = ref({});

onBeforeMount((): void => {
    initFilters();
});

onMounted(async (): Promise<void> => {
    await personaService.getAllPersonas(loggedUser.id).then(async (data: Persona[]) => {
        const ps: Persona[] = [];
        if (data?.[0] !== undefined) {
            for (let p of data) {
                let canEdit: boolean = false;
                const ownerData = await discordService.retrieveUserData(p.owner as string);
                if (p.owner === loggedUser.id || p.writePermissions?.includes(loggedUser.id)) {
                    canEdit = true;
                }

                p.ownerData = ownerData;
                p.canEdit = canEdit;
                ps.push(p);
            }
        }

        personas.value = ps;
    });
});

const importPersona = (): void => {
    isPersonaSubmitted.value = false;
    isImportDialogVisible.value = true;
};

const createNewPersona = (): void => {
    persona.value = { owner: loggedUser.id, ownerData: loggedUser, nudge: { role: '' }, bump: { role: '' } };

    isPersonaSubmitted.value = false;
    isPersonaDialogVisible.value = true;
};

const hidePersonaDialog = (): void => {
    isPersonaDialogVisible.value = false;
    isPersonaSubmitted.value = false;
};

const savePersona = async (savedPersona: Persona): Promise<void> => {
    isPersonaSubmitted.value = true;
    if (savedPersona.name?.trim() && savedPersona.personality?.trim() && savedPersona.intent && savedPersona.visibility) {
        if (savedPersona.id) {
            try {
                await personaService.updatePersona(savedPersona, loggedUser.id);
                personas.value[findPersonaIndexById(savedPersona.id)] = savedPersona;
                toast.add({ severity: 'success', summary: 'Success!', detail: 'Persona updated', life: 3000 });
            } catch (error) {
                console.error(`An error ocurred while updating the persona -> ${error}`);
                toast.add({ severity: 'error', summary: 'Error', detail: 'Error updating persona', life: 3000 });
            }
        } else {
            try {
                const createdPersona: Persona = await personaService.createPersona(savedPersona, loggedUser.id);
                createdPersona.canEdit = true;
                createdPersona.ownerData = loggedUser;
                personas.value.push(createdPersona);
                toast.add({ severity: 'success', summary: 'Success!', detail: 'Persona created', life: 3000 });
            } catch (error) {
                console.error(`An error ocurred while saving the persona -> ${error}`);
                toast.add({ severity: 'error', summary: 'Error', detail: 'Error saving persona', life: 3000 });
            }
        }
        isPersonaDialogVisible.value = false;
        persona.value = { owner: loggedUser.id, ownerData: loggedUser, nudge: { role: '' }, bump: { role: '' } };
    }
};

const viewPersona = (editPersona: Persona): void => {
    persona.value = { ...editPersona };
    isPersonaDialogVisible.value = true;
};

const confirmDeletePersona = (editPersona: Persona) => {
    persona.value = editPersona;
    isDeleteDialogVisible.value = true;
};

const deletePersona = async (): Promise<void> => {
    try {
        await personaService.deletePersona(persona.value, loggedUser.id);
        personas.value = personas.value.filter((val) => val.id !== persona.value.id);
        isDeleteDialogVisible.value = false;
        persona.value = {};
        toast.add({ severity: 'success', summary: 'Success!', detail: 'Persona deleted', life: 3000 });
    } catch (error) {
        console.error(`An error ocurred while deleting the persona -> ${error}`);
        toast.add({ severity: 'error', summary: 'Error', detail: 'Error deleting persona', life: 3000 });
    }
};

const findPersonaIndexById = (id: string): number => {
    let index = -1;
    for (let i = 0; i < personas.value.length; i++) {
        if (personas.value[i].id === id) {
            index = i;
            break;
        }
    }
    return index;
};

const confirmDeleteSelectedPersonas = (): void => {
    isBulkDeleteDialogVisible.value = true;
};

const deleteSelectedPersonas = (): void => {
    personas.value = personas.value
        .map((val: Persona): any => {
            if (!selectedPersonas.value.includes(val)) {
                return val;
            }

            return personaService.deletePersona(val, loggedUser.id);
        })
        .filter((val) => Object.keys(val).length !== 0) as Persona[];

    isBulkDeleteDialogVisible.value = false;
    selectedPersonas.value = [];
    toast.add({ severity: 'success', summary: 'Success!', detail: 'Personas selected deleted', life: 3000 });
};

const initFilters = (): void => {
    searchFilters.value = {
        global: { value: null, matchMode: FilterMatchMode.CONTAINS }
    };
};

const downloadPersona = (): void => {
    const personaToDownload: Persona = Object.assign({}, persona.value);
    delete personaToDownload.ownerData;
    delete personaToDownload.canEdit;

    const fileName: string = `persona-${personaToDownload.id}-${LocalDateTime.now().format(DateTimeFormatter.ofPattern('yyyMMddHHmmss'))}-${personaToDownload.name}.json`;
    const url: string = window.URL.createObjectURL(new Blob([JSON.stringify(personaToDownload, null, 2)]));
    const link: HTMLAnchorElement = document.createElement('a');

    link.href = url;
    link.setAttribute('download', `${fileName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`);
    document.body.appendChild(link);
    link.click();

    toast.add({ severity: 'success', summary: 'Success!', detail: 'Persona downloaded', life: 3000 });
};

const clonePersona = async (): Promise<void> => {
    try {
        const personaToClone: Persona = Object.assign({}, persona.value);
        delete personaToClone.id;
        delete personaToClone.owner;
        delete personaToClone.ownerData;
        delete personaToClone.canEdit;

        personaToClone.owner = loggedUser.id;
        personaToClone.name = `${personaToClone.name} - Copy`;
        const createdPersona: Persona = await personaService.createPersona(personaToClone, loggedUser.id);

        createdPersona.canEdit = true;
        createdPersona.ownerData = loggedUser;

        persona.value = createdPersona;
        personas.value.push(createdPersona);
        toast.add({ severity: 'success', summary: 'Success!', detail: 'Persona cloned', life: 3000 });
    } catch (error) {
        console.error(`An error ocurred while cloning the persona -> ${error}`);
        toast.add({ severity: 'error', summary: 'Error', detail: 'Error cloning persona', life: 3000 });
    }
};

const uploadPersona = async (event: any) => {
    const personaToImport: Persona = event.persona;
    personaToImport.owner = loggedUser.id;

    const createdPersona: Persona = await personaService.createPersona(personaToImport, loggedUser.id);
    createdPersona.canEdit = true;
    createdPersona.ownerData = loggedUser;
    personas.value.push(createdPersona);
    toast.add({ severity: 'success', summary: 'Success!', detail: `Persona imported (${event.file.name})`, life: 3000 });

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
                                    <Button label="New" icon="pi pi-plus" class="p-button-success mr-2" @click="createNewPersona" />
                                    <Button label="Import" icon="pi pi-upload" class="p-button-help mr-2" @click="importPersona" />
                                </div>
                            </template>
                        </Toolbar>

                        <DataView
                            layout="grid"
                            ref="dataViewRef"
                            :value="personas"
                            dataKey="id"
                            :paginator="true"
                            :rows="6"
                            paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                            :rowsPerPageOptions="[6, 12, 18]"
                            currentPageReportTemplate="Showing {first} to {last} of {totalRecords} personas"
                            responsiveLayout="scroll"
                            maxLength
                        >
                            <template #header>
                                <div class="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
                                    <h5 class="m-0">Personas</h5>
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
                                            <Tag :value="slotProps.data.intent" :class="'intent-badge intent-' + (slotProps.data.intent ? slotProps.data.intent.toLowerCase() : '')"></Tag>
                                        </div>
                                        <div class="flex flex-column align-items-center gap-3 py-5">
                                            <div class="text-2xl font-bold card-overflow-title">{{ slotProps.data.name }}</div>
                                        </div>
                                        <p align="center" class="card-overflow">
                                            {{ slotProps.data.personality }}
                                        </p>
                                        <div class="flex align-items-center justify-content-between">
                                            <Button :icon="'pi pi-' + (slotProps.data.canEdit ? 'pencil' : 'eye')" class="p-button-rounded p-button-success mt-2" @click="viewPersona(slotProps.data)" />
                                            <Button v-if="slotProps.data.canEdit" icon="pi pi-trash" class="p-button-rounded p-button-danger mt-2" @click="confirmDeletePersona(slotProps.data)" />
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
                                    <Button label="New" icon="pi pi-plus" class="p-button-success mr-2" @click="createNewPersona" />
                                    <Button label="Import" icon="pi pi-upload" class="p-button-help mr-2" @click="importPersona" />
                                    <Button label="Delete" icon="pi pi-trash" class="p-button-danger" @click="confirmDeleteSelectedPersonas" :disabled="!selectedPersonas || !selectedPersonas.length" />
                                </div>
                            </template>
                        </Toolbar>

                        <DataTable
                            ref="dataViewRef"
                            :value="personas"
                            v-model:selection="selectedPersonas"
                            dataKey="id"
                            :paginator="true"
                            :rows="10"
                            :filters="searchFilters"
                            paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                            :rowsPerPageOptions="[5, 10, 25]"
                            currentPageReportTemplate="Showing {first} to {last} of {totalRecords} personas"
                            responsiveLayout="scroll"
                            maxLength
                        >
                            <template #header>
                                <div class="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
                                    <h5 class="m-0">Personas</h5>
                                    <span class="block mt-2 md:mt-0 p-input-icon-left">
                                        <i class="pi pi-search" />
                                        <InputText v-model="searchFilters['global'].value" placeholder="Search..." />
                                    </span>
                                </div>
                            </template>

                            <template #empty>No personas found.</template>

                            <Column selectionMode="multiple" headerStyle="width: 3rem"></Column>
                            <Column field="name" header="Name" :sortable="true" headerStyle="width:14%; min-width:10rem;">
                                <template #body="slotProps">
                                    <span class="p-column-title">Name</span>
                                    <div class="table-column-overflow">{{ slotProps.data.name }}</div>
                                </template>
                            </Column>
                            <Column field="personality" header="Personality" :sortable="true" headerStyle="width:14%; min-width:8rem;">
                                <template #body="slotProps">
                                    <span class="p-column-title">Personality</span>
                                    <div class="table-column-overflow">{{ slotProps.data.personality }}</div>
                                </template>
                            </Column>
                            <Column field="owner" header="Owner" :sortable="true" headerStyle="width:14%; min-width:10rem;">
                                <template #body="slotProps">
                                    <span class="p-column-title">Owner</span>
                                    {{ slotProps.data.ownerData.username }}
                                </template>
                            </Column>
                            <Column field="intent" header="Intent" :sortable="true" headerStyle="width:14%; min-width:10rem;">
                                <template #body="slotProps">
                                    <span class="p-column-title">Intent</span>
                                    <span :class="'intent-badge intent-' + (slotProps.data.intent ? slotProps.data.intent.toLowerCase() : '')">{{ slotProps.data.intent }}</span>
                                </template>
                            </Column>
                            <Column headerStyle="min-width:10rem;">
                                <template #body="slotProps">
                                    <Button :icon="'pi pi-' + (slotProps.data.canEdit ? 'pencil' : 'eye')" class="p-button-rounded p-button-success mt-2" @click="viewPersona(slotProps.data)" />
                                    <Button v-if="slotProps.data.canEdit" icon="pi pi-trash" class="p-button-rounded p-button-danger mt-2" @click="confirmDeletePersona(slotProps.data)" />
                                </template>
                            </Column>
                        </DataTable>
                    </TabPanel>
                </TabView>

                <PersonaDialog :persona="persona" :isOwner="persona.owner === loggedUser.id" v-model:visible="isPersonaDialogVisible" @onClose="hidePersonaDialog" @onSave="savePersona" @onDownload="downloadPersona" @onClone="clonePersona" />
                <PersonaImportDialog v-model:visible="isImportDialogVisible" @onImport="uploadPersona" />
                <PersonaDeleteBulkDialog v-model:visible="isBulkDeleteDialogVisible" @onConfirm="deleteSelectedPersonas" @onCancel="isBulkDeleteDialogVisible = false" />
                <PersonaDeleteDialog v-model:visible="isDeleteDialogVisible" :persona="persona" @onConfirm="deletePersona" @onCancel="isDeleteDialogVisible = false" />
            </div>
        </div>
    </div>
</template>

<style scoped lang="scss">
@import '@/assets/demo/styles/badges.scss';
</style>
