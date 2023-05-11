<script setup>
import { ref, onMounted, onBeforeMount } from 'vue';
import { encode, decodeGenerator } from 'gpt-tokenizer';

const text = ref(null);
const decodedTokens = ref([]);
const encodedTokens = ref(null);

onBeforeMount(() => {});

onMounted(() => {});

const pastelColors = ref(['rgba(107,64,216,.3)', 'rgba(104,222,122,.4)', 'rgba(244,172,54,.4)', 'rgba(239,65,70,.4)', 'rgba(39,181,234,.4)']);

const decodeTokens = (event) => {
    decodedTokens.value = [];
    text.value = event.target.value;
    encodedTokens.value = encode(text.value);

    for (const token of decodeGenerator(encodedTokens.value)) {
        decodedTokens.value.push(String(token).replaceAll(' ', '\u00A0').replaceAll('\n', '<newline>'));
    }
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
                        <Textarea v-model="text" id="text-to-tonekize" placeholder="Text to be tokenized" rows="5" cols="30" @input="decodeTokens" />
                    </div>
                    <div class="col-12 mb-2 lg:col-12 lg:mb-0 field">
                        <label for="tokenized-text">Tokenized text</label>
                        <div
                            :style="{
                                display: 'flex',
                                flexWrap: 'wrap',
                                fontFamily: monospace,
                                width: '100%',
                                height: '200px',
                                overflowY: 'auto',
                                padding: '8px',
                                border: '1px solid #ccc',
                                lineHeight: '1.5',
                                alignContent: 'flex-start'
                            }"
                        >
                            <span v-for="(token, index) in decodedTokens">
                                <span
                                    :style="{
                                        backgroundColor: pastelColors[index % pastelColors.length],
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
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped lang="scss">
@import '@/assets/demo/styles/badges.scss';
</style>
