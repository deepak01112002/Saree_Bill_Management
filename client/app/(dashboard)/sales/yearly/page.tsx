'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { salesAPI } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { ArrowLeft, Calendar, TrendingUp, FileText, DollarSign } from 'lucide-react';
import Link from 'next/link';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { showToast } from '@/lib/toast';

export default function YearlySalesPage() {
  const currentDate = new Date();
  const [year, setYear] = useState(currentDate.getFullYear());
  const [sales, setSales] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadYearlySales();
  }, []);

  const loadYearlySales = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await salesAPI.getYearly(year);
      setSales(data);
    } catch (error: any) {
      console.error('Error loading yearly sales:', error);
      setError(error.message || 'Failed to load yearly sales');
      showToast.error('Failed to load yearly sales');
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
          <h1 className="text-3xl font-bold text-gray-900">Yearly Sales Report</h1>
          <p className="text-gray-600 mt-1">View sales summary for a specific year</p>
        </div>
      </div>

      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle>Select Year</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Label htmlFor="year">Year</Label>
              <Input
                id="year"
                type="number"
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                min="2020"
                max="2100"
              />
            </div>
            <Button onClick={loadYearlySales} disabled={loading}>
              <Calendar className="mr-2 h-4 w-4" />
              Load Sales
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

      {sales && !loading && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-0 shadow-md">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Revenue</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {formatCurrency(sales.totalRevenue)}
                    </p>
                  </div>
                  <DollarSign className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Bills</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{sales.billCount}</p>
                  </div>
                  <FileText className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Average Bill</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {formatCurrency(sales.averageBill)}
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Monthly Breakdown Chart */}
          {sales.monthlyBreakdown && sales.monthlyBreakdown.length > 0 && (
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle>Monthly Breakdown</CardTitle>
                <CardDescription>Revenue and bill count by month</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={sales.monthlyBreakdown}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="monthName"
                      tick={{ fontSize: 12 }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                    <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                    <Tooltip
                      formatter={(value: any, name?: string) => {
                        if (name === 'revenue') {
                          return [formatCurrency(value), 'Revenue'];
                        }
                        return [value, 'Bills'];
                      }}
                    />
                    <Legend />
                    <Bar yAxisId="left" dataKey="revenue" fill="#3b82f6" name="Revenue" />
                    <Bar yAxisId="right" dataKey="billCount" fill="#10b981" name="Bill Count" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Bills Table */}
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle>All Bills ({sales.billCount})</CardTitle>
              <CardDescription>Complete list of bills for {year}</CardDescription>
            </CardHeader>
            <CardContent>
              {sales.bills && sales.bills.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-4 font-semibold text-gray-700">Bill Number</th>
                        <th className="text-left p-4 font-semibold text-gray-700">Date</th>
                        <th className="text-left p-4 font-semibold text-gray-700">Customer</th>
                        <th className="text-right p-4 font-semibold text-gray-700">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sales.bills.map((bill: any) => (
                        <tr key={bill._id} className="border-b hover:bg-gray-50">
                          <td className="p-4">
                            <Link
                              href={`/billing/view/${bill._id}`}
                              className="text-blue-600 hover:underline font-medium"
                            >
                              {bill.billNumber}
                            </Link>
                          </td>
                          <td className="p-4 text-gray-700">{formatDate(bill.createdAt)}</td>
                          <td className="p-4 text-gray-700">
                            {bill.customerName || bill.customerMobile || 'Walk-in Customer'}
                          </td>
                          <td className="p-4 text-right font-semibold text-gray-900">
                            {formatCurrency(bill.grandTotal)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileText className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-4 text-gray-600">No bills found for {year}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}


