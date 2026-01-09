'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, ShoppingCart, TrendingUp, AlertTriangle } from 'lucide-react';
import { dashboardAPI } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { showToast } from '@/lib/toast';
import { getCurrentUser, isAdmin } from '@/lib/auth-utils';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface DashboardStats {
  totalProducts: number;
  todaySales: number;
  todayBillCount: number;
  monthlyRevenue: number;
  monthlyRevenueChange: string;
  lowStockCount: number;
  outOfStockCount: number;
  topProducts: Array<{
    name: string;
    sku: string;
    quantity: number;
    revenue: number;
  }>;
  salesChartData: Array<{
    date: string;
    revenue: number;
  }>;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [isUserAdmin, setIsUserAdmin] = useState<boolean>(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Set mounted flag to true after component mounts (client-side only)
    setMounted(true);
    const currentUser = getCurrentUser();
    setUser(currentUser);
    setIsUserAdmin(isAdmin());
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    try {
      setLoading(true);
      const data = await dashboardAPI.getStats();
      setStats(data);
    } catch (error: any) {
      console.error('Error loading dashboard stats:', error);
      showToast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };
  
  // Use useMemo to prevent hydration mismatch - only calculate after mount
  const statsCards = useMemo(() => {
    if (!stats || !mounted) return [];
    
    return [
      ...(isUserAdmin ? [{
        title: 'Total Products',
        value: stats.totalProducts.toLocaleString(),
        change: '',
        icon: Package,
        color: 'text-blue-600',
        bgColor: 'bg-blue-100',
      }] : []),
      {
        title: isUserAdmin ? "Today's Sales" : "My Today's Sales",
        value: formatCurrency(stats.todaySales),
        change: `${stats.todayBillCount} bills`,
        icon: ShoppingCart,
        color: 'text-green-600',
        bgColor: 'bg-green-100',
      },
      {
        title: isUserAdmin ? 'Monthly Revenue' : 'My Monthly Revenue',
        value: formatCurrency(stats.monthlyRevenue),
        change: `${stats.monthlyRevenueChange}%`,
        icon: TrendingUp,
        color: 'text-purple-600',
        bgColor: 'bg-purple-100',
      },
      ...(isUserAdmin ? [{
        title: 'Low Stock Items',
        value: stats.lowStockCount.toString(),
        change: `${stats.outOfStockCount} out of stock`,
        icon: AlertTriangle,
        color: 'text-orange-600',
        bgColor: 'bg-orange-100',
      }] : []),
    ];
  }, [stats, isUserAdmin, mounted]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">
          {!mounted ? (
            "Welcome back! Here's what's happening today."
          ) : isUserAdmin ? (
            "Welcome back! Here's what's happening today."
          ) : (
            `Welcome back, ${user?.name || 'Staff'}! Here's your performance today.`
          )}
        </p>
      </div>

      {/* Stats Grid */}
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="border-0 shadow-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-10 w-10 bg-gray-200 rounded animate-pulse"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 w-32 bg-gray-200 rounded animate-pulse mb-2"></div>
                <div className="h-3 w-20 bg-gray-200 rounded animate-pulse"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {statsCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.title} className="border-0 shadow-md hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    {stat.title}
                  </CardTitle>
                  <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                    <Icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                  <p className="text-xs text-gray-500 mt-1">
                    {stat.change && (
                      <span className={stat.change.startsWith('+') ? 'text-green-600' : stat.change.startsWith('-') ? 'text-red-600' : 'text-gray-600'}>
                        {stat.change}
                      </span>
                    )}
                    {stat.change && stat.title === 'Monthly Revenue' && ' from last month'}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Charts and Recent Activity */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle>{isUserAdmin ? 'Sales Overview' : 'My Sales Overview'}</CardTitle>
            <CardDescription>Last 7 days sales performance</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-[300px] flex items-center justify-center">
                <div className="text-gray-400">Loading chart data...</div>
              </div>
            ) : stats && stats.salesChartData && stats.salesChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart
                  data={stats.salesChartData}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="date"
                    stroke="#6b7280"
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis
                    stroke="#6b7280"
                    style={{ fontSize: '12px' }}
                    tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      padding: '8px 12px',
                    }}
                    formatter={(value: number | undefined) => value ? formatCurrency(value) : '₹0'}
                    labelStyle={{ color: '#374151', fontWeight: '600' }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    dot={{ fill: '#8b5cf6', r: 4 }}
                    activeDot={{ r: 6 }}
                    name="Revenue"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-400">
                No sales data available for the last 7 days
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle>{isUserAdmin ? 'Top Selling Products' : 'My Top Selling Products'}</CardTitle>
            <CardDescription>Best performing items (last 30 days)</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="h-4 w-32 bg-gray-200 rounded animate-pulse mb-2"></div>
                      <div className="h-3 w-24 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                    <div className="text-right">
                      <div className="h-4 w-20 bg-gray-200 rounded animate-pulse mb-2"></div>
                      <div className="h-3 w-16 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : stats && stats.topProducts.length > 0 ? (
              <div className="space-y-4">
                {stats.topProducts.map((product, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{product.name}</p>
                      <p className="text-sm text-gray-500">SKU: {product.sku}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">{formatCurrency(product.revenue)}</p>
                      <p className="text-sm text-gray-500">{product.quantity} sold</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-8">No sales data available</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

