<script lang="ts">
    import { onMount } from 'svelte';
    import MediaQuery from 'svelte-media-queries';
    import { NavHamburger, CloseButton } from 'flowbite-svelte';
    import { sineIn } from 'svelte/easing';
    import { slide } from 'svelte/transition';
    import { clickOutside } from '$lib/utils';
    import Back from 'svelte-material-icons/ArrowLeft.svelte';

    let transitionParams = {
        x: -320,
        duration: 200,
        easing: sineIn
    };
    let breakPoint = 1024;
    let width = 0;
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
    const toggleDrawer = () => {
        drawerHidden = !drawerHidden;
    };
    let isLarge = true;
    export let id = 'sidebar-drawer';
    export let heading = '';
    export let goBackTo: string | undefined = undefined;
</script>

<MediaQuery query="(min-width: 1024px)" bind:matches={isLarge} />

<svelte:window bind:innerWidth={width} />
{#if !drawerHidden}
    <div
        use:clickOutside={() => !isLarge && !drawerHidden && toggleDrawer()}
        class="overflow-x-hidden overflow-y-auto z-50 p-4 bg-white dark:bg-gray-800 w-64 fixed inset-y-0 left-0 overflow-scroll w-64 pb-32 dark:bg-gray-900"
        transition:slide={transitionParams}
        tabindex="-1"
        {id}
        aria-controls={id}
        aria-labelledby={id}
    >
        <div class="flex items-center">
            <CloseButton
                on:click={() => (drawerHidden = true)}
                class="mb-4 dark:text-white lg:hidden"
            />
        </div>
        <aside class="w-56">
            <div class="overflow-y-auto py-4 px-3 rounded dark:bg-gray-900 flex flex-col gap-2">
                <div class="flex justify-between">
                    {#if goBackTo !== undefined}
                        <a class="text-2xl" href={goBackTo}>
                            <Back />
                        </a>
                    {/if}
                    <slot name="sidebar-header" />
                </div>
                <div class="flex flex-col gap-2">
                    <slot name="sidebar-content" />
                </div>
                <slot name="sidebar-extras" />
            </div>
        </aside>
    </div>
{/if}

<main class="lg:ml-64 mx-auto">
    <nav
        class="bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 border-gray-100 dark:border-gray-700 h-12 flex items-center"
    >
        <NavHamburger on:click={toggleDrawer} btnClass="max-lg:ml-3 lg:hidden" />
        <slot name="navbar">
            <h2 class="text-xl font-bold px-4 py-2">{heading}</h2>
        </slot>
    </nav>
    <slot />
</main>

<style lang="postcss">
    main {
        height: calc(100% - theme(height.12));
    }
</style>
