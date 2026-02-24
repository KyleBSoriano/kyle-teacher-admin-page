-- Step 1: Add allowed_apps column to schools table (if it doesn't exist)
ALTER TABLE public.schools 
ADD COLUMN IF NOT EXISTS allowed_apps JSONB 
DEFAULT '["calendar", "canvas", "chatgpt", "docs", "drive", "find_my", "gmail", "google_news", "notion", "slack"]'::jsonb;

-- Step 2: Add comment for documentation
COMMENT ON COLUMN public.schools.allowed_apps IS 'Array of app_catalog keys that are allowed for this school. Used by both admins and teachers when creating templates.';

-- Step 3: Update existing schools to have default allowed apps if they don't have any
UPDATE public.schools 
SET allowed_apps = '["calendar", "canvas", "chatgpt", "docs", "drive", "find_my", "gmail", "google_news", "notion", "slack"]'::jsonb
WHERE allowed_apps IS NULL;

-- Step 4: Set specific allowed apps for "Clocked November25" school
UPDATE public.schools 
SET allowed_apps = '["calendar", "canvas", "chatgpt", "docs", "drive", "find_my", "gmail", "google_news", "notion", "slack"]'::jsonb
WHERE id = 'dd484b5a-10f4-42bb-b0f7-6175a650bca0';

-- Verify the update
SELECT id, name, allowed_apps 
FROM public.schools 
WHERE id = 'dd484b5a-10f4-42bb-b0f7-6175a650bca0';

