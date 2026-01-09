'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { salesAPI } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { ArrowLeft, Calendar } from 'lucide-react';
import Link from 'next/link';

export default function DailySalesPage() {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [sales, setSales] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadDailySales();
  }, []);

  const loadDailySales = async () => {
    try {
      setLoading(true);
      const data = await salesAPI.getDaily(date);
      setSales(data);
    } catch (error: any) {
      console.error('Error loading daily sales:', error);
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
          <h1 className="text-3xl font-bold text-gray-900">Daily Sales</h1>
          <p className="text-gray-600 mt-1">View sales for a specific date</p>
        </div>
      </div>

      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle>Select Date</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={loadDailySales} disabled={loading}>
                <Calendar className="mr-2 h-4 w-4" />
                Load Sales
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {sales && (
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle>Sales for {formatDate(sales.date)}</CardTitle>
            <CardDescription>Daily sales breakdown</CardDescription>
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
                      <th className="text-right p-4 font-semibold">Amount</th>
                      <th className="text-left p-4 font-semibold">Payment</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sales.bills.map((bill: any) => (
                      <tr key={bill._id} className="border-b">
                        <td className="p-4">
                          <Link 
                            href={`/billing/view/${bill._id}`}
                            className="font-mono font-semibold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                          >
                            {bill.billNumber}
                          </Link>
                        </td>
                        <td className="p-4 text-right font-semibold">
                          {formatCurrency(bill.grandTotal)}
                        </td>
                        <td className="p-4 capitalize">{bill.paymentMode}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-center text-gray-500 py-8">No sales for this date</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

