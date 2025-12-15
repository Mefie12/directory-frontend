/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Plus,
  Search,
  RefreshCcw,
  User,
  MapPin,
  Tag,
  Gem,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertTriangle,
  Phone,
  Mail,
  Globe,
  Facebook,
  Instagram,
  Twitter,
  Youtube,
  Linkedin,
  Eye,
} from "lucide-react";
import Image from "next/image";
import { useAuth } from "@/context/auth-context";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// --- Types ---
type TabType = "all" | "pending" | "flagged" | "categories";

interface Listing {
  id: string;
  slug: string;
  name: string;
  vendor: string;
  vendorAvatar?: string;
  category: string;
  location: string;
  type: string;
  approval: "Approved" | "Pending" | "Rejected" | "Suspended";
  image: string;
  images?: string[];
  plan?: "Basic" | "Pro" | "Premium";
  description?: string;
  userInfo?: {
    name: string;
    email?: string;
  };
  contactInfo?: {
    phone?: string;
    email?: string;
    website?: string;
    socials?: {
      facebook?: string;
      instagram?: string;
      twitter?: string;
      youtube?: string;
      linkedin?: string;
    };
  };
}

interface RawListing {
  id?: string | number;
  slug?: string;
  name?: string;
  title?: string;
  vendor?: string;
  business_name?: string;
  vendorAvatar?: string;
  vendor_image?: string;
  category?: string;
  location?: string;
  address?: string;
  type?: string;
  status?: string;
  image?: string;
  thumbnail?: string;
  plan?: string;
  description?: string;
  primary_phone?: string;
  email?: string;
  website?: string;
  socials?: any;
  user?: {
    id?: number;
    first_name?: string;
    last_name?: string;
    email?: string;
    name?: string;
  };
  categories?: Array<{
    id: number;
    name: string;
    parent_id: string | null;
    type: string;
    description: string;
  }>;
  images?: Array<{
    id: number;
    media: string;
    media_type: string;
    file_size: number;
    file_size_formatted: string;
    mime_type: string;
    is_compressed: number;
    compression_status: string;
    created_at: string;
    updated_at: string;
  }>;
  city?: string;
  country?: string;
}

interface ApiResponse {
  items?: RawListing[];
  data?: RawListing[];
  results?: RawListing[];
  listings?: RawListing[];
  last_page?: number;
  totalPages?: number;
  links?: {
    first: string | null;
    last: string | null;
    prev: string | null;
    next: string | null;
  };
  meta?: {
    path: string;
    per_page: number;
    next_cursor: string | null;
    prev_cursor: string | null;
    totalPages?: number;
    last_page?: number;
  };
}

// Category Types
interface Category {
  id: string;
  name: string;
  type: "subCategory" | "mainCategory" | "tag";
  parent_id: string | null;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

interface CategoryFormData {
  name: string;
  type: "subCategory" | "mainCategory" | "tag";
  description: string;
  is_main: boolean;
  parent_id: string | null;
}

const categoryApi = {
  getCategories: async (): Promise<Category[]> => {
    const token = localStorage.getItem("authToken");
    const API_URL = process.env.API_URL || "https://me-fie.co.uk";
    const response = await fetch(`${API_URL}/api/categories`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    if (!response.ok) throw new Error("Failed to fetch categories");
    const data = await response.json();
    return data.data || data.categories || [];
  },
  createCategory: async (categoryData: CategoryFormData): Promise<Category> => {
    const token = localStorage.getItem("authToken");
    const API_URL = process.env.API_URL || "https://me-fie.co.uk";
    const payload = {
      name: categoryData.name,
      type: categoryData.type,
      description: categoryData.description || "",
      parent_id: categoryData.is_main ? null : categoryData.parent_id,
    };
    const response = await fetch(`${API_URL}/api/categories`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to create category");
    }
    const data = await response.json();
    return data.data;
  },
  updateCategory: async (
    id: string,
    categoryData: CategoryFormData
  ): Promise<Category> => {
    const token = localStorage.getItem("authToken");
    const API_URL = process.env.API_URL || "https://me-fie.co.uk";
    const payload = {
      name: categoryData.name,
      type: categoryData.type,
      description: categoryData.description,
      parent_id: categoryData.is_main ? null : categoryData.parent_id,
    };
    const response = await fetch(`${API_URL}/api/categories/${id}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to update category");
    }
    const data = await response.json();
    return data.data;
  },
  deleteCategory: async (id: string): Promise<void> => {
    const token = localStorage.getItem("authToken");
    const API_URL = process.env.API_URL || "https://me-fie.co.uk";
    const response = await fetch(`${API_URL}/api/categories/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to delete category");
    }
  },
};

export default function Listings() {
  const { user: authUser, loading: authLoading } = useAuth();

  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [allData, setAllData] = useState<Listing[]>([]);
  const [displayData, setDisplayData] = useState<Listing[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [totalPages, setTotalPages] = useState(1);
  const [, setError] = useState<string | null>(null);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [selectedMainCategory, setSelectedMainCategory] =
    useState<Category | null>(null);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [isSavingCategory, setIsSavingCategory] = useState(false);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(
    null
  );
  const [categoryFormData, setCategoryFormData] = useState<CategoryFormData>({
    name: "",
    type: "subCategory",
    description: "",
    is_main: false,
    parent_id: null,
  });
  const [listingToDelete, setListingToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<string | null>(null);

  const itemsPerPage = 10;

  // --- Helpers ---
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  const extractListingsFromResponse = (data: unknown): Listing[] => {
    if (!data) return [];

    let rawItems: RawListing[] = [];

    if (Array.isArray(data)) {
      rawItems = data as RawListing[];
    } else {
      const payload = data as ApiResponse;
      if (Array.isArray(payload.items)) rawItems = payload.items;
      else if (Array.isArray(payload.data)) rawItems = payload.data;
      else if (Array.isArray(payload.results)) rawItems = payload.results;
      else if (Array.isArray(payload.listings)) rawItems = payload.listings;
      else if (Array.isArray(payload)) rawItems = payload;
    }

    const getImageUrl = (url: string | undefined): string => {
      if (!url) return "/images/placeholder-listing.png";
      if (url.startsWith("http://") || url.startsWith("https://")) {
        return url;
      }
      const API_URL = process.env.API_URL || "https://me-fie.co.uk";
      return `${API_URL}/${url.replace(/^\//, "")}`;
    };

    return rawItems.map((item) => {
      let vendorName = "Unknown Vendor";
      let userInfo: { name: string; email?: string } | undefined = undefined;

      if (item.user) {
        if (item.user.first_name && item.user.last_name) {
          vendorName = `${item.user.first_name} ${item.user.last_name}`;
          userInfo = { name: vendorName, email: item.user.email };
        } else if (item.user.name) {
          vendorName = item.user.name;
          userInfo = { name: vendorName, email: item.user.email };
        } else if (item.user.email) {
          vendorName = item.user.email.split("@")[0];
          userInfo = { name: vendorName, email: item.user.email };
        }
      } else if (item.vendor || item.business_name) {
        vendorName = item.vendor || item.business_name || "Unknown Vendor";
      }

      let imageUrl = "/images/placeholder-listing.png";
      if (item.images && item.images.length > 0) {
        const validImage = item.images.find(
          (img) => img.media && img.media !== "processing"
        );
        if (validImage) {
          imageUrl = getImageUrl(validImage.media);
        }
      } else if (item.image || item.thumbnail) {
        imageUrl = getImageUrl(item.image || item.thumbnail);
      }

      let category = "General";
      if (item.categories && item.categories.length > 0) {
        const mainCategories = item.categories.filter(
          (cat) => cat.parent_id === null
        );
        if (mainCategories.length > 0) {
          category = mainCategories.map((cat) => cat.name).join(", ");
        } else {
          category = item.categories[0].name;
        }
      } else if (item.category) {
        category = item.category;
      }

      let location = "Accra, Ghana";
      if (item.city && item.country) {
        location = `${item.city}, ${item.country}`;
      } else if (item.address) {
        location = item.address;
      } else if (item.location) {
        location = item.location;
      }

      const rawStatus = item.status?.toLowerCase() || "pending";
      let approval: "Approved" | "Pending" | "Rejected" | "Suspended" =
        "Pending";

      if (rawStatus === "approved" || rawStatus === "published")
        approval = "Approved";
      else if (rawStatus === "rejected") approval = "Rejected";
      else if (rawStatus === "suspended") approval = "Suspended";

      const socialsData = Array.isArray(item.socials)
        ? item.socials[0]
        : item.socials || {};

      return {
        id: item.id?.toString() || Math.random().toString(),
        slug: item.slug || item.id?.toString() || "no-slug",
        name: item.name || item.title || "Untitled Listing",
        vendor: vendorName,
        vendorAvatar: item.vendorAvatar || item.vendor_image || "",
        category: category,
        location: location,
        type: item.type || "business",
        approval: approval,
        image: imageUrl,
        images: item.images
          ? item.images
              .filter((img) => img.media && img.media !== "processing")
              .map((img) => getImageUrl(img.media))
          : imageUrl
          ? [imageUrl]
          : [],
        plan: (item.plan || "Basic") as "Basic" | "Pro" | "Premium",
        description: item.description || "No description provided.",
        userInfo: userInfo,
        contactInfo: {
          phone: item.primary_phone,
          email: item.email,
          website: item.website,
          socials: {
            facebook: socialsData?.facebook,
            instagram: socialsData?.instagram,
            twitter: socialsData?.twitter,
            youtube: socialsData?.youtube,
            linkedin: socialsData?.linkedin,
          },
        },
      };
    });
  };

  const mainCategories = allCategories.filter(
    (cat) => cat.type === "mainCategory" || cat.parent_id === null
  );

  const subCategories = allCategories.filter((cat) => {
    if (cat.type !== "subCategory") return false;
    if (!selectedMainCategory) return false;
    const catParentId = cat.parent_id?.toString();
    const selectedParentId = selectedMainCategory.id.toString();
    return catParentId === selectedParentId;
  });

  const loadCategories = useCallback(async () => {
    if (authLoading) return;
    setIsLoadingCategories(true);
    try {
      const categories = await categoryApi.getCategories();
      setAllCategories(categories);
      if (categories.length > 0 && !selectedMainCategory) {
        const firstMainCategory = categories.find(
          (cat) => cat.type === "mainCategory" || cat.parent_id === null
        );
        if (firstMainCategory) {
          setSelectedMainCategory(firstMainCategory);
        }
      }
    } catch (error) {
      toast.error("Failed to load categories");
      console.error("Error loading categories:", error);
    } finally {
      setIsLoadingCategories(false);
    }
  }, [authLoading, selectedMainCategory]);

  useEffect(() => {
    if (activeTab === "categories") {
      loadCategories();
    }
  }, [activeTab, loadCategories]);

  const handleAddCategoryClick = () => {
    setEditingCategoryId(null);
    setCategoryFormData({
      name: "",
      type: "subCategory",
      description: "",
      is_main: false,
      parent_id:
        selectedMainCategory?.id ||
        (mainCategories.length > 0 ? mainCategories[0].id : null),
    });
    setIsCategoryDialogOpen(true);
  };

  const handleEditCategoryClick = (category: Category) => {
    setEditingCategoryId(category.id);
    setCategoryFormData({
      name: category.name,
      type: category.type,
      description: category.description || "",
      is_main: category.type === "mainCategory",
      parent_id: category.parent_id,
    });
    setIsCategoryDialogOpen(true);
  };

  const handleDeleteCategoryClick = async (category: Category) => {
    if (!category.id) return;
    try {
      await categoryApi.deleteCategory(category.id);
      setAllCategories((prev) =>
        prev.filter((item) => item.id !== category.id)
      );
      toast.success("Category deleted successfully");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      toast.error(errorMessage);
      console.error("Delete error:", error);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!listingToDelete) return;
    setIsDeleting(true);

    try {
      const token = localStorage.getItem("authToken");
      const API_URL = process.env.API_URL || "https://me-fie.co.uk";

      const response = await fetch(
        `${API_URL}/api/listing/${listingToDelete}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );

      if (!response.ok) throw new Error("Failed to delete listing");

      setAllData((prev) =>
        prev.filter(
          (item) => item.slug !== listingToDelete && item.id !== listingToDelete
        )
      );

      if (selectedListing?.slug === listingToDelete) {
        setSelectedListing(null);
      }

      toast.success("Listing deleted successfully");
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete listing");
    } finally {
      setIsDeleting(false);
      setListingToDelete(null);
    }
  };

  const handleStatusUpdate = async (
    listingSlug: string,
    newStatus: "approved" | "rejected" | "suspended"
  ) => {
    setIsUpdatingStatus(listingSlug);

    try {
      const token = localStorage.getItem("authToken");
      const API_URL = process.env.API_URL || "https://me-fie.co.uk";

      const response = await fetch(
        `${API_URL}/api/listing/${listingSlug}/update_status`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to update status`);
      }

      setAllData((prev) =>
        prev.map((item) => {
          if (item.slug === listingSlug || item.id === listingSlug) {
            let uiStatus: "Approved" | "Rejected" | "Suspended" | "Pending" =
              "Pending";
            if (newStatus === "approved") uiStatus = "Approved";
            else if (newStatus === "rejected") uiStatus = "Rejected";
            else if (newStatus === "suspended") uiStatus = "Suspended";
            return { ...item, approval: uiStatus };
          }
          return item;
        })
      );
      toast.success(`Listing ${newStatus}`);
    } catch (error) {
      const msg =
        error instanceof Error ? error.message : "Failed to update status";
      toast.error(msg);
    } finally {
      setIsUpdatingStatus(null);
    }
  };

  const handleSaveCategory = async () => {
    if (!categoryFormData.name.trim()) {
      toast.error("Category name is required");
      return;
    }
    if (!categoryFormData.is_main && !categoryFormData.parent_id) {
      toast.error("Please select a parent category for the sub-category");
      return;
    }

    setIsSavingCategory(true);
    try {
      if (editingCategoryId) {
        const updatedCategory = await categoryApi.updateCategory(
          editingCategoryId,
          categoryFormData
        );
        setAllCategories((prev) =>
          prev.map((item) =>
            item.id === editingCategoryId ? updatedCategory : item
          )
        );
        toast.success("Category updated successfully");
      } else {
        const newCategory = await categoryApi.createCategory(categoryFormData);
        setAllCategories((prev) => [...prev, newCategory]);
        if (categoryFormData.is_main && mainCategories.length === 0) {
          setSelectedMainCategory(newCategory);
        }
        toast.success("Category created successfully");
      }
      setIsCategoryDialogOpen(false);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      toast.error(errorMessage);
      console.error("Save error:", error);
    } finally {
      setIsSavingCategory(false);
    }
  };

  const handleMainCategoryChange = (checked: boolean) => {
    setCategoryFormData((prev) => ({
      ...prev,
      is_main: checked,
      type: checked ? "mainCategory" : "subCategory",
      parent_id: checked
        ? null
        : selectedMainCategory?.id ||
          (mainCategories.length > 0 ? mainCategories[0].id : null),
    }));
  };

  const loadAllData = useCallback(async () => {
    if (authLoading || activeTab === "categories") return;
    if (!authUser) {
      setError("Authentication required to view listings");
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("authToken");
      const API_URL = process.env.API_URL || "https://me-fie.co.uk";

      const params = new URLSearchParams({
        page: currentPage.toString(),
        per_page: itemsPerPage.toString(),
      });

      if (search) params.append("search", search);

      if (activeTab === "pending") {
        params.set("status", "pending");
      } else if (activeTab === "flagged") {
        params.set("status", "suspended");
      } else {
        if (statusFilter !== "all") params.append("status", statusFilter);
      }

      if (typeFilter !== "all") params.append("type", typeFilter);

      const response = await fetch(
        `${API_URL}/api/listings?${params.toString()}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const json = await response.json();
      let listingsData: RawListing[] = [];
      if (json.data && Array.isArray(json.data)) {
        listingsData = json.data;
      } else if (Array.isArray(json)) {
        listingsData = json;
      } else if (json.items && Array.isArray(json.items)) {
        listingsData = json.items;
      } else if (json.listings && Array.isArray(json.listings)) {
        listingsData = json.listings;
      }

      const listings = extractListingsFromResponse(listingsData);
      setAllData(listings);

      const meta = json.meta || {};
      const total =
        meta.last_page ||
        meta.totalPages ||
        json.last_page ||
        json.totalPages ||
        1;
      setTotalPages(total);
    } catch (error) {
      console.error("Fetch Error:", error);
      setError(
        error instanceof Error ? error.message : "Failed to load listings"
      );
      setAllData([]);
    } finally {
      setIsLoading(false);
    }
  }, [
    authUser,
    authLoading,
    activeTab,
    currentPage,
    search,
    statusFilter,
    typeFilter,
  ]);

  useEffect(() => {
    if (activeTab === "categories") {
      loadCategories();
    } else {
      loadAllData();
    }
  }, [loadAllData, activeTab, loadCategories]);

  useEffect(() => {
    if (!categoryFormData.is_main && selectedMainCategory) {
      setCategoryFormData((prev) => ({
        ...prev,
        parent_id: selectedMainCategory.id,
      }));
    }
  }, [selectedMainCategory, categoryFormData.is_main]);

  useEffect(() => {
    if (activeTab === "categories") return;
    const safeAllData = Array.isArray(allData) ? allData : [];

    let filteredData = safeAllData;

    if (activeTab === "pending") {
      filteredData = safeAllData.filter((item) => item.approval === "Pending");
    } else if (activeTab === "flagged") {
      filteredData = safeAllData.filter(
        (item) => item.approval === "Suspended" || item.approval === "Rejected"
      );
    } else {
      if (statusFilter !== "all") {
        const status = statusFilter.toLowerCase();
        if (status === "published") {
          filteredData = filteredData.filter(
            (item) => item.approval === "Approved"
          );
        } else if (status === "pending") {
          filteredData = filteredData.filter(
            (item) => item.approval === "Pending"
          );
        } else if (status === "rejected") {
          filteredData = filteredData.filter(
            (item) => item.approval === "Rejected"
          );
        }
      }

      if (typeFilter !== "all") {
        filteredData = filteredData.filter(
          (item) => item.type.toLowerCase() === typeFilter.toLowerCase()
        );
      }
    }

    setDisplayData(filteredData);
  }, [allData, activeTab, statusFilter, typeFilter]);

  const handlePageChange = (page: number) => setCurrentPage(page);
  const handlePrevious = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };
  const handleNext = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const getStatusColor = (status: string) => {
    if (status === "Approved") return "bg-[#E9F5D6] text-[#5F8B0A]";
    if (status === "Pending") return "bg-yellow-100 text-yellow-700";
    if (status === "Suspended") return "bg-orange-100 text-orange-700";
    return "bg-red-100 text-red-800";
  };

  const getApprovalBadgeVariant = (status: string) => {
    switch (status) {
      case "Approved":
        return "default";
      case "Pending":
        return "secondary";
      case "Rejected":
        return "destructive";
      default:
        return "outline";
    }
  };

  const getPageNumbers = () => {
    const pages: number[] = [];
    const maxPagesToShow = 4;
    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) pages.push(1, 2, 3, 4);
      else if (currentPage >= totalPages - 2)
        pages.push(totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      else
        pages.push(
          currentPage - 1,
          currentPage,
          currentPage + 1,
          currentPage + 2
        );
    }
    return pages;
  };

  // --- SOCIAL ICON HELPER ---
  const SocialLink = ({
    href,
    icon: Icon,
    label,
  }: {
    href?: string;
    icon: any;
    label: string;
  }) => {
    if (!href) return null;
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 text-sm text-gray-600 hover:text-[#93C01F] transition-colors p-2 bg-gray-50 rounded-lg hover:bg-gray-100"
      >
        <Icon className="w-4 h-4" />
        <span className="truncate max-w-[150px]">{label}</span>
      </a>
    );
  };

  return (
    <div className="p-2 lg:p-6 space-y-6">
      <h1 className="text-3xl font-semibold">Listings</h1>

      {/* Tabs */}
      <div className="flex flex-wrap gap-3">
        {[
          { key: "all", label: "All" },
          { key: "pending", label: "Pending" },
          { key: "flagged", label: "Flagged" },
          { key: "categories", label: "Categories" },
        ].map((tab) => (
          <Button
            key={tab.key}
            variant={activeTab === tab.key ? "default" : "outline"}
            className={`rounded-lg shadow-none px-6 ${
              activeTab === tab.key
                ? "bg-[#93C01F] hover:bg-[#7ea919] text-white border-[#93C01F]"
                : "border-gray-200 text-gray-500"
            }`}
            onClick={() => {
              setActiveTab(tab.key as TabType);
              setCurrentPage(1);
            }}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {/* ... [Categories View remains unchanged] ... */}
      {activeTab === "categories" ? (
        <div className="space-y-6">
          <div className="flex justify-end">
            <Button
              className="bg-[#93C01F] hover:bg-[#7ea919] text-white gap-2"
              onClick={handleAddCategoryClick}
            >
              <Plus className="w-4 h-4" /> Add category
            </Button>
          </div>

          {isLoadingCategories ? (
            <div className="text-center py-8">Loading categories...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Main Categories Column */}
              <div className="border border-gray-200 rounded-xl bg-white p-6 h-fit">
                <h2 className="text-lg font-bold text-gray-900 mb-4">
                  Main Category
                </h2>
                <div className="space-y-3">
                  {mainCategories.map((cat) => (
                    <div
                      key={cat.id}
                      onClick={() => setSelectedMainCategory(cat)}
                      className={`p-4 rounded-lg cursor-pointer transition-colors border ${
                        selectedMainCategory?.id === cat.id
                          ? "bg-[#F4F9E8] border-[#93C01F] text-gray-900 font-medium"
                          : "bg-white border-gray-100 text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      {cat.name}
                    </div>
                  ))}
                  {mainCategories.length === 0 && (
                    <div className="text-center text-gray-500 py-4">
                      No main categories found
                    </div>
                  )}
                </div>
              </div>

              {/* Sub Categories Column */}
              <div className="border border-gray-200 rounded-xl bg-white p-6 h-fit min-h-[500px]">
                <h2 className="text-lg font-bold text-gray-900 mb-4">
                  Sub Categories
                </h2>

                <div className="mb-4">
                  <p className="text-sm text-gray-600">
                    Showing sub-categories for:{" "}
                    <span className="font-semibold">
                      {selectedMainCategory?.name ||
                        "No main category selected"}
                    </span>
                  </p>
                </div>

                <Button
                  variant="secondary"
                  onClick={handleAddCategoryClick}
                  className="w-full bg-gray-50 text-gray-600 border border-gray-100 mb-6 gap-2"
                >
                  <Plus className="w-4 h-4" /> Add sub category
                </Button>

                <div className="space-y-6">
                  {subCategories.map((sub) => (
                    <div
                      key={sub.id}
                      className="flex items-center justify-between group border-b border-gray-50 pb-4 last:border-0"
                    >
                      <span className="text-gray-700">{sub.name}</span>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          className="p-1 text-gray-400 hover:text-gray-600"
                          onClick={() => handleEditCategoryClick(sub)}
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          className="p-1 text-gray-400 hover:text-red-600"
                          onClick={() => handleDeleteCategoryClick(sub)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {subCategories.length === 0 && (
                    <div className="text-center text-gray-500 py-4">
                      {selectedMainCategory
                        ? "No sub categories found for this main category"
                        : "Select a main category to view sub categories"}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* --- LISTINGS VIEW --- */
        <>
          {/* Filters Section */}
          <div className="p-1 space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative w-full md:w-1/3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search listings..."
                  className="rounded-lg pl-9 shadow-none"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="flex gap-3">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="rounded-lg shadow-none w-[150px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="rounded-lg shadow-none w-[150px]">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="venue">Venue</SelectItem>
                    <SelectItem value="service">Service</SelectItem>
                    <SelectItem value="product">Product</SelectItem>
                    <SelectItem value="package">Package</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Table */}
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-200">
                    <TableHead className="font-semibold">
                      Listing Name
                    </TableHead>
                    <TableHead className="font-semibold">Vendor</TableHead>
                    <TableHead className="font-semibold">
                      Category & Location
                    </TableHead>
                    <TableHead className="font-semibold">Type</TableHead>
                    <TableHead className="font-semibold">
                      Approval Status
                    </TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="text-center py-8 text-gray-500"
                      >
                        Loading listings...
                      </TableCell>
                    </TableRow>
                  ) : displayData.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="text-center py-8 text-gray-500"
                      >
                        No listings found
                      </TableCell>
                    </TableRow>
                  ) : (
                    displayData.map((item) => (
                      <TableRow
                        key={item.id}
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => setSelectedListing(item)}
                      >
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage
                                src={item.image}
                                className="object-cover"
                              />
                              <AvatarFallback>
                                {getInitials(item.name)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{item.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>{item.vendor}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <span>{item.category}</span>
                            <span className="text-gray-400">•</span>
                            <span className="text-gray-600">
                              {item.location}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="capitalize">{item.type}</span>
                        </TableCell>

                        {/* --- STATIC APPROVAL STATUS BADGE --- */}
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Badge
                            variant={getApprovalBadgeVariant(item.approval)}
                            className={`flex w-fit items-center gap-1 ${
                              item.approval === "Approved"
                                ? "bg-green-600 hover:bg-green-700"
                                : ""
                            }`}
                          >
                            {item.approval}
                          </Badge>
                        </TableCell>

                        {/* --- ACTIONS MENU WITH ALL TOGGLES --- */}
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                              >
                                {isUpdatingStatus === item.slug ? (
                                  <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
                                ) : (
                                  <MoreHorizontal className="h-4 w-4" />
                                )}
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem
                                onClick={() => setSelectedListing(item)}
                                className="cursor-pointer"
                              >
                                <Eye className="mr-2 h-4 w-4" /> View Details
                              </DropdownMenuItem>

                              <DropdownMenuSeparator />
                              <DropdownMenuLabel>Status</DropdownMenuLabel>

                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleStatusUpdate(item.slug, "approved");
                                }}
                                className="text-green-600 cursor-pointer focus:text-green-700"
                              >
                                <CheckCircle2 className="mr-2 h-4 w-4" />{" "}
                                Approve
                              </DropdownMenuItem>

                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleStatusUpdate(item.slug, "suspended");
                                }}
                                className="text-orange-600 cursor-pointer focus:text-orange-700"
                              >
                                <AlertTriangle className="mr-2 h-4 w-4" />{" "}
                                Suspend
                              </DropdownMenuItem>

                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleStatusUpdate(item.slug, "rejected");
                                }}
                                className="text-red-600 cursor-pointer focus:text-red-700"
                              >
                                <XCircle className="mr-2 h-4 w-4" /> Reject
                              </DropdownMenuItem>

                              <DropdownMenuSeparator />

                              <DropdownMenuItem
                                className="text-red-600 focus:text-red-700 cursor-pointer"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setListingToDelete(item.slug || item.id);
                                }}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
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

            {/* Pagination */}
            {!isLoading && displayData.length > 0 && (
              <div className="flex items-center justify-between pt-4">
                <span className="text-sm text-gray-600">
                  Showing page {currentPage} of {totalPages}
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handlePrevious}
                    disabled={currentPage === 1}
                    className="h-8 w-8 border rounded-full"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </Button>
                  <div className="flex items-center gap-1 border rounded-full px-1">
                    {getPageNumbers().map((page) => (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "ghost"}
                        size="icon"
                        onClick={() => handlePageChange(page)}
                        className={`h-8 w-8 rounded-full ${
                          currentPage === page
                            ? "bg-[#93C01F] text-white hover:bg-[#93C01F]/90"
                            : "hover:bg-gray-100 text-gray-700"
                        }`}
                      >
                        {page}
                      </Button>
                    ))}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleNext}
                    disabled={currentPage === totalPages}
                    className="h-8 w-8 border rounded-full"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* --- ADD/EDIT CATEGORY DIALOG --- */}
      <Dialog
        open={isCategoryDialogOpen}
        onOpenChange={setIsCategoryDialogOpen}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              {editingCategoryId ? "Edit category" : "Adding a new category"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Category Name */}
            <div className="space-y-2">
              <Label htmlFor="cat_name" className="text-gray-600">
                Category name
              </Label>
              <Input
                id="cat_name"
                value={categoryFormData.name}
                onChange={(e) =>
                  setCategoryFormData((prev) => ({
                    ...prev,
                    name: e.target.value,
                  }))
                }
                placeholder="Category name"
              />
            </div>

            {/* Set as Main Category Checkbox */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="main_cat"
                checked={categoryFormData.is_main}
                onCheckedChange={handleMainCategoryChange}
                className="data-[state=checked]:bg-[#93C01F] data-[state=checked]:border-[#93C01F]"
              />
              <label
                htmlFor="main_cat"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Set as main category
              </label>
            </div>

            {/* Parent Category Selector (only show for sub-categories) */}
            {!categoryFormData.is_main && (
              <div className="space-y-2">
                <Label htmlFor="parent_category" className="text-gray-600">
                  Parent Category
                </Label>
                <Select
                  value={categoryFormData.parent_id || ""}
                  onValueChange={(value) =>
                    setCategoryFormData((prev) => ({
                      ...prev,
                      parent_id: value,
                    }))
                  }
                >
                  <SelectTrigger className="w-full text-gray-500">
                    <SelectValue placeholder="Select parent category" />
                  </SelectTrigger>
                  <SelectContent>
                    {mainCategories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                    {mainCategories.length === 0 && (
                      <SelectItem value="none" disabled>
                        No main categories available
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Category Type */}
            <div className="space-y-2">
              <Label htmlFor="cat_type" className="text-gray-600">
                Category type
              </Label>
              <Select
                value={categoryFormData.type}
                onValueChange={(
                  value: "subCategory" | "mainCategory" | "tag"
                ) =>
                  setCategoryFormData((prev) => ({
                    ...prev,
                    type: value,
                  }))
                }
              >
                <SelectTrigger className="w-full text-gray-500">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="subCategory">Sub Category</SelectItem>
                  <SelectItem value="mainCategory">Main Category</SelectItem>
                  <SelectItem value="tag">Tag</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="desc" className="text-gray-600">
                Description
              </Label>
              <Input
                id="desc"
                placeholder="Description"
                value={categoryFormData.description}
                onChange={(e) =>
                  setCategoryFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                className="placeholder:text-gray-400"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => setIsCategoryDialogOpen(false)}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700"
            >
              Cancel
            </Button>
            <Button
              className="bg-[#93C01F] hover:bg-[#7da815] text-white"
              onClick={handleSaveCategory}
              disabled={isSavingCategory}
            >
              {isSavingCategory
                ? "Saving..."
                : editingCategoryId
                ? "Save Changes"
                : "Add category"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!listingToDelete}
        onOpenChange={(open) => !open && setListingToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              listing and remove the data from your servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDeleteConfirm();
              }}
              className="bg-red-600 hover:bg-red-700"
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete Listing"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* --- SIDEBAR (SHEET) --- */}
      <Sheet
        open={!!selectedListing}
        onOpenChange={(open) => !open && setSelectedListing(null)}
      >
        <SheetContent className="w-[400px] sm:w-[540px] p-0 overflow-y-auto">
          {selectedListing && (
            <>
              {/* Header */}
              <div className="p-6 pb-2 border-b border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <div
                    className="flex items-center gap-2 text-sm text-gray-500 cursor-pointer hover:text-gray-900"
                    onClick={() => setSelectedListing(null)}
                  >
                    <ChevronLeft className="w-4 h-4" /> Listings
                  </div>
                </div>
                <SheetTitle className="text-2xl font-bold">
                  {selectedListing.name}
                </SheetTitle>
              </div>

              {/* Content */}
              <div className="p-6 space-y-8">
                {/* --- 1. Info Grid --- */}
                <div className="grid grid-cols-[24px_1fr_auto] gap-y-6 gap-x-3 items-center text-sm">
                  {/* Status */}
                  <RefreshCcw className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-500">Status</span>
                  <div className="justify-self-end">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                        selectedListing.approval
                      )}`}
                    >
                      {selectedListing.approval}
                    </span>
                  </div>

                  {/* Vendor */}
                  <User className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-500">Vendor</span>
                  <div className="justify-self-end flex items-center gap-2">
                    <Avatar className="h-5 w-5">
                      <AvatarImage
                        src={selectedListing.vendorAvatar}
                        className="object-cover"
                      />
                      <AvatarFallback className="text-[10px]">
                        {getInitials(selectedListing.vendor)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium text-gray-900">
                      {selectedListing.vendor}
                    </span>
                  </div>

                  {/* Location */}
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-500">Location</span>
                  <div className="justify-self-end font-medium text-gray-900">
                    {selectedListing.location}
                  </div>

                  {/* Type */}
                  <Tag className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-500">Type</span>
                  <div className="justify-self-end font-medium text-gray-900 capitalize">
                    {selectedListing.type}
                  </div>

                  {/* Plan */}
                  <Gem className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-500">Plan</span>
                  <div className="justify-self-end">
                    <span className="bg-[#548235] text-white px-2.5 py-0.5 rounded-full text-xs font-medium">
                      {selectedListing.plan || "Basic"}
                    </span>
                  </div>

                  {/* Owner */}
                  {selectedListing.userInfo && (
                    <>
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-500">Owner</span>
                      <div className="justify-self-end font-medium text-gray-900">
                        {selectedListing.userInfo.name}
                        {selectedListing.userInfo.email && (
                          <div className="text-xs text-gray-500">
                            {selectedListing.userInfo.email}
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>

                {/* --- 2. Description --- */}
                <div className="space-y-2">
                  <h3 className="font-semibold text-gray-900">
                    Listing Description
                  </h3>
                  <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-600 leading-relaxed border border-gray-100">
                    {selectedListing.description}
                  </div>
                </div>

                {/* --- 3. Tabs: Media & Contact Info --- */}
                <div>
                  <Tabs defaultValue="media" className="w-full">
                    <div className="border-b border-gray-200 w-full">
                      <TabsList className="w-full justify-start h-auto p-0 bg-transparent gap-4">
                        <TabsTrigger
                          value="media"
                          className="rounded-none border-b-2 border-transparent bg-transparent px-4 py-3 text-sm font-medium text-gray-500 shadow-none transition-none hover:text-gray-700 data-[state=active]:border-b-[#93C01F] data-[state=active]:bg-transparent data-[state=active]:text-[#93C01F] data-[state=active]:shadow-none"
                        >
                          Media
                        </TabsTrigger>
                        <TabsTrigger
                          value="contact"
                          className="rounded-none border-b-2 border-transparent bg-transparent px-4 py-3 text-sm font-medium text-gray-500 shadow-none transition-none hover:text-gray-700 data-[state=active]:border-b-[#93C01F] data-[state=active]:bg-transparent data-[state=active]:text-[#93C01F] data-[state=active]:shadow-none"
                        >
                          Contact Info
                        </TabsTrigger>
                      </TabsList>
                    </div>

                    <div className="mt-4">
                      {/* Media Tab */}
                      <TabsContent value="media" className="mt-0">
                        <div className="grid grid-cols-2 gap-4">
                          {selectedListing.images &&
                          selectedListing.images.length > 0 ? (
                            <>
                              <div className="aspect-square bg-gray-100 rounded-lg relative overflow-hidden">
                                <Image
                                  src={selectedListing.images[0]}
                                  alt="Cover"
                                  fill
                                  className="object-cover"
                                  sizes="(max-width: 768px) 100vw, 50vw"
                                  unoptimized={true}
                                />
                              </div>
                              {selectedListing.images
                                .slice(1, 4)
                                .map((img, index) => (
                                  <div
                                    key={index}
                                    className="aspect-square bg-gray-100 rounded-lg relative overflow-hidden"
                                  >
                                    <Image
                                      src={img}
                                      alt={`Media ${index + 2}`}
                                      fill
                                      className="object-cover"
                                      sizes="(max-width: 768px) 100vw, 50vw"
                                      unoptimized={true}
                                    />
                                  </div>
                                ))}
                            </>
                          ) : (
                            <div className="col-span-2 text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                              <p className="text-gray-400 text-sm">
                                No media uploaded
                              </p>
                            </div>
                          )}
                        </div>
                      </TabsContent>

                      {/* Contact Info Tab */}
                      <TabsContent value="contact" className="mt-0">
                        <div className="space-y-4 bg-gray-50 p-4 rounded-lg border border-gray-100">
                          {selectedListing.contactInfo ? (
                            <>
                              {selectedListing.contactInfo.phone && (
                                <div className="flex items-center gap-3">
                                  <Phone className="w-4 h-4 text-gray-500" />
                                  <span className="text-sm text-gray-700">
                                    {selectedListing.contactInfo.phone}
                                  </span>
                                </div>
                              )}
                              {selectedListing.contactInfo.email && (
                                <div className="flex items-center gap-3">
                                  <Mail className="w-4 h-4 text-gray-500" />
                                  <span className="text-sm text-gray-700">
                                    {selectedListing.contactInfo.email}
                                  </span>
                                </div>
                              )}
                              {selectedListing.contactInfo.website && (
                                <div className="flex items-center gap-3">
                                  <Globe className="w-4 h-4 text-gray-500" />
                                  <a
                                    href={selectedListing.contactInfo.website}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-sm text-blue-600 hover:underline"
                                  >
                                    Website
                                  </a>
                                </div>
                              )}

                              {/* Socials */}
                              <div className="pt-2 border-t border-gray-200 mt-2">
                                <p className="text-xs font-semibold text-gray-500 mb-2 uppercase">
                                  Social Links
                                </p>
                                <div className="grid grid-cols-2 gap-2">
                                  <SocialLink
                                    href={
                                      selectedListing.contactInfo.socials
                                        ?.facebook
                                    }
                                    icon={Facebook}
                                    label="Facebook"
                                  />
                                  <SocialLink
                                    href={
                                      selectedListing.contactInfo.socials
                                        ?.instagram
                                    }
                                    icon={Instagram}
                                    label="Instagram"
                                  />
                                  <SocialLink
                                    href={
                                      selectedListing.contactInfo.socials
                                        ?.twitter
                                    }
                                    icon={Twitter}
                                    label="Twitter"
                                  />
                                  <SocialLink
                                    href={
                                      selectedListing.contactInfo.socials
                                        ?.youtube
                                    }
                                    icon={Youtube}
                                    label="YouTube"
                                  />
                                  <SocialLink
                                    href={
                                      selectedListing.contactInfo.socials
                                        ?.linkedin
                                    }
                                    icon={Linkedin}
                                    label="LinkedIn"
                                  />
                                </div>
                              </div>
                            </>
                          ) : (
                            <div className="text-center py-4 text-gray-400 text-sm">
                              No contact information available
                            </div>
                          )}
                        </div>
                      </TabsContent>
                    </div>
                  </Tabs>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
