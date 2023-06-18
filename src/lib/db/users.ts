import type { Supabase } from '../supabase';
import type { Session } from '@supabase/supabase-js';
import { writable } from 'svelte/store';
import type { Database } from '../../database';

export function getUserProfile(supabase: Supabase, session: Session) {
    return getUserProfileById(supabase, session.user.id);
}

export async function getUserProfileById(supabase: Supabase, userId: string) {
    const profile = await supabase.from('profiles').select('*').eq('id', userId).single();

    if (profile.error) {
        throw Error(profile.error?.message ?? profile.error.toString());
    }
    return profile.data;
}

export async function findUser(supabase: Supabase, query: string) {
    const user = await supabase
        .from('users_with_profiles')
        .select('*')
        .or(`username.eq."${query}",email.eq."${query}"`)
        .single();
    if (user.error) {
        throw user.error;
    }

    return user.data;
}

export async function updateProfile(
    supabase: Supabase,
    userId: string,
    username: string | undefined,
    avatarFile: File | undefined
) {
    let avatarUrl: string | null = null;
    if (avatarFile) {
        const extension = avatarFile.name.split('.').pop() ?? '';
        const upload = await supabase.storage
            .from('avatars')
            .upload(`public/${userId}.${extension}`, avatarFile);
        if (upload.error) {
            throw upload.error;
        }
        const path = supabase.storage.from('avatars').getPublicUrl(upload.data!.path);
        avatarUrl = path.data.publicUrl;
    }
    let update: Database['public']['Tables']['profiles']['Update'] = {};
    if (username !== undefined && avatarUrl !== null) {
        update = { username, avatar: avatarUrl };
    } else if (username !== undefined && avatarUrl === null) {
        update = { username };
    } else if (username === undefined && avatarUrl !== null) {
        update = { avatar: avatarUrl };
    }
    console.log('update', update);
    const { data, error } = await supabase
        .from('profiles')
        .update(update)
        .eq('id', userId)
        .select()
        .single();

    if (error) {
        throw error;
    }

    const {
        data: { session }
    } = await supabase.auth.getSession();

    profile.set({ ...data, email: session?.user.email ?? '' });
}

export type Profile = Database['public']['Tables']['profiles']['Row'];

export const profile = writable<(Profile & { email: string }) | null>(null);
