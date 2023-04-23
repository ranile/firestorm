<script>
    import { SidebarItem } from 'flowbite-svelte';
    import SideNav from '$lib/components/SideNavGeneric.svelte';
</script>

<SideNav>
    <svelte:fragment slot='navbar'>
        <h2>Members</h2>
    </svelte:fragment>
    <svelte:fragment slot='sidebar-content'>
        <SidebarItem label='Members' active={true}>
            <svelte:fragment slot='icon'>
                <svg aria-hidden='true'
                     class='w-6 h-6 text-gray-400 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white'
                     fill='currentColor' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'>
                    <path d='M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z'></path>
                    <path d='M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z'></path>
                </svg>
            </svelte:fragment>
        </SidebarItem>

        <SidebarItem label='Overview' active={false}>
            <svelte:fragment slot='icon'>
                <svg aria-hidden='true'
                     class='w-6 h-6 text-gray-400 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white'
                     fill='currentColor' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'>
                    <path d='M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z'></path>
                    <path d='M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z'></path>
                </svg>
            </svelte:fragment>
        </SidebarItem>
    </svelte:fragment>

    <slot />
</SideNav>
