import React, { useState } from 'react';
import { useAuth } from '../utils/AuthContext';
import { Building, User, Percent, FileText, CheckCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Card, CardContent } from './ui/card';
import { toast } from 'sonner';

interface ManagementAgreementProps {
  propertyId: string;
  propertyTitle: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ManagementAgreement({ propertyId, propertyTitle, isOpen, onClose, onSuccess }: ManagementAgreementProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    managerName: '',
    managerPhone: '',
    managerEmail: '',
    managementPercentage: '',
    terms: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Simulate API call to create management agreement
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('Management agreement created:', {
        propertyId,
        ...formData
      });
      
      toast.success('Management agreement created successfully!');
      onSuccess();
      onClose();
      
      // Reset form
      setFormData({
        managerName: '',
        managerPhone: '',
        managerEmail: '',
        managementPercentage: '',
        terms: '',
      });
    } catch (error) {
      toast.error('Failed to create management agreement');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-600" />
            Property Management Agreement
          </DialogTitle>
          <DialogDescription>
            Create an agreement for property management
          </DialogDescription>
        </DialogHeader>

        {/* Property Info */}
        <Card className="bg-slate-50 dark:bg-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Building className="w-8 h-8 text-emerald-600" />
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Property</p>
                <p className="text-slate-900 dark:text-white font-semibold">{propertyTitle}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
              Management Details
            </h3>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="managerName">Manager Name *</Label>
                <Input
                  id="managerName"
                  value={formData.managerName}
                  onChange={(e) => setFormData({ ...formData, managerName: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="managerPhone">Manager Phone *</Label>
                <Input
                  id="managerPhone"
                  type="tel"
                  value={formData.managerPhone}
                  onChange={(e) => setFormData({ ...formData, managerPhone: e.target.value })}
                  placeholder="+250 xxx xxx xxx"
                  required
                />
              </div>

              <div>
                <Label htmlFor="managerEmail">Manager Email</Label>
                <Input
                  id="managerEmail"
                  type="email"
                  value={formData.managerEmail}
                  onChange={(e) => setFormData({ ...formData, managerEmail: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="managementPercentage">
                  Management Percentage (%)
                </Label>
                <div className="relative">
                  <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <Input
                    id="managementPercentage"
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={formData.managementPercentage}
                    onChange={(e) => setFormData({ ...formData, managementPercentage: e.target.value })}
                    className="pl-10"
                    placeholder="e.g., 10"
                  />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Enter the percentage of rent/income that will be paid to the manager
                </p>
              </div>

              <div>
                <Label htmlFor="terms">Agreement Terms</Label>
                <Textarea
                  id="terms"
                  value={formData.terms}
                  onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
                  rows={4}
                  placeholder="Describe the terms and conditions of the management agreement..."
                />
              </div>
            </div>
          </div>

          {/* Summary */}
          <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white mb-1">
                    About Management Agreements
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    A property management agreement allows a third party to manage your property on your behalf. 
                    The manager will handle tenant relations, maintenance, and rent collection in exchange for a percentage of the income.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

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
              {loading ? 'Creating Agreement...' : 'Create Management Agreement'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

