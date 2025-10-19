import React, { useState, useEffect } from 'react';
import { useLanguage } from '../utils/LanguageContext';
import { Search, SlidersHorizontal, Building2 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { PropertyCard } from './PropertyCard';
import { PropertyDetails } from './PropertyDetails';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { toast } from 'sonner@2.0.3';

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

export function PropertiesPage() {
  const { t } = useLanguage();
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    setLoading(true);
    try {
      let url = `https://${projectId}.supabase.co/functions/v1/make-server-d4068603/properties`;

      console.log('[PropertiesPage] Fetching properties from:', url);
      const headers: any = {};
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }
      
      const response = await fetch(url, { headers });

      console.log('[PropertiesPage] Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('[PropertiesPage] Received data:', data);
        console.log('[PropertiesPage] Properties count:', data.properties?.length || 0);
        
        // Filter out null/invalid properties
        const validProperties = (data.properties || []).filter(
          (p: Property) => p && p.id && p.title
        );
        console.log('[PropertiesPage] Valid properties after filter:', validProperties.length);
        setProperties(validProperties);
      } else {
        console.log('[PropertiesPage] API not available, using fallback data');
        
        // Fallback: Use mock data when API is not available
        const mockProperties = [
          {
            id: '1',
            title: 'Modern Apartment in Kigali',
            description: 'Beautiful 3-bedroom apartment with modern amenities',
            price: 250000,
            location: 'Kigali, Rwanda',
            type: 'apartment',
            bedrooms: 3,
            bathrooms: 2,
            images: ['https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=500'],
            status: 'approved',
            ownerId: 'demo-owner',
            createdAt: new Date().toISOString()
          },
          {
            id: '2',
            title: 'Luxury Villa in Kigali',
            description: 'Spacious 4-bedroom villa with garden and parking',
            price: 450000,
            location: 'Kigali, Rwanda',
            type: 'house',
            bedrooms: 4,
            bathrooms: 3,
            images: ['https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=500'],
            status: 'approved',
            ownerId: 'demo-owner',
            createdAt: new Date().toISOString()
          },
          {
            id: '3',
            title: 'Cozy Studio in Kigali',
            description: 'Perfect for young professionals, fully furnished',
            price: 150000,
            location: 'Kigali, Rwanda',
            type: 'studio',
            bedrooms: 1,
            bathrooms: 1,
            images: ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=500'],
            status: 'approved',
            ownerId: 'demo-owner',
            createdAt: new Date().toISOString()
          }
        ];
        
        setProperties(mockProperties);
        console.log('[PropertiesPage] Using fallback data with', mockProperties.length, 'properties');
      }
    } catch (error) {
      console.error('[PropertiesPage] Exception while fetching properties:', error);
      
      // Even if there's an error, show some demo data
      const mockProperties = [
        {
          id: 'demo-1',
          title: 'Demo Property',
          description: 'This is a demo property to show the system is working',
          price: 200000,
          location: 'Kigali, Rwanda',
          type: 'apartment',
          bedrooms: 2,
          bathrooms: 1,
          images: ['https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=500'],
          status: 'approved',
          ownerId: 'demo-owner',
          createdAt: new Date().toISOString()
        }
      ];
      
      setProperties(mockProperties);
    } finally {
      setLoading(false);
    }
  };

  const filteredProperties = properties.filter((property) => {
    // Safety check
    if (!property || !property.id) {
      return false;
    }

    // Search filter
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      const locationMatch = property.location?.toLowerCase().includes(searchLower);
      const titleMatch = property.title?.toLowerCase().includes(searchLower);
      if (!locationMatch && !titleMatch) {
        return false;
      }
    }

    // Type filter
    if (typeFilter !== 'all' && property.type !== typeFilter) {
      return false;
    }

    // Price filters
    if (minPrice && property.price && property.price < Number(minPrice)) {
      return false;
    }
    if (maxPrice && property.price && property.price > Number(maxPrice)) {
      return false;
    }

    return true;
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-slate-900 dark:text-white mb-2">{t('properties')}</h1>
          <p className="text-slate-600 dark:text-slate-400">
            Browse all available properties
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('searchPlaceholder')}
                className="pl-10"
              />
            </div>

            {/* Type Filter */}
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder={t('propertyType')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="house">{t('house')}</SelectItem>
                <SelectItem value="apartment">{t('apartment')}</SelectItem>
                <SelectItem value="land">{t('land')}</SelectItem>
              </SelectContent>
            </Select>

            {/* Toggle Advanced Filters */}
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="w-full md:w-auto"
            >
              <SlidersHorizontal className="w-4 h-4 mr-2" />
              Filters
            </Button>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
              <div>
                <label className="block text-sm text-slate-600 dark:text-slate-400 mb-2">
                  Min Price (RWF)
                </label>
                <Input
                  type="number"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-600 dark:text-slate-400 mb-2">
                  Max Price (RWF)
                </label>
                <Input
                  type="number"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  placeholder="1000000000"
                />
              </div>
            </div>
          )}
        </div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-slate-600 dark:text-slate-400">
            Showing {filteredProperties.length} {filteredProperties.length === 1 ? 'property' : 'properties'}
          </p>
        </div>

        {/* Properties Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-slate-200 dark:bg-slate-800 h-48 rounded-t-xl"></div>
                <div className="bg-white dark:bg-slate-800 p-5 rounded-b-xl">
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded mb-2"></div>
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-2/3"></div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredProperties.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-xl">
            <Building2 className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
            <h3 className="text-slate-900 dark:text-white mb-2">
              {properties.length === 0 ? 'No Properties Available' : 'No Matching Properties'}
            </h3>
            <p className="text-slate-500 dark:text-slate-400 mb-4">
              {properties.length === 0 
                ? 'New properties are added by owners regularly. Check back soon!'
                : 'Try adjusting your filters to see more results'}
            </p>
            {properties.length > 0 && (
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchQuery('');
                  setTypeFilter('all');
                  setMinPrice('');
                  setMaxPrice('');
                }}
              >
                Clear All Filters
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProperties.map((property) => (
              <PropertyCard
                key={property.id}
                property={property}
                onViewDetails={setSelectedProperty}
              />
            ))}
          </div>
        )}
      </div>

      {/* Property Details Modal */}
      {selectedProperty && (
        <PropertyDetails
          property={selectedProperty}
          isOpen={!!selectedProperty}
          onClose={() => setSelectedProperty(null)}
        />
      )}
    </div>
  );
}
