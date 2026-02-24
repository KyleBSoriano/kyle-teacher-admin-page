-- Insert test student: Kyle Soriano
-- School ID: dd484b5a-10f4-42bb-b0f7-6175a650bca0
-- School Name: Clocked November25

INSERT INTO public.students (
  id,
  name,
  school_id,
  email,
  grade,
  device_id,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(), -- Generate a unique UUID for the student
  'Kyle Soriano',
  'dd484b5a-10f4-42bb-b0f7-6175a650bca0', -- Your school ID
  'kyle.soriano@example.com', -- Optional: You can change this or set to NULL
  12, -- Optional: Grade level (you can change this or set to NULL)
  NULL, -- Optional: Device ID (set to NULL if not available)
  NOW(), -- Current timestamp
  NOW() -- Current timestamp
);

-- Verify the student was created
SELECT * FROM public.students 
WHERE school_id = 'dd484b5a-10f4-42bb-b0f7-6175a650bca0' 
AND name = 'Kyle Soriano';

