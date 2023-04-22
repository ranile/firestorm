<script>
    import { Button, Checkbox, Input, Label } from 'flowbite-svelte';
</script>

<form class='flex flex-col space-y-6 p-2' action='/'>
    <h3 class='text-xl font-medium text-gray-900 dark:text-white p-0'>Log in</h3>
    <Label class='space-y-2'>
        <span>Your email</span>
        <Input type='email' name='email' placeholder='user@example.com' required />
    </Label>
    <Label class='space-y-2'>
        <span>Your password</span>
        <Input type='password' name='password' placeholder='•••••' required />
    </Label>
    <div class='flex flex-col md:flex-row gap-3 items-start'>
        <Checkbox>Remember me</Checkbox>
        <a href='/' class='text-sm text-blue-700 hover:underline dark:text-blue-500'>Forgot password?</a>
    </div>
    <Button type='submit' class='w-full1'>Sign in</Button>
    <p class='text-sm font-light text-gray-500 dark:text-gray-400'>
        Don’t have an account yet? <a
        href='/'
        class='font-medium text-primary-600 hover:underline dark:text-primary-500'>Sign up</a
    >
    </p>
</form>