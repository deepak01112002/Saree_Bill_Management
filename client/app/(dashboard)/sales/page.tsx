'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { salesAPI } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { TrendingUp, ShoppingCart, DollarSign, Package } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function SalesPage() {
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReport();
  }, []);

  const loadReport = async () => {
    try {
      setLoading(true);
      const data = await salesAPI.getReport();
      setReport(data);
    } catch (error: any) {
      console.error('Error loading sales report:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading sales report...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Sales Reports</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">View your sales analytics and insights</p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-0 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(report?.totalRevenue || 0)}
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bills</CardTitle>
            <ShoppingCart className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{report?.totalBills || 0}</div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Bill</CardTitle>
            <TrendingUp className="h-5 w-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(report?.averageBill || 0)}
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Products</CardTitle>
            <Package className="h-5 w-5 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{report?.topProducts?.length || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Top Products */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle>Top Selling Products</CardTitle>
          <CardDescription>Best performing products by revenue</CardDescription>
        </CardHeader>
        <CardContent>
          {report?.topProducts && report.topProducts.length > 0 ? (
            <div className="space-y-4">
              {report.topProducts.map((product: any, index: number) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{product.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Quantity: {product.quantity} • Revenue: {formatCurrency(product.revenue)}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold text-gray-900 dark:text-white">
                      #{index + 1}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">No sales data available</p>
          )}
        </CardContent>
      </Card>

      {/* Quick Links */}
      <div className="grid gap-4 md:grid-cols-2">
        <Link href="/sales/daily">
          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle>Daily Sales</CardTitle>
              <CardDescription>View sales by day</CardDescription>
            </CardHeader>
          </Card>
        </Link>
        <Link href="/sales/monthly">
          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle>Monthly Sales</CardTitle>
              <CardDescription>View monthly sales summary</CardDescription>
            </CardHeader>
          </Card>
        </Link>
        <Link href="/sales/product-wise">
          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle>Product-wise Sales</CardTitle>
              <CardDescription>Sales breakdown by product</CardDescription>
            </CardHeader>
          </Card>
        </Link>
        <Link href="/sales/staff-wise">
          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle>Staff Performance</CardTitle>
              <CardDescription>Sales performance by staff member</CardDescription>
            </CardHeader>
          </Card>
        </Link>
        <Link href="/sales/yearly">
          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle>Yearly Sales</CardTitle>
              <CardDescription>View yearly sales summary and trends</CardDescription>
            </CardHeader>
          </Card>
        </Link>
        <Link href="/sales/highest">
          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle>Highest Sales</CardTitle>
              <CardDescription>Top performing months, days, and products</CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>
    </div>
  );
}

