-- Phase 8.4: expand property TYPE + STATUS enums for AU real-estate categories
--
-- Pure addition — existing rows always satisfy the new constraints. No data
-- migration needed (unlike 0006 which renamed 'Under Offer' -> 'Under Contract').
--
-- TYPE additions: Unit, Duplex, Studio, Penthouse, Land, Acreage / Rural,
--   Granny Flat, Retirement Living, NDIS SDA Home, Off-the-Plan,
--   House and Land Package, 10/90 One-Part Contract
--
-- STATUS additions: Under Construction, Ready Built

-- 1. TYPE
ALTER TABLE properties DROP CONSTRAINT IF EXISTS properties_type_check;
ALTER TABLE properties ADD CONSTRAINT properties_type_check
  CHECK (type IN (
    'House',
    'Townhouse',
    'Apartment',
    'Villa',
    'Unit',
    'Duplex',
    'Studio',
    'Penthouse',
    'Land',
    'Acreage / Rural',
    'Granny Flat',
    'Retirement Living',
    'NDIS SDA Home',
    'Off-the-Plan',
    'House and Land Package',
    '10/90 One-Part Contract'
  ));

-- 2. STATUS
ALTER TABLE properties DROP CONSTRAINT IF EXISTS properties_status_check;
ALTER TABLE properties ADD CONSTRAINT properties_status_check
  CHECK (status IN (
    'On Market',
    'Coming Soon',
    'Under Construction',
    'Ready Built',
    'Under Contract',
    'Sold',
    'Off Market',
    'Withdrawn'
  ));
