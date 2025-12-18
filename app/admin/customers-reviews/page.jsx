'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, MoreHorizontal, CheckCircle2, XCircle, Trash2, Star, ZoomIn, ZoomOut, RotateCcw, RotateCw, RefreshCw, Eye } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { useRouter } from 'next/navigation';
import LoadingSpinner from '@/components/LoadingSpinner/LoadingSpinner';

export default function AdminReviews() {
  const [reviews, setReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    limit: 10,
  });
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
  });
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [currentImage, setCurrentImage] = useState('');
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [posX, setPosX] = useState(0);
  const [posY, setPosY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [selectedReviewId, setSelectedReviewId] = useState(null);
  const [actionLoading, setActionLoading] = useState({
    approve: false,
    reject: false,
    delete: false,
  });
  const modalBodyRef = useRef(null);
  const imageRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    fetchReviews();
  }, [pagination.currentPage, pagination.limit, filters]);

  const fetchReviews = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/reviews/all', {
        params: {
          page: pagination.currentPage,
          limit: pagination.limit,
          search: filters.search,
          status: filters.status,
        },
      });
      setReviews(response.data.data);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error("Error fetching reviews:", error);
      toast.error("Failed to fetch reviews");
    } finally {
      setIsLoading(false);
    }
  };

  const openApproveModal = (reviewId) => {
    setSelectedReviewId(reviewId);
    setIsApproveModalOpen(true);
  };

  const openRejectModal = (reviewId) => {
    setSelectedReviewId(reviewId);
    setIsRejectModalOpen(true);
  };

  const confirmApprove = async () => {
    setActionLoading((prev) => ({ ...prev, approve: true }));
    try {
      if (selectedReviewId) {
        await api.put(`/reviews/${selectedReviewId}/APPROVED`);
        toast.success("Review approved successfully!");
        await fetchReviews();
      }
    } catch (error) {
      console.error("Error approving review:", error);
      toast.error("Failed to approve review");
    } finally {
      setActionLoading((prev) => ({ ...prev, approve: false }));
      setIsApproveModalOpen(false);
      setSelectedReviewId(null);
    }
  };

  const confirmReject = async () => {
    setActionLoading((prev) => ({ ...prev, reject: true }));
    try {
      if (selectedReviewId) {
        await api.put(`/reviews/${selectedReviewId}/REJECTED`);
        toast.success("Review rejected successfully!");
        await fetchReviews();
      }
    } catch (error) {
      console.error("Error rejecting review:", error);
      toast.error("Failed to reject review");
    } finally {
      setActionLoading((prev) => ({ ...prev, reject: false }));
      setIsRejectModalOpen(false);
      setSelectedReviewId(null);
    }
  };

  const renderStars = (rating) => {
    return Array(5).fill(0).map((_, i) => (
      <Star key={i} className={`h-4 w-4 ${i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
    ));
  };

  const openImageModal = (url) => {
    setCurrentImage(url);
    setZoom(1);
    setRotation(0);
    setPosX(0);
    setPosY(0);
    setIsImageModalOpen(true);
  };

  const handleViewOrder = (orderId) => {
    router.push(`/admin/orders/details/${orderId}`);
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

  const handleWheel = (e) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    const rect = modalBodyRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const newZoom = Math.max(0.1, Math.min(10, zoom * zoomFactor));
    const contentX = (mouseX - posX) / zoom;
    const contentY = (mouseY - posY) / zoom;
    const newPosX = mouseX - newZoom * contentX;
    const newPosY = mouseY - newZoom * contentY;
    setZoom(newZoom);
    setPosX(newPosX);
    setPosY(newPosY);
  };

  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - posX, y: e.clientY - posY });
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      setPosX(e.clientX - dragStart.x);
      setPosY(e.clientY - dragStart.y);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      e.preventDefault();
      setIsDragging(true);
      setDragStart({ x: e.touches[0].clientX - posX, y: e.touches[0].clientY - posY });
    }
  };

  const handleTouchMove = (e) => {
    if (isDragging && e.touches.length === 1) {
      e.preventDefault();
      setPosX(e.touches[0].clientX - dragStart.x);
      setPosY(e.touches[0].clientY - dragStart.y);
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isImageModalOpen) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isImageModalOpen, isDragging, dragStart]);

  const handleZoomIn = () => {
    const zoomFactor = 1.1;
    const rect = modalBodyRef.current.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const newZoom = Math.max(0.1, Math.min(10, zoom * zoomFactor));
    const contentX = (centerX - posX) / zoom;
    const contentY = (centerY - posY) / zoom;
    const newPosX = centerX - newZoom * contentX;
    const newPosY = centerY - newZoom * contentY;
    setZoom(newZoom);
    setPosX(newPosX);
    setPosY(newPosY);
  };

  const handleZoomOut = () => {
    const zoomFactor = 0.9;
    const rect = modalBodyRef.current.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const newZoom = Math.max(0.1, Math.min(10, zoom * zoomFactor));
    const contentX = (centerX - posX) / zoom;
    const contentY = (centerY - posY) / zoom;
    const newPosX = centerX - newZoom * contentX;
    const newPosY = centerY - newZoom * contentY;
    setZoom(newZoom);
    setPosX(newPosX);
    setPosY(newPosY);
  };

  return (
    <div className="space-y-4 sm:space-y-6 p-4">
        <div className="space-y-4 sm:space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Customers Reviews</h2>
          </div>

          <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3 sm:gap-4">
            <Input
              placeholder="Search by comment, customer or product name"
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
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="overflow-x-auto min-w-full">
            <Table className="min-w-max">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">ID</TableHead>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead className="w-[100px]">Rating</TableHead>
                  <TableHead>Comment</TableHead>
                  <TableHead>Media</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[80px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8">
                      <LoadingSpinner size="lg" />
                    </TableCell>
                  </TableRow>
                ) : reviews.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8">
                      <div className="flex flex-col items-center justify-center">
                        <AlertCircle className="h-10 w-10 sm:h-12 sm:w-12 text-gray-500 mb-4" />
                        <p className="text-base sm:text-lg text-gray-600">No reviews available</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  reviews.map((review) => (
                    <TableRow key={review.id}>
                      <TableCell>{review.id}</TableCell>
                      <TableCell>{review.orderId}</TableCell>
                      <TableCell className="truncate max-w-[150px]">{review.customer?.fullName}</TableCell>
                      <TableCell className="truncate max-w-[200px]">{review.product?.name}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">{renderStars(review.rating)}</div>
                      </TableCell>
                      <TableCell className="truncate max-w-[250px]">{review.comment}</TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap">
                          {review.mediaUrls?.map((url, i) => (
                            <img
                              key={i}
                              src={url}
                              alt="Review media"
                              className="h-10 w-10 object-cover rounded cursor-pointer"
                              onClick={() => openImageModal(url)}
                            />
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="truncate max-w-[150px]">{new Date(review.createdAt).toLocaleString()}</TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            review.status === 'PENDING'
                              ? 'bg-yellow-100 text-yellow-800'
                              : review.status === 'APPROVED'
                              ? 'bg-green-100 text-green-800'
                              : review.status === 'REJECTED'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {review.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewOrder(review.orderId)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Order
                            </DropdownMenuItem>
                            {review.status === 'PENDING' && (
                              <>
                                <DropdownMenuItem onClick={() => openApproveModal(review.id)}>
                                  <CheckCircle2 className="h-4 w-4 mr-2" />
                                  Approve
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => openRejectModal(review.id)}>
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Reject
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {!isLoading && reviews.length > 0 && (
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-4">
              <div className="flex items-center space-x-2 text-sm">
                <p>
                  Showing {(pagination.currentPage - 1) * pagination.limit + 1} -{' '}
                  {Math.min(pagination.currentPage * pagination.limit, pagination.totalItems)} of{' '}
                  {pagination.totalItems} reviews
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

      {/* Image Preview Dialog */}
      <Dialog open={isImageModalOpen} onOpenChange={setIsImageModalOpen}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Image Preview</DialogTitle>
            <DialogClose />
          </DialogHeader>
          <div
            ref={modalBodyRef}
            className="flex justify-center items-center overflow-hidden"
            style={{ maxHeight: '80vh', cursor: isDragging ? 'grabbing' : 'grab' }}
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <img
              ref={imageRef}
              src={currentImage}
              alt="preview"
              className="transition-transform duration-300 ease-in-out"
              style={{
                transform: `scale(${zoom}) rotate(${rotation}deg) translate(${posX}px, ${posY}px)`,
                maxWidth: 'none',
                maxHeight: 'none',
              }}
            />
          </div>
          <div className="flex justify-center gap-3 mt-4">
            <button
              className="p-2 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors"
              onClick={handleZoomIn}
              aria-label="Zoom In"
            >
              <ZoomIn className="h-6 w-6" />
            </button>
            <button
              className="p-2 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors"
              onClick={handleZoomOut}
              aria-label="Zoom Out"
            >
              <ZoomOut className="h-6 w-6" />
            </button>
            <button
              className="p-2 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors"
              onClick={() => setRotation((r) => r - 90)}
              aria-label="Rotate Left"
            >
              <RotateCcw className="h-6 w-6" />
            </button>
            <button
              className="p-2 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors"
              onClick={() => setRotation((r) => r + 90)}
              aria-label="Rotate Right"
            >
              <RotateCw className="h-6 w-6" />
            </button>
            <button
              className="p-2 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors"
              onClick={() => { setZoom(1); setRotation(0); setPosX(0); setPosY(0); }}
              aria-label="Reset"
            >
              <RefreshCw className="h-6 w-6" />
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Approve Confirmation Dialog */}
      <Dialog open={isApproveModalOpen} onOpenChange={setIsApproveModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Approval</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to approve this review?</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsApproveModalOpen(false)} disabled={actionLoading.approve}>
              Cancel
            </Button>
            <Button variant="default" onClick={confirmApprove} disabled={actionLoading.approve}>
              {actionLoading.approve ? 'Approving...' : 'Approve'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Confirmation Dialog */}
      <Dialog open={isRejectModalOpen} onOpenChange={setIsRejectModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Rejection</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to reject this review?</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRejectModalOpen(false)} disabled={actionLoading.reject}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmReject} disabled={actionLoading.reject}>
              {actionLoading.reject ? 'Rejecting...' : 'Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}