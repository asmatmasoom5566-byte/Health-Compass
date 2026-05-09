-- Add password_plain column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_plain text;
