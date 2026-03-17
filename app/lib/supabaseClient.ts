import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const inMemoryStorage = new Map<string, string>();

const perTabStorage = {
	getItem: (key: string) => {
		if (typeof window === 'undefined') {
			return inMemoryStorage.get(key) ?? null;
		}
		return window.sessionStorage.getItem(key);
	},
	setItem: (key: string, value: string) => {
		if (typeof window === 'undefined') {
			inMemoryStorage.set(key, value);
			return;
		}
		window.sessionStorage.setItem(key, value);
	},
	removeItem: (key: string) => {
		if (typeof window === 'undefined') {
			inMemoryStorage.delete(key);
			return;
		}
		window.sessionStorage.removeItem(key);
	},
};

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
	auth: {
		storage: perTabStorage,
		storageKey: 'slicktech-auth',
		persistSession: true,
		autoRefreshToken: true,
		detectSessionInUrl: true,
	},
});

export default supabase;
