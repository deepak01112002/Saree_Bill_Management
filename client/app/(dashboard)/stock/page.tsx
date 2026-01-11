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
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Stock Management</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Monitor inventory levels and stock movements</p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-0 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Products</CardTitle>
            <Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{products.length}</div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Low Stock</CardTitle>
            <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{lowStockCount}</div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Out of Stock</CardTitle>
            <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">{outOfStockCount}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Low Stock Alert */}
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="text-orange-600 dark:text-orange-400">Low Stock Items</CardTitle>
            <CardDescription>Products with stock less than 10</CardDescription>
          </CardHeader>
          <CardContent>
            {lowStockProducts.length === 0 ? (
              <p className="text-center text-gray-500 dark:text-gray-400 py-8">No low stock items</p>
            ) : (
              <div className="space-y-2">
                {lowStockProducts.slice(0, 10).map((product) => (
                  <div
                    key={product._id}
                    className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{product.name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{product.sku}</p>
                    </div>
                    <span className="font-semibold text-orange-600 dark:text-orange-400">{product.stockQuantity}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Out of Stock */}
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="text-red-600 dark:text-red-400">Out of Stock</CardTitle>
            <CardDescription>Products with zero stock</CardDescription>
          </CardHeader>
          <CardContent>
            {outOfStockProducts.length === 0 ? (
              <p className="text-center text-gray-500 dark:text-gray-400 py-8">No out of stock items</p>
            ) : (
              <div className="space-y-2">
                {outOfStockProducts.slice(0, 10).map((product) => (
                  <div
                    key={product._id}
                    className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{product.name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{product.sku}</p>
                    </div>
                    <span className="font-semibold text-red-600 dark:text-red-400">0</span>
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
              <p className="mt-4 text-gray-600 dark:text-gray-400">Loading transactions...</p>
            </div>
          ) : transactions.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">No transactions found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b dark:border-gray-700">
                    <th className="text-left p-4 font-semibold text-gray-700 dark:text-gray-300">Type</th>
                    <th className="text-left p-4 font-semibold text-gray-700 dark:text-gray-300">Product</th>
                    <th className="text-right p-4 font-semibold text-gray-700 dark:text-gray-300">Quantity</th>
                    <th className="text-right p-4 font-semibold text-gray-700 dark:text-gray-300">Previous</th>
                    <th className="text-right p-4 font-semibold text-gray-700 dark:text-gray-300">New Stock</th>
                    <th className="text-left p-4 font-semibold text-gray-700 dark:text-gray-300">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => (
                    <tr key={tx._id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="p-4">
                        <span
                          className={`capitalize px-2 py-1 rounded text-sm ${
                            tx.type === 'in'
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                              : tx.type === 'out'
                              ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                              : tx.type === 'return'
                              ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                              : 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
                          }`}
                        >
                          {tx.type}
                        </span>
                      </td>
                      <td className="p-4 text-gray-700 dark:text-gray-300">{tx.productId}</td>
                      <td className="p-4 text-right text-gray-900 dark:text-white">{tx.quantity}</td>
                      <td className="p-4 text-right text-gray-600 dark:text-gray-400">{tx.previousStock}</td>
                      <td className="p-4 text-right font-semibold text-gray-900 dark:text-white">{tx.newStock}</td>
                      <td className="p-4 text-gray-600 dark:text-gray-400 text-sm">
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


