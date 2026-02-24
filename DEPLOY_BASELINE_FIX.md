# Deploy Baseline Template Fix to Supabase

## Quick Deployment Guide

You need to deploy the `get-current-restrictions` edge function to Supabase so your mobile app can use the fixed baseline template logic.

---

## Option 1: Via Supabase Web Dashboard (Easiest)

### Step 1: Go to Edge Functions
1. Go to https://supabase.com/dashboard
2. Select your project: **dqynrbjixuidwqiacggx**
3. Click on **Edge Functions** in the left sidebar

### Step 2: Update `get-current-restrictions` Function
1. Find **`get-current-restrictions`** in the list of functions
2. Click on it to open the code editor
3. **Replace ALL the code** with the code from your local file:
   - File: `supabase/functions/get-current-restrictions/index.ts`
   - Copy the entire file contents
4. Click **"Deploy"** or **"Save"**

### Step 3: Verify Deployment
- You should see a success message
- The function will be available at:
  - `https://dqynrbjixuidwqiacggx.functions.supabase.co/get-current-restrictions`

---

## Option 2: Via Supabase CLI (If You Have It Set Up)

### Step 1: Link Project (If Not Already Linked)
```bash
supabase link --project-ref dqynrbjixuidwqiacggx
```

### Step 2: Deploy Just This Function
```bash
supabase functions deploy get-current-restrictions --project-ref dqynrbjixuidwqiacggx
```

---

## What Changed in This Deployment

**Key Fixes:**
1. ✅ Added `.order("updated_at", { ascending: false })` to baseline template query
   - Now always uses the most recent template (the one from Admin Apps page)
   
2. ✅ Added detailed logging
   - Shows which template is being used
   - Helps debug if issues occur

3. ✅ Fixed duplicate template handling
   - If multiple baseline templates exist, uses the most recent one

**File Changed:** `supabase/functions/get-current-restrictions/index.ts`
**Lines Changed:** 263-282 (baseline template query)

---

## After Deployment

1. **Test with mobile app:**
   - Student clocks in
   - Wait until between periods (not in any active period)
   - Check restrictions - should match Admin Apps page template

2. **Check edge function logs:**
   - Go to Supabase Dashboard → Edge Functions → `get-current-restrictions` → Logs
   - Look for: `🔍 Baseline template query:` and `✅ Baseline template found:`

3. **Verify it's working:**
   - Restrictions should match what you set on Admin Apps page
   - Should be consistent (not intermittent)

---

## Troubleshooting

**If it's still not working:**
1. Check edge function logs for errors
2. Verify baseline template exists in database:
   ```sql
   SELECT id, name, apps, updated_at
   FROM app_templates
   WHERE school_id = 'YOUR_SCHOOL_ID'
     AND period = 'baseline'
     AND class_id IS NULL
   ORDER BY updated_at DESC;
   ```
3. Make sure only ONE baseline template exists (clean up duplicates)

