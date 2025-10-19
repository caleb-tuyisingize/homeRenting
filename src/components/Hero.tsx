import React, { useState, useEffect } from 'react';
import { useLanguage } from '../utils/LanguageContext';
import { Search, MapPin } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import bgImage1 from 'figma:asset/e1a587ce7ef7c99f69dfeb2aaa665d646a3888bd.png';
import bgImage2 from 'figma:asset/1db5a46dacbb00b7d2fcf3670dc927141d4e5b24.png';
import bgImage3 from 'figma:asset/f98f42637a565acfc2ddc8bd14a30549968f5e2d.png';

interface HeroProps {
  onSearch: (query: string) => void;
}

export function Hero({ onSearch }: HeroProps) {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  const backgroundImages = [bgImage1, bgImage2, bgImage3];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % backgroundImages.length);
    }, 5000); // Change image every 5 seconds

    return () => clearInterval(interval);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchQuery);
  };

  const locations = [
    { name: t('nyarugenge'), value: 'Nyarugenge' },
    { name: t('kicukiro'), value: 'Kicukiro' },
    { name: t('gasabo'), value: 'Gasabo' },
  ];

  return (
    <div className="relative text-white overflow-hidden min-h-[600px]">
      {/* Sliding Background Images */}
      <div className="absolute inset-0">
        {backgroundImages.map((image, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-all duration-1000 ease-in-out ${
              currentImageIndex === index ? 'scale-105' : 'scale-100'
            }`}
            style={{
              opacity: currentImageIndex === index ? 1 : 0,
              backgroundImage: `url(${image})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              transform: currentImageIndex === index ? 'scale(1.05)' : 'scale(1)',
              transition: 'opacity 1s ease-in-out, transform 5s ease-in-out',
            }}
          />
        ))}
      </div>

      {/* Overlay for better text readability */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-700 via-emerald-800/75 to-slate-900/80 dark:from-emerald-950/85 dark:via-slate-900/80 dark:to-slate-950/85" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-white text-4xl mb-6 animate-fade-in">
            {t('heroTitle')}
          </h1>
          <p className="text-emerald-50 text-lg md:text-xl mb-10">
            {t('heroSubtitle')}
          </p>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('searchPlaceholder')}
                className="pl-12 h-14 bg-white dark:bg-slate-800 border-0 shadow-lg text-slate-900 dark:text-white"
              />
            </div>
            <Button
              type="submit"
              size="lg"
              className="h-14 px-8 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 dark:text-slate-900 shadow-lg"
            >
              <Search className="w-5 h-5 mr-2" />
              {t('searchButton')}
            </Button>
          </form>

          {/* Quick Location Links */}
          <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
            {locations.map((location) => (
              <button
                key={location.value}
                onClick={() => onSearch(location.value)}
                className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full transition-colors"
              >
                <MapPin className="w-4 h-4" />
                <span className="text-sm">{location.name}</span>
              </button>
            ))}
          </div>

          {/* Slide Indicators */}
          <div className="flex items-center justify-center gap-2">
            {backgroundImages.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentImageIndex(index)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  currentImageIndex === index 
                    ? 'w-8 bg-white' 
                    : 'w-2 bg-white/40 hover:bg-white/60'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Wave Divider */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg
          viewBox="0 0 1440 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-auto"
        >
          <path
            d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z"
            className="fill-slate-50 dark:fill-slate-900"
          />
        </svg>
      </div>
    </div>
  );
}
