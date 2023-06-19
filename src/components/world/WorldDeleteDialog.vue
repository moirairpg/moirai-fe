<script setup lang="ts">
import { Ref, ref, watch } from 'vue';
import World from '@/types/world/World';

interface Props {
    world: World;
}

const emit: any = defineEmits(['onConfirm', 'onCancel']);
const props: Readonly<Props> = defineProps<Props>();

const world: Ref<World> = ref(props.world);

watch(
    () => props.world,
    (selectedWorld) => {
        world.value = selectedWorld;
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
            <span> Are you sure you want to delete {{ world.name }}? </span>
        </div>
        <template #footer>
            <Button label="No" icon="pi pi-times" class="p-button-danger" @click="cancelDelete" />
            <Button label="Yes" icon="pi pi-check" class="p-button-primary" @click="confirmDelete" />
        </template>
    </Dialog>
</template>
