drop function if exists public.workspace_preview_write(uuid, integer, jsonb);
drop function if exists public.workspace_preview_read(uuid, jsonb);
drop table if exists private.workspace_preview_sessions;
