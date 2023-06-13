<script setup lang="ts">
import { Ref, ref, watch, onBeforeMount } from 'vue';
import Persona from '@/types/persona/Persona';

const emit: any = defineEmits(['onDelete', 'onDeleteBulk', 'onCreate', 'onImport', 'onOpen']);
const props: Readonly<Props> = defineProps<Props>();

interface Props {
    persona: Persona;
}

watch(
    () => props.persona,
    (newPersona: Persona) => {
        persona.value = newPersona;
    }
),
    { immediate: true, deep: true };

const persona: Ref<Persona> = ref(props.persona);

const sendOpen = (persona: Persona): void => {
    emit('onOpen', persona);
};
</script>
<template>
    <div class="col-12">
        <div class="flex flex-column xl:flex-row xl:align-items-start p-4 gap-4">
            <div class="flex flex-column sm:flex-row justify-content-between align-items-center xl:align-items-start flex-1 gap-4">
                <div class="flex flex-column align-items-center sm:align-items-start gap-3">
                    <div class="text-2xl font-bold text-900">{{ persona.name }}</div>
                    <div class="mb-3">{{ persona.personality }}</div>
                    <div class="flex align-items-center gap-3">
                        <span class="flex align-items-center gap-2">
                            <i class="pi pi-user"></i>
                            <span class="font-semibold">{{ persona.ownerData!.username }}</span>
                        </span>
                    </div>
                </div>
                <div class="flex sm:flex-column align-items-center sm:align-items-end gap-3 sm:gap-2">
                    <Button icon="pi pi-eye" class="p-button-rounded p-button-success mr-2" @click="sendOpen(persona)" />
                </div>
            </div>
        </div>
    </div>
</template>
