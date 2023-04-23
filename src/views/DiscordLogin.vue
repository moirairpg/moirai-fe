<script>
import DiscordService from '@/service/DiscordService';

const discordService = new DiscordService();

export default {
    async mounted() {
        const urlParams = new URLSearchParams(window.location.search);
        const authCode = urlParams.get('code');
        await discordService.retrieveToken(authCode);
        await discordService.retrieveSelfUserData();

        console.log(`Logged -> ${this.$store.getters.isLoggedIn}`)
        this.$router.push('/');
        // window.location.replace('/');
    }
};
</script>
