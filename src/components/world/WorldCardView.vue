<script setup lang="ts">
import { Ref, ref, watch } from 'vue';
import World from '@/types/world/World';

const emit: any = defineEmits(['onDelete', 'onDeleteBulk', 'onCreate', 'onImport', 'onOpen']);
const props: Readonly<Props> = defineProps<Props>();

interface Props {
    world: World;
}

watch(
    () => props.world,
    (newWorld: World) => {
        world.value = newWorld;
    }
),
    { immediate: true, deep: true };

const world: Ref<World> = ref(props.world);

const sendOpen = (world: World): void => {
    emit('onOpen', world);
};
</script>
<template>
    <div class="col-12">
        <div class="flex flex-column xl:flex-row xl:align-items-start p-4 gap-4">
            <div class="flex flex-column sm:flex-row justify-content-between align-items-center xl:align-items-start flex-1 gap-4">
                <div class="flex flex-column align-items-center sm:align-items-start gap-3">
                    <div class="text-2xl font-bold text-900">{{ world.name }}</div>
                    <div class="mb-3">{{ world.description }}</div>
                    <div class="flex align-items-center gap-3">
                        <span class="flex align-items-center gap-2">
                            <i class="pi pi-user"></i>
                            <span class="font-semibold">{{ world.ownerData!.username }}</span>
                        </span>
                    </div>
                </div>
                <div class="flex sm:flex-column align-items-center sm:align-items-end gap-3 sm:gap-2">
                    <Button icon="pi pi-eye" class="p-button-rounded p-button-success mr-2" @click="sendOpen(world)" />
                </div>
            </div>
        </div>
    </div>
</template>
