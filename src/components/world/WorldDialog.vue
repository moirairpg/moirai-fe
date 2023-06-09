<script setup lang="ts">
import { FilterMatchMode } from 'primevue/api';
import { Ref, ref, onMounted, watch, onBeforeMount } from 'vue';
import { useToast } from 'primevue/usetoast';
import { decodeTokens } from '@/resources/tokenizer';
import { ToastServiceMethods } from 'primevue/toastservice';

import ConfirmIgnoreChangesDialog from '@/components/ConfirmIgnoreChangesDialog.vue';
import LorebookEntryDialog from '@/components/world/LorebookEntryDialog.vue';
import LorebookEntryDeleteDialog from '@/components/world/LorebookEntryDeleteDialog.vue';
import LorebookEntryDeleteBulkDialog from '@/components/world/LorebookEntryDeleteBulkDialog.vue';

import LabelItem from '@/types/LabelItem';
import World from '@/types/world/World';
import TokenProps from '@/types/TokenProps';
import LorebookEntry from '@/types/world/LorebookEntry';

interface Props {
    world: World;
    isOwner: Boolean;
}

const toast: ToastServiceMethods = useToast();
const emit: any = defineEmits(['onSave', 'onDownload', 'onClone', 'onClose']);
const props: Readonly<Props> = defineProps<Props>();

watch(
    () => props.world,
    (selectedWorld) => {
        world.value = Object.assign({}, JSON.parse(JSON.stringify(selectedWorld)));
        updateTokens();
    }
),
    { immediate: true, deep: true };

onMounted((): void => updateTokens());
onBeforeMount((): void => initEntryFilters());

const world: Ref<World> = ref(Object.assign({}, JSON.parse(JSON.stringify(props.world))));
const worldSubmitted: Ref<Boolean> = ref(false);
const worldPromptTokens: Ref<TokenProps> = ref({});

const entry: Ref<LorebookEntry> = ref({ isNew: true });
const entrySubmitted: Ref<Boolean> = ref(false);
const selectedEntries: Ref<LorebookEntry[]> = ref([]);
const dataViewRef: Ref<any> = ref(null);
const entryFilters: Ref<any> = ref({});
const isPendingChangePromptVisible: Ref<boolean> = ref(false);
const isEntryDialogVisible: Ref<boolean> = ref(false);
const isEntryDeleteDialogVisible: Ref<boolean> = ref(false);
const isEntryDeleteBulkDialogVisible: Ref<boolean> = ref(false);

const visibilities: Ref<LabelItem[]> = ref([
    { label: 'PRIVATE', value: 'private' },
    { label: 'PUBLIC', value: 'public' }
]);

const updateTokens = (): void => {
    worldPromptTokens.value = decodeTokens(world.value.initialPrompt ?? '');
};

const processWorldPromptTokens = (event: any): void => {
    worldPromptTokens.value = decodeTokens(event.target.value);
};

const initEntryFilters = (): void => {
    entryFilters.value = {
        global: { value: null, matchMode: FilterMatchMode.CONTAINS }
    };
};

const createNewEntry = (): void => {
    entry.value = { isNew: true };
    isEntryDialogVisible.value = true;
};

const editEntry = (editEntry: LorebookEntry): void => {
    editEntry.isNew = false;
    entry.value = { ...editEntry };
    isEntryDialogVisible.value = true;
};

const confirmDeleteEntry = (editEntry: LorebookEntry): void => {
    entry.value = editEntry;
    isEntryDeleteDialogVisible.value = true;
};

const confirmDeleteSelectedEntries = (): void => {
    isEntryDeleteBulkDialogVisible.value = true;
};

const closeWorldPrompt = (): void => {
    if (JSON.stringify(world.value) !== JSON.stringify(props.world)) {
        isPendingChangePromptVisible.value = true;
        return;
    }

    sendCloseWorld();
};

const sendCloseWorld = (): void => {
    isPendingChangePromptVisible.value = false;
    emit('onClose');
};

const sendDownloadWorld = (): void => {
    emit('onDownload', world.value);
};

const sendSaveWorld = (): void => {
    isPendingChangePromptVisible.value = false;
    emit('onSave', world.value);
};

const sendCloneWorld = (): void => {
    emit('onClone', world.value);
};

const findEntryIndexById = (id: string) => {
    let index = -1;
    if (world.value.lorebook?.length) {
        for (let i = 0; i < world.value.lorebook.length; i++) {
            if (world.value.lorebook[i].id === id) {
                index = i;
                break;
            }
        }
    }
    return index;
};

const deleteEntry = (): void => {
    world.value.lorebook = world.value.lorebook?.filter((val) => val.id !== entry.value.id);
    isEntryDeleteDialogVisible.value = false;
    toast.add({ severity: 'success', summary: 'Success!', detail: `${entry.value.name} has been deleted`, life: 3000 });
};

const deleteSelectedEntries = (): void => {
    world.value.lorebook = world.value.lorebook?.filter((o1: LorebookEntry) => {
        return !selectedEntries.value?.some((o2: LorebookEntry) => o1.id === o2.id);
    });

    isEntryDeleteBulkDialogVisible.value = false;
};

const saveEntry = (savedEntry: LorebookEntry) => {
    entrySubmitted.value = true;
    if (world.value.lorebook && savedEntry.name?.trim() && savedEntry.description?.trim()) {
        savedEntry.regex = savedEntry.regex ?? savedEntry.name;
        if (savedEntry.id || !savedEntry.isNew) {
            world.value.lorebook[findEntryIndexById(savedEntry.id as string)] = savedEntry;
            toast.add({ severity: 'success', summary: 'Success!', detail: 'Lorebook entry updated', life: 3000 });
        } else {
            world.value.lorebook?.push(savedEntry);
            toast.add({ severity: 'success', summary: 'Success!', detail: 'Lorebook entry created', life: 3000 });
        }

        delete savedEntry.isNew;
    }

    isEntryDialogVisible.value = false;
    entry.value = { isNew: true };
};
</script>
<template>
    <Dialog header="World" :modal="true" class="p-fluid">
        <Toast />
        <div class="field">
            <label for="name">Name <strong :style="{ color: 'red' }">*</strong></label>
            <InputText :disabled="!isOwner" id="name" v-model="world.name" required="true" autofocus :class="{ 'p-invalid': worldSubmitted && !world.name }" />
            <small class="p-invalid" v-if="worldSubmitted && !world.name">Name is required.</small>
        </div>

        <div class="field">
            <label for="description">Description <strong :style="{ color: 'red' }">*</strong></label>
            <Textarea :disabled="!isOwner" id="description" v-model="world.description" required="true" rows="5" cols="20" :class="{ 'p-invalid': worldSubmitted && !world.description }" />
            <small class="p-invalid" v-if="worldSubmitted && !world.description">Description is required.</small>
        </div>

        <div class="field">
            <label for="initialPrompt" v-tooltip="`Text used to begin the adventure instanced from this world. Upon using the /start command on Discord, this text will be shown and reacted upon by the AI.`">
                Adventure start text <strong :style="{ color: 'red' }">*</strong> <i class="pi pi-info-circle" />
            </label>
            <Textarea :disabled="!isOwner" id="initialPrompt" v-model="world.initialPrompt" required="true" rows="5" cols="20" :class="{ 'p-invalid': worldSubmitted && !world.initialPrompt }" @input="processWorldPromptTokens" />
            <small class="p-invalid" v-if="worldSubmitted && !world.initialPrompt">Prompt is required.</small>
            <div>
                <small>Tokens: {{ worldPromptTokens?.tokens && world.initialPrompt ? worldPromptTokens?.tokens : 0 }}</small>
            </div>
        </div>

        <div class="field">
            <label for="visibility" class="mb-3">Visibility <strong :style="{ color: 'red' }">*</strong></label>
            <Dropdown :disabled="!isOwner" id="visibility" v-model="world.visibility" :options="visibilities" optionLabel="label" placeholder="World visibility" :class="{ 'p-invalid': worldSubmitted && !world.visibility }">
                <template #value="slotProps">
                    <div v-if="slotProps.value && slotProps.value.value">
                        <span :class="'visibility-badge visibility-' + slotProps.value.value">{{ slotProps.value.label }}</span>
                    </div>
                    <div v-else-if="slotProps.value && !slotProps.value.value">
                        <span :class="'visibility-badge visibility-' + slotProps.value.toLowerCase()">{{ slotProps.value }}</span>
                    </div>
                    <span v-else>
                        {{ slotProps.placeholder }}
                    </span>
                </template>
            </Dropdown>
            <small class="p-invalid" v-if="worldSubmitted && !world.visibility">Visibility is required.</small>
        </div>

        <div class="card" v-if="world.lorebook !== null">
            <div class="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
                <h5 class="m-0">Lorebook</h5>
            </div>

            <TabView>
                <TabPanel header="Card view">
                    <DataView
                        layout="grid"
                        ref="dataViewRef"
                        :value="world.lorebook"
                        dataKey="id"
                        :paginator="true"
                        :rows="6"
                        :filters="entryFilters"
                        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                        :rowsPerPageOptions="[6, 12, 18]"
                        currentPageReportTemplate="Showing {first} to {last} of {totalRecords} entries"
                        responsiveLayout="scroll"
                    >
                        <template #header>
                            <Toolbar v-if="isOwner" class="mb-4">
                                <template v-slot:start>
                                    <div class="my-2">
                                        <Button label="New" icon="pi pi-plus" class="p-button-success mr-2" @click="createNewEntry" />
                                    </div>
                                </template>
                            </Toolbar>
                        </template>

                        <template #empty>No entries found.</template>

                        <template #grid="slotProps">
                            <div class="col-12 sm:col-6 lg:col-12 xl:col-4 p-2">
                                <div class="p-4 border-1 surface-border surface-card border-round">
                                    <div class="flex flex-column align-items-center gap-3 py-5">
                                        <div align="center" class="text-2xl font-bold card-overflow-subitem-title">{{ slotProps.data.name }}</div>
                                    </div>
                                    <p align="center" class="card-overflow-subitem">
                                        {{ slotProps.data.description }}
                                    </p>
                                    <div class="flex align-items-center justify-content-between">
                                        <Button icon="pi pi-pencil" class="p-button-rounded p-button-success mr-2" @click="editEntry(slotProps.data)" />
                                        <Button icon="pi pi-trash" class="p-button-rounded p-button-danger mt-2" @click="confirmDeleteEntry(slotProps.data)" />
                                    </div>
                                </div>
                            </div>
                        </template>
                    </DataView>
                </TabPanel>
                <TabPanel header="Table view">
                    <DataTable
                        ref="dataViewRef"
                        :value="world.lorebook"
                        v-model:selection="selectedEntries"
                        dataKey="id"
                        :paginator="true"
                        :rows="10"
                        :filters="entryFilters"
                        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                        :rowsPerPageOptions="[5, 10, 25]"
                        currentPageReportTemplate="Showing {first} to {last} of {totalRecords} entries"
                        responsiveLayout="scroll"
                    >
                        <template #header>
                            <div class="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
                                <span class="block mt-2 md:mt-0 p-input-icon-left">
                                    <i class="pi pi-search" />
                                    <InputText v-model="entryFilters['global'].value" placeholder="Search..." />
                                </span>
                            </div>
                            <Toolbar v-if="isOwner" class="mb-4">
                                <template v-slot:start>
                                    <div class="my-2">
                                        <Button label="New" icon="pi pi-plus" class="p-button-success mr-2" @click="createNewEntry" />
                                        <Button label="Delete" icon="pi pi-trash" class="p-button-danger" @click="confirmDeleteSelectedEntries" :disabled="!selectedEntries || !selectedEntries.length" />
                                    </div>
                                </template>
                            </Toolbar>
                        </template>

                        <template #empty>No entries found.</template>

                        <Column selectionMode="multiple" headerStyle="width: 3rem"></Column>
                        <Column field="name" header="Name" :sortable="true" headerStyle="width:14%; min-width:10rem;">
                            <template #body="slotProps">
                                <span class="p-column-title">Name</span>
                                <div class="table-column-overflow table-column-overflow-subitem">{{ slotProps.data.name }}</div>
                            </template>
                        </Column>
                        <Column field="regex" header="Regex" :sortable="true" headerStyle="width:14%; min-width:10rem;">
                            <template #body="slotProps">
                                <span class="p-column-title">Regex</span>
                                <div class="table-column-overflow table-column-overflow-subitem">{{ slotProps.data.regex }}</div>
                            </template>
                        </Column>
                        <Column field="description" header="Description" :sortable="true" headerStyle="width:14%; min-width:8rem;">
                            <template #body="slotProps">
                                <span class="p-column-title">Description</span>
                                <div class="table-column-overflow table-column-overflow-subitem">{{ slotProps.data.description }}</div>
                            </template>
                        </Column>
                        <Column headerStyle="min-width:10rem;">
                            <template #body="slotProps">
                                <Button icon="pi pi-pencil" class="p-button-rounded p-button-success mr-2" @click="editEntry(slotProps.data)" />
                                <Button icon="pi pi-trash" class="p-button-rounded p-button-danger mt-2" @click="confirmDeleteEntry(slotProps.data)" />
                            </template>
                        </Column>
                    </DataTable>
                </TabPanel>
            </TabView>
            <LorebookEntryDialog v-model:visible="isEntryDialogVisible" :entry="entry" :isOwner="isOwner" @onSave="saveEntry" @onClose="isEntryDialogVisible = false" />
            <LorebookEntryDeleteDialog v-model:visible="isEntryDeleteDialogVisible" :entry="entry" @onConfirm="deleteEntry" @onCancel="isEntryDeleteDialogVisible = false" />
            <LorebookEntryDeleteBulkDialog v-model:visible="isEntryDeleteBulkDialogVisible" @onConfirm="deleteSelectedEntries" @onCancel="isEntryDeleteBulkDialogVisible = false" />
            <ConfirmIgnoreChangesDialog v-model:visible="isPendingChangePromptVisible" @onConfirm="sendCloseWorld" @onCancel="isPendingChangePromptVisible = false" />
        </div>

        <template #footer>
            <Toolbar class="mb-4">
                <template v-slot:start>
                    <div class="my-2">
                        <Button label="Cancel" icon="pi pi-times" class="p-button-danger" @click="closeWorldPrompt" />
                    </div>
                </template>
                <template v-slot:end>
                    <Button v-if="world.id" label="Clone" icon="pi pi-copy" class="p-button-text" @click="sendCloneWorld" />
                    <Button v-if="world.id" label="Download" icon="pi pi-download" class="p-button-text" @click="sendDownloadWorld" />
                    <Button v-if="isOwner" label="Save" icon="pi pi-check" class="p-button-primary" @click="sendSaveWorld" />
                </template>
            </Toolbar>
        </template>
    </Dialog>
</template>
