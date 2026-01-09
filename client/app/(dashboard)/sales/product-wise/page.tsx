'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { salesAPI } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { ArrowLeft, Package } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function ProductWiseSalesPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProductSales();
  }, []);

  const loadProductSales = async () => {
    try {
      setLoading(true);
      const data = await salesAPI.getProductWise();
      setProducts(data.products || []);
    } catch (error: any) {
      console.error('Error loading product sales:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/sales">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Product-wise Sales</h1>
          <p className="text-gray-600 mt-1">Sales breakdown by product</p>
        </div>
      </div>

      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle>All Products Sales ({products.length})</CardTitle>
          <CardDescription>Revenue and quantity sold per product</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">Loading...</p>
            </div>
          ) : products.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No sales data available</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4 font-semibold">Product</th>
                    <th className="text-right p-4 font-semibold">Quantity Sold</th>
                    <th className="text-right p-4 font-semibold">Revenue</th>
                    <th className="text-right p-4 font-semibold">Bills</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product, index) => (
                    <tr key={product.productId} className="border-b hover:bg-gray-50">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <Package className="h-4 w-4 text-blue-600" />
                          </div>
                          <span className="font-medium text-gray-900">{product.productName}</span>
                        </div>
                      </td>
                      <td className="p-4 text-right font-semibold">{product.quantity}</td>
                      <td className="p-4 text-right font-semibold text-gray-900">
                        {formatCurrency(product.revenue)}
                      </td>
                      <td className="p-4 text-right text-gray-600">{product.billCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


