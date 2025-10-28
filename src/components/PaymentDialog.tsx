import React, { useState } from 'react';
import { useLanguage } from '../utils/LanguageContext';
import { useAuth } from '../utils/AuthContext';
import { CreditCard, Phone, Building, Wallet, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { projectId } from '../utils/supabase/info';
import { toast } from 'sonner';

interface Property {
  id: string;
  title: string;
  price: number;
  location: string;
  ownerId: string;
}

interface PaymentDialogProps {
  property: Property;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function PaymentDialog({ property, isOpen, onClose, onSuccess }: PaymentDialogProps) {
  const { t } = useLanguage();
  const { user, accessToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [bookingType, setBookingType] = useState<'purchase' | 'rent'>('purchase');
  const [paymentMethod, setPaymentMethod] = useState('mobile_money');
  const [paymentOption, setPaymentOption] = useState<'full' | 'partial'>('full');
  const [contactInfo, setContactInfo] = useState({
    phone: '',
    alternativePhone: '',
    address: '',
    notes: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || user.role !== 'customer') {
      toast.error('Only customers can make bookings');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-d4068603/bookings`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            propertyId: property.id,
            bookingType,
            paymentMethod,
            paymentOption,
            amount: paymentOption === 'partial' ? property.price * 0.1 : property.price,
            contactInfo
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        toast.success(data.message || 'Booking created successfully!');
        onSuccess();
        onClose();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to create booking');
      }
    } catch (error) {
      console.error('Booking error:', error);
      toast.error('Failed to create booking');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-slate-900 dark:text-white">
            Book Property
          </DialogTitle>
          <DialogDescription className="text-slate-600 dark:text-slate-400">
            Complete the form below to request booking for {property.title}
          </DialogDescription>
        </DialogHeader>

        {/* Property Summary */}
        <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-lg -mt-2">
          <h4 className="text-slate-900 dark:text-white mb-1">{property.title}</h4>
          <p className="text-emerald-600 dark:text-emerald-400 text-xl">
            {property.price.toLocaleString()} RWF
          </p>
          <p className="text-sm text-slate-600 dark:text-slate-400">{property.location}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Booking Type */}
          <div>
            <Label className="mb-3 block">I want to:</Label>
            <RadioGroup value={bookingType} onValueChange={(value: any) => setBookingType(value)}>
              <div className="flex items-center space-x-2 p-3 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <RadioGroupItem value="purchase" id="purchase" />
                <Label htmlFor="purchase" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <Building className="w-4 h-4" />
                    <span>Purchase this property</span>
                  </div>
                </Label>
              </div>

              <div className="flex items-center space-x-2 p-3 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <RadioGroupItem value="rent" id="rent" />
                <Label htmlFor="rent" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    <span>Rent this property</span>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Payment Option */}
          <div>
            <Label className="mb-3 block">Payment Option:</Label>
            <RadioGroup value={paymentOption} onValueChange={(value: any) => setPaymentOption(value)}>
              <div className="flex items-center space-x-2 p-3 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <RadioGroupItem value="full" id="full" />
                <Label htmlFor="full" className="flex-1 cursor-pointer">
                  <div className="flex items-center justify-between">
                    <span>Full Payment</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                      {property.price.toLocaleString()} RWF
                    </span>
                  </div>
                </Label>
              </div>

              <div className="flex items-center space-x-2 p-3 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <RadioGroupItem value="partial" id="partial" />
                <Label htmlFor="partial" className="flex-1 cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div>
                      <span>Partial Payment (10% Down)</span>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Pay at least 10% to secure the property
                      </p>
                    </div>
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                      {(property.price * 0.1).toLocaleString()} RWF
                    </span>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Payment Method */}
          <div>
            <Label className="mb-3 block">Payment Method:</Label>
            <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
              <div className="flex items-center space-x-2 p-3 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <RadioGroupItem value="mobile_money" id="mobile_money" />
                <Label htmlFor="mobile_money" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    <span>Mobile Money (MTN, Airtel)</span>
                  </div>
                </Label>
              </div>

              <div className="flex items-center space-x-2 p-3 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <RadioGroupItem value="bank_transfer" id="bank_transfer" />
                <Label htmlFor="bank_transfer" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <Building className="w-4 h-4" />
                    <span>Bank Transfer</span>
                  </div>
                </Label>
              </div>

              <div className="flex items-center space-x-2 p-3 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <RadioGroupItem value="cash" id="cash" />
                <Label htmlFor="cash" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <Wallet className="w-4 h-4" />
                    <span>Cash Payment</span>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-slate-900 dark:text-white">Contact Information</h3>
            
            <div>
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                type="tel"
                value={contactInfo.phone}
                onChange={(e) => setContactInfo({ ...contactInfo, phone: e.target.value })}
                placeholder="+250 xxx xxx xxx"
                required
              />
            </div>

            <div>
              <Label htmlFor="alternativePhone">Alternative Phone</Label>
              <Input
                id="alternativePhone"
                type="tel"
                value={contactInfo.alternativePhone}
                onChange={(e) => setContactInfo({ ...contactInfo, alternativePhone: e.target.value })}
                placeholder="+250 xxx xxx xxx"
              />
            </div>

            <div>
              <Label htmlFor="address">Your Address *</Label>
              <Input
                id="address"
                value={contactInfo.address}
                onChange={(e) => setContactInfo({ ...contactInfo, address: e.target.value })}
                placeholder="Enter your current address"
                required
              />
            </div>

            <div>
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea
                id="notes"
                value={contactInfo.notes}
                onChange={(e) => setContactInfo({ ...contactInfo, notes: e.target.value })}
                placeholder="Any special requirements or questions?"
                rows={3}
              />
            </div>
          </div>

          {/* Summary */}
          <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="text-slate-600 dark:text-slate-400">
                {paymentOption === 'partial' ? 'Down Payment (10%):' : 'Total Amount:'}
              </span>
              <span className="text-2xl text-emerald-600 dark:text-emerald-400">
                {paymentOption === 'partial' 
                  ? (property.price * 0.1).toLocaleString() 
                  : property.price.toLocaleString()} RWF
              </span>
            </div>
            {paymentOption === 'partial' && (
              <div className="mb-2 text-sm text-slate-600 dark:text-slate-400">
                Remaining Balance: <span className="font-semibold">{(property.price * 0.9).toLocaleString()} RWF</span>
              </div>
            )}
            <p className="text-sm text-slate-500 dark:text-slate-400">
              The property owner will contact you to finalize the {bookingType} details and payment.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                `Confirm Booking`
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
