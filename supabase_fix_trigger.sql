-- Drop the broken handle_new_user() function and on_auth_user_created trigger
-- This will stop Supabase Auth from trying to automatically create profiles, which was causing "Database error saving new user" errors
-- Run this in your Supabase SQL Editor

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

