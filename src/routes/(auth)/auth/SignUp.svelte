<script lang="ts">
    import { Button, Input, Label } from 'flowbite-svelte';
    import { signup, view } from './utils';
    import type { Supabase } from '../../../lib/supabase';

    export let supabase: Supabase;
    const onSubmit = async (e: SubmitEvent) => {
        const data = new FormData(e.target as HTMLFormElement);
        const username = data.get('username') as string;
        const email = data.get('email') as string;
        const password = data.get('password') as string;

        signup(supabase, username, email, password);
    };

    const loginView = (e: MouseEvent) => {
        e.preventDefault();
        view.set('sign-in');
    };
</script>

<form class="flex flex-col space-y-6 p-2" action="/" on:submit|preventDefault={onSubmit}>
    <h3 class="text-xl font-medium text-gray-900 dark:text-white p-0">Create an account</h3>
    <Label class="space-y-2">
        <span>Your username</span>
        <Input type="username" name="username" placeholder="your-unique-username" required />
    </Label>
    <Label class="space-y-2">
        <span>Your email</span>
        <Input type="email" name="email" placeholder="user@example.com" required />
    </Label>
    <Label class="space-y-2">
        <span>Your password</span>
        <Input type="password" name="password" placeholder="•••••" required />
    </Label>
    <Button type="submit" class="w-full1">Sign up</Button>
    <p class="text-sm font-light text-gray-500 dark:text-gray-400">
        Already have an account?
        <a
            href="/"
            class="font-medium text-primary-600 hover:underline dark:text-primary-500"
            on:click={loginView}
        >
            Sign in
        </a>
    </p>
</form>
