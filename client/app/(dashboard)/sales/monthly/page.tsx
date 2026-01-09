'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { salesAPI } from '@/lib/api';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils';
import { ArrowLeft, Calendar } from 'lucide-react';
import Link from 'next/link';

export default function MonthlySalesPage() {
  const currentDate = new Date();
  const [month, setMonth] = useState(currentDate.getMonth() + 1);
  const [year, setYear] = useState(currentDate.getFullYear());
  const [sales, setSales] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadMonthlySales();
  }, []);

  const loadMonthlySales = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await salesAPI.getMonthly(month.toString(), year.toString());
      setSales(data);
    } catch (error: any) {
      console.error('Error loading monthly sales:', error);
      setError(error.message || 'Failed to load monthly sales');
    } finally {
      setLoading(false);
    }
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

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
          <h1 className="text-3xl font-bold text-gray-900">Monthly Sales</h1>
          <p className="text-gray-600 mt-1">View sales for a specific month</p>
        </div>
      </div>

      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle>Select Month & Year</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="month">Month</Label>
              <select
                id="month"
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {monthNames.map((name, index) => (
                  <option key={index + 1} value={index + 1}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
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
            <div className="flex items-end">
              <Button onClick={loadMonthlySales} disabled={loading}>
                <Calendar className="mr-2 h-4 w-4" />
                Load Sales
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Card className="border-0 shadow-md border-red-200">
          <CardContent className="pt-6">
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
              {error}
            </div>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <Card className="border-0 shadow-md">
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">Loading monthly sales...</p>
            </div>
          </CardContent>
        </Card>
      ) : sales && (
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle>
              Sales for {monthNames[month - 1]} {year}
            </CardTitle>
            <CardDescription>Monthly sales breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3 mb-6">
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(sales.totalRevenue || 0)}
                </p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-gray-600">Total Bills</p>
                <p className="text-2xl font-bold text-gray-900">{sales.billCount || 0}</p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <p className="text-sm text-gray-600">Average Bill</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(
                    sales.billCount > 0 ? sales.totalRevenue / sales.billCount : 0
                  )}
                </p>
              </div>
            </div>

            {sales.bills && sales.bills.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-4 font-semibold">Bill No</th>
                      <th className="text-left p-4 font-semibold">Customer</th>
                      <th className="text-right p-4 font-semibold">Amount</th>
                      <th className="text-left p-4 font-semibold">Payment</th>
                      <th className="text-left p-4 font-semibold">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sales.bills.map((bill: any) => (
                      <tr key={bill._id} className="border-b hover:bg-gray-50">
                        <td className="p-4">
                          <Link 
                            href={`/billing/view/${bill._id}`}
                            className="font-mono font-semibold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                          >
                            {bill.billNumber}
                          </Link>
                        </td>
                        <td className="p-4">
                          {bill.customerName || (
                            <span className="text-gray-400">Walk-in Customer</span>
                          )}
                        </td>
                        <td className="p-4 text-right font-semibold text-gray-900">
                          {formatCurrency(bill.grandTotal)}
                        </td>
                        <td className="p-4">
                          <span className="capitalize bg-gray-100 px-2 py-1 rounded text-sm">
                            {bill.paymentMode}
                          </span>
                        </td>
                        <td className="p-4 text-sm text-gray-600">
                          {formatDateTime(bill.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-center text-gray-500 py-8">No sales for this month</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

