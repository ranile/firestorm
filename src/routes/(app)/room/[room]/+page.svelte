<script lang='ts'>
  import type { PageData } from './$types';
  import { Heading, Textarea, ToolbarButton } from 'flowbite-svelte';

  export let data: PageData;
  let value = '';
  $: {
    console.log(value);
  }
</script>

<div class='grid h-full grid-cols-1'>
  <h1 class='text-2xl font-bold '>{data.room.name}</h1>
  <div class='row-start-auto'>
    <div class='flex p-4 sm:p-6 items-center gap-2'>
      <img
        src='https://unsplash.com/photos/IF9TK5Uy-KI/download?ixid=MnwxMjA3fDB8MXxzZWFyY2h8Nnx8YXZhdGFyfGVufDB8fHx8MTY4MTYzMTgwOQ&force=true&w=640'
        alt='avatar' class='w-10 h-10 rounded-full' />
      <p class='font-normal text-gray-700 dark:text-gray-400 leading-tight'>
        Here are the biggest enterprise technology acquisitions of 2021 so far, in reverse chronological order.
      </p>
    </div>
  </div>
  <div class='self-end mb-4 p-2 flex gap-2'>
    <Textarea bind:value class='' rows='1' placeholder='Your message...' />
    <ToolbarButton type='submit' color='blue' class='rounded-full text-blue-600 dark:text-blue-500'>
      <svg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke-width='1.5' stroke='currentColor'
           class='w-6 h-6'>
        <path stroke-linecap='round' stroke-linejoin='round'
              d='M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5' />
      </svg>
      <span class='sr-only'>Send message</span>
    </ToolbarButton>
  </div>
</div>

<style>
    div.grid {
        grid-template-rows: 3rem 1fr 5rem;
    }
</style>