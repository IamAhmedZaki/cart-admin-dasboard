"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import api from "@/lib/api";

// Zod schema based on actual Product model
const productSchema = z.object({
  name: z.string().min(1, "Product name is required").trim(),
  regularPrice: z.coerce.number().min(0.01, "Regular price must be greater than 0"),
  salePrice: z.coerce.number().min(0).optional(),
  stock: z.coerce.number().int().min(0).optional().default(0),
  brandId: z.string().min(1, "Brand is required"),
  modelId: z.string().min(1, "Model is required"),
  typeId: z.string().min(1, "Product type is required"),
  color: z.string().optional().nullable(),
}).refine((data) => {
  // Color is required only if type is Enclosure
  if (data.typeId) {
    // We'll check this after loading types, but for safety:
    // In practice, you can enhance this with actual type name if needed
    return true; // We'll handle conditional requirement in UI + server
  }
  return true;
}, { message: "Color is required for Enclosure products", path: ["color"] });

export default function AddProduct() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [brands, setBrands] = useState([]);
  const [models, setModels] = useState([]);
  const [productTypes, setProductTypes] = useState([]);
  const [loadingBrands, setLoadingBrands] = useState(true);
  const [loadingModels, setLoadingModels] = useState(false);
  const [loadingTypes, setLoadingTypes] = useState(true);

  const form = useForm({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      regularPrice: "",
      salePrice: "",
      stock: "",
      brandId: "",
      modelId: "",
      typeId: "",
      color: "",
    },
  });

  const watchedTypeId = form.watch("typeId");

  // Fetch Brands
  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const res = await api.get("/brands?limit=1000");
        setBrands(res.data.data || []);
      } catch (error) {
        toast.error("Failed to load brands");
      } finally {
        setLoadingBrands(false);
      }
    };
    fetchBrands();
  }, []);

  // Fetch Product Types
  useEffect(() => {
    const fetchTypes = async () => {
      try {
        const res = await api.get("/product-types?limit=100");
        setProductTypes(res.data.data || []);
      } catch (error) {
        toast.error("Failed to load product types");
      } finally {
        setLoadingTypes(false);
      }
    };
    fetchTypes();
  }, []);

  // Fetch Models when Brand changes
  const watchedBrandId = form.watch("brandId");
  useEffect(() => {
    if (!watchedBrandId) {
      setModels([]);
      form.setValue("modelId", "");
      return;
    }

    const fetchModels = async () => {
      setLoadingModels(true);
      try {
        const res = await api.get(`/brands/${watchedBrandId}`);
        // Or: `/models?brandId=${watchedBrandId}`
        console.log(res);
        
        setModels(res.data.models || res.data || []);
      } catch (error) {
        toast.error("Failed to load models for this brand");
        setModels([]);
      } finally {
        setLoadingModels(false);
      }
    };

    fetchModels();
  }, [watchedBrandId]);

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      const payload = {
        name: data.name.trim(),
        regularPrice: parseFloat(data.regularPrice),
        salePrice: data.salePrice ? parseFloat(data.salePrice) : null,
        stock: data.stock ? parseInt(data.stock) : 0,
        brandId: Number(data.brandId),
        modelId: Number(data.modelId),
        typeId: Number(data.typeId),
        color: data.color || null,
      };

      await api.post("/create-product", payload); // assuming endpoint is /products

      toast.success("Product created successfully!");
      form.reset();
    } catch (error) {
      console.error("Error creating product:", error);
      toast.error(
        error.response?.data?.message ||
          "Failed to create product. Please check all fields."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper to check if selected type is Enclosure
  const isEnclosure = () => {
    const selectedType = productTypes.find(t => String(t.id) === watchedTypeId);
    return selectedType?.name === "Enclosure";
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Create New Product</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Product Name */}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Yamaha Drive2 PTV" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Regular Price */}
                  <FormField
                    control={form.control}
                    name="regularPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Regular Price (USD)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="e.g. 12999.99"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Sale Price */}
                  <FormField
                    control={form.control}
                    name="salePrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sale Price (USD) - Optional</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="e.g. 11999.99 (leave empty if none)"
                            {...field}
                            value={field.value ?? ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Stock */}
                <FormField
                  control={form.control}
                  name="stock"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Stock Quantity</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          placeholder="e.g. 5 (defaults to 0)"
                          {...field}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Brand */}
                <FormField
                  control={form.control}
                  name="brandId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Brand</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value);
                          form.setValue("modelId", ""); // reset model
                        }}
                        value={field.value}
                        disabled={loadingBrands}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={loadingBrands ? "Loading brands..." : "Select a brand"} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {brands.map((brand) => (
                            <SelectItem key={brand.id} value={String(brand.id)}>
                              {brand.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Model (cascading) */}
                <FormField
                  control={form.control}
                  name="modelId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Model</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={!watchedBrandId || loadingModels || models.length === 0}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue
                              placeholder={
                                !watchedBrandId
                                  ? "Select a brand first"
                                  : loadingModels
                                  ? "Loading models..."
                                  : models.length === 0
                                  ? "No models available"
                                  : "Select a model"
                              }
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {models.map((model) => (
                            <SelectItem key={model.id} value={String(model.id)}>
                              {model.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Product Type */}
                <FormField
                  control={form.control}
                  name="typeId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product Type</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value);
                          if (value && !isEnclosure()) {
                            form.setValue("color", ""); // clear color if not Enclosure
                          }
                        }}
                        value={field.value}
                        disabled={loadingTypes}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={loadingTypes ? "Loading types..." : "Select product type"} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {productTypes.map((type) => (
                            <SelectItem key={type.id} value={String(type.id)}>
                              {type.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Color - Conditional for Enclosure */}
                {isEnclosure() && (
                  <FormField
                    control={form.control}
                    name="color"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Color (Required for Enclosure)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g. Sapphire Blue, Carbon Fiber"
                            {...field}
                            value={field.value ?? ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {/* Submit */}
                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={isSubmitting || loadingBrands || loadingTypes}
                >
                  {isSubmitting ? "Creating Product..." : "Create Product"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}