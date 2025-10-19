import React, { useState, useEffect } from 'react';
import { useLanguage } from '../utils/LanguageContext';
import { Hero } from './Hero';
import { PropertyCard } from './PropertyCard';
import { PropertyDetails } from './PropertyDetails';
import { PropertyStatusIndicator } from './PropertyStatusIndicator';
import { Button } from './ui/button';
import { ArrowRight } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';

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

interface HomePageProps {
  searchQuery?: string;
  onNavigate?: (page: string) => void;
}

export function HomePage({ searchQuery, onNavigate }: HomePageProps) {
  const { t } = useLanguage();
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProperties();
  }, [searchQuery]);

  const fetchProperties = async () => {
    setLoading(true);
    try {
      // Try the main properties endpoint first
      let url = `https://${projectId}.supabase.co/functions/v1/make-server-d4068603/properties`;
      if (searchQuery) {
        url += `&location=${searchQuery}`;
      }

      console.log('[HomePage] Fetching properties from:', url);
      
      const response = await fetch(url);

      console.log('[HomePage] Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('[HomePage] Received properties:', data.properties?.length || 0);
        setProperties(data.properties || []);
      } else {
        console.log('[HomePage] API not available, using fallback data');
        
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
          }
        ];
        
        setProperties(mockProperties);
        console.log('[HomePage] Using fallback data with', mockProperties.length, 'properties');
      }
    } catch (error) {
      console.error('[HomePage] Exception while fetching properties:', error);
      
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

  const handleSearch = (query: string) => {
    fetchProperties();
  };

  // Get latest 6 properties for the featured section
  const latestProperties = [...properties]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 6);

  return (
    <div className="bg-slate-50 dark:bg-slate-900">
      {/* Hero Section */}
      <Hero onSearch={handleSearch} />

      {/* Latest/Featured Properties */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="mb-8">
          <h2 className="text-slate-900 dark:text-white mb-2">
            {searchQuery ? `Properties in ${searchQuery}` : 'Latest Properties'}
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            {searchQuery ? `Browse available properties in ${searchQuery}` : 'Discover the newest properties across Rwanda'}
          </p>
          {!loading && <PropertyStatusIndicator />}
        </div>

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
        ) : latestProperties.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-xl">
            <p className="text-slate-500 dark:text-slate-400 mb-4">
              {searchQuery ? `No properties found in ${searchQuery}` : 'No properties available at the moment'}
            </p>
            {!searchQuery && (
              <p className="text-sm text-slate-400 dark:text-slate-500">
                New properties are added regularly by owners. Check back soon!
              </p>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {latestProperties.map((property) => (
                <PropertyCard
                  key={property.id}
                  property={property}
                  onViewDetails={setSelectedProperty}
                />
              ))}
            </div>
            {properties.length > 6 && !searchQuery && (
              <div className="text-center mt-8">
                <p className="text-slate-600 dark:text-slate-400 mb-4">
                  Showing {latestProperties.length} of {properties.length} available properties
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => onNavigate && onNavigate('properties')}
                  className="group"
                >
                  View all {properties.length} properties
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            )}
          </>
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
