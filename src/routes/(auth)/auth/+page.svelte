<script lang='ts'>
    import { Auth } from '@supabase/auth-ui-svelte';
    import type { PageData } from './$types';
    import type { Theme } from '@supabase/auth-ui-shared';

    import colors from 'tailwindcss/colors';
    import tailwindTheme from 'tailwindcss/defaultTheme';

    const theme = {
        default: {
            colors: {
                brand: colors.blue['600'],
                brandAccent: colors.blue['800'],
                inputBackground: colors.gray['700'],
                inputText: colors.white,
                inputPlaceholder: colors.gray['400'],
                inputLabelText: colors.gray['300'],
                inputBorder: colors.gray['600'],
                messageTextDanger: colors.red['500'],
                anchorTextColor: colors.gray['400'],
            },
            space: {
                labelBottomMargin: tailwindTheme.spacing['2'],
                anchorBottomMargin: tailwindTheme.spacing['2'],
                inputPadding: tailwindTheme.spacing['2'],
                buttonPadding: tailwindTheme.spacing['2'],
            },
            fontSizes: {
                baseBodySize: tailwindTheme.fontSize.sm,
                baseInputSize: tailwindTheme.fontSize.sm,
                baseLabelSize: tailwindTheme.fontSize.sm,
                baseButtonSize: tailwindTheme.fontSize.sm,
            },
            borderWidths: {
                buttonBorderWidth: tailwindTheme.borderWidth.DEFAULT,
                inputBorderWidth: tailwindTheme.borderWidth.DEFAULT,
            },
            radii: {
                borderRadiusButton: tailwindTheme.borderRadius.md,
                buttonBorderRadius: tailwindTheme.borderRadius.md,
                inputBorderRadius: tailwindTheme.borderRadius.md,
            },
        }
    } satisfies Theme

    export let data: PageData;
</script>

<div class='flex w-full md:h-full'>
    <div class='rounded-lg shadow mx-auto md:my-auto min-w-auth-card md:border md:dark:border-gray-700 space-y-4 md:space-y-6 p-8'>
        <Auth supabaseClient={data.supabase} appearance={{ theme }} theme='dark' magicLink={true} redirectTo='/auth/onboarding' />
    </div>
</div>
