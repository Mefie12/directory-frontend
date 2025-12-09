"use client";

import { useState, forwardRef, useImperativeHandle, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
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
import { Loader2, X } from "lucide-react"; // Restored imports
import { ListingFormHandle } from "@/app/dashboard/vendor/my-listing/create/new-listing-content";

// Validation Schema
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

export type BusinessFormValues = z.infer<typeof businessFormSchema>;

// API Category Interface
interface Category {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
}

interface Props {
  listingType: "business" | "event" | "community";
  listingSlug: string;
}

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

export const BasicInformationForm = forwardRef<ListingFormHandle, Props>(
  ({ listingType, listingSlug }, ref) => {
    // --- State ---
    const [categories, setCategories] = useState<Category[]>([]);
    const [mainCategories, setMainCategories] = useState<Category[]>([]);
    const [subCategories, setSubCategories] = useState<Category[]>([]);

    const [selectedMainCategoryId, setSelectedMainCategoryId] =
      useState<string>("");
    const [selectedMainCategory, setSelectedMainCategory] =
      useState<Category | null>(null);

    const [loading, setLoading] = useState(true); // Loading state for categories
    const [error, setError] = useState<string | null>(null);

    // --- Form ---
    const form = useForm<BusinessFormValues>({
      resolver: zodResolver(businessFormSchema),
      defaultValues: {
        name: "",
        category_ids: [],
        description: "",
        type: listingType,
        primary_phone: "",
        secondary_phone: "",
        email: "",
        website: "",
        business_reg_num: "",
        bio: "",
      },
    });

    const {
      register,
      watch,
      setValue,
      trigger,
      formState: { errors },
    } = form;

    useEffect(() => {
      if (listingType) {
        // This forces the form to accept the type passed from the URL
        // overriding the stale "default" value
        setValue("type", listingType);
      }
    }, [listingType, setValue]);

    const currentCategoryIds = watch("category_ids") || [];
    const textConfig = basicInfoConfig[listingType];

    // --- 1. Fetch Categories Logic (Fixed) ---
    useEffect(() => {
      const fetchCategories = async () => {
        try {
          setLoading(true);
          setError(null);

          const token = localStorage.getItem("authToken");
          if (!token) return; // Optional: Handle no token UI

          const API_URL = process.env.API_URL || "https://me-fie.co.uk";

          const response = await fetch(`${API_URL}/api/categories`, {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          });

          if (!response.ok) {
            throw new Error(
              `HTTP ${response.status}: Failed to fetch categories`
            );
          }

          const data = await response.json();

          // Robust Data Parsing
          let categoriesData: Category[] = [];
          if (Array.isArray(data)) {
            categoriesData = data;
          } else if (Array.isArray(data.data)) {
            categoriesData = data.data;
          } else if (Array.isArray(data.categories)) {
            categoriesData = data.categories;
          }

          setCategories(categoriesData);

          // Filter Main Categories
          const mainCats = categoriesData.filter(
            (cat) => cat.parent_id === null
          );
          setMainCategories(mainCats);
        } catch (error) {
          console.error("Error fetching categories:", error);
          setError("Failed to load categories");
        } finally {
          setLoading(false);
        }
      };

      fetchCategories();
    }, []); // Dependency array is empty -> Runs once on mount

    // --- 2. Category Selection Logic (Restored your exact UI logic) ---

    const handleMainCategoryChange = (categoryId: string) => {
      // 1. Ensure categoryId is a string for comparison
      const idStr = String(categoryId);

      const selectedCategory = categories.find(
        (cat) => String(cat.id) === idStr
      );

      if (!selectedCategory) return;

      setSelectedMainCategoryId(idStr);
      setSelectedMainCategory(selectedCategory);

      // Find subcategories (Comparing string to string)
      const subCats = categories.filter(
        (cat) => String(cat.parent_id) === idStr
      );
      setSubCategories(subCats);

      // 2. FORCE STRING: Reset selection to just this main category
      setValue("category_ids", [idStr], { shouldValidate: true });
    };

    const handleSubcategoryClick = (subCategoryId: string) => {
      // 1. FORCE STRING: Convert input to string immediately
      const idStr = String(subCategoryId);

      const currentIds = form.getValues("category_ids") || [];

      let newIds: string[] = [];
      if (currentIds.includes(idStr)) {
        // Remove
        newIds = currentIds.filter((id) => id !== idStr);
      } else {
        // Add
        newIds = [...currentIds, idStr];
      }

      setValue("category_ids", newIds, { shouldValidate: true });
    };

    // --- 3. Submit Handler (Exposed to Parent) ---
    useImperativeHandle(ref, () => ({
      async submit() {
        const isValid = await trigger();
        if (!isValid) {
          toast.error("Please fill all required fields");
          console.error("Validation Errors:", form.formState.errors);
          console.log("Current Form Values:", form.getValues());

          // Check specific common failures
          const values = form.getValues();
          if (!values.category_ids || values.category_ids.length === 0) {
            toast.error("Please select at least one category");
          } else {
            toast.error("Please fill all required fields");
          }
          return false;
        }

        const data = form.getValues();
        // Map description to bio as per your previous requirement
        data.bio = data.description;

        const token = localStorage.getItem("authToken");
        const API_URL = process.env.API_URL || "https://me-fie.co.uk";

        try {
          const endpoint = listingSlug
            ? `${API_URL}/api/listing/${listingSlug}`
            : `${API_URL}/api/listing/profile`;

          const method = listingSlug ? "PUT" : "POST";

          const res = await fetch(endpoint, {
            method,
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(data),
          });

          if (!res.ok) {
            const err = await res.json();
            throw new Error(err.message || "Submission failed");
          }

          const json = await res.json();
          return json.data || json; // Return success data
        } catch (error) {
          const msg = error instanceof Error ? error.message : "Failed to save";
          toast.error(msg);
          return false;
        }
      },
    }));

    return (
      <div className="w-full max-w-5xl space-y-6 mx-auto p-0.5 lg:p-6">
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

        {/* Listing Type */}
        <div className="space-y-1">
          <label className="font-medium text-sm">Listing Type</label>
          <Input
            value={listingType}
            disabled
            className="h-10 rounded-lg border-gray-300 px-4 text-gray-800 bg-gray-50 cursor-not-allowed"
          />
        </div>

        {/* Name */}
        <div className="space-y-1">
          <label className="font-medium text-sm">{textConfig.nameLabel}</label>
          <Input
            {...register("name")}
            placeholder={textConfig.namePlaceholder}
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

        {/* Phones */}
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
                  // Use ID string comparison
                  const isSelected = currentCategoryIds.includes(
                    subcategory.id.toString()
                  );
                  return (
                    <button
                      key={subcategory.id}
                      type="button"
                      onClick={() =>
                        handleSubcategoryClick(String(subcategory.id))
                      }
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
                  {currentCategoryIds.length} categories selected
                </p>
              </div>
            </div>
          )}

          {errors.category_ids && (
            <p className="text-red-500 text-xs mt-1">
              {errors.category_ids.message}
            </p>
          )}
        </div>

        {/* Website & Reg */}
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
          <label className="font-medium text-sm">
            {textConfig.descriptionLabel}
          </label>
          <Textarea
            {...register("description")}
            placeholder={textConfig.descriptionPlaceholder}
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
        </div>
      </div>
    );
  }
);

BasicInformationForm.displayName = "BasicInformationForm";
