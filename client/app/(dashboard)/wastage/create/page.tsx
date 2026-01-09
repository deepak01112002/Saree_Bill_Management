'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { wastageAPI, productsAPI } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { ArrowLeft, Save, Search } from 'lucide-react';
import Link from 'next/link';
import { showToast } from '@/lib/toast';

interface WastageFormData {
  productId: string;
  quantity: number;
  reason: string;
}

export default function CreateWastagePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [costImpact, setCostImpact] = useState(0);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<WastageFormData>({
    defaultValues: {
      productId: '',
      quantity: 0,
      reason: 'damage',
    },
  });

  const quantity = watch('quantity');
  const reason = watch('reason');

  useEffect(() => {
    if (selectedProduct && quantity) {
      setCostImpact(selectedProduct.costPrice * quantity);
    } else {
      setCostImpact(0);
    }
  }, [selectedProduct, quantity]);

  useEffect(() => {
    if (searchQuery.length > 2) {
      searchProducts();
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const searchProducts = async () => {
    try {
      const result = await productsAPI.getAll({ search: searchQuery, limit: 10 });
      setSearchResults(result.products || []);
    } catch (error) {
      console.error('Search error:', error);
    }
  };

  const selectProduct = (product: any) => {
    setSelectedProduct(product);
    setValue('productId', product._id);
    setSearchQuery('');
    setSearchResults([]);
  };

  const onSubmit = async (data: WastageFormData) => {
    if (!selectedProduct) {
      setError('Please select a product');
      return;
    }

    try {
      setLoading(true);
      setError('');

      await wastageAPI.create({
        productId: data.productId,
        quantity: Number(data.quantity),
        reason: data.reason,
      });

      showToast.success('Wastage recorded successfully!');
      router.push('/wastage');
    } catch (err: any) {
      setError(err.message || 'Failed to record wastage');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/wastage">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Record Wastage</h1>
          <p className="text-gray-600 mt-1">Record damaged or unsellable items</p>
        </div>
      </div>

      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle>Wastage Information</CardTitle>
          <CardDescription>Enter wastage details</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                {error}
              </div>
            )}

            {/* Product Search */}
            <div className="space-y-2">
              <Label>Product *</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search product by name, SKU, or brand..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {selectedProduct && (
                <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                  <p className="font-medium">{selectedProduct.name}</p>
                  <p className="text-sm text-gray-600">
                    SKU: {selectedProduct.sku} • Stock: {selectedProduct.stockQuantity} • Cost: {formatCurrency(selectedProduct.costPrice)}
                  </p>
                </div>
              )}

              {searchResults.length > 0 && (
                <div className="mt-2 border rounded-lg max-h-60 overflow-y-auto">
                  {searchResults.map((product) => (
                    <div
                      key={product._id}
                      className="p-3 border-b hover:bg-gray-50 cursor-pointer"
                      onClick={() => selectProduct(product)}
                    >
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-gray-500">
                        {product.sku} • Stock: {product.stockQuantity}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity *</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  {...register('quantity', {
                    required: 'Quantity is required',
                    min: { value: 1, message: 'Quantity must be at least 1' },
                  })}
                />
                {errors.quantity && (
                  <p className="text-sm text-red-600">{errors.quantity.message}</p>
                )}
                {selectedProduct && quantity > selectedProduct.stockQuantity && (
                  <p className="text-sm text-red-600">
                    Available stock: {selectedProduct.stockQuantity}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason">Reason *</Label>
                <select
                  id="reason"
                  {...register('reason', { required: 'Reason is required' })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="damage">Damage</option>
                  <option value="stain">Stain</option>
                  <option value="cutting">Cutting</option>
                  <option value="defect">Defect</option>
                  <option value="expired">Expired</option>
                  <option value="other">Other</option>
                </select>
                {errors.reason && (
                  <p className="text-sm text-red-600">{errors.reason.message}</p>
                )}
              </div>
            </div>

            {/* Cost Impact */}
            {costImpact > 0 && (
              <div className="p-4 bg-red-50 rounded-lg">
                <p className="text-sm text-gray-600">Estimated Cost Impact</p>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(costImpact)}
                </p>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-end gap-4">
            <Link href="/wastage">
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              disabled={loading || !selectedProduct}
              className="bg-gradient-to-r from-blue-600 to-purple-600"
            >
              <Save className="mr-2 h-4 w-4" />
              {loading ? 'Recording...' : 'Record Wastage'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

