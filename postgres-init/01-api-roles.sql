-- Stub roles Supabase Studio expects to exist for its "API access" (Table
-- Editor GRANT) UI, since this stack runs plain postgres:16-alpine rather
-- than supabase/postgres - there's no GoTrue/PostgREST here to actually use
-- them for request-time auth, so these only stop the UI from erroring; they
-- grant no real REST API access (see README's "Why Studio-only" section).
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'anon') THEN
        CREATE ROLE anon NOLOGIN NOINHERIT;
    END IF;
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'authenticated') THEN
        CREATE ROLE authenticated NOLOGIN NOINHERIT;
    END IF;
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'service_role') THEN
        CREATE ROLE service_role NOLOGIN NOINHERIT BYPASSRLS;
    END IF;
END
$$;

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
