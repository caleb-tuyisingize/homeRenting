import React, { useState } from 'react';
import { useLanguage } from '../utils/LanguageContext';
import { useAuth } from '../utils/AuthContext';
import { MapPin, Bed, Bath, Square, Heart, CheckCircle2 } from 'lucide-react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { ImageWithFallback } from './figma/ImageWithFallback';
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
}

interface PropertyCardProps {
  property: Property;
  onViewDetails: (property: Property) => void;
  isFavorite?: boolean;
  onFavoriteToggle?: () => void;
}

export function PropertyCard({ property, onViewDetails, isFavorite, onFavoriteToggle }: PropertyCardProps) {
  const { t } = useLanguage();
  const { user, accessToken } = useAuth();
  const [isToggling, setIsToggling] = useState(false);

  // Safety check for null/undefined property
  if (!property || !property.id) {
    return null;
  }

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user || !accessToken) {
      toast.error('Please login to save favorites');
      return;
    }

    setIsToggling(true);
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
          toast.success(t('addedToFavorites'));
          onFavoriteToggle?.();
        }
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
      toast.error('Failed to update favorites');
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <div
      className="bg-white dark:bg-slate-800 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer group"
      onClick={() => onViewDetails(property)}
    >
      {/* Image */}
      <div className="relative h-48 overflow-hidden">
        <ImageWithFallback
          src={property.images?.[0] || 'https://images.unsplash.com/photo-5129174808009991f1c4c750'}
          alt={property.title || 'Property'}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
        />
        
        {/* Status Badge */}
        {property.status === 'sold' && (
          <div className="absolute top-3 left-3">
            <Badge className="bg-red-600 text-white flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              {t('noLongerOnSale')}
            </Badge>
          </div>
        )}

        {property.status === 'pending' && (
          <div className="absolute top-3 left-3">
            <Badge className="bg-yellow-600 text-white">
              {t('pending')}
            </Badge>
          </div>
        )}

        {/* Favorite Button */}
        {user && user.role !== 'admin' && (
          <button
            onClick={handleFavoriteClick}
            disabled={isToggling}
            className="absolute top-3 right-3 p-2 bg-white dark:bg-slate-800 rounded-full shadow-md hover:scale-110 transition-transform"
          >
            <Heart
              className={`w-5 h-5 ${
                isFavorite
                  ? 'fill-red-500 text-red-500'
                  : 'text-slate-400 dark:text-slate-500'
              }`}
            />
          </button>
        )}

        {/* Type Badge */}
        <div className="absolute bottom-3 left-3">
          <Badge className="bg-emerald-600 text-white capitalize">
            {t(property.type as any) || 'Property'}
          </Badge>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="text-slate-900 dark:text-white mb-2 line-clamp-1">
          {property.title || 'Untitled Property'}
        </h3>

        <div className="flex items-center gap-1 text-slate-600 dark:text-slate-300 mb-3">
          <MapPin className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span className="text-sm">{property.location || 'Location not specified'}</span>
        </div>

        <p className="text-slate-600 dark:text-slate-400 text-sm line-clamp-2 mb-4">
          {property.description || 'No description available'}
        </p>

        {/* Property Details */}
        <div className="flex items-center gap-4 mb-4 text-sm text-slate-600 dark:text-slate-400">
          {property.bedrooms && (
            <div className="flex items-center gap-1">
              <Bed className="w-4 h-4" />
              <span>{property.bedrooms}</span>
            </div>
          )}
          {property.bathrooms && (
            <div className="flex items-center gap-1">
              <Bath className="w-4 h-4" />
              <span>{property.bathrooms}</span>
            </div>
          )}
          {property.area && (
            <div className="flex items-center gap-1">
              <Square className="w-4 h-4" />
              <span>{property.area}m²</span>
            </div>
          )}
        </div>

        {/* Price and Action */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-700">
          <div>
            <span className="text-emerald-600 dark:text-emerald-400">
              {property.price ? property.price.toLocaleString() : '0'} RWF
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onViewDetails(property);
            }}
          >
            {t('view')}
          </Button>
        </div>
      </div>
    </div>
  );
}
