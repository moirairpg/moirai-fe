<script setup>
import { FilterMatchMode } from 'primevue/api';
import { ref, onMounted, onBeforeMount } from 'vue';
import { useToast } from 'primevue/usetoast';
import ChannelConfigService from '@/service/ChannelConfigService';
import DiscordService from '@/service/DiscordService';
import store from '../resources/store';

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
const selectedModel = ref(null);
const strictFilter = ref(false);
const temperatureValue = ref(40);
const presPenValue = ref(1.2);
const freqPenValue = ref(1.2);
const modelsAvailable = ref([
    { label: 'GPT-4 (32K)', value: 'gpt432k' },
    { label: 'GPT-4 (8K)', value: 'gpt4' },
    { label: 'GPT-3.5 (ChatGPT)', value: 'chatgpt' },
    { label: 'GPT-3 (Davinci)', value: 'davinci' },
    { label: 'GPT-3 (Babbage)', value: 'babbage' },
    { label: 'GPT-3 (Curie)', value: 'curie' },
    { label: 'GPT-3 (Ada)', value: 'ada' }
]);

onBeforeMount(() => {
    initChannelConfigSearchFilters();
});

onMounted(async () => {
    await channelConfigService.getAllChannelConfigs(loggedUser.id).then(async (data) => {
        const cfs = [];

        if (data?.[0] !== undefined) {
            for (let cf of data) {
                const ownerData = await discordService.retrieveUserData(cf.owner);

                cf.ownerData = ownerData;
                cfs.push(cf);
            }
        }

        channelConfigs.value = cfs;
    });
});

const createNewChannelConfig = () => {
    channelConfig.value = { channelConfig: { id: '0' } };
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

const saveChannelConfig = async () => {
    channelConfigSubmitted.value = true;
    if (channelConfig.value.name.trim() && channelConfig.value.description.trim() && channelConfig.value.visibility) {
        if (channelConfig.value.id) {
            try {
                channelConfig.value.visibility = channelConfig.value.visibility.value ? channelConfig.value.visibility.value : channelConfig.value.visibility;
                await channelConfigService.updateWorld(channelConfig.value, loggedUser.id);

                channelConfigs.value[findChannelConfigIndexById(channelConfig.value.id)] = channelConfig.value;
                toast.add({ severity: 'success', summary: 'Success!', detail: 'World updated', life: 3000 });
            } catch (error) {
                console.error(`An error ocurred while updating the channel config -> ${error}`);
                toast.add({ severity: 'error', summary: 'Error', detail: 'Error updating channel config', life: 3000 });
            }
        } else {
            try {
                channelConfig.value.visibility = channelConfig.value.visibility.value ? channelConfig.value.visibility.value : channelConfig.value.visibility;
                channelConfig.value.owner = loggedUser.id;
                const createdWorld = await channelConfigService.createWorld(channelConfig.value, loggedUser.id);

                createdWorld.canEdit = true;
                createdWorld.ownerData = loggedUser;
                channelConfigs.value.push(createdWorld);
                toast.add({ severity: 'success', summary: 'Success!', detail: 'World created', life: 3000 });
            } catch (error) {
                console.error(`An error ocurred while saving the channel config -> ${error}`);
                toast.add({ severity: 'error', summary: 'Error', detail: 'Error saving channel config', life: 3000 });
            }
        }
        channelConfigDialog.value = false;
        channelConfig.value = {};
    }
};

const viewChannelConfig = (editChannelConfig) => {
    channelConfig.value = { ...editChannelConfig };
    viewChannelConfigDialog.value = true;
};

const editChannelConfig = (editChannelConfig) => {
    channelConfig.value = { ...editChannelConfig };
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
        toast.add({ severity: 'success', summary: 'Success!', detail: 'World deleted', life: 3000 });
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

const exportCSV = () => {
    dt.value.exportCSV();
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
                                            <Tag :value="slotProps.data.visibility" :class="'visibility-badge visibility-' + (slotProps.data.visibility ? slotProps.data.visibility.toLowerCase() : '')"></Tag>
                                        </div>
                                        <div class="flex flex-column align-items-center gap-3 py-5">
                                            <div class="text-2xl font-bold card-overflow-title">{{ slotProps.data.name }}</div>
                                        </div>
                                        <p align="center" class="card-overflow">
                                            {{ slotProps.data.description }}
                                        </p>
                                        <div class="flex align-items-center justify-content-between">
                                            <Button v-if="slotProps.data.canEdit" icon="pi pi-pencil" class="p-button-rounded p-button-success mr-2" @click="editChannelConfig(slotProps.data)" />
                                            <Button v-if="slotProps.data.canEdit" icon="pi pi-trash" class="p-button-rounded p-button-warning mt-2" @click="confirmDeleteChannelConfig(slotProps.data)" />
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
                                    <Button label="Delete" icon="pi pi-trash" class="p-button-danger" @click="confirmDeleteSelectedChannelConfigs" :disabled="!selectedChannelConfigs || !selectedChannelConfigs.length" />
                                </div>
                            </template>
                            <template v-slot:end>
                                <FileUpload mode="basic" accept="image/*" :maxFileSize="1000000" label="Import" chooseLabel="Import" class="mr-2 inline-block" />
                                <Button label="Export" icon="pi pi-upload" class="p-button-help" @click="exportCSV($event)" />
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
                                    <Button v-if="slotProps.data.canEdit" icon="pi pi-trash" class="p-button-rounded p-button-warning mt-2" @click="confirmDeleteChannelConfig(slotProps.data)" />
                                    <Button v-if="!slotProps.data.canEdit" icon="pi pi-eye" class="p-button-rounded p-button-warning mt-2" @click="viewChannelConfig(slotProps.data)" />
                                </template>
                            </Column>
                        </DataTable>
                    </TabPanel>
                </TabView>

                <Dialog v-model:visible="viewChannelConfigDialog" header="Channel configuration" :modal="true" class="p-fluid">
                    <div class="field">
                        <label for="name">Name</label>
                        <InputText disabled id="name" v-model.trim="channelConfig.name" />
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
                                            <Button icon="pi pi-check" class="p-button-rounded p-button-success mr-2" @click="openLorebook(channelConfig)" />
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
                                            <Button icon="pi pi-check" class="p-button-rounded p-button-success mr-2" @click="openLorebook(channelConfig)" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </template>
                    </Card>

                    <template #footer>
                        <Button label="Cancel" icon="pi pi-times" class="p-button-text" @click="hideViewChannelConfigDialog" />
                    </template>
                </Dialog>

                <Dialog v-model:visible="channelConfigDialog" header="World" :modal="true" class="p-fluid">
                    <div class="field">
                        <label for="name">Configuration name</label>
                        <InputText id="name" v-model.trim="channelConfig.name" required="true" autofocus :class="{ 'p-invalid': channelConfigSubmitted && !channelConfig.name }" />
                        <small class="p-invalid" v-if="channelConfigSubmitted && !channelConfig.name">Configuration name is required.</small>
                    </div>

                    <div class="field">
                        <label for="ai-model">AI Model</label>
                        <Dropdown v-model="selectedModel" :options="modelsAvailable" optionLabel="label" placeholder="AI Model" />
                        <small class="p-invalid" v-if="channelConfigSubmitted && !channelConfig.name">AI model is required.</small>
                        <div class="col-12 md:col-4">
                            <div class="field-checkbox mb-0">
                                <Checkbox id="strict-filter" name="option" value="Strict filtering" v-model="strictFilter" />
                                <label for="strict-filter">Strict filtering</label>
                            </div>
                        </div>
                    </div>

                    <div class="field">
                        <div class="grid formgrid">
                            <div class="col-12 mb-2 lg:col-4 lg:mb-0">
                                <label for="name">Randomness</label>
                                <InputNumber v-model.number="temperatureValue" />
                                <Slider v-model.number="temperatureValue" />
                            </div>
                            <div class="col-12 mb-2 lg:col-4 lg:mb-0">
                                <label for="name">Presence penalty</label>
                                <InputNumber v-model.number="presPenValue" />
                                <Slider v-model="presPenValue" />
                            </div>
                            <div class="col-12 mb-2 lg:col-4 lg:mb-0">
                                <label for="name">Frequency penalty</label>
                                <InputNumber v-model.number="freqPenValue" />
                                <Slider v-model="freqPenValue" />
                            </div>
                        </div>
                    </div>

                    <div class="field">
                        <div class="grid formgrid">
                            <div class="col-12 mb-2 lg:col-6 lg:mb-0">
                                <label for="name">Max tokens</label>
                                <InputNumber />
                            </div>
                            <div class="col-12 mb-2 lg:col-6 lg:mb-0">
                                <label for="name">Message history number</label>
                                <InputNumber />
                            </div>
                        </div>
                    </div>

                    <div class="field">
                        <div class="grid formgrid">
                            <div class="col-12 mb-2 lg:col-6 lg:mb-0">
                                <label for="name">Stop sequences</label>
                                <InputText />
                            </div>
                            <div class="col-12 mb-2 lg:col-6 lg:mb-0">
                                <label for="name">Logit bias</label>
                                <InputText />
                            </div>
                        </div>
                    </div>

                    <div class="card" v-if="channelConfigs">
                        <TabView>
                            <TabPanel header="Card view"> </TabPanel>
                            <TabPanel header="Table view"> </TabPanel>
                        </TabView>
                    </div>

                    <template #footer>
                        <Button label="Cancel" icon="pi pi-times" class="p-button-text" @click="hideChannelConfigDialog" />
                        <Button label="Save" icon="pi pi-check" class="p-button-text" @click="saveChannelConfig" />
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
                        <Button label="No" icon="pi pi-times" class="p-button-text" @click="deleteChannelConfigDialog = false" />
                        <Button label="Yes" icon="pi pi-check" class="p-button-text" @click="deleteChannelConfig" />
                    </template>
                </Dialog>

                <Dialog v-model:visible="deleteChannelConfigsDialog" :style="{ width: '450px !important' }" header="Confirm" :modal="true">
                    <div class="flex align-items-center justify-content-center">
                        <i class="pi pi-exclamation-triangle mr-3" style="font-size: 2rem" />
                        <span v-if="channelConfig">Are you sure you want to delete the selected channel configs?</span>
                    </div>
                    <template #footer>
                        <Button label="No" icon="pi pi-times" class="p-button-text" @click="deleteChannelConfigsDialog = false" />
                        <Button label="Yes" icon="pi pi-check" class="p-button-text" @click="deleteSelectedChannelConfigs" />
                    </template>
                </Dialog>
            </div>
        </div>
    </div>
</template>

<style scoped lang="scss">
@import '@/assets/demo/styles/badges.scss';
</style>
