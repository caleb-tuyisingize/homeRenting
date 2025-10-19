# Troubleshooting Guide - Property Retrieval Issues

## Problem: Properties Not Showing Up

If properties are not appearing on your site, follow these steps to diagnose and fix the issue.

### Step 1: Check Browser Console Logs

Open your browser's Developer Tools (F12) and check the Console tab for detailed logging:

**What to look for:**
- `[HomePage]`, `[PropertiesPage]`, `[Dashboard]` prefixed logs showing fetch attempts
- Response status codes (should be 200)
- Property counts at each stage
- Any error messages

**Example healthy logs:**
```
[PropertiesPage] Fetching properties from: https://xxx.supabase.co/...
[PropertiesPage] Response status: 200
[PropertiesPage] Received data: {...}
[PropertiesPage] Properties count: 5
[PropertiesPage] Valid properties after filter: 5
```

### Step 2: Check Server Logs

Look at the Supabase Edge Function logs for server-side diagnostics:

**What to look for:**
- `[GET /properties]` logs showing query parameters
- Raw KV response counts
- Validation results
- Filter application results

**Example healthy logs:**
```
[GET /properties] Query params - status: approved, location: null...
[GET /properties] Raw KV response: 5 items
[GET /properties] After validation: 5 valid properties
[GET /properties] Status filter 'approved': 5 → 3 properties
[GET /properties] Final result: Returning 3 properties to client
```

### Step 3: Use the Diagnostics Panel

**For Administrators:**
1. Log in as admin
2. Go to Admin Dashboard
3. Click on the **Diagnostics** tab
4. Click **Run Diagnostics**

The diagnostics panel will show:
- **Total Items**: Number of property records in database
- **Valid Properties**: Properties with required fields (id, title)
- **Pending/Approved/Rejected**: Count by status
- **Detailed item list**: Each property's status and structure

**Common Issues Identified:**

#### Issue 1: No Items in Database
```
Total Items: 0
Valid Properties: 0
```
**Solution**: No properties have been uploaded yet. Property owners need to upload properties through the "Upload Property" form.

#### Issue 2: Items But No Valid Properties
```
Total Items: 5
Valid Properties: 0
```
**Solution**: Data corruption - properties are stored but missing required fields. Contact support or re-upload properties.

#### Issue 3: No Properties Visible
```
Total Items: 5
Valid Properties: 5
```
**Solution**: Properties are listed immediately. Check filters and network. No admin approval required.

#### Issue 4: Properties Exist But Don't Show on Site
```
Total Items: 3
Approved: 3
```
But still not showing on HomePage/PropertiesPage.

**Solution**: Check browser console for fetch errors. Possible CORS or authentication issues.

### Step 4: Verify Property Workflow

The simplified property flow is:

1. **Upload** (Property Owner)
   - Owner fills out property form
   - Server stores and immediately lists the property

2. **Public Display** (All Users)
   - Property appears on HomePage and PropertiesPage
   - Customers can view, favorite, and book immediately

### Step 5: Common Fixes

#### Fix 1: Clear Browser Cache
Sometimes cached responses cause issues:
1. Open Developer Tools (F12)
2. Right-click refresh button
3. Select "Empty Cache and Hard Reload"

#### Fix 2: Check Role Permissions
- Only users with `role: 'owner'` can upload properties
- Check user profile in browser console: `localStorage` → check auth data

#### Fix 3: Verify API Endpoint
The properties endpoint is:
```
https://{projectId}.supabase.co/functions/v1/make-server-d4068603/properties
```

Query parameters:
- `status=approved` - Only show approved properties
- `location=Kigali` - Filter by location
- `type=house` - Filter by property type
- `minPrice=100000` - Minimum price filter
- `maxPrice=1000000` - Maximum price filter

### Step 6: Manual Database Check

You can manually check the database state using the diagnostic endpoint:

```bash
curl https://{projectId}.supabase.co/functions/v1/make-server-d4068603/debug/properties \
  -H "Authorization: Bearer {publicAnonKey}"
```

This returns detailed JSON about all properties in the database.

### Step 7: Test Property Creation

To test if property creation works:

1. Log in as a property owner
2. Click "Upload Property"
3. Fill in all required fields:
   - Title (required)
   - Description (required)
   - Location (required)
   - Price (required)
   - Type (required)
   - Duration (required)
   - At least one image URL
4. Click Submit
5. Check browser console for:
   - Success toast notification
   - Network request to `/properties` POST
   - Response status 200

6. Check server logs for:
   - `[POST /properties] Creating property...`
   - `[POST /properties] Verification - Property saved successfully: YES`

7. Log in as admin and check if property appears in "Pending Review"

### Step 8: Contact Support

If none of the above steps resolve the issue, provide the following information:

1. **Browser Console Logs**: Copy all logs with `[HomePage]`, `[PropertiesPage]`, `[Dashboard]` prefixes
2. **Diagnostics Panel Results**: Screenshot or copy the diagnostics data
3. **Server Logs**: Copy relevant server logs from Supabase dashboard
4. **Steps to Reproduce**: What actions you took before the issue appeared
5. **User Role**: Are you logged in as admin, owner, or customer?

## Prevention

To prevent property retrieval issues:

1. **Always upload complete property data**: Fill all required fields
2. **Use valid image URLs**: Ensure images are accessible
3. **Wait for admin approval**: Properties won't show until approved
4. **Don't modify database directly**: Use the application interface
5. **Monitor diagnostics regularly**: Check the diagnostics panel weekly

## Technical Details

### Database Structure

Properties are stored in the KV store with this structure:

```typescript
{
  id: string;              // UUID
  title: string;           // Property title
  description: string;     // Detailed description
  location: string;        // Location/address
  price: number;          // Price in RWF
  type: string;           // 'house' | 'apartment' | 'land'
  bedrooms?: number;      // Number of bedrooms
  bathrooms?: number;     // Number of bathrooms
  area?: number;          // Area in m²
  images: string[];       // Array of image URLs
  duration: string;       // Listing duration
  status: string;         // 'pending' | 'approved' | 'rejected' | 'sold'
  ownerId: string;        // Owner's user ID
  ownerName: string;      // Owner's name
  ownerEmail: string;     // Owner's email
  createdAt: string;      // ISO timestamp
  expiryDate: string;     // ISO timestamp
  approvedAt?: string;    // ISO timestamp
  rejectedAt?: string;    // ISO timestamp
  rejectionReason?: string; // If rejected
}
```

### API Endpoints

- `GET /make-server-d4068603/properties` - List all properties (with filters)
- `GET /make-server-d4068603/properties/:id` - Get single property
- `POST /make-server-d4068603/properties` - Create property (owner only)
- `PUT /make-server-d4068603/properties/:id` - Update property
- `DELETE /make-server-d4068603/properties/:id` - Delete property
// Admin approval endpoints no longer required for visibility
- `GET /make-server-d4068603/debug/properties` - Diagnostics endpoint

### Filter Logic

When fetching properties, the server applies filters in this order:

1. Fetch all properties from KV store with prefix `property:`
2. Validate: Remove null/invalid items
3. Filter by location (case-insensitive substring match)
4. Filter by status (exact match)
5. Filter by price range (min/max)
6. Filter by type (exact match)
7. Sort by creation date (newest first)
8. Return results

### Logging Prefixes

- `[GET /properties]` - Property list endpoint
- `[POST /properties]` - Property creation endpoint
- `[DEBUG]` - Diagnostics endpoint
- `[HomePage]` - HomePage component
- `[PropertiesPage]` - PropertiesPage component
- `[Dashboard]` - Dashboard component
- `[Diagnostics]` - Diagnostics panel

All logs include contextual information to help debug issues.
