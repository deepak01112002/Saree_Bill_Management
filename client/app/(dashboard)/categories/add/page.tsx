'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { categoriesAPI } from '@/lib/api';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import { showToast } from '@/lib/toast';

export default function AddCategoryPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Auto-generate code from name if code is empty
    if (name === 'name' && !formData.code) {
      const autoCode = value
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '')
        .substring(0, 6);
      setFormData((prev) => ({
        ...prev,
        code: autoCode || '',
      }));
    }
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
      setLoading(true);
      await categoriesAPI.create({
        name: formData.name.trim(),
        code: formData.code.trim().toUpperCase(),
        description: formData.description.trim(),
      });
      showToast.success('Category created successfully!');
      router.push('/categories');
    } catch (error: any) {
      console.error('Error creating category:', error);
      showToast.error('Failed to create category: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

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
          <h1 className="text-3xl font-bold text-gray-900">Add Category</h1>
          <p className="text-gray-600 mt-1">Create a new product category</p>
        </div>
      </div>

      {/* Form */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle>Category Details</CardTitle>
          <CardDescription>Enter category information</CardDescription>
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
                disabled={loading}
              />
              <p className="text-xs text-gray-500">The display name for this category</p>
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
                disabled={loading}
                className="uppercase font-mono"
                maxLength={6}
                pattern="[A-Z0-9]{2,6}"
              />
              <p className="text-xs text-gray-500">
                Short code (2-6 alphanumeric characters, uppercase). Used in SKU generation (e.g., LP-CAT01-000123)
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
                disabled={loading}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                disabled={loading}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                <Save className="mr-2 h-4 w-4" />
                {loading ? 'Creating...' : 'Create Category'}
              </Button>
              <Link href="/categories">
                <Button type="button" variant="outline" disabled={loading}>
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


