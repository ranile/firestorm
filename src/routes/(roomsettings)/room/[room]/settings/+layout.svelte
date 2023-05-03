<script lang="ts">
    import SidebarItem from '../../../../../lib/components/SideNav/SidebarItem.svelte';
    import AccountGroup from 'svelte-material-icons/AccountGroup.svelte';
    import Back from 'svelte-material-icons/ArrowLeft.svelte';
    import SideNav from '$lib/components/SideNavGeneric.svelte';
    import { page } from '$app/stores';
    import type { LayoutData } from './$types';

    export let data: LayoutData;

    $: activeUrl = $page.url.pathname;
    let heading = '';
    $: {
        if (activeUrl.includes('overview')) {
            heading = 'Overview';
        } else if (activeUrl.includes('members')) {
            heading = 'Members';
        }
    }

    $: toNavigateBase = `/room/${data.room.id}/settings/`;
    // let count = 0;
    // <button on:click={() => count = count + 1}>{count}</button>
</script>

<SideNav>
    <svelte:fragment slot="navbar">
        <h2 class="text-xl font-bold px-4 py-2">{heading}</h2>
    </svelte:fragment>

    <svelte:fragment slot="sidebar-header">
        <a class="text-2xl" href={`/room/${data.room.id}`}>
            <Back />
        </a>
    </svelte:fragment>

    <svelte:fragment slot="sidebar-content">
        <SidebarItem
            label="Overview"
            active={$page.url.pathname.includes('overview')}
            href={toNavigateBase + 'overview'}
        >
            <svelte:fragment slot="icon">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 96 960 960"
                    width="24"
                    height="24"
                    class="fill-white"
                >
                    <path
                        d="m800 922 28-28-75-75V707h-40v128l87 87Zm-67 93q-78 0-133-55.5T545 828q0-78 55-133.5T733 639q77 0 132.5 55.5T921 828q0 76-55.5 131.5T733 1015ZM280 436h400v-60H280v60Zm230 500H180q-25 0-42.5-17.5T120 876V276q0-25 17.5-42.5T180 216h600q25 0 42.5 17.5T840 276v329q-25-13-52-19t-55-6q-14 0-27 1.5t-26 4.5v-40H280v60h344q-36 18-64.5 46.5T513 716H280v60h211q-3 13-4.5 26t-1.5 27q0 29 6 55t19 52Z"
                    />
                </svg>
            </svelte:fragment>
        </SidebarItem>

        <SidebarItem
            label="Members"
            active={$page.url.pathname.includes('members')}
            href={toNavigateBase + 'members'}
        >
            <AccountGroup slot="icon" size="1.5em" />
        </SidebarItem>
    </svelte:fragment>
    <slot />
</SideNav>
