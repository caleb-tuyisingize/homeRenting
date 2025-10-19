import React, { useState, useEffect } from 'react';
import { useLanguage } from '../utils/LanguageContext';
import { useAuth } from '../utils/AuthContext';
import { Building2, Users, Clock, CheckCircle2, Upload, Heart, Plus } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { PropertyCard } from './PropertyCard';
import { PropertyUploadForm } from './PropertyUploadForm';
import { PropertyDetails } from './PropertyDetails';
import { projectId } from '../utils/supabase/info';
import { toast } from 'sonner';

interface Property {
  id: string;
  title: string;
  description: string;
  location: string;
  price: number;
  type: string;
  bedrooms?: number;
  bathrooms?: number;
  area?: number;
  images: string[];
  status: string;
  ownerId: string;
  expiryDate: string;
  createdAt: string;
}

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
}

export function Dashboard() {
  const { t } = useLanguage();
  const { user, accessToken } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [properties, setProperties] = useState<Property[]>([]);
  const [favorites, setFavorites] = useState<Property[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (user?.role === 'admin') {
        if (activeTab === 'users') {
          await fetchUsers();
        } else {
          await fetchAllProperties();
        }
      } else if (user?.role === 'owner') {
        await fetchMyProperties();
      } else if (user?.role === 'customer') {
        if (activeTab === 'favorites') {
          await fetchFavorites();
        } else if (activeTab === 'bookings') {
          await fetchBookings();
        } else {
          await fetchAllProperties();
        }
      } else if (user?.role === 'owner' && activeTab === 'bookings') {
        await fetchBookings();
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllProperties = async () => {
    try {
      const url = `https://${projectId}.supabase.co/functions/v1/make-server-d4068603/properties`;
      console.log('[Dashboard] Fetching all properties from:', url);
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      console.log('[Dashboard] Response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('[Dashboard] Received properties:', data.properties?.length || 0);
        
        // Filter out null/invalid properties
        const validProperties = (data.properties || []).filter(
          (p: Property) => p && p.id && p.title
        );
        console.log('[Dashboard] Valid properties after filter:', validProperties.length);
        setProperties(validProperties);
      } else {
        const errorData = await response.text();
        console.error('[Dashboard] Failed to fetch properties:', response.status, errorData);
        toast.error('Failed to load properties');
      }
    } catch (error) {
      console.error('[Dashboard] Exception while fetching properties:', error);
      toast.error('Failed to load properties');
    }
  };

  const fetchMyProperties = async () => {
    try {
      console.log('[Dashboard] Fetching my properties for user:', user?.id);
      
      // First try to get properties from localStorage
      const localProperties = JSON.parse(localStorage.getItem('properties') || '[]');
      console.log('[Dashboard] All properties in localStorage:', localProperties.length);
      console.log('[Dashboard] Raw localStorage data:', localProperties);
      
      const myLocalProperties = localProperties.filter(
        (p: Property) => p && p.id && p.ownerId === user?.id
      );
      
      console.log('[Dashboard] My properties after filtering:', myLocalProperties.length);
      console.log('[Dashboard] My properties data:', myLocalProperties);
      
      // If no properties found, create a test property for debugging
      if (myLocalProperties.length === 0 && localProperties.length === 0) {
        console.log('[Dashboard] No properties found, creating test property for debugging');
        const testProperty = {
          id: 'test-' + Date.now(),
          title: 'Test Property',
          description: 'This is a test property to verify the system is working',
          price: 200000,
          location: 'Kigali, Rwanda',
          type: 'apartment',
          bedrooms: 2,
          bathrooms: 1,
          area: 100,
          duration: '1month',
          images: ['https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=500'],
          status: 'approved',
          ownerId: user?.id,
          createdAt: new Date().toISOString()
        };
        
        localStorage.setItem('properties', JSON.stringify([testProperty]));
        console.log('[Dashboard] Test property created:', testProperty);
        setProperties([testProperty]);
        return;
      }
      
      if (myLocalProperties.length > 0) {
        console.log('[Dashboard] Found properties in localStorage:', myLocalProperties.length);
        setProperties(myLocalProperties);
        return;
      }

      // If no local properties, try API
      const url = `https://${projectId}.supabase.co/functions/v1/make-server-d4068603/properties`;
      console.log('[Dashboard] Fetching my properties (owner) from:', url);
      console.log('[Dashboard] User ID:', user?.id);
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      console.log('[Dashboard] Response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('[Dashboard] Received total properties:', data.properties?.length || 0);
        
        // Filter out null properties and get only this owner's properties
        const validProperties = (data.properties || []).filter(
          (p: Property) => p && p.id && p.ownerId === user?.id
        );
        console.log('[Dashboard] My properties after filter:', validProperties.length);
        
        // Sort by creation date (newest first)
        validProperties.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setProperties(validProperties);
      } else {
        const errorData = await response.text();
        console.error('[Dashboard] Failed to fetch properties:', response.status, errorData);
        console.error('[Dashboard] Error details:', errorData);
        setProperties([]);
        toast.error(`Failed to load properties: ${response.status}`);
      }
    } catch (error) {
      console.error('[Dashboard] Exception while fetching properties:', error);
      setProperties([]);
      toast.error('Failed to load properties');
    }
  };

  const fetchFavorites = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-d4068603/favorites`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setFavorites(data.properties);
      }
    } catch (error) {
      console.error('Failed to fetch favorites:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-d4068603/admin/users`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  const fetchBookings = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-d4068603/bookings`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setBookings(data.bookings);
      }
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
    }
  };

  const handleApprove = async (propertyId: string) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-d4068603/properties/${propertyId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ status: 'approved' }),
        }
      );

      if (response.ok) {
        toast.success('Property approved');
        fetchData();
      }
    } catch (error) {
      console.error('Failed to approve property:', error);
      toast.error('Failed to approve property');
    }
  };

  const handleReject = async (propertyId: string) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-d4068603/properties/${propertyId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ status: 'rejected' }),
        }
      );

      if (response.ok) {
        toast.success('Property rejected');
        fetchData();
      }
    } catch (error) {
      console.error('Failed to reject property:', error);
      toast.error('Failed to reject property');
    }
  };

  const handleMarkAsSold = async (propertyId: string) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-d4068603/properties/${propertyId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ status: 'sold' }),
        }
      );

      if (response.ok) {
        toast.success('Property marked as sold');
        fetchData();
      }
    } catch (error) {
      console.error('Failed to mark as sold:', error);
      toast.error('Failed to mark as sold');
    }
  };

  const getStats = () => {
    if (user?.role === 'admin') {
      return [
        { label: 'Total Properties', value: properties.length, icon: Building2, color: 'text-blue-600' },
        { label: t('pendingApprovals'), value: properties.filter(p => p.status === 'pending').length, icon: Clock, color: 'text-yellow-600' },
        { label: 'Listed', value: properties.length, icon: CheckCircle2, color: 'text-green-600' },
        { label: 'Total Users', value: users.length, icon: Users, color: 'text-purple-600' },
      ];
    } else if (user?.role === 'owner') {
      return [
        { label: t('myProperties'), value: properties.length, icon: Building2, color: 'text-blue-600' },
        { label: t('pending'), value: properties.filter(p => p.status === 'pending').length, icon: Clock, color: 'text-yellow-600' },
        { label: 'Listed', value: properties.length, icon: CheckCircle2, color: 'text-green-600' },
        { label: 'Bookings', value: bookings.length, icon: Upload, color: 'text-purple-600' },
      ];
    } else {
      return [
        { label: 'Available Properties', value: properties.length, icon: Building2, color: 'text-blue-600' },
        { label: t('myFavorites'), value: favorites.length, icon: Heart, color: 'text-red-600' },
        { label: 'My Bookings', value: bookings.length, icon: Upload, color: 'text-emerald-600' },
      ];
    }
  };

  const renderAdminContent = () => {
    if (activeTab === 'users') {
      return (
        <div className="space-y-4">
          {users.map((u) => (
            <Card key={u.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-slate-900 dark:text-white">{u.name}</CardTitle>
                    <CardDescription>{u.email}</CardDescription>
                  </div>
                  <Badge className={
                    u.role === 'admin' ? 'bg-purple-600' :
                    u.role === 'owner' ? 'bg-blue-600' :
                    'bg-green-600'
                  }>
                    {t(u.role as any)}
                  </Badge>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      );
    }

    const pendingProperties = properties.filter(p => p.status === 'pending');
    if (pendingProperties.length === 0) {
      return (
        <div className="text-center py-12">
          <Building2 className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
          <p className="text-slate-500 dark:text-slate-400">No pending properties</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {pendingProperties.map((property) => (
          <div key={property.id} className="relative">
            <PropertyCard
              property={property}
              onViewDetails={setSelectedProperty}
            />
            <div className="mt-3 flex gap-2">
              <Button
                onClick={() => handleApprove(property.id)}
                className="flex-1 bg-green-600 hover:bg-green-700"
                size="sm"
              >
                {t('approve')}
              </Button>
              <Button
                onClick={() => handleReject(property.id)}
                variant="destructive"
                className="flex-1"
                size="sm"
              >
                {t('reject')}
              </Button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderOwnerContent = () => {
    if (activeTab === 'bookings') {
      return renderBookingsContent();
    }

    if (properties.length === 0) {
      return (
        <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-xl">
          <Building2 className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
          <h3 className="text-slate-900 dark:text-white mb-2">No Properties Yet</h3>
          <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-md mx-auto">
            Start listing your properties to reach thousands of potential buyers and renters
          </p>
          <Button onClick={() => setShowUploadForm(true)} className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="w-4 h-4 mr-2" />
            {t('uploadProperty')}
          </Button>
        </div>
      );
    }

    return (
      <>
        <div className="mb-4 flex items-center justify-between">
          <p className="text-slate-600 dark:text-slate-400">
            {properties.length} {properties.length === 1 ? 'property' : 'properties'}
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map((property) => (
            <div key={property.id} className="relative">
              <PropertyCard
                property={property}
                onViewDetails={setSelectedProperty}
              />
              <div className="mt-3 flex gap-2">
                {property.status === 'approved' && (
                  <Button
                    onClick={() => handleMarkAsSold(property.id)}
                    className="flex-1"
                    size="sm"
                    variant="outline"
                  >
                    {t('markAsSold')}
                  </Button>
                )}
                {property.status === 'pending' && (
                  <div className="flex-1 text-center text-sm text-amber-600 dark:text-amber-400 py-2">
                    ⏱ Pending (not visible to customers)
                  </div>
                )}
                {property.status === 'rejected' && (
                  <div className="flex-1 text-center text-sm text-red-600 dark:text-red-400 py-2">
                    ❌ Not approved
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </>
    );
  };

  const renderBookingsContent = () => {
    if (bookings.length === 0) {
      return (
        <div className="text-center py-12">
          <Upload className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
          <p className="text-slate-500 dark:text-slate-400">
            {user?.role === 'customer' ? 'No bookings made yet' : 'No booking requests received yet'}
          </p>
        </div>
      );
    }

    const updateBookingStatus = async (bookingId: string, status: 'confirmed' | 'cancelled') => {
      try {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-d4068603/bookings/${bookingId}`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${accessToken}`,
            },
            body: JSON.stringify({ status }),
          }
        );
        if (response.ok) {
          toast.success(status === 'confirmed' ? 'Booking confirmed' : 'Booking cancelled');
          fetchBookings();
        } else {
          const error = await response.json();
          toast.error(error.error || 'Failed to update booking');
        }
      } catch (err) {
        toast.error('Failed to update booking');
      }
    };

    return (
      <div className="space-y-4">
        {bookings.map((booking) => (
          <Card key={booking.id}>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <CardTitle className="text-slate-900 dark:text-white">
                    {booking.property?.title || 'Property'}
                  </CardTitle>
                  <CardDescription>
                    {booking.bookingType === 'purchase' ? 'Purchase' : 'Rent'} - {booking.amount.toLocaleString()} RWF
                  </CardDescription>
                  <div className="mt-2 space-y-1 text-sm text-slate-600 dark:text-slate-400">
                    {user?.role === 'owner' && (
                      <>
                        <p>Customer: {booking.customerName} ({booking.customerEmail})</p>
                        <p>Phone: {booking.contactInfo.phone}</p>
                        {booking.contactInfo.alternativePhone && (
                          <p>Alt Phone: {booking.contactInfo.alternativePhone}</p>
                        )}
                        <p>Address: {booking.contactInfo.address}</p>
                      </>
                    )}
                    {user?.role === 'customer' && (
                      <>
                        <p>Location: {booking.property?.location}</p>
                        <p>Your Phone: {booking.contactInfo.phone}</p>
                      </>
                    )}
                    <p>Payment: {booking.paymentMethod.replace('_', ' ')}</p>
                    {booking.contactInfo.notes && (
                      <p>Notes: {booking.contactInfo.notes}</p>
                    )}
                    <p>Date: {new Date(booking.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge className={
                    booking.status === 'confirmed' ? 'bg-green-600' :
                    booking.status === 'cancelled' ? 'bg-red-600' :
                    'bg-yellow-600'
                  }>
                    {booking.status}
                  </Badge>
                  {user?.role === 'owner' && booking.status === 'pending' && (
                    <div className="flex gap-2">
                      <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => updateBookingStatus(booking.id, 'confirmed')}>Confirm</Button>
                      <Button size="sm" variant="destructive" onClick={() => updateBookingStatus(booking.id, 'cancelled')}>Cancel</Button>
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>
    );
  };

  const renderCustomerContent = () => {
    if (activeTab === 'bookings') {
      return renderBookingsContent();
    }

    const displayProperties = activeTab === 'favorites' ? favorites : properties;

    if (displayProperties.length === 0) {
      return (
        <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-xl">
          {activeTab === 'favorites' ? (
            <>
              <Heart className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
              <h3 className="text-slate-900 dark:text-white mb-2">No Favorites Yet</h3>
              <p className="text-slate-500 dark:text-slate-400 mb-4">
                Save properties you like to easily find them later
              </p>
            </>
          ) : (
            <>
              <Building2 className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
              <h3 className="text-slate-900 dark:text-white mb-2">No Properties Available</h3>
              <p className="text-slate-500 dark:text-slate-400 mb-4">
                New properties are being added regularly. Check back soon!
              </p>
            </>
          )}
        </div>
      );
    }

    return (
      <>
        <div className="mb-4">
          <p className="text-slate-600 dark:text-slate-400">
            {displayProperties.length} {displayProperties.length === 1 ? 'property' : 'properties'} available
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayProperties.map((property) => (
            <div key={property.id}>
              <PropertyCard
                property={property}
                onViewDetails={setSelectedProperty}
                isFavorite={favorites.some(f => f.id === property.id)}
                onFavoriteToggle={fetchFavorites}
              />
            </div>
          ))}
        </div>
      </>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-slate-900 dark:text-white mb-2">{t('dashboard')}</h1>
          <p className="text-slate-600 dark:text-slate-400">
            Welcome back, {user?.name}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {getStats().map((stat, index) => (
            <Card key={index}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">{stat.label}</p>
                    <p className="text-2xl text-slate-900 dark:text-white">{stat.value}</p>
                  </div>
                  <stat.icon className={`w-10 h-10 ${stat.color}`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex gap-2">
            {user?.role === 'admin' && (
              <>
                <Button
                  variant={activeTab === 'overview' ? 'default' : 'outline'}
                  onClick={() => setActiveTab('overview')}
                >
                  {t('pendingApprovals')}
                </Button>
                <Button
                  variant={activeTab === 'users' ? 'default' : 'outline'}
                  onClick={() => setActiveTab('users')}
                >
                  {t('allUsers')}
                </Button>
              </>
            )}

            {user?.role === 'customer' && (
              <>
                <Button
                  variant={activeTab === 'overview' ? 'default' : 'outline'}
                  onClick={() => setActiveTab('overview')}
                >
                  {t('properties')}
                </Button>
                <Button
                  variant={activeTab === 'favorites' ? 'default' : 'outline'}
                  onClick={() => setActiveTab('favorites')}
                >
                  {t('myFavorites')}
                </Button>
                <Button
                  variant={activeTab === 'bookings' ? 'default' : 'outline'}
                  onClick={() => setActiveTab('bookings')}
                >
                  My Bookings
                </Button>
              </>
            )}
          </div>

          {user?.role === 'owner' && (
            <div className="flex items-center gap-2">
              <Button
                variant={activeTab === 'overview' ? 'default' : 'outline'}
                onClick={() => setActiveTab('overview')}
              >
                {t('myProperties')}
              </Button>
              <Button
                variant={activeTab === 'bookings' ? 'default' : 'outline'}
                onClick={() => setActiveTab('bookings')}
              >
                Booking Requests
              </Button>
              <div className="flex-1"></div>
              <Button onClick={() => setShowUploadForm(true)} className="bg-emerald-600 hover:bg-emerald-700">
                <Plus className="w-4 h-4 mr-2" />
                {t('uploadProperty')}
              </Button>
            </div>
          )}
        </div>

        {/* Content */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          </div>
        ) : (
          <>
            {user?.role === 'admin' && renderAdminContent()}
            {user?.role === 'owner' && renderOwnerContent()}
            {user?.role === 'customer' && renderCustomerContent()}
          </>
        )}
      </div>

      {/* Property Upload Form */}
      {showUploadForm && (
        <PropertyUploadForm
          isOpen={showUploadForm}
          onClose={() => setShowUploadForm(false)}
          onSuccess={fetchData}
        />
      )}

      {/* Property Details */}
      {selectedProperty && (
        <PropertyDetails
          property={selectedProperty}
          isOpen={!!selectedProperty}
          onClose={() => setSelectedProperty(null)}
          onFavoriteToggle={fetchFavorites}
        />
      )}
    </div>
  );
}
