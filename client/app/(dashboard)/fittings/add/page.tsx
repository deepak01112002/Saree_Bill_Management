'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { fittingsAPI } from '@/lib/api';
import { ArrowLeft, Scissors } from 'lucide-react';
import Link from 'next/link';
import { showToast } from '@/lib/toast';
import { Switch } from '@/components/ui/switch';

export default function AddFittingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    serviceName: '',
    description: '',
    unit: 'item',
    rate: '',
    isActive: true,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSwitchChange = (checked: boolean) => {
    setFormData((prev) => ({ ...prev, isActive: checked }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.serviceName.trim()) {
      showToast.error('Service name is required');
      return;
    }

    if (!formData.unit.trim()) {
      showToast.error('Unit is required');
      return;
    }

    if (!formData.rate || parseFloat(formData.rate) < 0) {
      showToast.error('Valid rate is required');
      return;
    }

    try {
      setLoading(true);
      await fittingsAPI.create({
        serviceName: formData.serviceName.trim(),
        description: formData.description.trim() || undefined,
        unit: formData.unit.trim(),
        rate: parseFloat(formData.rate),
        isActive: formData.isActive,
      });
      showToast.success('Fitting service created successfully!');
      router.push('/fittings');
    } catch (error: any) {
      console.error('Error creating fitting:', error);
      showToast.error('Failed to create fitting service: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/fittings">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Add Fitting Service</h1>
          <p className="text-gray-600 mt-1">Create a new fitting or stitching service</p>
        </div>
      </div>

      <Card className="border-0 shadow-md">
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Fitting Service Details</CardTitle>
            <CardDescription>Enter the details for the new fitting service</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="serviceName">Service Name *</Label>
              <Input
                id="serviceName"
                name="serviceName"
                placeholder="e.g., Saree Stitching, Fall and Pico, Blouse Stitching"
                value={formData.serviceName}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Optional description of the service"
                value={formData.description}
                onChange={handleChange}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="unit">Unit *</Label>
                <Input
                  id="unit"
                  name="unit"
                  placeholder="e.g., item, piece, meter"
                  value={formData.unit}
                  onChange={handleChange}
                  required
                />
                <p className="text-xs text-gray-500">Unit of measurement for this service</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="rate">Rate (₹) *</Label>
                <Input
                  id="rate"
                  name="rate"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={formData.rate}
                  onChange={handleChange}
                  required
                />
                <p className="text-xs text-gray-500">Price per unit</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <Label htmlFor="isActive" className="text-base font-medium">
                  Active Status
                </Label>
                <p className="text-sm text-gray-500">Enable or disable this service</p>
              </div>
              <Switch id="isActive" checked={formData.isActive} onCheckedChange={handleSwitchChange} />
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <Link href="/fittings">
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Link>
            <Button type="submit" disabled={loading} className="bg-gradient-to-r from-blue-600 to-purple-600">
              {loading ? 'Creating...' : 'Create Fitting Service'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}


