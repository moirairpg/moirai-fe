<script setup lang="ts">
import { Ref, ref, watch, onBeforeMount } from 'vue';
import { useToast } from 'primevue/usetoast';
import { FilterMatchMode } from 'primevue/api';
import { ToastServiceMethods } from 'primevue/toastservice';

import ChannelConfiguration from '@/types/chconf/ChannelConfiguration';

const emit: any = defineEmits(['onDelete', 'onDeleteBulk', 'onCreate', 'onImport', 'onOpen']);
const props: Readonly<Props> = withDefaults(defineProps<Props>(), {
    selectedChannelConfiguration: {} as ChannelConfiguration,
    isViewOnly: false
});

const toast: ToastServiceMethods = useToast();

interface Props {
    channelConfigs: ChannelConfiguration[];
    selectedChannelConfiguration: ChannelConfiguration | any;
    isViewOnly: boolean;
}

onBeforeMount((): void => {
    initFilters();
});

const initFilters = (): void => {
    searchFilters.value = {
        global: { value: null, matchMode: FilterMatchMode.CONTAINS }
    };
};

watch(
    () => props.channelConfigs,
    (newChannelConfigurations: ChannelConfiguration[]) => {
        channelConfigs.value = newChannelConfigurations;
    }
),
    { immediate: true, deep: true };

const channelConfigs: Ref<ChannelConfiguration[]> = ref(props.channelConfigs);
const selectedChannelConfigurations: Ref<ChannelConfiguration[]> = ref([]);
const searchFilters: Ref<any> = ref({});

const sendOpen = (channelConfig: ChannelConfiguration): void => {
    emit('onOpen', channelConfig);
};

const sendDelete = (channelConfig: ChannelConfiguration): void => {
    emit('onDelete', channelConfig);
};

const sendCreate = (): void => {
    emit('onCreate');
};

const sendImport = (): void => {
    emit('onImport');
};

const sendDeleteBulk = (): void => {
    const unownedSelections = selectedChannelConfigurations.value.filter((p) => !p.canEdit).length;
    if (unownedSelections > 0) {
        toast.add({ severity: 'error', summary: 'Error', detail: `You cannot delete assets that don't belong to you`, life: 3000 });
        return;
    }

    emit('onDeleteBulk', selectedChannelConfigurations.value);
};
</script>
<template>
    <Toast />
    <Toolbar v-if="!isViewOnly" class="mb-4">
        <template v-slot:start>
            <div class="my-2">
                <Button label="New" icon="pi pi-plus" class="p-button-success mr-2" @click="sendCreate" />
                <Button label="Import" icon="pi pi-upload" class="p-button-help mr-2" @click="sendImport" />
                <Button label="Delete" icon="pi pi-trash" class="p-button-danger" @click="sendDeleteBulk" :disabled="!selectedChannelConfigurations || !selectedChannelConfigurations.length" />
            </div>
        </template>
    </Toolbar>

    <DataTable
        ref="dataViewRef"
        :value="channelConfigs"
        v-model:selection="selectedChannelConfigurations"
        dataKey="id"
        :paginator="true"
        :rows="10"
        :filters="searchFilters"
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
        :rowsPerPageOptions="[5, 10, 25, 50, 75, 100]"
        currentPageReportTemplate="Showing {first} to {last} of {totalRecords} configs"
        responsiveLayout="scroll"
        maxLength
    >
        <template #header>
            <div class="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
                <h5 class="m-0">Channel configurations</h5>
                <span class="block mt-2 md:mt-0 p-input-icon-left">
                    <i class="pi pi-search" />
                    <InputText v-model="searchFilters['global'].value" placeholder="Search..." />
                </span>
            </div>
        </template>

        <template #empty>No configurations found.</template>

        <Column selectionMode="multiple" headerStyle="width: 3rem"></Column>
        <Column field="id" header="ID" :sortable="true" headerStyle="width:14%; min-width:10rem;">
            <template #body="channelConfig">
                <span class="p-column-title">ID</span>
                <div class="table-column-overflow">{{ channelConfig.data.id }}</div>
            </template>
        </Column>
        <Column field="name" header="Name" :sortable="true" headerStyle="width:14%; min-width:10rem;">
            <template #body="channelConfig">
                <span class="p-column-title">Name</span>
                <div class="table-column-overflow">{{ channelConfig.data.name }}</div>
            </template>
        </Column>
        <Column field="owner" header="Owner" :sortable="true" headerStyle="width:14%; min-width:10rem;">
            <template #body="channelConfig">
                <span class="p-column-title">Owner</span>
                {{ channelConfig.data.ownerData.username }}
            </template>
        </Column>
        <Column headerStyle="min-width:10rem;">
            <template #body="channelConfig">
                <Button :icon="'pi pi-' + (channelConfig.data.canEdit && !isViewOnly ? 'pencil' : 'eye')" class="p-button-rounded p-button-success mt-2" @click="sendOpen(channelConfig.data)" />
                <Button v-if="channelConfig.data.canEdit && !isViewOnly" icon="pi pi-trash" class="p-button-rounded p-button-danger mt-2" @click="sendDelete(channelConfig.data)" />
            </template>
        </Column>
    </DataTable>
</template>
