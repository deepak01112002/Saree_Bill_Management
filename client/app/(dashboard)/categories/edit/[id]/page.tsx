'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { categoriesAPI } from '@/lib/api';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import { showToast } from '@/lib/toast';

export default function EditCategoryPage() {
  const router = useRouter();
  const params = useParams();
  const categoryId = params.id as string;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
  });

  useEffect(() => {
    loadCategory();
  }, [categoryId]);

  const loadCategory = async () => {
    try {
      setLoading(true);
      const category = await categoriesAPI.getById(categoryId);
      setFormData({
        name: category.name || '',
        code: category.code || '',
        description: category.description || '',
      });
    } catch (error: any) {
      console.error('Error loading category:', error);
      showToast.error('Failed to load category: ' + (error.message || 'Unknown error'));
      router.push('/categories');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      showToast.error('Category name is required');
      return;
    }

    if (!formData.code.trim()) {
      showToast.error('Category code is required');
      return;
    }

    // Validate code format (2-6 alphanumeric characters)
    if (!/^[A-Z0-9]{2,6}$/.test(formData.code.toUpperCase())) {
      showToast.error('Category code must be 2-6 alphanumeric characters');
      return;
    }

    try {
      setSaving(true);
      await categoriesAPI.update(categoryId, {
        name: formData.name.trim(),
        code: formData.code.trim().toUpperCase(),
        description: formData.description.trim(),
      });
      showToast.success('Category updated successfully!');
      router.push('/categories');
    } catch (error: any) {
      console.error('Error updating category:', error);
      showToast.error('Failed to update category: ' + (error.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading category...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/categories">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Edit Category</h1>
          <p className="text-gray-600 mt-1">Update category information</p>
        </div>
      </div>

      {/* Form */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle>Category Details</CardTitle>
          <CardDescription>Update category information</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">
                Category Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                name="name"
                type="text"
                placeholder="e.g., Sarees, Dupattas, Kurtis"
                value={formData.name}
                onChange={handleChange}
                required
                disabled={saving}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="code">
                Category Code <span className="text-red-500">*</span>
              </Label>
              <Input
                id="code"
                name="code"
                type="text"
                placeholder="e.g., CAT01, DUP01"
                value={formData.code}
                onChange={handleChange}
                required
                disabled={saving}
                className="uppercase font-mono"
                maxLength={6}
                pattern="[A-Z0-9]{2,6}"
              />
              <p className="text-xs text-gray-500">
                Short code (2-6 alphanumeric characters, uppercase). Used in SKU generation.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <textarea
                id="description"
                name="description"
                placeholder="Brief description of this category..."
                value={formData.description}
                onChange={handleChange}
                disabled={saving}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                disabled={saving}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                <Save className="mr-2 h-4 w-4" />
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
              <Link href="/categories">
                <Button type="button" variant="outline" disabled={saving}>
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}


