-- Add minihome_id field to users table
-- This will be used as the unique identifier for minihome URLs
-- Users can change their nickname, but minihome_id remains constant

-- Add minihome_id column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS minihome_id TEXT UNIQUE;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_users_minihome_id ON users(minihome_id);

-- Update existing users with random minihome_id if they don't have one
UPDATE users 
SET minihome_id = 'user_' || substr(md5(random()::text), 1, 8)
WHERE minihome_id IS NULL;

-- Make minihome_id NOT NULL after setting values
ALTER TABLE users ALTER COLUMN minihome_id SET NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN users.minihome_id IS 'Unique identifier for minihome URL. Cannot be changed once set.';

-- Create function to generate unique minihome_id
CREATE OR REPLACE FUNCTION generate_unique_minihome_id()
RETURNS TEXT AS $$
DECLARE
    new_id TEXT;
    counter INTEGER := 0;
BEGIN
    LOOP
        -- Generate random ID with format: user_XXXXXXXX
        new_id := 'user_' || substr(md5(random()::text || counter::text), 1, 8);
        
        -- Check if ID already exists
        IF NOT EXISTS (SELECT 1 FROM users WHERE minihome_id = new_id) THEN
            RETURN new_id;
        END IF;
        
        counter := counter + 1;
        
        -- Prevent infinite loop
        IF counter > 1000 THEN
            RAISE EXCEPTION 'Could not generate unique minihome_id after 1000 attempts';
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically set minihome_id for new users
CREATE OR REPLACE FUNCTION set_minihome_id()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.minihome_id IS NULL THEN
        NEW.minihome_id := generate_unique_minihome_id();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER trigger_set_minihome_id
    BEFORE INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION set_minihome_id();

-- Update RLS policy to allow viewing minihome_id for public profiles
-- Users can see other users' minihome_id for visiting their minihome
DROP POLICY IF EXISTS "Users can view public minihome_id" ON users;
CREATE POLICY "Users can view public minihome_id" ON users
    FOR SELECT USING (true);

-- Drop the old policy that was too restrictive
DROP POLICY IF EXISTS "Users can view own profile" ON users;

-- Create new policy that allows viewing public profile info
DROP POLICY IF EXISTS "Users can view public profiles" ON users;
CREATE POLICY "Users can view public profiles" ON users
    FOR SELECT USING (true);

-- Keep the update policy restricted to own profile
DROP POLICY IF EXISTS "Users can update own profile" ON users;
CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);
