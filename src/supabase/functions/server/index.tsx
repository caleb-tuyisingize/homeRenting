import { Hono } from 'npm:hono';
import { cors } from 'npm:hono/cors';
import { logger } from 'npm:hono/logger';
import { createClient } from 'npm:@supabase/supabase-js';
import * as kv from './kv_store.tsx';

const app = new Hono();

app.use('*', cors());
app.use('*', logger(console.log));

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

// Initialize Storage Bucket for Property Images
async function initializeStorageBucket() {
  const bucketName = 'make-d4068603-property-images';
  try {
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some(bucket => bucket.name === bucketName);
    
    if (!bucketExists) {
      const { error } = await supabase.storage.createBucket(bucketName, {
        public: false,
        fileSizeLimit: 5242880, // 5MB
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/jpg', 'image/webp']
      });
      
      if (error) {
        console.log(`Bucket creation error: ${error.message}`);
      } else {
        console.log(`✓ Storage bucket '${bucketName}' created successfully`);
      }
    }
  } catch (error) {
    console.log(`Initialize storage error: ${error}`);
  }
}

// Initialize System Admin
async function initializeAdmin() {
  try {
    // Check if admin already exists
    const existingAdmin = await kv.get('admin:initialized');
    if (existingAdmin) {
      return;
    }

    // Create admin user
    const adminEmail = 'admin@realestateconnect.rw';
    const adminPassword = 'Admin@2024!Secure';
    
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      user_metadata: { name: 'System Administrator', role: 'admin' },
      email_confirm: true
    });

    if (authError && !authError.message.includes('already registered')) {
      console.log(`Admin creation error: ${authError.message}`);
      return;
    }

    const adminId = authData?.user?.id || (await supabase.auth.admin.listUsers()).data.users.find(u => u.email === adminEmail)?.id;

    if (adminId) {
      // Store admin profile
      await kv.set(`user:${adminId}`, {
        id: adminId,
        email: adminEmail,
        name: 'System Administrator',
        role: 'admin',
        isActive: true,
        createdAt: new Date().toISOString()
      });

      await kv.set('admin:initialized', true);
      console.log(`✓ System Admin initialized`);
      console.log(`  Email: ${adminEmail}`);
      console.log(`  Password: ${adminPassword}`);
    }
  } catch (error) {
    console.log(`Initialize admin error: ${error}`);
  }
}

// Initialize on startup
initializeStorageBucket();
initializeAdmin();

// Auth Routes
app.post('/make-server-d4068603/signup', async (c) => {
  try {
    const { email, password, name, role } = await c.req.json();
    
    // Validate role
    if (!['customer', 'owner'].includes(role)) {
      return c.json({ error: 'Invalid role. Must be customer or owner' }, 400);
    }

    // Create user with Supabase Auth
    // Automatically confirm email since we haven't configured an email server
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name, role },
      email_confirm: true
    });

    if (authError) {
      console.log(`Signup error: ${authError.message}`);
      return c.json({ error: authError.message }, 400);
    }

    // Store user profile in KV store
    await kv.set(`user:${authData.user.id}`, {
      id: authData.user.id,
      email,
      name,
      role,
      isActive: true,
      convertedToOwner: false,
      createdAt: new Date().toISOString()
    });

    return c.json({ 
      user: authData.user,
      message: 'Account created successfully! You can now login.'
    });
  } catch (error) {
    console.log(`Signup error: ${error}`);
    return c.json({ error: 'Failed to create user' }, 500);
  }
});

// Get user profile
app.get('/make-server-d4068603/profile', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'No access token provided' }, 401);
    }

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const profile = await kv.get(`user:${user.id}`);
    return c.json({ profile: profile || user.user_metadata });
  } catch (error) {
    console.log(`Get profile error: ${error}`);
    return c.json({ error: 'Failed to get profile' }, 500);
  }
});

// Update user profile
app.put('/make-server-d4068603/profile', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'No access token provided' }, 401);
    }

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const updates = await c.req.json();
    const currentProfile = await kv.get(`user:${user.id}`);
    
    const updatedProfile = { ...currentProfile, ...updates };
    await kv.set(`user:${user.id}`, updatedProfile);

    return c.json({ profile: updatedProfile });
  } catch (error) {
    console.log(`Update profile error: ${error}`);
    return c.json({ error: 'Failed to update profile' }, 500);
  }
});

// Image Upload Route
app.post('/make-server-d4068603/upload-image', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'No access token provided' }, 401);
    }

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const formData = await c.req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return c.json({ error: 'No file provided' }, 400);
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${crypto.randomUUID()}.${fileExt}`;
    const bucketName = 'make-d4068603-property-images';

    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false
      });

    if (uploadError) {
      console.log(`Image upload error: ${uploadError.message}`);
      return c.json({ error: 'Failed to upload image' }, 500);
    }

    // Get signed URL (valid for 1 year)
    const { data: urlData } = await supabase.storage
      .from(bucketName)
      .createSignedUrl(fileName, 31536000); // 1 year

    return c.json({ 
      url: urlData?.signedUrl,
      path: fileName 
    });
  } catch (error) {
    console.log(`Upload error: ${error}`);
    return c.json({ error: 'Failed to upload image' }, 500);
  }
});

// Get Notifications
app.get('/make-server-d4068603/notifications', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'No access token provided' }, 401);
    }

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const notifications = await kv.get(`user:${user.id}:notifications`) || [];
    return c.json({ notifications });
  } catch (error) {
    console.log(`Get notifications error: ${error}`);
    return c.json({ error: 'Failed to get notifications' }, 500);
  }
});

// Mark notification as read
app.put('/make-server-d4068603/notifications/:id/read', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'No access token provided' }, 401);
    }

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const notificationId = c.req.param('id');
    const notifications = await kv.get(`user:${user.id}:notifications`) || [];
    
    const updatedNotifications = notifications.map((n: any) =>
      n.id === notificationId ? { ...n, read: true } : n
    );

    await kv.set(`user:${user.id}:notifications`, updatedNotifications);
    return c.json({ success: true });
  } catch (error) {
    console.log(`Mark notification read error: ${error}`);
    return c.json({ error: 'Failed to mark notification as read' }, 500);
  }
});

// Property Routes
app.post('/make-server-d4068603/properties', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'No access token provided' }, 401);
    }

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Check if user is a property owner
    const userProfile = await kv.get(`user:${user.id}`);
    console.log(`[POST /properties] User profile for ${user.id}:`, userProfile);
    
    if (!userProfile || userProfile.role !== 'owner') {
      return c.json({ error: 'Only property owners can upload properties' }, 403);
    }

    const property = await c.req.json();
    const propertyId = crypto.randomUUID();
    
    const newProperty = {
      id: propertyId,
      ...property,
      ownerId: user.id,
      ownerName: userProfile.name,
      ownerEmail: userProfile.email,
      status: 'approved',
      createdAt: new Date().toISOString(),
      expiryDate: calculateExpiryDate(property.duration)
    };

    console.log(`[POST /properties] Creating property ${propertyId}:`, JSON.stringify(newProperty).substring(0, 200));
    await kv.set(`property:${propertyId}`, newProperty);
    
    // Verify it was saved
    const verifyProperty = await kv.get(`property:${propertyId}`);
    console.log(`[POST /properties] Verification - Property saved successfully:`, verifyProperty ? 'YES' : 'NO');
    
    // Add to user's properties list
    const userProperties = await kv.get(`user:${user.id}:properties`) || [];
    userProperties.push(propertyId);
    await kv.set(`user:${user.id}:properties`, userProperties);

    // Notify all admins about new property listing
    const allUsers = await kv.getByPrefix('user:');
    const admins = allUsers
      .map(item => item.value)
      .filter(u => u && u.role === 'admin');

    for (const admin of admins) {
      const adminNotifications = await kv.get(`user:${admin.id}:notifications`) || [];
      adminNotifications.unshift({
        id: crypto.randomUUID(),
        type: 'property_listed',
        propertyId,
        propertyTitle: newProperty.title,
        ownerName: userProfile.name,
        message: `New property "${newProperty.title}" listed by ${userProfile.name}`,
        createdAt: new Date().toISOString(),
        read: false
      });
      await kv.set(`user:${admin.id}:notifications`, adminNotifications);
    }

    return c.json({ 
      property: newProperty,
      message: 'Property listed successfully and is now visible to customers!' 
    });
  } catch (error) {
    console.log(`Create property error: ${error}`);
    return c.json({ error: 'Failed to create property' }, 500);
  }
});

// Get all properties
app.get('/make-server-d4068603/properties', async (c) => {
  try {
    const location = c.req.query('location');
    const status = c.req.query('status');
    const minPrice = c.req.query('minPrice');
    const maxPrice = c.req.query('maxPrice');
    const type = c.req.query('type');

    console.log(`[GET /properties] Query params - status: ${status}, location: ${location}, type: ${type}, minPrice: ${minPrice}, maxPrice: ${maxPrice}`);

    const allProperties = await kv.getByPrefix('property:');
    console.log(`[GET /properties] Raw KV response: ${allProperties.length} items`);
    
    // Filter out null values and ensure we have valid property objects
    let properties = allProperties
      .map(item => {
        if (!item || !item.value) {
          console.log(`[GET /properties] Warning: Found null/undefined item in KV results`);
          return null;
        }
        return item.value;
      })
      .filter(p => {
        if (p === null || p === undefined || typeof p !== 'object') {
          return false;
        }
        if (!p.id || !p.title) {
          console.log(`[GET /properties] Warning: Property missing id or title:`, p);
          return false;
        }
        return true;
      });

    console.log(`[GET /properties] After validation: ${properties.length} valid properties`);
    
    // Log sample property for debugging
    if (properties.length > 0) {
      console.log(`[GET /properties] Sample property:`, JSON.stringify(properties[0]).substring(0, 200));
    }

    // Apply filters with null checks
    if (location) {
      const beforeFilter = properties.length;
      properties = properties.filter(p => p.location && p.location.toLowerCase().includes(location.toLowerCase()));
      console.log(`[GET /properties] Location filter '${location}': ${beforeFilter} → ${properties.length} properties`);
    }
    if (status) {
      const beforeFilter = properties.length;
      properties = properties.filter(p => p.status === status);
      console.log(`[GET /properties] Status filter '${status}': ${beforeFilter} → ${properties.length} properties`);
    }
    if (minPrice) {
      properties = properties.filter(p => p.price && p.price >= Number(minPrice));
    }
    if (maxPrice) {
      properties = properties.filter(p => p.price && p.price <= Number(maxPrice));
    }
    if (type) {
      properties = properties.filter(p => p.type === type);
    }

    // Sort by creation date (newest first)
    properties.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });

    console.log(`[GET /properties] Final result: Returning ${properties.length} properties to client`);
    return c.json({ properties });
  } catch (error) {
    console.log(`[GET /properties] ERROR: ${error}`);
    return c.json({ error: 'Failed to get properties' }, 500);
  }
});

// Get single property
app.get('/make-server-d4068603/properties/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const property = await kv.get(`property:${id}`);
    
    if (!property) {
      return c.json({ error: 'Property not found' }, 404);
    }

    return c.json({ property });
  } catch (error) {
    console.log(`Get property error: ${error}`);
    return c.json({ error: 'Failed to get property' }, 500);
  }
});

// Update property
app.put('/make-server-d4068603/properties/:id', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'No access token provided' }, 401);
    }

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const id = c.req.param('id');
    const updates = await c.req.json();
    const property = await kv.get(`property:${id}`);

    if (!property) {
      return c.json({ error: 'Property not found' }, 404);
    }

    // Check if user is owner or admin
    const userProfile = await kv.get(`user:${user.id}`);
    if (property.ownerId !== user.id && userProfile?.role !== 'admin') {
      return c.json({ error: 'Not authorized to update this property' }, 403);
    }

    const updatedProperty = { ...property, ...updates };
    await kv.set(`property:${id}`, updatedProperty);

    return c.json({ property: updatedProperty });
  } catch (error) {
    console.log(`Update property error: ${error}`);
    return c.json({ error: 'Failed to update property' }, 500);
  }
});

// Delete property
app.delete('/make-server-d4068603/properties/:id', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'No access token provided' }, 401);
    }

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const id = c.req.param('id');
    const property = await kv.get(`property:${id}`);

    if (!property) {
      return c.json({ error: 'Property not found' }, 404);
    }

    const userProfile = await kv.get(`user:${user.id}`);
    if (property.ownerId !== user.id && userProfile?.role !== 'admin') {
      return c.json({ error: 'Not authorized to delete this property' }, 403);
    }

    await kv.del(`property:${id}`);

    return c.json({ message: 'Property deleted successfully' });
  } catch (error) {
    console.log(`Delete property error: ${error}`);
    return c.json({ error: 'Failed to delete property' }, 500);
  }
});

// Favorites Routes
app.post('/make-server-d4068603/favorites', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'No access token provided' }, 401);
    }

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { propertyId } = await c.req.json();
    const favorites = await kv.get(`user:${user.id}:favorites`) || [];
    
    if (!favorites.includes(propertyId)) {
      favorites.push(propertyId);
      await kv.set(`user:${user.id}:favorites`, favorites);
    }

    return c.json({ favorites });
  } catch (error) {
    console.log(`Add favorite error: ${error}`);
    return c.json({ error: 'Failed to add favorite' }, 500);
  }
});

app.delete('/make-server-d4068603/favorites/:propertyId', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'No access token provided' }, 401);
    }

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const propertyId = c.req.param('propertyId');
    const favorites = await kv.get(`user:${user.id}:favorites`) || [];
    
    const updatedFavorites = favorites.filter(id => id !== propertyId);
    await kv.set(`user:${user.id}:favorites`, updatedFavorites);

    return c.json({ favorites: updatedFavorites });
  } catch (error) {
    console.log(`Remove favorite error: ${error}`);
    return c.json({ error: 'Failed to remove favorite' }, 500);
  }
});

app.get('/make-server-d4068603/favorites', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'No access token provided' }, 401);
    }

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const favoriteIds = await kv.get(`user:${user.id}:favorites`) || [];
    const properties = await Promise.all(
      favoriteIds.map(id => kv.get(`property:${id}`))
    );

    // Filter out null/undefined values and ensure valid property objects
    return c.json({ 
      properties: properties.filter(p => p !== null && p !== undefined && typeof p === 'object') 
    });
  } catch (error) {
    console.log(`Get favorites error: ${error}`);
    return c.json({ error: 'Failed to get favorites' }, 500);
  }
});

// Admin Routes
// Approve Property
app.put('/make-server-d4068603/admin/properties/:id/approve', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'No access token provided' }, 401);
    }

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const userProfile = await kv.get(`user:${user.id}`);
    if (userProfile?.role !== 'admin') {
      return c.json({ error: 'Admin access required' }, 403);
    }

    const propertyId = c.req.param('id');
    const property = await kv.get(`property:${propertyId}`);

    if (!property) {
      return c.json({ error: 'Property not found' }, 404);
    }

    // Update property status
    property.status = 'approved';
    property.approvedAt = new Date().toISOString();
    property.approvedBy = user.id;
    await kv.set(`property:${propertyId}`, property);

    // Notify property owner
    const ownerNotifications = await kv.get(`user:${property.ownerId}:notifications`) || [];
    ownerNotifications.unshift({
      id: crypto.randomUUID(),
      type: 'property_approved',
      propertyId,
      propertyTitle: property.title,
      message: `Your property "${property.title}" has been approved and is now live!`,
      createdAt: new Date().toISOString(),
      read: false
    });
    await kv.set(`user:${property.ownerId}:notifications`, ownerNotifications);

    return c.json({ 
      property,
      message: 'Property approved successfully' 
    });
  } catch (error) {
    console.log(`Approve property error: ${error}`);
    return c.json({ error: 'Failed to approve property' }, 500);
  }
});

// Reject Property
app.put('/make-server-d4068603/admin/properties/:id/reject', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'No access token provided' }, 401);
    }

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const userProfile = await kv.get(`user:${user.id}`);
    if (userProfile?.role !== 'admin') {
      return c.json({ error: 'Admin access required' }, 403);
    }

    const propertyId = c.req.param('id');
    const { reason } = await c.req.json();
    const property = await kv.get(`property:${propertyId}`);

    if (!property) {
      return c.json({ error: 'Property not found' }, 404);
    }

    // Update property status
    property.status = 'rejected';
    property.rejectedAt = new Date().toISOString();
    property.rejectedBy = user.id;
    property.rejectionReason = reason || 'No reason provided';
    await kv.set(`property:${propertyId}`, property);

    // Notify property owner
    const ownerNotifications = await kv.get(`user:${property.ownerId}:notifications`) || [];
    ownerNotifications.unshift({
      id: crypto.randomUUID(),
      type: 'property_rejected',
      propertyId,
      propertyTitle: property.title,
      message: `Your property "${property.title}" was not approved. Reason: ${property.rejectionReason}`,
      createdAt: new Date().toISOString(),
      read: false
    });
    await kv.set(`user:${property.ownerId}:notifications`, ownerNotifications);

    return c.json({ 
      property,
      message: 'Property rejected' 
    });
  } catch (error) {
    console.log(`Reject property error: ${error}`);
    return c.json({ error: 'Failed to reject property' }, 500);
  }
});

app.get('/make-server-d4068603/admin/users', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'No access token provided' }, 401);
    }

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const userProfile = await kv.get(`user:${user.id}`);
    if (userProfile?.role !== 'admin') {
      return c.json({ error: 'Admin access required' }, 403);
    }

    const allUsers = await kv.getByPrefix('user:');
    const users = allUsers
      .filter(item => !item.key.includes(':properties') && !item.key.includes(':favorites'))
      .map(item => item.value);

    return c.json({ users });
  } catch (error) {
    console.log(`Get users error: ${error}`);
    return c.json({ error: 'Failed to get users' }, 500);
  }
});

// Payment/Booking Routes
app.post('/make-server-d4068603/bookings', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'No access token provided' }, 401);
    }

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const userProfile = await kv.get(`user:${user.id}`);
    if (userProfile?.role !== 'customer') {
      return c.json({ error: 'Only customers can make bookings' }, 403);
    }

    const { propertyId, bookingType, paymentMethod, amount, contactInfo } = await c.req.json();
    
    // Validate property exists and is available
    const property = await kv.get(`property:${propertyId}`);
    if (!property) {
      return c.json({ error: 'Property not found' }, 404);
    }
    if (property.status !== 'approved') {
      return c.json({ error: 'Property is not available for booking' }, 400);
    }

    const bookingId = crypto.randomUUID();
    const booking = {
      id: bookingId,
      propertyId,
      customerId: user.id,
      customerName: userProfile.name,
      customerEmail: userProfile.email,
      ownerId: property.ownerId,
      bookingType, // 'purchase' or 'rent'
      paymentMethod, // 'mobile_money', 'bank_transfer', 'cash'
      amount,
      contactInfo,
      status: 'pending', // pending, confirmed, cancelled
      createdAt: new Date().toISOString()
    };

    await kv.set(`booking:${bookingId}`, booking);
    
    // Add to customer's bookings
    const customerBookings = await kv.get(`user:${user.id}:bookings`) || [];
    customerBookings.push(bookingId);
    await kv.set(`user:${user.id}:bookings`, customerBookings);

    // Add to owner's bookings
    const ownerBookings = await kv.get(`user:${property.ownerId}:bookings`) || [];
    ownerBookings.push(bookingId);
    await kv.set(`user:${property.ownerId}:bookings`, ownerBookings);

    return c.json({ 
      booking,
      message: 'Booking created successfully! The property owner will contact you soon.' 
    });
  } catch (error) {
    console.log(`Create booking error: ${error}`);
    return c.json({ error: 'Failed to create booking' }, 500);
  }
});

// Get user's bookings
app.get('/make-server-d4068603/bookings', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'No access token provided' }, 401);
    }

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const bookingIds = await kv.get(`user:${user.id}:bookings`) || [];
    const bookings = await Promise.all(
      bookingIds.map(id => kv.get(`booking:${id}`))
    );

    // Get property details for each booking
    const bookingsWithProperties = await Promise.all(
      bookings
        .filter(b => b !== null && b !== undefined && typeof b === 'object')
        .map(async (booking) => {
          const property = await kv.get(`property:${booking.propertyId}`);
          return { 
            ...booking, 
            property: property || { 
              title: 'Property Unavailable',
              location: 'N/A'
            }
          };
        })
    );

    return c.json({ bookings: bookingsWithProperties });
  } catch (error) {
    console.log(`Get bookings error: ${error}`);
    return c.json({ error: 'Failed to get bookings' }, 500);
  }
});

// Update booking status
app.put('/make-server-d4068603/bookings/:id', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'No access token provided' }, 401);
    }

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const bookingId = c.req.param('id');
    const { status } = await c.req.json();
    
    const booking = await kv.get(`booking:${bookingId}`);
    if (!booking) {
      return c.json({ error: 'Booking not found' }, 404);
    }

    // Only owner can update booking status
    if (booking.ownerId !== user.id) {
      return c.json({ error: 'Not authorized to update this booking' }, 403);
    }

    const updatedBooking = { ...booking, status };
    await kv.set(`booking:${bookingId}`, updatedBooking);

    return c.json({ booking: updatedBooking });
  } catch (error) {
    console.log(`Update booking error: ${error}`);
    return c.json({ error: 'Failed to update booking' }, 500);
  }
});

// Diagnostic endpoint to debug KV store issues
app.get('/make-server-d4068603/debug/properties', async (c) => {
  try {
    console.log('[DEBUG] Starting diagnostic check...');
    
    // Get all properties from KV
    const allItems = await kv.getByPrefix('property:');
    console.log(`[DEBUG] Found ${allItems.length} items with prefix 'property:'`);
    
    const diagnostics = {
      totalItems: allItems.length,
      items: allItems.map((item, index) => ({
        index,
        key: item.key,
        hasValue: !!item.value,
        valueType: typeof item.value,
        isNull: item.value === null,
        isUndefined: item.value === undefined,
        hasId: item.value?.id ? true : false,
        hasTitle: item.value?.title ? true : false,
        status: item.value?.status || 'N/A',
        preview: item.value ? JSON.stringify(item.value).substring(0, 150) : 'null'
      })),
      validProperties: allItems.filter(item => 
        item.value && typeof item.value === 'object' && item.value.id && item.value.title
      ).length,
      pendingCount: allItems.filter(item => item.value?.status === 'pending').length,
      approvedCount: allItems.filter(item => item.value?.status === 'approved').length,
      rejectedCount: allItems.filter(item => item.value?.status === 'rejected').length,
    };
    
    console.log('[DEBUG] Diagnostics:', JSON.stringify(diagnostics, null, 2));
    
    return c.json(diagnostics);
  } catch (error) {
    console.log(`[DEBUG] Error: ${error}`);
    return c.json({ error: String(error) }, 500);
  }
});

// Helper function to calculate expiry date
function calculateExpiryDate(duration: string): string {
  const now = new Date();
  switch (duration) {
    case '1day':
      now.setDate(now.getDate() + 1);
      break;
    case '1week':
      now.setDate(now.getDate() + 7);
      break;
    case '1month':
      now.setMonth(now.getMonth() + 1);
      break;
    case '2months':
      now.setMonth(now.getMonth() + 2);
      break;
    case '3months':
      now.setMonth(now.getMonth() + 3);
      break;
    default:
      now.setMonth(now.getMonth() + 1);
  }
  return now.toISOString();
}

Deno.serve(app.fetch);
