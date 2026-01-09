'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { BarChart3, Package, AlertTriangle } from 'lucide-react';

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
        <p className="text-gray-600 mt-1">View detailed reports and analytics</p>
      </div>

      {/* Reports Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Link href="/reports/dead-stock">
          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-orange-100 rounded-lg">
                  <AlertTriangle className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <CardTitle>Dead Stock Report</CardTitle>
                  <CardDescription>Products not sold in specified days</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Identify slow-moving inventory and products that haven't been sold recently.
                Configure the number of days to analyze stock movement.
              </p>
            </CardContent>
          </Card>
        </Link>

        {/* Add more report cards here as they are implemented */}
        <Card className="border-0 shadow-md opacity-50">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <BarChart3 className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <CardTitle>Inventory Report</CardTitle>
                <CardDescription>Coming Soon</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              Complete inventory analysis and stock valuation report.
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md opacity-50">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Package className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <CardTitle>Category Report</CardTitle>
                <CardDescription>Coming Soon</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              Category-wise inventory and sales analysis.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Links to Sales Reports */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle>Sales Reports</CardTitle>
          <CardDescription>View detailed sales analytics and insights</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Link href="/sales/daily">
              <div className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                <p className="font-semibold text-gray-900">Daily Sales</p>
                <p className="text-sm text-gray-600 mt-1">View sales by day</p>
              </div>
            </Link>
            <Link href="/sales/monthly">
              <div className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                <p className="font-semibold text-gray-900">Monthly Sales</p>
                <p className="text-sm text-gray-600 mt-1">View monthly sales summary</p>
              </div>
            </Link>
            <Link href="/sales/yearly">
              <div className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                <p className="font-semibold text-gray-900">Yearly Sales</p>
                <p className="text-sm text-gray-600 mt-1">View yearly sales trends</p>
              </div>
            </Link>
            <Link href="/sales/highest">
              <div className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                <p className="font-semibold text-gray-900">Highest Sales</p>
                <p className="text-sm text-gray-600 mt-1">Top performing periods</p>
              </div>
            </Link>
            <Link href="/sales/product-wise">
              <div className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                <p className="font-semibold text-gray-900">Product-wise Sales</p>
                <p className="text-sm text-gray-600 mt-1">Sales breakdown by product</p>
              </div>
            </Link>
            <Link href="/sales/staff-wise">
              <div className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                <p className="font-semibold text-gray-900">Staff Performance</p>
                <p className="text-sm text-gray-600 mt-1">Sales by staff member</p>
              </div>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


