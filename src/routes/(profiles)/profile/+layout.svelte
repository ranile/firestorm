<script lang="ts">
    import SidebarItem from '$lib/components/SideNav/SidebarItem.svelte';
    import AccountSettings from 'svelte-material-icons/AccountSettings.svelte';
    import Notifications from 'svelte-material-icons/Bell.svelte';
    import SideNav from '$lib/components/SideNavGeneric.svelte';

    let heading = '';
    const toNavigateBase = `/profile/`;
</script>

<SideNav {heading} goBackTo={{ href: '/', label: 'Home' }}>
    <svelte:fragment slot="sidebar-content">
        <SidebarItem label="Settings" href={toNavigateBase + 'settings'} bind:heading>
            <svelte:fragment slot="icon">
                <AccountSettings size="1.5em" />
            </svelte:fragment>
        </SidebarItem>

        <SidebarItem label="Notifications" href={toNavigateBase + 'notifications'} bind:heading>
            <Notifications slot="icon" size="1.5em" />
        </SidebarItem>
    </svelte:fragment>
    <slot />
</SideNav>
