'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { productsAPI, categoriesAPI } from '@/lib/api';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';

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
}

interface Category {
  _id: string;
  name: string;
  code: string;
}

export default function AddProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [autoGenerateSKU, setAutoGenerateSKU] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<ProductFormData>({
    defaultValues: {
      name: '',
      sareeType: '',
      brand: '',
      color: '',
      pattern: '',
      costPrice: 0,
      sellingPrice: 0,
      sku: '',
      stockQuantity: 0,
      purchaseDate: new Date().toISOString().split('T')[0],
    },
  });

  const name = watch('name');
  const brand = watch('brand');
  const category = watch('category');

  // Load categories
  useEffect(() => {
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
    loadCategories();
  }, []);

  // Auto-generate SKU when name or brand changes
  // Note: If category is selected, backend will auto-generate SKU in LP-CAT01-000123 format
  const generateSKU = useCallback(() => {
    if (autoGenerateSKU && name && brand && !category) {
      // Only generate old format if no category is selected
      const namePrefix = name.substring(0, 3).toUpperCase().replace(/\s/g, '');
      const brandPrefix = brand.substring(0, 3).toUpperCase().replace(/\s/g, '');
      const timestamp = Date.now().toString().slice(-4);
      const sku = `${namePrefix}-${brandPrefix}-${timestamp}`;
      setValue('sku', sku, { shouldValidate: true });
      return sku;
    } else if (category) {
      // If category is selected, clear SKU - backend will generate LP-CAT01-000123 format
      setValue('sku', '', { shouldValidate: false });
    }
    return '';
  }, [autoGenerateSKU, name, brand, category, setValue]);

  // Watch for name/brand/category changes to auto-generate SKU
  useEffect(() => {
    if (name && brand && autoGenerateSKU) {
      generateSKU();
    }
  }, [name, brand, category, autoGenerateSKU, generateSKU]);

  const onSubmit = async (data: ProductFormData) => {
    try {
      setLoading(true);
      setError('');

      // Generate SKU if auto-generate is enabled and SKU is empty
      let finalSku: string | undefined = data.sku?.trim();
      
      // If category is selected, backend will auto-generate SKU - so allow empty SKU
      if (data.category) {
        // Backend will generate SKU in LP-CAT01-000123 format, so we can send empty or undefined
        finalSku = undefined;
      } else if (autoGenerateSKU && !finalSku) {
        // Only generate SKU if no category and auto-generate is enabled
        if (name && brand) {
          finalSku = generateSKU();
          // If still empty, get from watch
          if (!finalSku) {
            finalSku = watch('sku')?.trim();
          }
        }
      }

      // Only validate SKU if category is not selected
      if (!data.category && !finalSku) {
        setError('SKU is required. Please enter a SKU or ensure name and brand are filled for auto-generation.');
        setLoading(false);
        return;
      }

      // Prepare product data - exclude SKU if category is selected (backend will generate it)
      const productData: any = {
        ...data,
        costPrice: Number(data.costPrice),
        sellingPrice: Number(data.sellingPrice),
        stockQuantity: Number(data.stockQuantity),
        purchaseDate: new Date(data.purchaseDate),
      };

      // Only include SKU if it's provided (not when category is selected)
      if (finalSku) {
        productData.sku = finalSku;
      } else {
        // Don't include SKU in request - backend will generate it
        delete productData.sku;
      }

      await productsAPI.create(productData);
      router.push('/products');
    } catch (err: any) {
      setError(err.message || 'Failed to create product');
    } finally {
      setLoading(false);
    }
  };

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
          <h1 className="text-3xl font-bold text-gray-900">Add Product</h1>
          <p className="text-gray-600 mt-1">Add a new product to your inventory</p>
        </div>
      </div>

      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle>Product Information</CardTitle>
          <CardDescription>Enter the details of the new product</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                {error}
              </div>
            )}

            <div className="grid gap-6 md:grid-cols-2">
              {/* Product Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Product Name *</Label>
                <Input
                  id="name"
                  {...register('name', { required: 'Product name is required' })}
                  placeholder="e.g., Silk Saree"
                />
                {errors.name && (
                  <p className="text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>

              {/* Saree Type */}
              <div className="space-y-2">
                <Label htmlFor="sareeType">Saree Type *</Label>
                <Input
                  id="sareeType"
                  {...register('sareeType', { required: 'Saree type is required' })}
                  placeholder="e.g., Silk, Cotton, Banarasi"
                />
                {errors.sareeType && (
                  <p className="text-sm text-red-600">{errors.sareeType.message}</p>
                )}
              </div>

              {/* Brand */}
              <div className="space-y-2">
                <Label htmlFor="brand">Brand / Supplier *</Label>
                <Input
                  id="brand"
                  {...register('brand', { required: 'Brand is required' })}
                  placeholder="e.g., Brand Name"
                />
                {errors.brand && (
                  <p className="text-sm text-red-600">{errors.brand.message}</p>
                )}
              </div>

              {/* Color */}
              <div className="space-y-2">
                <Label htmlFor="color">Color *</Label>
                <Input
                  id="color"
                  {...register('color', { required: 'Color is required' })}
                  placeholder="e.g., Red, Blue, Green"
                />
                {errors.color && (
                  <p className="text-sm text-red-600">{errors.color.message}</p>
                )}
              </div>

              {/* Pattern */}
              <div className="space-y-2">
                <Label htmlFor="pattern">Pattern</Label>
                <Input
                  id="pattern"
                  {...register('pattern')}
                  placeholder="e.g., Floral, Geometric"
                />
              </div>

              {/* Category */}
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

              {/* SKU */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="sku">SKU Code *</Label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={autoGenerateSKU}
                      onChange={(e) => {
                        setAutoGenerateSKU(e.target.checked);
                        if (e.target.checked && name && brand) {
                          generateSKU();
                        } else if (!e.target.checked) {
                          // Clear SKU when auto-generate is disabled
                          setValue('sku', '', { shouldValidate: false });
                        }
                      }}
                      className="rounded"
                      disabled={!!category}
                    />
                    Auto-generate {category && '(Backend will generate LP-CAT01-000123 format)'}
                  </label>
                </div>
                <Input
                  id="sku"
                  {...register('sku', { 
                    required: category ? false : (!autoGenerateSKU ? 'SKU is required when auto-generate is disabled' : false),
                    validate: (value) => {
                      // If category is selected, SKU is optional (backend generates it)
                      if (category) {
                        return true;
                      }
                      // If no category and auto-generate is disabled, SKU is required
                      if (!autoGenerateSKU && !value) {
                        return 'SKU is required when auto-generate is disabled';
                      }
                      return true;
                    }
                  })}
                  placeholder={category ? "Will be auto-generated as LP-CAT01-000123" : "e.g., SIL-BRA-1234 or LP-CAT01-000123"}
                  disabled={!!category || (autoGenerateSKU && !category)}
                  className="font-mono"
                />
                {category && (
                  <p className="text-xs text-blue-600">
                    SKU will be auto-generated in LP-{categories.find(c => c._id === category)?.code || 'CAT'}-000123 format
                  </p>
                )}
                {errors.sku && (
                  <p className="text-sm text-red-600">{errors.sku.message}</p>
                )}
              </div>

              {/* Cost Price */}
              <div className="space-y-2">
                <Label htmlFor="costPrice">Cost Price (₹) *</Label>
                <Input
                  id="costPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  {...register('costPrice', {
                    required: 'Cost price is required',
                    min: { value: 0, message: 'Cost price must be positive' },
                  })}
                  placeholder="0.00"
                />
                {errors.costPrice && (
                  <p className="text-sm text-red-600">{errors.costPrice.message}</p>
                )}
              </div>

              {/* Selling Price */}
              <div className="space-y-2">
                <Label htmlFor="sellingPrice">Selling Price (₹) *</Label>
                <Input
                  id="sellingPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  {...register('sellingPrice', {
                    required: 'Selling price is required',
                    min: { value: 0, message: 'Selling price must be positive' },
                  })}
                  placeholder="0.00"
                />
                {errors.sellingPrice && (
                  <p className="text-sm text-red-600">{errors.sellingPrice.message}</p>
                )}
              </div>

              {/* Stock Quantity */}
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
                  placeholder="0"
                />
                {errors.stockQuantity && (
                  <p className="text-sm text-red-600">{errors.stockQuantity.message}</p>
                )}
              </div>

              {/* Purchase Date */}
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
              disabled={loading}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <Save className="mr-2 h-4 w-4" />
              {loading ? 'Creating...' : 'Create Product'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

