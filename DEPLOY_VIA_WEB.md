# Deploy Edge Functions via Supabase Web Dashboard

## Step 1: Go to Edge Functions in Dashboard

1. Go to https://supabase.com/dashboard
2. Select your project (dqynrbjixuidwqiacggx)
3. Click on **Edge Functions** in the left sidebar

## Step 2: Create Each Function

For each function, you'll:
1. Click **"Create a new function"** or **"New Function"**
2. Enter the function name
3. Copy/paste the code from the corresponding file
4. Click **"Deploy"**

### Function 1: student-signup

1. Click **"Create a new function"**
2. Function name: `student-signup`
3. Copy the entire contents of `supabase/functions/student-signup/index.ts`
4. Paste into the code editor
5. Click **"Deploy"**

### Function 2: enroll-in-class

1. Click **"Create a new function"**
2. Function name: `enroll-in-class`
3. Copy the entire contents of `supabase/functions/enroll-in-class/index.ts`
4. Paste into the code editor
5. Click **"Deploy"**

### Function 3: get-allowed-apps

1. Click **"Create a new function"**
2. Function name: `get-allowed-apps`
3. Copy the entire contents of `supabase/functions/get-allowed-apps/index.ts`
4. Paste into the code editor
5. Click **"Deploy"**

### Function 4: get-current-restrictions

1. Click **"Create a new function"**
2. Function name: `get-current-restrictions`
3. Copy the entire contents of `supabase/functions/get-current-restrictions/index.ts`
4. Paste into the code editor
5. Click **"Deploy"**

## Step 3: Set Environment Variables (Secrets)

1. In the Edge Functions page, look for **"Secrets"** or **"Environment Variables"** section
2. Click **"Add Secret"** or **"Manage Secrets"**
3. Add these three secrets:

   - **Name:** `SUPABASE_URL`
     **Value:** `https://dqynrbjixuidwqiacggx.supabase.co`

   - **Name:** `SUPABASE_ANON_KEY`
     **Value:** (Get this from Settings → API → anon/public key)

   - **Name:** `SUPABASE_SERVICE_ROLE_KEY`
     **Value:** (Get this from Settings → API → service_role key - KEEP SECRET!)

## Step 4: Verify Functions Are Deployed

After deploying each function, you should see them listed in the Edge Functions page. They'll be available at:

- `https://dqynrbjixuidwqiacggx.functions.supabase.co/student-signup`
- `https://dqynrbjixuidwqiacggx.functions.supabase.co/enroll-in-class`
- `https://dqynrbjixuidwqiacggx.functions.supabase.co/get-allowed-apps`
- `https://dqynrbjixuidwqiacggx.functions.supabase.co/get-current-restrictions`

## Alternative: Quick Copy-Paste Method

If you want, I can help you open each file and copy the code. Just let me know which function you want to deploy first!

## Notes

- The web dashboard automatically handles deployment
- No CLI authentication needed
- Environment variables (secrets) are set per project
- Functions are immediately available after deployment

