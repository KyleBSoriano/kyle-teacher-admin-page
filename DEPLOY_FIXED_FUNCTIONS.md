# Deploy Fixed Edge Functions to Supabase

## Functions to Deploy

We fixed **2 edge functions** that need to be deployed:

1. **`get-current-restrictions`** - Fixed baseline template boundary issue
2. **`clock-in-via-qr`** - Fixed timezone conversion issue

---

## Step-by-Step Deployment

### Step 1: Go to Supabase Dashboard

1. Go to https://supabase.com/dashboard
2. Select your project: **dqynrbjixuidwqiacggx**
3. Click on **Edge Functions** in the left sidebar

### Step 2: Deploy `get-current-restrictions` Function

1. Find **`get-current-restrictions`** in the list of functions
2. Click on it to open the editor
3. **Replace ALL the code** with the code from `supabase/functions/get-current-restrictions/index.ts`
4. Click **"Deploy"** or **"Save"**

**Key Fixes in this function:**
- ✅ Changed `currentTime <= endMin` to `currentTime < endMin` (line 227)
- ✅ Added better logging for baseline template (lines 274, 276, 287, 289)

### Step 3: Deploy `clock-in-via-qr` Function

1. Find **`clock-in-via-qr`** in the list of functions
2. Click on it to open the editor
3. **Replace ALL the code** with the code from `supabase/functions/clock-in-via-qr/index.ts`
4. Click **"Deploy"** or **"Save"**

**Key Fixes in this function:**
- ✅ Fixed timezone conversion to use UTC components directly (lines 96-120)
- ✅ Properly handles day rollover for PST conversion

---

## What Changed

### Before (The Bug):
```typescript
// Line 225 in get-current-restrictions
if (currentTime >= startMin && currentTime <= endMin) {
  // At exactly 9:47:00 AM, you're still "in" the period
  // Baseline doesn't apply until 9:47:01 AM
}
```

### After (The Fix):
```typescript
// Line 227 in get-current-restrictions
if (currentTime >= startMin && currentTime < endMin) {
  // At exactly 9:47:00 AM, you're "between periods"
  // Baseline applies immediately!
}
```

---

## Verification

After deploying, test:

1. **Clock in** during school hours (should work now with correct timezone)
2. **Check restrictions** when between periods (baseline template should apply consistently)
3. **Check Supabase logs** - you should see the new debug messages:
   - `✅ Baseline template found: "..." with X apps`
   - `⚠️ Baseline template not found or empty...`

---

## Quick Copy-Paste

If you want, I can help you copy the code. The files are ready at:
- `supabase/functions/get-current-restrictions/index.ts` (345 lines)
- `supabase/functions/clock-in-via-qr/index.ts` (244 lines)

Just open each file, copy all the code, and paste it into the Supabase dashboard editor!

