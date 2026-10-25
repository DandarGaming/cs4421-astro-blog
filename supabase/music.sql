create table if not exists public.songs (
	id uuid primary key default gen_random_uuid(),
	artist text not null,
	album text,
	title text not null,
	folder_name text not null,
	audio_filename text not null,
	artwork_filename text not null default 'cover.jpg',
	sort_order integer not null default 0,
	published boolean not null default false,
	created_at timestamptz not null default now(),
	unique (folder_name, audio_filename)
);

alter table public.songs enable row level security;

drop policy if exists "Public can read published songs" on public.songs;
create policy "Public can read published songs"
on public.songs
for select
to anon, authenticated
using (published = true);

grant select on public.songs to anon, authenticated;

-- Keep this false until the track and artwork licenses permit public playback/display.
-- update public.songs set published = true where id = '...';
