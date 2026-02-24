# Testing Mobile App Restrictions with Template Changes

## Setup for Demo

### 1. Create Demo Class
- Create a class on the website
- **Important**: Don't set `start_time` or `end_time` (or set period to "demo")
- This makes it an "always-active" class that bypasses time checks
- Note the **class code** for enrollment

### 2. Create Templates
- Create two templates for this class:
  - **"everyday"** template with specific apps
  - **"test mode"** template with different apps
- Make sure each template has different apps so you can see the difference

### 3. Activate First Template
- On the website, activate the "everyday" template
- This sets `classes.active_template_id` in the database

## Testing on Mobile App

### Step 1: Enroll in Class
1. Open mobile app
2. Sign in with your student account
3. Enter the **class code** from step 1
4. You should be enrolled in the class

### Step 2: Clock In
1. Scan the QR code or clock in via the app
2. This creates an attendance record with `class_id`

### Step 3: Check Restrictions
1. Mobile app should call `get-current-restrictions` Edge Function
2. Since you're in a demo class (no start_time/end_time), it's always "in class time"
3. App should get the "everyday" template apps as restrictions

### Step 4: Change Template on Website
1. Go back to website
2. Activate the "test mode" template instead
3. This updates `classes.active_template_id` in database

### Step 5: See Changes on Phone
1. Mobile app needs to **poll** `get-current-restrictions` again
2. The Edge Function reads the NEW `active_template_id`
3. App should now get "test mode" template apps as restrictions
4. Restrictions should change immediately (depending on polling frequency)

## How Mobile App Polls

The mobile app should call `get-current-restrictions` periodically:
- **Endpoint**: `https://<YOUR_PROJECT>.functions.supabase.co/get-current-restrictions`
- **Method**: GET
- **Headers**: `Authorization: Bearer <student_access_token>`
- **Frequency**: Every 10-30 seconds (or when app comes to foreground)

## Expected Response Format

```json
{
  "clocked_in": true,
  "keys": ["calendar", "canvas", "docs"],  // App catalog keys
  "catalog": [
    {
      "key": "calendar",
      "display_name": "Calendar",
      "ios_bundle_id": "com.apple.mobilecal"
    },
    // ... more apps
  ],
  "template_source": "class_Period 1",
  "class_id": "uuid-here"
}
```

## Troubleshooting

### Templates Not Changing on Phone
1. **Check active_template_id**: Run SQL to verify it's updated:
   ```sql
   SELECT id, period, subject, active_template_id 
   FROM classes 
   WHERE id = 'your-class-id';
   ```

2. **Check mobile polling**: Verify app is calling the Edge Function
3. **Check time logic**: If class has start_time/end_time, it might not be "in class time"
   - Solution: Remove start_time/end_time or set period to "demo"

### Restrictions Not Applied
1. **Check clock-in status**: Student must be clocked in
2. **Check enrollment**: Student must be enrolled in the class
3. **Check template apps**: Verify template has apps in `apps` array
4. **Check app_catalog**: Apps must exist in `app_catalog` table

## Quick Test SQL

```sql
-- Check class and active template
SELECT 
  c.id as class_id,
  c.period,
  c.subject,
  c.active_template_id,
  c.start_time,
  c.end_time,
  t.name as template_name,
  t.apps as template_apps
FROM classes c
LEFT JOIN app_templates t ON t.id = c.active_template_id
WHERE c.id = 'your-class-id';

-- Check student enrollment
SELECT * FROM enrollments WHERE class_id = 'your-class-id';

-- Check attendance (clocked in)
SELECT * FROM attendance_records 
WHERE student_id = 'your-student-id' 
AND status IN ('present', 'in')
AND clocked_out_at IS NULL
ORDER BY timestamp DESC
LIMIT 1;
```

