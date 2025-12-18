'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import api from '@/lib/api';
import { toast } from 'sonner';
import LoadingSpinner from '@/components/LoadingSpinner/LoadingSpinner';

export default function OrderDetail() {
  const { id } = useParams();
  const router = useRouter();
  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const response = await api.get(`/orders/${id}`);
        console.log("Fetched Order Data:", response.data); // Debug log
        setOrder(response.data);
        setNewStatus(response.data.status);
      } catch (error) {
        toast.error(error.response?.status === 401 ? 'Please log in to access this page' : 'Failed to fetch order details');
        router.push('/admin/orders');
      } finally {
        setIsLoading(false);
      }
    };
    fetchOrder();
  }, [id, router]);

  const handleStatusChange = async () => {
    setIsActionLoading(true);
    try {
      const payload = { status: newStatus };
      if (newStatus === 'Rejected') {
        if (!rejectionReason.trim()) {
          toast.error('Rejection reason is required.');
          setIsActionLoading(false);
          return;
        }
        payload.rejectionReason = rejectionReason;
      }
      await api.put(`/orders/${id}/status`, payload);
      const updatedOrder = { ...order, status: newStatus, rejectionReason: newStatus === 'Rejected' ? rejectionReason : null };
      setOrder(updatedOrder);
      toast.success('Order status updated successfully.');
      setIsConfirmDialogOpen(false);
      setIsStatusDialogOpen(false);
    } catch (error) {
      toast.error('Failed to update order status.');
    } finally {
      setIsActionLoading(false);
    }
  };

  const suggestRejectionReason = () => {
    if (order.cnic.length !== 13) return 'Invalid CNIC format.';
    if (!order.address || order.address.trim() === '') return 'Incomplete shipping address.';
    if (!order.phone || order.phone.length < 10) return 'Invalid phone number.';
    return '';
  };

  useEffect(() => {
    if (newStatus === 'Rejected') {
      setRejectionReason(suggestRejectionReason());
    } else {
      setRejectionReason('');
    }
  }, [newStatus, order]);

  const openConfirmDialog = () => {
    setIsStatusDialogOpen(false);
    setIsConfirmDialogOpen(true);
  };

  // Format referralDetails for display
  const formatReferralDetails = (details) => {
    if (!details) return 'N/A';
    try {
      const parsed = JSON.parse(details);
      if (parsed.referrer) {
        return parsed.referrer || 'None';
      }
      return Object.entries(parsed)
        .map(([key, value]) => `${key}: ${value}`)
        .join(', ');
    } catch {
      return details; // Fallback to raw string if JSON parsing fails
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!order) {
    return <p className="text-center text-lg text-gray-600">Order not found.</p>;
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl sm:text-2xl font-bold">Order Details - Order No. {order.id}</h2>
        <Button onClick={() => router.back()} className="w-full sm:w-auto">Back to Orders</Button>
      </div>

      {/* Top Status Section */}
      <div className="bg-gray-100 p-4 sm:p-6 rounded-md flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <Label className="text-sm sm:text-base">Current Status</Label>
          <p className="text-base sm:text-lg font-semibold">{order.status}</p>
          {order.status === 'Rejected' && order.rejectionReason && (
            <p className="text-sm text-red-600">Rejection Reason: {order.rejectionReason}</p>
          )}
        </div>
        <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
          <DialogTrigger asChild>
            <Button disabled={isActionLoading} className="w-full sm:w-auto">Change Status</Button>
          </DialogTrigger>
          <DialogContent className="w-[90vw] max-w-md sm:max-w-lg p-4 sm:p-6">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl">Update Order Status</DialogTitle>
              <DialogDescription className="text-sm sm:text-base">
                Select the new status for this order.
              </DialogDescription>
            </DialogHeader>
            <Select value={newStatus} onValueChange={setNewStatus} disabled={isActionLoading}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Confirmed">Confirmed</SelectItem>
                <SelectItem value="Shipped">Shipped</SelectItem>
                <SelectItem value="Delivered">Delivered</SelectItem>
                <SelectItem value="Cancelled">Cancelled</SelectItem>
                <SelectItem value="Rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            {newStatus === 'Rejected' && (
              <div className="mt-4">
                <Label className="text-sm sm:text-base">Rejection Reason</Label>
                <Textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Enter rejection reason (suggested based on data)"
                  className="w-full"
                  disabled={isActionLoading}
                />
              </div>
            )}
            <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-4">
              <Button
                variant="outline"
                onClick={() => setIsStatusDialogOpen(false)}
                disabled={isActionLoading}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button onClick={openConfirmDialog} disabled={isActionLoading} className="w-full sm:w-auto">
                Update
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Confirmation Modal */}
        <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
          <DialogContent className="w-[90vw] max-w-md sm:max-w-lg p-4 sm:p-6">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl">Confirm Status Update</DialogTitle>
              <DialogDescription className="text-sm sm:text-base">
                Are you sure you want to update the status to {newStatus}?
                {newStatus === 'Rejected' && rejectionReason && ` Reason: ${rejectionReason}`}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                onClick={() => setIsConfirmDialogOpen(false)}
                disabled={isActionLoading}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                onClick={handleStatusChange}
                disabled={isActionLoading}
                className="w-full sm:w-auto"
              >
                {isActionLoading ? 'Confirming...' : 'Confirm'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Customer Information Table */}
      <div>
        <h3 className="text-lg sm:text-xl font-semibold mb-4">Customer Information</h3>
        <div className="overflow-x-auto min-w-full">
          <Table className="min-w-max">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px] sm:w-[150px]">Field</TableHead>
                <TableHead>Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell className="truncate max-w-[200px] sm:max-w-none">{order.fullName || "N/A"}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Email</TableCell>
                <TableCell className="truncate max-w-[200px] sm:max-w-none">{order.email || "N/A"}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>WhatsApp Number</TableCell>
                <TableCell>{order.phone || "N/A"}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Alternative Number</TableCell>
                <TableCell>{order.alternativePhone || "N/A"}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>CNIC</TableCell>
                <TableCell>{order.cnic || "N/A"}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Shipping Address Table */}
      <div>
        <h3 className="text-lg sm:text-xl font-semibold mb-4">Shipping Address</h3>
        <div className="overflow-x-auto min-w-full">
          <Table className="min-w-max">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px] sm:w-[150px]">Field</TableHead>
                <TableHead>Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>Address</TableCell>
                <TableCell className="truncate max-w-[200px] sm:max-w-none">{order.address || "N/A"}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>City</TableCell>
                <TableCell>{order.city || "N/A"}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Area</TableCell>
                <TableCell>{order.area || "N/A"}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Order Information Table */}
      <div>
        <h3 className="text-lg sm:text-xl font-semibold mb-4">Order Information</h3>
        <div className="overflow-x-auto min-w-full">
          <Table className="min-w-max">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px] sm:w-[150px]">Field</TableHead>
                <TableHead>Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>Tracking Number</TableCell>
                <TableCell>{order.tokenNumber || "N/A"}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Product Name</TableCell>
                <TableCell className="truncate max-w-[200px] sm:max-w-none">{order.productName || "N/A"}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Status</TableCell>
                <TableCell>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs sm:text-sm font-medium ${
                      order.status === 'Pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : order.status === 'Confirmed'
                        ? 'bg-blue-100 text-blue-800'
                        : order.status === 'Shipped'
                        ? 'bg-purple-100 text-purple-800'
                        : order.status === 'Delivered'
                        ? 'bg-green-100 text-green-800'
                        : order.status === 'Cancelled'
                        ? 'bg-red-100 text-red-800'
                        : order.status === 'Rejected'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {order.status || "N/A"}
                  </span>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Date & Time</TableCell>
                <TableCell>
                  {new Date(order.createdAt).toLocaleString('en-US', {
                    hour: 'numeric',
                    minute: 'numeric',
                    second: 'numeric',
                    hour12: true,
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                  }) || "N/A"}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Order Notes</TableCell>
                <TableCell className="truncate max-w-[200px] sm:max-w-none">{order.orderNotes || 'N/A'}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Referral Type</TableCell>
                <TableCell>{order.referralType || 'N/A'}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Referral Details</TableCell>
                <TableCell className="truncate max-w-[200px] sm:max-w-none">{formatReferralDetails(order.referralDetails)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Payment Information Table */}
      <div>
        <h3 className="text-lg sm:text-xl font-semibold mb-4">Payment Information</h3>
        <div className="overflow-x-auto min-w-full">
          <Table className="min-w-max">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px] sm:w-[150px]">Field</TableHead>
                <TableHead>Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>Payment Method</TableCell>
                <TableCell>{order.paymentMethod || "N/A"}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Advance Amount</TableCell>
                <TableCell>Rs. {Number(order.advanceAmount).toLocaleString() || "N/A"}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Monthly Amount</TableCell>
                <TableCell>Rs. {Number(order.monthlyAmount).toLocaleString() || "N/A"}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Months</TableCell>
                <TableCell>{order.months || "N/A"}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Total Deal Value</TableCell>
                <TableCell>Rs. {Number(order.totalDealValue).toLocaleString() || "N/A"}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}