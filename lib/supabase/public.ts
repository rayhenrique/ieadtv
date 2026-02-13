import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";

let publicClient: ReturnType<typeof createSupabaseClient> | null = null;

export function createPublicClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !anonKey) {
        throw new Error(
            "NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY são obrigatórios."
        );
    }

    if (!publicClient) {
        publicClient = createSupabaseClient(url, anonKey, {
            auth: {
                persistSession: false,
                autoRefreshToken: false,
            },
        });
    }

    return publicClient;
}
