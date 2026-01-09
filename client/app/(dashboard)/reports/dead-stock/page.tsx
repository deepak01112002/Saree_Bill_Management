'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { reportsAPI } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { ArrowLeft, Package, AlertTriangle, DollarSign, Calendar } from 'lucide-react';
import Link from 'next/link';
import { showToast } from '@/lib/toast';

export default function DeadStockPage() {
  const [days, setDays] = useState(90);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDeadStock();
  }, []);

  const loadDeadStock = async () => {
    try {
      setLoading(true);
      setError('');
      const result = await reportsAPI.getDeadStock(days);
      setData(result);
    } catch (error: any) {
      console.error('Error loading dead stock:', error);
      setError(error.message || 'Failed to load dead stock report');
      showToast.error('Failed to load dead stock report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/reports">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dead Stock Report</h1>
          <p className="text-gray-600 mt-1">Products not sold in specified days</p>
        </div>
      </div>

      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle>Configure Report</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Label htmlFor="days">Days Since Last Sale</Label>
              <Input
                id="days"
                type="number"
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
                min="1"
                max="365"
              />
              <p className="text-xs text-gray-500 mt-1">
                Products not sold in the last {days} days will be shown
              </p>
            </div>
            <Button onClick={loadDeadStock} disabled={loading}>
              <Calendar className="mr-2 h-4 w-4" />
              Generate Report
            </Button>
          </div>
        </CardContent>
      </Card>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      )}

      {error && (
        <Card className="border-0 shadow-md">
          <CardContent className="pt-6">
            <div className="text-center text-red-600">{error}</div>
          </CardContent>
        </Card>
      )}

      {data && !loading && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-0 shadow-md">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Dead Stock Items</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{data.count || 0}</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Stock Value</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {formatCurrency(data.totalDeadStockValue || 0)}
                    </p>
                  </div>
                  <DollarSign className="h-8 w-8 text-red-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Quantity</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {data.totalDeadStockQuantity || 0}
                    </p>
                  </div>
                  <Package className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Dead Stock Table */}
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle>Dead Stock Products</CardTitle>
              <CardDescription>
                Products not sold in the last {days} days (as of {data.cutoffDate ? formatDate(data.cutoffDate) : 'N/A'})
              </CardDescription>
            </CardHeader>
            <CardContent>
              {data.deadStock && data.deadStock.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-4 font-semibold text-gray-700">Product Name</th>
                        <th className="text-left p-4 font-semibold text-gray-700">SKU</th>
                        <th className="text-left p-4 font-semibold text-gray-700">Category</th>
                        <th className="text-right p-4 font-semibold text-gray-700">Stock Qty</th>
                        <th className="text-right p-4 font-semibold text-gray-700">Stock Value</th>
                        <th className="text-left p-4 font-semibold text-gray-700">Last Sale</th>
                        <th className="text-left p-4 font-semibold text-gray-700">Days Since Sale</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.deadStock.map((product: any) => (
                        <tr key={product._id} className="border-b hover:bg-gray-50">
                          <td className="p-4">
                            <p className="font-medium text-gray-900">{product.name}</p>
                          </td>
                          <td className="p-4">
                            <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                              {product.sku}
                            </span>
                          </td>
                          <td className="p-4 text-gray-700">
                            {product.category?.name || 'N/A'}
                          </td>
                          <td className="p-4 text-right font-semibold text-gray-900">
                            {product.stockQuantity}
                          </td>
                          <td className="p-4 text-right font-semibold text-red-600">
                            {formatCurrency(product.stockValue)}
                          </td>
                          <td className="p-4 text-gray-700">
                            {product.neverSold ? (
                              <span className="text-red-600 font-semibold">Never Sold</span>
                            ) : product.lastSaleDate ? (
                              formatDate(product.lastSaleDate)
                            ) : (
                              'N/A'
                            )}
                          </td>
                          <td className="p-4">
                            {product.neverSold ? (
                              <span className="text-red-600 font-semibold">—</span>
                            ) : (
                              <span className="text-orange-600 font-semibold">
                                {product.daysSinceLastSale} days
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Package className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-4 text-gray-600">No dead stock found</p>
                  <p className="text-sm text-gray-500 mt-2">
                    All products have been sold in the last {days} days
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}


