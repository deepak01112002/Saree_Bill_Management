'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { salesAPI } from '@/lib/api';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { ArrowLeft, Calendar, Users, TrendingUp, DollarSign, ShoppingCart } from 'lucide-react';
import Link from 'next/link';
import { showToast } from '@/lib/toast';

export default function StaffWiseSalesPage() {
  const currentDate = new Date();
  const [month, setMonth] = useState<number | ''>('');
  const [year, setYear] = useState<number | ''>(currentDate.getFullYear());
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'month' | 'range'>('all');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadStaffSales();
  }, []);

  const loadStaffSales = async () => {
    try {
      setLoading(true);
      const params: any = {};
      
      if (filterType === 'month' && month && year) {
        params.month = month.toString();
        params.year = year.toString();
      } else if (filterType === 'range' && startDate && endDate) {
        params.startDate = startDate;
        params.endDate = endDate;
      }

      const result = await salesAPI.getStaffWise(params);
      setData(result);
    } catch (error: any) {
      console.error('Error loading staff-wise sales:', error);
      showToast.error('Failed to load staff performance data');
    } finally {
      setLoading(false);
    }
  };

  const months = Array.from({ length: 12 }, (_, i) => new Date(0, i).toLocaleString('en-US', { month: 'long' }));

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
          <h1 className="text-3xl font-bold text-gray-900">Staff Performance</h1>
          <p className="text-gray-600 mt-1">Track sales performance by staff member</p>
        </div>
      </div>

      {/* Filter Card */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle>Filter Options</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-4">
              <Button
                variant={filterType === 'all' ? 'default' : 'outline'}
                onClick={() => setFilterType('all')}
              >
                All Time
              </Button>
              <Button
                variant={filterType === 'month' ? 'default' : 'outline'}
                onClick={() => setFilterType('month')}
              >
                By Month
              </Button>
              <Button
                variant={filterType === 'range' ? 'default' : 'outline'}
                onClick={() => setFilterType('range')}
              >
                Date Range
              </Button>
            </div>

            {filterType === 'month' && (
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="month">Month</Label>
                  <select
                    id="month"
                    value={month}
                    onChange={(e) => setMonth(e.target.value ? Number(e.target.value) : '')}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="">Select Month</option>
                    {months.map((m, i) => (
                      <option key={m} value={i + 1}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="year">Year</Label>
                  <Input
                    id="year"
                    type="number"
                    value={year}
                    onChange={(e) => setYear(e.target.value ? Number(e.target.value) : '')}
                    min="2000"
                    max="2099"
                  />
                </div>
              </div>
            )}

            {filterType === 'range' && (
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>
            )}

            <Button onClick={loadStaffSales} disabled={loading}>
              <Calendar className="mr-2 h-4 w-4" />
              {loading ? 'Loading...' : 'Load Performance Data'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      {data && data.summary && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="border-0 shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-5 w-5 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(data.summary.totalRevenue || 0)}
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Bills</CardTitle>
              <ShoppingCart className="h-5 w-5 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.summary.totalBills || 0}</div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Bill</CardTitle>
              <TrendingUp className="h-5 w-5 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(data.summary.overallAverage || 0)}
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Staff Count</CardTitle>
              <Users className="h-5 w-5 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.summary.staffCount || 0}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Staff Performance Table */}
      {data && data.staffPerformance && (
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle>Staff Performance Ranking</CardTitle>
            <CardDescription>
              {filterType === 'all' && 'All time performance'}
              {filterType === 'month' && month && year && `Performance for ${months[Number(month) - 1]} ${year}`}
              {filterType === 'range' && startDate && endDate && `Performance from ${startDate} to ${endDate}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {data.staffPerformance.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-4 font-semibold">Rank</th>
                      <th className="text-left p-4 font-semibold">Staff Name</th>
                      <th className="text-left p-4 font-semibold">Email</th>
                      <th className="text-right p-4 font-semibold">Total Revenue</th>
                      <th className="text-center p-4 font-semibold">Bills</th>
                      <th className="text-right p-4 font-semibold">Avg Bill</th>
                      <th className="text-right p-4 font-semibold">Performance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.staffPerformance.map((staff: any, index: number) => {
                      const performancePercent = data.summary.totalRevenue > 0
                        ? ((staff.totalRevenue / data.summary.totalRevenue) * 100).toFixed(1)
                        : '0';
                      
                      return (
                        <tr key={staff.staffId} className="border-b hover:bg-gray-50">
                          <td className="p-4">
                            <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold ${
                              index === 0 ? 'bg-yellow-100 text-yellow-800' :
                              index === 1 ? 'bg-gray-100 text-gray-800' :
                              index === 2 ? 'bg-orange-100 text-orange-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {index + 1}
                            </span>
                          </td>
                          <td className="p-4 font-medium text-gray-900">{staff.staffName}</td>
                          <td className="p-4 text-sm text-gray-600">{staff.staffEmail}</td>
                          <td className="p-4 text-right font-semibold text-gray-900">
                            {formatCurrency(staff.totalRevenue)}
                          </td>
                          <td className="p-4 text-center">
                            <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                              {staff.billCount}
                            </span>
                          </td>
                          <td className="p-4 text-right text-gray-700">
                            {formatCurrency(staff.averageBill)}
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <div className="w-24 bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-blue-600 h-2 rounded-full"
                                  style={{ width: `${Math.min(performancePercent, 100)}%` }}
                                ></div>
                              </div>
                              <span className="text-sm font-medium text-gray-700 w-12 text-right">
                                {performancePercent}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-center text-gray-500 py-8">No staff performance data available</p>
            )}
          </CardContent>
        </Card>
      )}

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading staff performance...</p>
          </div>
        </div>
      )}
    </div>
  );
}


