<script setup>
import { FilterMatchMode } from 'primevue/api';
import { ref, onMounted, onBeforeMount } from 'vue';
import { useToast } from 'primevue/usetoast';
import ChannelConfigService from '@/service/ChannelConfigService';
import PersonaService from '@/service/PersonaService';
import WorldService from '@/service/WorldService';
import DiscordService from '@/service/DiscordService';
import store from '../resources/store';
import { decodeTokens, decodeSingleToken } from '../resources/tokenizer';
import { LocalDateTime, DateTimeFormatter } from '@js-joda/core';

const personaService = new PersonaService();
const worldService = new WorldService();
const channelConfigService = new ChannelConfigService();
const discordService = new DiscordService();
const loggedUser = store.getters.loggedUser;

const dt = ref(null);
const toast = useToast();

const channelConfig = ref({});
const channelConfigs = ref(null);
const channelConfigDialog = ref(false);
const selectedChannelConfigs = ref(null);
const viewChannelConfigDialog = ref(false);
const deleteChannelConfigDialog = ref(false);
const deleteChannelConfigsDialog = ref(false);
const channelConfigSearchFilters = ref({});
const channelConfigSubmitted = ref(false);
const channelConfigImportDialog = ref(false);

const world = ref({});
const worlds = ref(null);
const worldDialog = ref(false);
const worldSearchFilters = ref({});

const personaDialog = ref(false);
const persona = ref({});
const personas = ref(null);
const personaSearchFilters = ref({});

const temperatureValue = ref(0.8);
const temperaturePercentage = ref(40);
const presPenValue = ref(0);
const presPenPercentage = ref(50);
const freqPenValue = ref(0);
const freqPenPercentage = ref(50);
const stopSequences = ref(null);
const maxTokens = ref(200);
const maxHistoryMessageNumber = ref(10);
const logitBiases = ref([]);
const selectedLogitBias = ref({});
const logitBiasToken = ref(null);
const logitBiasValue = ref(0);
const logitBiasPercentage = ref(50);
const selectedModel = ref({ label: 'GPT-3.5 (ChatGPT)', value: 'chatgpt', maxTokens: 4096 });
const modelsAvailable = ref([
    { label: 'GPT-4 (32K)', value: 'gpt432k', maxTokens: 32768 },
    { label: 'GPT-4 (8K)', value: 'gpt4', maxTokens: 8192 },
    { label: 'GPT-3.5 (ChatGPT)', value: 'chatgpt', maxTokens: 4096 },
    { label: 'GPT-3 (Davinci)', value: 'davinci', maxTokens: 4096 },
    { label: 'GPT-3 (Babbage)', value: 'babbage', maxTokens: 2048 },
    { label: 'GPT-3 (Curie)', value: 'curie', maxTokens: 2048 },
    { label: 'GPT-3 (Ada)', value: 'ada', maxTokens: 2048 }
]);

onBeforeMount(() => {
    initChannelConfigSearchFilters();
    initWorldSearchFilters();
    initPersonaSearchFilters();
});

onMounted(async () => {
    await channelConfigService.getAllChannelConfigs(loggedUser.id).then(async (data) => {
        const cfs = [];

        if (data?.[0] !== undefined) {
            for (let cf of data) {
                const ownerData = await discordService.retrieveUserData(cf.owner);
                let canEdit = false;
                if (cf.owner === loggedUser.id || cf.writePermissions?.contains(loggedUser.id)) {
                    canEdit = true;
                }

                cf.moderation_settings.isStrict = cf.moderation_settings.id === 'STRICT';
                cf.ownerData = ownerData;
                cf.canEdit = canEdit;
                cfs.push(cf);
            }
        }

        channelConfigs.value = cfs;
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
                w.ownerData = ownerData;
                w.canEdit = canEdit;
                ws.push(w);
            }
        }

        worlds.value = ws;
    });

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

const importChannelConfig = () => {
    channelConfigSubmitted.value = false;
    channelConfigImportDialog.value = true;
};

const createNewChannelConfig = () => {
    maxTokens.value = 100;
    maxHistoryMessageNumber.value = 10;
    temperatureValue.value = 0.8;
    getTemperaturePercentage(temperatureValue.value);
    channelConfig.value = {
        model_settings: {
            max_tokens: maxTokens.value,
            chat_history_memory: maxHistoryMessageNumber.value,
            temperature: temperatureValue.value
        },
        moderation_settings: {
            id: 'PERMISSIVE'
        }
    };

    logitBiases.value = [];
    selectedModel.value = { label: 'GPT-3.5 (ChatGPT)', value: 'chatgpt', maxTokens: 4096 };
    channelConfigSubmitted.value = false;
    channelConfigDialog.value = true;
};

const hideChannelConfigDialog = () => {
    channelConfigSubmitted.value = false;
    channelConfigDialog.value = false;
};

const hideViewChannelConfigDialog = () => {
    viewChannelConfigDialog.value = false;
};

const hideWorldDialog = () => {
    worldDialog.value = false;
};

const hidePersonaDialog = () => {
    personaDialog.value = false;
};

const selectWorld = () => {
    channelConfig.value.world = world.value;
    worldDialog.value = false;
    world.value = {};
};

const selectPersona = () => {
    channelConfig.value.persona = persona.value;
    personaDialog.value = false;
    persona.value = {};
};

const saveChannelConfig = async () => {
    channelConfigSubmitted.value = true;
    if (channelConfig.value.name.trim()) {
        if (channelConfig.value.id) {
            try {
                channelConfig.value.owner = loggedUser.id;
                channelConfig.value.model_settings = {
                    name: channelConfig.name,
                    model_name: selectedModel.value.value,
                    temperature: temperatureValue,
                    frequency_penalty: freqPenValue,
                    presence_penalty: presPenValue,
                    stop_sequence: stopSequences,
                    max_tokens: maxTokens.value,
                    chat_history_memory: maxHistoryMessageNumber.value,
                    owner: loggedUser.id,
                    logit_bias: logitBiases.value.reduce((dict, b, index) => ((dict[b.encodedToken] = b.bias), dict), {})
                };

                await channelConfigService.updateChannelConfig(channelConfig.value, loggedUser.id);

                channelConfigs.value[findChannelConfigIndexById(channelConfig.value.id)] = channelConfig.value;
                toast.add({ severity: 'success', summary: 'Success!', detail: 'Channel configuration updated', life: 3000 });
            } catch (error) {
                console.error(`An error ocurred while updating the channel config -> ${error}`);
                toast.add({ severity: 'error', summary: 'Error', detail: 'Error updating channel config', life: 3000 });
            }
        } else {
            try {
                channelConfig.value.owner = loggedUser.id;
                channelConfig.value.model_settings = {
                    model_name: selectedModel.value.value,
                    temperature: temperatureValue,
                    frequency_penalty: freqPenValue,
                    presence_penalty: presPenValue,
                    stop_sequence: stopSequences,
                    max_tokens: maxTokens.value,
                    chat_history_memory: maxHistoryMessageNumber.value,
                    owner: loggedUser.id,
                    logit_bias: logitBiases.value.reduce((dict, b, index) => ((dict[b.encodedToken] = b.bias), dict), {})
                };

                const createdChannelConfig = await channelConfigService.createChannelConfig(channelConfig.value, loggedUser.id);

                createdChannelConfig.canEdit = true;
                createdChannelConfig.ownerData = loggedUser;
                channelConfigs.value.push(createdChannelConfig);
                toast.add({ severity: 'success', summary: 'Success!', detail: 'Channel configuration created', life: 3000 });
            } catch (error) {
                console.error(`An error ocurred while saving the channel config -> ${error}`);
                toast.add({ severity: 'error', summary: 'Error', detail: 'Error saving channel config', life: 3000 });
            }
        }
        channelConfigDialog.value = false;
        channelConfig.value = {};
    }
};

const viewWorld = (selectedWorld) => {
    world.value = { ...selectedWorld };
    worldDialog.value = true;
};

const viewPersona = (selectedPersona) => {
    persona.value = { ...selectedPersona };
    personaDialog.value = true;
};

const viewChannelConfig = (editChannelConfig) => {
    channelConfig.value = { ...editChannelConfig };
    logitBiases.value = [];
    for (var key in channelConfig.value.model_settings.logit_bias) {
        const value = channelConfig.value.model_settings.logit_bias[key];
        const token = decodeSingleToken(key);
        logitBiases.value.push(`${token}:${value}`);
    }

    viewChannelConfigDialog.value = true;
};

const editChannelConfig = (editChannelConfig) => {
    channelConfig.value = { ...editChannelConfig };
    selectedModel.value = modelsAvailable.value.find((model) => model.value === editChannelConfig.model_settings.model_name);
    temperatureValue.value = editChannelConfig.model_settings.temperature;
    maxTokens.value = editChannelConfig.model_settings.max_tokens;
    maxHistoryMessageNumber.value = editChannelConfig.model_settings.chat_history_memory;
    getTemperaturePercentage(temperatureValue.value);

    logitBiases.value = [];
    for (var key in channelConfig.value.model_settings.logit_bias) {
        const value = channelConfig.value.model_settings.logit_bias[key];
        const token = decodeSingleToken(key);
        logitBiases.value.push({
            text: `${token}:${value}`,
            decodedToken: token,
            encodedToken: key,
            bias: value
        });
    }

    channelConfigDialog.value = true;
};

const confirmDeleteChannelConfig = (editChannelConfig) => {
    channelConfig.value = editChannelConfig;
    deleteChannelConfigDialog.value = true;
};

const deleteChannelConfig = async () => {
    try {
        await channelConfigService.deleteChannelConfig(channelConfig.value, loggedUser.id);
        channelConfigs.value = channelConfigs.value.filter((val) => val.id !== channelConfig.value.id);
        deleteChannelConfigDialog.value = false;
        channelConfig.value = {};
        toast.add({ severity: 'success', summary: 'Success!', detail: 'Channel configuration deleted', life: 3000 });
    } catch (error) {
        console.error(`An error ocurred while deleting the channel config -> ${error}`);
        toast.add({ severity: 'error', summary: 'Error', detail: 'Error deleting channel config', life: 3000 });
    }
};

const findChannelConfigIndexById = (id) => {
    let index = -1;
    for (let i = 0; i < channelConfigs.value.length; i++) {
        if (channelConfigs.value[i].id === id) {
            index = i;
            break;
        }
    }
    return index;
};

const confirmDeleteSelectedChannelConfigs = () => {
    deleteChannelConfigsDialog.value = true;
};

const deleteSelectedChannelConfigs = () => {
    channelConfigs.value = channelConfigs.value
        .map((val) => {
            if (!selectedChannelConfigs.value.includes(val)) {
                return val;
            }

            return channelConfigService.deleteChannelConfig(val);
        })
        .filter((val) => Object.keys(val).length !== 0);

    deleteChannelConfigsDialog.value = false;
    selectedChannelConfigs.value = null;
    toast.add({ severity: 'success', summary: 'Success!', detail: 'Channel Configs selected deleted', life: 3000 });
};

const initChannelConfigSearchFilters = () => {
    channelConfigSearchFilters.value = {
        global: { value: null, matchMode: FilterMatchMode.CONTAINS }
    };
};

const initWorldSearchFilters = () => {
    worldSearchFilters.value = {
        global: { value: null, matchMode: FilterMatchMode.CONTAINS }
    };
};

const initPersonaSearchFilters = () => {
    personaSearchFilters.value = {
        global: { value: null, matchMode: FilterMatchMode.CONTAINS }
    };
};

const getTemperaturePercentage = (temperatureValue) => {
    temperaturePercentage.value = (temperatureValue * 100) / 2;
};

const getTemperatureValue = (temperaturePercentage) => {
    temperatureValue.value = (temperaturePercentage / 100) * 2;
};

const getPresPenPercentage = (presPenValue) => {
    presPenValue = presPenValue + 2;
    presPenPercentage.value = (presPenValue * 100) / 4 - 2;
};

const getPresPenValue = (presPenPercentage) => {
    presPenValue.value = (presPenPercentage / 100) * 4 - 2;
};

const getFreqPenPercentage = (freqPenValue) => {
    freqPenValue = freqPenValue + 2;
    freqPenPercentage.value = (freqPenValue * 100) / 4 - 2;
};

const getFreqPenValue = (freqPenPercentage) => {
    freqPenValue.value = (freqPenPercentage / 100) * 4 - 2;
};

const getLogitBiasPercentage = (logitBiasValue) => {
    logitBiasPercentage.value = (logitBiasValue + 100) * 0.5;
};

const getLogitBiasValue = (logitBiasPercentage) => {
    logitBiasValue.value = logitBiasPercentage / 0.5 - 100;
};

const addLogitBias = () => {
    let existingBiasIndex = logitBiases.value.findIndex((bias) => bias.decodedToken === logitBiasToken.value);
    if (existingBiasIndex > -1) {
        logitBiases.value[existingBiasIndex].bias = logitBiasValue.value;
        logitBiases.value[existingBiasIndex].text = `${logitBiasToken.value}:${logitBiasValue.value}`;
    } else {
        const tokenized = decodeTokens(logitBiasToken.value);
        tokenized.encodedTokens.forEach((tokenId, index) => {
            logitBiases.value.push({
                text: `${tokenized.decodedTokens[index]}:${logitBiasValue.value}`,
                decodedToken: tokenized.decodedTokens[index],
                encodedToken: tokenId,
                bias: logitBiasValue.value
            });
        });
    }

    selectedLogitBias.value = {};
    logitBiasToken.value = null;
    logitBiasValue.value = 0;
    logitBiasPercentage.value = 50;
};

const removeLogitBias = () => {
    const logitBiasToRemove = logitBiases.value.findIndex((bias) => bias.encodedToken === selectedLogitBias.value.encodedToken);
    if (logitBiasToRemove > -1) {
        logitBiases.value.splice(logitBiasToRemove, 1);
    }

    selectedLogitBias.value = {};
    logitBiasValue.value = 0;
    logitBiasToken.value = null;
    logitBiasPercentage.value = 50;
};

const selectLogitBias = () => {
    logitBiasToken.value = selectedLogitBias.value.decodedToken;
    logitBiasValue.value = selectedLogitBias.value.bias;
    getLogitBiasPercentage(logitBiasValue.value);
};

const onStrictFilterChange = (event) => {
    channelConfig.value.moderation_settings.id = event ? 'STRICT' : 'PERMISSIVE';
};

const downloadChannelConfig = () => {
    const channelConfigToDownload = Object.assign({}, channelConfig.value);
    delete channelConfigToDownload.ownerData;
    delete channelConfigToDownload.canEdit;
    delete channelConfigToDownload.persona;
    delete channelConfigToDownload.world;
    delete channelConfigToDownload.moderation_settings.isStrict;

    channelConfigToDownload.world = {
        id: channelConfig.value.world.id
    };

    channelConfigToDownload.persona = {
        id: channelConfig.value.persona.id
    };

    const fileName = `chconf-${channelConfigToDownload.id}-${LocalDateTime.now().format(DateTimeFormatter.ofPattern('yyyMMddHHmmss'))}-${channelConfigToDownload.name}.json`;
    const url = window.URL.createObjectURL(new Blob([JSON.stringify(channelConfigToDownload, null, 2)]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${fileName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`);
    document.body.appendChild(link);
    link.click();
};

const cloneChannelConfig = async () => {
    try {
        const channelConfigToClone = Object.assign({}, channelConfig.value);
        delete channelConfigToClone.ownerData;
        delete channelConfigToClone.canEdit;
        delete channelConfigToClone.persona;
        delete channelConfigToClone.world;
        delete channelConfigToClone.moderation_settings.isStrict;

        channelConfigToClone.owner = loggedUser.id;
        channelConfigToClone.persona = {
            id: channelConfig.value.persona.id
        };

        channelConfigToClone.world = {
            id: channelConfig.value.world.id
        };

        const createdChannelConfig = await channelConfigService.createChannelConfig(channelConfigToClone, loggedUser.id);

        createdChannelConfig.canEdit = true;
        createdChannelConfig.ownerData = loggedUser;
        createdChannelConfig.moderation_settings.isStrict = createdChannelConfig.moderation_settings.id === 'STRICT';

        channelConfigs.value.push(createdChannelConfig);
        toast.add({ severity: 'success', summary: 'Success!', detail: 'Channel configuration cloned', life: 3000 });
    } catch (error) {
        console.error(`An error ocurred while cloning the channel configuration -> ${error}`);
        toast.add({ severity: 'error', summary: 'Error', detail: 'Error cloning channel configuration', life: 3000 });
    }
};

const onImport = async (event) => {
    event.files.forEach(async (file) => {
        const reader = new FileReader();
        reader.onload = async (res) => {
            const channelConfigToImport = JSON.parse(res.target.result);
            channelConfigToImport.owner = loggedUser.id;

            const createdChannelConfig = await channelConfigService.createChannelConfig(channelConfigToImport, loggedUser.id);
            createdChannelConfig.canEdit = true;
            createdChannelConfig.ownerData = loggedUser;
            createdChannelConfig.moderation_settings.isStrict = createdChannelConfig.moderation_settings.id === 'STRICT';

            channelConfigs.value.push(createdChannelConfig);
            toast.add({ severity: 'success', summary: 'Success!', detail: `Channel configuration imported (${file.name})`, life: 3000 });
        };

        reader.onerror = (err) => {
            console.log(err);
            toast.add({ severity: 'error', summary: 'Error', detail: `Error importing channel configuration (${file.name})`, life: 3000 });
        };
        reader.readAsText(file);
    });

    channelConfigImportDialog.value = false;
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
                                    <Button label="New" icon="pi pi-plus" class="p-button-success mr-2" @click="createNewChannelConfig" />
                                    <Button label="Import" icon="pi pi-upload" class="p-button-help mr-2" @click="importChannelConfig" />
                                </div>
                            </template>
                        </Toolbar>

                        <DataView
                            layout="grid"
                            ref="dt"
                            :value="channelConfigs"
                            dataKey="id"
                            :paginator="true"
                            :rows="6"
                            :filters="channelConfigSearchFilters"
                            paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                            :rowsPerPageOptions="[6, 12, 18]"
                            currentPageReportTemplate="Showing {first} to {last} of {totalRecords} configs"
                            responsiveLayout="scroll"
                        >
                            <template #header>
                                <div class="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
                                    <h5 class="m-0">Channel configurations</h5>
                                </div>
                            </template>

                            <template #empty>No configurations found.</template>

                            <template #grid="slotProps">
                                <div class="col-12 sm:col-6 lg:col-12 xl:col-4 p-2">
                                    <div class="p-4 border-1 surface-border surface-card border-round">
                                        <div class="flex flex-wrap align-items-center justify-content-between gap-2">
                                            <div class="flex align-items-center gap-2">
                                                <i class="pi pi-user"></i>
                                                <span class="font-semibold">{{ slotProps.data.ownerData.username }}</span>
                                            </div>
                                            <Tag :value="slotProps.data.persona.intent" :class="'intent-badge intent-' + (slotProps.data.persona.intent ? slotProps.data.persona.intent.toLowerCase() : '')"></Tag>
                                        </div>
                                        <div class="flex flex-column align-items-center gap-3 py-5">
                                            <div class="text-2xl font-bold card-overflow-title">{{ slotProps.data.name }}</div>
                                        </div>
                                        <p align="center" class="card-overflow">
                                            {{ slotProps.data.description }}
                                        </p>
                                        <div class="flex align-items-center justify-content-between">
                                            <Button v-if="slotProps.data.canEdit" icon="pi pi-pencil" class="p-button-rounded p-button-success mr-2" @click="editChannelConfig(slotProps.data)" />
                                            <Button v-if="slotProps.data.canEdit" icon="pi pi-trash" class="p-button-rounded p-button-danger mt-2" @click="confirmDeleteChannelConfig(slotProps.data)" />
                                            <Button v-if="!slotProps.data.canEdit" icon="pi pi-eye" class="p-button-rounded p-button-warning mt-2" @click="viewChannelConfig(slotProps.data)" />
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
                                    <Button label="New" icon="pi pi-plus" class="p-button-success mr-2" @click="createNewChannelConfig" />
                                    <Button label="Import" icon="pi pi-upload" class="p-button-help mr-2" @click="importChannelConfig" />
                                    <Button label="Delete" icon="pi pi-trash" class="p-button-danger" @click="confirmDeleteSelectedChannelConfigs" :disabled="!selectedChannelConfigs || !selectedChannelConfigs.length" />
                                </div>
                            </template>
                        </Toolbar>

                        <DataTable
                            ref="dt"
                            :value="channelConfigs"
                            v-model:selection="selectedChannelConfigs"
                            dataKey="id"
                            :paginator="true"
                            :rows="10"
                            :filters="channelConfigSearchFilters"
                            paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                            :rowsPerPageOptions="[5, 10, 25]"
                            currentPageReportTemplate="Showing {first} to {last} of {totalRecords} configs"
                            responsiveLayout="scroll"
                            maxLength
                        >
                            <template #header>
                                <div class="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
                                    <h5 class="m-0">Channel configurations</h5>
                                    <span class="block mt-2 md:mt-0 p-input-icon-left">
                                        <i class="pi pi-search" />
                                        <InputText v-model="channelConfigSearchFilters['global'].value" placeholder="Search..." />
                                    </span>
                                </div>
                            </template>

                            <template #empty>No configurations found.</template>

                            <Column selectionMode="multiple" headerStyle="width: 3rem"></Column>
                            <Column field="id" header="ID" :sortable="true" headerStyle="width:14%; min-width:10rem;">
                                <template #body="slotProps">
                                    <span class="p-column-title">ID</span>
                                    <div class="table-column-overflow">{{ slotProps.data.id }}</div>
                                </template>
                            </Column>
                            <Column field="name" header="Name" :sortable="true" headerStyle="width:14%; min-width:10rem;">
                                <template #body="slotProps">
                                    <span class="p-column-title">Name</span>
                                    <div class="table-column-overflow">{{ slotProps.data.name }}</div>
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
                                    <Button v-if="slotProps.data.canEdit" icon="pi pi-pencil" class="p-button-rounded p-button-success mr-2" @click="editChannelConfig(slotProps.data)" />
                                    <Button v-if="slotProps.data.canEdit" icon="pi pi-trash" class="p-button-rounded p-button-danger mt-2" @click="confirmDeleteChannelConfig(slotProps.data)" />
                                    <Button v-if="!slotProps.data.canEdit" icon="pi pi-eye" class="p-button-rounded p-button-warning mt-2" @click="viewChannelConfig(slotProps.data)" />
                                </template>
                            </Column>
                        </DataTable>
                    </TabPanel>
                </TabView>

                <Dialog v-model:visible="viewChannelConfigDialog" header="Channel configuration" :modal="true" class="p-fluid">
                    <div v-if="channelConfig.id" class="field">
                        <label for="config-id">ID</label>
                        <InputText id="config-id" v-model="channelConfig.id" disabled />
                    </div>

                    <div class="field">
                        <label for="config-name">Configuration name</label>
                        <InputText id="config-name" v-model="channelConfig.name" disabled />
                    </div>

                    <div class="field">
                        <label
                            for="ai-model"
                            v-tooltip="
                                `Models available to be used.
            Different models have different behaviors and react differently to how personas and worlds and general content is written. Bear this in mind when writing content.`
                            "
                        >
                            AI Model <i class="pi pi-info-circle" />
                        </label>
                        <Dropdown disabled id="ai-model" v-model="channelConfig.model_settings.model_name" optionValue="value" :options="modelsAvailable" optionLabel="label" />
                        <div class="col-12 md:col-4">
                            <div class="field-checkbox mb-0">
                                <Checkbox disabled binary id="strict-filter" name="strict-filter" :model-value="channelConfig.moderation_settings.id === 'STRICT'" @input="onStrictFilterChange" />
                                <label
                                    for="strict-filter"
                                    v-tooltip="
                                        `This applies stricter filters to both inputs and outputs.
                                        Content will be flagged when any topic of OpenAI's moderation filters is triggered. Optimal for settings where safer content is required.`
                                    "
                                >
                                    Strict filtering <i class="pi pi-info-circle" />
                                </label>
                            </div>
                        </div>
                    </div>

                    <div class="field">
                        <div class="grid formgrid">
                            <div class="col-12 mb-2 lg:col-4 lg:mb-0">
                                <label
                                    for="temperature"
                                    v-tooltip="
                                        `This value is required. Defaults to 0.8.
                                        Randomness of the outputs generated by the AI. The closer to 0, the closer to the AI's training dataset.
                                        We do not recommend going over 1.2, as the AI might spit nonsensical gibberish.`
                                    "
                                >
                                    Randomness <i class="pi pi-info-circle" />
                                </label>
                                <InputNumber disabled id="temperature" :allowEmpty="false" :maxFractionDigits="1" :min="0.1" :max="2" v-model.number="channelConfig.model_settings.temperature" />
                            </div>
                            <div class="col-12 mb-2 lg:col-4 lg:mb-0">
                                <label
                                    for="name"
                                    v-tooltip="
                                        `This value is required. Defaults to 100. The amount of tokens (considering both input and output) to be processed by the AI.
                                        Maximum number depends on model selected. We do not recommend providing a value higher than half of what the model supports, especially for smaller models.
                                        Maximum allowed for the selected model: ${selectedModel.maxTokens}`
                                    "
                                >
                                    Max tokens <i class="pi pi-info-circle" />
                                </label>
                                <InputNumber disabled v-model.number="channelConfig.model_settings.max_tokens" />
                            </div>
                            <div class="col-12 mb-2 lg:col-4 lg:mb-0">
                                <label
                                    for="name"
                                    v-tooltip="
                                        `This value is required.
                                        Amount of messages in the channel that will be used as the AI's memory. Defaults to 10. Can't be lower than 5 or higher than 20.`
                                    "
                                >
                                    Message history number <i class="pi pi-info-circle" />
                                </label>
                                <InputNumber disabled v-model.number="channelConfig.model_settings.chat_history_memory" />
                            </div>
                        </div>
                    </div>

                    <div class="field">
                        <div class="grid formgrid"></div>
                    </div>

                    <div class="card" v-if="channelConfigs">
                        <Panel header="Advanced options" :toggleable="true" :collapsed="true">
                            <div class="field">
                                <div class="grid formgrid">
                                    <div class="col-12 mb-2 lg:col-6 lg:mb-0">
                                        <label
                                            for="pres-pen"
                                            v-tooltip="
                                                `This value is optional. Defaults to 0.
                                        This defines how much the presence of tokens in the input will influence the AI's output.
                                        The higher the value, the higher the chance of tokens that have not appeared yet to be generated in the outputs.`
                                            "
                                        >
                                            Presence penalty <i class="pi pi-info-circle" />
                                        </label>
                                        <InputNumber disabled id="pres-pen" :maxFractionDigits="1" :min="-2" :max="2" v-model.number="channelConfig.model_settings.presence_penalty" />
                                    </div>
                                    <div class="col-12 mb-2 lg:col-6 lg:mb-0">
                                        <label for="freq-pen" v-tooltip="'This value is optional. Defaults to 0. This penalizes the AI for repeating the same tokens too many times. The higher the value, the less the AI will repeat the same tokens.'">
                                            Frequency penalty <i class="pi pi-info-circle" />
                                        </label>
                                        <InputNumber disabled id="freq-pen" :maxFractionDigits="1" :min="-2" :max="2" v-model.number="channelConfig.model_settings.frequency_penalty" />
                                    </div>
                                </div>
                            </div>
                            <div class="field">
                                <div class="grid formgrid">
                                    <div class="col-12 mb-2 lg:col-12 lg:mb-0">
                                        <label
                                            for="stop-sequences"
                                            v-tooltip="
                                                `This value is optional. Up to 4 sequences.
                                        Once these values appear in an output, the AI will stop generating more text.`
                                            "
                                        >
                                            Stop sequences <i class="pi pi-info-circle" />
                                        </label>
                                        <Chips disabled id="stop-sequences" v-model="channelConfig.model_settings.stop_sequence" :max="4" />
                                    </div>
                                </div>
                            </div>
                            <div class="field">
                                <div class="grid formgrid">
                                    <div class="col-12 mb-2 lg:col-12 lg:mb-0">
                                        <label
                                            for="logit-bias"
                                            v-tooltip="
                                                `This value is optional.
                                        Likelihood of a token appearing in outputs. Ranges from -100 to 100. -100 means an exclusive ban of the supplied token, and 100 means it will always appear.`
                                            "
                                        >
                                            Logit bias <i class="pi pi-info-circle" />
                                        </label>
                                        <Chips disabled id="logit-bias-chips" v-model="logitBiases" />
                                    </div>
                                </div>
                            </div>
                        </Panel>
                    </div>

                    <Card>
                        <template #title>World</template>
                        <template #content>
                            <div class="col-12">
                                <div class="flex flex-column xl:flex-row xl:align-items-start p-4 gap-4">
                                    <div class="flex flex-column sm:flex-row justify-content-between align-items-center xl:align-items-start flex-1 gap-4">
                                        <div class="flex flex-column align-items-center sm:align-items-start gap-3">
                                            <div class="text-2xl font-bold text-900">{{ channelConfig.world.name }}</div>
                                            <div class="mb-3">{{ channelConfig.world.description }}</div>
                                            <div class="flex align-items-center gap-3">
                                                <span class="flex align-items-center gap-2">
                                                    <i class="pi pi-user"></i>
                                                    <span class="font-semibold">{{ channelConfig.ownerData.username }}</span>
                                                </span>
                                            </div>
                                        </div>
                                        <div class="flex sm:flex-column align-items-center sm:align-items-end gap-3 sm:gap-2">
                                            <Button icon="pi pi-eye" class="p-button-rounded p-button-success mr-2" @click="viewWorld(channelConfig.world)" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </template>
                    </Card>

                    <Card>
                        <template #title>Persona</template>
                        <template #content>
                            <div class="col-12">
                                <div class="flex flex-column xl:flex-row xl:align-items-start p-4 gap-4">
                                    <div class="flex flex-column sm:flex-row justify-content-between align-items-center xl:align-items-start flex-1 gap-4">
                                        <div class="flex flex-column align-items-center sm:align-items-start gap-3">
                                            <div class="text-2xl font-bold text-900">{{ channelConfig.persona.name }}</div>
                                            <div class="mb-3">{{ channelConfig.persona.personality }}</div>
                                            <div class="flex align-items-center gap-3">
                                                <span class="flex align-items-center gap-2">
                                                    <i class="pi pi-user"></i>
                                                    <span class="font-semibold">{{ channelConfig.ownerData.username }}</span>
                                                </span>
                                            </div>
                                        </div>
                                        <div class="flex sm:flex-column align-items-center sm:align-items-end gap-3 sm:gap-2">
                                            <Button icon="pi pi-eye" class="p-button-rounded p-button-success mr-2" @click="viewPersona(channelConfig.persona)" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </template>
                    </Card>

                    <template #footer>
                        <Toolbar class="mb-4">
                            <template v-slot:start>
                                <div class="my-2"><Button label="Cancel" icon="pi pi-times" class="p-button-danger" @click="hideViewChannelConfigDialog" /></div>
                            </template>
                            <template v-slot:end>
                                <Button v-if="channelConfig.id" label="Clone" icon="pi pi-copy" class="p-button-text" @click="cloneChannelConfig" />
                                <Button v-if="channelConfig.id" label="Download" icon="pi pi-download" class="p-button-text" @click="downloadChannelConfig" />
                            </template>
                        </Toolbar>
                    </template>
                </Dialog>

                <Dialog v-model:visible="channelConfigDialog" header="Channel config" :modal="true" class="p-fluid">
                    <div v-if="channelConfig.id" class="field">
                        <label for="config-id">ID</label>
                        <InputText id="config-id" v-model="channelConfig.id" disabled />
                    </div>

                    <div class="field">
                        <label for="config-name">Configuration name</label>
                        <InputText id="config-name" v-model="channelConfig.name" required="true" autofocus :class="{ 'p-invalid': channelConfigSubmitted && !channelConfig.name }" />
                        <small class="p-invalid" v-if="channelConfigSubmitted && !channelConfig.name">Configuration name is required.</small>
                    </div>

                    <div class="field">
                        <label
                            for="ai-model"
                            v-tooltip="
                                `Models available to be used.
                                Different models have different behaviors and react differently to how personas and worlds and general content is written. Bear this in mind when writing content.`
                            "
                        >
                            AI Model <i class="pi pi-info-circle" />
                        </label>
                        <Dropdown id="ai-model" v-model="selectedModel" :options="modelsAvailable" optionLabel="label" :class="{ 'p-invalid': channelConfigSubmitted && !selectedModel }" />
                        <small class="p-invalid" v-if="channelConfigSubmitted && !selectedModel">AI model is required.</small>
                        <div class="col-12 md:col-4">
                            <div class="field-checkbox mb-0">
                                <Checkbox binary id="strict-filter" name="strict-filter" :model-value="channelConfig.moderation_settings?.id === 'STRICT'" @input="onStrictFilterChange" />
                                <label
                                    for="strict-filter"
                                    v-tooltip="
                                        `This applies stricter filters to both inputs and outputs.
                                        Content will be flagged when any topic of OpenAI's moderation filters is triggered. Optimal for settings where safer content is required.`
                                    "
                                >
                                    Strict filtering <i class="pi pi-info-circle" />
                                </label>
                            </div>
                        </div>
                    </div>

                    <div class="field">
                        <div class="grid formgrid">
                            <div class="col-12 mb-2 lg:col-4 lg:mb-0">
                                <label
                                    for="temperature"
                                    v-tooltip="
                                        `This value is required. Defaults to 0.8.
                                        Randomness of the outputs generated by the AI. The closer to 0, the closer to the AI's training dataset.
                                        We do not recommend going over 1.2, as the AI might spit nonsensical gibberish.`
                                    "
                                >
                                    Randomness <i class="pi pi-info-circle" />
                                </label>
                                <InputNumber id="temperature" :allowEmpty="false" :maxFractionDigits="1" :min="0.1" :max="2" v-model.number="temperatureValue" @update:modelValue="getTemperaturePercentage(temperatureValue)" />
                                <Slider v-model="temperaturePercentage" @update:modelValue="getTemperatureValue(temperaturePercentage)" />
                            </div>
                            <div class="col-12 mb-2 lg:col-4 lg:mb-0">
                                <label
                                    for="name"
                                    v-tooltip="
                                        `This value is required. Defaults to 100. The amount of tokens (considering both input and output) to be processed by the AI.
                                        Maximum number depends on model selected. We do not recommend providing a value higher than half of what the model supports, especially for smaller models.
                                        Maximum allowed for the selected model: ${selectedModel.maxTokens}`
                                    "
                                >
                                    Max tokens <i class="pi pi-info-circle" />
                                </label>
                                <InputNumber v-model.number="maxTokens" :min="100" :max="selectedModel.maxTokens" :class="{ 'p-invalid': channelConfigSubmitted && !maxTokens }" />
                                <small class="p-invalid" v-if="channelConfigSubmitted && !maxTokens">Max token count is required.</small>
                            </div>
                            <div class="col-12 mb-2 lg:col-4 lg:mb-0">
                                <label
                                    for="name"
                                    v-tooltip="
                                        `This value is required.
                                        Amount of messages in the channel that will be used as the AI's memory. Defaults to 10. Can't be lower than 5 or higher than 20.`
                                    "
                                >
                                    Message history number <i class="pi pi-info-circle" />
                                </label>
                                <InputNumber v-model.number="maxHistoryMessageNumber" :min="5" :max="20" :class="{ 'p-invalid': channelConfigSubmitted && !maxHistoryMessageNumber }" />
                                <small class="p-invalid" v-if="channelConfigSubmitted && !maxHistoryMessageNumber">Message history count is required.</small>
                            </div>
                        </div>
                    </div>

                    <div class="field">
                        <div class="grid formgrid"></div>
                    </div>

                    <div class="card" v-if="channelConfigs">
                        <Panel header="Advanced options" :toggleable="true" :collapsed="true">
                            <div class="field">
                                <div class="grid formgrid">
                                    <div class="col-12 mb-2 lg:col-6 lg:mb-0">
                                        <label
                                            for="pres-pen"
                                            v-tooltip="
                                                `This value is optional. Defaults to 0.
                                        This defines how much the presence of tokens in the input will influence the AI's output.
                                        The higher the value, the higher the chance of tokens that have not appeared yet to be generated in the outputs.`
                                            "
                                        >
                                            Presence penalty <i class="pi pi-info-circle" />
                                        </label>
                                        <InputNumber id="pres-pen" :maxFractionDigits="1" :min="-2" :max="2" v-model.number="presPenValue" @update:modelValue="getPresPenPercentage(presPenValue)" />
                                        <Slider v-model="presPenPercentage" @update:modelValue="getPresPenValue(presPenPercentage)" />
                                    </div>
                                    <div class="col-12 mb-2 lg:col-6 lg:mb-0">
                                        <label for="freq-pen" v-tooltip="'This value is optional. Defaults to 0. This penalizes the AI for repeating the same tokens too many times. The higher the value, the less the AI will repeat the same tokens.'">
                                            Frequency penalty <i class="pi pi-info-circle" />
                                        </label>
                                        <InputNumber id="freq-pen" :maxFractionDigits="1" :min="-2" :max="2" v-model.number="freqPenValue" @update:modelValue="getFreqPenPercentage(freqPenValue)" />
                                        <Slider v-model="freqPenPercentage" @update:modelValue="getFreqPenValue(freqPenPercentage)" />
                                    </div>
                                </div>
                            </div>
                            <div class="field">
                                <div class="grid formgrid">
                                    <div class="col-12 mb-2 lg:col-12 lg:mb-0">
                                        <label
                                            for="stop-sequences"
                                            v-tooltip="
                                                `This value is optional. Up to 4 sequences.
                                        Once these values appear in an output, the AI will stop generating more text.`
                                            "
                                        >
                                            Stop sequences <i class="pi pi-info-circle" />
                                        </label>
                                        <Chips id="stop-sequences" v-model="stopSequences" :max="4" />
                                    </div>
                                </div>
                            </div>
                            <div class="field">
                                <div class="grid formgrid">
                                    <div class="col-12 mb-2 lg:col-12 lg:mb-0">
                                        <label
                                            for="logit-bias"
                                            v-tooltip="
                                                `This value is optional.
                                        Likelihood of a token appearing in outputs. Ranges from -100 to 100. -100 means an exclusive ban of the supplied token, and 100 means it will always appear.`
                                            "
                                        >
                                            Logit bias <i class="pi pi-info-circle" />
                                        </label>
                                        <Dropdown id="logit-bias" v-model="selectedLogitBias" :options="logitBiases" optionLabel="text" placeholder="Existing logit biases" @update:modelValue="selectLogitBias" />
                                        <InputText id="logit-bias-token" v-model="logitBiasToken" placeholder="Logit bias token" />
                                        <Slider v-model="logitBiasPercentage" @update:modelValue="getLogitBiasValue(logitBiasPercentage)" />
                                        <InputNumber id="logit-bias-bias" :maxFractionDigits="0" :min="-100" :max="100" v-model.number="logitBiasValue" @update:modelValue="getLogitBiasPercentage(logitBiasValue)" />
                                    </div>
                                </div>
                                <div class="field">
                                    <div class="grid formgrid">
                                        <div class="col-12 mb-2 lg:col-6 lg:mb-0">
                                            <Button class="p-button-primary" label="Add/update logit bias" @click="addLogitBias" />
                                        </div>
                                        <div class="col-12 mb-2 lg:col-6 lg:mb-0">
                                            <Button class="p-button-danger" label="Remove logit bias" @click="removeLogitBias" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Panel>
                    </div>

                    <div class="card" v-if="channelConfigs">
                        <Panel header="Persona" :toggleable="true" :collapsed="true">
                            <TabView>
                                <TabPanel header="Card view">
                                    <DataView
                                        layout="grid"
                                        ref="dt"
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
                                                        <Button icon="pi pi-eye" class="p-button-rounded p-button-warning mt-2" @click="viewPersona(slotProps.data)" />
                                                    </div>
                                                </div>
                                            </div>
                                        </template>
                                    </DataView>
                                </TabPanel>
                                <TabPanel header="Table view">
                                    <DataTable
                                        ref="dt"
                                        :value="personas"
                                        dataKey="id"
                                        :paginator="true"
                                        :rows="10"
                                        :filters="personaSearchFilters"
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
                                                    <InputText v-model="personaSearchFilters['global'].value" placeholder="Search..." />
                                                </span>
                                            </div>
                                        </template>

                                        <template #empty>No personas found.</template>

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
                                                <Button icon="pi pi-eye" class="p-button-rounded p-button-warning mt-2" @click="viewPersona(slotProps.data)" />
                                            </template>
                                        </Column>
                                    </DataTable>
                                </TabPanel>
                            </TabView>
                        </Panel>
                    </div>

                    <div class="card" v-if="channelConfigs">
                        <Panel header="World" :toggleable="true" :collapsed="true">
                            <TabView>
                                <TabPanel header="Card view">
                                    <DataView
                                        layout="grid"
                                        ref="dt"
                                        :value="worlds"
                                        dataKey="id"
                                        :paginator="true"
                                        :rows="6"
                                        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                                        :rowsPerPageOptions="[6, 12, 18]"
                                        currentPageReportTemplate="Showing {first} to {last} of {totalRecords} worlds"
                                        responsiveLayout="scroll"
                                        maxLength
                                        :gridStyle="({ id }) => (id === channelConfig.world.id ? 'color: var(--surface-0);background-color: var(--surface-500)' : null)"
                                    >
                                        <template #empty>No worlds found.</template>

                                        <template #grid="slotProps">
                                            <div class="col-12 sm:col-6 lg:col-12 xl:col-4 p-2">
                                                <div class="p-4 border-1 surface-border surface-card border-round">
                                                    <div class="flex flex-wrap align-items-center justify-content-between gap-2">
                                                        <div class="flex align-items-center gap-2">
                                                            <i class="pi pi-user"></i>
                                                            <span class="font-semibold">{{ slotProps.data.ownerData.username }}</span>
                                                        </div>
                                                        <Tag :value="`${channelConfig?.world?.id === slotProps.data.id ? 'SELECTED' : 'AVAILABLE'}`" :class="'visibility-badge'" />
                                                    </div>
                                                    <div class="flex flex-column align-items-center gap-3 py-5">
                                                        <div class="text-2xl font-bold card-overflow-title">{{ slotProps.data.name }}</div>
                                                    </div>
                                                    <p align="center" class="card-overflow">
                                                        {{ slotProps.data.description }}
                                                    </p>
                                                    <div class="flex align-items-center justify-content-between">
                                                        <Button icon="pi pi-eye" class="p-button-rounded p-button-success mr-2" @click="viewWorld(slotProps.data)" />
                                                    </div>
                                                </div>
                                            </div>
                                        </template>
                                    </DataView>
                                </TabPanel>
                                <TabPanel header="Table view">
                                    <DataTable
                                        ref="dt"
                                        :value="worlds"
                                        dataKey="id"
                                        :paginator="true"
                                        :rows="10"
                                        :filters="worldSearchFilters"
                                        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                                        :rowsPerPageOptions="[5, 10, 25]"
                                        currentPageReportTemplate="Showing {first} to {last} of {totalRecords} worlds"
                                        responsiveLayout="scroll"
                                        :rowStyle="({ id }) => (id === channelConfig?.world?.id ? 'color: var(--surface-0);background-color: var(--surface-500)' : null)"
                                    >
                                        <template #header>
                                            <div class="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
                                                <span class="block mt-2 md:mt-0 p-input-icon-left">
                                                    <i class="pi pi-search" />
                                                    <InputText v-model="worldSearchFilters['global'].value" placeholder="Search..." />
                                                </span>
                                            </div>
                                        </template>

                                        <template #empty>No worlds found.</template>

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
                                                <Button icon="pi pi-eye" class="p-button-rounded p-button-success mr-2" @click="viewWorld(slotProps.data)" />
                                            </template>
                                        </Column>
                                    </DataTable>
                                </TabPanel>
                            </TabView>
                        </Panel>
                    </div>

                    <template #footer>
                        <Toolbar class="mb-4">
                            <template v-slot:start>
                                <div class="my-2">
                                    <Button label="Cancel" icon="pi pi-times" class="p-button-danger" @click="hideChannelConfigDialog" />
                                </div>
                            </template>
                            <template v-slot:end>
                                <Button v-if="channelConfig.id" label="Clone" icon="pi pi-copy" class="p-button-text" @click="cloneChannelConfig" />
                                <Button v-if="channelConfig.id" label="Download" icon="pi pi-download" class="p-button-text" @click="downloadChannelConfig" />
                                <Button label="Save" icon="pi pi-check" class="p-button-primary" @click="saveChannelConfig" />
                            </template>
                        </Toolbar>
                    </template>
                </Dialog>

                <Dialog v-model:visible="channelConfigImportDialog" header="Import" :modal="true">
                    <FileUpload name="import[]" :customUpload="true" @uploader="onImport" :multiple="true" accept="application/json" :maxFileSize="1000000" label="Import" chooseLabel="Import" class="mr-2 inline-block" />
                    <template #footer>
                        <Button label="Cancel" icon="pi pi-times" class="p-button-danger" @click="channelConfigImportDialog = false" />
                    </template>
                </Dialog>

                <Dialog v-model:visible="deleteChannelConfigDialog" :style="{ width: '450px !important' }" header="Confirm" :modal="true">
                    <div class="flex align-items-center justify-content-center">
                        <i class="pi pi-exclamation-triangle mr-3" style="font-size: 2rem" />
                        <span v-if="channelConfig">
                            Are you sure you want to delete <b>{{ channelConfig.name }}</b
                            >?
                        </span>
                    </div>
                    <template #footer>
                        <Button label="No" icon="pi pi-times" class="p-button-danger" @click="deleteChannelConfigDialog = false" />
                        <Button label="Yes" icon="pi pi-check" class="p-button-primary" @click="deleteChannelConfig" />
                    </template>
                </Dialog>

                <Dialog v-model:visible="deleteChannelConfigsDialog" :style="{ width: '450px !important' }" header="Confirm" :modal="true">
                    <div class="flex align-items-center justify-content-center">
                        <i class="pi pi-exclamation-triangle mr-3" style="font-size: 2rem" />
                        <span v-if="channelConfig">Are you sure you want to delete the selected channel configs?</span>
                    </div>
                    <template #footer>
                        <Button label="No" icon="pi pi-times" class="p-button-danger" @click="deleteChannelConfigsDialog = false" />
                        <Button label="Yes" icon="pi pi-check" class="p-button-primary" @click="deleteSelectedChannelConfigs" />
                    </template>
                </Dialog>

                <Dialog v-model:visible="worldDialog" header="World" :modal="true" class="p-fluid">
                    <div class="field">
                        <label for="name">Name</label>
                        <InputText id="name" v-model="world.name" disabled />
                    </div>
                    <div class="field">
                        <label for="description">Description</label>
                        <Textarea id="description" v-model="world.description" rows="3" cols="20" disabled />
                    </div>
                    <template #footer>
                        <Button label="Close" icon="pi pi-times" class="p-button-danger" @click="hideWorldDialog" />
                        <Button v-if="worldDialog" label="Select" icon="pi pi-check" class="p-button-primary" @click="selectWorld" />
                    </template>
                </Dialog>

                <Dialog v-model:visible="personaDialog" header="Persona" :modal="true" class="p-fluid">
                    <div class="field">
                        <label for="name">Name</label>
                        <InputText disabled id="name" v-model="persona.name" required="true" />
                    </div>

                    <div class="field">
                        <label for="intent" class="mb-3">Intent</label>
                        <Textarea disabled id="intent" v-model="persona.intent" placeholder="Persona intent" />
                    </div>

                    <div class="field">
                        <label for="nudge" class="mb-3">Nudge</label>
                        <div class="grid formgrid">
                            <div class="col-12 mb-2 lg:col-6 lg:mb-0">
                                <InputText disabled id="nudge-role" v-model="persona.nudge.role" placeholder="Nudge role" />
                            </div>
                            <div class="col-12 mb-2 lg:col-6 lg:mb-0">
                                <Textarea disabled rows="1" v-model="persona.nudge.content" id="nudge-text" type="text" placeholder="Nudge text" />
                            </div>
                        </div>
                    </div>

                    <div class="field">
                        <label for="bump" class="mb-3">Bump</label>
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
                                <Textarea disabled rows="1" v-model="persona.bump.content" id="bump-text" type="text" placeholder="Bump text" />
                            </div>
                        </div>
                    </div>

                    <div class="field">
                        <label for="personality">Personality</label>
                        <Textarea disabled id="personality" v-model="persona.personality" required="true" rows="10" cols="20" />
                    </div>
                    <template #footer>
                        <Button label="Cancel" icon="pi pi-times" class="p-button-danger" @click="hidePersonaDialog" />
                        <Button label="Select" icon="pi pi-check" class="p-button-primary" @click="selectPersona" />
                    </template>
                </Dialog>
            </div>
        </div>
    </div>
</template>

<style scoped lang="scss">
@import '@/assets/demo/styles/badges.scss';
</style>
