-- Add last_login column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE;

-- Create index for last_login for better performance
CREATE INDEX IF NOT EXISTS idx_users_last_login ON users(last_login);
