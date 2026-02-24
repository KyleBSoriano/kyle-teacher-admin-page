# Token Refresh Fix Guide

## What is Token Refresh?

**Token refresh is NOT an edge function** - it's handled automatically by the Supabase SDK in your iOS app.

### How Supabase Auth Works:

1. **Access Token** - Short-lived (usually 1 hour), used for API calls
2. **Refresh Token** - Long-lived (usually 30+ days), used to get new access tokens
3. **Session** - Contains both tokens, stored locally on device

### The Problem:

When the access token expires, the Supabase SDK should automatically:
1. Use the refresh token to get a new access token
2. Update the session
3. Continue working without user noticing

**If this isn't working**, students get logged out when the token expires.

---

## How Token Refresh Should Work

### In iOS App (Supabase Swift SDK):

The Supabase Swift SDK has built-in token refresh. You just need to:

1. **Store the session properly** when user signs up/logs in
2. **Initialize Supabase client with stored session** on app launch
3. **Let SDK handle auto-refresh** - it does this automatically

---

## Current State Analysis

### What Happens Now:

1. **Student signs up** → Gets `access_token` and `refresh_token` from `student-signup` edge function
2. **iOS app stores tokens** in `SessionStore.shared.accessToken`
3. **Token expires** (after ~1 hour)
4. **App tries to use expired token** → Gets 401 Unauthorized
5. **Student has to log back in** ❌

### What Should Happen:

1. **Student signs up** → Gets `access_token` and `refresh_token`
2. **iOS app stores FULL SESSION** (not just access token)
3. **Token expires** (after ~1 hour)
4. **Supabase SDK automatically refreshes** using refresh token
5. **Student stays logged in** ✅

---

## The Fix: iOS App Changes

### Problem 1: Only Storing Access Token

**Current (WRONG):**
```swift
SessionStore.shared.accessToken = token  // Only storing access token
```

**Should Be:**
```swift
// Store the full session with both access_token and refresh_token
SessionStore.shared.session = session
```

### Problem 2: Not Using Supabase SDK's Session Management

**Current (WRONG):**
```swift
// Manually storing token
SessionStore.shared.accessToken = token

// Manually using token in API calls
request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
```

**Should Be:**
```swift
// Use Supabase SDK's session management
let supabase = SupabaseClient(supabaseURL: url, supabaseKey: key)
// SDK automatically handles token refresh!
```

---

## How to Fix in iOS App

### Step 1: Store Full Session (Not Just Access Token)

When student signs up or logs in, store the **entire session**:

```swift
// After signup/login
let session = Session(
    accessToken: response.access_token,
    refreshToken: response.refresh_token,
    expiresAt: Date().addingTimeInterval(3600) // 1 hour
)

SessionStore.shared.session = session
```

### Step 2: Initialize Supabase Client with Session

On app launch, restore the session:

```swift
// In AppDelegate or App initialization
if let session = SessionStore.shared.session {
    supabase.auth.setSession(session) { result in
        switch result {
        case .success:
            // Session restored, SDK will auto-refresh
            print("✅ Session restored")
        case .failure:
            // Session expired, need to re-login
            print("❌ Session expired")
            SessionStore.shared.session = nil
        }
    }
}
```

### Step 3: Use Supabase SDK for API Calls

Instead of manually making HTTP requests, use Supabase SDK:

```swift
// OLD WAY (manual token management):
let token = SessionStore.shared.accessToken
request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")

// NEW WAY (SDK handles token refresh automatically):
let response = try await supabase.functions.invoke("clock-in-via-qr", 
    parameters: ["class_id": classId]
)
// SDK automatically adds Authorization header with refreshed token!
```

### Step 4: Listen for Auth State Changes

Set up listener to handle token refresh events:

```swift
supabase.auth.onAuthStateChange { [weak self] event, session in
    switch event {
    case .tokenRefreshed:
        // Token was refreshed automatically
        SessionStore.shared.session = session
        print("✅ Token refreshed automatically")
    case .signedOut:
        // User was signed out (token refresh failed)
        SessionStore.shared.session = nil
        print("❌ Session expired, need to re-login")
    default:
        break
    }
}
```

---

## Complete iOS Implementation Example

### SessionStore.swift (Updated)

```swift
import Foundation
import Supabase

class SessionStore: ObservableObject {
    static let shared = SessionStore()
    
    @Published var session: Session?
    
    private let sessionKey = "supabase_session"
    
    init() {
        loadSession()
    }
    
    // Load session from UserDefaults on app launch
    func loadSession() {
        if let data = UserDefaults.standard.data(forKey: sessionKey),
           let session = try? JSONDecoder().decode(Session.self, from: data) {
            self.session = session
        }
    }
    
    // Save session to UserDefaults
    func saveSession(_ session: Session) {
        self.session = session
        if let data = try? JSONEncoder().encode(session) {
            UserDefaults.standard.set(data, forKey: sessionKey)
        }
    }
    
    // Clear session (on logout)
    func clearSession() {
        self.session = nil
        UserDefaults.standard.removeObject(forKey: sessionKey)
    }
    
    // Get current access token (for backward compatibility)
    var accessToken: String? {
        return session?.accessToken
    }
}
```

### App Initialization (Updated)

```swift
import SwiftUI
import Supabase

@main
struct YourApp: App {
    @StateObject private var sessionStore = SessionStore.shared
    
    init() {
        // Initialize Supabase client
        let supabase = SupabaseClient(
            supabaseURL: URL(string: "https://dqynrbjixuidwqiacggx.supabase.co")!,
            supabaseKey: "YOUR_ANON_KEY"
        )
        
        // Restore session if exists
        if let session = sessionStore.session {
            Task {
                do {
                    try await supabase.auth.setSession(session)
                    print("✅ Session restored")
                } catch {
                    print("❌ Session expired: \(error)")
                    sessionStore.clearSession()
                }
            }
        }
        
        // Listen for auth state changes (including token refresh)
        supabase.auth.onAuthStateChange { event, session in
            switch event {
            case .tokenRefreshed:
                if let session = session {
                    sessionStore.saveSession(session)
                }
            case .signedOut:
                sessionStore.clearSession()
            default:
                break
            }
        }
    }
    
    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(sessionStore)
        }
    }
}
```

### Using Supabase SDK for API Calls

```swift
// Instead of manual HTTP requests, use Supabase SDK:
extension SupabaseClient {
    func clockInViaQR(classId: String) async throws -> ClockInResponse {
        // SDK automatically handles:
        // 1. Adding Authorization header
        // 2. Refreshing token if expired
        // 3. Retrying on 401 errors
        
        let response: ClockInResponse = try await functions
            .invoke("clock-in-via-qr", parameters: ["class_id": classId])
        
        return response
    }
}
```

---

## Key Points

1. **Token refresh is NOT an edge function** - it's handled by Supabase SDK
2. **Store the full session** (access_token + refresh_token), not just access_token
3. **Use Supabase SDK** for API calls instead of manual HTTP requests
4. **SDK auto-refreshes** tokens in the background
5. **Listen for auth events** to handle refresh/signout

---

## Testing Token Refresh

1. **Sign in** to the app
2. **Wait 1 hour** (or manually expire token)
3. **Make an API call** (e.g., scan QR code)
4. **SDK should automatically refresh** token and succeed
5. **Student should NOT be logged out**

---

## Summary

**The fix is in the iOS app, not an edge function:**

1. ✅ Store full session (access_token + refresh_token)
2. ✅ Use Supabase SDK for API calls (not manual HTTP)
3. ✅ Initialize SDK with stored session on app launch
4. ✅ Listen for token refresh events
5. ✅ SDK handles everything automatically!

The Supabase Swift SDK has built-in token refresh - you just need to use it properly instead of manually managing tokens.

