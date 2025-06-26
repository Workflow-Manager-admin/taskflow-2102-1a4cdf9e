# Supabase Integration for Task Tracker FastAPI Backend

This application connects to Supabase for user and task management.
Supabase is configured via the following environment variables:

- `SUPABASE_URL`: Base URL for your Supabase project (`https://uwyapabfhuztzmjfsvif.supabase.co`)
- `SUPABASE_KEY`: Service role API key (ensure this is kept secure)
- `SUPABASE_DB_URL`: PostgreSQL DB URL for migrations and direct queries (optional)

## How It Works

- Users and tasks are managed via Supabase's PostgREST API.
- See `src/api/main.py` for all places where REST API calls are made to Supabase.
- Tables required in Supabase:
    - `users`: `{ id, email, hashed_password }`
    - `tasks`: `{ id, user_id, title, description, status, created_at, updated_at }`

## Setup

1. Create these tables in your Supabase project.
2. Set up **Row Level Security** (RLS) so users can only read/write their own data.
3. Set the environment variables for your backend (in your `.env` file, for example).

## Useful Resources

- [Supabase REST API docs](https://supabase.com/docs/reference/api)
- [Supabase Python client (optional)](https://supabase.com/docs/reference/python)

## Notes

- For production usage, use a strong password hashing scheme in place of SHA256.
- All sensitive API keys should be kept secret and never shared with frontend clients.
