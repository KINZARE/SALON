create schema if not exists extensions;
alter extension btree_gist set schema extensions;

alter function public.set_updated_at() set search_path = public;
alter function public.normalize_phone(text) set search_path = public;
alter function public.normalize_email(text) set search_path = public;
