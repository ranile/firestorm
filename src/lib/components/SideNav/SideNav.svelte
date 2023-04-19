<script lang='ts'>
    import { page } from '$app/stores';
    import { onMount } from 'svelte';
    import {
        Navbar,
        NavHamburger,
        Sidebar,
        SidebarGroup,
        SidebarItem,
        SidebarWrapper,
        Drawer,
        CloseButton, Button
    } from 'flowbite-svelte';
    import { sineIn } from 'svelte/easing';
    import { rooms } from '../../db/rooms';
    import Plus from "svelte-material-icons/Plus.svelte";
    import ProfileDropdown from '../ProfileDropdown.svelte';
    import CreateRoomModal from './CreateRoomModal.svelte';
    import { createRoomModalState } from './store';

    export let signout: () => void;


    let transitionParams = {
        x: -320,
        duration: 200,
        easing: sineIn
    };
    let breakPoint = 1024;
    let width = 0;
    let backdrop = false;
    let activateClickOutside = true;
    let drawerHidden = false;
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
    const toggleSide = () => {
        if (width < breakPoint) {
            drawerHidden = !drawerHidden;
        }
    };
    const toggleDrawer = () => {
        drawerHidden = false;
    };
    $: activeUrl = $page.url.pathname;

</script>

<svelte:window bind:innerWidth={width} />
<Navbar let:hidden let:toggle navClass='lg:hidden'>
    <NavHamburger on:click={toggleDrawer} btnClass='ml-3' />
</Navbar>
<Drawer
    transitionType='fly'
    {backdrop}
    {transitionParams}
    bind:hidden={drawerHidden}
    bind:activateClickOutside
    width='w-64'
    class='overflow-scroll pb-32'
    id='sidebar'
>
    <div class='flex items-center'>
        <CloseButton on:click={() => (drawerHidden = true)} class='mb-4 dark:text-white lg:hidden' />
    </div>
    <Sidebar asideClass='w-54'>
        <SidebarWrapper divClass='overflow-y-auto py-4 px-3 rounded dark:bg-gray-800 flex flex-col gap-2'>
            <SidebarGroup ulClass='flex justify-between px-4'>
                <ProfileDropdown signout={signout} />
                <Button pill={true} on:click={() => createRoomModalState.set(true)}>
                    <Plus />
                </Button>
            </SidebarGroup>
            <SidebarGroup>
                {#each $rooms as room (room.id)}
                    <SidebarItem
                        label={room.name}
                        href={`/room/${room.id}`}
                        spanClass='pl-2 self-center text-md text-gray-900 whitespace-nowrap dark:text-white'
                        on:click={toggleSide}
                        active={activeUrl === `/room/${room.id}`}
                    />
                {/each}
            </SidebarGroup>
        </SidebarWrapper>
    </Sidebar>
</Drawer>

<CreateRoomModal />

<main class='lg:ml-72 h-full mx-auto'>
    <slot />
</main>