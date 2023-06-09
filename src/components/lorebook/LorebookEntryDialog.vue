<script setup lang="ts">
import { Ref, ref, onMounted, watch } from 'vue';
import { decodeTokens } from '@/resources/tokenizer';

import ConfirmIgnoreChangesDialog from '@/components/ConfirmIgnoreChangesDialog.vue';

import TokenProps from '@/types/TokenProps';
import LorebookEntry from '@/types/world/LorebookEntry';

interface Props {
    entry: LorebookEntry;
    isOwner: Boolean;
}

const emit: any = defineEmits(['onSave', 'onClose']);
const props: Readonly<Props> = defineProps<Props>();

watch(
    () => props.entry,
    (selectedEntry) => {
        entry.value = Object.assign({}, JSON.parse(JSON.stringify(selectedEntry)));
        updateTokens();
    }
),
    { immediate: true, deep: true };

onMounted((): void => updateTokens());

const entry: Ref<LorebookEntry> = ref(Object.assign({}, JSON.parse(JSON.stringify(props.entry))));
const entrySubmitted: Ref<Boolean> = ref(false);
const lorebookEntryNameTokens: Ref<TokenProps> = ref({});
const lorebookEntryDescriptionTokens: Ref<TokenProps> = ref({});
const isPendingChangePromptVisible: Ref<boolean> = ref(false);

const updateTokens = (): void => {
    lorebookEntryNameTokens.value = decodeTokens(entry.value.name ?? '');
    lorebookEntryDescriptionTokens.value = decodeTokens(entry.value.description ?? '');
};

const processLorebookEntryNameTokens = (): void => {
    lorebookEntryNameTokens.value = decodeTokens(entry.value.name ?? '');
};

const processLorebookEntryDescriptionTokens = (): void => {
    lorebookEntryDescriptionTokens.value = decodeTokens(entry.value.description ?? '');
};

const closeEntryPrompt = (): void => {
    if (JSON.stringify(entry.value) !== JSON.stringify(props.entry)) {
        isPendingChangePromptVisible.value = true;
        return;
    }

    sendCloseWindow();
};

const sendSaveEntry = (): void => {
    isPendingChangePromptVisible.value = false;
    emit('onSave', entry.value);
};

const sendCloseWindow = (): void => {
    isPendingChangePromptVisible.value = false;
    emit('onClose');
};
</script>
<template>
    <Dialog header="Lorebook entry" :modal="true" class="p-fluid">
        <div class="field">
            <label
                for="name"
                v-tooltip="
                    `Required field. Name of the entry that will be sent to the AI.
                                If this is a character, this should be their name. The AI will use this as the idenfier to the entry.`
                "
            >
                Name <i class="pi pi-info-circle" />
            </label>
            <InputText :disabled="!isOwner" id="name" v-model="entry.name" required="true" autofocus :class="{ 'p-invalid': entrySubmitted && !entry.name }" @input="processLorebookEntryNameTokens" />
            <small class="p-invalid" v-if="entrySubmitted && !entry.name">Name is required.</small>
            <div>
                <small>Tokens: {{ lorebookEntryNameTokens?.tokens && entry.name ? lorebookEntryNameTokens?.tokens : 0 }}</small>
            </div>
        </div>
        <div class="field">
            <label
                for="regex"
                v-tooltip="
                    `Optional field. If left empty, will be filled with the entry's name.
                                Regular expresion that when matched will insert the entry into context. Case sensitive. Does not accept regex flags, only the expression itself. Do not wrap the expression in slashes.`
                "
            >
                Regex <i class="pi pi-info-circle" />
            </label>
            <InputText :disabled="!isOwner" id="regex" v-model="entry.regex" />
        </div>
        <div class="field">
            <label
                for="description"
                v-tooltip="
                    `Required field. Description of the entry.
                                If this is a character, their description (physical and mental) should go here. The AI will base their interactions with the entry based on the values in this field.`
                "
            >
                Description <i class="pi pi-info-circle" />
            </label>
            <Textarea :disabled="!isOwner" id="description" v-model="entry.description" required="true" rows="3" cols="20" :class="{ 'p-invalid': entrySubmitted && !entry.description }" @input="processLorebookEntryDescriptionTokens" />
            <small class="p-invalid" v-if="entrySubmitted && !entry.description">Description is required.</small>
            <div>
                <small>Tokens: {{ lorebookEntryDescriptionTokens?.tokens && entry.description ? lorebookEntryDescriptionTokens?.tokens : 0 }}</small>
            </div>
        </div>
        <div>
            <small>
                Total tokens in entry (sum of all fields):
                {{ (lorebookEntryNameTokens?.tokens && entry.name ? lorebookEntryNameTokens?.tokens : 0) + (lorebookEntryDescriptionTokens?.tokens && entry.description ? lorebookEntryDescriptionTokens?.tokens : 0) ?? 0 }}
            </small>
        </div>
        <template #footer>
            <Button label="Cancel" icon="pi pi-times" class="p-button-danger" @click="closeEntryPrompt" />
            <Button v-if="isOwner" label="Save" icon="pi pi-check" class="p-button-primary" @click="sendSaveEntry" />
        </template>
        <ConfirmIgnoreChangesDialog v-model:visible="isPendingChangePromptVisible" @onConfirm="sendCloseWindow" @onCancel="isPendingChangePromptVisible = false" />
    </Dialog>
</template>
