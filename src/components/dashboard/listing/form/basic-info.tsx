/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, forwardRef, useImperativeHandle, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import { cn } from "@/lib/utils";
import { SpinnerGap } from "@phosphor-icons/react";
import { ListingFormHandle } from "@/components/dashboard/listing/types";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { useUserLocation } from "@/hooks/useUserLocation";

// Phone Input Imports
import { PhoneInput } from "react-international-phone";
import "react-international-phone/style.css";

// --- Helper function to validate URL (allows without protocol) ---
const isValidUrl = (url: string): boolean => {
  if (!url) return true; // Empty is valid (optional field)
  // Allow URLs with or without protocol
  return /^(https?:\/\/)?([\w-]+\.)+[\w-]+(\/[\w-./?%&=]*)?$/i.test(url);
};

// --- Helper function to normalize URL (add https:// if missing) ---
const normalizeUrl = (url: string): string => {
  if (!url) return "";
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    return `https://${url}`;
  }
  return url;
};

// --- Validation Schema ---
export const businessFormSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters long"),
  category_ids: z.array(z.string()).min(1, "At least one category is required"),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters long"),
  type: z.enum(["business", "event", "community"]),
  primary_phone: z.string().min(8, "Please enter a valid phone number"),
  primary_country_code: z.string().min(1, "Required"),
  secondary_phone: z.string().optional(),
  secondary_country_code: z.string().optional(),
  email: z.string().email("Invalid email address"),
  website: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine((val) => isValidUrl(val || ""), {
      message: "Invalid URL format",
    }),
  business_reg_num: z.string().optional(),
  bio: z.string().optional(),
});

export type BusinessFormValues = z.infer<typeof businessFormSchema>;

// API Category Interface
interface Category {
  id: number;
  slug: string;
  name: string;
  type: string;
  parent_slug: string | null;
}

interface Props {
  listingType: "business" | "event" | "community";
  listingSlug: string;
}

// Config for dynamic labels
const basicInfoConfig = {
  business: {
    label: "Business",
    nameLabel: "Business Name",
    namePlaceholder: "Enter business name",
    descriptionLabel: "Business Description",
    descriptionPlaceholder: "Short description about your business",
  },
  event: {
    label: "Event",
    nameLabel: "Event Name",
    namePlaceholder: "Enter event name",
    descriptionLabel: "Event Description",
    descriptionPlaceholder: "Short description about your event",
  },
  community: {
    label: "Community",
    nameLabel: "Community Name",
    namePlaceholder: "Enter community name",
    descriptionLabel: "Community Description",
    descriptionPlaceholder: "Short description about your community",
  },
};

export const BasicInformationForm = forwardRef<ListingFormHandle, Props>(
  ({ listingType, listingSlug }, ref) => {
    // --- State ---
    const { location: userLocation } = useUserLocation();
    const [categories, setCategories] = useState<Category[]>([]);
    const [mainCategories, setMainCategories] = useState<Category[]>([]);
    const [subCategories, setSubCategories] = useState<Category[]>([]);

    const [selectedMainCategoryId, setSelectedMainCategoryId] =
      useState<string>("");
    const [selectedMainCategory, setSelectedMainCategory] =
      useState<Category | null>(null);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // --- Form ---
    const form = useForm<BusinessFormValues>({
      resolver: zodResolver(businessFormSchema),
      mode: "onChange",
      defaultValues: {
        name: "",
        category_ids: [],
        description: "",
        type: listingType,
        primary_phone: "",
        primary_country_code: "+233",
        secondary_phone: "",
        secondary_country_code: "",
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
      control,
      reset,
      formState: { errors },
    } = form;

    useEffect(() => {
      if (listingType) {
        setValue("type", listingType);
      }
    }, [listingType, setValue]);

    const currentCategoryIds = watch("category_ids") || [];
    const textConfig = basicInfoConfig[listingType];

    // --- 1. Fetch Categories Logic ---
    useEffect(() => {
      const fetchCategories = async () => {
        try {
          setLoading(true);
          setError(null);

          const token = localStorage.getItem("authToken");

          const response = await fetch(`/api/categories`, {
            headers: {
              ...(token && { Authorization: `Bearer ${token}` }),
              "Content-Type": "application/json",
            },
          });

          if (!response.ok) {
            throw new Error(
              `HTTP ${response.status}: Failed to fetch categories`,
            );
          }

          const data = await response.json();

          let categoriesData: Category[] = [];
          if (Array.isArray(data)) {
            categoriesData = data;
          } else if (Array.isArray(data.data)) {
            categoriesData = data.data;
          } else if (Array.isArray(data.categories)) {
            categoriesData = data.categories;
          }

          setCategories(categoriesData);

          const mainCats = categoriesData.filter(
            (cat) => cat.parent_slug === null || cat.type === "mainCategory",
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
    }, []);

    // --- 2. Category Selection Logic ---
    const handleMainCategoryChange = (categoryId: string) => {
      const idStr = String(categoryId);

      const selectedCategory = categories.find(
        (cat) => String(cat.id) === idStr,
      );

      if (!selectedCategory) return;

      setSelectedMainCategoryId(idStr);
      setSelectedMainCategory(selectedCategory);

      const subCats = categories.filter(
        (cat) => cat.parent_slug === selectedCategory.slug,
      );
      setSubCategories(subCats);

      setValue("category_ids", [idStr], { shouldValidate: true });
    };

    // --- 3. Submit Handler ---
    useImperativeHandle(ref, () => ({
      async submit() {
        // 1. Manually trigger validation
        const isValid = await trigger();
        if (!isValid) {
          toast.error("Please correct the errors in the form.");
          return false;
        }

        const rawData = form.getValues();

        // Helper to extract the local phone digits
        const cleanPhone = (fullPhone: string, dialCode: string) => {
          if (!fullPhone) return "";
          const digits = fullPhone.replace(/\D/g, "");
          const codeDigits = dialCode.replace(/\D/g, "");
          return digits.startsWith(codeDigits)
            ? digits.slice(codeDigits.length)
            : digits;
        };

        // 2. Map data to API structure
        const submissionData: Record<string, unknown> = {
          name: rawData.name,
          email: rawData.email,
          website: normalizeUrl(rawData.website || ""),
          type: listingType,
          bio: rawData.description,
          description: rawData.description,
          business_reg_num: rawData.business_reg_num,
          primary_country_code: rawData.primary_country_code,
          primary_phone: cleanPhone(
            rawData.primary_phone,
            rawData.primary_country_code,
          ),
          secondary_country_code: rawData.secondary_country_code,
          secondary_phone: rawData.secondary_phone
            ? cleanPhone(
                rawData.secondary_phone,
                rawData.secondary_country_code || "",
              )
            : "",
          category_ids: rawData.category_ids.map((id) => Number(id)),
        };

        const token = localStorage.getItem("authToken");
        const API_URL = process.env.API_URL || "https://me-fie.co.uk";

        try {
          // UPDATED LOGIC HERE:
          // If listingSlug exists, use the /update endpoint with PATCH
          const endpoint = listingSlug
            ? `${API_URL}/api/listing/${listingSlug}/update`
            : `${API_URL}/api/listing/profile`;

          const method = listingSlug ? "PATCH" : "POST";

          const res = await fetch(endpoint, {
            method,
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(submissionData),
          });

          const json = await res.json();

          if (!res.ok) {
            console.error("API Error Response:", json);
            throw new Error(json.message || "Submission failed");
          }

          // Return result to parent to trigger setCurrentStep(currentStep + 1)
          return json.data || json;
        } catch (error) {
          const msg = error instanceof Error ? error.message : "Failed to save";
          toast.error(msg);
          return false;
        }
      },
    }));

    useEffect(() => {
      const loadExistingData = async () => {
        if (!listingSlug) return;
        try {
          const token = localStorage.getItem("authToken");
          const API_URL = process.env.API_URL || "https://me-fie.co.uk";
          const res = await fetch(
            `${API_URL}/api/listing/${listingSlug}/show`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                Accept: "application/json",
              },
            },
          );

          if (res.ok) {
            const json = await res.json();
            const d = json.data;

            // Reconstruct full strings so PhoneInput recognizes the country flag
            const fullPrimaryPhone = `${d.country_code || ""}${d.primary_phone || ""}`;
            const fullSecondaryPhone = d.secondary_phone
              ? `${d.secondary_country_code || ""}${d.secondary_phone}`
              : "";

            // Populate the form with data from the API
            reset({
              name: d.name || "",
              description: d.bio || d.description || "",
              email: d.email || "",
              website: d.website || "",
              primary_phone: fullPrimaryPhone,
              primary_country_code: d.primary_country_code || "+233",
              secondary_phone: fullSecondaryPhone,
              secondary_country_code: d.secondary_country_code || "+233",
              category_ids: d.categories?.map((c: any) => String(c.id)) || [],
              business_reg_num: d.business_reg_num || "",
              type: listingType,
            });

            // If categories exist, set the main category ID for the UI logic
            if (d.categories?.[0]) {
              const firstCat = d.categories[0];
              // If it's a subcategory, find the parent in our loaded categories
              const parentSlug = firstCat.parent_slug;
              if (parentSlug) {
                const parentCat = categories.find((c) => c.slug === parentSlug);
                if (parentCat) setSelectedMainCategoryId(String(parentCat.id));
              } else {
                setSelectedMainCategoryId(String(firstCat.id));
              }
            }
          }
        } catch (error) {
          console.error("Back navigation load failed", error);
        }
      };
      loadExistingData();
    }, [listingSlug, reset, listingType]);

    return (
      <div className="w-full max-w-5xl space-y-6 mx-auto p-0.5 lg:p-6">
        <div>
          <h2 className="text-2xl font-semibold">Basic Information</h2>
          <p className="text-sm text-gray-500 mt-1">
            {listingType === "business"
              ? "Tell us about your business. Your business page will not appear in search results until the information provided has been verified and approved by our moderators. Once it is approved, you'll receive instructions on how to go live."
              : listingType === "event"
                ? "Tell us about your event. Your event page will not appear in search results until the information provided has been verified and approved by our moderators. Once it is approved, you'll receive instructions on how to go live."
                : "Tell us about your community. Your community page will not appear in search results until the information provided has been verified and approved by our moderators. Once it is approved, you'll receive instructions on how to go live."}
          </p>
        </div>

        {/* Listing Type (Hidden) */}
        <div className="space-y-1 hidden">
          <label className="font-medium text-sm">Listing Type</label>
          <Input
            value={listingType}
            disabled
            className="h-10 rounded-lg border-gray-300 px-4 text-gray-800 bg-gray-50 cursor-not-allowed"
          />
        </div>

        {/* Name */}
        <div className="space-y-1">
          <label className="font-medium text-sm">
            {textConfig.nameLabel} <span className="text-red-500">*</span>
          </label>
          <Input
            {...register("name")}
            placeholder={textConfig.namePlaceholder}
            className={cn(
              "h-10 rounded-lg border-gray-300 px-4 text-gray-800 placeholder:text-gray-400 focus-visible:ring-2 focus-visible:ring-black",
              errors.name && "border-red-500 focus-visible:ring-red-500",
            )}
          />
          {errors.name && (
            <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>
          )}
        </div>

        {/* Email */}
        <div className="space-y-1">
          <label className="font-medium text-sm">
            Email Address <span className="text-red-500">*</span>
          </label>
          <Input
            {...register("email")}
            type="email"
            placeholder="example@domain.com"
            className={cn(
              "h-10 rounded-lg border-gray-300 px-4 text-gray-800 placeholder:text-gray-400 focus-visible:ring-2 focus-visible:ring-black",
              errors.email && "border-red-500 focus-visible:ring-red-500",
            )}
          />
          {errors.email && (
            <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
          )}
        </div>

        {/* Phones - With React International Phone */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1">
            <label className="font-medium text-sm">
              Primary Phone Number <span className="text-red-500">*</span>
            </label>
            <Controller
              name="primary_phone"
              control={control}
              render={({ field }) => (
                <PhoneInput
                  defaultCountry={userLocation?.country_code?.toLowerCase() || "gh"}
                  value={field.value}
                  onChange={(phone, meta) => {
                    field.onChange(phone);
                    const dialCode = meta.country.dialCode;
                    const formattedCode = dialCode.startsWith("+")
                      ? dialCode
                      : `+${dialCode}`;
                    setValue("primary_country_code", formattedCode, {
                      shouldValidate: true,
                    });
                  }}
                  inputClassName={cn(
                    "w-full h-10 rounded-r-lg border-gray-300 px-4",
                    errors.primary_phone && "border-red-500",
                  )}
                  className="w-full"
                  countrySelectorStyleProps={{
                    buttonStyle: {
                      paddingLeft: "12px",
                      paddingRight: "8px",
                      height: "36px",
                      borderTopLeftRadius: "0.5rem",
                      borderBottomLeftRadius: "0.5rem",
                      borderColor: "#d1d5db",
                    },
                  }}
                />
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
              Secondary Phone Number
            </label>
            <Controller
              name="secondary_phone"
              control={control}
              render={({ field }) => (
                <PhoneInput
                  defaultCountry={userLocation?.country_code?.toLowerCase() || "gh"}
                  value={field.value}
                  onChange={(phone, meta) => {
                    field.onChange(phone);
                    const dialCode = meta.country.dialCode;
                    const formattedCode = dialCode.startsWith("+")
                      ? dialCode
                      : `+${dialCode}`;
                    setValue("secondary_country_code", formattedCode, {
                      shouldValidate: true,
                    });
                  }}
                  inputClassName={cn(
                    "w-full h-10 rounded-r-lg border-gray-300 px-4",
                    errors.primary_phone && "border-red-500",
                  )}
                  className="w-full"
                  countrySelectorStyleProps={{
                    buttonStyle: {
                      paddingLeft: "12px",
                      paddingRight: "8px",
                      height: "36px",
                      borderTopLeftRadius: "0.5rem",
                      borderBottomLeftRadius: "0.5rem",
                      borderColor: "#d1d5db",
                    },
                  }}
                />
              )}
            />
          </div>
        </div>

        {/* Category Selection - With Updated Text */}
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="font-medium text-sm">
              {textConfig.label} Main Category{" "}
              <span className="text-red-500">*</span>
            </label>
            {loading ? (
              <div className="flex items-center space-x-2">
                <SpinnerGap className="h-4 w-4 animate-spin" />
                <span className="text-sm text-gray-500">
                  Loading categories...
                </span>
              </div>
            ) : error ? (
              <div className="text-red-500 text-sm">{error}</div>
            ) : (
              <SearchableSelect
                options={mainCategories.map((category) => ({
                  value: String(category.id),
                  label: category.name,
                }))}
                value={selectedMainCategoryId}
                onChange={handleMainCategoryChange}
                placeholder={
                  mainCategories.length === 0
                    ? "No categories available"
                    : `Select ${textConfig.label.toLowerCase()} main category`
                }
                searchPlaceholder="Search main category..."
                disabled={loading || mainCategories.length === 0}
                error={
                  errors.category_ids ? "Main category is required" : undefined
                }
              />
            )}
          </div>

          {/* Subcategory - Single Selection with SearchableSelect */}
          {selectedMainCategoryId && subCategories.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="font-medium text-sm">
                  Select {textConfig.label} Subcategory (Optional)
                </label>
              </div>

              <SearchableSelect
                options={subCategories.map((subcategory) => ({
                  value: String(subcategory.id),
                  label: subcategory.name,
                }))}
                value={
                  currentCategoryIds.find(
                    (id) =>
                      id !== String(selectedMainCategory?.id) &&
                      subCategories.some((sub) => String(sub.id) === id),
                  ) || ""
                }
                onChange={(subCategoryId) => {
                  // Clear existing subcategories and add the new one
                  const newIds = [selectedMainCategoryId];
                  if (subCategoryId) {
                    newIds.push(subCategoryId);
                  }
                  setValue("category_ids", newIds, { shouldValidate: true });
                }}
                placeholder="Select sub category (optional)"
                searchPlaceholder="Search sub category..."
              />

              {/* Updated Categories Summary Text */}
              <div className="flex flex-col gap-1 mt-2 p-3 bg-gray-50 rounded-md border border-gray-100">
                <p className="text-sm text-gray-700">
                  <span className="font-bold text-gray-900">
                    Main Category:
                  </span>{" "}
                  {selectedMainCategory?.name}
                </p>

                {currentCategoryIds.filter(
                  (id) => id !== String(selectedMainCategory?.id),
                ).length > 0 && (
                  <p className="text-sm text-gray-700 mt-1">
                    <span className="font-bold text-gray-900">
                      Subcategory:
                    </span>{" "}
                    {subCategories
                      .filter((sub) =>
                        currentCategoryIds.includes(String(sub.id)),
                      )
                      .map((sub) => sub.name)
                      .join(", ")}
                  </p>
                )}
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
              placeholder="www.example.com"
              className={cn(
                "h-10 rounded-lg border-gray-300 px-4 text-gray-800 placeholder:text-gray-400 focus-visible:ring-2 focus-visible:ring-black",
                errors.website && "border-red-500 focus-visible:ring-red-500",
              )}
            />
            {errors.website && (
              <p className="text-red-500 text-xs mt-1">
                {errors.website.message}
              </p>
            )}
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
            {textConfig.descriptionLabel}{" "}
            <span className="text-red-500">*</span>
          </label>
          <Textarea
            {...register("description")}
            placeholder={textConfig.descriptionPlaceholder}
            className={cn(
              "min-h-[140px] rounded-lg border-gray-300 p-4 text-gray-800 placeholder:text-gray-400 focus-visible:ring-2 focus-visible:ring-black resize-none",
              errors.description && "border-red-500 focus-visible:ring-red-500",
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
  },
);

BasicInformationForm.displayName = "BasicInformationForm";
