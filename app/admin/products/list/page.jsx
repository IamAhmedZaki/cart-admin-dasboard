"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHeader, TableHead, TableRow } from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AlertCircle, MoreHorizontal, Copy } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import LoadingSpinner from "@/components/LoadingSpinner/LoadingSpinner";
import ImageFormModal from "@/components/FormModal/ImageFormModal";
import InstallmentFormModal from "@/components/FormModal/InstallmentFormModal";
import SearchableSelect from "@/components/SearchableSelect";

const columns = [
  { key: "checkbox", label: "" },
  { key: "id", label: "ID" },
  { key: "name", label: "Name" },
  { key: "brand", label: "Brand" },
  { key: "regularPrice", label: "Regular Price" },
  { key: "salePrice", label: "Sale Price" },
  {
    key: "stock",
    label: "Stock",
    render: (row, { onToggleStock }) => (
      <div className="flex items-center gap-2">
        <Switch
          checked={row.stock}
          onCheckedChange={(checked) =>
            onToggleStock(row.id, checked)
          }
        />
        <span className="text-xs">
          {row.stock ? "In Stock" : "Out of Stock"}
        </span>
      </div>
    ),
  },
  {
    key: "actions",
    label: "Actions",
    render: (row, { onView, onDelete }) => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onView(row.id)}>
            View
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => onDelete(row.id)}
            className="text-red-600"
          >
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
];


export default function Products() {
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [tags, setTags] = useState([]);
  const [isInstallmentModalOpen, setIsInstallmentModalOpen] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isBulkTagModalOpen, setIsBulkTagModalOpen] = useState(false);
  const [selectedBulkTags, setSelectedBulkTags] = useState([]);
  const [enableBulkTags, setEnableBulkTags] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [flag, setFlag] = useState(true);
  const [loading, setLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [singleDeleteId, setSingleDeleteId] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    limit: 10,
  });

  const [filters, setFilters] = useState({
    search: "",
    sort: "id",
    order: "desc",
  });


  /* --------------------------------------------------------------------- */
  /* --------------------------- FETCH DATA ------------------------------ */
  /* --------------------------------------------------------------------- */
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await api.get("/products", {
        params: {
          page: pagination.currentPage,
          limit: pagination.limit,
          search: filters.search,
          sort: filters.sort,
          order: filters.order,
        },
      });

      setProducts(res.data.data);
      setPagination(res.data.pagination);
    } catch (err) {
      toast.error("Failed to fetch products");
    } finally {
      setLoading(false);
    }
  };


  // const fetchTags = async () => {
  //   try {
  //     const response = await api.get("/tags?active=true");
  //     setTags(response.data);
  //   } catch (error) {
  //     toast.error("Failed to fetch tags");
  //   }
  // };

  useEffect(() => {
    fetchProducts();
    // fetchTags();
  }, [pagination.currentPage, pagination.limit, filters, flag]);

  /* --------------------------------------------------------------------- */
  /* -------------------------- BULK TAG LOGIC --------------------------- */
  /* --------------------------------------------------------------------- */
  // useEffect(() => {
  //   if (selectedIds.length > 0) {
  //     const selectedProds = products.filter((p) => selectedIds.includes(p.id));
  //     if (selectedProds.length > 0) {
  //       const firstTags = new Set(selectedProds[0].tags.map((t) => t.id));
  //       const allSame = selectedProds.every((p) => {
  //         const s = new Set(p.tags.map((t) => t.id));
  //         return s.size === firstTags.size && [...s].every((id) => firstTags.has(id));
  //       });
  //       setEnableBulkTags(allSame);
  //       if (allSame) {
  //         setSelectedBulkTags([...firstTags].map(String));
  //       }
  //     } else {
  //       setEnableBulkTags(false);
  //     }
  //   } else {
  //     setEnableBulkTags(false);
  //   }
  // }, [selectedIds, products]);

  /* --------------------------------------------------------------------- */
  /* -------------------------- MODAL HANDLERS --------------------------- */
  /* --------------------------------------------------------------------- */

  const handleBulkEditTags = () => {
    setIsBulkTagModalOpen(true);
  };

  const confirmBulkEditTags = async () => {
    setIsActionLoading(true);
    try {
      await api.post("/bulk-set-tags", {
        productIds: selectedIds,
        tagIds: selectedBulkTags.map(Number),
      });
      toast.success("Tags updated for selected products");
      setIsBulkTagModalOpen(false);
      setFlag(!flag);
    } catch (error) {
      toast.error(
        "Failed to update tags: " +
        (error.response?.data?.message || error.message)
      );
    } finally {
      setIsActionLoading(false);
    }
  };

  /* --------------------------------------------------------------------- */
  /* --------------------------- BASIC ACTIONS --------------------------- */
  /* --------------------------------------------------------------------- */
  const handleViewProduct = (id) => {
    router.push(`/admin/products/${id}`);
  };

  const handleDeleteProduct = async (id) => {
    try {
      await api.delete(`/products/${id}`);
      toast.success("Product deleted");
      fetchProducts();
    } catch {
      toast.error("Delete failed");
    }
  };


  const handleDuplicateProduct = (id) => {
    setSingleDeleteId(id);
    setPendingAction("duplicate");
    setShowConfirmDialog(true);
  };

  const onDuplicateProduct = (id) => {
    handleDuplicateProduct(id);
  };

  const handleToggleStock = async (id, stock) => {
    try {
      await api.patch(`/products/${id}`, { stock });
      toast.success("Stock updated");
      fetchProducts();
    } catch {
      toast.error("Failed to update stock");
    }
  };


  const handleToggleApproval = async (id, approvalStatus) => {
    setLoading(true);
    try {
      await api.patch(`/products/${id}/toggle`, { status: approvalStatus });
      fetchProducts();
      toast.success("Product status updated");
    } catch (error) {
      toast.error("Failed to update status");
    } finally {
      setLoading(false);
    }
  };

  /* --------------------------------------------------------------------- */
  /* -------------------------- PAGINATION / FILTER ---------------------- */
  /* --------------------------------------------------------------------- */
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination((prev) => ({ ...prev, currentPage: newPage }));
    }
  };

  const handleLimitChange = (value) => {
    setPagination((prev) => ({
      ...prev,
      limit: Number(value),
      currentPage: 1,
    }));
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };

  /* --------------------------------------------------------------------- */
  /* --------------------------- SELECTION ------------------------------- */
  /* --------------------------------------------------------------------- */
  const handleSelectAll = (checked) => {
    setSelectedIds(checked ? products.map((p) => p.id) : []);
  };

  const handleSelectRow = (id, checked) => {
    setSelectedIds((prev) =>
      checked ? [...prev, id] : prev.filter((i) => i !== id)
    );
  };

  const handleBulkAction = (action) => {
    if (selectedIds.length === 0) {
      toast.error("No products selected");
      return;
    }
    setPendingAction(action);
    setSingleDeleteId(null);
    setShowConfirmDialog(true);
  };

  /* --------------------------------------------------------------------- */
  /* --------------------------- CONFIRM DIALOG -------------------------- */
  /* --------------------------------------------------------------------- */
  const confirmBulkAction = async () => {
    if (!pendingAction) return;
    setIsActionLoading(true);
    try {
      if (pendingAction === "delete") {
        const idsToDelete = singleDeleteId ? [singleDeleteId] : selectedIds;
        await api.post("/bulk-delete-products", { ids: idsToDelete });
        toast.success(
          `Product${idsToDelete.length > 1 ? "s" : ""} deleted successfully`
        );
      } else if (pendingAction === "duplicate") {
        const idsToDuplicate = singleDeleteId ? [singleDeleteId] : selectedIds;
        await api.post("/bulk-duplicate-products", { ids: idsToDuplicate });
        toast.success(
          `${idsToDuplicate.length} product(s) duplicated successfully`
        );
        setSelectedIds([]);
        setSingleDeleteId(null);
        setFlag((prev) => !prev);
      } else {
        const updates = {};
        if (pendingAction === "activate") updates.status = true;
        if (pendingAction === "deactivate") updates.status = false;
        if (pendingAction === "instock") updates.stock = true;
        if (pendingAction === "outstock") updates.stock = false;
        await api.patch("/bulk-update-products", {
          ids: selectedIds,
          updates: {
            status:
              updates.status !== undefined ? Boolean(updates.status) : undefined,
            stock:
              updates.stock !== undefined ? Boolean(updates.stock) : undefined,
          },
        });
        toast.success(`Bulk ${pendingAction} completed`);
      }
      fetchProducts();
      setSelectedIds([]);
      setSingleDeleteId(null);
      setFlag((prev) => !prev);
    } catch (error) {
      toast.error(
        `Failed to perform ${pendingAction}: ${error.response?.data?.message || error.message
        }`
      );
    } finally {
      setIsActionLoading(false);
      setShowConfirmDialog(false);
      setPendingAction(null);
    }
  };

  const getActionButtonText = () => {
    if (!isActionLoading) return "Confirm";
    switch (pendingAction) {
      case "activate":
        return "Activating...";
      case "deactivate":
        return "Deactivating...";
      case "instock":
        return "Setting In Stock...";
      case "outstock":
        return "Setting Out of Stock...";
      case "delete":
        return "Deleting...";
      case "duplicate":
        return "Duplicating...";
      default:
        return "Confirm";
    }
  };

  const getConfirmDialogDescription = () => {
    if (pendingAction === "delete" && singleDeleteId) {
      return `Are you sure you want to delete this product? This action cannot be undone.`;
    }
    if (pendingAction === "duplicate" && singleDeleteId) {
      return `Are you sure you want to duplicate this product? A new copy will be created.`;
    }
    if (pendingAction === "duplicate") {
      return `Are you sure you want to duplicate ${selectedIds.length} selected product(s)? New copies will be created.`;
    }
    return `Are you sure you want to ${pendingAction} ${selectedIds.length} selected product(s)? This action cannot be undone.`;
  };

  /* --------------------------------------------------------------------- */
  /* -------------------------------- RENDER ------------------------------ */
  /* --------------------------------------------------------------------- */
  return (
    <div className="space-y-4 sm:space-y-6 p-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl sm:text-2xl font-bold">Products</h2>
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => router.push("/admin/products/bulk-import")}
            className="w-full sm:w-auto px-4 py-2 text-sm sm:text-base"
          >
            Bulk Import CSV
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 flex-wrap">
        <Input
          placeholder="Search by ID, name or brand"
          value={filters.search}
          onChange={(e) =>
            setFilters({ ...filters, search: e.target.value })
          }
        />

        <Select
          value={filters.status}
          onValueChange={(value) => handleFilterChange("status", value)}
        >
          <SelectTrigger className="w-full sm:w-[180px] text-xs sm:text-sm">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs sm:text-sm">
              All Status
            </SelectItem>
            <SelectItem value="active" className="text-xs sm:text-sm">
              Active
            </SelectItem>
            <SelectItem value="inactive" className="text-xs sm:text-sm">
              Inactive
            </SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={filters.sort}
          onValueChange={(value) => handleFilterChange("sort", value)}
        >
          <SelectTrigger className="w-full sm:w-[180px] text-xs sm:text-sm">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="id" className="text-xs sm:text-sm">
              ID
            </SelectItem>
            <SelectItem value="name" className="text-xs sm:text-sm">
              Name
            </SelectItem>
            <SelectItem value="isActive" className="text-xs sm:text-sm">
              Status
            </SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={filters.order}
          onValueChange={(value) => handleFilterChange("order", value)}
        >
          <SelectTrigger className="w-full sm:w-[180px] text-xs sm:text-sm">
            <SelectValue placeholder="Sort order" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="asc" className="text-xs sm:text-sm">
              Ascending
            </SelectItem>
            <SelectItem value="desc" className="text-xs sm:text-sm">
              Descending
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Bulk Action Buttons */}
      {selectedIds.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {/* <Button
            onClick={() => handleBulkAction("activate")}
            disabled={loading || isActionLoading}
            className="w-full sm:w-auto px-4 py-2 text-sm sm:text-base"
          >
            Bulk Activate
          </Button>
          <Button
            onClick={() => handleBulkAction("deactivate")}
            disabled={loading || isActionLoading}
            className="w-full sm:w-auto px-4 py-2 text-sm sm:text-base"
          >
            Bulk Deactivate
          </Button>
          <Button
            onClick={() => handleBulkAction("instock")}
            disabled={loading || isActionLoading}
            className="w-full sm:w-auto px-4 py-2 text-sm sm:text-base"
          >
            Bulk In Stock
          </Button>
          <Button
            onClick={() => handleBulkAction("outstock")}
            disabled={loading || isActionLoading}
            className="w-full sm:w-auto px-4 py-2 text-sm sm:text-base"
          >
            Bulk Out of Stock
          </Button>
          <Button
            onClick={() =>
              router.push(`/admin/products/bulk-edit?ids=${selectedIds.join(",")}`)
            }
            disabled={loading || isActionLoading}
            className="w-full sm:w-auto px-4 py-2 text-sm sm:text-base"
          >
            Bulk Edit
          </Button>
          <Button
            onClick={handleBulkEditTags}
            disabled={loading || isActionLoading || !enableBulkTags}
            className="w-full sm:w-auto px-4 py-2 text-sm sm:text-base"
          >
            Bulk Edit Tags
          </Button>
          <Button
            onClick={() => handleBulkAction("duplicate")}
            disabled={loading || isActionLoading}
            className="w-full sm:w-auto px-4 py-2 text-sm sm:text-base"
          >
            Bulk Duplicate ({selectedIds.length})
          </Button> */}
          <Button
            variant="destructive"
            onClick={() => handleBulkAction("delete")}
            disabled={loading || isActionLoading}
            className="w-full sm:w-auto px-4 py-2 text-sm sm:text-base"
          >
            Bulk Delete
          </Button>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-8">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <Table className="min-w-full">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px] px-2 sm:px-4">
                    <Checkbox
                      checked={
                        selectedIds.length === products.length && products.length > 0
                      }
                      onCheckedChange={handleSelectAll}
                      disabled={loading || isActionLoading}
                    />
                  </TableHead>
                  {columns.slice(1).map((col) => (
                    <TableHead
                      key={col.key}
                      className="px-2 sm:px-4 text-xs sm:text-sm whitespace-nowrap"
                    >
                      {col.label}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="text-center py-8">
                      <div className="flex flex-col items-center justify-center">
                        <AlertCircle className="h-10 w-10 sm:h-12 sm:w-12 text-gray-500 mb-4" />
                        <p className="text-sm sm:text-lg text-gray-600">Data Not Found</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  products.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.includes(row.id)}
                          onCheckedChange={(checked) =>
                            handleSelectRow(row.id, checked)
                          }
                        />
                      </TableCell>
                      <TableCell>{row.id}</TableCell>
                      <TableCell>{row.name.normalize("NFC")}</TableCell>
                      <TableCell>{row.brand}</TableCell>
                      <TableCell>$ {row.regularPrice}</TableCell>
                      <TableCell>$ {row.salePrice}</TableCell>
                      <TableCell>
                        {columns.find(c => c.key === "stock").render(row, {
                          onToggleStock: handleToggleStock,
                        })}
                      </TableCell>
                      <TableCell>
                        {columns.find(c => c.key === "actions").render(row, {
                          onView: (id) => router.push(`/admin/products/${id}`),
                          onDelete: handleDeleteProduct,
                        })}
                      </TableCell>
                    </TableRow>

                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {!loading && products.length > 0 && (
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-4">
              <div className="flex items-center space-x-2 text-sm">
                <p>
                  Showing {(pagination.currentPage - 1) * pagination.limit + 1} -{" "}
                  {Math.min(
                    pagination.currentPage * pagination.limit,
                    pagination.totalItems
                  )}{" "}
                  of {pagination.totalItems} Products
                </p>
                <Select
                  value={pagination.limit.toString()}
                  onValueChange={handleLimitChange}
                  disabled={loading || isActionLoading}
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
                  disabled={pagination.currentPage === 1 || loading || isActionLoading}
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                >
                  Previous
                </Button>
                <span className="text-sm">
                  Page {pagination.currentPage} of {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  disabled={
                    pagination.currentPage === pagination.totalPages ||
                    loading ||
                    isActionLoading
                  }
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Modals */}
      {isInstallmentModalOpen && (
        <InstallmentFormModal
          isOpen={isInstallmentModalOpen}
          onClose={() => setIsInstallmentModalOpen(false)}
          flag={() => setFlag(!flag)}
          title={"Edit Product Installment Plan"}
          defaultValues={selectedProduct}
        />
      )}
      {isImageModalOpen && (
        <ImageFormModal
          isOpen={isImageModalOpen}
          onClose={() => setIsImageModalOpen(false)}
          title={"Edit Product Image"}
          defaultValues={selectedProduct}
          flag={() => setFlag(!flag)}
        />
      )}
      {isBulkTagModalOpen && (
        <Dialog open={isBulkTagModalOpen} onOpenChange={setIsBulkTagModalOpen}>
          <DialogContent className="w-[90vw] max-w-md sm:max-w-lg p-4 sm:p-6">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl">Bulk Edit Tags</DialogTitle>
              <DialogDescription className="text-sm sm:text-base">
                Edit tags for the selected products (all have the same current tags).
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <SearchableSelect
                options={tags.map((t) => ({
                  value: String(t.id),
                  label: t.name,
                }))}
                value={selectedBulkTags}
                onChange={setSelectedBulkTags}
                placeholder="Select tags to set"
                multiple
                disabled={isActionLoading}
              />
            </div>
            <DialogFooter className="flex flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                onClick={() => setIsBulkTagModalOpen(false)}
                disabled={isActionLoading}
                className="w-full sm:w-auto px-4 py-2 text-sm sm:text-base"
              >
                Cancel
              </Button>
              <Button
                onClick={confirmBulkEditTags}
                disabled={isActionLoading}
                className="w-full sm:w-auto px-4 py-2 text-sm sm:text-base"
              >
                {isActionLoading ? "Updating..." : "Update Tags"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Confirm Dialog */}
      {showConfirmDialog && (
        <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <DialogContent className="w-[90vw] max-w-md sm:max-w-lg p-4 sm:p-6">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl">
                Confirm {singleDeleteId ? "Action" : "Bulk Action"}
              </DialogTitle>
              <DialogDescription className="text-sm sm:text-base">
                {getConfirmDialogDescription()}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                onClick={() => setShowConfirmDialog(false)}
                disabled={isActionLoading}
                className="w-full sm:w-auto px-4 py-2 text-sm sm:text-base"
              >
                Cancel
              </Button>
              <Button
                variant={pendingAction === "delete" ? "destructive" : "default"}
                onClick={confirmBulkAction}
                disabled={isActionLoading}
                className="w-full sm:w-auto px-4 py-2 text-sm sm:text-base"
              >
                {getActionButtonText()}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}