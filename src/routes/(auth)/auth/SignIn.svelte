<script lang="ts">
    import { Button, Checkbox, Input, Label } from 'flowbite-svelte';
    import { signin, view } from './utils';

    export let supabase;
    const onSubmit = async (e) => {
        const data = new FormData(e.target);
        const email = data.get('email') as string;
        const password = data.get('password') as string;

        signin(supabase, email, password).then(console.log);
    };


    const signupView = (e: MouseEvent) => {
        e.preventDefault();
        view.set('sign-up');
    };

</script>

<form class='flex flex-col space-y-6 p-2' action='/' on:submit|preventDefault={onSubmit}>
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
        Don’t have an account yet?
        <a
            href='/auth#'
            on:click|preventDefault={signupView}
            class='font-medium text-primary-600 hover:underline dark:text-primary-500'
        >
            Sign up
        </a>
    </p>
</form>