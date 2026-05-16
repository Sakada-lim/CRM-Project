-- Phase 7: extend property status to 6-state enum + add agent columns

-- 1. Drop old 3-state check constraint
ALTER TABLE properties DROP CONSTRAINT IF EXISTS properties_status_check;

-- 2. Migrate old status values to new equivalents
UPDATE properties SET status = 'Under Contract' WHERE status = 'Under Offer';

-- 3. Default any remaining unknown values to 'On Market'
UPDATE properties
SET status = 'On Market'
WHERE status NOT IN ('On Market','Coming Soon','Under Contract','Sold','Off Market','Withdrawn');

-- 4. Add new 6-state check constraint
ALTER TABLE properties ADD CONSTRAINT properties_status_check
  CHECK (status IN ('On Market','Coming Soon','Under Contract','Sold','Off Market','Withdrawn'));

-- 5. Add listing-agent columns (hidden from UI until populated)
ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS agent_name  TEXT,
  ADD COLUMN IF NOT EXISTS agent_phone TEXT,
  ADD COLUMN IF NOT EXISTS agent_email TEXT;
