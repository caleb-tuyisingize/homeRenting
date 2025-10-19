import React, { useState, useEffect } from 'react';
import { useAuth } from '../utils/AuthContext';
import { 
  Shield, Building2, Users, Bell, CheckCircle2, XCircle, 
  Clock, TrendingUp, AlertCircle, Eye, MessageSquare 
} from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Alert, AlertDescription } from './ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { PropertyCard } from './PropertyCard';
import { PropertyDetails } from './PropertyDetails';
import { DiagnosticPanel } from './DiagnosticPanel';
import { PropertyStatusIndicator } from './PropertyStatusIndicator';
import { projectId, publicAnonKey } from '../utils/supabase/info';
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
  ownerName: string;
  ownerEmail: string;
  createdAt: string;
  approvedAt?: string;
  rejectedAt?: string;
  rejectionReason?: string;
}

interface Notification {
  id: string;
  type: string;
  propertyId?: string;
  propertyTitle?: string;
  ownerName?: string;
  message: string;
  createdAt: string;
  read: boolean;
}

export function AdminDashboard() {
  const { user, accessToken } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [propertyToReject, setPropertyToReject] = useState<Property | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchProperties(),
        fetchNotifications(),
        fetchUsers()
      ]);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProperties = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-d4068603/properties`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setProperties(data.properties || []);
      }
    } catch (error) {
      console.error('Failed to fetch properties:', error);
    }
  };

  const fetchNotifications = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-d4068603/notifications`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
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
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  const handleApproveProperty = async (propertyId: string) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-d4068603/admin/properties/${propertyId}/approve`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
        }
      );

      if (response.ok) {
        toast.success('Property approved successfully!');
        fetchData();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to approve property');
      }
    } catch (error) {
      console.error('Approve property error:', error);
      toast.error('Failed to approve property');
    }
  };

  const handleRejectProperty = async () => {
    if (!propertyToReject || !rejectionReason.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-d4068603/admin/properties/${propertyToReject.id}/reject`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ reason: rejectionReason })
        }
      );

      if (response.ok) {
        toast.success('Property rejected');
        setShowRejectDialog(false);
        setRejectionReason('');
        setPropertyToReject(null);
        fetchData();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to reject property');
      }
    } catch (error) {
      console.error('Reject property error:', error);
      toast.error('Failed to reject property');
    }
  };

  const openRejectDialog = (property: Property) => {
    setPropertyToReject(property);
    setShowRejectDialog(true);
  };

  const pendingProperties = properties.filter(p => p.status === 'pending');
  const approvedProperties = properties.filter(p => p.status === 'approved');
  const rejectedProperties = properties.filter(p => p.status === 'rejected');
  const unreadNotifications = notifications.filter(n => !n.read);

  const stats = [
    { 
      label: 'Pending Review', 
      value: pendingProperties.length, 
      icon: Clock, 
      color: 'text-amber-600',
      bgColor: 'bg-amber-50 dark:bg-amber-950',
      change: '+' + pendingProperties.filter(p => {
        const hourAgo = new Date(Date.now() - 3600000);
        return new Date(p.createdAt) > hourAgo;
      }).length + ' this hour'
    },
    { 
      label: 'Approved Properties', 
      value: approvedProperties.length, 
      icon: CheckCircle2, 
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50 dark:bg-emerald-950',
      change: 'Live on platform'
    },
    { 
      label: 'Total Users', 
      value: users.length, 
      icon: Users, 
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-950',
      change: users.filter(u => u.role === 'owner').length + ' owners'
    },
    { 
      label: 'Notifications', 
      value: unreadNotifications.length, 
      icon: Bell, 
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-950',
      change: 'Unread alerts'
    },
  ];

  if (selectedProperty) {
    return (
      <PropertyDetails
        property={selectedProperty}
        onClose={() => setSelectedProperty(null)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="bg-gradient-to-r from-purple-900 to-purple-700 dark:from-purple-950 dark:to-purple-900 text-white p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-8 h-8" />
            <h1 className="text-white">System Administration</h1>
          </div>
          <p className="text-purple-100">
            Welcome back, {user?.name} • Full system control
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* System Status */}
        <div className="mb-6">
          <PropertyStatusIndicator />
        </div>

        {/* Urgent Action Alert */}
        {pendingProperties.length > 0 && (
          <Alert className="mb-6 border-amber-200 bg-amber-50 dark:bg-amber-950 dark:border-amber-900">
            <Clock className="h-5 w-5 text-amber-600" />
            <AlertDescription>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-900 dark:text-white">
                    <span className="font-semibold">{pendingProperties.length} {pendingProperties.length === 1 ? 'property' : 'properties'}</span> waiting for your review
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    Property owners are waiting for approval to list their properties
                  </p>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <Card key={index} className={stat.bgColor}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">
                      {stat.label}
                    </p>
                    <p className={`text-3xl ${stat.color}`}>
                      {stat.value}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {stat.change}
                    </p>
                  </div>
                  <stat.icon className={`w-12 h-12 ${stat.color} opacity-20`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Content */}
        <Tabs defaultValue="pending" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid">
            <TabsTrigger value="pending" className="relative">
              Pending Review
              {pendingProperties.length > 0 && (
                <Badge className="ml-2 bg-amber-600 text-white">
                  {pendingProperties.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="approved">Approved</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="notifications" className="relative">
              Notifications
              {unreadNotifications.length > 0 && (
                <Badge className="ml-2 bg-red-600 text-white">
                  {unreadNotifications.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="diagnostics">Diagnostics</TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-6">
            {pendingProperties.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <CheckCircle2 className="w-16 h-16 mx-auto text-emerald-600 mb-4" />
                  <h3 className="text-slate-900 dark:text-white mb-2">All Caught Up!</h3>
                  <p className="text-slate-600 dark:text-slate-400">
                    No properties pending review at the moment.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pendingProperties.map((property) => (
                  <Card key={property.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-4">
                      <div 
                        className="aspect-video bg-slate-200 dark:bg-slate-700 rounded-lg mb-4 overflow-hidden cursor-pointer"
                        onClick={() => setSelectedProperty(property)}
                      >
                        {property.images && property.images.length > 0 ? (
                          <img
                            src={property.images[0]}
                            alt={property.title}
                            className="w-full h-full object-cover hover:scale-105 transition-transform"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Building2 className="w-12 h-12 text-slate-400" />
                          </div>
                        )}
                      </div>
                      
                      <h3 className="text-slate-900 dark:text-white mb-2 line-clamp-1">
                        {property.title}
                      </h3>
                      
                      <div className="space-y-2 mb-4">
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          Owner: {property.ownerName}
                        </p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          Price: ${property.price?.toLocaleString()}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-500">
                          Submitted: {new Date(property.createdAt).toLocaleDateString()}
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleApproveProperty(property.id)}
                          className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                        >
                          <CheckCircle2 className="w-4 h-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => openRejectDialog(property)}
                          className="flex-1"
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="approved" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {approvedProperties.map((property) => (
                <PropertyCard 
                  key={property.id} 
                  property={property}
                  onViewDetails={setSelectedProperty}
                />
              ))}
            </div>
            {approvedProperties.length === 0 && (
              <Card>
                <CardContent className="p-12 text-center">
                  <AlertCircle className="w-16 h-16 mx-auto text-slate-400 mb-4" />
                  <p className="text-slate-600 dark:text-slate-400">
                    No approved properties yet.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-slate-900 dark:text-white">
                  All Users
                </CardTitle>
                <CardDescription>
                  {users.length} registered users
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {users.map((u) => (
                    <div
                      key={u.id}
                      className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg"
                    >
                      <div>
                        <p className="text-slate-900 dark:text-white">{u.name}</p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">{u.email}</p>
                      </div>
                      <Badge className={
                        u.role === 'admin' ? 'bg-purple-600' :
                        u.role === 'owner' ? 'bg-blue-600' :
                        'bg-emerald-600'
                      }>
                        {u.role}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-4">
            {notifications.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Bell className="w-16 h-16 mx-auto text-slate-400 mb-4" />
                  <p className="text-slate-600 dark:text-slate-400">
                    No notifications yet.
                  </p>
                </CardContent>
              </Card>
            ) : (
              notifications.map((notification) => (
                <Alert
                  key={notification.id}
                  className={notification.read ? 'opacity-60' : ''}
                >
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-slate-900 dark:text-white mb-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {new Date(notification.createdAt).toLocaleString()}
                        </p>
                      </div>
                      {!notification.read && (
                        <Badge variant="destructive" className="ml-2">New</Badge>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              ))
            )}
          </TabsContent>

          <TabsContent value="diagnostics" className="space-y-6">
            <DiagnosticPanel />
          </TabsContent>
        </Tabs>
      </div>

      {/* Rejection Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-slate-900 dark:text-white">
              Reject Property
            </DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting "{propertyToReject?.title}".
              The owner will be notified.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="reason">Rejection Reason</Label>
              <Textarea
                id="reason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Please explain why this property cannot be approved..."
                className="mt-2"
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowRejectDialog(false);
                setRejectionReason('');
                setPropertyToReject(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectProperty}
              disabled={!rejectionReason.trim()}
            >
              <XCircle className="w-4 h-4 mr-2" />
              Reject Property
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
