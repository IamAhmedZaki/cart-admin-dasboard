'use client';

import { useState, useEffect } from 'react';
import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, MoreHorizontal } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';
import LoadingSpinner from '@/components/LoadingSpinner/LoadingSpinner';

const schema = z.object({
  fullName: z.string().min(2, 'Full Name must be at least 2 characters').optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  cnic: z.string().optional(),
  isActive: z.boolean().optional(),
});

const editFields = [
  { name: 'fullName', label: 'Full Name', type: 'text', placeholder: 'Enter full name' },
  { name: 'email', label: 'Email (Optional)', type: 'email', placeholder: 'Enter email (optional)' },
  { name: 'phone', label: 'Phone', type: 'text', placeholder: 'Enter phone' },
  { name: 'cnic', label: 'CNIC', type: 'text', placeholder: 'Enter CNIC' },
  { name: 'isActive', label: 'Active', type: 'switch' },
];

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmId, setConfirmId] = useState(null);
  const [confirmTitle, setConfirmTitle] = useState('');
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    limit: 10,
  });
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    sort: 'id',
    order: 'desc',
  });

  const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm({
    resolver: zodResolver(schema),
    defaultValues: selectedCustomer
      ? { ...selectedCustomer }
      : { fullName: '', email: '', phone: '', cnic: '', isActive: true },
  });

  const isActive = watch('isActive');

  useEffect(() => {
    reset(selectedCustomer ? { ...selectedCustomer, email: selectedCustomer.email || '' } : { fullName: '', email: '', phone: '', cnic: '', isActive: true });
  }, [selectedCustomer, reset]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/all-customers', {
        params: {
          page: pagination.currentPage,
          limit: pagination.limit,
          search: filters.search,
          status: filters.status,
          sort: filters.sort,
          order: filters.order,
        },
      });
      const formattedCustomers = response.data.data.map((customer) => ({
        ...customer,
        fullName: `${customer.fullName || ''}`.trim() || 'N/A',
      }));
      setCustomers(formattedCustomers);
      setPagination(response.data.pagination);
    } catch (error) {
      toast.error(error.response?.status === 401 ? 'Please log in to access this page' : 'Failed to fetch customers');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [pagination.currentPage, pagination.limit, filters]);

  const handleEdit = (customer) => {
    setSelectedCustomer(customer);
    setIsModalOpen(true);
  };

  const openConfirm = (action, id, title) => {
    setConfirmAction(() => action);
    setConfirmId(id);
    setConfirmTitle(title);
    setIsConfirmOpen(true);
  };

  const handleConfirm = async () => {
    setIsActionLoading(true);
    try {
      await confirmAction(confirmId);
      fetchData();
    } catch (error) {
      toast.error('Action failed');
    } finally {
      setIsActionLoading(false);
      setIsConfirmOpen(false);
    }
  };

  const handleDelete = async (id) => {
    await api.delete(`/customers/${id}`);
    toast.success('Customer deleted successfully');
  };

  const handleToggleActive = async (id) => {
    await api.patch(`/customers/${id}/toggle`);
    toast.success('Customer status toggled successfully');
  };

  const handleSubmitForm = async (data) => {
    setIsActionLoading(true);
    try {
      // Only include fields that have changed or are provided
      const payload = {
        fullName: data.fullName || undefined,
        email: data.email || null, // Send null for empty email
        phone: data.phone || undefined,
        cnic: data.cnic || undefined,
        isActive: data.isActive ?? true,
      };
      await api.put(`/customers/${selectedCustomer.id}`, payload);
      fetchData();
      setIsModalOpen(false);
      toast.success('Customer updated successfully');
    } catch (error) {
      toast.error(error.response?.status === 401 ? 'Please log in to perform this action' : error.response?.data?.errors?.[0]?.msg || 'Failed to save customer');
    } finally {
      setIsActionLoading(false);
      reset();
    }
  };

  const handleClose = () => {
    setIsModalOpen(false);
    reset();
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
        <h2 className="text-xl sm:text-2xl font-bold">Customers</h2>
      </div>

      <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3 sm:gap-4">
        <Input
          placeholder="Search by ID, name, email, phone, CNIC"
          value={filters.search}
          onChange={(e) => handleFilterChange('search', e.target.value)}
          className="w-full sm:max-w-sm"
        />
        <Select
          value={filters.status}
          onValueChange={(value) => handleFilterChange('status', value)}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={filters.sort}
          onValueChange={(value) => handleFilterChange('sort', value)}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="id">ID</SelectItem>
            <SelectItem value="fullName">Name</SelectItem>
            <SelectItem value="isActive">Status</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={filters.order}
          onValueChange={(value) => handleFilterChange('order', value)}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Sort order" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="asc">Ascending</SelectItem>
            <SelectItem value="desc">Descending</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <>
          <div className="overflow-x-auto min-w-full">
            <Table className="min-w-max">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px] sm:w-[100px]">ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead className="w-[100px]">Email</TableHead>
                  <TableHead className="w-[100px]">Phone</TableHead>
                  <TableHead className="w-[100px]">CNIC</TableHead>
                  <TableHead className="w-[100px]">Verified</TableHead>
                  <TableHead className="w-[100px]">Status</TableHead>
                  <TableHead className="w-[80px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <div className="flex flex-col items-center justify-center">
                        <AlertCircle className="h-10 w-10 sm:h-12 sm:w-12 text-gray-500 mb-4" />
                        <p className="text-base sm:text-lg text-gray-600">Data Not Found</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  customers.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.id}</TableCell>
                      <TableCell className="truncate max-w-[150px] sm:max-w-none">{item.fullName}</TableCell>
                      <TableCell className="truncate max-w-[150px] sm:max-w-none">{item.email || 'N/A'}</TableCell>
                      <TableCell className="truncate max-w-[150px] sm:max-w-none">{item.phone || 'N/A'}</TableCell>
                      <TableCell className="truncate max-w-[150px] sm:max-w-none">{item.cnic || 'N/A'}</TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            item.isVerified ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {item.isVerified ? 'Yes' : 'No'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            item.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {item.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0" disabled={isActionLoading}>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(item)} disabled={isActionLoading}>
                              Edit
                            </DropdownMenuItem>
                            {/* <DropdownMenuItem onClick={() => openConfirm(handleDelete, item.id, 'Delete Customer')} disabled={isActionLoading}>
                              Delete
                            </DropdownMenuItem> */}
                            <DropdownMenuItem
                              onClick={() => openConfirm(handleToggleActive, item.id, item.isActive ? 'Deactivate Customer' : 'Activate Customer')}
                              disabled={isActionLoading}
                            >
                              {item.isActive ? 'Deactivate' : 'Activate'}
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
          {!isLoading && customers.length > 0 && (
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-4">
              <div className="flex items-center space-x-2 text-sm">
                <p>
                  Showing {(pagination.currentPage - 1) * pagination.limit + 1} -{' '}
                  {Math.min(pagination.currentPage * pagination.limit, pagination.totalItems)} of{' '}
                  {pagination.totalItems} customers
                </p>
                <Select
                  value={pagination.limit.toString()}
                  onValueChange={handleLimitChange}
                  disabled={isLoading || isActionLoading}
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
                  disabled={pagination.currentPage === 1 || isLoading || isActionLoading}
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                >
                  Previous
                </Button>
                <span className="text-sm">Page {pagination.currentPage} of {pagination.totalPages}</span>
                <Button
                  variant="outline"
                  disabled={pagination.currentPage === pagination.totalPages || isLoading || isActionLoading}
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      <Dialog open={isModalOpen} onOpenChange={handleClose}>
        <DialogContent className="w-[90vw] max-w-md sm:max-w-lg p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>Edit Customer</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(handleSubmitForm)} className="space-y-4">
            {editFields.map((field) => (
              <div key={field.name} className="space-y-2">
                <Label htmlFor={field.name}>{field.label}</Label>
                {field.type === 'switch' ? (
                  <div className="mt-1">
                    <Switch
                      id={field.name}
                      checked={isActive}
                      onCheckedChange={(checked) => setValue(field.name, checked)}
                      disabled={isActionLoading}
                    />
                  </div>
                ) : (
                  <Input
                    id={field.name}
                    type={field.type}
                    placeholder={field.placeholder}
                    {...register(field.name)}
                    className="mt-1"
                    disabled={isActionLoading}
                  />
                )}
                {errors[field.name] && (
                  <p className="text-red-500 text-sm mt-1">{errors[field.name].message}</p>
                )}
              </div>
            ))}
            <DialogFooter className="flex flex-col sm:flex-row gap-2">
              <Button type="button" variant="outline" onClick={handleClose} disabled={isActionLoading}>
                Cancel
              </Button>
              <Button type="submit" disabled={isActionLoading}>
                {isActionLoading ? 'Saving...' : 'Save'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent className="w-[90vw] max-w-md p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>{confirmTitle}</DialogTitle>
            <DialogDescription>
              Are you sure you want to proceed with this action? {confirmTitle === 'Delete Customer' ? 'This cannot be undone.' : ''}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setIsConfirmOpen(false)} disabled={isActionLoading}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirm} disabled={isActionLoading}>
              {isActionLoading ? 'Confirming...' : 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}