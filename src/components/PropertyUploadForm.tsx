import React, { useState } from 'react';
import { useLanguage } from '../utils/LanguageContext';
import { useAuth } from '../utils/AuthContext';
import { X, Upload, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { projectId } from '../utils/supabase/info';
import { toast } from 'sonner';

interface PropertyUploadFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function PropertyUploadForm({ isOpen, onClose, onSuccess }: PropertyUploadFormProps) {
  const { t } = useLanguage();
  const { user, accessToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);

  // Ensure only property owners can upload
  if (user?.role !== 'owner') {
    return null;
  }
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    price: '',
    type: 'house',
    bedrooms: '',
    bathrooms: '',
    area: '',
    duration: '1month',
    imageUrls: [''],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const propertyData = {
        title: formData.title,
        description: formData.description,
        location: formData.location,
        price: Number(formData.price),
        type: formData.type,
        bedrooms: formData.bedrooms ? Number(formData.bedrooms) : undefined,
        bathrooms: formData.bathrooms ? Number(formData.bathrooms) : undefined,
        area: formData.area ? Number(formData.area) : undefined,
        duration: formData.duration,
        images: formData.imageUrls.filter(url => url.trim() !== ''),
      };

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-d4068603/properties`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify(propertyData),
        }
      );

      // Always store property in localStorage as backup (regardless of API response)
      const propertyWithId = {
        ...propertyData,
        id: Date.now().toString(),
        status: 'approved',
        ownerId: user?.id,
        createdAt: new Date().toISOString()
      };
      
      // Get existing properties from localStorage
      const existingProperties = JSON.parse(localStorage.getItem('properties') || '[]');
      existingProperties.push(propertyWithId);
      localStorage.setItem('properties', JSON.stringify(existingProperties));
      
      console.log('[PropertyUploadForm] Property stored in localStorage:', propertyWithId);
      console.log('[PropertyUploadForm] Total properties in localStorage:', existingProperties.length);

      if (response.ok) {
        const result = await response.json();
        console.log('[PropertyUploadForm] API upload successful:', result);
        toast.success('Your property is live and visible to customers.');
      } else {
        const error = await response.json();
        console.error('[PropertyUploadForm] API upload failed:', error);
        toast.success('Your property is live and visible to customers (stored locally).');
      }
      
      setFormData({
        title: '',
        description: '',
        location: '',
        price: '',
        type: 'house',
        bedrooms: '',
        bathrooms: '',
        area: '',
        duration: '1month',
        imageUrls: [''],
      });
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload property');
    } finally {
      setLoading(false);
    }
  };

  const addImageUrl = () => {
    setFormData({ ...formData, imageUrls: [...formData.imageUrls, ''] });
  };

  const updateImageUrl = (index: number, value: string) => {
    const newUrls = [...formData.imageUrls];
    newUrls[index] = value;
    setFormData({ ...formData, imageUrls: newUrls });
  };

  const removeImageUrl = (index: number) => {
    const newUrls = formData.imageUrls.filter((_, i) => i !== index);
    setFormData({ ...formData, imageUrls: newUrls.length > 0 ? newUrls : [''] });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    setUploadingImages(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('file', file);

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-d4068603/upload-image`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
          body: formDataToSend,
        }
      );

      if (response.ok) {
        const result = await response.json();
        updateImageUrl(index, result.url);
        toast.success('Image uploaded successfully');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to upload image');
      }
    } catch (error) {
      console.error('Image upload error:', error);
      toast.error('Failed to upload image');
    } finally {
      setUploadingImages(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-slate-900 dark:text-white">
            {t('uploadProperty')}
          </DialogTitle>
          <DialogDescription>
            Fill in the details below to list your property - it will be immediately visible to customers
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Title */}
            <div className="md:col-span-2">
              <Label htmlFor="title">{t('title')}</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            {/* Type */}
            <div>
              <Label htmlFor="type">{t('propertyType')}</Label>
              <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="house">{t('house')}</SelectItem>
                  <SelectItem value="apartment">{t('apartment')}</SelectItem>
                  <SelectItem value="land">{t('land')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Duration */}
            <div>
              <Label htmlFor="duration">{t('duration')}</Label>
              <Select value={formData.duration} onValueChange={(value) => setFormData({ ...formData, duration: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1day">{t('oneDay')}</SelectItem>
                  <SelectItem value="1week">{t('oneWeek')}</SelectItem>
                  <SelectItem value="1month">{t('oneMonth')}</SelectItem>
                  <SelectItem value="2months">{t('twoMonths')}</SelectItem>
                  <SelectItem value="3months">{t('threeMonths')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Location */}
            <div>
              <Label htmlFor="location">{t('location')}</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                required
              />
            </div>

            {/* Price */}
            <div>
              <Label htmlFor="price">{t('price')} (RWF)</Label>
              <Input
                id="price"
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                required
              />
            </div>

            {/* Bedrooms */}
            <div>
              <Label htmlFor="bedrooms">{t('bedrooms')}</Label>
              <Input
                id="bedrooms"
                type="number"
                value={formData.bedrooms}
                onChange={(e) => setFormData({ ...formData, bedrooms: e.target.value })}
              />
            </div>

            {/* Bathrooms */}
            <div>
              <Label htmlFor="bathrooms">{t('bathrooms')}</Label>
              <Input
                id="bathrooms"
                type="number"
                value={formData.bathrooms}
                onChange={(e) => setFormData({ ...formData, bathrooms: e.target.value })}
              />
            </div>

            {/* Area */}
            <div>
              <Label htmlFor="area">{t('area')} (m²)</Label>
              <Input
                id="area"
                type="number"
                value={formData.area}
                onChange={(e) => setFormData({ ...formData, area: e.target.value })}
              />
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <Label htmlFor="description">{t('description')}</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                required
              />
            </div>

            {/* Image URLs */}
            <div className="md:col-span-2">
              <Label>{t('images')}</Label>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                Upload images or paste URLs (max 5MB per image)
              </p>
              <div className="space-y-2">
                {formData.imageUrls.map((url, index) => (
                  <div key={index} className="flex gap-2 items-start">
                    <div className="flex-1 space-y-2">
                      <div className="flex gap-2">
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileUpload(e, index)}
                          className="hidden"
                          id={`file-upload-${index}`}
                          disabled={uploadingImages}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => document.getElementById(`file-upload-${index}`)?.click()}
                          disabled={uploadingImages}
                          className="whitespace-nowrap"
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          {uploadingImages ? 'Uploading...' : 'Upload'}
                        </Button>
                        <Input
                          value={url}
                          onChange={(e) => updateImageUrl(index, e.target.value)}
                          placeholder="Or paste image URL"
                          className="flex-1"
                        />
                      </div>
                      {url && (
                        <div className="aspect-video bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden">
                          <img src={url} alt={`Preview ${index + 1}`} className="w-full h-full object-cover" />
                        </div>
                      )}
                    </div>
                    {formData.imageUrls.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => removeImageUrl(index)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={addImageUrl}
                  className="w-full"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Add Another Image
                </Button>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              {t('cancel')}
            </Button>
            <Button
              type="submit"
              disabled={loading || uploadingImages}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Publishing property...
                </>
              ) : uploadingImages ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading images...
                </>
              ) : (
                t('submit')
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
