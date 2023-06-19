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
            </div>
        </template>
    </Toolbar>

    <DataView
        layout="grid"
        ref="dataViewRef"
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

        <template #grid="persona">
            <div class="col-12 sm:col-6 lg:col-12 xl:col-4 p-2">
                <div class="p-4 border-1 surface-border surface-card border-round">
                    <div class="flex flex-wrap align-items-center justify-content-between gap-2">
                        <div class="flex align-items-center gap-2">
                            <i class="pi pi-user"></i>
                            <span class="font-semibold">{{ persona.data.ownerData.username }}</span>
                        </div>
                        <Tag v-if="!isViewOnly" :value="persona.data.intent" :class="'intent-badge intent-' + (persona.data.intent ? persona.data.intent.toLowerCase() : '')" />
                        <Tag
                            v-if="isViewOnly"
                            :value="`${persona.data.intent.toUpperCase()} - ${persona.data.id === selectedPersona.id ? `SELECTED` : `AVAILABLE`}`"
                            :class="'selected-badge ' + (persona.data.id === selectedPersona.id ? 'selected' : 'available') + '-item'"
                        />
                    </div>
                    <div class="flex flex-column align-items-center gap-3 py-5">
                        <div class="text-2xl font-bold card-overflow-title">{{ persona.data.name }}</div>
                    </div>
                    <p align="center" class="card-overflow">
                        {{ persona.data.personality }}
                    </p>
                    <div class="flex align-items-center justify-content-between">
                        <Button :icon="'pi pi-' + (persona.data.canEdit && !isViewOnly ? 'pencil' : 'eye')" class="p-button-rounded p-button-success mt-2" @click="sendOpen(persona.data)" />
                        <Button v-if="persona.data.canEdit && !isViewOnly" icon="pi pi-trash" class="p-button-rounded p-button-danger mt-2" @click="sendDelete(persona.data)" />
                    </div>
                </div>
            </div>
        </template>
    </DataView>
</template>
