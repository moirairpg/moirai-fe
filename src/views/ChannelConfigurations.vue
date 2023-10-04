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

import ChannelConfigDataTable from '@/components/chconf/ChannelConfigDataTable.vue';
import ChannelConfigDataView from '@/components/chconf/ChannelConfigDataView.vue';
import ChannelConfigDeleteBulkDialog from '@/components/chconf/ChannelConfigDeleteBulkDialog.vue';
import ChannelConfigDeleteDialog from '@/components/chconf/ChannelConfigDeleteDialog.vue';
import ChannelConfigImportDialog from '@/components/chconf/ChannelConfigImportDialog.vue';
import ChannelConfigDialogVue from '@/components/chconf/ChannelConfigDialog.vue';

const loggedUser: DiscordUser = store.getters.loggedUser;

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

onBeforeMount(async () => {
    initChannelConfigSearchFilters();
    await channelConfigService.getAllChannelConfigs(loggedUser.id).then(async (data) => {
        const cfs = [];

        if (data?.[0] !== undefined) {
            for (let cf of data) {
                const ownerData = await discordService.retrieveUserData(cf.ownerDiscordId as string);
                let canEdit = false;
                if (cf.ownerDiscordId === loggedUser.id || cf.writePermissions?.includes(loggedUser.id)) {
                    canEdit = true;
                }

                cf.moderationSettings!.isStrict = cf.moderationSettings?.id === 'STRICT';
                cf.ownerData = ownerData;
                cf.canEdit = canEdit;

                cf.persona!.ownerData = await discordService.retrieveUserData(cf.persona?.ownerDiscordId as string);
                cf.world!.ownerData = await discordService.retrieveUserData(cf.world?.ownerDiscordId as string);

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
                if (w.ownerDiscordId === loggedUser.id || w.writePermissions?.includes(loggedUser.id)) {
                    canEdit = true;
                }

                const ownerData = await discordService.retrieveUserData(w.ownerDiscordId as string);
                w.ownerData = ownerData;
                w.canEdit = canEdit;
                ws.push(w);
            }
        }

        worlds.value = ws;
    });

    await personaService.getAllPersonas(loggedUser.id).then(async (data) => {
        const ps = [];
        if (data?.[0] !== undefined) {
            for (let p of data) {
                let canEdit = false;
                const ownerData = await discordService.retrieveUserData(p.ownerDiscordId as string);
                if (p.ownerDiscordId === loggedUser.id || p.writePermissions?.includes(loggedUser.id)) {
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
            temperature: temperatureValue.value,
            presencePenalty: 0,
            frequencyPenalty: 0,
            logitBias: {}
        },
        moderationSettings: {
            id: 'PERMISSIVE'
        },
        ownerData: loggedUser,
        ownerDiscordId: loggedUser.id,
        canEdit: true
    };

    logitBiases.value = [];
    channelConfigSubmitted.value = false;
    isChannelConfigDialogVisible.value = true;
};

const hideChannelConfigDialog = () => {
    channelConfigSubmitted.value = false;
    isChannelConfigDialogVisible.value = false;
};

const saveChannelConfig = async (savedChannelConfig: ChannelConfiguration) => {
    channelConfigSubmitted.value = true;
    if (!savedChannelConfig.persona?.id || !savedChannelConfig.world?.id) {
        console.error(`Persona and world cannot be empty.`);
        toast.add({ severity: 'error', summary: 'Error', detail: 'Persona and world cannot be empty. Please choose one for each before proceeding.', life: 3000 });
        return;
    }

    if (savedChannelConfig.name?.trim()) {
        if (savedChannelConfig.id) {
            try {
                await channelConfigService.updateChannelConfig(savedChannelConfig, loggedUser.id);

                channelConfigs.value[findChannelConfigIndexById(savedChannelConfig.id)] = savedChannelConfig;
                toast.add({ severity: 'success', summary: 'Success!', detail: 'Channel configuration updated', life: 3000 });
            } catch (error) {
                console.error(`An error ocurred while updating the channel config -> ${error}`);
                toast.add({ severity: 'error', summary: 'Error', detail: 'Error updating channel config', life: 3000 });
            }
        } else {
            try {
                const createdChannelConfig = await channelConfigService.createChannelConfig(savedChannelConfig, loggedUser.id);

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

const confirmDeleteSelectedChannelConfigs = (deletedChannelConfigs: ChannelConfiguration[]) => {
    selectedChannelConfigs.value = deletedChannelConfigs;
    deleteChannelConfigsDialog.value = true;
};

const deleteSelectedChannelConfigs = () => {
    channelConfigs.value = channelConfigs.value
        .map((val): any => {
            if (!selectedChannelConfigs.value.some((cc) => cc.id === val.id)) {
                return val;
            }

            return channelConfigService.deleteChannelConfig(val, loggedUser.id);
        })
        .filter((val) => Object.keys(val).length !== 0);

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

        channelConfigToClone.ownerDiscordId = loggedUser.id;
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
            channelConfigToImport.ownerDiscordId = loggedUser.id;

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
                        <ChannelConfigDataView :channel-configs="channelConfigs" @onOpen="viewChannelConfig" @onDelete="confirmDeleteChannelConfig" @onCreate="createNewChannelConfig" @onImport="importChannelConfig" />
                    </TabPanel>
                    <TabPanel header="Table view">
                        <ChannelConfigDataTable
                            :channel-configs="channelConfigs"
                            @onOpen="viewChannelConfig"
                            @onDelete="confirmDeleteChannelConfig"
                            @onCreate="createNewChannelConfig"
                            @onImport="importChannelConfig"
                            @onDeleteBulk="confirmDeleteSelectedChannelConfigs"
                        />
                    </TabPanel>
                </TabView>
            </div>
        </div>

        <ChannelConfigImportDialog v-model:visible="channelConfigImportDialog" @onImport="onImport" @onCancel="channelConfigImportDialog = false" />
        <ChannelConfigDeleteDialog v-model:visible="deleteChannelConfigDialog" :channelConfig="channelConfig" @onConfirm="deleteChannelConfig" @onCancel="deleteChannelConfigDialog = false" />
        <ChannelConfigDeleteBulkDialog v-model:visible="deleteChannelConfigsDialog" @onConfirm="deleteSelectedChannelConfigs" @onCancel="deleteChannelConfigsDialog = false" />
        <ChannelConfigDialogVue
            v-model:visible="isChannelConfigDialogVisible"
            :canEdit="channelConfig.canEdit ?? false"
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
