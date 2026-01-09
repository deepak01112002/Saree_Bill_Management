'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { stockAPI, productsAPI } from '@/lib/api';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { Package, TrendingDown, AlertTriangle } from 'lucide-react';

export default function StockPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [outOfStockCount, setOutOfStockCount] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [productsData, transactionsData] = await Promise.all([
        productsAPI.getAll({ limit: 1000 }),
        stockAPI.getTransactions(),
      ]);

      setProducts(productsData.products || []);
      setTransactions(transactionsData.slice(0, 50) || []);

      // Calculate low stock and out of stock
      const lowStock = (productsData.products || []).filter((p: any) => p.stockQuantity > 0 && p.stockQuantity < 10);
      const outOfStock = (productsData.products || []).filter((p: any) => p.stockQuantity === 0);
      setLowStockCount(lowStock.length);
      setOutOfStockCount(outOfStock.length);
    } catch (error: any) {
      console.error('Error loading stock data:', error);
    } finally {
      setLoading(false);
    }
  };

  const lowStockProducts = products.filter((p) => p.stockQuantity > 0 && p.stockQuantity < 10);
  const outOfStockProducts = products.filter((p) => p.stockQuantity === 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Stock Management</h1>
        <p className="text-gray-600 mt-1">Monitor inventory levels and stock movements</p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-0 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{products.length}</div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
            <AlertTriangle className="h-5 w-5 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{lowStockCount}</div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
            <TrendingDown className="h-5 w-5 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{outOfStockCount}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Low Stock Alert */}
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="text-orange-600">Low Stock Items</CardTitle>
            <CardDescription>Products with stock less than 10</CardDescription>
          </CardHeader>
          <CardContent>
            {lowStockProducts.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No low stock items</p>
            ) : (
              <div className="space-y-2">
                {lowStockProducts.slice(0, 10).map((product) => (
                  <div
                    key={product._id}
                    className="flex items-center justify-between p-3 bg-orange-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-gray-500">{product.sku}</p>
                    </div>
                    <span className="font-semibold text-orange-600">{product.stockQuantity}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Out of Stock */}
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="text-red-600">Out of Stock</CardTitle>
            <CardDescription>Products with zero stock</CardDescription>
          </CardHeader>
          <CardContent>
            {outOfStockProducts.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No out of stock items</p>
            ) : (
              <div className="space-y-2">
                {outOfStockProducts.slice(0, 10).map((product) => (
                  <div
                    key={product._id}
                    className="flex items-center justify-between p-3 bg-red-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-gray-500">{product.sku}</p>
                    </div>
                    <span className="font-semibold text-red-600">0</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle>Recent Stock Transactions</CardTitle>
          <CardDescription>Last 50 stock movements</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">Loading transactions...</p>
            </div>
          ) : transactions.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No transactions found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4 font-semibold">Type</th>
                    <th className="text-left p-4 font-semibold">Product</th>
                    <th className="text-right p-4 font-semibold">Quantity</th>
                    <th className="text-right p-4 font-semibold">Previous</th>
                    <th className="text-right p-4 font-semibold">New Stock</th>
                    <th className="text-left p-4 font-semibold">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => (
                    <tr key={tx._id} className="border-b hover:bg-gray-50">
                      <td className="p-4">
                        <span
                          className={`capitalize px-2 py-1 rounded text-sm ${
                            tx.type === 'in'
                              ? 'bg-green-100 text-green-700'
                              : tx.type === 'out'
                              ? 'bg-red-100 text-red-700'
                              : tx.type === 'return'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-orange-100 text-orange-700'
                          }`}
                        >
                          {tx.type}
                        </span>
                      </td>
                      <td className="p-4 text-gray-700">{tx.productId}</td>
                      <td className="p-4 text-right">{tx.quantity}</td>
                      <td className="p-4 text-right text-gray-600">{tx.previousStock}</td>
                      <td className="p-4 text-right font-semibold">{tx.newStock}</td>
                      <td className="p-4 text-gray-600 text-sm">
                        {formatDateTime(tx.createdAt)}
                      </td>
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


