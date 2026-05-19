-- Phase 8.5: per-property PDF brochure storage
--
-- Adds a nullable text column on properties to hold a single brochure's
-- Supabase Storage path (in the new `property-brochures` bucket).
--
-- Singular relationship: one brochure per property. If multi-doc support is
-- ever needed (Section 32, contracts, etc.), promote to a property_documents
-- table at that point.
--
-- The bucket itself is created via Supabase Dashboard, not SQL, because
-- bucket policies are managed there. This file just creates the storage RLS
-- policies that gate access to objects inside the bucket.

ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS brochure_path TEXT;

-- Storage RLS policies for property-brochures. Same pattern as the
-- property-photos/property-floorplans policies in 0001_init.sql:
-- file path must start with the authenticated user's UID, e.g.
--   <auth.uid()>/<property_id>/<timestamp>.pdf

drop policy if exists "agent_upload_brochures" on storage.objects;
create policy "agent_upload_brochures" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'property-brochures' and split_part(name,'/',1) = auth.uid()::text);

drop policy if exists "agent_read_brochures" on storage.objects;
create policy "agent_read_brochures" on storage.objects
  for select to authenticated
  using (bucket_id = 'property-brochures' and split_part(name,'/',1) = auth.uid()::text);

drop policy if exists "agent_update_brochures" on storage.objects;
create policy "agent_update_brochures" on storage.objects
  for update to authenticated
  using (bucket_id = 'property-brochures' and split_part(name,'/',1) = auth.uid()::text);

drop policy if exists "agent_delete_brochures" on storage.objects;
create policy "agent_delete_brochures" on storage.objects
  for delete to authenticated
  using (bucket_id = 'property-brochures' and split_part(name,'/',1) = auth.uid()::text);
