<script setup lang="ts">
const emit: any = defineEmits(['onConfirm', 'onCancel']);

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
            <span>There are pending changes. Are you sure you want to close the window? Unsaved changes will be discarded.</span>
        </div>
        <template #footer>
            <Button label="No" icon="pi pi-times" class="p-button-danger" @click="cancelDelete" />
            <Button label="Yes" icon="pi pi-check" class="p-button-primary" @click="confirmDelete" />
        </template>
    </Dialog>
</template>
