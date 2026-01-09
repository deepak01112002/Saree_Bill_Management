'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { salesAPI } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { ArrowLeft, TrendingUp, Calendar, Package, Award } from 'lucide-react';
import Link from 'next/link';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { showToast } from '@/lib/toast';

export default function HighestSalesPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadHighestSales();
  }, []);

  const loadHighestSales = async () => {
    try {
      setLoading(true);
      setError('');
      const result = await salesAPI.getHighest();
      setData(result);
    } catch (error: any) {
      console.error('Error loading highest sales:', error);
      setError(error.message || 'Failed to load highest sales reports');
      showToast.error('Failed to load highest sales reports');
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
          <h1 className="text-3xl font-bold text-gray-900">Highest Sales Reports</h1>
          <p className="text-gray-600 mt-1">View highest performing periods and products</p>
        </div>
      </div>

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
          {/* Top 3 Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Highest Sales Month */}
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  Highest Sales Month
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-2xl font-bold text-gray-900">{data.highestMonth?.month || 'N/A'}</p>
                  <p className="text-sm text-gray-600">
                    Revenue: <span className="font-semibold text-green-600">
                      {formatCurrency(data.highestMonth?.revenue || 0)}
                    </span>
                  </p>
                  <p className="text-sm text-gray-600">
                    Bills: <span className="font-semibold">{data.highestMonth?.billCount || 0}</span>
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Highest Sales Day */}
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  Highest Sales Day
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-2xl font-bold text-gray-900">
                    {data.highestDay?.date ? formatDate(data.highestDay.date) : 'N/A'}
                  </p>
                  <p className="text-sm text-gray-600">
                    Revenue: <span className="font-semibold text-green-600">
                      {formatCurrency(data.highestDay?.revenue || 0)}
                    </span>
                  </p>
                  <p className="text-sm text-gray-600">
                    Bills: <span className="font-semibold">{data.highestDay?.billCount || 0}</span>
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Top Product */}
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-purple-600" />
                  Top Selling Product
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-lg font-bold text-gray-900 truncate">
                    {data.topProduct?.name || 'N/A'}
                  </p>
                  <p className="text-sm text-gray-600">
                    Revenue: <span className="font-semibold text-green-600">
                      {formatCurrency(data.topProduct?.revenue || 0)}
                    </span>
                  </p>
                  <p className="text-sm text-gray-600">
                    Quantity: <span className="font-semibold">{data.topProduct?.quantity || 0}</span>
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Monthly Sales Chart */}
          {data.monthlySales && data.monthlySales.length > 0 && (
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle>Top Months by Revenue</CardTitle>
                <CardDescription>Highest performing months</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data.monthlySales.slice(0, 12)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 12 }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis />
                    <Tooltip
                      formatter={(value: any) => formatCurrency(value)}
                    />
                    <Legend />
                    <Bar dataKey="revenue" fill="#3b82f6" name="Revenue" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Top Days Chart */}
          {data.dailySales && data.dailySales.length > 0 && (
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle>Top Days by Revenue</CardTitle>
                <CardDescription>Highest performing days (Top 30)</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data.dailySales.slice(0, 30)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 10 }}
                      angle={-45}
                      textAnchor="end"
                      height={100}
                    />
                    <YAxis />
                    <Tooltip
                      formatter={(value: any) => formatCurrency(value)}
                    />
                    <Legend />
                    <Bar dataKey="revenue" fill="#10b981" name="Revenue" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}


