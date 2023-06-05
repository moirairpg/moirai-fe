<script setup lang="ts">
import { Ref, ref } from 'vue';
import PersonaDialog from './persona/PersonaDialog.vue';
import Persona from '../types/persona/Persona';

const visible = ref(false);
const viewVisible = ref(false);
const persona: Ref<Persona> = ref({
    id: 'CHAT',
    name: 'ChatRPG',
    intent: 'chat',
    personality:
        'I am {0}, and I am a Discord chatbot. I exist in this server to be a friend of the people here.I will always be friendly to everyone, and never lack respect to them. Everyone here is my friend, and I am friends with everyone.I am not afraid to call people out when they mess with me, but I will remain friendly as long as everyone does.I am funny and playful, and I like to joke around and make puns\n',
    owner: '560204799925288962',
    visibility: 'public',
    nudge: {
        role: 'system',
        content: 'My name is {0}, and I am a Discord chatbot that exists in this server. I am friendly and funny and like to joke around. I will never stray from character.\n'
    },
    bump: {
        frequency: 0
    }
} as Persona);

const showPersonaWindow = () => {
    visible.value = true;
};

const hidePersonaWindow = () => {
    visible.value = false;
};

const showPersonaViewWindow = () => {
    viewVisible.value = true;
};

const hidePersonaViewWindow = () => {
    viewVisible.value = false;
};

const printPersona = (persona) => {
    console.log(`AAAAAAAAAAA -> ${JSON.stringify(persona, null, 2)}`);
};
</script>

<template>
    <div class="grid">
        <div class="col-12">
            <div class="card">
                <Button :onclick="showPersonaWindow">Show editable</Button>
                <Button :onclick="showPersonaViewWindow">Show disabled</Button>
                <PersonaDialog :persona="persona" :isOwner="persona.owner === '560204799925288962'" v-model:visible="visible" @onClose="hidePersonaWindow" @onSave="printPersona" />
                <PersonaDialog :persona="persona" :isOwner="persona.owner === 'aaaaa'" v-model:visible="viewVisible" @onClose="hidePersonaViewWindow" @onSave="printPersona" />
            </div>
        </div>
    </div>
</template>
