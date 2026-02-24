# iOS QR Code Clock-In Implementation Guide

## Overview
When a student scans the QR code displayed by the teacher (via "View QR" button), the iOS app should automatically clock them in using their authenticated student ID and school ID. This will create an attendance record with `status: "in"` in Supabase, which automatically applies restrictions.

## How It Works
1. Teacher clicks "View QR" → QR code displays with URL: `https://your-domain.com/confirm-attendance/{classId}?t={timestamp}`
2. Student scans QR code → App detects it's a URL
3. App extracts `classId` from URL path: `/confirm-attendance/:classId`
4. App calls `clock-in-via-qr` edge function with student's auth token
5. Edge function creates attendance record with `status: "in"` in Supabase
6. Restrictions apply automatically (get-current-restrictions checks for clocked-in status)

## Edge Function Endpoint
- **URL**: `https://dqynrbjixuidwqiacggx.supabase.co/functions/v1/clock-in-via-qr`
- **Method**: POST
- **Headers**: 
  - `Authorization: Bearer {student_access_token}`
  - `Content-Type: application/json`
- **Body**: `{ "class_id": "{classId}" }`
- **Response**: 
  ```json
  {
    "ok": true,
    "message": "Successfully clocked in",
    "class_id": "...",
    "class_subject": "...",
    "class_period": "...",
    "attendance_id": "..."
  }
  ```

## Implementation Steps

### Step 1: Update ScanQRView.swift - Camera Callback Handler

Replace the camera callback handler in your `ScanQRView.swift` with this code:

```swift
.task {
    await camera.start { code in
        withAnimation { lastCode = code }

        // NEW: Check if it's a URL (QR code for clock-in)
        if let url = URL(string: code),
           url.scheme == "http" || url.scheme == "https" {
            // Extract classId from path: /confirm-attendance/:classId
            let pathComponents = url.pathComponents
            if pathComponents.count >= 3 && pathComponents[1] == "confirm-attendance" {
                let classId = pathComponents[2]
                await clockInViaQR(classId: classId)
                return // Don't process as 6-digit code
            }
        }

        // Existing 6-digit code handling (enrollment)
        if let match = code.firstMatch(of: /(?:^|\D)(\d{6})(?!\d)/) {
            let sixDigitCode = String(match.1)
            enrollStep = .confirm
            showEnrollSheet = true
        }
    }
}
```

### Step 2: Add Clock-In Function to ScanQRView.swift

Add this state variable and function inside your `ScanQRView` struct:

```swift
@State private var isClockInLoading = false

// MARK: - Clock-In via QR Code

private func clockInViaQR(classId: String) async {
    guard let token = SessionStore.shared.accessToken else {
        await MainActor.run {
            toast = "Please sign in to clock in"
        }
        return
    }

    await MainActor.run {
        isClockInLoading = true
    }

    defer {
        Task { @MainActor in
            isClockInLoading = false
        }
    }

    do {
        let result = try await SupabaseClient.shared.clockInViaQR(classId: classId, token: token)
        
        await MainActor.run {
            if result.ok {
                toast = result.message ?? "Successfully clocked in!"
            } else if let error = result.error {
                if error.contains("not enrolled") {
                    toast = "You're not enrolled in this class"
                } else if error.contains("Already clocked in") || result.message?.contains("Already") == true {
                    toast = "Already clocked in"
                } else {
                    toast = error
                }
            } else {
                toast = "Failed to clock in"
            }
        }
    } catch {
        await MainActor.run {
            toast = "Network error. Please try again."
        }
    }
}
```

### Step 3: Add Loading Indicator to UI

Add this in your VStack where you show the QR code (after the `lastCode` text):

```swift
if isClockInLoading {
    ProgressView()
        .progressViewStyle(CircularProgressViewStyle(tint: .white))
        .scaleEffect(1.2)
        .padding(.top, 8)
}
```

### Step 4: Add Response Struct and Function to SupabaseClient.swift

Add this struct and extension to your `SupabaseClient.swift` file:

```swift
// Response struct for clock-in API
struct ClockInResponse: Codable {
    let ok: Bool
    let message: String?
    let error: String?
    let class_id: String?
    let class_subject: String?
    let class_period: String?
    let attendance_id: String?
}

// Extension to SupabaseClient
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

## Complete Updated ScanQRView.swift Structure

Here's how your `ScanQRView` should be structured:

```swift
struct ScanQRView: View {
    @StateObject private var camera = CameraSessionController()
    @State private var lastCode: String?
    @State private var isClockInLoading = false  // ADD THIS
    
    // Enroll flow
    @State private var showEnrollSheet = false
    @State private var enrollStep: EnrollStep = .enter
    @State private var sixDigitCode: String = ""
    @State private var toast: String?

    var body: some View {
        // ... existing UI code ...
        // In your VStack, add the loading indicator after lastCode:
        if isClockInLoading {
            ProgressView()
                .progressViewStyle(CircularProgressViewStyle(tint: .white))
                .scaleEffect(1.2)
                .padding(.top, 8)
        }
        // ... rest of UI ...
    }
    
    // ADD THIS FUNCTION
    private func clockInViaQR(classId: String) async {
        // ... function code from Step 2 ...
    }
}
```

## Important Notes

1. **Authentication**: Make sure `SessionStore.shared.accessToken` contains the student's Supabase auth token
2. **Error Handling**: The function handles:
   - Not enrolled in class
   - Already clocked in
   - Authentication errors
   - Network errors
3. **Restrictions**: Once clocked in, restrictions apply automatically via `get-current-restrictions` edge function
4. **URL Format**: The QR code URL format is: `/confirm-attendance/{classId}?t={timestamp}`

## Testing Checklist

- [ ] Scan QR code with URL format → Should call clock-in function
- [ ] Scan 6-digit code → Should still work for enrollment
- [ ] Test with authenticated student → Should clock in successfully
- [ ] Test with unauthenticated student → Should show error message
- [ ] Test with student not enrolled → Should show "not enrolled" message
- [ ] Test already clocked in → Should show "already clocked in" message
- [ ] Verify restrictions apply after clock-in

## Troubleshooting

- **"Please sign in to clock in"**: Check that `SessionStore.shared.accessToken` is set
- **Network error**: Check internet connection and edge function URL
- **"Not enrolled"**: Student needs to enroll in class first using 6-digit code
- **"Class not found"**: Verify the classId extracted from URL is correct

