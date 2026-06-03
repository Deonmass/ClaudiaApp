-- Permissions granulaires par module (JSON stocké en text)
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS permissions text;
