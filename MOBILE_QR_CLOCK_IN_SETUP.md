# Mobile QR Code Clock-In Setup

## Overview

The QR code now triggers clock-in and applies restrictions for mobile app students. Here's how it works:

## Flow

1. **Teacher displays QR code** on website (via "View QR" button)
2. **Student scans QR code** with mobile app
3. **Mobile app extracts** `class_id` from QR code URL
4. **Mobile app calls** `clock-in-via-qr` Edge Function with auth token
5. **Edge Function**:
   - Verifies student is authenticated
   - Verifies student is enrolled in class
   - Creates attendance record with `status: 'in'` and `student_id`
6. **Restrictions automatically apply** via `get-current-restrictions` (checks for clocked-in status)

## QR Code Format

The QR code uses the standard web URL format:
```
https://your-domain.com/confirm-attendance/9608a350-bca6-4303-b84a-064100c90bd0?t=1234567890
```

## Mobile App Integration

Your mobile app needs to:

1. **Scan QR code** and extract the URL
2. **Parse URL** to extract `classId` from path (e.g., `/confirm-attendance/:classId`)
3. **Call Edge Function** with student's auth token (don't navigate to web page):

```swift
// Example iOS code
func handleQRCode(url: URL) {
    // Extract classId from URL path: /confirm-attendance/:classId
    let pathComponents = url.pathComponents
    guard pathComponents.count >= 3,
          pathComponents[1] == "confirm-attendance" else { return }
    
    let classId = pathComponents[2] // Get classId from path
    
    // Call Edge Function (don't navigate to web page)
    clockInViaQR(classId: classId)
}

func clockInViaQR(classId: String) {
    guard let accessToken = getAccessToken() else { return }
    
    let url = URL(string: "https://YOUR_PROJECT.functions.supabase.co/clock-in-via-qr")!
    var request = URLRequest(url: url)
    request.httpMethod = "POST"
    request.setValue("Bearer \(accessToken)", forHTTPHeaderField: "Authorization")
    request.setValue("application/json", forHTTPHeaderField: "Content-Type")
    request.httpBody = try? JSONSerialization.data(withJSONObject: ["class_id": classId])
    
    URLSession.shared.dataTask(with: request) { data, response, error in
        // Handle response
        if let data = data,
           let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
           json["ok"] as? Bool == true {
            // Successfully clocked in - restrictions will apply automatically
            print("Clocked in successfully!")
        }
    }.resume()
}
```

## Edge Function: `clock-in-via-qr`

**Endpoint**: `https://YOUR_PROJECT.functions.supabase.co/clock-in-via-qr`

**Method**: POST

**Headers**:
- `Authorization: Bearer <student_access_token>`
- `Content-Type: application/json`

**Body**:
```json
{
  "class_id": "9608a350-bca6-4303-b84a-064100c90bd0"
}
```

**Response** (Success):
```json
{
  "ok": true,
  "message": "Successfully clocked in",
  "class_id": "9608a350-bca6-4303-b84a-064100c90bd0",
  "class_subject": "math",
  "class_period": "Period 1",
  "attendance_id": "uuid-here"
}
```

**Response** (Already Clocked In):
```json
{
  "ok": true,
  "message": "Already clocked in",
  "class_id": "9608a350-bca6-4303-b84a-064100c90bd0",
  "class_subject": "math",
  "class_period": "Period 1"
}
```

**Response** (Not Enrolled):
```json
{
  "error": "Student is not enrolled in this class"
}
```

## Deploy Edge Function

1. **Deploy the function**:
   ```bash
   supabase functions deploy clock-in-via-qr --project-ref YOUR_PROJECT_REF
   ```

   Or via Supabase Dashboard:
   - Go to Edge Functions
   - Create new function: `clock-in-via-qr`
   - Paste the code from `supabase/functions/clock-in-via-qr/index.ts`
   - Deploy

2. **Set environment variables** (if not already set):
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`

## Testing

1. **Enroll student** in class (already done)
2. **Display QR code** on teacher website
3. **Scan QR code** with mobile app
4. **Mobile app calls** `clock-in-via-qr` Edge Function
5. **Check restrictions** - mobile app should poll `get-current-restrictions` and get template apps
6. **Student appears** as "CLocked In" on teacher website

## What Happens After Clock-In

1. Attendance record created with `status: 'in'` and `student_id`
2. Mobile app polls `get-current-restrictions` Edge Function
3. Edge Function checks:
   - ✅ Student is clocked in (has attendance record with `status: 'in'`)
   - ✅ Student is enrolled (has enrollment record)
   - ✅ Class has `active_template_id`
   - ✅ If demo class (no start_time/end_time), always applies template
4. Returns template apps as restrictions
5. Mobile app applies restrictions to device

## Troubleshooting

### Student not clocking in
- Check mobile app is calling Edge Function with correct auth token
- Check student is enrolled in class
- Check Edge Function logs in Supabase Dashboard

### Restrictions not applying
- Check student is clocked in (has attendance record with `status: 'in'`)
- Check class has `active_template_id` set
- Check template has apps in `apps` array
- Check mobile app is polling `get-current-restrictions` Edge Function

### Student shows as "CLocked Out" on website
- Check attendance record was created with `status: 'in'` (not 'present')
- Refresh website page
- Check `getStudentAttendanceStatus` function in StudentsPage.tsx

