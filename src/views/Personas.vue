<script setup lang="ts">
import { FilterMatchMode } from 'primevue/api';
import { Ref, ref, onBeforeMount } from 'vue';
import { useToast } from 'primevue/usetoast';
import { LocalDateTime, DateTimeFormatter } from '@js-joda/core';
import { ToastServiceMethods } from 'primevue/toastservice';

import PersonaDialog from '@/components/persona/PersonaDialog.vue';
import PersonaImportDialog from '@/components/persona/PersonaImportDialog.vue';
import PersonaDeleteDialog from '@/components/persona/PersonaDeleteDialog.vue';
import PersonaDeleteBulkDialog from '@/components/persona/PersonaDeleteBulkDialog.vue';
import PersonaDataTable from '@/components/persona/PersonaDataTable.vue';
import PersonaDataView from '@/components/persona/PersonaDataView.vue';

import Persona from '@/types/persona/Persona';

import store from '@/resources/store';
import personaService from '@/service/PersonaService';
import discordService from '@/service/DiscordService';

const loggedUser: any = store.getters.loggedUser;

const toast: ToastServiceMethods = useToast();

const persona: Ref<Persona> = ref({ canEdit: true, owner: loggedUser.id, ownerData: loggedUser, nudge: { role: '' }, bump: { role: '' } });
const personas: Ref<Persona[]> = ref([]);
const selectedPersonas: Ref<Persona[]> = ref([]);
const isPersonaDialogVisible: Ref<boolean> = ref(false);
const isDeleteDialogVisible: Ref<boolean> = ref(false);
const isBulkDeleteDialogVisible: Ref<boolean> = ref(false);
const isImportDialogVisible: Ref<boolean> = ref(false);
const isPersonaSubmitted: Ref<boolean> = ref(false);
const searchFilters: Ref<any> = ref({});

onBeforeMount(async (): Promise<void> => {
    initFilters();
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
    persona.value = { isMultiplayer: false, canEdit: true, owner: loggedUser.id, ownerData: loggedUser, nudge: { role: '' }, bump: { role: '' } };

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
        persona.value = { canEdit: true, owner: loggedUser.id, ownerData: loggedUser, nudge: { role: '' }, bump: { role: '' } };
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

const confirmDeleteSelectedPersonas = (deletedPersonas: Persona[]): void => {
    selectedPersonas.value = deletedPersonas;
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
                        <PersonaDataView :personas="personas" @onOpen="viewPersona" @onDelete="confirmDeletePersona" @onCreate="createNewPersona" @onImport="importPersona" />
                    </TabPanel>
                    <TabPanel header="Table view">
                        <PersonaDataTable :personas="personas" @onOpen="viewPersona" @onDelete="confirmDeletePersona" @onCreate="createNewPersona" @onImport="importPersona" @onDeleteBulk="confirmDeleteSelectedPersonas" />
                    </TabPanel>
                </TabView>

                <PersonaDialog :persona="persona" :canEdit="persona.canEdit" v-model:visible="isPersonaDialogVisible" @onClose="hidePersonaDialog" @onSave="savePersona" @onDownload="downloadPersona" @onClone="clonePersona" />
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
