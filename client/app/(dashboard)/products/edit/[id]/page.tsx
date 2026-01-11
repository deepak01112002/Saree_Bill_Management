'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { productsAPI, categoriesAPI } from '@/lib/api';
import { ArrowLeft, Save, Lock, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { showToast } from '@/lib/toast';

interface ProductFormData {
  name: string;
  sareeType: string;
  brand: string;
  color: string;
  pattern: string;
  costPrice: number;
  sellingPrice: number;
  sku: string;
  stockQuantity: number;
  purchaseDate: string;
  category?: string;
  hsnCode?: string;
}

interface Category {
  _id: string;
  name: string;
  code: string;
}

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [priceLocked, setPriceLocked] = useState(false);
  const [userRole, setUserRole] = useState<'admin' | 'staff'>('staff');

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    reset,
  } = useForm<ProductFormData>();

  useEffect(() => {
    loadProduct();
    loadCategories();
    // Get user role from token
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUserRole(payload.role || 'staff');
      } catch (error) {
        console.error('Error decoding token:', error);
      }
    }
  }, [productId]);

  const loadCategories = async () => {
    try {
      const data = await categoriesAPI.getAll();
      setCategories(data || []);
    } catch (error) {
      console.error('Error loading categories:', error);
    } finally {
      setLoadingCategories(false);
    }
  };

  const loadProduct = async () => {
    try {
      setLoading(true);
      const product = await productsAPI.getById(productId);
      
      // Format date for input
      const purchaseDate = product.purchaseDate 
        ? new Date(product.purchaseDate).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0];

      reset({
        name: product.name || '',
        sareeType: product.sareeType || '',
        brand: product.brand || '',
        color: product.color || '',
        pattern: product.pattern || '',
        costPrice: product.costPrice || 0,
        sellingPrice: product.sellingPrice || 0,
        sku: product.sku || '',
        stockQuantity: product.stockQuantity || 0,
        purchaseDate: purchaseDate,
        category: product.category?._id || product.category || '',
        hsnCode: product.hsnCode || '',
      });
      
      setPriceLocked(product.priceLocked || false);
    } catch (err: any) {
      setError('Failed to load product: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: ProductFormData) => {
    try {
      setSaving(true);
      setError('');

      const productData = {
        ...data,
        costPrice: Number(data.costPrice),
        sellingPrice: Number(data.sellingPrice),
        stockQuantity: Number(data.stockQuantity),
        purchaseDate: new Date(data.purchaseDate),
      };

      await productsAPI.update(productId, productData);
      showToast.success('Product updated successfully!');
      router.push('/products');
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to update product';
      setError(errorMessage);
      
      // Check if it's a price lock error
      if (err.priceLocked || errorMessage.includes('Price is locked')) {
        showToast.error('Price is locked. Only admins can modify prices after billing.');
      } else {
        showToast.error(errorMessage);
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading product...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/products">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Edit Product</h1>
          <p className="text-gray-600 mt-1">Update product information</p>
        </div>
      </div>

      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle>Product Information</CardTitle>
          <CardDescription>Update the product details</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                {error}
              </div>
            )}

            {priceLocked && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                <div className="flex items-start gap-3">
                  <Lock className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-yellow-800 mb-1">
                      Price Locked
                    </p>
                    <p className="text-sm text-yellow-700">
                      This product's price has been locked because it has been sold. 
                      {userRole !== 'admin' ? (
                        <span className="font-semibold"> Only admins can modify locked prices. Please contact an admin for price changes.</span>
                      ) : (
                        <span> As an admin, you can still modify the price.</span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Product Name *</Label>
                <Input
                  id="name"
                  {...register('name', { required: 'Product name is required' })}
                />
                {errors.name && (
                  <p className="text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="sareeType">Saree Type *</Label>
                <Input
                  id="sareeType"
                  {...register('sareeType', { required: 'Saree type is required' })}
                />
                {errors.sareeType && (
                  <p className="text-sm text-red-600">{errors.sareeType.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="brand">Brand / Supplier *</Label>
                <Input
                  id="brand"
                  {...register('brand', { required: 'Brand is required' })}
                />
                {errors.brand && (
                  <p className="text-sm text-red-600">{errors.brand.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="color">Color *</Label>
                <Input
                  id="color"
                  {...register('color', { required: 'Color is required' })}
                />
                {errors.color && (
                  <p className="text-sm text-red-600">{errors.color.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="pattern">Pattern</Label>
                <Input id="pattern" {...register('pattern')} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                {loadingCategories ? (
                  <div className="text-sm text-gray-500">Loading categories...</div>
                ) : (
                  <select
                    id="category"
                    {...register('category')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select a category (optional)</option>
                    {categories.map((cat) => (
                      <option key={cat._id} value={cat._id}>
                        {cat.name} ({cat.code})
                      </option>
                    ))}
                  </select>
                )}
                <p className="text-xs text-gray-500">Organize products by category</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sku">SKU Code *</Label>
                <Input
                  id="sku"
                  {...register('sku', { required: 'SKU is required' })}
                  className="font-mono"
                />
                {errors.sku && (
                  <p className="text-sm text-red-600">{errors.sku.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="costPrice">Cost Price (₹) *</Label>
                <Input
                  id="costPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  disabled={priceLocked && userRole !== 'admin'}
                  className={priceLocked && userRole !== 'admin' ? 'bg-gray-100 cursor-not-allowed' : ''}
                  {...register('costPrice', {
                    required: 'Cost price is required',
                    min: { value: 0, message: 'Cost price must be positive' },
                  })}
                />
                {errors.costPrice && (
                  <p className="text-sm text-red-600">{errors.costPrice.message}</p>
                )}
                {priceLocked && userRole !== 'admin' && (
                  <p className="text-xs text-yellow-600 flex items-center gap-1">
                    <Lock className="h-3 w-3" />
                    Price locked - Admin only
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="sellingPrice">Selling Price (₹) *</Label>
                <Input
                  id="sellingPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  disabled={priceLocked && userRole !== 'admin'}
                  className={priceLocked && userRole !== 'admin' ? 'bg-gray-100 cursor-not-allowed' : ''}
                  {...register('sellingPrice', {
                    required: 'Selling price is required',
                    min: { value: 0, message: 'Selling price must be positive' },
                  })}
                />
                {errors.sellingPrice && (
                  <p className="text-sm text-red-600">{errors.sellingPrice.message}</p>
                )}
                {priceLocked && userRole !== 'admin' && (
                  <p className="text-xs text-yellow-600 flex items-center gap-1">
                    <Lock className="h-3 w-3" />
                    Price locked - Admin only
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="stockQuantity">Stock Quantity *</Label>
                <Input
                  id="stockQuantity"
                  type="number"
                  min="0"
                  {...register('stockQuantity', {
                    required: 'Stock quantity is required',
                    min: { value: 0, message: 'Stock quantity cannot be negative' },
                  })}
                />
                {errors.stockQuantity && (
                  <p className="text-sm text-red-600">{errors.stockQuantity.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="hsnCode">HSN Code</Label>
                <Input
                  id="hsnCode"
                  {...register('hsnCode')}
                  placeholder="e.g., 5408, 6304"
                  onChange={(e) => {
                    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                    setValue('hsnCode', value);
                  }}
                  maxLength={20}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">Harmonized System of Nomenclature code for GST</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="purchaseDate">Purchase Date *</Label>
                <Input
                  id="purchaseDate"
                  type="date"
                  {...register('purchaseDate', { required: 'Purchase date is required' })}
                />
                {errors.purchaseDate && (
                  <p className="text-sm text-red-600">{errors.purchaseDate.message}</p>
                )}
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-4">
            <Link href="/products">
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              disabled={saving}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <Save className="mr-2 h-4 w-4" />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

