# Mobile App Setup Checklist for Ria Mesa High School

## ✅ What You Need to Do

### Step 1: Create the School in Database
1. Go to **Supabase Dashboard** → **SQL Editor**
2. Run the SQL from `create-ria-mesa-high-school.sql`
3. Verify the school was created - you should see:
   - School ID
   - Name: "Ria Mesa High School"
   - Code: "1111"
   - Allowed apps: `["gmail", "canvas", "chatgpt"]`

### Step 2: Verify Edge Functions Are Deployed
The mobile app uses these edge functions. Check they exist in Supabase:

- ✅ `student-signup` - For student sign-up with school code
- ✅ `teacher-admin-signup` - For teacher/admin sign-up with school code
- ✅ `get-allowed-apps` - Gets allowed apps for the school
- ✅ `get-current-restrictions` - Gets current app restrictions
- ✅ `clock-in-via-qr` - For QR code clock-in
- ✅ `send-apns-push` - For push notifications

**To check:**
1. Go to Supabase Dashboard → **Edge Functions**
2. Verify all functions listed above exist
3. If any are missing, they need to be deployed

### Step 3: Test School Code Works
1. Try signing up a test student/teacher with code **"1111"**
2. Should successfully find "Ria Mesa High School"
3. Should create account and link to the school

### Step 4: Verify Allowed Apps
After sign-up, the mobile app should:
1. Call `get-allowed-apps` with school_code="1111"
2. Receive: `["gmail", "canvas", "chatgpt"]`
3. Only show these 3 apps in the app picker

## 📱 What the Mobile App Does Automatically

Once the school exists in the database:

1. **Sign Up Flow:**
   - User enters code "1111"
   - Mobile app calls `student-signup` or `teacher-admin-signup`
   - Edge function looks up school by code
   - Creates user account linked to school

2. **Getting Allowed Apps:**
   - Mobile app calls `get-allowed-apps?school_code=1111`
   - Returns the 3 apps: gmail, canvas, chatgpt
   - Mobile app shows only these apps in picker

3. **Getting Restrictions:**
   - Mobile app calls `get-current-restrictions` with student_id
   - Function uses student's `school_id` to find baseline template
   - Returns current allowed apps based on schedule/templates

4. **Clock In:**
   - Student scans QR code
   - Mobile app calls `clock-in-via-qr`
   - Student gets clocked in and restrictions apply

## 🔍 Quick Verification Queries

Run these in Supabase SQL Editor to verify everything:

```sql
-- 1. Check school exists
SELECT id, name, code, allowed_apps 
FROM schools 
WHERE code = '1111';

-- 2. Check app_catalog has the 3 apps
SELECT key, display_name 
FROM app_catalog 
WHERE key IN ('gmail', 'canvas', 'chatgpt');

-- 3. Test get-allowed-apps endpoint (after school is created)
-- Should return: {"keys": ["gmail", "canvas", "chatgpt"], "catalog": [...]}
```

## ⚠️ Important Notes

1. **School Code is Case-Insensitive**: The code "1111" will work as "1111", "1111", etc. (converted to uppercase)

2. **Allowed Apps Must Exist in app_catalog**: Make sure `gmail`, `canvas`, and `chatgpt` exist in the `app_catalog` table

3. **Baseline Template**: After creating the school, you may want to create a baseline template for this school (optional - the system will work without it, but restrictions won't apply between periods)

## 🎯 Summary

**To get the mobile app ready:**
1. ✅ Run the SQL to create the school (from `create-ria-mesa-high-school.sql`)
2. ✅ Verify edge functions are deployed
3. ✅ Test sign-up with code "1111"
4. ✅ Done! Mobile app will automatically work with the new school

The mobile app doesn't need any code changes - it will automatically work once the school exists in the database.


