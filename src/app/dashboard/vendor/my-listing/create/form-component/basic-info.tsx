"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

// Types for API response (matching your listings page)
interface Category {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  type: "subCategory" | "mainCategory" | "tag";
  description: string | null;
  created_at?: string;
  updated_at?: string;
}

// Updated schema to match API
export const businessFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  category_ids: z.array(z.string()).min(1, "At least one category is required"),
  description: z.string().min(1, "Description is required"),
  type: z.enum(["business", "event", "community"]),
  primary_phone: z.string().min(1, "Phone number is required"),
  secondary_phone: z.string().optional(),
  email: z.string().email("Invalid email address"),
  website: z.string().url().optional().or(z.literal("")),
  business_reg_num: z.string().optional(),
  bio: z.string().optional(),
});

const basicInfoConfig = {
  business: {
    nameLabel: "Business Name",
    namePlaceholder: "Enter business name",
    descriptionLabel: "Business Description",
    descriptionPlaceholder: "Short description about your business",
  },
  event: {
    nameLabel: "Event Name",
    namePlaceholder: "Enter event name",
    descriptionLabel: "Event Description",
    descriptionPlaceholder: "Short description about your event",
  },
  community: {
    nameLabel: "Community Name",
    namePlaceholder: "Enter community name",
    descriptionLabel: "Community Description",
    descriptionPlaceholder: "Short description about your community",
  },
};

export type BusinessFormValues = z.infer<typeof businessFormSchema>;

type Props = {
  form: ReturnType<typeof useForm<BusinessFormValues>>;
  listingType: "business" | "event" | "community";
  onSubmit?: (data: BusinessFormValues) => Promise<void>;
};

export function BasicInformationForm({ form, listingType, onSubmit }: Props) {
  const {
    register,
    setValue,
    watch,
    handleSubmit,
    reset,
    formState: { errors },
  } = form;

  const searchParams = useSearchParams();
  const router = useRouter();
  const urlType = searchParams.get("type") as
    | "business"
    | "event"
    | "community"
    | null;

  const [categories, setCategories] = useState<Category[]>([]);
  const [mainCategories, setMainCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<Category[]>([]);
  const [selectedMainCategoryId, setSelectedMainCategoryId] =
    useState<string>("");
  const [selectedMainCategory, setSelectedMainCategory] =
    useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSubCategories, setSelectedSubCategories] = useState<string[]>(
    []
  );
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Get current category_ids from form
  const currentCategoryIds = watch("category_ids") || [];

  // Fetch categories from API
  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("authToken");
      if (!token) {
        throw new Error("Authentication token not found");
      }

      const API_URL = process.env.API_URL || "https://me-fie.co.uk";

      const response = await fetch(`${API_URL}/api/categories`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to fetch categories`);
      }

      const data = await response.json();

      // Handle different response formats
      let categoriesData: Category[] = [];
      if (Array.isArray(data)) {
        categoriesData = data;
      } else if (data.data && Array.isArray(data.data)) {
        categoriesData = data.data;
      } else if (data.categories && Array.isArray(data.categories)) {
        categoriesData = data.categories;
      }

      setCategories(categoriesData);

      // Filter main categories (parent_id === null)
      const mainCats = categoriesData.filter((cat) => cat.parent_id === null);
      setMainCategories(mainCats);

      // Select the first main category by default if none selected
      if (mainCats.length > 0 && !selectedMainCategoryId) {
        const firstMainCategory = mainCats[0];
        handleMainCategoryChange(firstMainCategory.id, firstMainCategory);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
      setError(
        error instanceof Error ? error.message : "Failed to load categories"
      );
    } finally {
      setLoading(false);
    }
  };

  // Set the type field from URL parameter
  useEffect(() => {
    if (urlType && ["business", "event", "community"].includes(urlType)) {
      setValue("type", urlType);
    }
  }, [urlType, setValue]);

  // Fetch categories on the component mount
  useEffect(() => {
    fetchCategories();
  }, []);

  // Handle main category selection
  const handleMainCategoryChange = (
    categoryId: string,
    category?: Category
  ) => {
    const selectedCategory =
      category || categories.find((cat) => cat.id === categoryId);

    if (!selectedCategory) return;

    setSelectedMainCategoryId(categoryId);
    setSelectedMainCategory(selectedCategory);

    // Find subcategories (categories with this category as parent_id)
    const subCats = categories.filter((cat) => cat.parent_id === categoryId);
    setSubCategories(subCats);

    // Reset selected subcategories
    setSelectedSubCategories([]);

    // Start with only the main category selected
    const newCategoryIds = [categoryId];
    setValue("category_ids", newCategoryIds, { shouldValidate: true });
  };

  // Handle subcategory pill click
  const handleSubcategoryClick = (subCategoryId: string) => {
    let newSelectedSubCategories = [...selectedSubCategories];

    if (newSelectedSubCategories.includes(subCategoryId)) {
      // Remove if already selected
      newSelectedSubCategories = newSelectedSubCategories.filter(
        (id) => id !== subCategoryId
      );
    } else {
      // Add if not selected
      newSelectedSubCategories = [...newSelectedSubCategories, subCategoryId];
    }

    setSelectedSubCategories(newSelectedSubCategories);

    // Update form with main category + selected subcategories
    const allCategoryIds = [
      selectedMainCategoryId,
      ...newSelectedSubCategories,
    ];
    setValue("category_ids", allCategoryIds, { shouldValidate: true });
  };

  // Handle form submission
  const handleFormSubmit = async (data: BusinessFormValues) => {
    try {
      setError(null);

      const token = localStorage.getItem("authToken");
      if (!token) {
        toast.error("Authentication required");
        throw new Error("Authentication token not found");
      }

      const API_URL = process.env.API_URL || "https://me-fie.co.uk";

      // Prepare the data for the API
      const formData = {
        name: data.name,
        description: data.description,
        type: data.type,
        primary_phone: data.primary_phone,
        secondary_phone: data.secondary_phone || "",
        email: data.email,
        website: data.website || "",
        business_reg_num: data.business_reg_num || "",
        category_ids: data.category_ids,
        bio: data.description,
      };

      console.log("Submitting data:", formData);

      const response = await fetch(`${API_URL}/api/listing/profile`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      console.log("Response status:", response.status);

      // Handle 204 No Content response
      if (response.status === 204) {
        toast.success("Listing created successfully!");
        setSubmitSuccess(true);

        // Reset form
        reset();
        setSelectedSubCategories([]);
        setSelectedMainCategoryId("");
        setSelectedMainCategory(null);
        setSubCategories([]);

        // Call the onSubmit prop if provided
        if (onSubmit) {
          await onSubmit(data);
        }

        // Redirect after success
        setTimeout(() => {
          router.push("/listings");
        }, 1500);
        return;
      }

      // Handle other success statuses (200, 201)
      if (response.ok) {
        try {
          const responseData = await response.json();
          console.log("Success response:", responseData);
          toast.success("Listing created successfully!");
          setSubmitSuccess(true);

          // Reset form
          reset();
          setSelectedSubCategories([]);
          setSelectedMainCategoryId("");
          setSelectedMainCategory(null);
          setSubCategories([]);

          if (onSubmit) {
            await onSubmit(data);
          }

          setTimeout(() => {
            router.push("/listings");
          }, 1500);
        } catch {
          // If JSON parsing fails but response is OK
          console.log("Success but no JSON response");
          toast.success("Listing created successfully!");
          setSubmitSuccess(true);

          reset();
          setSelectedSubCategories([]);
          setSelectedMainCategoryId("");
          setSelectedMainCategory(null);
          setSubCategories([]);

          if (onSubmit) {
            await onSubmit(data);
          }

          setTimeout(() => {
            router.push("/listings");
          }, 1500);
        }
        return;
      }

      // Handle errors
      let errorMessage = `Failed to submit listing (${response.status})`;

      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;

        // Handle validation errors
        if (errorData.errors) {
          const validationErrors = Object.values(errorData.errors).flat();
          errorMessage = validationErrors.join(", ");
        }
      } catch {
        // If error response isn't JSON
        const textError = await response.text();
        if (textError) {
          errorMessage = textError;
        }
      }

      throw new Error(errorMessage);
    } catch (error) {
      console.error("Submission error:", error);
      const errorMsg =
        error instanceof Error ? error.message : "Failed to submit listing";
      setError(errorMsg);
      toast.error(errorMsg);
    }
  };

  const text = basicInfoConfig[listingType];
  const {
    nameLabel,
    namePlaceholder,
    descriptionLabel,
    descriptionPlaceholder,
  } = text;

  return (
    <form
      onSubmit={handleSubmit(handleFormSubmit)}
      className="w-full max-w-5xl space-y-6 mx-auto p-0.5 lg:p-6"
    >
      <div>
        <h2 className="text-2xl font-semibold">Basic Information</h2>
        <p className="text-sm text-gray-500 mt-1">
          {listingType === "business"
            ? "Tell us about your business"
            : listingType === "event"
            ? "Tell us about your event"
            : "Tell us about your community"}
        </p>
      </div>

      {/* Listing Type (Disabled, pre-filled from URL) */}
      <div className="space-y-1">
        <label className="font-medium text-sm">Listing Type</label>
        <Input
          value={watch("type") || urlType || ""}
          disabled
          className="h-10 rounded-lg border-gray-300 px-4 text-gray-800 bg-gray-50 cursor-not-allowed"
        />
        <input type="hidden" {...register("type")} />
      </div>

      {/* Business/Event/Community Name */}
      <div className="space-y-1">
        <label className="font-medium text-sm">{nameLabel}</label>
        <Input
          {...register("name")}
          placeholder={namePlaceholder}
          className={cn(
            "h-10 rounded-lg border-gray-300 px-4 text-gray-800 placeholder:text-gray-400 focus-visible:ring-2 focus-visible:ring-black",
            errors.name && "border-red-500 focus-visible:ring-red-500"
          )}
        />
        {errors.name && (
          <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>
        )}
      </div>

      {/* Email */}
      <div className="space-y-1">
        <label className="font-medium text-sm">Email Address *</label>
        <Input
          {...register("email")}
          type="email"
          placeholder="example@domain.com"
          className={cn(
            "h-10 rounded-lg border-gray-300 px-4 text-gray-800 placeholder:text-gray-400 focus-visible:ring-2 focus-visible:ring-black",
            errors.email && "border-red-500 focus-visible:ring-red-500"
          )}
        />
        {errors.email && (
          <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
        )}
      </div>

      {/* Phone Numbers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-1">
          <label className="font-medium text-sm">Primary Phone *</label>
          <Input
            {...register("primary_phone")}
            placeholder="+233 000 000 0000"
            className={cn(
              "h-10 rounded-lg border-gray-300 px-4 text-gray-800 placeholder:text-gray-400 focus-visible:ring-2 focus-visible:ring-black",
              errors.primary_phone &&
                "border-red-500 focus-visible:ring-red-500"
            )}
          />
          {errors.primary_phone && (
            <p className="text-red-500 text-xs mt-1">
              {errors.primary_phone.message}
            </p>
          )}
        </div>

        <div className="space-y-1">
          <label className="font-medium text-sm">
            Secondary Phone (Optional)
          </label>
          <Input
            {...register("secondary_phone")}
            placeholder="+233 000 000 0000"
            className="h-10 rounded-lg border-gray-300 px-4 text-gray-800 placeholder:text-gray-400 focus-visible:ring-2 focus-visible:ring-black"
          />
        </div>
      </div>

      {/* Category Selection */}
      <div className="space-y-4">
        {/* Main Category */}
        <div className="space-y-1">
          <label className="font-medium text-sm">Main Category *</label>
          {loading ? (
            <div className="flex items-center space-x-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm text-gray-500">
                Loading categories...
              </span>
            </div>
          ) : error ? (
            <div className="text-red-500 text-sm">{error}</div>
          ) : (
            <Select
              value={selectedMainCategoryId}
              onValueChange={handleMainCategoryChange}
              disabled={loading || mainCategories.length === 0}
            >
              <SelectTrigger
                className={cn(
                  "h-10 w-full rounded-lg border-gray-300 px-4 text-gray-800 placeholder:text-gray-400 focus-visible:ring-2 focus-visible:ring-black",
                  errors.category_ids &&
                    "border-red-500 focus-visible:ring-red-500"
                )}
              >
                <SelectValue
                  placeholder={
                    mainCategories.length === 0
                      ? "No categories available"
                      : "Select main category"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {mainCategories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Subcategories as Pills */}
        {selectedMainCategoryId && subCategories.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="font-medium text-sm">
                Subcategories (Optional)
              </label>
              <span className="text-xs text-gray-500">
                Showing sub-categories for:{" "}
                <span className="font-semibold">
                  {selectedMainCategory?.name || "No main category selected"}
                </span>
              </span>
            </div>
            <div className="flex flex-wrap gap-2 min-h-[60px] p-3 border border-gray-200 rounded-lg bg-white">
              {subCategories.map((subcategory) => {
                const isSelected = selectedSubCategories.includes(
                  subcategory.id
                );
                return (
                  <button
                    key={subcategory.id}
                    type="button"
                    onClick={() => handleSubcategoryClick(subcategory.id)}
                    className={cn(
                      "px-4 py-2 rounded-full text-sm font-medium transition-all duration-200",
                      "border hover:shadow-md flex items-center gap-2",
                      isSelected
                        ? "bg-[#93C01F] text-white border-[#93C01F]"
                        : "bg-white text-gray-900 border-gray-300 hover:border-[#93C01F] hover:bg-[#F4F9E8]"
                    )}
                  >
                    {subcategory.name}
                    {isSelected && <X className="w-3 h-3" />}
                  </button>
                );
              })}
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500">
                Click to select/deselect subcategories. Main category is always
                included.
              </p>
              <Badge variant="outline" className="text-xs">
                {selectedSubCategories.length} selected
              </Badge>
            </div>
          </div>
        )}

        {selectedMainCategoryId && subCategories.length === 0 && (
          <div className="text-sm text-gray-500 p-3 border border-gray-200 rounded-lg bg-gray-50">
            No subcategories available for this main category.
          </div>
        )}

        {/* Selected Categories Preview */}
        {currentCategoryIds.length > 0 && (
          <div className="space-y-2">
            <label className="font-medium text-sm">Selected Categories</label>
            <div className="flex flex-wrap gap-2 p-3 border border-gray-200 rounded-lg bg-gray-50">
              {currentCategoryIds.map((categoryId) => {
                const category = categories.find((c) => c.id === categoryId);
                if (!category) return null;

                const isMainCategory = category.parent_id === null;

                return (
                  <Badge
                    key={categoryId}
                    variant={isMainCategory ? "default" : "secondary"}
                    className={cn(
                      "px-3 py-1",
                      isMainCategory
                        ? "bg-[#93C01F] hover:bg-[#7ea919]"
                        : "bg-blue-100 text-blue-800 hover:bg-blue-200"
                    )}
                  >
                    {category.name}
                    {isMainCategory && " (Main)"}
                  </Badge>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {errors.category_ids && (
        <p className="text-red-500 text-xs mt-1">
          {errors.category_ids.message}
        </p>
      )}

      {/* Hidden input for category_ids */}
      <input type="hidden" {...register("category_ids")} />

      {/* Website and Registration Number */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-1">
          <label className="font-medium text-sm">Website (Optional)</label>
          <Input
            {...register("website")}
            type="url"
            placeholder="https://example.com"
            className="h-10 rounded-lg border-gray-300 px-4 text-gray-800 placeholder:text-gray-400 focus-visible:ring-2 focus-visible:ring-black"
          />
        </div>

        {listingType === "business" && (
          <div className="space-y-1">
            <label className="font-medium text-sm">
              Business Registration Number (Optional)
            </label>
            <Input
              {...register("business_reg_num")}
              placeholder="Enter registration number"
              className="h-10 rounded-lg border-gray-300 px-4 text-gray-800 placeholder:text-gray-400 focus-visible:ring-2 focus-visible:ring-black"
            />
          </div>
        )}
      </div>

      {/* Description */}
      <div className="space-y-1">
        <label className="font-medium text-sm">{descriptionLabel}</label>
        <Textarea
          {...register("description")}
          placeholder={descriptionPlaceholder}
          className={cn(
            "min-h-[140px] rounded-lg border-gray-300 p-4 text-gray-800 placeholder:text-gray-400 focus-visible:ring-2 focus-visible:ring-black resize-none",
            errors.description && "border-red-500 focus-visible:ring-red-500"
          )}
        />
        {errors.description && (
          <p className="text-red-500 text-xs mt-1">
            {errors.description.message}
          </p>
        )}
        {/* Hidden bio field that maps to description */}
        <input
          type="hidden"
          {...register("bio")}
          value={watch("description") || ""}
        />
      </div>

      {/* Success Message */}
      {submitSuccess && (
        <div className="p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg">
          <p className="font-medium">Success!</p>
          <p className="text-sm mt-1">
            Your listing has been created successfully. Redirecting...
          </p>
        </div>
      )}

      {/* Error Message */}
      {error && !submitSuccess && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          <p className="font-medium">Submission Error</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      )}
    </form>
  );
}
