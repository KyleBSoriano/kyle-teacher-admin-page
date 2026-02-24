# Mobile App: Automatic Restrictions Polling Implementation

## Problem Statement

Currently, restrictions are only applied when a student scans a QR code. After clock-out, restrictions remain on the phone because the app doesn't check for updates. Restrictions should be applied and removed automatically based on:

- Whether the student is clocked in
- Current time and schedule
- Period changes
- Template changes

## Current Behavior

The mobile app only calls `get-current-restrictions` when:
- Scanning QR code
- Manual refresh
- App comes to foreground

**This means:**
- Restrictions don't update when period changes
- Restrictions don't update when templates change
- Restrictions don't get removed when student is clocked out
- Student must scan QR code again to get updated restrictions

## Required Behavior

The mobile app should:
1. **Poll `get-current-restrictions` every 10-30 seconds** while:
   - App is in foreground
   - Student is clocked in (or was recently clocked in)
2. **Check the `clocked_in` field** in the response
3. **Immediately remove restrictions** when `clocked_in: false`
4. **Update restrictions** when response changes (different apps, different period, etc.)

## Implementation Guide

### Step 1: Set Up Polling Timer

Create a polling mechanism that calls `get-current-restrictions` periodically:

```swift
// Pseudo-code structure
class RestrictionsManager {
    private var pollingTimer: Timer?
    private let pollingInterval: TimeInterval = 15.0 // 15 seconds
    
    func startPolling() {
        // Only poll if student is clocked in
        guard isClockedIn() else {
            stopPolling()
            return
        }
        
        pollingTimer = Timer.scheduledTimer(withTimeInterval: pollingInterval, repeats: true) { [weak self] _ in
            self?.fetchCurrentRestrictions()
        }
    }
    
    func stopPolling() {
        pollingTimer?.invalidate()
        pollingTimer = nil
    }
    
    func fetchCurrentRestrictions() {
        // Call get-current-restrictions edge function
    }
}
```

### Step 2: Call the Edge Function

Implement the API call to `get-current-restrictions`:

```swift
func fetchCurrentRestrictions() async {
    guard let accessToken = SessionStore.shared.accessToken else {
        return
    }
    
    let url = URL(string: "https://YOUR_PROJECT_ID.functions.supabase.co/get-current-restrictions")!
    var request = URLRequest(url: url)
    request.httpMethod = "GET"
    request.setValue("Bearer \(accessToken)", forHTTPHeaderField: "Authorization")
    
    do {
        let (data, _) = try await URLSession.shared.data(for: request)
        let response = try JSONDecoder().decode(RestrictionsResponse.self, from: data)
        
        // Handle the response
        handleRestrictionsResponse(response)
    } catch {
        print("Error fetching restrictions: \(error)")
    }
}
```

### Step 3: Define Response Model

Create a model to parse the response:

```swift
struct RestrictionsResponse: Codable {
    let clocked_in: Bool
    let keys: [String]  // App keys that are allowed
    let catalog: [AppCatalogItem]  // Full app catalog entries
    let template_source: String?  // "baseline", "class_Period 1", etc.
    let active_period: String?  // Current period name
    let reason: String?  // "not_clocked_in", "past_admin_day_end", etc.
}

struct AppCatalogItem: Codable {
    let key: String
    let display_name: String
    let ios_bundle_id: String?
    let aliases: [String]?
}
```

### Step 4: Handle Clock-Out Response

**Critical:** Check the `clocked_in` field and remove restrictions immediately:

```swift
func handleRestrictionsResponse(_ response: RestrictionsResponse) {
    // CRITICAL: Check if student is clocked out
    if !response.clocked_in {
        // Student has been clocked out - remove ALL restrictions immediately
        removeAllRestrictions()
        stopPolling() // Stop polling since student is clocked out
        updateUI(clockedIn: false)
        return
    }
    
    // Student is still clocked in - update restrictions
    let allowedApps = response.keys
    let appCatalog = response.catalog
    
    // Apply new restrictions
    applyRestrictions(allowedApps: allowedApps, catalog: appCatalog)
    
    // Update UI to show current status
    updateUI(
        clockedIn: true,
        activePeriod: response.active_period,
        templateSource: response.template_source
    )
}
```

### Step 5: Apply Restrictions to Screen Time

Update Screen Time restrictions based on the response:

```swift
func applyRestrictions(allowedApps: [String], catalog: [AppCatalogItem]) {
    // Get all installed apps
    let allApps = getAllInstalledApps()
    
    // Create bundle ID set from catalog
    var allowedBundleIds = Set<String>()
    for item in catalog {
        if let bundleId = item.ios_bundle_id {
            allowedBundleIds.insert(bundleId)
        }
        // Also add aliases if present
        if let aliases = item.aliases {
            allowedBundleIds.formUnion(aliases)
        }
    }
    
    // Apply restrictions
    for app in allApps {
        if allowedBundleIds.contains(app.bundleId) {
            // Allow this app
            allowApp(app)
        } else {
            // Block this app
            blockApp(app)
        }
    }
}

func removeAllRestrictions() {
    // Remove all restrictions - allow all apps
    let allApps = getAllInstalledApps()
    for app in allApps {
        allowApp(app)
    }
}
```

### Step 6: Start/Stop Polling Based on Clock-In Status

Start polling when student clocks in, stop when clocked out:

```swift
// When student scans QR code and clocks in
func onClockIn() {
    // Start polling for restrictions
    startPolling()
    
    // Immediately fetch restrictions (don't wait for first poll)
    Task {
        await fetchCurrentRestrictions()
    }
}

// When student is clocked out (detected from polling)
func onClockOut() {
    // Stop polling
    stopPolling()
    
    // Remove all restrictions
    removeAllRestrictions()
    
    // Update UI
    updateUI(clockedIn: false)
}
```

### Step 7: Handle App Lifecycle

Resume polling when app comes to foreground:

```swift
// In your AppDelegate or SceneDelegate
func applicationWillEnterForeground() {
    // Check if student is clocked in
    if isClockedIn() {
        // Resume polling
        startPolling()
        
        // Immediately fetch latest restrictions
        Task {
            await fetchCurrentRestrictions()
        }
    }
}

func applicationDidEnterBackground() {
    // Optionally stop polling to save battery
    // Or continue polling with longer interval
    // stopPolling()
}
```

## Response Examples

### When Clocked In (During Period)
```json
{
  "clocked_in": true,
  "keys": ["notion", "canvas", "calendar"],
  "catalog": [
    {
      "key": "notion",
      "display_name": "Notion",
      "ios_bundle_id": "notion.id",
      "aliases": []
    },
    {
      "key": "canvas",
      "display_name": "Canvas",
      "ios_bundle_id": "instructure.ios.Student",
      "aliases": []
    }
  ],
  "template_source": "class_Period 1",
  "active_period": "Period 1"
}
```

### When Clocked Out
```json
{
  "clocked_in": false,
  "keys": [],
  "catalog": [],
  "reason": "not_clocked_in"
}
```

### When Between Periods (Baseline Template)
```json
{
  "clocked_in": true,
  "keys": ["notion", "canvas"],
  "catalog": [...],
  "template_source": "baseline",
  "active_period": null
}
```

## Testing Checklist

1. **Test Clock-Out Removal:**
   - Clock in via QR code
   - Verify restrictions are applied
   - Admin clocks out student from dashboard
   - Within 15-30 seconds, restrictions should be removed automatically
   - No need to scan QR code again

2. **Test Period Changes:**
   - Clock in during Period 1
   - Verify Period 1 template restrictions
   - Wait for Period 1 to end
   - Verify restrictions switch to baseline template automatically
   - Wait for Period 2 to start
   - Verify restrictions switch to Period 2 template automatically

3. **Test Template Changes:**
   - Clock in during a period
   - Admin changes template on website
   - Within 15-30 seconds, restrictions should update to new template

4. **Test App Lifecycle:**
   - Clock in and verify polling works
   - Put app in background
   - Bring app to foreground
   - Verify restrictions are still correct and polling resumes

5. **Test Network Errors:**
   - Clock in
   - Disable network
   - Verify app handles error gracefully
   - Re-enable network
   - Verify polling resumes and restrictions update

## Error Handling

Handle these scenarios gracefully:

```swift
func fetchCurrentRestrictions() async {
    do {
        let response = try await callAPI()
        handleRestrictionsResponse(response)
    } catch {
        // Network error - don't remove restrictions, just log error
        print("Failed to fetch restrictions: \(error)")
        
        // Optionally: Show user-friendly message
        // "Unable to update restrictions. Please check your connection."
        
        // Continue polling - don't stop on single error
    }
}
```

## Performance Considerations

1. **Polling Interval:**
   - **Recommended:** 15-30 seconds
   - Too frequent (5 seconds): Wastes battery and API calls
   - Too infrequent (60+ seconds): Delayed updates

2. **Battery Optimization:**
   - Stop polling when app is in background (optional)
   - Resume immediately when app comes to foreground
   - Use background tasks if you need to poll in background

3. **API Rate Limiting:**
   - The edge function can handle frequent calls
   - But be respectful - 15-30 second intervals are reasonable

## Integration Points

### Where to Add This Code

1. **Create a `RestrictionsManager` class:**
   - Handles all polling logic
   - Manages timer
   - Applies restrictions to Screen Time

2. **Call from QR Scanner:**
   - After successful clock-in, start polling
   - Immediately fetch restrictions

3. **Call from App Lifecycle:**
   - Resume polling when app comes to foreground
   - Optionally pause when app goes to background

4. **Call from Settings/Profile:**
   - Allow manual refresh button
   - Show current restriction status

## Summary

**Key Points:**
1. ✅ Poll `get-current-restrictions` every 15-30 seconds
2. ✅ Check `clocked_in` field - if `false`, remove ALL restrictions immediately
3. ✅ Update restrictions when response changes
4. ✅ Start polling after clock-in, stop after clock-out
5. ✅ Resume polling when app comes to foreground

**Critical:** The `clocked_in: false` response means the student has been clocked out. You MUST remove all restrictions immediately when you see this, regardless of what restrictions were previously applied.

## Questions?

If you need clarification on:
- API endpoint details
- Response format
- Error handling
- Performance optimization

Contact the backend team or refer to the edge function code in `supabase/functions/get-current-restrictions/index.ts`.

