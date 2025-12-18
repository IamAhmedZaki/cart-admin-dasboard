"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import api from "@/lib/api";
import LoadingSpinner from "@/components/LoadingSpinner/LoadingSpinner";
import ImageFormModal from "@/components/FormModal/ImageFormModal";
import InstallmentFormModal from "@/components/FormModal/InstallmentFormModal";
import dynamic from "next/dynamic";
import { Edit2, SquareArrowOutUpRight } from "lucide-react";
import SearchableSelect from "@/components/SearchableSelect";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const QuillEditor = dynamic(() => import("@/components/QuillEditor"), { ssr: false });

export default function ProductDetails() {
  const router = useRouter();
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [editedProduct, setEditedProduct] = useState(null);
  const [categories, setCategories] = useState([]);
  const [subCategoriesMap, setSubCategoriesMap] = useState({});
  const [tags, setTags] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isInstallmentModalOpen, setIsInstallmentModalOpen] = useState(false);
  const [longDescValue, setLongDescValue] = useState("");
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const [productRes, catsRes, tagsRes] = await Promise.all([
          api.get(`/product/${id}`),
          api.get("/plain-categories"),
          api.get('/tags?active=true'),
        ]);
        const prod = productRes.data;
        setProduct(prod);
        setEditedProduct({
          ...prod,
          meta_title: prod.meta_title || prod.name?.substring(0, 60),
          meta_description: prod.meta_description || prod.short_description?.substring(0, 160),
          meta_keywords: prod.meta_keywords || (prod.tags?.length > 0 ? prod.tags.map(t => t.name).join(', ') : ''),
          slugName: prod.slugName.toLowerCase().replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-+|-+$/g, '') || prod.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''),
        });
        setSelectedTags(Array.isArray(prod.tags) ? prod.tags.map(t => String(t.id)) : []);
        setLongDescValue(prod.long_description || "");
        setCategories(catsRes.data);
        setTags(tagsRes.data);
        if (prod.category_id) {
          const subRes = await api.get(`/plain-subcategories/${prod.category_id}`);
          setSubCategoriesMap((prev) => ({ ...prev, [prod.category_id]: subRes.data }));
        }
      } catch (error) {
        toast.error("Failed to load product data");
        router.push("/admin/products/list");
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchProduct();
  }, [id, router]);

  const fetchSubCategories = async (catId) => {
    if (catId && !isNaN(catId) && !subCategoriesMap[catId]) {
      try {
        const subRes = await api.get(`/plain-subcategories/${catId}`);
        setSubCategoriesMap((prev) => ({ ...prev, [catId]: subRes.data }));
      } catch (error) {
        toast.error("Failed to load subcategories");
      }
    }
  };

  const handleFieldChange = (field, value) => {
    setEditedProduct((prev) => {
      const updated = { ...prev };
      if (field === "price") {
        const numValue = value === "" ? null : parseFloat(value);
        updated[field] = isNaN(numValue) ? null : numValue;
      } else if (field === "category_id") {
        fetchSubCategories(value);
        updated[field] = value;
        updated.subcategory_id = null;
      } else if (field === "status" || field === "stock") {
        updated[field] = value === "true" || value === true;
      } else {
        updated[field] = value;
      }
      return updated;
    });
    setHasChanges(true);
  };

  const handleTagChange = (newTags) => {
    setSelectedTags(newTags);
    const originalTagIds = product.tags.map(t => t.id).sort((a, b) => a - b);
    const newTagIds = newTags.map(Number).sort((a, b) => a - b);
    if (JSON.stringify(originalTagIds) !== JSON.stringify(newTagIds)) {
      setHasChanges(true);
    }
  };

  const handleImageEdit = () => {
    setIsImageModalOpen(true);
  };

  const handleInstallmentEdit = () => {
    setIsInstallmentModalOpen(true);
  };

  const saveImages = (updatedImages) => {
    setEditedProduct((prev) => ({ ...prev, ProductImage: updatedImages }));
    setHasChanges(true);
    setIsImageModalOpen(false);
  };

  const saveInstallments = (updatedInstallments) => {
    setEditedProduct((prev) => ({ ...prev, ProductInstallments: updatedInstallments }));
    setHasChanges(true);
    setIsInstallmentModalOpen(false);
  };

  const handleLongDescChange = (value) => {
    setLongDescValue(value);
    setEditedProduct((prev) => ({ ...prev, long_description: value }));
    setHasChanges(true);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const updates = {};
      Object.keys(editedProduct).forEach((key) => {
        if (
          key !== "ProductImage" &&
          key !== "ProductInstallments" &&
          key !== "brand" &&
          editedProduct[key] !== product[key]
        ) {
          if (key === "category_id" || key === "subcategory_id") {
            updates[key] = parseInt(editedProduct[key], 10) || null;
          } else if (key === "price") {
            updates[key] = editedProduct[key] === null || isNaN(editedProduct[key]) ? null : Number(editedProduct[key]);
          } else if (typeof editedProduct[key] === "string" && !isNaN(editedProduct[key]) && editedProduct[key] !== "") {
            updates[key] = Number(editedProduct[key]);
          } else {
            updates[key] = editedProduct[key];
          }
        }
      });

      if (updates.price !== undefined && (updates.price === null || updates.price <= 0)) {
        throw new Error("Price must be a positive number");
      }

      // Validate SEO fields
      if (updates.meta_title && updates.meta_title.length > 60) {
        throw new Error("Meta title must not exceed 60 characters");
      }
      if (updates.meta_description && updates.meta_description.length > 160) {
        throw new Error("Meta description must not exceed 160 characters");
      }

      if (Object.keys(updates).length > 0) {
        await api.put(`/product/${id}`, updates);
      }

      const newImages = editedProduct.ProductImage?.filter((img) => img.isNew) || [];
      if (newImages.length > 0) {
        const formData = new FormData();
        formData.append("product_id", id);
        newImages.forEach((img) => formData.append("images", img.file));
        await api.post("/create-product-images", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      const newInstallments = editedProduct.ProductInstallments?.filter((ins) => !ins.id) || [];
      const updatedInstallments = editedProduct.ProductInstallments?.filter(
        (ins) => ins.id && !isEqual(ins, product.ProductInstallments?.find((o) => o.id === ins.id))
      ) || [];
      if (newInstallments.length > 0 || updatedInstallments.length > 0) {
        const validInstallments = [...newInstallments, ...updatedInstallments]
          .filter((ins) => {
            return (
              !isNaN(ins.totalPrice) &&
              ins.totalPrice > 0 &&
              !isNaN(ins.monthlyAmount) &&
              ins.monthlyAmount > 0 &&
              !isNaN(ins.months) &&
              ins.months >= 1 &&
              !isNaN(ins.advance) &&
              ins.advance >= 0
            );
          })
          .map((ins) => ({
            id: ins.id,
            product_id: Number(id),
            totalPrice: Number(ins.totalPrice),
            monthlyAmount: Number(ins.monthlyAmount),
            months: Number(ins.months),
            advance: Number(ins.advance),
            isActive: Boolean(ins.isActive),
          }));
        if (validInstallments.length > 0) {
          await api.put("/create-product-installment", { ProductInstallments: validInstallments });
        }
      }

      const originalTagIds = product.tags.map(t => t.id).sort((a, b) => a - b);
      const editedTagIds = selectedTags.map(Number).sort((a, b) => a - b);
      if (JSON.stringify(originalTagIds) !== JSON.stringify(editedTagIds)) {
        await api.put(`/product/${id}`, { tags: editedTagIds });
      }

      toast.success("Product updated successfully");
      setHasChanges(false);
      router.push("/admin/products/list");
    } catch (error) {
      toast.error("Failed to update product: " + (error.response?.data?.message || error.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (hasChanges) {
      setShowCancelConfirm(true);
    } else {
      router.push("/admin/products/list");
    }
  };

  const confirmCancel = () => {
    setShowCancelConfirm(false);
    setHasChanges(false);
    router.push("/admin/products/list");
  };

  const isEqual = (a, b) => {
    if (typeof a !== "object" || typeof b !== "object") {
      return a === b;
    }
    return JSON.stringify(a) === JSON.stringify(b);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!product) {
    return <div className="text-center py-8">Product not found</div>;
  }

  const tagOptions = tags.map(t => ({ value: String(t.id), label: t.name }));

  return (
    <div className="space-y-6 p-6">
      <div className="flex gap-2 items-center">
        <h2 className="text-2xl font-bold">Edit Product: {product.name}</h2>
        <a className="flex gap-1 items-center underline text-blue-600" href={`https://qistmarket.pk/${product.category_slug_name}/${product.subcategory_slug_name}/${product.slugName}`} target="_blank">Preview <SquareArrowOutUpRight size={15} /></a>
      </div>
      <Card className="p-6">
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="seo">SEO</TabsTrigger>
            <TabsTrigger value="images">Images & Installments</TabsTrigger>
          </TabsList>
          <TabsContent value="basic">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="name" className="text-sm font-medium">Name</Label>
                <Input
                  id="name"
                  value={editedProduct.name || ""}
                  onChange={(e) => handleFieldChange("name", e.target.value)}
                  className="mt-1"
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <Label htmlFor="price" className="text-sm font-medium">Price (RS)</Label>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={editedProduct.price !== null ? editedProduct.price : ""}
                  onChange={(e) => handleFieldChange("price", e.target.value)}
                  className="mt-1"
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <Label htmlFor="category_id" className="text-sm font-medium">Category</Label>
                <Select
                  value={editedProduct.category_id?.toString() || ""}
                  onValueChange={(value) => handleFieldChange("category_id", value)}
                  disabled={isSubmitting}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id.toString()}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="subcategory_id" className="text-sm font-medium">Subcategory</Label>
                <Select
                  value={editedProduct.subcategory_id?.toString() || ""}
                  onValueChange={(value) => handleFieldChange("subcategory_id", value)}
                  disabled={!editedProduct.category_id || isSubmitting}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select subcategory" />
                  </SelectTrigger>
                  <SelectContent>
                    {(subCategoriesMap[editedProduct.category_id] || []).map((s) => (
                      <SelectItem key={s.id} value={s.id.toString()}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2">
                <Label className="text-sm font-medium">Tags (Optional)</Label>
                <SearchableSelect
                  options={tagOptions}
                  value={selectedTags}
                  onChange={handleTagChange}
                  placeholder="Select tags"
                  multiple
                  disabled={isSubmitting}
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="short_description" className="text-sm font-medium">Short Description</Label>
                <Textarea
                  id="short_description"
                  value={editedProduct.short_description || ""}
                  onChange={(e) => handleFieldChange("short_description", e.target.value)}
                  className="mt-1"
                  disabled={isSubmitting}
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="long_description" className="text-sm font-medium">Long Description</Label>
                <div className="mt-1 max-h-[300px] overflow-y-auto border rounded-md">
                  <QuillEditor
                    value={longDescValue}
                    onChange={handleLongDescChange}
                    disabled={isSubmitting}
                  />
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium">Status</Label>
                <div className="flex items-center space-x-2 mt-1">
                  <Switch
                    checked={editedProduct.status}
                    onCheckedChange={(checked) => handleFieldChange("status", checked)}
                    disabled={isSubmitting}
                  />
                  <span>{editedProduct.status ? "Active" : "Inactive"}</span>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium">Stock</Label>
                <div className="flex items-center space-x-2 mt-1">
                  <Switch
                    checked={editedProduct.stock}
                    onCheckedChange={(checked) => handleFieldChange("stock", checked)}
                    disabled={isSubmitting}
                  />
                  <span>{editedProduct.stock ? "In Stock" : "Out of Stock"}</span>
                </div>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="seo">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <Label htmlFor="meta_title" className="text-sm font-medium">Meta Title (Max 60 characters)</Label>
                <Input
                  id="meta_title"
                  value={editedProduct.meta_title || ""}
                  onChange={(e) => handleFieldChange("meta_title", e.target.value)}
                  className="mt-1"
                  maxLength={60}
                  disabled={isSubmitting}
                />
                <p className="text-xs text-gray-500 mt-1">{editedProduct.meta_title?.length || 0}/60 characters</p>
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="meta_description" className="text-sm font-medium">Meta Description (Max 160 characters)</Label>
                <Textarea
                  id="meta_description"
                  value={editedProduct.meta_description || ""}
                  onChange={(e) => handleFieldChange("meta_description", e.target.value)}
                  className="mt-1"
                  maxLength={160}
                  disabled={isSubmitting}
                />
                <p className="text-xs text-gray-500 mt-1">{editedProduct.meta_description?.length || 0}/160 characters</p>
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="meta_keywords" className="text-sm font-medium">Meta Keywords (Comma-separated)</Label>
                <Input
                  id="meta_keywords"
                  value={editedProduct.meta_keywords || ""}
                  onChange={(e) => handleFieldChange("meta_keywords", e.target.value)}
                  className="mt-1"
                  disabled={isSubmitting}
                />
                <p className="text-xs text-gray-500 mt-1">Enter keywords separated by commas (e.g., phone, smartphone, gadget)</p>
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="slugName" className="text-sm font-medium">URL Slug</Label>
                <Input
                  id="slugName"
                  value={editedProduct.slugName || ""}
                  onChange={(e) => handleFieldChange("slugName", e.target.value)}
                  className="mt-1"
                  disabled={isSubmitting}
                />
                <p className="text-xs text-gray-500 mt-1">Example: qistmarket.pk/{product.category_slug_name}/{product.subcategory_slug_name}/{editedProduct.slugName.toLowerCase().replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-+|-+$/g, '') || "product-name"}</p>
              </div>
              <div className="md:col-span-2">
                <Label className="text-sm font-medium">Google Search Preview</Label>
                <div className="mt-2 p-4 border rounded-md bg-gray-50">
                  <p className="text-blue-600 text-base font-medium">{editedProduct.meta_title || "Product Title"}</p>
                  <p className="text-green-600 text-sm">qistmarket.pk/{product.category_slug_name}/{product.subcategory_slug_name}/{editedProduct.slugName.toLowerCase().replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-+|-+$/g, '') || "product-name"}</p>
                  <p className="text-gray-700 text-sm">{editedProduct.meta_description || "No description provided."}</p>
                </div>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="images">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <Label className="text-sm font-medium">Images</Label>
                <Button
                  variant="outline"
                  className="mt-1 w-full flex items-center justify-center gap-2"
                  onClick={handleImageEdit}
                  disabled={isSubmitting}
                >
                  <Edit2 className="h-4 w-4" />
                  Edit Images
                </Button>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-2">
                  {editedProduct.ProductImage?.map((img) => (
                    <Card key={img.id} className="p-2">
                      <img src={img.url} alt={img.alt_text || "Product image"} className="w-full h-32 object-contain rounded" />
                    </Card>
                  ))}
                </div>
              </div>
              <div className="md:col-span-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Installments</Label>
                  <Button
                    variant="outline"
                    className="mt-1 flex items-center gap-2"
                    onClick={handleInstallmentEdit}
                    disabled={isSubmitting}
                  >
                    <Edit2 className="h-4 w-4" />
                    Edit Installments
                  </Button>
                </div>
                {editedProduct.ProductInstallments?.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                    {editedProduct.ProductInstallments.map((ins, index) => (
                      <Card key={index} className="p-4 relative hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start">
                          <div className="space-y-2">
                            <p className="text-sm font-medium">Plan {index + 1}</p>
                            <p className="text-sm">
                              <span className="font-medium">Total Price:</span> RS {ins.totalPrice.toLocaleString()}
                            </p>
                            <p className="text-sm">
                              <span className="font-medium">Monthly Amount:</span> RS {ins.monthlyAmount.toLocaleString()}
                            </p>
                            <p className="text-sm">
                              <span className="font-medium">Months:</span> {ins.months}
                            </p>
                            <p className="text-sm">
                              <span className="font-medium">Advance:</span> RS {ins.advance.toLocaleString()}
                            </p>
                            <p className="text-sm">
                              <span className="font-medium">Status:</span>{" "}
                              <span className={ins.isActive ? "text-green-600" : "text-red-600"}>
                                {ins.isActive ? "Active" : "Inactive"}
                              </span>
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleInstallmentEdit}
                            className="absolute top-2 right-2"
                            disabled={isSubmitting}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 mt-2">No installments available.</p>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
        <div className="flex justify-end space-x-2 mt-6">
          <Button variant="outline" onClick={handleCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!hasChanges || isSubmitting}>
            {isSubmitting ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </Card>

      {isImageModalOpen && (
        <ImageFormModal
          isOpen={isImageModalOpen}
          onClose={() => setIsImageModalOpen(false)}
          title={`Edit Images for ${editedProduct.name}`}
          defaultValues={editedProduct}
          flag={saveImages}
        />
      )}

      {isInstallmentModalOpen && (
        <InstallmentFormModal
          isOpen={isInstallmentModalOpen}
          onClose={() => setIsInstallmentModalOpen(false)}
          title={`Edit Installments for ${editedProduct.name}`}
          defaultValues={editedProduct}
          flag={saveInstallments}
        />
      )}

      {showCancelConfirm && (
        <Dialog open={showCancelConfirm} onOpenChange={setShowCancelConfirm}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Cancel</DialogTitle>
            </DialogHeader>
            <p>You have unsaved changes. Are you sure you want to leave?</p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCancelConfirm(false)}>
                Stay
              </Button>
              <Button onClick={confirmCancel}>Leave</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}