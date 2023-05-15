<script setup>
import { FilterMatchMode } from 'primevue/api';
import { ref, onMounted, onBeforeMount } from 'vue';
import { useToast } from 'primevue/usetoast';
import PersonaService from '@/service/PersonaService';
import DiscordService from '@/service/DiscordService';
import store from '../resources/store';
import { decodeTokens } from '../resources/tokenizer';

const personaService = new PersonaService();
const discordService = new DiscordService();
const loggedUser = store.getters.loggedUser;

const toast = useToast();
const persona = ref({ nudge: { role: null }, bump: { role: null } });
const personas = ref(null);
const selectedPersonas = ref(null);
const personaDialog = ref(false);
const viewPersonaDialog = ref(false);
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
const visibilities = ref([
    { label: 'PRIVATE', value: 'private' },
    { label: 'PUBLIC', value: 'public' }
]);

const personaNameTokens = ref(null);
const personalityTokens = ref(null);
const personaNudgeTokens = ref(null);
const personaBumpTokens = ref(null);
const processPersonaNameTokens = (event) => {
    personaNameTokens.value = decodeTokens(event.target.value);
};

const processPersonalityTokens = (event) => {
    personalityTokens.value = decodeTokens(event.target.value);
};

const processPersonaNudgeTokens = (event) => {
    personaNudgeTokens.value = decodeTokens(event.target.value);
};

const processPersonaBumpTokens = (event) => {
    personaBumpTokens.value = decodeTokens(event.target.value);
};

onBeforeMount(() => {
    initFilters();
});

onMounted(async () => {
    personaService.getAllPersonas(loggedUser.id).then(async (data) => {
        const ps = [];
        if (data?.[0] !== undefined) {
            for (let p of data) {
                let canEdit = false;
                const ownerData = await discordService.retrieveUserData(p.owner);
                if (p.owner === loggedUser.id || p.writePermissions?.contains(loggedUser.id)) {
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

const createNewPersona = () => {
    persona.value = { nudge: { role: null }, bump: { role: null } };
    personaSubmitted.value = false;
    personaDialog.value = true;
};

const hidePersonaDialog = () => {
    personaDialog.value = false;
    personaSubmitted.value = false;
};

const hideViewPersonaDialog = () => {
    viewPersonaDialog.value = false;
};

const savePersona = async () => {
    personaSubmitted.value = true;
    if (persona.value.name.trim() && persona.value.personality.trim() && persona.value.intent && persona.value.visibility) {
        if (persona.value.id) {
            try {
                persona.value.visibility = persona.value.visibility.value ? persona.value.visibility.value : persona.value.visibility;
                persona.value.intent = persona.value.intent.value ? persona.value.intent.value : persona.value.intent;
                await personaService.updatePersona(persona.value, loggedUser.id);

                personas.value[findPersonaIndexById(persona.value.id)] = persona.value;
                toast.add({ severity: 'success', summary: 'Success!', detail: 'Persona updated', life: 3000 });
            } catch (error) {
                console.error(`An error ocurred while updating the persona -> ${error}`);
                toast.add({ severity: 'error', summary: 'Error', detail: 'Error updating persona', life: 3000 });
            }
        } else {
            try {
                persona.value.visibility = persona.value.visibility.value ? persona.value.visibility.value : persona.value.visibility;
                persona.value.intent = persona.value.intent ? persona.value.intent.value : 'rpg';
                persona.value.owner = loggedUser.id;
                const createdPersona = await personaService.createPersona(persona.value, loggedUser.id);

                createdPersona.canEdit = true;
                createdPersona.ownerData = loggedUser;
                personas.value.push(createdPersona);
                toast.add({ severity: 'success', summary: 'Success!', detail: 'Persona created', life: 3000 });
            } catch (error) {
                console.error(`An error ocurred while saving the persona -> ${error}`);
                toast.add({ severity: 'error', summary: 'Error', detail: 'Error saving persona', life: 3000 });
            }
        }
        personaDialog.value = false;
        persona.value = { nudge: { role: null }, bump: { role: null } };
    }
};

const viewPersona = (editPersona) => {
    persona.value = { ...editPersona };

    personaNameTokens.value = decodeTokens(persona.value.name);
    personalityTokens.value = decodeTokens(persona.value.personality);
    personaNudgeTokens.value = decodeTokens(persona.value.nudge?.content ?? '');
    personaBumpTokens.value = decodeTokens(persona.value.bump?.content ?? '');

    viewPersonaDialog.value = true;
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
        await personaService.deletePersona(persona.value, loggedUser.id);
        personas.value = personas.value.filter((val) => val.id !== persona.value.id);
        deletePersonaDialog.value = false;
        persona.value = {};
        toast.add({ severity: 'success', summary: 'Success!', detail: 'Persona deleted', life: 3000 });
    } catch (error) {
        console.error(`An error ocurred while deleting the persona -> ${error}`);
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

                <TabView>
                    <TabPanel header="Card view">
                        <Toolbar class="mb-4">
                            <template v-slot:start>
                                <div class="my-2">
                                    <Button label="New" icon="pi pi-plus" class="p-button-success mr-2" @click="createNewPersona" />
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
                            :value="personas"
                            dataKey="id"
                            :paginator="true"
                            :rows="6"
                            :filters="filters"
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
                                            <Button v-if="slotProps.data.canEdit" icon="pi pi-pencil" class="p-button-rounded p-button-success mr-2" @click="editPersona(slotProps.data)" />
                                            <Button v-if="slotProps.data.canEdit" icon="pi pi-trash" class="p-button-rounded p-button-warning mt-2" @click="confirmDeletePersona(slotProps.data)" />
                                            <Button v-if="!slotProps.data.canEdit" icon="pi pi-eye" class="p-button-rounded p-button-warning mt-2" @click="viewPersona(slotProps.data)" />
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
                                    <Button v-if="slotProps.data.canEdit" icon="pi pi-pencil" class="p-button-rounded p-button-success mr-2" @click="editPersona(slotProps.data)" />
                                    <Button v-if="slotProps.data.canEdit" icon="pi pi-trash" class="p-button-rounded p-button-warning mt-2" @click="confirmDeletePersona(slotProps.data)" />
                                    <Button v-if="!slotProps.data.canEdit" icon="pi pi-eye" class="p-button-rounded p-button-warning mt-2" @click="viewPersona(slotProps.data)" />
                                </template>
                            </Column>
                        </DataTable>
                    </TabPanel>
                </TabView>

                <Dialog v-model:visible="viewPersonaDialog" header="Persona" :modal="true" class="p-fluid">
                    <div class="field">
                        <label for="name" v-tooltip="`Name of the persona. The bot will use this value as its personal name, so this field is preferrably with a proper name (e.g., John the Bot or Kaelin the Storyteller)`">
                            Name <i class="pi pi-info-circle" />
                        </label>
                        <InputText disabled id="name" v-model="persona.name" required="true" autofocus :class="{ 'p-invalid': personaSubmitted && !persona.name }" />
                        <div>
                            <small>Tokens: {{ personaNameTokens?.tokens && persona.name ? personaNameTokens?.tokens : 0 }}</small>
                        </div>
                    </div>

                    <div class="field">
                        <label for="intent" class="mb-3" v-tooltip="`Optimize this persona for either RPG dungeon mastering or for simple chatbot functions. If RPG is selected, bot will need to be tagged on Discord in order for it to be triggered.`">
                            Intent <i class="pi pi-info-circle" />
                        </label>
                        <Textarea disabled id="intent" v-model="persona.intent" placeholder="Persona intent" />
                    </div>

                    <div class="field">
                        <label
                            for="nudge"
                            class="mb-3"
                            v-tooltip="
                                `Instruction applied after the last message in context. A reminder to the AI of what it should be, act or speak like. The role decides whether the AI interprets this as a system instruction, something said by itself or something said by the user. Each role will have different results.`
                            "
                        >
                            Nudge <i class="pi pi-info-circle" />
                        </label>
                        <div class="grid formgrid">
                            <div class="col-12 mb-2 lg:col-12 lg:mb-0">
                                <InputText disabled id="nudge-role" v-model="persona.nudge.role" placeholder="Nudge role" />
                            </div>
                        </div>
                    </div>
                    <div class="field">
                        <div class="grid formgrid">
                            <div class="col-12 mb-2 lg:col-12 lg:mb-0">
                                <Textarea disabled rows="3" v-model="persona.nudge.content" id="nudge-text" type="text" placeholder="Nudge text" />
                                <div>
                                    <small>Tokens: {{ personaNudgeTokens?.tokens && persona.nudge.content ? personaNudgeTokens?.tokens : 0 }}</small>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="field">
                        <label
                            for="bump"
                            class="mb-3"
                            v-tooltip="
                                `A reminder of the behavior the AI's should have that gets added in between messages. The frequency defines how many times the instruction is repeated in context. The role decides whether the AI interprets this as a system instruction, something said by itself or something said by the user. Each role will have different results.`
                            "
                        >
                            Bump <i class="pi pi-info-circle" />
                        </label>
                        <div class="grid formgrid">
                            <div class="col-12 mb-2 lg:col-6 lg:mb-0">
                                <InputText disabled id="bump-role" v-model="persona.bump.role" placeholder="Bump role" />
                            </div>
                            <div class="col-12 mb-2 lg:col-6 lg:mb-0">
                                <InputNumber disabled mode="decimal" v-model="persona.bump.frequency" id="bump-freq" type="text" placeholder="Bump frequency" />
                            </div>
                        </div>
                    </div>
                    <div class="field">
                        <div class="grid formgrid">
                            <div class="col-12 mb-2 lg:col-12 lg:mb-0">
                                <Textarea disabled rows="3" v-model="persona.bump.content" id="bump-text" type="text" placeholder="Bump text" />
                                <div>
                                    <small>Tokens: {{ personaBumpTokens?.tokens && persona.bump.content ? personaBumpTokens?.tokens : 0 }}</small>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="field">
                        <label
                            for="personality"
                            v-tooltip="
                                `The bot's actual personality. For the name field to be used here, add {0} to the text. This value is replaced with the bot's name. We recommend that the persona starts with 'I am {0}. My name is {0}' so the AI always knows its name.`
                            "
                        >
                            Personality <i class="pi pi-info-circle" />
                        </label>
                        <Textarea disabled id="personality" v-model="persona.personality" required="true" rows="10" cols="20" />
                        <div>
                            <small>Tokens: {{ personalityTokens?.tokens && persona.personality ? personalityTokens?.tokens : 0 }}</small>
                        </div>
                    </div>
                    <div>
                        <small>
                            Total tokens in persona (sum of all fields):
                            {{ personalityTokens?.tokens && personaNameTokens?.tokens ? personalityTokens?.tokens + personaNameTokens?.tokens + (personaNudgeTokens?.tokens ?? 0) + (personaBumpTokens?.tokens ?? 0) : 0 }}
                        </small>
                    </div>
                    <template #footer>
                        <Button label="Cancel" icon="pi pi-times" class="p-button-text" @click="hideViewPersonaDialog" />
                    </template>
                </Dialog>

                <Dialog v-model:visible="personaDialog" header="Persona" :modal="true" class="p-fluid">
                    <div class="field">
                        <label for="name" v-tooltip="`Name of the persona. The bot will use this value as its personal name, so this field is preferrably with a proper name (e.g., John the Bot or Kaelin the Storyteller)`">
                            Name <i class="pi pi-info-circle" />
                        </label>
                        <InputText id="name" v-model="persona.name" required="true" autofocus :class="{ 'p-invalid': personaSubmitted && !persona.name }" @input="processPersonaNameTokens" />
                        <small class="p-invalid" v-if="personaSubmitted && !persona.name">Name is required.</small>
                        <div>
                            <small>Tokens: {{ personaNameTokens?.tokens && persona.name ? personaNameTokens?.tokens : 0 }}</small>
                        </div>
                    </div>

                    <div class="field">
                        <label for="visibility" class="mb-3">Visibility</label>
                        <Dropdown id="visibility" v-model="persona.visibility" :options="visibilities" optionLabel="label" placeholder="Persona visibility" :class="{ 'p-invalid': personaSubmitted && !persona.visibility }">
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
                        <small class="p-invalid" v-if="personaSubmitted && !persona.description">Visibility is required.</small>
                    </div>

                    <div class="field">
                        <label for="intent" class="mb-3" v-tooltip="`Optimize this persona for either RPG dungeon mastering or for simple chatbot functions. If RPG is selected, bot will need to be tagged on Discord in order for it to be triggered.`">
                            Intent <i class="pi pi-info-circle" />
                        </label>
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
                        <label
                            for="nudge"
                            class="mb-3"
                            v-tooltip="
                                `Instruction applied after the last message in context. A reminder to the AI of what it should be, act or speak like. The role decides whether the AI interprets this as a system instruction, something said by itself or something said by the user. Each role will have different results.`
                            "
                        >
                            Nudge <i class="pi pi-info-circle" />
                        </label>
                        <div class="grid formgrid">
                            <div class="col-12 mb-2 lg:col-12 lg:mb-0">
                                <Dropdown id="nudge-role" v-model="persona.nudge.role" optionValue="value" :options="roles" optionLabel="label" placeholder="Nudge role" />
                            </div>
                        </div>
                    </div>
                    <div class="field">
                        <div class="grid formgrid">
                            <div class="col-12 mb-2 lg:col-12 lg:mb-0">
                                <Textarea rows="3" v-model="persona.nudge.content" id="nudge-text" type="text" placeholder="Nudge text" @input="processPersonaNudgeTokens" />
                                <div>
                                    <small>Tokens: {{ personaNudgeTokens?.tokens && persona.nudge.content ? personaNudgeTokens?.tokens : 0 }}</small>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="field">
                        <label
                            for="bump"
                            class="mb-3"
                            v-tooltip="
                                `A reminder of the behavior the AI's should have that gets added in between messages. The frequency defines how many times the instruction is repeated in context. The role decides whether the AI interprets this as a system instruction, something said by itself or something said by the user. Each role will have different results.`
                            "
                        >
                            Bump <i class="pi pi-info-circle" />
                        </label>
                        <div class="grid formgrid">
                            <div class="col-12 mb-2 lg:col-6 lg:mb-0">
                                <Dropdown id="bump-role" v-model="persona.bump.role" optionValue="value" :options="roles" optionLabel="label" placeholder="Bump role" />
                            </div>
                            <div class="col-12 mb-2 lg:col-6 lg:mb-0">
                                <InputNumber showButtons mode="decimal" v-model="persona.bump.frequency" id="bump-freq" type="text" placeholder="Bump frequency" />
                            </div>
                        </div>
                    </div>
                    <div class="field">
                        <div class="grid formgrid">
                            <div class="col-12 mb-2 lg:col-12 lg:mb-0">
                                <Textarea rows="3" v-model="persona.bump.content" id="bump-text" type="text" placeholder="Bump text" @input="processPersonaBumpTokens" />
                                <div>
                                    <small>Tokens: {{ personaBumpTokens?.tokens && persona.bump.content ? personaBumpTokens?.tokens : 0 }}</small>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="field">
                        <label
                            for="personality"
                            v-tooltip="
                                `The bot's actual personality. For the name field to be used here, add {0} to the text. This value is replaced with the bot's name. We recommend that the persona starts with 'I am {0}. My name is {0}' so the AI always knows its name.`
                            "
                        >
                            Personality <i class="pi pi-info-circle" />
                        </label>
                        <Textarea id="personality" v-model="persona.personality" required="true" rows="10" cols="20" :class="{ 'p-invalid': personaSubmitted && !persona.personality }" @input="processPersonalityTokens" />
                        <small class="p-invalid" v-if="personaSubmitted && !persona.personality">Personality is required.</small>
                        <div>
                            <small>Tokens: {{ personalityTokens?.tokens && persona.personality ? personalityTokens?.tokens : 0 }}</small>
                        </div>
                    </div>
                    <div>
                        <small>
                            Total tokens in persona (sum of all fields):
                            {{
                                (personalityTokens?.tokens && persona.personality ? personalityTokens?.tokens : 0) +
                                    (personaBumpTokens?.tokens && persona.bump.content ? personaBumpTokens?.tokens : 0) +
                                    (personaNudgeTokens?.tokens && persona.nudge.content ? personaNudgeTokens?.tokens : 0) +
                                    (personaNameTokens?.tokens && persona.name ? personaNameTokens?.tokens : 0) ?? 0
                            }}
                        </small>
                    </div>
                    <template #footer>
                        <Button label="Cancel" icon="pi pi-times" class="p-button-text" @click="hidePersonaDialog" />
                        <Button label="Save" icon="pi pi-check" class="p-button-text" @click="savePersona" />
                    </template>
                </Dialog>

                <Dialog v-model:visible="deletePersonaDialog" :style="{ width: '450px !important' }" header="Confirm" :modal="true">
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

                <Dialog v-model:visible="deletePersonasDialog" :style="{ width: '450px !important' }" header="Confirm" :modal="true">
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
