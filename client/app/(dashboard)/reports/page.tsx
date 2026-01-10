'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { AlertTriangle, TrendingUp } from 'lucide-react';

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Reports</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">View detailed reports and analytics</p>
      </div>

      {/* Reports Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Link href="/reports/dead-stock" className="block">
          <Card className="border border-gray-200 dark:border-gray-700 shadow-md hover:shadow-lg transition-all cursor-pointer">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-orange-100 dark:bg-orange-900 rounded-lg">
                  <AlertTriangle className="h-6 w-6 text-orange-600 dark:text-orange-300" />
                </div>
                <div>
                  <CardTitle className="text-gray-900 dark:text-white">Dead Stock Report</CardTitle>
                  <CardDescription>Products not sold in specified days</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Identify slow-moving inventory and products that haven't been sold recently.
                Configure the number of days to analyze stock movement.
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Quick Links to Sales Reports */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle>Sales Reports</CardTitle>
          <CardDescription>View detailed sales analytics and insights</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Link href="/sales/daily" className="block h-full">
              <Card className="border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all cursor-pointer h-full">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                      <TrendingUp className="h-6 w-6 text-blue-600 dark:text-blue-300" />
                    </div>
                    <div>
                      <CardTitle className="text-gray-900 dark:text-white">Daily Sales</CardTitle>
                      <CardDescription>View sales by day</CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </Link>
            <Link href="/sales/monthly" className="block h-full">
              <Card className="border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all cursor-pointer h-full">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                      <TrendingUp className="h-6 w-6 text-blue-600 dark:text-blue-300" />
                    </div>
                    <div>
                      <CardTitle className="text-gray-900 dark:text-white">Monthly Sales</CardTitle>
                      <CardDescription>View monthly sales summary</CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </Link>
            <Link href="/sales/yearly" className="block h-full">
              <Card className="border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all cursor-pointer h-full">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                      <TrendingUp className="h-6 w-6 text-blue-600 dark:text-blue-300" />
                    </div>
                    <div>
                      <CardTitle className="text-gray-900 dark:text-white">Yearly Sales</CardTitle>
                      <CardDescription>View yearly sales trends</CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </Link>
            <Link href="/sales/highest" className="block h-full">
              <Card className="border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all cursor-pointer h-full">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                      <TrendingUp className="h-6 w-6 text-blue-600 dark:text-blue-300" />
                    </div>
                    <div>
                      <CardTitle className="text-gray-900 dark:text-white">Highest Sales</CardTitle>
                      <CardDescription>Top performing periods</CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </Link>
            <Link href="/sales/product-wise" className="block h-full">
              <Card className="border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all cursor-pointer h-full">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                      <TrendingUp className="h-6 w-6 text-blue-600 dark:text-blue-300" />
                    </div>
                    <div>
                      <CardTitle className="text-gray-900 dark:text-white">Product-wise Sales</CardTitle>
                      <CardDescription>Sales breakdown by product</CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </Link>
            <Link href="/sales/staff-wise" className="block h-full">
              <Card className="border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all cursor-pointer h-full">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                      <TrendingUp className="h-6 w-6 text-blue-600 dark:text-blue-300" />
                    </div>
                    <div>
                      <CardTitle className="text-gray-900 dark:text-white">Staff Performance</CardTitle>
                      <CardDescription>Sales by staff member</CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


