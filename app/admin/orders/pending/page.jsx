'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, MoreHorizontal } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';
import LoadingSpinner from '@/components/LoadingSpinner/LoadingSpinner';
import { useRouter } from 'next/navigation';

export default function PendingOrders() {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    limit: 10,
  });
  const [filters, setFilters] = useState({
    search: '',
  });

  const router = useRouter();

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/pending-orders', {
        params: {
          page: pagination.currentPage,
          limit: pagination.limit,
          search: filters.search,
        },
      });
      setOrders(response.data.data);
      setPagination(response.data.pagination);
    } catch (error) {
      toast.error(error.response?.status === 401 ? 'Please log in to access this page' : 'Failed to fetch data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [pagination.currentPage, pagination.limit, filters]);

  const handleView = (id) => {
    router.push(`/admin/orders/details/${id}`);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination((prev) => ({ ...prev, currentPage: newPage }));
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };

  const handleLimitChange = (value) => {
    setPagination((prev) => ({ ...prev, limit: Number(value), currentPage: 1 }));
  };

  return (
    <div className="space-y-4 sm:space-y-6 p-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl sm:text-2xl font-bold">Pending Orders</h2>
      </div>

      <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3 sm:gap-4">
        <Input
          placeholder="Search by order no, name or product name"
          value={filters.search}
          onChange={(e) => handleFilterChange('search', e.target.value)}
          className="w-full sm:max-w-sm"
        />
      </div>

      <div className="overflow-x-auto min-w-full">
        <Table className="min-w-max">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px] sm:w-[100px]">Order No</TableHead>
              <TableHead className="max-w-[150px] sm:max-w-none">Customer Name</TableHead>
              <TableHead className="max-w-[200px]">Product Name</TableHead>
              <TableHead className="w-[100px]">Status</TableHead>
              <TableHead className="w-[100px]">Date & Time</TableHead>
              <TableHead className="w-[120px]">Advance Amount</TableHead>
              <TableHead className="w-[140px]">Installment * Months</TableHead>
              <TableHead className="w-[80px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <LoadingSpinner size="lg" />
                </TableCell>
              </TableRow>
            ) : orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <div className="flex flex-col items-center justify-center">
                    <AlertCircle className="h-10 w-10 sm:h-12 sm:w-12 text-gray-500 mb-4" />
                    <p className="text-base sm:text-lg text-gray-600">Data Not Found</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              orders.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.id}</TableCell>
                  <TableCell className="truncate max-w-[150px] sm:max-w-none">{`${item.fullName}`}</TableCell>
                  <TableCell className="truncate max-w-[200px]">{item.productName}</TableCell>
                  <TableCell>
                    <span
                      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800"
                    >
                      {item.status}
                    </span>
                  </TableCell>
                  <TableCell className="">
                    {new Date(item.createdAt).toLocaleString('en-US', {
                      hour: 'numeric',
                      minute: 'numeric',
                      second: 'numeric',
                      hour12: true,
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric'
                    }) || "N/A"}
                  </TableCell>
                  <TableCell className="">Rs. {Number(item.advanceAmount).toLocaleString()}</TableCell>
                  <TableCell className="">Rs. {Number(item.monthlyAmount).toLocaleString()} x {item.months}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleView(item.id)} className="text-xs sm:text-sm">
                          View Details
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {!isLoading && orders.length > 0 && (
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-4">
          <div className="flex items-center space-x-2 text-sm">
            <p>
              Showing {(pagination.currentPage - 1) * pagination.limit + 1} -{' '}
              {Math.min(pagination.currentPage * pagination.limit, pagination.totalItems)} of{' '}
              {pagination.totalItems} orders
            </p>
            <Select
              value={pagination.limit.toString()}
              onValueChange={handleLimitChange}
              disabled={isLoading}
            >
              <SelectTrigger className="w-[80px] sm:w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
            <p>per page</p>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              disabled={pagination.currentPage === 1 || isLoading}
              onClick={() => handlePageChange(pagination.currentPage - 1)}
            >
              Previous
            </Button>
            <span className="text-sm">Page {pagination.currentPage} of {pagination.totalPages}</span>
            <Button
              variant="outline"
              disabled={pagination.currentPage === pagination.totalPages || isLoading}
              onClick={() => handlePageChange(pagination.currentPage + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}