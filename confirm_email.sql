-- Confirm email for user: samyutha06@gmail.com
-- User ID: 3351c00a-5e1f-482a-a940-f0c0800e9239

-- Update auth.users to confirm the email
-- Note: confirmed_at is a generated column, so we only update email_confirmed_at
UPDATE auth.users
SET 
  email_confirmed_at = NOW()
WHERE id = '3351c00a-5e1f-482a-a940-f0c0800e9239'
  AND email = 'samyutha06@gmail.com';

-- Verify the update
SELECT 
  id,
  email,
  email_confirmed_at,
  confirmed_at,
  created_at
FROM auth.users
WHERE id = '3351c00a-5e1f-482a-a940-f0c0800e9239';

