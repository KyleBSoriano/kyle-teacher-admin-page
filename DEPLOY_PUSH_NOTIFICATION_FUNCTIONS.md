# Deploy Push Notification Edge Functions

## Overview

You need to deploy 4 new edge functions to Supabase for push notifications to work:

1. `admin-update-baseline-template`
2. `set-class-active-template`
3. `admin-clock-out-student`
4. `admin-clock-out-school`

## Step-by-Step Deployment

### Option 1: Via Supabase Web Dashboard (Recommended)

1. **Go to Supabase Dashboard**
   - Visit https://supabase.com/dashboard
   - Select your project: **dqynrbjixuidwqiacggx**
   - Click on **Edge Functions** in the left sidebar

2. **Deploy Each Function**

   For each function below, follow these steps:
   - Click **"Create a new function"** or **"New Function"**
   - Enter the function name (e.g., `set-class-active-template`)
   - Copy and paste the entire code from the corresponding file
   - Click **"Deploy"**

   **Functions to deploy:**
   - `admin-update-baseline-template` → `supabase/functions/admin-update-baseline-template/index.ts`
   - `set-class-active-template` → `supabase/functions/set-class-active-template/index.ts`
   - `admin-clock-out-student` → `supabase/functions/admin-clock-out-student/index.ts`
   - `admin-clock-out-school` → `supabase/functions/admin-clock-out-school/index.ts`

3. **Verify Deployment**
   - Each function should show as "Active" in the dashboard
   - Functions will be available at:
     - `https://dqynrbjixuidwqiacggx.functions.supabase.co/admin-update-baseline-template`
     - `https://dqynrbjixuidwqiacggx.functions.supabase.co/set-class-active-template`
     - `https://dqynrbjixuidwqiacggx.functions.supabase.co/admin-clock-out-student`
     - `https://dqynrbjixuidwqiacggx.functions.supabase.co/admin-clock-out-school`

### Option 2: Via Supabase CLI

If you have Supabase CLI set up:

```bash
# Link project (if not already linked)
supabase link --project-ref dqynrbjixuidwqiacggx

# Deploy all functions
supabase functions deploy admin-update-baseline-template --project-ref dqynrbjixuidwqiacggx
supabase functions deploy set-class-active-template --project-ref dqynrbjixuidwqiacggx
supabase functions deploy admin-clock-out-student --project-ref dqynrbjixuidwqiacggx
supabase functions deploy admin-clock-out-school --project-ref dqynrbjixuidwqiacggx
```

## Environment Variables

These functions use environment variables that should already be set:
- `SUPABASE_URL` - Automatically available
- `SUPABASE_SERVICE_ROLE_KEY` - Automatically available

If you get errors about missing environment variables, check:
1. Go to Supabase Dashboard → Settings → Edge Functions
2. Verify environment variables are set

## Testing After Deployment

1. **Test Template Activation:**
   - Go to Classes page
   - Activate a template for a class
   - Should succeed without 500 error

2. **Test Baseline Template Update:**
   - Go to Admin Apps page
   - Edit the baseline template
   - Should succeed without errors

3. **Test Clock-Out:**
   - Clock out a single student
   - Clock out all students
   - Should succeed without errors

4. **Check Logs:**
   - Go to Supabase Dashboard → Edge Functions → [Function Name] → Logs
   - Look for any error messages
   - Should see success logs like: `✅ Updated class ... active_template_id to ...`

## Troubleshooting

### Error: "500 Internal Server Error"

**Possible causes:**
1. Function not deployed - Deploy the function first
2. Environment variables missing - Check Supabase Dashboard settings
3. Database error - Check edge function logs for specific error

**How to debug:**
1. Go to Supabase Dashboard → Edge Functions → [Function Name] → Logs
2. Look for error messages with details
3. Check the error message in the browser console (it should show more details)

### Error: "Function not found" or 404

- Function hasn't been deployed yet
- Deploy the function using the steps above

### Push Notifications Not Working

- The `send-apns-push` function doesn't exist yet (this is expected)
- The functions will still work - they just won't send push notifications
- Push notifications are optional and won't cause failures
- Once `send-apns-push` is deployed, push notifications will automatically work

## What These Functions Do

1. **admin-update-baseline-template:**
   - Updates the baseline/admin template
   - Sends push notifications to all clocked-in students

2. **set-class-active-template:**
   - Activates a template for a class
   - Sends push notifications to enrolled clocked-in students

3. **admin-clock-out-student:**
   - Clocks out a single student
   - Sends push notification to that student

4. **admin-clock-out-school:**
   - Clocks out all students in a school
   - Sends push notifications to all clocked-out students

## Next Steps

After deploying these functions:
1. Test each function from the website
2. Check edge function logs for any errors
3. Once `send-apns-push` is ready, push notifications will automatically work

