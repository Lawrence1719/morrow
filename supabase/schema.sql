-- Create notes table
CREATE TABLE IF NOT EXISTS public.notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    random_name TEXT NOT NULL,
    message VARCHAR(280) NOT NULL,
    mood TEXT NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    country TEXT NOT NULL,
    is_hidden BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anyone to read active (non-hidden) notes
CREATE POLICY "Allow public select" ON public.notes
    FOR SELECT
    USING (is_hidden = FALSE);

-- Policy: Allow public (anonymous and authenticated) to insert active notes
CREATE POLICY "Allow public insert" ON public.notes
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (is_hidden = FALSE);

-- Index on coordinates and visibility for fast leaflet bounding box queries
CREATE INDEX IF NOT EXISTS notes_lat_lng_idx ON public.notes(latitude, longitude) WHERE is_hidden = FALSE;
CREATE INDEX IF NOT EXISTS notes_created_at_idx ON public.notes(created_at DESC);

-- Enable Realtime replication for notes table (required for frontend subscription)
ALTER PUBLICATION supabase_realtime ADD TABLE public.notes;

-- Enable the pg_cron extension (allows scheduling queries inside the database)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule a daily job to delete notes older than 30 days (runs at midnight 00:00 every day)
SELECT cron.schedule(
    'delete-old-notes-job',
    '0 0 * * *',
    $$ DELETE FROM public.notes WHERE created_at < NOW() - INTERVAL '30 days' $$
);

