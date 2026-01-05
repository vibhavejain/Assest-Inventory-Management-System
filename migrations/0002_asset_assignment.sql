-- Asset Assignment Migration
-- Adds assigned_to field to assets table for user assignment

ALTER TABLE assets ADD COLUMN assigned_to TEXT REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX idx_assets_assigned_to ON assets(assigned_to);
