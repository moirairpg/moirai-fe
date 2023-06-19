<script setup lang="ts">
import { Ref, ref, watch } from 'vue';
import ChannelConfiguration from '@/types/chconf/ChannelConfiguration';

interface Props {
    channelConfig: ChannelConfiguration;
}

const emit: any = defineEmits(['onConfirm', 'onCancel']);
const props: Readonly<Props> = defineProps<Props>();

const channelConfig: Ref<ChannelConfiguration> = ref(props.channelConfig);

watch(
    () => props.channelConfig,
    (selectedChannelConfiguration) => {
        channelConfig.value = selectedChannelConfiguration;
    }
),
    { immediate: true, deep: true };

const confirmDelete = () => {
    emit('onConfirm');
};

const cancelDelete = () => {
    emit('onCancel');
};
</script>
<template>
    <Dialog :style="{ width: '450px !important' }" header="Confirm" :modal="true">
        <div class="flex align-items-center justify-content-center">
            <i class="pi pi-exclamation-triangle mr-3" style="font-size: 2rem" />
            <span> Are you sure you want to delete {{ channelConfig.name }}? </span>
        </div>
        <template #footer>
            <Button label="No" icon="pi pi-times" class="p-button-danger" @click="cancelDelete" />
            <Button label="Yes" icon="pi pi-check" class="p-button-primary" @click="confirmDelete" />
        </template>
    </Dialog>
</template>
