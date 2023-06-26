<script setup lang="ts">
import { Ref, ref, watch, onBeforeMount } from 'vue';
import { useToast } from 'primevue/usetoast';
import World from '@/types/world/World';
import { FilterMatchMode } from 'primevue/api';
import { ToastServiceMethods } from 'primevue/toastservice';

const emit: any = defineEmits(['onDelete', 'onDeleteBulk', 'onCreate', 'onImport', 'onOpen']);
const props: Readonly<Props> = withDefaults(defineProps<Props>(), {
    selectedWorld: {} as World,
    isViewOnly: false
});

const toast: ToastServiceMethods = useToast();

interface Props {
    worlds: World[];
    selectedWorld: World | any;
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
    () => props.worlds,
    (newWorlds: World[]) => {
        worlds.value = newWorlds;
    }
),
    { immediate: true, deep: true };

const worlds: Ref<World[]> = ref(props.worlds);
const selectedWorlds: Ref<World[]> = ref([]);
const searchFilters: Ref<any> = ref({});

const sendOpen = (world: World): void => {
    emit('onOpen', world);
};

const sendDelete = (world: World): void => {
    emit('onDelete', world);
};

const sendCreate = (): void => {
    emit('onCreate');
};

const sendImport = (): void => {
    emit('onImport');
};

const sendDeleteBulk = (): void => {
    const unownedSelections = selectedWorlds.value.filter((p) => !p.canEdit).length;
    if (unownedSelections > 0) {
        toast.add({ severity: 'error', summary: 'Error', detail: `You cannot delete assets that don't belong to you`, life: 3000 });
        return;
    }

    emit('onDeleteBulk', selectedWorlds.value);
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
        :value="worlds"
        dataKey="id"
        :paginator="true"
        :rows="6"
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
        :rowsPerPageOptions="[6, 12, 18, 30, 42, 54, 72, 96]"
        currentPageReportTemplate="Showing {first} to {last} of {totalRecords} worlds"
        responsiveLayout="scroll"
        maxLength
    >
        <template #empty>No worlds found.</template>

        <template #grid="world">
            <div class="col-12 sm:col-6 lg:col-12 xl:col-4 p-2">
                <div class="p-4 border-1 surface-border surface-card border-round">
                    <div class="flex flex-wrap align-items-center justify-content-between gap-2">
                        <div class="flex align-items-center gap-2">
                            <i class="pi pi-user"></i>
                            <span class="font-semibold">{{ world.data.ownerData.username }}</span>
                        </div>
                        <Tag v-if="isViewOnly" :value="`${world.data.id === selectedWorld.id ? 'SELECTED' : 'AVAILABLE'}`" :class="'selected-badge ' + (world.data.id === selectedWorld.id ? 'selected' : 'available') + '-item'" />
                    </div>
                    <div class="flex flex-column align-items-center gap-3 py-5">
                        <div class="text-2xl font-bold card-overflow-title">{{ world.data.name }}</div>
                    </div>
                    <p align="center" class="card-overflow">
                        {{ world.data.description }}
                    </p>
                    <div class="flex align-items-center justify-content-between">
                        <Button :icon="'pi pi-' + (world.data.canEdit && !isViewOnly ? 'pencil' : 'eye')" class="p-button-rounded p-button-success mr-2" @click="sendOpen(world.data)" />
                        <Button v-if="world.data.canEdit && !isViewOnly" icon="pi pi-trash" class="p-button-rounded p-button-danger mt-2" @click="sendDelete(world.data)" />
                    </div>
                </div>
            </div>
        </template>
    </DataView>
</template>
