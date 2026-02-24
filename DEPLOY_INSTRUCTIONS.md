# Deploy Edge Functions Instructions

## Step 1: Get Your Supabase Project Details

1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to **Settings** → **General**
   - Copy your **Reference ID** (looks like: `abcdefghijklmnop`)
4. Go to **Settings** → **API**
   - Copy your **Project URL** (looks like: `https://abcdefghijklmnop.supabase.co`)
   - Copy your **anon/public key** (long string starting with `eyJ...`)
   - Copy your **service_role key** (long string starting with `eyJ...`) - **KEEP THIS SECRET!**

## Step 2: Link Your Project

Run this command in your terminal (replace `<YOUR_PROJECT_REF>` with your Reference ID):

```bash
supabase link --project-ref <YOUR_PROJECT_REF>
```

Example:
```bash
supabase link --project-ref abcdefghijklmnop
```

## Step 3: Set Environment Variables

Run this command (replace all the `<...>` placeholders with your actual values):

```bash
supabase secrets set --env prod \
  SUPABASE_URL="https://<YOUR_PROJECT_REF>.supabase.co" \
  SUPABASE_ANON_KEY="<your_anon_key_here>" \
  SUPABASE_SERVICE_ROLE_KEY="<your_service_role_key_here>"
```

Example:
```bash
supabase secrets set --env prod \
  SUPABASE_URL="https://abcdefghijklmnop.supabase.co" \
  SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

## Step 4: Deploy All Functions

Run this command (replace `<YOUR_PROJECT_REF>` with your Reference ID):

```bash
supabase functions deploy \
  student-signup \
  enroll-in-class \
  get-allowed-apps \
  get-current-restrictions \
  --project-ref <YOUR_PROJECT_REF>
```

Example:
```bash
supabase functions deploy \
  student-signup \
  enroll-in-class \
  get-allowed-apps \
  get-current-restrictions \
  --project-ref abcdefghijklmnop
```

## Step 5: Verify Deployment

After deployment, you should see success messages for each function. Your functions will be available at:

- `https://<YOUR_PROJECT_REF>.functions.supabase.co/student-signup`
- `https://<YOUR_PROJECT_REF>.functions.supabase.co/enroll-in-class`
- `https://<YOUR_PROJECT_REF>.functions.supabase.co/get-allowed-apps`
- `https://<YOUR_PROJECT_REF>.functions.supabase.co/get-current-restrictions`

## Troubleshooting

### If you get "command not found: supabase"
Install the Supabase CLI:
```bash
brew install supabase/tap/supabase
```

### If you get authentication errors
Make sure you're logged in:
```bash
supabase login
```

### If deployment fails
Check that:
1. You're in the correct directory (`/Users/samyutha/Desktop/clocked-web-admin`)
2. All function files exist in `supabase/functions/` folders
3. Your project reference ID is correct
4. Your API keys are correct

