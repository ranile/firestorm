alter publication supabase_realtime add table messages;

INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, invited_at,
                        confirmation_token, confirmation_sent_at, recovery_token, recovery_sent_at,
                        email_change_token_new, email_change, email_change_sent_at, last_sign_in_at, raw_app_meta_data,
                        raw_user_meta_data, is_super_admin, created_at, updated_at, phone, phone_confirmed_at,
                        phone_change, phone_change_token, phone_change_sent_at, email_change_token_current,
                        email_change_confirm_status, banned_until, reauthentication_token, reauthentication_sent_at,
                        is_sso_user)
VALUES ('00000000-0000-0000-0000-000000000000', '53c78944-1e31-4476-804c-2bbe2a4a89bf', 'authenticated',
        'authenticated', 'test@test.com', '$2a$10$c.Nxc3qZ.Hr7KeowGyFSousghD9D1gnDfxoGJ/WEwMqmhxVJuKnUa',
        '2023-05-27 14:15:49.888621 +00:00', null, '', null, '', null, '', '', null,
        '2023-05-27 17:47:06.577968 +00:00', '{
        "provider": "email",
        "providers": [
            "email"
        ]
    }', null, null, '2023-05-27 14:15:49.882691 +00:00', '2023-05-27 20:38:02.242366 +00:00', null, null, '', '', null,
        '', 0,
        null, '', null, false);

UPDATE profiles
SET username = 'test'
WHERE id = '53c78944-1e31-4476-804c-2bbe2a4a89bf';
