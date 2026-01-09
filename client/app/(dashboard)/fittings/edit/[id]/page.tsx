'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { fittingsAPI } from '@/lib/api';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { showToast } from '@/lib/toast';
import { Switch } from '@/components/ui/switch';

export default function EditFittingPage() {
  const params = useParams();
  const router = useRouter();
  const fittingId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    serviceName: '',
    description: '',
    unit: 'item',
    rate: '',
    isActive: true,
  });

  useEffect(() => {
    if (fittingId) {
      loadFitting();
    }
  }, [fittingId]);

  const loadFitting = async () => {
    try {
      setLoading(true);
      const fitting = await fittingsAPI.getById(fittingId);
      setFormData({
        serviceName: fitting.serviceName || '',
        description: fitting.description || '',
        unit: fitting.unit || 'item',
        rate: fitting.rate?.toString() || '',
        isActive: fitting.isActive !== false,
      });
    } catch (error: any) {
      console.error('Error loading fitting:', error);
      showToast.error('Failed to load fitting service: ' + (error.message || 'Unknown error'));
      router.push('/fittings');
    } finally {
      setLoading(false);
    }
  };

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
      setSaving(true);
      await fittingsAPI.update(fittingId, {
        serviceName: formData.serviceName.trim(),
        description: formData.description.trim() || undefined,
        unit: formData.unit.trim(),
        rate: parseFloat(formData.rate),
        isActive: formData.isActive,
      });
      showToast.success('Fitting service updated successfully!');
      router.push('/fittings');
    } catch (error: any) {
      console.error('Error updating fitting:', error);
      showToast.error('Failed to update fitting service: ' + (error.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading fitting service...</p>
        </div>
      </div>
    );
  }

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
          <h1 className="text-3xl font-bold text-gray-900">Edit Fitting Service</h1>
          <p className="text-gray-600 mt-1">Update fitting service details</p>
        </div>
      </div>

      <Card className="border-0 shadow-md">
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Fitting Service Details</CardTitle>
            <CardDescription>Update the details for this fitting service</CardDescription>
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
            <Button type="submit" disabled={saving} className="bg-gradient-to-r from-blue-600 to-purple-600">
              {saving ? 'Saving...' : 'Update Fitting Service'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}


