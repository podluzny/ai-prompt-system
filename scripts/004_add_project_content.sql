-- Add content field to projects table
ALTER TABLE projects ADD COLUMN IF NOT EXISTS content TEXT DEFAULT NULL;
