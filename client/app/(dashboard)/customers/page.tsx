'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { customersAPI } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { Plus, Search, Edit, Trash2, Users } from 'lucide-react';
import Link from 'next/link';
import { showToast, showConfirm } from '@/lib/toast';

interface Customer {
  _id: string;
  name: string;
  mobileNumber: string;
  address?: string;
  email?: string;
  panCard?: string;
  gstNumber?: string;
  firmName?: string;
  totalPurchases?: number; // Total amount spent
  purchaseCount?: number; // Number of orders
  lastPurchaseDate?: Date;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    loadCustomers();
  }, [page, search]);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const result = await customersAPI.getAll({
        search: search || undefined,
        page,
        limit: 20,
      });
      setCustomers(result.customers || []);
      setTotal(result.total || 0);
    } catch (error: any) {
      console.error('Error loading customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    const confirmed = await showConfirm(`Are you sure you want to delete "${name}"?`);
    if (!confirmed) {
      return;
    }

    try {
      await customersAPI.delete(id);
      showToast.success('Customer deleted successfully');
      loadCustomers();
    } catch (error: any) {
      showToast.error('Failed to delete customer: ' + (error.message || 'Unknown error'));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Customers</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage your customer database</p>
        </div>
        <Link href="/customers/add">
          <Button className="bg-gradient-to-r from-blue-600 to-purple-600">
            <Plus className="mr-2 h-4 w-4" />
            Add Customer
          </Button>
        </Link>
      </div>

      {/* Search */}
      <Card className="border-0 shadow-md">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
            <Input
              type="text"
              placeholder="Search customers by name, mobile, email, GST, or firm name..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-10 h-11"
            />
          </div>
        </CardContent>
      </Card>

      {/* Customers Table */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle>All Customers ({total})</CardTitle>
          <CardDescription>List of all registered customers</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">Loading customers...</p>
            </div>
          ) : customers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
              <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">No customers found</h3>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                {search ? 'Try a different search term' : 'Get started by adding your first customer'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b dark:border-gray-700">
                    <th className="text-left p-4 font-semibold text-gray-700 dark:text-gray-300">Name</th>
                    <th className="text-left p-4 font-semibold text-gray-700 dark:text-gray-300">Mobile</th>
                    <th className="text-left p-4 font-semibold text-gray-700 dark:text-gray-300">Email</th>
                    <th className="text-left p-4 font-semibold text-gray-700 dark:text-gray-300">Firm Name</th>
                    <th className="text-left p-4 font-semibold text-gray-700 dark:text-gray-300">GST Number</th>
                    <th className="text-right p-4 font-semibold text-gray-700 dark:text-gray-300">Total Spent</th>
                    <th className="text-center p-4 font-semibold text-gray-700 dark:text-gray-300">Orders</th>
                    <th className="text-center p-4 font-semibold text-gray-700 dark:text-gray-300">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((customer) => (
                    <tr key={customer._id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="p-4 font-medium text-gray-900 dark:text-white">{customer.name}</td>
                      <td className="p-4 text-gray-700 dark:text-gray-300">{customer.mobileNumber}</td>
                      <td className="p-4 text-gray-600 dark:text-gray-400 text-sm">
                        {customer.email || <span className="text-gray-400 dark:text-gray-500">-</span>}
                      </td>
                      <td className="p-4 text-gray-600 dark:text-gray-400 text-sm">
                        {customer.firmName || <span className="text-gray-400 dark:text-gray-500">-</span>}
                      </td>
                      <td className="p-4 text-gray-600 dark:text-gray-400 text-sm font-mono">
                        {customer.gstNumber || <span className="text-gray-400 dark:text-gray-500">-</span>}
                      </td>
                      <td className="p-4 text-right font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(customer.totalPurchases || 0)}
                      </td>
                      <td className="p-4 text-center">
                        <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-3 py-1 rounded-full text-sm font-semibold">
                          {customer.purchaseCount || 0}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-2">
                          <Link href={`/customers/edit/${customer._id}`}>
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(customer._id, customer.name)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
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

