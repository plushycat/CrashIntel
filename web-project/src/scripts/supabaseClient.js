(function () {
    if (!window) return;
    // Create client only if the Supabase library loaded
    if (!window.supabase || typeof window.supabase.createClient !== 'function') {
        console.error('Supabase JS not loaded. Make sure the CDN script is included before supabaseClient.js');
        window.supabaseClient = null;
        return;
    }

    const supabase = window.supabase.createClient(
        window.SUPABASE_URL,
        window.SUPABASE_ANON_KEY
    );

    // Simple wrapper helpers for pages to use
    const authHelpers = {
        getSession: async () => {
            try {
                const { data, error } = await supabase.auth.getSession();
                if (error) throw error;
                return data?.session ?? null;
            } catch (err) {
                console.error('getSession error', err);
                return null;
            }
        },
        getUser: async () => {
            try {
                const { data, error } = await supabase.auth.getUser();
                if (error) throw error;
                return data?.user ?? null;
            } catch (err) {
                console.error('getUser error', err);
                return null;
            }
        },
        onAuthStateChange: (cb) => {
            // returns subscription; caller can call .unsubscribe()
            return supabase.auth.onAuthStateChange((event, session) => {
                try { cb(event, session); } catch (e) { console.error(e); }
            });
        },
        signOut: async () => {
            const { error } = await supabase.auth.signOut();
            if (error) console.error('signOut error', error);
            return !error;
        }
    };

    window.supabaseClient = supabase;
    window.supabaseAuthHelpers = authHelpers;
})();