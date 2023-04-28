<script>
    export let href;
    export let label;
    export let active;

</script>
<a
    {href}
    class={`
    flex items-center p-2 text-base font-normal text-gray-900 rounded-lg
    dark:text-white hover:bg-gray-100 and dark:hover:bg-gray-700
    ${active ? 'bg-gray-200 dark:bg-gray-700' : ''}
    `}>
    <slot name='icon' />
    <span class='ml-3'>{label}</span>
</a>

