<script setup lang="ts">
import { FilterMatchMode } from 'primevue/api';
import { Ref, ref, onMounted, onBeforeMount } from 'vue';
import { useToast } from 'primevue/usetoast';
import channelConfigService from '@/service/ChannelConfigService';
import personaService from '@/service/PersonaService';
import worldService from '@/service/WorldService';
import discordService from '@/service/DiscordService';
import store from '@/resources/store';
import { LocalDateTime, DateTimeFormatter } from '@js-joda/core';
import DiscordUser from '@/types/discord/DiscordUser';
import { ToastServiceMethods } from 'primevue/toastservice';
import ChannelConfiguration from '@/types/chconf/ChannelConfiguration';
import World from '@/types/world/World';
import Persona from '@/types/persona/Persona';
import LogitBias from '@/types/chconf/LogitBias';

import ChannelConfigDeleteBulkDialog from '@/components/chconf/ChannelConfigDeleteBulkDialog.vue';
import ChannelConfigDeleteDialog from '@/components/chconf/ChannelConfigDeleteDialog.vue';
import ChannelConfigImportDialog from '@/components/chconf/ChannelConfigImportDialog.vue';
import ChannelConfigDialogVue from '@/components/chconf/ChannelConfigDialog.vue';

const loggedUser: DiscordUser = store.getters.loggedUser;

const dataViewRef: Ref<any> = ref(null);
const toast: ToastServiceMethods = useToast();

const channelConfig: Ref<ChannelConfiguration> = ref({});
const channelConfigs: Ref<ChannelConfiguration[]> = ref([]);
const selectedChannelConfigs: Ref<ChannelConfiguration[]> = ref([]);
const deleteChannelConfigDialog: Ref<boolean> = ref(false);
const deleteChannelConfigsDialog: Ref<boolean> = ref(false);
const channelConfigSubmitted: Ref<boolean> = ref(false);
const channelConfigImportDialog: Ref<boolean> = ref(false);
const channelConfigSearchFilters: Ref<any> = ref({});

const isChannelConfigDialogVisible: Ref<boolean> = ref(false);

const worlds: Ref<World[]> = ref([]);
const personas: Ref<Persona[]> = ref([]);

const temperatureValue: Ref<number> = ref(0.8);
const maxTokens: Ref<number> = ref(200);
const maxHistoryMessageNumber: Ref<number> = ref(10);
const logitBiases: Ref<LogitBias[]> = ref([]);
const selectedModel = ref({ label: 'GPT-3.5 (ChatGPT)', value: 'chatgpt', maxTokens: 4096 });

onBeforeMount(() => {
    initChannelConfigSearchFilters();
});

onMounted(async () => {
    await channelConfigService.getAllChannelConfigs(loggedUser.id).then(async (data) => {
        const cfs = [];

        if (data?.[0] !== undefined) {
            for (let cf of data) {
                const ownerData = await discordService.retrieveUserData(cf.owner as string);
                let canEdit = false;
                if (cf.owner === loggedUser.id || cf.writePermissions?.includes(loggedUser.id)) {
                    canEdit = true;
                }

                cf.moderationSettings!.isStrict = cf.moderationSettings?.id === 'STRICT';
                cf.ownerData = ownerData;
                cf.canEdit = canEdit;

                cf.persona!.ownerData = await discordService.retrieveUserData(cf.persona?.owner as string);
                cf.world!.ownerData = await discordService.retrieveUserData(cf.world?.owner as string);

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
                if (w.owner === loggedUser.id || w.writePermissions?.includes(loggedUser.id)) {
                    canEdit = true;
                }

                const ownerData = await discordService.retrieveUserData(w.owner as string);
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

const importChannelConfig = () => {
    channelConfigSubmitted.value = false;
    channelConfigImportDialog.value = true;
};

const createNewChannelConfig = () => {
    maxTokens.value = 100;
    maxHistoryMessageNumber.value = 10;
    temperatureValue.value = 0.8;
    channelConfig.value = {
        modelSettings: {
            maxTokens: maxTokens.value,
            chatHistoryMemory: maxHistoryMessageNumber.value,
            temperature: temperatureValue.value
        },
        moderationSettings: {
            id: 'PERMISSIVE'
        },
        ownerData: loggedUser,
        owner: loggedUser.id,
        canEdit: true
    };

    logitBiases.value = [];
    selectedModel.value = { label: 'GPT-3.5 (ChatGPT)', value: 'chatgpt', maxTokens: 4096 };
    channelConfigSubmitted.value = false;
    isChannelConfigDialogVisible.value = true;
};

const hideChannelConfigDialog = () => {
    channelConfigSubmitted.value = false;
    isChannelConfigDialogVisible.value = false;
};

const saveChannelConfig = async () => {
    channelConfigSubmitted.value = true;
    if (!channelConfig.value.persona?.id || !channelConfig.value.world?.id) {
        console.error(`Persona and world cannot be empty.`);
        toast.add({ severity: 'error', summary: 'Error', detail: 'Persona and world cannot be empty. Please choose one for each before proceeding.', life: 3000 });
        return;
    }

    if (channelConfig.value.name?.trim()) {
        if (channelConfig.value.id) {
            try {
                channelConfig.value.owner = loggedUser.id;
                // channelConfig.value.modelSettings = {
                //     modelName: selectedModel.value.value,
                //     temperature: temperatureValue.value,
                //     frequencyPenalty: freqPenValue.value,
                //     presencePenalty: presPenValue.value,
                //     stopSequence: stopSequences.value,
                //     maxTokens: maxTokens.value,
                //     chatHistoryMemory: maxHistoryMessageNumber.value,
                //     owner: loggedUser.id,
                //     logitBias: logitBiases.value.reduce((dict, b, index) => ((dict[b.encodedToken] = b.bias), dict), {})
                // };

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
                // channelConfig.value.modelSettings = {
                //     modelName: selectedModel.value.value,
                //     temperature: temperatureValue,
                //     frequency_penalty: freqPenValue,
                //     presence_penalty: presPenValue,
                //     stop_sequence: stopSequences,
                //     maxTokens: maxTokens.value,
                //     chatHistoryMemory: maxHistoryMessageNumber.value,
                //     owner: loggedUser.id,
                //     logit_bias: logitBiases.value.reduce((dict, b, index) => ((dict[b.encodedToken] = b.bias), dict), {})
                // };

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
        isChannelConfigDialogVisible.value = false;
        channelConfig.value = {};
    }
};

const viewChannelConfig = (editChannelConfig: ChannelConfiguration) => {
    channelConfig.value = { ...editChannelConfig };
    logitBiases.value = [];
    // for (var key in channelConfig.value.modelSettings.logit_bias) {
    //     const value = channelConfig.value.modelSettings.logit_bias[key];
    //     const token = decodeSingleToken(key);
    //     logitBiases.value.push(`${token}:${value}`);
    // }

    isChannelConfigDialogVisible.value = true;
};

const editChannelConfig = (editChannelConfig: ChannelConfiguration) => {
    channelConfig.value = { ...editChannelConfig };
    // selectedModel.value = modelsAvailable.value.find((model) => model.value === editChannelConfig.modelSettings.modelName);
    // temperatureValue.value = editChannelConfig.modelSettings.temperature;
    // maxTokens.value = editChannelConfig.modelSettings.maxTokens;
    // maxHistoryMessageNumber.value = editChannelConfig.modelSettings.chatHistoryMemory;

    logitBiases.value = [];
    // for (var key in channelConfig.value.modelSettings.logit_bias) {
    //     const value = channelConfig.value.modelSettings.logit_bias[key];
    //     const token = decodeSingleToken(key);
    //     logitBiases.value.push({
    //         text: `${token}:${value}`,
    //         decodedToken: token,
    //         encodedToken: key,
    //         bias: value
    //     });
    // }

    isChannelConfigDialogVisible.value = true;
};

const confirmDeleteChannelConfig = (editChannelConfig: ChannelConfiguration) => {
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

const findChannelConfigIndexById = (id: string) => {
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
    // channelConfigs.value = channelConfigs.value
    //     .map((val) => {
    //         if (!selectedChannelConfigs.value.includes(val)) {
    //             return val;
    //         }

    //         return channelConfigService.deleteChannelConfig(val, loggedUser.id);
    //     })
    //     .filter((val) => Object.keys(val).length !== 0);

    deleteChannelConfigsDialog.value = false;
    selectedChannelConfigs.value = [];
    toast.add({ severity: 'success', summary: 'Success!', detail: 'Channel Configs selected deleted', life: 3000 });
};

const initChannelConfigSearchFilters = () => {
    channelConfigSearchFilters.value = {
        global: { value: null, matchMode: FilterMatchMode.CONTAINS }
    };
};

const downloadChannelConfig = () => {
    const channelConfigToDownload = Object.assign({}, channelConfig.value);
    delete channelConfigToDownload.ownerData;
    delete channelConfigToDownload.canEdit;
    delete channelConfigToDownload.persona;
    delete channelConfigToDownload.world;
    delete channelConfigToDownload.moderationSettings!.isStrict;

    channelConfigToDownload.world = {
        id: channelConfig.value.world!.id
    };

    channelConfigToDownload.persona = {
        id: channelConfig.value.persona!.id
    };

    const fileName = `chconf-${channelConfigToDownload.id}-${LocalDateTime.now().format(DateTimeFormatter.ofPattern('yyyMMddHHmmss'))}-${channelConfigToDownload.name}.json`;
    const url = window.URL.createObjectURL(new Blob([JSON.stringify(channelConfigToDownload, null, 2)]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${fileName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`);
    document.body.appendChild(link);
    link.click();

    toast.add({ severity: 'success', summary: 'Success!', detail: 'Channel configuration downloaded', life: 3000 });
};

const cloneChannelConfig = async () => {
    try {
        const channelConfigToClone = Object.assign({}, channelConfig.value);
        delete channelConfigToClone.id;
        delete channelConfigToClone.ownerData;
        delete channelConfigToClone.canEdit;
        delete channelConfigToClone.persona;
        delete channelConfigToClone.world;
        delete channelConfigToClone.modelSettings?.id;
        delete channelConfigToClone.moderationSettings?.isStrict;

        channelConfigToClone.owner = loggedUser.id;
        channelConfigToClone.name = `${channelConfigToClone.name} - Copy`;
        channelConfigToClone.persona = {
            id: channelConfig.value.persona?.id
        };

        channelConfigToClone.world = {
            id: channelConfig.value.world?.id
        };

        const createdChannelConfig = await channelConfigService.createChannelConfig(channelConfigToClone, loggedUser.id);

        createdChannelConfig.canEdit = true;
        createdChannelConfig.ownerData = loggedUser;
        createdChannelConfig.moderationSettings!.isStrict = createdChannelConfig.moderationSettings?.id === 'STRICT';

        channelConfig.value = createdChannelConfig;
        channelConfigs.value.push(createdChannelConfig);
        toast.add({ severity: 'success', summary: 'Success!', detail: 'Channel configuration cloned', life: 3000 });
    } catch (error) {
        console.error(`An error ocurred while cloning the channel configuration -> ${error}`);
        toast.add({ severity: 'error', summary: 'Error', detail: 'Error cloning channel configuration', life: 3000 });
    }
};

const onImport = async (event: any) => {
    event.files.forEach(async (file: File) => {
        const reader = new FileReader();
        reader.onload = async (res) => {
            const channelConfigToImport = JSON.parse(res.target?.result as string);
            channelConfigToImport.owner = loggedUser.id;

            const createdChannelConfig = await channelConfigService.createChannelConfig(channelConfigToImport, loggedUser.id);
            createdChannelConfig.canEdit = true;
            createdChannelConfig.ownerData = loggedUser;
            createdChannelConfig.moderationSettings!.isStrict = createdChannelConfig.moderationSettings?.id === 'STRICT';

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
                            ref="dataViewRef"
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
                            ref="dataViewRef"
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
            </div>
        </div>

        <ChannelConfigImportDialog @onImport="onImport" @onCancel="channelConfigImportDialog = false" />
        <ChannelConfigDeleteDialog v-model:visible="deleteChannelConfigDialog" :channelConfig="channelConfig" @onConfirm="deleteChannelConfig" @onCancel="deleteChannelConfigDialog = false" />
        <ChannelConfigDeleteBulkDialog v-model:visible="deleteChannelConfigsDialog" @onConfirm="deleteSelectedChannelConfigs" @onCancel="deleteChannelConfigsDialog = false" />
        <ChannelConfigDialogVue
            v-model:visible="isChannelConfigDialogVisible"
            :canEdit="channelConfig.canEdit as boolean"
            :channelConfig="channelConfig"
            :worlds="worlds"
            :personas="personas"
            @onClone="cloneChannelConfig"
            @onDownload="downloadChannelConfig"
            @onSave="saveChannelConfig"
            @onClose="hideChannelConfigDialog"
        />
    </div>
</template>

<style scoped lang="scss">
@import '@/assets/demo/styles/badges.scss';
</style>
