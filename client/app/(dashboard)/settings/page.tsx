'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { settingsAPI } from '@/lib/api';
import { showToast } from '@/lib/toast';
import { Settings, Save, Building2, FileText, Palette, MapPin } from 'lucide-react';
import { getCurrentUser, isAdmin } from '@/lib/auth-utils';

interface SettingsData {
  companyName: string;
  companyLogo?: string;
  website: string;
  gstin?: string;
  pan?: string;
  cin?: string;
  registeredOfficeAddress: string;
  placeOfSupply: string;
  paymentTerms: string;
  defaultDiscountPercentage?: number;
  phone?: string;
  email?: string;
  primaryColor?: string;
  secondaryColor?: string;
  invoiceFooterNote?: string;
  termsAndConditions?: string;
}

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [settings, setSettings] = useState<SettingsData>({
    companyName: 'La Patola',
    website: 'www.lapatola.com',
    registeredOfficeAddress: '',
    placeOfSupply: '',
    paymentTerms: 'Due on Receipt',
  });
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const currentUser = getCurrentUser();
    setUser(currentUser);
    
    // Check if user is admin
    if (!isAdmin()) {
      router.push('/dashboard');
      return;
    }
    
    loadSettings();
  }, [router]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await settingsAPI.get();
      setSettings(data);
    } catch (err: any) {
      console.error('Error loading settings:', err);
      setError(err.message || 'Failed to load settings');
      showToast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isAdmin()) {
      showToast.error('Only admins can update settings');
      return;
    }

    try {
      setSaving(true);
      setError('');
      
      await settingsAPI.update(settings);
      
      showToast.success('Settings saved successfully!');
      
      // Reload settings to get updated data
      await loadSettings();
    } catch (err: any) {
      console.error('Error saving settings:', err);
      setError(err.message || 'Failed to save settings');
      showToast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: keyof SettingsData, value: any) => {
    setSettings((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">System Settings</h1>
        <p className="text-gray-600 mt-1">Configure company information and system preferences</p>
      </div>

      {error && (
        <Card className="border-0 shadow-md border-red-200">
          <CardContent className="pt-6">
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
              {error}
            </div>
          </CardContent>
        </Card>
      )}

      <form onSubmit={handleSubmit}>
        {/* Company Information */}
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-blue-600" />
              Company Information
            </CardTitle>
            <CardDescription>Basic company details for invoices and bills</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name *</Label>
                <Input
                  id="companyName"
                  value={settings.companyName}
                  onChange={(e) => handleChange('companyName', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">Website *</Label>
                <Input
                  id="website"
                  value={settings.website}
                  onChange={(e) => handleChange('website', e.target.value)}
                  placeholder="www.lapatola.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="companyLogo">Company Logo URL</Label>
                <Input
                  id="companyLogo"
                  value={settings.companyLogo || ''}
                  onChange={(e) => handleChange('companyLogo', e.target.value)}
                  placeholder="https://lapatola.com/logo.png"
                />
                <p className="text-xs text-gray-500">
                  Current: {settings.companyLogo || 'Using default logo'}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={settings.phone || ''}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  placeholder="+91 1234567890"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={settings.email || ''}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="info@lapatola.com"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tax & Legal Information */}
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-green-600" />
              Tax & Legal Information
            </CardTitle>
            <CardDescription>Required for GST invoices and compliance</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="gstin">GSTIN</Label>
                <Input
                  id="gstin"
                  value={settings.gstin || ''}
                  onChange={(e) => handleChange('gstin', e.target.value.toUpperCase())}
                  placeholder="22AAAAA0000A1Z5"
                  maxLength={15}
                  pattern="[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}"
                />
                <p className="text-xs text-gray-500">15 characters (e.g., 22AAAAA0000A1Z5)</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="pan">PAN</Label>
                <Input
                  id="pan"
                  value={settings.pan || ''}
                  onChange={(e) => handleChange('pan', e.target.value.toUpperCase())}
                  placeholder="AAAAA1234A"
                  maxLength={10}
                  pattern="[A-Z]{5}[0-9]{4}[A-Z]{1}"
                />
                <p className="text-xs text-gray-500">10 characters (e.g., AAAAA1234A)</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cin">CIN</Label>
                <Input
                  id="cin"
                  value={settings.cin || ''}
                  onChange={(e) => handleChange('cin', e.target.value.toUpperCase())}
                  placeholder="U12345AB2020PTC123456"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Address Information */}
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-purple-600" />
              Address Information
            </CardTitle>
            <CardDescription>Address details for invoices</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="registeredOfficeAddress">Registered Office Address *</Label>
              <textarea
                id="registeredOfficeAddress"
                value={settings.registeredOfficeAddress}
                onChange={(e) => handleChange('registeredOfficeAddress', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[80px]"
                placeholder="Enter complete registered office address"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="placeOfSupply">Place of Supply *</Label>
              <Input
                id="placeOfSupply"
                value={settings.placeOfSupply}
                onChange={(e) => handleChange('placeOfSupply', e.target.value)}
                placeholder="e.g., Gujarat, India"
                required
              />
            </div>
          </CardContent>
        </Card>

        {/* Business Settings */}
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-orange-600" />
              Business Settings
            </CardTitle>
            <CardDescription>Payment and discount preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="paymentTerms">Payment Terms *</Label>
                <Input
                  id="paymentTerms"
                  value={settings.paymentTerms}
                  onChange={(e) => handleChange('paymentTerms', e.target.value)}
                  placeholder="e.g., Due on Receipt, Net 30"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="defaultDiscountPercentage">Default Discount Percentage (%)</Label>
                <Input
                  id="defaultDiscountPercentage"
                  type="number"
                  min="0"
                  max="100"
                  value={settings.defaultDiscountPercentage || 0}
                  onChange={(e) => handleChange('defaultDiscountPercentage', Number(e.target.value))}
                  placeholder="0"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Invoice Customization */}
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-pink-600" />
              Invoice Customization
            </CardTitle>
            <CardDescription>Customize invoice appearance and content</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="primaryColor">Primary Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="primaryColor"
                    type="color"
                    value={settings.primaryColor || '#3b82f6'}
                    onChange={(e) => handleChange('primaryColor', e.target.value)}
                    className="w-20 h-10"
                  />
                  <Input
                    value={settings.primaryColor || '#3b82f6'}
                    onChange={(e) => handleChange('primaryColor', e.target.value)}
                    placeholder="#3b82f6"
                    className="flex-1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="secondaryColor">Secondary Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="secondaryColor"
                    type="color"
                    value={settings.secondaryColor || '#ffffff'}
                    onChange={(e) => handleChange('secondaryColor', e.target.value)}
                    className="w-20 h-10"
                  />
                  <Input
                    value={settings.secondaryColor || '#ffffff'}
                    onChange={(e) => handleChange('secondaryColor', e.target.value)}
                    placeholder="#ffffff"
                    className="flex-1"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="invoiceFooterNote">Invoice Footer Note</Label>
              <textarea
                id="invoiceFooterNote"
                value={settings.invoiceFooterNote || ''}
                onChange={(e) => handleChange('invoiceFooterNote', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[60px]"
                placeholder="Additional note to display at the bottom of invoices"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="termsAndConditions">Terms & Conditions</Label>
              <textarea
                id="termsAndConditions"
                value={settings.termsAndConditions || ''}
                onChange={(e) => handleChange('termsAndConditions', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[100px]"
                placeholder="Enter terms and conditions for invoices"
              />
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Settings
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}


