"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import api from "@/lib/api";
import LoadingSpinner from "@/components/LoadingSpinner/LoadingSpinner";
import { Edit2 } from "lucide-react";

export default function ProductDetails() {
  const router = useRouter();
  const { id } = useParams();

  const [product, setProduct] = useState(null);
  const [editedProduct, setEditedProduct] = useState(null);
  const [brands, setBrands] = useState([]);
  const [models, setModels] = useState([]);
  const [productTypes, setProductTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  // Fetch all required data
  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;

      try {
        const [productRes, brandsRes, modelsRes, typesRes] = await Promise.all([
          api.get(`/product/${id}`),
          api.get("/all-brands"),           // Adjust endpoint as needed
          api.get("/all-models"),           // All models or filtered by brand later
          api.get("/all-product-types"),    // Adjust endpoint as needed
        ]);

        const prod = productRes.data;
        setProduct(prod);
        setEditedProduct({ ...prod });

        setBrands(brandsRes.data);
        setModels(modelsRes.data);
        setProductTypes(typesRes.data);
      } catch (error) {
        toast.error("Failed to load product data");
        router.push("/admin/products/list");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, router]);

  // Fetch models when brand changes (optional optimization)
  const fetchModelsForBrand = async (brandId) => {
    if (!brandId) {
      setModels([]);
      return;
    }
    try {
      const res = await api.get(`/models?brandId=${brandId}`);
      setModels(res.data);
    } catch (error) {
      toast.error("Failed to load models");
    }
  };

  const handleFieldChange = (field, value) => {
    let processedValue = value;

    if (["regularPrice", "salePrice", "stock"].includes(field)) {
      processedValue = value === "" ? null : parseFloat(value);
      if (isNaN(processedValue)) processedValue = null;
    } else if (["brandId", "modelId", "typeId"].includes(field)) {
      processedValue = value === "" ? null : parseInt(value, 10);
      if (field === "brandId") {
        fetchModelsForBrand(processedValue);
        // Reset model when brand changes
        setEditedProduct(prev => ({ ...prev, modelId: null }));
      }
    }

    setEditedProduct(prev => ({ ...prev, [field]: processedValue }));
    setHasChanges(true);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      // Build update payload only with changed fields
      const updates = {};
      const fields = ["name", "stock", "regularPrice", "salePrice", "color", "brandId", "modelId", "typeId"];

      fields.forEach(field => {
        if (editedProduct[field] !== product[field]) {
          updates[field] = editedProduct[field];
        }
      });

      // Validation
      if (updates.regularPrice !== undefined && (updates.regularPrice === null || updates.regularPrice < 0)) {
        throw new Error("Regular price must be a positive number");
      }
      if (updates.salePrice !== undefined && (updates.salePrice !== null && updates.salePrice < 0)) {
        throw new Error("Sale price must be a positive number");
      }
      if (updates.stock !== undefined && updates.stock < 0) {
        throw new Error("Stock cannot be negative");
      }
      if (!updates.brandId && editedProduct.brandId == null) {
        throw new Error("Brand is required");
      }
      if (!updates.modelId && editedProduct.modelId == null) {
        throw new Error("Model is required");
      }
      if (!updates.typeId && editedProduct.typeId == null) {
        throw new Error("Product type is required");
      }

      if (Object.keys(updates).length > 0) {
        await api.put(`/product/${id}`, updates);
      }

      toast.success("Product updated successfully");
      setHasChanges(false);
      router.push("/admin/products/list");
    } catch (error) {
      toast.error(error.message || "Failed to update product");
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
    router.push("/admin/products/list");
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

  return (
    <div className="space-y-6 p-6">
      <h2 className="text-2xl font-bold">Edit Product: {product.name}</h2>

      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Name */}
          <div className="md:col-span-2">
            <Label htmlFor="name">Product Name</Label>
            <Input
              id="name"
              value={editedProduct.name || ""}
              onChange={(e) => handleFieldChange("name", e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          {/* Brand */}
          <div>
            <Label htmlFor="brandId">Brand</Label>
            <Select
              value={editedProduct.brandId?.toString() || ""}
              onValueChange={(value) => handleFieldChange("brandId", value)}
              disabled={isSubmitting}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select brand" />
              </SelectTrigger>
              <SelectContent>
                {brands.map((brand) => (
                  <SelectItem key={brand.id} value={brand.id.toString()}>
                    {brand.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Model */}
          <div>
            <Label htmlFor="modelId">Model</Label>
            <Select
              value={editedProduct.modelId?.toString() || ""}
              onValueChange={(value) => handleFieldChange("modelId", value)}
              disabled={!editedProduct.brandId || isSubmitting}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select model" />
              </SelectTrigger>
              <SelectContent>
                {models
                  .filter((m) => m.brandId === editedProduct.brandId)
                  .map((model) => (
                    <SelectItem key={model.id} value={model.id.toString()}>
                      {model.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {/* Product Type */}
          <div>
            <Label htmlFor="typeId">Product Type</Label>
            <Select
              value={editedProduct.typeId?.toString() || ""}
              onValueChange={(value) => handleFieldChange("typeId", value)}
              disabled={isSubmitting}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {productTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id.toString()}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Color (optional) */}
          <div>
            <Label htmlFor="color">Color (Optional - for Enclosures)</Label>
            <Input
              id="color"
              value={editedProduct.color || ""}
              onChange={(e) => handleFieldChange("color", e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          {/* Regular Price */}
          <div>
            <Label htmlFor="regularPrice">Regular Price ($)</Label>
            <Input
              id="regularPrice"
              type="number"
              step="0.01"
              min="0"
              value={editedProduct.regularPrice ?? ""}
              onChange={(e) => handleFieldChange("regularPrice", e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          {/* Sale Price */}
          <div>
            <Label htmlFor="salePrice">Sale Price ($)</Label>
            <Input
              id="salePrice"
              type="number"
              step="0.01"
              min="0"
              value={editedProduct.salePrice ?? ""}
              onChange={(e) => handleFieldChange("salePrice", e.target.value)}
              placeholder="Leave empty if no sale"
              disabled={isSubmitting}
            />
          </div>

          {/* Stock */}
          <div>
            <Label htmlFor="stock">Stock Quantity</Label>
            <Input
              id="stock"
              type="number"
              min="0"
              value={editedProduct.stock ?? ""}
              onChange={(e) => handleFieldChange("stock", e.target.value)}
              disabled={isSubmitting}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-2 mt-8">
          <Button variant="outline" onClick={handleCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!hasChanges || isSubmitting}>
            {isSubmitting ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </Card>

      {/* Cancel Confirmation Dialog */}
      <Dialog open={showCancelConfirm} onOpenChange={setShowCancelConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unsaved Changes</DialogTitle>
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
    </div>
  );
}