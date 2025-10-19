# RealEstateConnect - Property Display Workflow

## How Properties Appear on the Platform

### For Property Owners

1. **Upload a Property**
   - Login as a property owner
   - Go to Dashboard
   - Click "Upload Property" button
   - Fill in all property details (title, description, location, price, etc.)
   - Upload property images
   - Submit the property

2. **Immediate Publishing**
   - After submission, your property is immediately visible to customers
   - No admin review or approval is required
   - You can update or delete your listing at any time from your dashboard

### For Admins
Admins no longer approve or reject listings. They can still view system diagnostics and users.

### For Customers

1. **Browse Properties**
   - Home page shows the latest listed properties
   - Properties page shows all listed properties
   - Dashboard shows all listed properties plus favorites

2. **Filter and Search**
   - Use search bar to find properties by location or title
   - Filter by property type (house, apartment, land)
   - Filter by price range

3. **Interact with Properties**
   - Click the heart icon to add to favorites
   - Click "View" or the card to see full details
   - Click "Book Now" to make a booking/purchase request

## Important Notes

- **Only APPROVED properties are visible to customers**
- Properties appear in chronological order (newest first)
- Home page limits to 6 latest properties for better UX
- Properties page shows ALL approved properties
- Each property displays owner information in the details view
- Property owners can mark approved properties as "Sold"

## Troubleshooting

### "No properties available" message?

1. **Check if any properties have been uploaded**
   - Admin: Check the admin dashboard for pending properties
   - Owner: Check your dashboard - do you have properties?

2. **Check property status**
   - Only properties with status="approved" appear to customers
   - Pending properties need admin approval first
   - Rejected properties won't appear

3. **Approve pending properties**
   - Admin needs to go to admin dashboard
   - Review and approve pending properties
   - Properties will immediately appear on the platform

### Property not showing after approval?

1. **Refresh the page** - Properties should appear immediately
2. **Check browser console** - Look for any error messages
3. **Verify status** - In admin dashboard, confirm status is "approved"

## Database Structure

Properties are stored with these statuses:
- `pending` - Waiting for admin review
- `approved` - Live and visible to all users
- `rejected` - Declined by admin
- `sold` - Marked as sold by owner (still visible but marked)

## Quick Start Guide

To test the property display system:

1. **Create a Property Owner Account**
   - Go to the signup page
   - Select "Property Owner" as role
   - Complete registration

2. **Upload a Test Property**
   - Login as the property owner
   - Go to Dashboard
   - Click "Upload Property"
   - Fill in property details:
     - Title: "Modern 3BR Apartment in Kigali"
     - Location: "Kigali, Rwanda"
     - Price: 50000000 (RWF)
     - Type: Apartment
     - Bedrooms: 3, Bathrooms: 2
     - Area: 150 sqm
     - Description: Add a detailed description
   - Upload images
   - Submit

3. **Approve the Property (as Admin)**
   - Open a new browser window or incognito mode
   - Go to `/admin-login`
   - Login with:
     - Email: `admin@realestateconnect.rw`
     - Password: `Admin@2024!Secure`
   - You'll see the pending property
   - Click "Approve"

4. **View the Property (as Customer)**
   - Go back to the home page
   - You should now see the property in the "Latest Properties" section
   - Go to the Properties page to see it in the full listing
   - Login as a customer to favorite or book it

## Console Logs for Debugging

The server logs the following information:
- Total properties fetched from database
- Number of properties after filtering by status
- Number of properties returned to client

Check the server logs in the Supabase Edge Functions dashboard to debug property fetching issues.
