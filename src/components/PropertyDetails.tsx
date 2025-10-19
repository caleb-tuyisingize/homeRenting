import React, { useState, useEffect } from 'react';
import { useLanguage } from '../utils/LanguageContext';
import { useAuth } from '../utils/AuthContext';
import { X, MapPin, Bed, Bath, Square, Calendar, User, Phone, Mail, CheckCircle2, Heart, CreditCard } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { PropertyCard } from './PropertyCard';
import { PaymentDialog } from './PaymentDialog';
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

interface PropertyDetailsProps {
  property: Property;
  isOpen: boolean;
  onClose: () => void;
  onFavoriteToggle?: () => void;
}

export function PropertyDetails({ property, isOpen, onClose, onFavoriteToggle }: PropertyDetailsProps) {
  const { t } = useLanguage();
  const { user, accessToken } = useAuth();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [relatedProperties, setRelatedProperties] = useState<Property[]>([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);

  useEffect(() => {
    if (isOpen && property) {
      fetchRelatedProperties();
      checkIfFavorite();
    }
  }, [isOpen, property]);

  const fetchRelatedProperties = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-d4068603/properties?location=${property.location}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken || ''}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        const filtered = data.properties
          .filter((p: Property) => p.id !== property.id)
          .slice(0, 3);
        setRelatedProperties(filtered);
      }
    } catch (error) {
      console.error('Failed to fetch related properties:', error);
    }
  };

  const checkIfFavorite = async () => {
    if (!user || !accessToken) return;

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
        setIsFavorite(data.properties.some((p: Property) => p.id === property.id));
      }
    } catch (error) {
      console.error('Failed to check favorite status:', error);
    }
  };

  const handleFavoriteToggle = async () => {
    if (!user || !accessToken) {
      toast.error('Please login to save favorites');
      return;
    }

    setLoading(true);
    try {
      if (isFavorite) {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-d4068603/favorites/${property.id}`,
          {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
            },
          }
        );

        if (response.ok) {
          setIsFavorite(false);
          toast.success(t('removedFromFavorites'));
          onFavoriteToggle?.();
        }
      } else {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-d4068603/favorites`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${accessToken}`,
            },
            body: JSON.stringify({ propertyId: property.id }),
          }
        );

        if (response.ok) {
          setIsFavorite(true);
          toast.success(t('addedToFavorites'));
          onFavoriteToggle?.();
        }
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
      toast.error('Failed to update favorites');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="text-slate-900 dark:text-white">{property.title}</span>
            {property.status === 'sold' && (
              <Badge className="bg-red-600 text-white flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                {t('noLongerOnSale')}
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            View detailed information about this property
          </DialogDescription>
        </DialogHeader>

        {/* Image Gallery */}
        <div className="relative">
          <div className="aspect-video rounded-lg overflow-hidden">
            <ImageWithFallback
              src={property.images[currentImageIndex] || 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750'}
              alt={property.title}
              className="w-full h-full object-cover"
            />
          </div>

          {property.images.length > 1 && (
            <div className="flex gap-2 mt-3 overflow-x-auto">
              {property.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                    currentImageIndex === index
                      ? 'border-emerald-600 dark:border-emerald-400'
                      : 'border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <ImageWithFallback
                    src={image}
                    alt={`${property.title} ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Property Info */}
        <div className="space-y-6">
          {/* Price and Location */}
          <div className="flex items-start justify-between">
            <div>
              <div className="text-2xl text-emerald-600 dark:text-emerald-400 mb-2">
                {property.price.toLocaleString()} RWF
              </div>
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                <MapPin className="w-5 h-5" />
                <span>{property.location}</span>
              </div>
            </div>

            {user && user.role !== 'admin' && (
              <Button
                onClick={handleFavoriteToggle}
                disabled={loading}
                variant={isFavorite ? 'default' : 'outline'}
                className={isFavorite ? 'bg-red-500 hover:bg-red-600' : ''}
              >
                <Heart className={`w-4 h-4 mr-2 ${isFavorite ? 'fill-white' : ''}`} />
                {isFavorite ? t('removeFromFavorites') : t('saveToFavorites')}
              </Button>
            )}
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
                <Bed className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <div className="text-sm text-slate-500 dark:text-slate-400">{t('bedrooms')}</div>
                <div className="text-slate-900 dark:text-white">{property.bedrooms || 'N/A'}</div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
                <Bath className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <div className="text-sm text-slate-500 dark:text-slate-400">{t('bathrooms')}</div>
                <div className="text-slate-900 dark:text-white">{property.bathrooms || 'N/A'}</div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
                <Square className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <div className="text-sm text-slate-500 dark:text-slate-400">{t('area')}</div>
                <div className="text-slate-900 dark:text-white">{property.area ? `${property.area}m²` : 'N/A'}</div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <div className="text-sm text-slate-500 dark:text-slate-400">Type</div>
                <div className="text-slate-900 dark:text-white capitalize">{t(property.type as any)}</div>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <h3 className="text-slate-900 dark:text-white mb-3">{t('description')}</h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              {property.description}
            </p>
          </div>

          {/* Actions */}
          {property.status !== 'sold' && user && user.role === 'customer' && (
            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                onClick={() => setShowPaymentDialog(true)}
              >
                <CreditCard className="w-4 h-4 mr-2" />
                Book Property
              </Button>
              <Button variant="outline" className="flex-1">
                <Phone className="w-4 h-4 mr-2" />
                {t('contactOwner')}
              </Button>
            </div>
          )}
          
          {property.status !== 'sold' && (!user || user.role !== 'customer') && (
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg text-center">
              <p className="text-blue-800 dark:text-blue-300">
                {!user ? 'Please login as a customer to book this property' : 'Only customers can book properties'}
              </p>
            </div>
          )}

          {/* Related Properties */}
          {relatedProperties.length > 0 && (
            <div>
              <h3 className="text-slate-900 dark:text-white mb-4">{t('relatedProperties')}</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {relatedProperties.map((relatedProperty) => (
                  <div key={relatedProperty.id} className="cursor-pointer" onClick={() => {
                    onClose();
                    setTimeout(() => {
                      // This would open the new property details
                    }, 300);
                  }}>
                    <PropertyCard
                      property={relatedProperty}
                      onViewDetails={() => {}}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>

      {/* Payment Dialog */}
      {showPaymentDialog && (
        <PaymentDialog
          property={property}
          isOpen={showPaymentDialog}
          onClose={() => setShowPaymentDialog(false)}
          onSuccess={() => {
            toast.success('Booking created successfully!');
            setShowPaymentDialog(false);
          }}
        />
      )}
    </Dialog>
  );
}
