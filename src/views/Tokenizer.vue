<script setup lang="ts">
import { Ref, ref } from 'vue';
import { decodeTokens } from '@/resources/tokenizer';

import TokenProps from '@/types/TokenProps';

const text: Ref<string> = ref('');
const processedTokens: Ref<TokenProps> = ref({});
const processTokens = (event: any): void => {
    processedTokens.value = decodeTokens(event.target.value);
};
</script>

<template>
    <div class="grid p-fluid">
        <div class="col-12">
            <div class="card">
                <h5>Tokenizer</h5>
                <div class="grid formgrid">
                    <div class="col-12 mb-2 lg:col-12 lg:mb-0 field">
                        <label for="text-to-tonekize">Text to be tokenized</label>
                        <Textarea autofocus v-model="text" id="text-to-tonekize" placeholder="Text to be tokenized" rows="5" cols="30" @input="processTokens" />
                    </div>
                    <div class="col-12 mb-2 lg:col-12 lg:mb-0 field">
                        <label for="tokenized-text">Tokenized text</label>
                        <div
                            class="card"
                            :style="{
                                display: 'flex',
                                flexWrap: 'wrap',
                                fontFamily: 'monospace',
                                width: '100%',
                                height: '200px',
                                overflowY: 'auto',
                                padding: '8px',
                                border: '1px solid #ccc',
                                borderColor: '#3c3c3c',
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
                            class="card"
                            :style="{
                                display: 'flex',
                                flexWrap: 'wrap',
                                fontFamily: 'monospace',
                                width: '100%',
                                height: '200px',
                                overflowY: 'auto',
                                padding: '8px',
                                border: '1px solid #ccc',
                                borderColor: '#3c3c3c',
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
