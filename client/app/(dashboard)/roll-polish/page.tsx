'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { rollPolishAPI } from '@/lib/api';
import { formatDateTime, formatDate } from '@/lib/utils';
import { Plus, Package, Edit, Trash2, Search, Filter, X } from 'lucide-react';
import Link from 'next/link';
import { showToast } from '@/lib/toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { getCurrentUser, isAdmin } from '@/lib/auth-utils';

const STATUS_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  sent: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Sent' },
  in_process: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'In Process' },
  completed: { bg: 'bg-green-100', text: 'text-green-700', label: 'Completed' },
  returned: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Returned' },
  cancelled: { bg: 'bg-red-100', text: 'text-red-700', label: 'Cancelled' },
};

export default function RollPolishPage() {
  const [rollPolishes, setRollPolishes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [rollToDelete, setRollToDelete] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    vendorName: '',
    startDate: '',
    endDate: '',
    search: '',
  });
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const currentUser = getCurrentUser();
    setUser(currentUser);
    loadRollPolishes();
  }, []);

  useEffect(() => {
    loadRollPolishes();
  }, [filters]);

  const loadRollPolishes = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (filters.status) params.status = filters.status;
      if (filters.vendorName) params.vendorName = filters.vendorName;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      if (filters.search) params.search = filters.search;

      const data = await rollPolishAPI.getAll(params);
      setRollPolishes(data || []);
    } catch (error: any) {
      console.error('Error loading roll polishes:', error);
      showToast.error('Failed to load roll polishes: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!rollToDelete) return;

    try {
      await rollPolishAPI.delete(rollToDelete);
      showToast.success('Roll polish entry deleted successfully');
      loadRollPolishes();
      setDeleteDialogOpen(false);
      setRollToDelete(null);
    } catch (error: any) {
      showToast.error('Failed to delete roll polish: ' + (error.message || 'Unknown error'));
    }
  };

  const clearFilters = () => {
    setFilters({
      status: '',
      vendorName: '',
      startDate: '',
      endDate: '',
      search: '',
    });
  };

  const hasActiveFilters = Object.values(filters).some((value) => value !== '');

  const getStatusBadge = (status: string) => {
    const statusInfo = STATUS_COLORS[status] || STATUS_COLORS.sent;
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded text-sm font-medium ${statusInfo.bg} ${statusInfo.text}`}>
        {statusInfo.label}
      </span>
    );
  };

  const isUserAdmin = isAdmin();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Roll Polish Management</h1>
          <p className="text-gray-600 mt-1">Track and manage rolls sent for polishing</p>
        </div>
        <Link href="/roll-polish/add">
          <Button className="bg-gradient-to-r from-blue-600 to-purple-600">
            <Plus className="mr-2 h-4 w-4" />
            Add Roll Polish
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
            <div className="flex items-center gap-2">
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="mr-2 h-4 w-4" />
                  Clear Filters
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                {showFilters ? 'Hide Filters' : 'Show Filters'}
              </Button>
            </div>
          </div>
        </CardHeader>
        {showFilters && (
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <Label>Search</Label>
                <Input
                  placeholder="Roll number, fabric, vendor..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                />
              </div>
              <div>
                <Label>Status</Label>
                <select
                  className="w-full h-10 px-3 border border-gray-300 rounded-md"
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                >
                  <option value="">All Status</option>
                  <option value="sent">Sent</option>
                  <option value="in_process">In Process</option>
                  <option value="completed">Completed</option>
                  <option value="returned">Returned</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div>
                <Label>Vendor Name</Label>
                <Input
                  placeholder="Filter by vendor..."
                  value={filters.vendorName}
                  onChange={(e) => setFilters({ ...filters, vendorName: e.target.value })}
                />
              </div>
              <div>
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                />
              </div>
              <div>
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                />
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle>All Roll Polish Entries ({rollPolishes.length})</CardTitle>
          <CardDescription>List of all rolls sent for polishing</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">Loading roll polishes...</p>
            </div>
          ) : rollPolishes.length === 0 ? (
            <div className="text-center py-12">
              <Package className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">No roll polish entries found</h3>
              <p className="mt-2 text-sm text-gray-500">Get started by creating a new roll polish entry</p>
              <Link href="/roll-polish/add">
                <Button className="mt-4">Add Roll Polish</Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4 font-semibold">Roll Number</th>
                    <th className="text-left p-4 font-semibold">Fabric Type</th>
                    <th className="text-left p-4 font-semibold">Quantity</th>
                    <th className="text-left p-4 font-semibold">Vendor</th>
                    <th className="text-center p-4 font-semibold">Status</th>
                    <th className="text-left p-4 font-semibold">Sent Date</th>
                    <th className="text-left p-4 font-semibold">Expected Return</th>
                    <th className="text-center p-4 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rollPolishes.map((roll) => (
                    <tr key={roll._id} className="border-b hover:bg-gray-50">
                      <td className="p-4 font-semibold text-gray-900">{roll.rollNumber}</td>
                      <td className="p-4 text-gray-700">
                        {roll.fabricType}
                        {roll.colorDesign && (
                          <span className="text-gray-500 text-sm ml-2">({roll.colorDesign})</span>
                        )}
                      </td>
                      <td className="p-4 text-gray-700">
                        {roll.quantity} {roll.unit}
                      </td>
                      <td className="p-4 text-gray-700">{roll.vendorName}</td>
                      <td className="p-4 text-center">{getStatusBadge(roll.status)}</td>
                      <td className="p-4 text-gray-600 text-sm">
                        {formatDate(roll.sentDate)}
                      </td>
                      <td className="p-4 text-gray-600 text-sm">
                        {roll.expectedReturnDate ? (
                          formatDate(roll.expectedReturnDate)
                        ) : (
                          <span className="text-gray-400">Not set</span>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-2">
                          <Link href={`/roll-polish/edit/${roll._id}`}>
                            <Button variant="ghost" size="sm" title="Edit">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>
                          {isUserAdmin && (
                            <Button
                              variant="ghost"
                              size="sm"
                              title="Delete"
                              onClick={() => {
                                setRollToDelete(roll._id);
                                setDeleteDialogOpen(true);
                              }}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Roll Polish Entry</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this roll polish entry? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setRollToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
