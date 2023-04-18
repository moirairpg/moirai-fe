<script setup>
import { FilterMatchMode } from 'primevue/api';
import { ref, onMounted, onBeforeMount } from 'vue';
import { useToast } from 'primevue/usetoast';
import PersonaService from '@/service/PersonaService';

const personaService = new PersonaService();

const toast = useToast();
const persona = ref({});
const personas = ref(null);
const selectedPersonas = ref(null);
const personaDialog = ref(false);
const deletePersonaDialog = ref(false);
const deletePersonasDialog = ref(false);
const dt = ref(null);
const filters = ref({});
const personaSubmitted = ref(false);
const intents = ref([
    { label: 'CHAT', value: 'chat' },
    { label: 'RPG', value: 'rpg' }
]);
const roles = ref([
    { label: 'SYSTEM', value: 'system' },
    { label: 'ASSISTANT', value: 'assistant' },
    { label: 'USER', value: 'user' }
]);

onBeforeMount(() => {
    initFilters();
});

onMounted(() => {
    personaService.getAllPersonas().then((data) => {
        personas.value = data;
    });
});

const createNewPersona = () => {
    persona.value = {};
    personaSubmitted.value = false;
    personaDialog.value = true;
};

const hidePersonaDialog = () => {
    personaDialog.value = false;
    personaSubmitted.value = false;
};

const savePersona = async () => {
    personaSubmitted.value = true;
    if (persona.value.name.trim() && persona.value.personality.trim() && persona.value.intent) {
        if (persona.value.id) {
            try {
                persona.value.intent = persona.value.intent.value ? persona.value.intent.value : persona.value.intent;
                await personaService.updatePersona(persona.value);
                personas.value[findPersonaIndexById(persona.value.id)] = persona.value;
                toast.add({ severity: 'success', summary: 'Success!', detail: 'Persona updated', life: 3000 });
            } catch {
                toast.add({ severity: 'error', summary: 'Error', detail: 'Error updating persona', life: 3000 });
            }
        } else {
            try {
                persona.value.intent = persona.value.intent ? persona.value.intent.value : 'PRIVATE';
                const createdPersona = await personaService.createPersona(persona.value);
                personas.value.push(createdPersona);
                toast.add({ severity: 'success', summary: 'Success!', detail: 'Persona created', life: 3000 });
            } catch {
                toast.add({ severity: 'error', summary: 'Error', detail: 'Error saving persona', life: 3000 });
            }
        }
        personaDialog.value = false;
        persona.value = {};
    }
};

const editPersona = (editPersona) => {
    persona.value = { ...editPersona };
    personaDialog.value = true;
};

const confirmDeletePersona = (editPersona) => {
    persona.value = editPersona;
    deletePersonaDialog.value = true;
};

const deletePersona = async () => {
    try {
        await personaService.deletePersona(persona.value);
        personas.value = personas.value.filter((val) => val.id !== persona.value.id);
        deletePersonaDialog.value = false;
        persona.value = {};
        toast.add({ severity: 'success', summary: 'Success!', detail: 'Persona deleted', life: 3000 });
    } catch {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Error deleting persona', life: 3000 });
    }
};

const findPersonaIndexById = (id) => {
    let index = -1;
    for (let i = 0; i < personas.value.length; i++) {
        if (personas.value[i].id === id) {
            index = i;
            break;
        }
    }
    return index;
};

const exportCSV = () => {
    dt.value.exportCSV();
};

const confirmDeleteSelectedPersonas = () => {
    deletePersonasDialog.value = true;
};

const deleteSelectedPersonas = () => {
    personas.value = personas.value
        .map((val) => {
            if (!selectedPersonas.value.includes(val)) {
                return val;
            }

            return personaService.deletePersona(val);
        })
        .filter((val) => Object.keys(val).length !== 0);

    deletePersonasDialog.value = false;
    selectedPersonas.value = null;
    toast.add({ severity: 'success', summary: 'Success!', detail: 'Personas selected deleted', life: 3000 });
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
                            <Button label="New" icon="pi pi-plus" class="p-button-success mr-2" @click="createNewPersona" />
                            <Button label="Delete" icon="pi pi-trash" class="p-button-danger" @click="confirmDeleteSelectedPersonas" :disabled="!selectedPersonas || !selectedPersonas.length" />
                        </div>
                    </template>
                    <template v-slot:end>
                        <FileUpload mode="basic" accept="image/*" :maxFileSize="1000000" label="Import" chooseLabel="Import" class="mr-2 inline-block" />
                        <Button label="Export" icon="pi pi-upload" class="p-button-help" @click="exportCSV($event)" />
                    </template>
                </Toolbar>

                <DataTable
                    ref="dt"
                    :value="personas"
                    v-model:selection="selectedPersonas"
                    dataKey="id"
                    :paginator="true"
                    :rows="10"
                    :filters="filters"
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
                            {{ slotProps.data.owner }}
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
                            <Button icon="pi pi-pencil" class="p-button-rounded p-button-success mr-2" @click="editPersona(slotProps.data)" />
                            <Button icon="pi pi-trash" class="p-button-rounded p-button-warning mt-2" @click="confirmDeletePersona(slotProps.data)" />
                        </template>
                    </Column>
                </DataTable>

                <Dialog v-model:visible="personaDialog" :style="{ width: '50%' }" header="Editing persona" :modal="true" class="p-fluid">
                    <div class="field">
                        <label for="name">Name</label>
                        <InputText id="name" v-model.trim="persona.name" required="true" autofocus :class="{ 'p-invalid': personaSubmitted && !persona.name }" />
                        <small class="p-invalid" v-if="personaSubmitted && !persona.name">Name is required.</small>
                    </div>
                    <div class="field">
                        <label for="intent" class="mb-3">Intent</label>
                        <Dropdown id="intent" v-model="persona.intent" :options="intents" optionLabel="label" placeholder="Persona intent" :class="{ 'p-invalid': personaSubmitted && !persona.intent }">
                            <template #value="slotProps">
                                <div v-if="slotProps.value && slotProps.value.value">
                                    <span :class="'intent-badge intent-' + slotProps.value.value">{{ slotProps.value.label }}</span>
                                </div>
                                <div v-else-if="slotProps.value && !slotProps.value.value">
                                    <span :class="'intent-badge intent-' + slotProps.value.toLowerCase()">{{ slotProps.value }}</span>
                                </div>
                                <span v-else>
                                    {{ slotProps.placeholder }}
                                </span>
                            </template>
                        </Dropdown>
                        <small class="p-invalid" v-if="personaSubmitted && !persona.intent">Intent is required.</small>
                    </div>

                    <div class="field">
                        <label for="nudge" class="mb-3">Nudge</label>
                        <div class="grid formgrid">
                            <div class="col-12 mb-2 lg:col-6 lg:mb-0">
                                <Dropdown id="nudge-role" v-model="persona.nudge.role" optionValue="value" :options="roles" optionLabel="label" placeholder="Nudge role" :class="{ 'p-invalid': personaSubmitted && !persona.nudge?.role }" />
                            </div>
                            <div class="col-12 mb-2 lg:col-6 lg:mb-0">
                                <Textarea rows="1" v-model.trim="persona.nudge.content" id="nudge-text" type="text" placeholder="Nudge text" />
                            </div>
                        </div>
                    </div>

                    <div class="field">
                        <label for="bump" class="mb-3">Bump</label>
                        <div class="grid formgrid">
                            <div class="col-12 mb-2 lg:col-6 lg:mb-0">
                                <Dropdown id="bump-role" v-model="persona.bump.role" optionValue="value" :options="roles" optionLabel="label" placeholder="Bump role" :class="{ 'p-invalid': personaSubmitted && !persona.bump.role }" />
                            </div>
                            <div class="col-12 mb-2 lg:col-6 lg:mb-0">
                                <InputNumber showButtons mode="decimal" v-model.trim="persona.bump.frequency" id="bump-freq" type="text" placeholder="Bump frequency" />
                            </div>
                        </div>
                    </div>
                    <div class="field">
                        <div class="grid formgrid">
                            <div class="col-12 mb-2 lg:col-12 lg:mb-0">
                                <Textarea rows="1" v-model.trim="persona.bump.content" id="bump-text" type="text" placeholder="Bump text" />
                            </div>
                        </div>
                    </div>

                    <div class="field">
                        <label for="personality">Personality</label>
                        <Textarea id="personality" v-model.trim="persona.personality" required="true" rows="10" cols="20" :class="{ 'p-invalid': personaSubmitted && !persona.personality }" />
                        <small class="p-invalid" v-if="personaSubmitted && !persona.personality">Personality is required.</small>
                    </div>
                    <template #footer>
                        <Button label="Cancel" icon="pi pi-times" class="p-button-text" @click="hidePersonaDialog" />
                        <Button label="Save" icon="pi pi-check" class="p-button-text" @click="savePersona" />
                    </template>
                </Dialog>

                <Dialog v-model:visible="deletePersonaDialog" :style="{ width: '450px' }" header="Confirm" :modal="true">
                    <div class="flex align-items-center justify-content-center">
                        <i class="pi pi-exclamation-triangle mr-3" style="font-size: 2rem" />
                        <span v-if="persona">
                            Are you sure you want to delete <b>{{ persona.name }}</b
                            >?
                        </span>
                    </div>
                    <template #footer>
                        <Button label="No" icon="pi pi-times" class="p-button-text" @click="deletePersonaDialog = false" />
                        <Button label="Yes" icon="pi pi-check" class="p-button-text" @click="deletePersona" />
                    </template>
                </Dialog>

                <Dialog v-model:visible="deletePersonasDialog" :style="{ width: '450px' }" header="Confirm" :modal="true">
                    <div class="flex align-items-center justify-content-center">
                        <i class="pi pi-exclamation-triangle mr-3" style="font-size: 2rem" />
                        <span v-if="persona">Are you sure you want to delete the selected personas?</span>
                    </div>
                    <template #footer>
                        <Button label="No" icon="pi pi-times" class="p-button-text" @click="deletePersonasDialog = false" />
                        <Button label="Yes" icon="pi pi-check" class="p-button-text" @click="deleteSelectedPersonas" />
                    </template>
                </Dialog>
            </div>
        </div>
    </div>
</template>

<style scoped lang="scss">
@import '@/assets/demo/styles/badges.scss';
</style>
