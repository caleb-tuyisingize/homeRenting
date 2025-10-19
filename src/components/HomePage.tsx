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
      // First try to get properties from localStorage
      const localProperties = JSON.parse(localStorage.getItem('properties') || '[]');
      
      if (localProperties.length > 0) {
        console.log('[HomePage] Found properties in localStorage:', localProperties.length);
        setProperties(localProperties);
        setLoading(false);
        return;
      }

      // If no local properties, try API
      let url = `https://${projectId}.supabase.co/functions/v1/make-server-d4068603/properties`;
      if (searchQuery) {
        url += `&location=${searchQuery}`;
      }

      console.log('[HomePage] Fetching properties from:', url);
      console.log('[HomePage] Access token available:', !!accessToken);
      
      const headers: any = {};
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }
      
      const response = await fetch(url, { headers });

      console.log('[HomePage] Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('[HomePage] Received properties:', data.properties?.length || 0);
        console.log('[HomePage] Raw response data:', data);
        setProperties(data.properties || []);
      } else {
        const errorText = await response.text();
        console.error('[HomePage] Failed to fetch properties:', response.status, errorText);
        setProperties([]);
      }
    } catch (error) {
      console.error('[HomePage] Exception while fetching properties:', error);
      setProperties([]);
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
