import { createClient } from '@supabase/supabase-js';

// import.meta.env values are read when the site is built; process.env values are read
// when a request is served. The SSR deployment reads them from the Fargate task
// environment, so the same image can run without the keys baked in.
export const supabaseUrl =
	import.meta.env.SUPABASE_URL ?? import.meta.env.PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
export const supabasePublishableKey =
	import.meta.env.SUPABASE_KEY ??
	import.meta.env.PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
	import.meta.env.PUBLIC_SUPABASE_ANON_KEY ??
	process.env.SUPABASE_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabasePublishableKey);

export const supabase = supabaseUrl && supabasePublishableKey
	? createClient(supabaseUrl, supabasePublishableKey)
	: null;

export interface Song {
	id: string;
	artist: string;
	album: string | null;
	title: string;
	folder_name: string;
	audio_filename: string;
	artwork_filename: string;
	sort_order: number;
}

export function getMusicUrl(path: string) {
	if (!supabase) return '';

	return supabase.storage.from('music').getPublicUrl(path).data.publicUrl;
}
