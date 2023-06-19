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
        :filters="searchFilters"
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

        <template #grid="channelConfig">
            <div class="col-12 sm:col-6 lg:col-12 xl:col-4 p-2">
                <div class="p-4 border-1 surface-border surface-card border-round">
                    <div class="flex flex-wrap align-items-center justify-content-between gap-2">
                        <div class="flex align-items-center gap-2">
                            <i class="pi pi-user"></i>
                            <span class="font-semibold">{{ channelConfig.data.ownerData.username }}</span>
                        </div>
                        <Tag :value="channelConfig.data.persona.intent" :class="'intent-badge intent-' + (channelConfig.data.persona.intent ? channelConfig.data.persona.intent.toLowerCase() : '')"></Tag>
                    </div>
                    <div class="flex flex-column align-items-center gap-3 py-5">
                        <div class="text-2xl font-bold card-overflow-title">{{ channelConfig.data.name }}</div>
                    </div>
                    <p align="center" class="card-overflow">
                        {{ channelConfig.data.description }}
                    </p>
                    <div class="flex align-items-center justify-content-between">
                        <Button :icon="'pi pi-' + (channelConfig.data.canEdit && !isViewOnly ? 'pencil' : 'eye')" class="p-button-rounded p-button-success mt-2" @click="sendOpen(channelConfig.data)" />
                        <Button v-if="channelConfig.data.canEdit && !isViewOnly" icon="pi pi-trash" class="p-button-rounded p-button-danger mt-2" @click="sendDelete(channelConfig.data)" />
                    </div>
                </div>
            </div>
        </template>
    </DataView>
</template>
