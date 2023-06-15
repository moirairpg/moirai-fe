<script setup lang="ts">
import { FilterMatchMode } from 'primevue/api';
import { Ref, ref, onBeforeMount, watch } from 'vue';
import { decodeTokens } from '@/resources/tokenizer';
import ChannelConfiguration from '@/types/chconf/ChannelConfiguration';
import World from '@/types/world/World';
import Persona from '@/types/persona/Persona';
import LabelItem from '@/types/LabelItem';
import LogitBias from '@/types/chconf/LogitBias';
import ConfirmIgnoreChangesDialog from '@/components/ConfirmIgnoreChangesDialog.vue';

import PersonaDialog from '../persona/PersonaDialog.vue';
import PersonaDataTable from '../persona/PersonaDataTable.vue';
import PersonaDataView from '../persona/PersonaDataView.vue';
import PersonaCardView from '../persona/PersonaCardView.vue';

import WorldDialog from '../world/WorldDialog.vue';
import WorldDataTable from '../world/WorldDataTable.vue';
import WorldDataView from '../world/WorldDataView.vue';
import WorldCardView from '../world/WorldCardView.vue';

interface Props {
    worlds: World[];
    personas: Persona[];
    channelConfig: ChannelConfiguration;
    canEdit: boolean;
}

const emit: any = defineEmits(['onSave', 'onDownload', 'onClone', 'onClose']);
const props: Readonly<Props> = defineProps<Props>();

watch(
    () => props.channelConfig,
    (selectedChannelConfiguration) => {
        channelConfig.value = Object.assign({}, JSON.parse(JSON.stringify(selectedChannelConfiguration)));
        personas.value = props.personas;
        worlds.value = props.worlds;
        canEdit.value = props.canEdit;
        updateValues();
    }
),
    { immediate: true, deep: true };

onBeforeMount((): void => {
    initChannelConfigSearchFilters();
    initWorldSearchFilters();
    initPersonaSearchFilters();
    updateValues();
});

const canEdit: Ref<boolean> = ref(props.canEdit);
const channelConfig: Ref<ChannelConfiguration> = ref(Object.assign({}, JSON.parse(JSON.stringify(props.channelConfig))));
const channelConfigs: Ref<ChannelConfiguration[]> = ref([]);
const channelConfigSubmitted: Ref<boolean> = ref(false);
const channelConfigSearchFilters: Ref<any> = ref({});

const world: Ref<World> = ref({});
const worlds: Ref<World[]> = ref(props.worlds);
const isWorldDialogVisible: Ref<boolean> = ref(false);
const worldSearchFilters: Ref<any> = ref({});

const persona: Ref<Persona> = ref({});
const personas: Ref<Persona[]> = ref(props.personas);
const personaSearchFilters: Ref<any> = ref({});
const isPersonaDialogVisible: Ref<boolean> = ref(false);
const isPendingChangePromptVisible: Ref<boolean> = ref(false);

const temperatureValue: Ref<number> = ref(0.8);
const temperaturePercentage: Ref<number> = ref(40);
const presPenValue: Ref<number> = ref(0);
const presPenPercentage: Ref<number> = ref(50);
const freqPenValue: Ref<number> = ref(0);
const freqPenPercentage: Ref<number> = ref(50);
const selectedLogitBias: Ref<LogitBias> = ref({});
const logitBiasToken: Ref<string> = ref('');
const logitBiasValue: Ref<number> = ref(0);
const logitBiasPercentage: Ref<number> = ref(50);
const modelsAvailable: Ref<LabelItem[]> = ref([
    // { label: 'GPT-4 (32K)', value: 'gpt432k', maxTokens: 32768 },
    // { label: 'GPT-4 (8K)', value: 'gpt4', maxTokens: 8192 },
    { label: 'GPT-3.5 (ChatGPT)', value: 'chatgpt', maxTokens: 4096 },
    { label: 'GPT-3 (Davinci)', value: 'davinci', maxTokens: 4096 },
    { label: 'GPT-3 (Babbage)', value: 'babbage', maxTokens: 2048 },
    { label: 'GPT-3 (Curie)', value: 'curie', maxTokens: 2048 },
    { label: 'GPT-3 (Ada)', value: 'ada', maxTokens: 2048 }
]);

const updateValues = () => {
    getTemperaturePercentage(channelConfig.value.modelSettings?.temperature as number);
    getPresPenPercentage(channelConfig.value.modelSettings?.presencePenalty as number);
    getFreqPenPercentage(channelConfig.value.modelSettings?.frequencyPenalty as number);
    getTemperatureValue(temperaturePercentage.value as number);
    getPresPenValue(presPenPercentage.value as number);
    getFreqPenValue(freqPenPercentage.value as number);
};

const initChannelConfigSearchFilters = () => {
    channelConfigSearchFilters.value = {
        global: { value: null, matchMode: FilterMatchMode.CONTAINS }
    };
};

const initWorldSearchFilters = () => {
    worldSearchFilters.value = {
        global: { value: null, matchMode: FilterMatchMode.CONTAINS }
    };
};

const getTemperaturePercentage = (temperatureValue: number) => {
    temperaturePercentage.value = (temperatureValue * 100) / 2;
};

const getTemperatureValue = (temperaturePercentage: number) => {
    temperatureValue.value = (temperaturePercentage / 100) * 2;
};

const getPresPenPercentage = (presPenValue: number) => {
    presPenValue = presPenValue + 2;
    presPenPercentage.value = (presPenValue * 100) / 4 - 2;
};

const getPresPenValue = (presPenPercentage: number) => {
    presPenValue.value = (presPenPercentage / 100) * 4 - 2;
};

const getFreqPenPercentage = (freqPenValue: number) => {
    freqPenValue = freqPenValue + 2;
    freqPenPercentage.value = (freqPenValue * 100) / 4 - 2;
};

const getFreqPenValue = (freqPenPercentage: number) => {
    freqPenValue.value = (freqPenPercentage / 100) * 4 - 2;
};

const getLogitBiasPercentage = (logitBiasValue: number) => {
    logitBiasPercentage.value = (logitBiasValue + 100) * 0.5;
};

const getLogitBiasValue = (logitBiasPercentage: number) => {
    logitBiasValue.value = logitBiasPercentage / 0.5 - 100;
};

const addLogitBias = () => {
    let existingBiasIndex = channelConfig.value?.modelSettings?.logitBias?.findIndex((bias) => bias.decodedToken === logitBiasToken.value) ?? -1;
    if (existingBiasIndex > -1) {
        channelConfig.value!.modelSettings!.logitBias![existingBiasIndex].bias = logitBiasValue.value;
        channelConfig.value!.modelSettings!.logitBias![existingBiasIndex].text = `${logitBiasToken.value}:${logitBiasValue.value}`;
    } else {
        const tokenized = decodeTokens(logitBiasToken.value);
        tokenized.encodedTokens?.forEach((tokenId, index) => {
            channelConfig.value?.modelSettings?.logitBias?.push({
                text: `${tokenized.decodedTokens![index]}:${logitBiasValue.value}`,
                decodedToken: tokenized.decodedTokens![index],
                encodedToken: tokenId,
                bias: logitBiasValue.value
            });
        });
    }

    selectedLogitBias.value = {};
    logitBiasToken.value = '';
    logitBiasValue.value = 0;
    logitBiasPercentage.value = 50;
};

const removeLogitBias = () => {
    const logitBiases = channelConfig.value.modelSettings!.logitBias;
    const logitBiasToRemove = logitBiases?.findIndex((bias: LogitBias) => bias.encodedToken === selectedLogitBias.value.encodedToken) ?? -1;
    if (logitBiasToRemove > -1) {
        logitBiases?.splice(logitBiasToRemove, 1);
    }

    selectedLogitBias.value = {};
    logitBiasValue.value = 0;
    logitBiasToken.value = '';
    logitBiasPercentage.value = 50;
};

const selectLogitBias = () => {
    logitBiasToken.value = selectedLogitBias.value.decodedToken as string;
    logitBiasValue.value = selectedLogitBias.value.bias as number;
    getLogitBiasPercentage(logitBiasValue.value);
};

const initPersonaSearchFilters = () => {
    personaSearchFilters.value = {
        global: { value: null, matchMode: FilterMatchMode.CONTAINS }
    };
};

const onStrictFilterChange = (event: any) => {
    channelConfig.value.moderationSettings!.id = event ? 'STRICT' : 'PERMISSIVE';
};

const checkForChanges = (): void => {
    if (JSON.stringify(channelConfig.value) !== JSON.stringify(props.channelConfig)) {
        isPendingChangePromptVisible.value = true;
        return;
    }

    sendClose();
};

const openWorld = (w: World): void => {
    world.value = w;
    isWorldDialogVisible.value = true;
};

const selectWorld = (w: World): void => {
    world.value = {};
    channelConfig.value.world = w;
    isWorldDialogVisible.value = false;
};

const closeWorld = (): void => {
    isWorldDialogVisible.value = false;
};

const openPersona = (p: Persona): void => {
    persona.value = p;
    isPersonaDialogVisible.value = true;
};

const selectPersona = (p: Persona): void => {
    persona.value = {};
    channelConfig.value.persona = p;
    isPersonaDialogVisible.value = false;
};

const closePersona = (): void => {
    isPersonaDialogVisible.value = false;
};

const sendClose = (): void => {
    isPendingChangePromptVisible.value = false;
    emit('onClose');
};

const sendDownload = (): void => {
    emit('onDownload', channelConfig.value);
};

const sendSave = (): void => {
    isPendingChangePromptVisible.value = false;
    channelConfig.value.modelSettings!.modelName = (channelConfig.value.modelSettings?.modelName as LabelItem).value;
    emit('onSave', channelConfig.value);
};

const sendClone = (): void => {
    emit('onClone', channelConfig.value);
};
</script>
<template>
    <Dialog header="Channel config" :modal="true" class="p-fluid">
        <div v-if="channelConfig.id" class="field">
            <label for="config-id">ID</label>
            <InputText id="config-id" v-model="channelConfig.id" disabled />
        </div>

        <div class="field">
            <label for="config-name">Configuration name <strong :style="{ color: 'red' }">*</strong></label>
            <InputText :disabled="!canEdit" id="config-name" v-model="channelConfig.name" required="true" autofocus :class="{ 'p-invalid': channelConfigSubmitted && !channelConfig.name }" />
            <small class="p-invalid" v-if="channelConfigSubmitted && !channelConfig.name">Configuration name is required.</small>
        </div>

        <div class="field">
            <label
                for="ai-model"
                v-tooltip="
                    `Models available to be used.
                                Different models have different behaviors and react differently to how personas and worlds and general content is written. Bear this in mind when writing content.`
                "
            >
                AI Model <strong :style="{ color: 'red' }">*</strong> <i class="pi pi-info-circle" />
            </label>
            <Dropdown :disabled="!canEdit" id="ai-model" v-model="channelConfig.modelSettings!.modelName" :options="modelsAvailable" optionLabel="label" :class="{ 'p-invalid': channelConfigSubmitted && !channelConfig.modelSettings!.modelName }" />
            <small class="p-invalid" v-if="channelConfigSubmitted && !channelConfig.modelSettings!.modelName">AI model is required.</small>
            <div class="col-12 md:col-4">
                <div class="field-checkbox mb-0">
                    <Checkbox :disabled="!canEdit" binary id="strict-filter" name="strict-filter" :model-value="channelConfig.moderationSettings?.id === 'STRICT'" @input="onStrictFilterChange" />
                    <label
                        for="strict-filter"
                        v-tooltip="
                            `This applies stricter filters to both inputs and outputs.
                                        Content will be flagged when any topic of OpenAI's moderation filters is triggered. Optimal for settings where safer content is required.`
                        "
                    >
                        Strict filtering <i class="pi pi-info-circle" />
                    </label>
                </div>
            </div>
        </div>

        <div class="field">
            <div class="grid formgrid">
                <div class="col-12 mb-2 lg:col-4 lg:mb-0">
                    <label
                        for="temperature"
                        v-tooltip="
                            `This value is required. Defaults to 0.8.
                                        Randomness of the outputs generated by the AI. The closer to 0, the closer to the AI's training dataset.
                                        We do not recommend going over 1.2, as the AI might spit nonsensical gibberish.`
                        "
                    >
                        Randomness <strong :style="{ color: 'red' }">*</strong> <i class="pi pi-info-circle" />
                    </label>
                    <InputNumber :disabled="!canEdit" id="temperature" :allowEmpty="false" :maxFractionDigits="1" :min="0.1" :max="2" v-model.number="temperatureValue" @update:modelValue="getTemperaturePercentage(temperatureValue)" />
                    <Slider :disabled="!canEdit" v-model="temperaturePercentage" @update:modelValue="getTemperatureValue(temperaturePercentage)" />
                </div>
                <div class="col-12 mb-2 lg:col-4 lg:mb-0">
                    <label
                        for="name"
                        v-tooltip="
                            `This value is required. Defaults to 100. The amount of tokens (considering both input and output) to be processed by the AI.
                                        Maximum number depends on model selected. We do not recommend providing a value higher than half of what the model supports, especially for smaller models.
                                        Maximum allowed for the selected model: ${channelConfig.modelSettings!.modelName?.maxTokens ?? 0}`
                        "
                    >
                        Max tokens <strong :style="{ color: 'red' }">*</strong> <i class="pi pi-info-circle" />
                    </label>
                    <InputNumber
                        :disabled="!canEdit"
                        v-model.number="channelConfig.modelSettings!.maxTokens"
                        :min="100"
                        :max="channelConfig.modelSettings!.modelName?.maxTokens"
                        :class="{ 'p-invalid': channelConfigSubmitted && !channelConfig.modelSettings!.maxTokens }"
                    />
                    <small class="p-invalid" v-if="channelConfigSubmitted && !channelConfig.modelSettings!.maxTokens">Max token count is required.</small>
                </div>
                <div class="col-12 mb-2 lg:col-4 lg:mb-0">
                    <label
                        for="name"
                        v-tooltip="
                            `This value is required.
                                        Amount of messages in the channel that will be used as the AI's memory. Defaults to 10. Can't be lower than 5 or higher than 20.`
                        "
                    >
                        Message history number <strong :style="{ color: 'red' }">*</strong> <i class="pi pi-info-circle" />
                    </label>
                    <InputNumber :disabled="!canEdit" v-model.number="channelConfig.modelSettings!.chatHistoryMemory" :min="5" :max="20" :class="{ 'p-invalid': channelConfigSubmitted && !channelConfig.modelSettings!.chatHistoryMemory }" />
                    <small class="p-invalid" v-if="channelConfigSubmitted && !channelConfig.modelSettings!.chatHistoryMemory">Message history count is required.</small>
                </div>
            </div>
        </div>

        <div class="field">
            <div class="grid formgrid"></div>
        </div>

        <div class="card" v-if="channelConfigs">
            <Panel header="Advanced settings (optional)" :toggleable="true" :collapsed="true">
                <div class="field">
                    <div class="grid formgrid">
                        <div class="col-12 mb-2 lg:col-6 lg:mb-0">
                            <label
                                for="pres-pen"
                                v-tooltip="
                                    `This value is optional. Defaults to 0.
                                        This defines how much the presence of tokens in the input will influence the AI's output.
                                        The higher the value, the higher the chance of tokens that have not appeared yet to be generated in the outputs.`
                                "
                            >
                                Presence penalty <i class="pi pi-info-circle" />
                            </label>
                            <InputNumber :disabled="!canEdit" id="pres-pen" :maxFractionDigits="1" :min="-2" :max="2" v-model.number="presPenValue" @update:modelValue="getPresPenPercentage(presPenValue)" />
                            <Slider :disabled="!canEdit" v-model="presPenPercentage" @update:modelValue="getPresPenValue(presPenPercentage)" />
                        </div>
                        <div class="col-12 mb-2 lg:col-6 lg:mb-0">
                            <label for="freq-pen" v-tooltip="'This value is optional. Defaults to 0. This penalizes the AI for repeating the same tokens too many times. The higher the value, the less the AI will repeat the same tokens.'">
                                Frequency penalty <i class="pi pi-info-circle" />
                            </label>
                            <InputNumber :disabled="!canEdit" id="freq-pen" :maxFractionDigits="1" :min="-2" :max="2" v-model.number="freqPenValue" @update:modelValue="getFreqPenPercentage(freqPenValue)" />
                            <Slider :disabled="!canEdit" v-model="freqPenPercentage" @update:modelValue="getFreqPenValue(freqPenPercentage)" />
                        </div>
                    </div>
                </div>
                <div class="field">
                    <div class="grid formgrid">
                        <div class="col-12 mb-2 lg:col-12 lg:mb-0">
                            <label
                                for="stop-sequences"
                                v-tooltip="
                                    `This value is optional. Up to 4 sequences.
                                        Once these values appear in an output, the AI will stop generating more text.`
                                "
                            >
                                Stop sequences <i class="pi pi-info-circle" />
                            </label>
                            <Chips :disabled="!canEdit" id="stop-sequences" v-model="channelConfig.modelSettings!.stopSequence" :max="4" />
                        </div>
                    </div>
                </div>
                <div class="field">
                    <div class="grid formgrid">
                        <div class="col-12 mb-2 lg:col-12 lg:mb-0">
                            <label
                                for="logit-bias"
                                v-tooltip="
                                    `This value is optional.
                                        Likelihood of a token appearing in outputs. Ranges from -100 to 100. -100 means an exclusive ban of the supplied token, and 100 means it will always appear.`
                                "
                            >
                                Logit bias <i class="pi pi-info-circle" />
                            </label>
                            <Dropdown :disabled="!canEdit" id="logit-bias" v-model="selectedLogitBias" :options="channelConfig.modelSettings!.logitBias" optionLabel="text" placeholder="Existing logit biases" @update:modelValue="selectLogitBias" />
                            <InputText :disabled="!canEdit" id="logit-bias-token" v-model="logitBiasToken" placeholder="Logit bias token" />
                            <Slider :disabled="!canEdit" v-model="logitBiasPercentage" @update:modelValue="getLogitBiasValue(logitBiasPercentage)" />
                            <InputNumber :disabled="!canEdit" id="logit-bias-bias" :maxFractionDigits="0" :min="-100" :max="100" v-model.number="logitBiasValue" @update:modelValue="getLogitBiasPercentage(logitBiasValue)" />
                        </div>
                    </div>
                    <div class="field">
                        <div class="grid formgrid">
                            <div class="col-12 mb-2 lg:col-6 lg:mb-0">
                                <Button v-if="canEdit" class="p-button-primary" label="Add/update logit bias" @click="addLogitBias" />
                            </div>
                            <div class="col-12 mb-2 lg:col-6 lg:mb-0">
                                <Button v-if="canEdit" class="p-button-danger" label="Remove logit bias" @click="removeLogitBias" />
                            </div>
                        </div>
                    </div>
                </div>
            </Panel>
        </div>

        <div class="card" v-if="channelConfigs">
            <Panel header="Persona" :toggleable="true" :collapsed="true">
                <PersonaCardView v-if="!canEdit && Object.getOwnPropertyNames(channelConfig.persona).length > 0" :persona="(channelConfig.persona as Persona)" @onOpen="openPersona" />
                <TabView v-if="canEdit">
                    <TabPanel header="Card view">
                        <PersonaDataView :personas="personas" :selectedPersona="channelConfig.persona" :isViewOnly="true" @onOpen="openPersona" />
                    </TabPanel>
                    <TabPanel header="Table view">
                        <PersonaDataTable :personas="personas" :selectedPersona="channelConfig.persona" :isViewOnly="true" @onOpen="openPersona" />
                    </TabPanel>
                </TabView>
            </Panel>
        </div>

        <div class="card" v-if="channelConfigs">
            <Panel header="World" :toggleable="true" :collapsed="true">
                <WorldCardView v-if="!canEdit && Object.getOwnPropertyNames(channelConfig.world).length > 0" :world="(channelConfig.world as World)" @onOpen="openWorld" />
                <TabView v-if="canEdit">
                    <TabPanel header="Card view">
                        <WorldDataView :worlds="worlds" :selectedWorld="channelConfig.world" :isViewOnly="true" @onOpen="openWorld" />
                    </TabPanel>
                    <TabPanel header="Table view">
                        <WorldDataTable :worlds="worlds" :selectedWorld="channelConfig.world" :isViewOnly="true" @onOpen="openWorld" />
                    </TabPanel>
                </TabView>
            </Panel>
        </div>

        <template #footer>
            <Toolbar class="mb-4">
                <template v-slot:start>
                    <div class="my-2">
                        <Button label="Cancel" icon="pi pi-times" class="p-button-danger" @click="checkForChanges" />
                    </div>
                </template>
                <template v-slot:end>
                    <Button v-if="channelConfig.id" label="Clone" icon="pi pi-copy" class="p-button-text" @click="sendClone" />
                    <Button v-if="channelConfig.id" label="Download" icon="pi pi-download" class="p-button-text" @click="sendDownload" />
                    <Button v-if="canEdit" label="Save" icon="pi pi-check" class="p-button-primary" @click="sendSave" />
                </template>
            </Toolbar>
        </template>
        <PersonaDialog v-model:visible="isPersonaDialogVisible" :persona="persona" :allow-selection="true" @onClose="closePersona" @onSelect="selectPersona" />
        <WorldDialog v-model:visible="isWorldDialogVisible" :world="world" :allow-selection="true" @onClose="closeWorld" @onSelect="selectWorld" />
        <ConfirmIgnoreChangesDialog v-model:visible="isPendingChangePromptVisible" @onConfirm="sendClose" @onCancel="isPendingChangePromptVisible = false" />
    </Dialog>
</template>
