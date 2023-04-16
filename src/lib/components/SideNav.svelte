<script lang='ts'>
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import {
		Navbar,
		NavBrand,
		NavLi,
		NavUl,
		NavHamburger,
		Sidebar,
		SidebarGroup,
		SidebarItem,
		SidebarWrapper,
		Drawer,
		CloseButton,
	} from 'flowbite-svelte';
	import { sineIn } from 'svelte/easing';

	let transitionParams = {
		x: -320,
		duration: 200,
		easing: sineIn
	};
	let breakPoint = 1024;
	let width: number;
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
	let spanClass = 'pl-2 self-center text-md text-gray-900 whitespace-nowrap dark:text-white';
	let divClass = 'w-full md:block md:w-auto pr-8';
	let ulClass = 'flex flex-col p-4 mt-4 md:flex-row md:space-x-8 md:mt-0 md:text-lg md:font-medium';
</script>

<svelte:window bind:innerWidth={width} />
<Navbar let:hidden let:toggle>
    <NavHamburger on:click={toggleDrawer} btnClass='ml-3 lg:hidden' />
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
        <SidebarWrapper divClass='overflow-y-auto py-4 px-3 rounded dark:bg-gray-800'>
            <SidebarGroup>
                <SidebarItem
                    label='About'
                    href='/room/1'
                    {spanClass}
                    on:click={toggleSide}
                    active={activeUrl === '/room/1'}
                />
            </SidebarGroup>
        </SidebarWrapper>
    </Sidebar>
</Drawer>
<div class='flex px-4 mx-auto w-full'>
    <main class='lg:ml-72 w-full mx-auto'>
        <slot />
    </main>
</div>
