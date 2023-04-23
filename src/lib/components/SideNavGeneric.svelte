<script lang='ts'>
    import { onMount } from 'svelte';
    import {
        Navbar,
        NavHamburger,
        Sidebar,
        SidebarGroup,
        SidebarWrapper,
        Drawer,
        CloseButton
    } from 'flowbite-svelte';
    import { sineIn } from 'svelte/easing';

    let transitionParams = {
        x: -320,
        duration: 200,
        easing: sineIn
    };
    let breakPoint = 1024;
    let width = 0;
    let backdrop = false;
    let activateClickOutside = true;
    export let drawerHidden = false;
    $: if (width >= breakPoint) {
        drawerHidden = false;
        activateClickOutside = false;
    } else {
        drawerHidden = true;
        activateClickOutside = true;
    }
    onMount(() => {
        if (width >= breakPoint) {
            drawerHidden = false;
            activateClickOutside = false;
        } else {
            drawerHidden = true;
            activateClickOutside = true;
        }
    });
    export const toggleSide = () => {
        if (width < breakPoint) {
            drawerHidden = !drawerHidden;
        }
    };
    const toggleDrawer = () => {
        drawerHidden = false;
    };

</script>

<svelte:window bind:innerWidth={width} />
<Drawer
    transitionType='fly'
    {backdrop}
    {transitionParams}
    bind:hidden={drawerHidden}
    bind:activateClickOutside
    width='w-64'
    class='overflow-scroll w-64 pb-32 dark:bg-gray-900'
    id='sidebar'
>
    <div class='flex items-center'>
        <CloseButton on:click={() => (drawerHidden = true)} class='mb-4 dark:text-white lg:hidden' />
    </div>
    <Sidebar asideClass='w-54'>
        <SidebarWrapper divClass='overflow-y-auto py-4 px-3 rounded dark:bg-gray-900 flex flex-col gap-2'>
            <SidebarGroup ulClass='flex justify-between px-4'>
                <slot name='sidebar-header' />
            </SidebarGroup>
            <SidebarGroup>
                <slot name='sidebar-content' />
            </SidebarGroup>
            <slot name='sidebar-extras' />
        </SidebarWrapper>
    </Sidebar>
</Drawer>


<main class='lg:ml-64 mx-auto'>
    <Navbar navClass='h-12'>
        <NavHamburger on:click={toggleDrawer} btnClass='ml-3 lg:hidden' />
        <slot name='navbar' />
    </Navbar>
    <slot />
</main>

<style lang="postcss">
    main {
        height: calc(100% - theme(height.12));
    }
</style>