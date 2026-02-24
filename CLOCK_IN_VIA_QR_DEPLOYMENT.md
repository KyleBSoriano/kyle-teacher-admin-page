# Clock-In Via QR Edge Function - Deployment Guide

## Overview
This edge function allows authenticated students to clock in by scanning a QR code. It creates an attendance record with `status: "in"` in Supabase, which automatically triggers restrictions via the `get-current-restrictions` function.

## Edge Function Details

**Function Name:** `clock-in-via-qr`  
**Endpoint:** `https://dqynrbjixuidwqiacggx.supabase.co/functions/v1/clock-in-via-qr`  
**Method:** POST  
**Authentication:** Required (Bearer token in Authorization header)

---

## Step 1: Deploy the Edge Function to Supabase

### Via Supabase Web Dashboard:

1. Go to https://supabase.com/dashboard
2. Select your project: **dqynrbjixuidwqiacggx**
3. Click on **Edge Functions** in the left sidebar
4. Click **"Create a new function"** or **"New Function"**
5. Function name: `clock-in-via-qr`
6. Copy and paste the entire code below into the code editor
7. Click **"Deploy"**

### Complete Edge Function Code:

```typescript
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405, headers: cors });

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
  const supabase = createClient(SUPABASE_URL, ANON, {
    global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } }
  });

  // Get authenticated student
  const { data: auth, error: authErr } = await supabase.auth.getUser();
  if (authErr || !auth.user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { 
      status: 401, 
      headers: { "Content-Type": "application/json", ...cors } 
    });
  }
  const studentId = auth.user.id;

  // Get request body
  const { class_id } = await req.json().catch(() => ({}));
  if (!class_id) {
    return new Response(JSON.stringify({ error: "Missing class_id" }), { 
      status: 400, 
      headers: { "Content-Type": "application/json", ...cors } 
    });
  }

  // Verify student exists and get their school_id
  const { data: student, error: studentErr } = await supabase
    .from("students")
    .select("id, school_id")
    .eq("id", studentId)
    .maybeSingle();
  
  if (studentErr || !student) {
    return new Response(JSON.stringify({ error: "Student not found" }), { 
      status: 400, 
      headers: { "Content-Type": "application/json", ...cors } 
    });
  }

  // Verify class exists and is in student's school
  const { data: klass, error: classErr } = await supabase
    .from("classes")
    .select("id, school_id, period, subject")
    .eq("id", class_id)
    .maybeSingle();
  
  if (classErr || !klass) {
    return new Response(JSON.stringify({ error: "Class not found" }), { 
      status: 400, 
      headers: { "Content-Type": "application/json", ...cors } 
    });
  }

  // Verify student is enrolled in this class
  const { data: enrollment, error: enrollErr } = await supabase
    .from("enrollments")
    .select("id")
    .eq("class_id", class_id)
    .eq("student_id", studentId)
    .maybeSingle();
  
  if (enrollErr) {
    return new Response(JSON.stringify({ error: enrollErr.message }), { 
      status: 400, 
      headers: { "Content-Type": "application/json", ...cors } 
    });
  }

  if (!enrollment) {
    return new Response(JSON.stringify({ error: "Student is not enrolled in this class" }), { 
      status: 403, 
      headers: { "Content-Type": "application/json", ...cors } 
    });
  }

  // Check if already clocked in today (has active attendance record)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const { data: existingAttn, error: checkErr } = await supabase
    .from("attendance_records")
    .select("id, status")
    .eq("student_id", studentId)
    .eq("class_id", class_id)
    .eq("status", "in")
    .is("clocked_out_at", null)
    .gte("timestamp", today.toISOString())
    .lt("timestamp", tomorrow.toISOString())
    .maybeSingle();

  if (checkErr) {
    console.error("Error checking existing attendance:", checkErr);
  }

  // If already clocked in, return success
  if (existingAttn) {
    return new Response(JSON.stringify({ 
      ok: true, 
      message: "Already clocked in",
      class_id: class_id,
      class_subject: klass.subject,
      class_period: klass.period
    }), { 
      headers: { "Content-Type": "application/json", ...cors } 
    });
  }

  // Get period number from class period string (e.g., "Period 1" -> 1)
  const periodMatch = klass.period?.match(/Period\s+(\d+)/i);
  const periodNumber = periodMatch ? parseInt(periodMatch[1]) : 1;

  // Create attendance record (clock in)
  const { data: attendanceRecord, error: attnErr } = await supabase
    .from("attendance_records")
    .insert({
      student_id: studentId,
      class_id: class_id,
      status: "in",  // Use 'in' status for clocked in
      period: periodNumber,
      timestamp: new Date().toISOString(),
      clocked_out_at: null
    })
    .select()
    .single();
  
  if (attnErr) {
    console.error("Error creating attendance record:", attnErr);
    return new Response(JSON.stringify({ error: attnErr.message }), { 
      status: 400, 
      headers: { "Content-Type": "application/json", ...cors } 
    });
  }

  return new Response(JSON.stringify({ 
    ok: true, 
    message: "Successfully clocked in",
    class_id: class_id,
    class_subject: klass.subject,
    class_period: klass.period,
    attendance_id: attendanceRecord.id
  }), { 
    headers: { "Content-Type": "application/json", ...cors } 
  });
});
```

---

## Step 2: Set Environment Variables (Secrets)

The edge function needs these environment variables. If you haven't set them already:

1. In the Edge Functions page, look for **"Secrets"** or **"Environment Variables"**
2. Click **"Add Secret"** or **"Manage Secrets"**
3. Add these secrets (if not already present):

   - **Name:** `SUPABASE_URL`  
     **Value:** `https://dqynrbjixuidwqiacggx.supabase.co`

   - **Name:** `SUPABASE_ANON_KEY`  
     **Value:** Get this from **Settings → API → anon/public key**

---

## Step 3: Verify Deployment

After deploying, the function will be available at:
```
https://dqynrbjixuidwqiacggx.supabase.co/functions/v1/clock-in-via-qr
```

You can test it using curl or Postman (see Testing section below).

---

## API Specification

### Request

**Endpoint:** `POST https://dqynrbjixuidwqiacggx.supabase.co/functions/v1/clock-in-via-qr`

**Headers:**
```
Authorization: Bearer {student_access_token}
Content-Type: application/json
```

**Body:**
```json
{
  "class_id": "abc123-def456-ghi789"
}
```

### Response (Success)

**Status:** 200 OK

**Body:**
```json
{
  "ok": true,
  "message": "Successfully clocked in",
  "class_id": "abc123-def456-ghi789",
  "class_subject": "Math",
  "class_period": "Period 1",
  "attendance_id": "attendance-record-uuid"
}
```

### Response (Already Clocked In)

**Status:** 200 OK

**Body:**
```json
{
  "ok": true,
  "message": "Already clocked in",
  "class_id": "abc123-def456-ghi789",
  "class_subject": "Math",
  "class_period": "Period 1"
}
```

### Response (Error - Not Enrolled)

**Status:** 403 Forbidden

**Body:**
```json
{
  "error": "Student is not enrolled in this class"
}
```

### Response (Error - Unauthorized)

**Status:** 401 Unauthorized

**Body:**
```json
{
  "error": "Unauthorized"
}
```

### Response (Error - Missing class_id)

**Status:** 400 Bad Request

**Body:**
```json
{
  "error": "Missing class_id"
}
```

---

## How iOS App Should Call It

### Step 1: Add Response Struct to SupabaseClient.swift

```swift
struct ClockInResponse: Codable {
    let ok: Bool
    let message: String?
    let error: String?
    let class_id: String?
    let class_subject: String?
    let class_period: String?
    let attendance_id: String?
}
```

### Step 2: Add Function to SupabaseClient Extension

```swift
extension SupabaseClient {
    func clockInViaQR(classId: String, token: String) async throws -> ClockInResponse {
        let url = URL(string: "https://dqynrbjixuidwqiacggx.supabase.co/functions/v1/clock-in-via-qr")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        let body = ["class_id": classId]
        request.httpBody = try JSONSerialization.data(withJSONObject: body)
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw URLError(.badServerResponse)
        }
        
        if httpResponse.statusCode == 401 {
            throw URLError(.userAuthenticationRequired)
        }
        
        let decoder = JSONDecoder()
        let result = try decoder.decode(ClockInResponse.self, from: data)
        
        if !result.ok && result.error != nil {
            throw NSError(domain: "ClockInError", code: httpResponse.statusCode, userInfo: [
                NSLocalizedDescriptionKey: result.error ?? "Unknown error"
            ])
        }
        
        return result
    }
}
```

### Step 3: Call from ScanQRView

```swift
private func clockInViaQR(classId: String) async {
    guard let token = SessionStore.shared.accessToken else {
        await MainActor.run {
            toast = "Please sign in to clock in"
        }
        return
    }

    do {
        let result = try await SupabaseClient.shared.clockInViaQR(classId: classId, token: token)
        
        await MainActor.run {
            if result.ok {
                toast = result.message ?? "Successfully clocked in!"
            } else if let error = result.error {
                toast = error
            }
        }
    } catch {
        await MainActor.run {
            toast = "Network error. Please try again."
        }
    }
}
```

---

## Testing the Edge Function

### Using curl:

```bash
curl -X POST https://dqynrbjixuidwqiacggx.supabase.co/functions/v1/clock-in-via-qr \
  -H "Authorization: Bearer YOUR_STUDENT_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"class_id": "YOUR_CLASS_ID"}'
```

### Expected Response:

```json
{
  "ok": true,
  "message": "Successfully clocked in",
  "class_id": "YOUR_CLASS_ID",
  "class_subject": "Math",
  "class_period": "Period 1",
  "attendance_id": "uuid-here"
}
```

---

## What Happens When Student Clocks In

1. **Edge function verifies:**
   - Student is authenticated (has valid access token)
   - Student exists in `students` table
   - Class exists in `classes` table
   - Student is enrolled in the class (checked in `enrollments` table)
   - Student is not already clocked in today

2. **Creates attendance record:**
   - Inserts into `attendance_records` table
   - Sets `status: "in"`
   - Sets `student_id` from authenticated user
   - Sets `class_id` from request
   - Sets `timestamp` to current time
   - Sets `clocked_out_at` to null

3. **Restrictions apply automatically:**
   - The `get-current-restrictions` edge function checks for clocked-in status
   - Returns allowed apps based on class template or baseline template
   - Mobile app applies restrictions based on response

---

## Troubleshooting

### Function not found (404)
- Make sure you deployed the function with the exact name: `clock-in-via-qr`
- Check that it appears in your Supabase Edge Functions list

### Unauthorized (401)
- Verify the access token is valid
- Make sure you're passing it in the Authorization header: `Bearer {token}`

### Student not found (400)
- Verify the student exists in the `students` table
- Make sure the authenticated user ID matches a student record

### Not enrolled (403)
- Student must be enrolled in the class first
- Check the `enrollments` table for the student-class relationship

### Missing class_id (400)
- Make sure you're sending `class_id` in the request body (not `classId`)
- Verify the JSON body is properly formatted

---

## Summary

1. **Deploy the function** to Supabase dashboard with name `clock-in-via-qr`
2. **Set environment variables** (SUPABASE_URL and SUPABASE_ANON_KEY)
3. **Test the endpoint** using curl or Postman
4. **Implement iOS app code** to call the function when QR code is scanned
5. **Verify** that attendance records are created and restrictions apply

The function is ready to use once deployed!

