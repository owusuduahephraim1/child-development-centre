-- Child Development Centre
-- Live Neon database prerequisites, inspected 2026-10-03.
-- IMPORTANT: Enable Neon Auth on the target Neon project before applying the schema,
-- because several foreign keys and RLS functions reference neon_auth."user" and auth.user_id().

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS pg_session_jwt;
CREATE SCHEMA IF NOT EXISTS app_private;

CREATE SEQUENCE IF NOT EXISTS public.contact_reference_seq START 1;
CREATE SEQUENCE IF NOT EXISTS public.donation_receipt_seq START 1;
CREATE SEQUENCE IF NOT EXISTS public.donation_reference_seq START 1;
CREATE SEQUENCE IF NOT EXISTS public.donor_reference_seq START 1;
