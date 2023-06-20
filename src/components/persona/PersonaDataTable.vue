<script setup lang="ts">
import { Ref, ref, watch, onBeforeMount } from 'vue';
import { useToast } from 'primevue/usetoast';
import Persona from '@/types/persona/Persona';
import { FilterMatchMode } from 'primevue/api';
import { ToastServiceMethods } from 'primevue/toastservice';

const emit: any = defineEmits(['onDelete', 'onDeleteBulk', 'onCreate', 'onImport', 'onOpen']);
const props: Readonly<Props> = withDefaults(defineProps<Props>(), {
    selectedPersona: {} as Persona,
    isViewOnly: false
});

const toast: ToastServiceMethods = useToast();

interface Props {
    personas: Persona[];
    selectedPersona: Persona | any;
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
    () => props.personas,
    (newPersonas: Persona[]) => {
        personas.value = newPersonas;
    }
),
    { immediate: true, deep: true };

const personas: Ref<Persona[]> = ref(props.personas);
const selectedPersonas: Ref<Persona[]> = ref([]);
const searchFilters: Ref<any> = ref({});

const sendOpen = (persona: Persona): void => {
    emit('onOpen', persona);
};

const sendDelete = (persona: Persona): void => {
    emit('onDelete', persona);
};

const sendCreate = (): void => {
    emit('onCreate');
};

const sendImport = (): void => {
    emit('onImport');
};

const sendDeleteBulk = (): void => {
    const unownedSelections = selectedPersonas.value.filter((p) => !p.canEdit).length;
    if (unownedSelections > 0) {
        toast.add({ severity: 'error', summary: 'Error', detail: `You cannot delete assets that don't belong to you`, life: 3000 });
        return;
    }

    emit('onDeleteBulk', selectedPersonas.value);
};
</script>
<template>
    <Toast />
    <Toolbar v-if="!isViewOnly" class="mb-4">
        <template v-slot:start>
            <div class="my-2">
                <Button label="New" icon="pi pi-plus" class="p-button-success mr-2" @click="sendCreate" />
                <Button label="Import" icon="pi pi-upload" class="p-button-help mr-2" @click="sendImport" />
                <Button label="Delete" icon="pi pi-trash" class="p-button-danger" @click="sendDeleteBulk" :disabled="!selectedPersonas || !selectedPersonas.length" />
            </div>
        </template>
    </Toolbar>

    <DataTable
        ref="dataViewRef"
        :value="personas"
        v-model:selection="selectedPersonas"
        dataKey="id"
        :paginator="true"
        :rows="10"
        :filters="searchFilters"
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
        :rowsPerPageOptions="[5, 10, 25]"
        currentPageReportTemplate="Showing {first} to {last} of {totalRecords} personas"
        responsiveLayout="scroll"
        maxLength
        :rowStyle="({ id }) => (id === selectedPersona.id ? 'color: var(--surface-0);background-color: var(--surface-500)' : '') as Object"
    >
        <template #header>
            <div class="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
                <span class="block mt-2 md:mt-0 p-input-icon-left">
                    <i class="pi pi-search" />
                    <InputText v-model="searchFilters['global'].value" placeholder="Search..." />
                </span>
            </div>
        </template>

        <template #empty>No personas found.</template>

        <Column v-if="!isViewOnly" selectionMode="multiple" headerStyle="width: 3rem"></Column>
        <Column field="name" header="Name" :sortable="true" headerStyle="width:14%; min-width:10rem;">
            <template #body="persona">
                <span class="p-column-title">Name</span>
                <div class="table-column-overflow">{{ persona.data.name }}</div>
            </template>
        </Column>
        <Column field="personality" header="Personality" :sortable="true" headerStyle="width:14%; min-width:8rem;">
            <template #body="persona">
                <span class="p-column-title">Personality</span>
                <div class="table-column-overflow">{{ persona.data.personality }}</div>
            </template>
        </Column>
        <Column field="owner" header="Owner" :sortable="true" headerStyle="width:14%; min-width:10rem;">
            <template #body="persona">
                <span class="p-column-title">Owner</span>
                {{ persona.data.ownerData.username }}
            </template>
        </Column>
        <Column field="intent" header="Intent" :sortable="true" headerStyle="width:14%; min-width:10rem;">
            <template #body="persona">
                <span class="p-column-title">Intent</span>
                <span :class="'intent-badge intent-' + (persona.data.intent ? persona.data.intent.toLowerCase() : '')">{{ persona.data.intent }}</span>
            </template>
        </Column>
        <Column headerStyle="min-width:10rem;">
            <template #body="persona">
                <Button :icon="'pi pi-' + (persona.data.canEdit && !isViewOnly ? 'pencil' : 'eye')" class="p-button-rounded p-button-success mt-2" @click="sendOpen(persona.data)" />
                <Button v-if="persona.data.canEdit && !isViewOnly" icon="pi pi-trash" class="p-button-rounded p-button-danger mt-2" @click="sendDelete(persona.data)" />
            </template>
        </Column>
    </DataTable>
</template>
