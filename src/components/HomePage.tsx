import React, { useState, useEffect } from 'react';
import { useLanguage } from '../utils/LanguageContext';
import { useAuth } from '../utils/AuthContext';
import { Hero } from './Hero';
import { PropertyCard } from './PropertyCard';
import { PropertyDetails } from './PropertyDetails';
import { PropertyStatusIndicator } from './PropertyStatusIndicator';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
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
  const { accessToken } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProperties();
  }, [searchQuery]);

  const fetchProperties = async () => {
    setLoading(true);
    try {
      // Fetch from database API directly
      let url = `https://${projectId}.supabase.co/functions/v1/make-server-d4068603/properties`;
      if (searchQuery) {
        url += `?location=${searchQuery}`;
      }

      console.log('[HomePage] Fetching properties from database:', url);
      
      const headers: any = {};
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }
      
      const response = await fetch(url, { headers });

      console.log('[HomePage] Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('[HomePage] Received properties from database:', data.properties?.length || 0);
        
        if (data.properties && data.properties.length > 0) {
          // Store in localStorage as backup
          localStorage.setItem('properties', JSON.stringify(data.properties));
          setProperties(data.properties);
        } else {
          // Try localStorage as fallback
          const localProperties = JSON.parse(localStorage.getItem('properties') || '[]');
          if (localProperties.length > 0) {
            console.log('[HomePage] Using localStorage fallback:', localProperties.length);
            setProperties(localProperties);
          } else {
            setProperties([]);
          }
        }
      } else {
        const errorText = await response.text();
        console.error('[HomePage] Failed to fetch from database:', response.status, errorText);
        
        // Fallback to localStorage
        const localProperties = JSON.parse(localStorage.getItem('properties') || '[]');
        if (localProperties.length > 0) {
          console.log('[HomePage] Using localStorage fallback:', localProperties.length);
          setProperties(localProperties);
        } else {
          setProperties([]);
        }
      }
    } catch (error) {
      console.error('[HomePage] Exception while fetching properties:', error);
      
      // Fallback to localStorage
      const localProperties = JSON.parse(localStorage.getItem('properties') || '[]');
      if (localProperties.length > 0) {
        console.log('[HomePage] Using localStorage fallback:', localProperties.length);
        setProperties(localProperties);
      } else {
        setProperties([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    fetchProperties();
  };

  // Filter properties by status
  const activeProperties = properties.filter(p => p.status === 'approved');
  const soldBookedProperties = properties.filter(p => p.status === 'sold' || p.status === 'booked');
  
  // Group active properties by price
  const sortedActiveProperties = [...activeProperties].sort((a, b) => 
    (b.price || 0) - (a.price || 0)
  );
  
  // Define price thresholds
  const highestPrice = sortedActiveProperties[0]?.price || 0;
  const expensiveThreshold = highestPrice * 0.7; // Top 30% most expensive
  
  const expensiveProperties = sortedActiveProperties.filter(p => p.price >= expensiveThreshold).slice(0, 6);
  const mediumProperties = sortedActiveProperties.filter(p => p.price < expensiveThreshold).slice(0, 6);
  const recentSoldBooked = soldBookedProperties.slice(0, 6);

  return (
    <div className="bg-slate-50 dark:bg-slate-900">
      {/* Hero Section */}
      <Hero onSearch={handleSearch} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {!loading && <PropertyStatusIndicator />}
        
        {/* Most Expensive Properties */}
        {expensiveProperties.length > 0 && (
          <div className="mb-16">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                  Premium Properties
                </h2>
                <p className="text-slate-600 dark:text-slate-400">
                  High-end properties for luxury living
                </p>
              </div>
              <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-100">
                Most Expensive
              </Badge>
            </div>
            
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="bg-slate-200 dark:bg-slate-800 h-48 rounded-t-xl"></div>
                    <div className="bg-white dark:bg-slate-800 p-5 rounded-b-xl">
                      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded mb-2"></div>
                      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-2/3"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {expensiveProperties.map((property) => (
                  <PropertyCard
                    key={property.id}
                    property={property}
                    onViewDetails={setSelectedProperty}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Medium Price Properties */}
        {mediumProperties.length > 0 && (
          <div className="mb-16">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                  Affordable Properties
                </h2>
                <p className="text-slate-600 dark:text-slate-400">
                  Great deals for comfortable living
                </p>
              </div>
              <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">
                Best Value
              </Badge>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mediumProperties.map((property) => (
                <PropertyCard
                  key={property.id}
                  property={property}
                  onViewDetails={setSelectedProperty}
                />
              ))}
            </div>
          </div>
        )}

        {/* Booked/Sold Properties */}
        {recentSoldBooked.length > 0 && (
          <div className="mb-16">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                  Recently Booked & Sold
                </h2>
                <p className="text-slate-600 dark:text-slate-400">
                  These properties have been secured
                </p>
              </div>
              <Badge variant="secondary" className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100">
                Booked/Sold
              </Badge>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recentSoldBooked.map((property) => (
                <PropertyCard
                  key={property.id}
                  property={property}
                  onViewDetails={setSelectedProperty}
                />
              ))}
            </div>
          </div>
        )}

        {/* No Properties Message */}
        {!loading && properties.length === 0 && (
          <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-xl">
            <p className="text-slate-500 dark:text-slate-400 mb-4">
              No properties available at the moment
            </p>
            <p className="text-sm text-slate-400 dark:text-slate-500">
              New properties are added regularly by owners. Check back soon!
            </p>
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
