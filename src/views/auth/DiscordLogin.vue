<script>
import discordService from '@/service/DiscordService';

export default {
    async mounted() {
        const urlParams = new URLSearchParams(window.location.search);
        const authCode = urlParams.get('code');
        await discordService.authenticate(authCode);

        this.$router.push('/');
    }
};
</script>
