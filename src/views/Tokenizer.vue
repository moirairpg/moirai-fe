<script setup lang="ts">
import { Ref, ref } from 'vue';
import { decodeTokens } from '@/resources/tokenizer';

import TokenProps from '@/types/TokenProps';

const text: Ref<string> = ref('');
const stringifiedTokens: Ref<string> = ref('');
const stringifiedTokenIds: Ref<string> = ref('');
const processedTokens: Ref<TokenProps> = ref({});
const processTokens = (event: any): void => {
    processedTokens.value = decodeTokens(event.target.value);
    stringifyTokens();
    stringifyTokenIds();
};

const stringifyTokens = (): void => {
    stringifiedTokens.value = processedTokens?.value.decodedTokens?.join('|') as string;
};

const stringifyTokenIds = (): void => {
    stringifiedTokenIds.value = processedTokens?.value.encodedTokens?.join(', ') as string;
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
                        <Textarea disabled v-model="stringifiedTokens" id="text-to-tonekize" placeholder="Text to be tokenized" rows="5" cols="30" />
                    </div>
                    <div class="col-12 mb-2 lg:col-12 lg:mb-0 field">
                        <label for="tokenized-text">Token IDs</label>
                        <Textarea disabled v-model="stringifiedTokenIds" id="text-to-tonekize" placeholder="Text to be tokenized" rows="5" cols="30" />
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
