'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { rollPolishAPI } from '@/lib/api';
import { ArrowLeft, Package } from 'lucide-react';
import Link from 'next/link';
import { showToast } from '@/lib/toast';

export default function EditRollPolishPage() {
  const params = useParams();
  const router = useRouter();
  const rollId = params.id as string;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    rollNumber: '',
    fabricType: '',
    quantity: '',
    unit: 'meters',
    colorDesign: '',
    vendorName: '',
    vendorContact: '',
    vendorAddress: '',
    status: 'sent',
    sentDate: '',
    expectedReturnDate: '',
    actualReturnDate: '',
    notes: '',
  });

  useEffect(() => {
    loadRollPolish();
  }, [rollId]);

  const loadRollPolish = async () => {
    try {
      setLoading(true);
      const data = await rollPolishAPI.getById(rollId);
      
      setFormData({
        rollNumber: data.rollNumber || '',
        fabricType: data.fabricType || '',
        quantity: data.quantity?.toString() || '',
        unit: data.unit || 'meters',
        colorDesign: data.colorDesign || '',
        vendorName: data.vendorName || '',
        vendorContact: data.vendorContact || '',
        vendorAddress: data.vendorAddress || '',
        status: data.status || 'sent',
        sentDate: data.sentDate ? new Date(data.sentDate).toISOString().split('T')[0] : '',
        expectedReturnDate: data.expectedReturnDate ? new Date(data.expectedReturnDate).toISOString().split('T')[0] : '',
        actualReturnDate: data.actualReturnDate ? new Date(data.actualReturnDate).toISOString().split('T')[0] : '',
        notes: data.notes || '',
      });
    } catch (error: any) {
      console.error('Error loading roll polish:', error);
      showToast.error('Failed to load roll polish entry: ' + (error.message || 'Unknown error'));
      router.push('/roll-polish');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.rollNumber.trim()) {
      showToast.error('Roll number is required');
      return;
    }

    if (!formData.fabricType.trim()) {
      showToast.error('Fabric type is required');
      return;
    }

    if (!formData.quantity || parseFloat(formData.quantity) <= 0) {
      showToast.error('Valid quantity is required');
      return;
    }

    if (!formData.vendorName.trim()) {
      showToast.error('Vendor name is required');
      return;
    }

    if (!formData.sentDate) {
      showToast.error('Sent date is required');
      return;
    }

    try {
      setSaving(true);
      await rollPolishAPI.update(rollId, {
        rollNumber: formData.rollNumber.trim(),
        fabricType: formData.fabricType.trim(),
        quantity: parseFloat(formData.quantity),
        unit: formData.unit,
        colorDesign: formData.colorDesign.trim() || undefined,
        vendorName: formData.vendorName.trim(),
        vendorContact: formData.vendorContact.trim() || undefined,
        vendorAddress: formData.vendorAddress.trim() || undefined,
        status: formData.status,
        sentDate: formData.sentDate,
        expectedReturnDate: formData.expectedReturnDate || undefined,
        actualReturnDate: formData.actualReturnDate || undefined,
        notes: formData.notes.trim() || undefined,
      });
      showToast.success('Roll polish entry updated successfully!');
      router.push('/roll-polish');
    } catch (error: any) {
      console.error('Error updating roll polish:', error);
      showToast.error('Failed to update roll polish entry: ' + (error.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading roll polish entry...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/roll-polish">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Edit Roll Polish Entry</h1>
          <p className="text-gray-600 mt-1">Update roll polish entry details</p>
        </div>
      </div>

      <Card className="border-0 shadow-md">
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Roll Polish Details</CardTitle>
            <CardDescription>Update the details for this roll polish entry</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Roll Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Roll Information</h3>
              
              <div className="space-y-2">
                <Label htmlFor="rollNumber">Roll Number *</Label>
                <Input
                  id="rollNumber"
                  name="rollNumber"
                  placeholder="e.g., ROLL-20240101-001"
                  value={formData.rollNumber}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fabricType">Fabric Type *</Label>
                  <Input
                    id="fabricType"
                    name="fabricType"
                    placeholder="e.g., Silk, Cotton, Georgette"
                    value={formData.fabricType}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="colorDesign">Color/Design</Label>
                  <Input
                    id="colorDesign"
                    name="colorDesign"
                    placeholder="e.g., Red, Blue, Floral"
                    value={formData.colorDesign}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity *</Label>
                  <Input
                    id="quantity"
                    name="quantity"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0"
                    value={formData.quantity}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="unit">Unit *</Label>
                  <select
                    id="unit"
                    name="unit"
                    className="w-full h-10 px-3 border border-gray-300 rounded-md"
                    value={formData.unit}
                    onChange={handleChange}
                    required
                  >
                    <option value="meters">Meters</option>
                    <option value="pieces">Pieces</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Vendor Information */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Vendor Information</h3>
              
              <div className="space-y-2">
                <Label htmlFor="vendorName">Vendor Name *</Label>
                <Input
                  id="vendorName"
                  name="vendorName"
                  placeholder="Enter vendor/partner name"
                  value={formData.vendorName}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="vendorContact">Vendor Contact</Label>
                  <Input
                    id="vendorContact"
                    name="vendorContact"
                    placeholder="Phone number"
                    value={formData.vendorContact}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="vendorAddress">Vendor Address</Label>
                <Textarea
                  id="vendorAddress"
                  name="vendorAddress"
                  placeholder="Vendor address"
                  value={formData.vendorAddress}
                  onChange={handleChange}
                  rows={2}
                />
              </div>
            </div>

            {/* Status and Dates */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Status & Dates</h3>
              
              <div className="space-y-2">
                <Label htmlFor="status">Status *</Label>
                <select
                  id="status"
                  name="status"
                  className="w-full h-10 px-3 border border-gray-300 rounded-md"
                  value={formData.status}
                  onChange={handleChange}
                  required
                >
                  <option value="sent">Sent</option>
                  <option value="in_process">In Process</option>
                  <option value="completed">Completed</option>
                  <option value="returned">Returned</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sentDate">Sent Date *</Label>
                  <Input
                    id="sentDate"
                    name="sentDate"
                    type="date"
                    value={formData.sentDate}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expectedReturnDate">Expected Return Date</Label>
                  <Input
                    id="expectedReturnDate"
                    name="expectedReturnDate"
                    type="date"
                    value={formData.expectedReturnDate}
                    onChange={handleChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="actualReturnDate">Actual Return Date</Label>
                  <Input
                    id="actualReturnDate"
                    name="actualReturnDate"
                    type="date"
                    value={formData.actualReturnDate}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2 pt-4 border-t">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                name="notes"
                placeholder="Additional notes or comments"
                value={formData.notes}
                onChange={handleChange}
                rows={3}
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <Link href="/roll-polish">
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Link>
            <Button type="submit" disabled={saving} className="bg-gradient-to-r from-blue-600 to-purple-600">
              {saving ? 'Updating...' : 'Update Roll Polish Entry'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
