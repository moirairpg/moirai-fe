<script setup>
import { ref } from 'vue';
import decodeTokens from '../resources/tokenizer';

const pipe = ref(false);
const colors = ref(null);
const text = ref(null);
const processedTokens = ref(null);
const processTokens = (event) => {
    processedTokens.value = decodeTokens(event.target.value);
    colors.value = processedTokens.value.trueColors;
};

const trueColors = () => {
    pipe.value = false;
    colors.value = processedTokens.value.trueColors;
};

const protanopia = () => {
    pipe.value = false;
    colors.value = processedTokens.value.protanopia;
};

const deuteranopia = () => {
    pipe.value = false;
    colors.value = processedTokens.value.deuteranopia;
};

const tritanopia = () => {
    pipe.value = false;
    colors.value = processedTokens.value.tritanopia;
};

const pipeSeparator = () => {
    pipe.value = true;
};
</script>

<template>
    <div class="grid p-fluid">
        <div class="col-12">
            <div class="card">
                <h5>Tokenizer</h5>
                <div class="grid formgrid">
                    <div class="col-12 mb-2 lg:col-2 lg:mb-0 field">
                        <Button class="p-button-text" @click="trueColors">True colors</Button>
                    </div>
                    <div class="col-12 mb-2 lg:col-2 lg:mb-0 field">
                        <Button class="p-button-text" @click="protanopia">Protanopia</Button>
                    </div>
                    <div class="col-12 mb-2 lg:col-2 lg:mb-0 field">
                        <Button class="p-button-text" @click="deuteranopia">Deuteranopia</Button>
                    </div>
                    <div class="col-12 mb-2 lg:col-2 lg:mb-0 field">
                        <Button class="p-button-text" @click="tritanopia">Tritanopia</Button>
                    </div>
                    <div class="col-12 mb-2 lg:col-2 lg:mb-0 field">
                        <Button class="p-button-text" @click="pipeSeparator">Pipe separation</Button>
                    </div>
                </div>
                <div class="grid formgrid">
                    <div class="col-12 mb-2 lg:col-12 lg:mb-0 field">
                        <label for="text-to-tonekize">Text to be tokenized</label>
                        <Textarea autofocus v-model="text" id="text-to-tonekize" placeholder="Text to be tokenized" rows="5" cols="30" @input="processTokens" />
                    </div>
                    <div v-if="!pipe" class="col-12 mb-2 lg:col-12 lg:mb-0 field">
                        <label for="tokenized-text">Tokenized text</label>
                        <div
                            :style="{
                                display: 'flex',
                                flexWrap: 'wrap',
                                fontFamily: 'monospace',
                                width: '100%',
                                height: '200px',
                                overflowY: 'auto',
                                padding: '8px',
                                border: '1px solid #ccc',
                                lineHeight: '1.5',
                                alignContent: 'flex-start'
                            }"
                        >
                            <span v-for="(token, index) in processedTokens?.decodedTokens">
                                <span
                                    :style="{
                                        backgroundColor: colors[index % colors.length],
                                        padding: '0 0px',
                                        marginRight: '0px',
                                        marginBottom: '4px',
                                        display: 'inline-block',
                                        height: '1.5em'
                                    }"
                                >
                                    {{ token }}
                                </span>
                            </span>
                        </div>
                    </div>
                    <div v-if="pipe" class="col-12 mb-2 lg:col-12 lg:mb-0 field">
                        <label for="tokenized-text">Tokenized text</label>
                        <div
                            :style="{
                                display: 'flex',
                                flexWrap: 'wrap',
                                fontFamily: 'monospace',
                                width: '100%',
                                height: '200px',
                                overflowY: 'auto',
                                padding: '8px',
                                border: '1px solid #ccc',
                                lineHeight: '1.5',
                                alignContent: 'flex-start'
                            }"
                        >
                            <span v-for="(token, index) in processedTokens?.decodedTokens">
                                <template v-if="index > 0">|</template>
                                <span>
                                    {{ token }}
                                </span>
                            </span>
                        </div>
                    </div>
                    <div class="col-12 mb-2 lg:col-12 lg:mb-0 field">
                        <label for="tokenized-text">Token IDs</label>
                        <div
                            :style="{
                                display: 'flex',
                                flexWrap: 'wrap',
                                fontFamily: 'monospace',
                                width: '100%',
                                height: '200px',
                                overflowY: 'auto',
                                padding: '8px',
                                border: '1px solid #ccc',
                                lineHeight: '1.5',
                                alignContent: 'flex-start'
                            }"
                        >
                            <span v-for="(token, index) in processedTokens?.encodedTokens" :style="{ display: 'inline-block' }">
                                <template v-if="index > 0">, </template>
                                <span>
                                    {{ token }}
                                </span>
                            </span>
                        </div>
                    </div>
                </div>
                <div class="grid formgrid">
                    <div class="col-12 mb-2 lg:col-12 lg:mb-0 field">
                        <p>Tokens: {{ processedTokens?.tokens ?? 0 }}</p>
                        <p>Characters: {{ processedTokens?.characters ?? 0 }}</p>
                        <p>Words: {{ processedTokens?.words ?? 0 }}</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped lang="scss">
@import '@/assets/demo/styles/badges.scss';
</style>
