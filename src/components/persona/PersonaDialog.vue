<script setup lang="ts">
import { Ref, ref, onMounted, watch } from 'vue';
import tokenizer from '@/resources/Tokenizer';
import Persona from '@/types/persona/Persona';
import LabelItem from '@/types/LabelItem';
import TokenProps from '@/types/TokenProps';

interface Props {
    persona: Persona;
    isOwner: Boolean;
}

const emit: any = defineEmits(['onSave', 'onDownload', 'onClone', 'onClose']);
const props: Readonly<Props> = defineProps<Props>();

watch(
    () => props.persona,
    (selectedPersona) => {
        persona.value = selectedPersona;
        updateTokens();
    }
),
    { immediate: true, deep: true };

onMounted((): void => updateTokens());

const persona: Ref<Persona> = ref(props.persona);
const personaSubmitted: Ref<Boolean> = ref(false);
const personaNameTokens: Ref<TokenProps> = ref({});
const personalityTokens: Ref<TokenProps> = ref({});
const personaNudgeTokens: Ref<TokenProps> = ref({});
const personaBumpTokens: Ref<TokenProps> = ref({});

const intents: Ref<LabelItem[]> = ref([
    { label: 'CHAT', value: 'chat' },
    { label: 'RPG', value: 'rpg' }
]);

const roles: Ref<LabelItem[]> = ref([
    { label: 'SYSTEM', value: 'system' },
    { label: 'ASSISTANT', value: 'assistant' },
    { label: 'USER', value: 'user' }
]);

const visibilities: Ref<LabelItem[]> = ref([
    { label: 'PRIVATE', value: 'private' },
    { label: 'PUBLIC', value: 'public' }
]);

const updateTokens = (): void => {
    personaNameTokens.value = tokenizer.decodeTokens(persona.value.name ?? '');
    personalityTokens.value = tokenizer.decodeTokens(persona.value.personality ?? '');
    personaNudgeTokens.value = tokenizer.decodeTokens(persona.value.nudge?.content ?? '');
    personaBumpTokens.value = tokenizer.decodeTokens(persona.value.bump?.content ?? '');
};

const savePersona = (): void => {
    emit('onSave', persona.value);
};

const downloadPersona = (): void => {
    emit('onDownload', persona.value);
};

const clonePersona = (): void => {
    emit('onClone', persona.value);
};

const closeWindow = (): void => {
    emit('onClose');
};

const processPersonaNameTokens = (event: any) => {
    personaNameTokens.value = tokenizer.decodeTokens(event.target.value);
};

const processPersonalityTokens = (event: any) => {
    personalityTokens.value = tokenizer.decodeTokens(event.target.value);
};

const processPersonaNudgeTokens = (event: any) => {
    personaNudgeTokens.value = tokenizer.decodeTokens(event.target.value);
};

const processPersonaBumpTokens = (event: any) => {
    personaBumpTokens.value = tokenizer.decodeTokens(event.target.value);
};
</script>
<template>
    <Dialog header="Persona" :modal="true" class="p-fluid">
        <Toast />
        <div class="field">
            <label
                for="name"
                v-tooltip="
                    `Name of the persona.
                        The bot will use this value as its personal name, so this field is preferrably with a proper name (e.g., John the Bot or Kaelin the Storyteller)`
                "
            >
                Name <strong :style="{ color: 'red' }">*</strong> <i class="pi pi-info-circle" />
            </label>
            <InputText :disabled="!isOwner" id="name" v-model="persona.name" required="true" autofocus :class="{ 'p-invalid': personaSubmitted && !persona.name }" @input="processPersonaNameTokens" />
            <small class="p-invalid" v-if="personaSubmitted && !persona.name">Name is required.</small>
            <div>
                <small>Tokens: {{ personaNameTokens?.tokens && persona.name ? personaNameTokens?.tokens : 0 }}</small>
            </div>
        </div>

        <div class="field">
            <label for="visibility" class="mb-3">Visibility <strong :style="{ color: 'red' }">*</strong></label>
            <Dropdown :disabled="!isOwner" id="visibility" v-model="persona.visibility" :options="visibilities" optionLabel="label" placeholder="Persona visibility" :class="{ 'p-invalid': personaSubmitted && !persona.visibility }">
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
            <small class="p-invalid" v-if="personaSubmitted && !persona.visibility">Visibility is required.</small>
        </div>

        <div class="field">
            <label
                for="intent"
                class="mb-3"
                v-tooltip="
                    `Optimize this persona for either RPG dungeon mastering or for simple chatbot functions.
                        If RPG is selected, bot will need to be tagged on Discord in order for it to be triggered.`
                "
            >
                Intent <strong :style="{ color: 'red' }">*</strong> <i class="pi pi-info-circle" />
            </label>
            <Dropdown :disabled="!isOwner" id="intent" v-model="persona.intent" :options="intents" optionLabel="label" placeholder="Persona intent" :class="{ 'p-invalid': personaSubmitted && !persona.intent }">
                <template #value="slotProps">
                    <div v-if="slotProps.value && slotProps.value.value">
                        <span :class="'intent-badge intent-' + slotProps.value.value">{{ slotProps.value.label }}</span>
                    </div>
                    <div v-else-if="slotProps.value && !slotProps.value.value">
                        <span :class="'intent-badge intent-' + slotProps.value.toLowerCase()">{{ slotProps.value }}</span>
                    </div>
                    <span v-else>
                        {{ slotProps.placeholder }}
                    </span>
                </template>
            </Dropdown>
            <small class="p-invalid" v-if="personaSubmitted && !persona.intent">Intent is required.</small>
        </div>

        <div class="field">
            <label
                for="personality"
                v-tooltip="
                    `The bot's actual personality. For the name field to be used here, add {0} to the text. This value is replaced with the bot's name.
                                We recommend that the persona starts with 'I am {0}. My name is {0}' so the AI always knows its name.`
                "
            >
                Personality <strong :style="{ color: 'red' }">*</strong> <i class="pi pi-info-circle" />
            </label>
            <Textarea :disabled="!isOwner" id="personality" v-model="persona.personality" required="true" rows="10" cols="20" :class="{ 'p-invalid': personaSubmitted && !persona.personality }" @input="processPersonalityTokens" />
            <small class="p-invalid" v-if="personaSubmitted && !persona.personality">Personality is required.</small>
            <div>
                <small>Tokens: {{ personalityTokens?.tokens && persona.personality ? personalityTokens?.tokens : 0 }}</small>
            </div>
        </div>

        <div class="card">
            <Panel header="Optional settings" :toggleable="true" :collapsed="true">
                <div class="field">
                    <label
                        for="nudge"
                        class="mb-3"
                        v-tooltip="
                            `Instruction applied after the last message in context. A reminder to the AI of what it should be, act or speak like.
                                The role decides whether the AI interprets this as a system instruction, something said by itself or something said by the user. Each role will have different results.`
                        "
                    >
                        Nudge <i class="pi pi-info-circle" />
                    </label>
                    <div class="grid formgrid">
                        <div class="col-12 mb-2 lg:col-12 lg:mb-0">
                            <Dropdown :disabled="!isOwner" id="nudge-role" v-model="persona.nudge.role" optionValue="value" :options="roles" optionLabel="label" placeholder="Nudge role" />
                        </div>
                    </div>
                </div>
                <div class="field">
                    <div class="grid formgrid">
                        <div class="col-12 mb-2 lg:col-12 lg:mb-0">
                            <Textarea :disabled="!isOwner" rows="3" v-model="persona.nudge.content" id="nudge-text" type="text" placeholder="Nudge text" @input="processPersonaNudgeTokens" />
                            <div>
                                <small>Tokens: {{ personaNudgeTokens?.tokens && persona.nudge?.content ? personaNudgeTokens?.tokens : 0 }}</small>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="field">
                    <label
                        for="bump"
                        class="mb-3"
                        v-tooltip="
                            `A reminder of the behavior the AI's should have that gets added in between messages.
                                The frequency defines how many times the instruction is repeated in context.
                                The role decides whether the AI interprets this as a system instruction, something said by itself or something said by the user. Each role will have different results.`
                        "
                    >
                        Bump <i class="pi pi-info-circle" />
                    </label>
                    <div class="grid formgrid">
                        <div class="col-12 mb-2 lg:col-6 lg:mb-0">
                            <Dropdown :disabled="!isOwner" id="bump-role" v-model="persona.bump.role" optionValue="value" :options="roles" optionLabel="label" placeholder="Bump role" />
                        </div>
                        <div class="col-12 mb-2 lg:col-6 lg:mb-0">
                            <InputNumber :disabled="!isOwner" showButtons mode="decimal" v-model="persona.bump.frequency" id="bump-freq" type="text" placeholder="Bump frequency" />
                        </div>
                    </div>
                </div>
                <div class="field">
                    <div class="grid formgrid">
                        <div class="col-12 mb-2 lg:col-12 lg:mb-0">
                            <Textarea :disabled="!isOwner" rows="3" v-model="persona.bump.content" id="bump-text" type="text" placeholder="Bump text" @input="processPersonaBumpTokens" />
                            <div>
                                <small>Tokens: {{ personaBumpTokens?.tokens && persona.bump?.content ? personaBumpTokens?.tokens : 0 }}</small>
                            </div>
                        </div>
                    </div>
                </div>
            </Panel>
        </div>

        <div>
            <small>
                Total tokens in persona (sum of all fields):
                {{
                    (personalityTokens?.tokens && persona.personality ? personalityTokens?.tokens : 0) +
                        (personaBumpTokens?.tokens && persona.bump?.content ? personaBumpTokens?.tokens : 0) +
                        (personaNudgeTokens?.tokens && persona.nudge?.content ? personaNudgeTokens?.tokens : 0) +
                        (personaNameTokens?.tokens && persona.name ? personaNameTokens?.tokens : 0) ?? 0
                }}
            </small>
        </div>
        <template #footer>
            <Toolbar class="mb-4">
                <template v-slot:start>
                    <div class="my-2">
                        <Button label="Close" icon="pi pi-times" class="p-button-danger" @click="closeWindow" />
                    </div>
                </template>
                <template v-slot:end>
                    <Button v-if="persona.id" label="Clone" icon="pi pi-copy" class="p-button-text" @click="clonePersona" />
                    <Button v-if="persona.id" label="Download" icon="pi pi-download" class="p-button-text" @click="downloadPersona" />
                    <Button v-if="isOwner" label="Save" icon="pi pi-check" class="p-button-primary" @click="savePersona" />
                </template>
            </Toolbar>
        </template>
    </Dialog>
</template>
