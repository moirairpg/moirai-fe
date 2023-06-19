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
                <Button label="Delete" icon="pi pi-trash" class="p-button-danger" @click="sendDeleteBulk" :disabled="!selectedWorlds || !selectedWorlds.length" />
            </div>
        </template>
    </Toolbar>

    <DataTable
        ref="dataViewRef"
        :value="worlds"
        dataKey="id"
        :paginator="true"
        :rows="10"
        :filters="searchFilters"
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
        :rowsPerPageOptions="[5, 10, 25]"
        currentPageReportTemplate="Showing {first} to {last} of {totalRecords} worlds"
        responsiveLayout="scroll"
        :rowStyle="({ id }) => (id === selectedWorld.id ? 'color: var(--surface-0);background-color: var(--surface-500)' : '') as Object"
    >
        <template #header>
            <div class="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
                <span class="block mt-2 md:mt-0 p-input-icon-left">
                    <i class="pi pi-search" />
                    <InputText v-model="searchFilters['global'].value" placeholder="Search..." />
                </span>
            </div>
        </template>

        <template #empty>No worlds found.</template>

        <Column field="name" header="Name" :sortable="true" headerStyle="width:14%; min-width:10rem;">
            <template #body="world">
                <span class="p-column-title">Name</span>
                <div class="table-column-overflow">{{ world.data.name }}</div>
            </template>
        </Column>
        <Column field="description" header="Description" :sortable="true" headerStyle="width:14%; min-width:8rem;">
            <template #body="world">
                <span class="p-column-title">Description</span>
                <div class="table-column-overflow">{{ world.data.description }}</div>
            </template>
        </Column>
        <Column field="owner" header="Owner" :sortable="true" headerStyle="width:14%; min-width:10rem;">
            <template #body="world">
                <span class="p-column-title">Owner</span>
                {{ world.data.ownerData.username }}
            </template>
        </Column>
        <Column headerStyle="min-width:10rem;">
            <template #body="world">
                <Button :icon="'pi pi-' + (world.data.canEdit && !isViewOnly ? 'pencil' : 'eye')" class="p-button-rounded p-button-success mt-2" @click="sendOpen(world.data)" />
                <Button v-if="world.data.canEdit && !isViewOnly" icon="pi pi-trash" class="p-button-rounded p-button-danger mt-2" @click="sendDelete(world.data)" />
            </template>
        </Column>
    </DataTable>
</template>
