import React from 'react';
import { useLanguage } from '../utils/LanguageContext';
import { Building2, Shield, Users, Heart, Award, Target, CheckCircle } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';

export function AboutPage() {
  const { t } = useLanguage();

  const features = [
    {
      icon: Shield,
      title: 'Secure Platform',
      description: 'Trusted property listings with verified owners and secure transactions'
    },
    {
      icon: Users,
      title: 'Expert Support',
      description: 'Dedicated customer care team ready to assist you 24/7'
    },
    {
      icon: Heart,
      title: 'Customer First',
      description: 'Your satisfaction is our priority with verified listings and secure transactions'
    },
    {
      icon: Award,
      title: 'Quality Properties',
      description: 'Curated selection of premium properties across Rwanda'
    }
  ];

  const values = [
    'Transparent and honest transactions',
    'Verified property owners and listings',
    'Secure payment processing',
    'Professional customer support',
    'Fair pricing for all users',
    'Community-focused service'
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-3 mb-6">
            <Building2 className="w-12 h-12 text-emerald-600" />
            <h1 className="text-5xl font-bold text-slate-900 dark:text-white">
              About RealEstateConnect
            </h1>
          </div>
          <p className="text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto">
            Your trusted partner in finding the perfect property across Rwanda. 
            We connect property owners with customers through a secure, transparent, and user-friendly platform.
          </p>
        </div>

        {/* Mission */}
        <Card className="mb-16 bg-gradient-to-br from-emerald-50 to-blue-50 dark:from-emerald-900/20 dark:to-blue-900/20">
          <CardContent className="p-8">
            <div className="flex items-start gap-4">
              <Target className="w-8 h-8 text-emerald-600 flex-shrink-0" />
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
                  Our Mission
                </h2>
                <p className="text-slate-600 dark:text-slate-400 text-lg leading-relaxed">
                  To revolutionize the real estate industry in Rwanda by providing a secure, transparent, 
                  and efficient platform that connects property owners with customers. We aim to make property 
                  buying, renting, and selling accessible to everyone while ensuring security and trust in every transaction.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Features */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white text-center mb-8">
            Why Choose Us
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <feature.icon className="w-10 h-10 text-emerald-600 mb-4" />
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Values */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white text-center mb-8">
            Our Core Values
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {values.map((value, index) => (
              <div key={index} className="flex items-start gap-3 p-4 bg-white dark:bg-slate-800 rounded-lg">
                <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <p className="text-slate-700 dark:text-slate-300">{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
          <Card className="bg-emerald-600 text-white">
            <CardContent className="p-6 text-center">
              <p className="text-4xl font-bold mb-2">500+</p>
              <p className="text-emerald-100">Properties Listed</p>
            </CardContent>
          </Card>
          <Card className="bg-blue-600 text-white">
            <CardContent className="p-6 text-center">
              <p className="text-4xl font-bold mb-2">200+</p>
              <p className="text-blue-100">Happy Customers</p>
            </CardContent>
          </Card>
          <Card className="bg-purple-600 text-white">
            <CardContent className="p-6 text-center">
              <p className="text-4xl font-bold mb-2">100+</p>
              <p className="text-purple-100">Property Owners</p>
            </CardContent>
          </Card>
          <Card className="bg-amber-600 text-white">
            <CardContent className="p-6 text-center">
              <p className="text-4xl font-bold mb-2">50+</p>
              <p className="text-amber-100">Locations</p>
            </CardContent>
          </Card>
        </div>

        {/* Contact CTA */}
        <Card className="bg-gradient-to-r from-emerald-600 to-blue-600 text-white">
          <CardContent className="p-8 text-center">
            <h2 className="text-3xl font-bold mb-4">Get Started Today</h2>
            <p className="text-xl mb-6 opacity-90">
              Whether you're looking for your dream property or want to list your property, 
              we're here to help you every step of the way.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Badge variant="secondary" className="bg-white text-emerald-600 px-6 py-2 text-lg">
                Browse Properties
              </Badge>
              <Badge variant="secondary" className="bg-white text-emerald-600 px-6 py-2 text-lg">
                List Your Property
              </Badge>
              <Badge variant="secondary" className="bg-white text-emerald-600 px-6 py-2 text-lg">
                Contact Support
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

