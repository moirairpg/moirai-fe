<script setup lang="ts">
import Persona from '@/types/persona/Persona';

const emit: any = defineEmits(['onImport', 'onCancel']);

const upload = async (event: any): Promise<void> => {
    await event.files.forEach(async (file: File): Promise<void> => {
        const reader: FileReader = new FileReader();
        reader.onload = async (res: ProgressEvent<FileReader>) => {
            try {
                const persona: Persona = JSON.parse(res?.target?.result as string);
                if (!persona) {
                    console.error('An error occured while uploading persona');
                }

                await emit('onImport', { persona, file });
            } catch (error: any) {
                console.error(`An error occured while parsing JSON file for persona upload -> ${JSON.stringify(error, null, 2)}`);
            }
        };

        reader.onerror = (error: any) => {
            console.log(error);
        };

        reader.readAsText(file);
    });
};

const closeWindow = (): void => {
    emit('onCancel');
};
</script>
<template>
    <Dialog header="Import" :modal="true">
        <FileUpload name="import[]" :customUpload="true" @uploader="upload" :multiple="true" accept="application/json" :maxFileSize="1000000" label="Import" chooseLabel="Import" class="mr-2 inline-block" />
        <template #footer>
            <Button label="Cancel" icon="pi pi-times" class="p-button-danger" @click="closeWindow" />
        </template>
    </Dialog>
</template>
